import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  buildTipLocations,
  countCheckedVisible,
  tipProgressPercent,
  visibleTipCategories,
} from '../src/lib/utils/tipEquipment.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const MASTER = [
  { type: 'location', title: 'PSCP D', categories: [
    { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Rapiscan 620DV (No1)', 'X-Ray Smith Heiman HS 6040-2is (No2)'] },
    { title: 'B. WTMD', summaryKey: 'WTMD', items: ['WTMD (No1)'] },
  ] },
  { type: 'group', title: 'HBS', locations: [
    { title: 'HBSCP', categories: [{ title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Rapiscan 628DV (1.1)'] }] },
  ] },
  { type: 'location', title: 'SSCP E', categories: [
    { title: 'A. X-RAY', summaryKey: 'X-RAY', items: ['X-Ray Smith Heiman HS 6040-2is', 'X-Ray Cadangan'] },
  ] },
  { type: 'access_control', title: 'ACCESS', terminals: [] },
];

test('buildTipLocations: X-Ray per lokasi, kunci aturan lama, nama lengkap, kembar sekali', () => {
  const locs = buildTipLocations(MASTER);
  assert.deepEqual(locs.map((l) => l.id), ['pscp_d', 'hbscp', 'sscp_e']);
  assert.deepEqual(locs[0].units, [
    { key: 'pscp_d-No1', label: 'No1', name: 'X-Ray Rapiscan 620DV (No1)' },
    { key: 'pscp_d-No2', label: 'No2', name: 'X-Ray Smith Heiman HS 6040-2is (No2)' },
  ]);
  assert.deepEqual(locs[1].units.map((u) => u.key), ['hbscp-1.1']);
  // Dua item tanpa kurung -> kunci sama (aturan lama) -> satu unit saja.
  assert.deepEqual(locs[2].units.map((u) => u.key), ['sscp_e-No1']);
});

test('buildTipLocations: master rusak atau kosong tidak error', () => {
  assert.deepEqual(buildTipLocations(null), []);
  assert.deepEqual(buildTipLocations(undefined), []);
  assert.deepEqual(buildTipLocations([{ type: 'location' }, { type: 'group' }, null, 'x']), []);
  assert.deepEqual(buildTipLocations([{ type: 'location', title: 'X', categories: [{ summaryKey: 'X-RAY', items: [] }] }]), []);
});

test('visibleTipCategories: unit tersembunyi dibuang, lokasi kosong dibuang, kunci asing diabaikan', () => {
  const locs = buildTipLocations(MASTER);
  const cats = visibleTipCategories(locs, ['pscp_d-No2', 'tidak-ada', 'hbscp-1.1']);
  assert.deepEqual(cats, [
    { id: 'pscp_d', name: 'PSCP D', items: ['No1'] },
    { id: 'sscp_e', name: 'SSCP E', items: ['No1'] },
  ]);
  assert.deepEqual(visibleTipCategories(locs, []).map((c) => c.items.length), [2, 1, 1]);
});

test('countCheckedVisible & tipProgressPercent', () => {
  const cats = [{ id: 'pscp_d', items: ['No1'] }];
  const data = { 'pscp_d-No1': { checked: true }, 'pscp_d-No2': { checked: true }, 'hbscp-1.1': { checked: false } };
  assert.equal(countCheckedVisible(data, cats), 1);
  assert.equal(countCheckedVisible({}, cats), 0);
  assert.equal(tipProgressPercent(0, 0), 0);
  assert.equal(tipProgressPercent(19, 38), 50);
  assert.equal(tipProgressPercent(1, 3), 33);
});

test('Tab TIP memakai daftar yang disaring Config TIP; kode daftar TIP lama dihapus', () => {
  const tab = read('src/components/features/TabTip.tsx');
  assert.match(tab, /visibleTipCategories\(buildTipLocations\(checklistDataMaster\), tipHiddenKeys\)/);
  assert.match(tab, /countCheckedVisible\(/);
  assert.match(tab, /tipProgressPercent\(/);
  // Tidak lagi menghitung semua kunci tercentang (termasuk yang tersembunyi).
  assert.doesNotMatch(tab, /Object\.values\(tipDataState\)\.filter/);

  const store = read('src/store/useMasterDataStore.ts');
  assert.match(store, /case 'master_tip_hidden':/);
  assert.match(store, /saveConfigToSupabase\('master_tip_hidden', keys\)/);
  assert.doesNotMatch(store, /tipLeftCol|tipRightCol|master_tip_left|master_tip_right/);
  assert.doesNotMatch(read('src/lib/data/masterData.ts'), /DEFAULT_TIP_LEFT_COL|DEFAULT_TIP_RIGHT_COL/);
});

test('Tab Data: sub-tab "Config TIP" berisi daftar peralatan di atas data TIP tersimpan', () => {
  const data = read('src/components/features/TabData.tsx');
  assert.match(data, /\{ id: 'tip_data_manager', label: 'Config TIP' \}/);
  assert.doesNotMatch(data, /Data TIP Tersimpan'/);
  const branch = data.match(/activeSubTab === 'tip_data_manager' \? \([\s\S]*?\) : /)?.[0] ?? '';
  const cfg = branch.indexOf('<TipEquipmentConfig />');
  const saved = branch.indexOf('<TipDataManager />');
  assert.ok(cfg > 0 && saved > cfg, 'TipEquipmentConfig sebelum TipDataManager');

  const comp = read('src/components/features/tip-config/TipEquipmentConfig.tsx');
  assert.match(comp, /buildTipLocations\(checklistDataMaster\)/);
  assert.match(comp, /setTipHiddenKeys\(/);
  assert.match(comp, /tampil di tab TIP/);
  assert.match(comp, /Gagal menyimpan/);
});
