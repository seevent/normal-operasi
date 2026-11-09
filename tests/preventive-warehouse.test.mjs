import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  groupAssets,
  groupAssetsByPlace,
  groupWarehouse,
  isInWarehouse,
  isPlaceAssetType,
  summarize,
} from '../src/lib/utils/preventiveGrouping.ts';

const A = (equipmentNumber, name, assetType, locationGroup, extra = {}) => ({
  equipmentNumber, name, assetType, locationGroup, locationOverride: null, periods: ['D', 'W', 'M'], active: true, ...extra,
});

// Data sungguhan: dua aset dipindah ke gudang lewat location_override.
const assets = [
  A('ESE061000074772', 'Walk Through Metal Detector PSCP 2D No.1', 'WALK THROUGH METAL DETECTOR', 'PSCP D'),
  A('ESE061000074775', 'Walk Through Metal Detector PSCP 2D No.5', 'WALK THROUGH METAL DETECTOR', 'PSCP D', { locationOverride: 'Gudang' }),
  A('ESE121000074827', 'Access Control System Pintu Avio D1', 'ACCESS CONTROL SYSTEM', 'Zona D'),
  A('ESE121000074892', 'Access Control System Pintu Lift Difable E', 'ACCESS CONTROL SYSTEM', 'Zona E', { locationOverride: 'Gudang' }),
  A('ESE121000074893', 'Access Control System Pintu Lain E', 'ACCESS CONTROL SYSTEM', 'Zona E'),
  A('ESE051000074899', 'HHMD gudang nonaktif', 'HANDHELD METAL DETECTOR', 'PSCP D', { locationOverride: 'Gudang', active: false }),
];
const idle = () => 'idle';
const all = { query: '', filter: 'all' };

test('isInWarehouse: lokasi efektif "Gudang" (huruf besar/kecil, spasi diabaikan)', () => {
  assert.equal(isInWarehouse(assets[1]), true);
  assert.equal(isInWarehouse({ locationGroup: 'PSCP D', locationOverride: '  gudang ' }), true);
  assert.equal(isInWarehouse({ locationGroup: 'Gudang', locationOverride: null }), true);
  assert.equal(isInWarehouse(assets[0]), false);
});

test('summarize: aset di gudang tidak dihitung untuk preventif', () => {
  assert.equal(summarize(assets, 'DAILY', idle).total, 3);
});

test('kartu tempat dan kartu Access Control tidak memuat aset gudang', () => {
  const places = groupAssetsByPlace(assets, 'DAILY', idle, all);
  assert.deepEqual(places.map((p) => p.location), ['PSCP D']);
  assert.equal(places[0].total, 1);
  const acs = groupAssets(assets.filter((a) => !isPlaceAssetType(a.assetType)), 'DAILY', idle, all);
  assert.equal(acs[0].total, 2);
  assert.deepEqual(acs[0].locations.map((l) => l.location), ['Zona D', 'Zona E']);
  assert.ok(!acs[0].locations.some((l) => l.assets.some((a) => a.equipmentNumber === 'ESE121000074892')));
});

test('groupWarehouse: aset gudang aktif per jenis, ikut pencarian', () => {
  const w = groupWarehouse(assets, 'DAILY', all);
  assert.equal(w.total, 2);
  assert.deepEqual(w.types.map((t) => t.assetType), ['WALK THROUGH METAL DETECTOR', 'ACCESS CONTROL SYSTEM']);
  assert.equal(groupWarehouse(assets, 'DAILY', { query: 'lift', filter: 'all' }).types.length, 1);
  assert.equal(groupWarehouse(assets, 'DAILY', { query: 'tidak ada', filter: 'all' }).types.length, 0);
  // Filter status (Belum/Gagal/Tersimpan) hanya untuk aset yang dihitung, jadi gudang disembunyikan.
  assert.equal(groupWarehouse(assets, 'DAILY', { query: '', filter: 'belum' }).types.length, 0);
});

test('TabPreventive menampilkan area gudang dengan warna berbeda', () => {
  const tab = readFileSync(new URL('../src/components/features/TabPreventive.tsx', import.meta.url), 'utf8');
  assert.match(tab, /groupWarehouse\(/);
  assert.match(tab, /PreventiveWarehouseCard/);
});
