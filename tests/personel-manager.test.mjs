import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('Data: Personel API dan OM/IAS dilebur menjadi satu sub-tab "Personel"', () => {
  const src = read('src/components/features/TabData.tsx');
  assert.match(src, /\{ id: 'personel', label: 'Personel' \}/);
  assert.doesNotMatch(src, /id: 'api_t2'/);
  assert.doesNotMatch(src, /id: 'om_ias_t2'/);
  assert.match(src, /<PersonelManager\s*\/>/);
});

test('PersonelManager tetap memisahkan unit API dan OM/IAS dengan jabatan dan unit_kerja masing-masing', () => {
  const src = read('src/components/features/personel/PersonelManager.tsx');
  assert.match(src, /unitName: 'API T2'/);
  assert.match(src, /unitName: 'OM\/IAS T2'/);
  assert.match(src, /\['Supervisor', 'Engineer', 'Technician'\]/);
  assert.match(src, /\['Supervisor', 'Teknisi', 'Pembantu Teknisi'\]/);
  assert.match(src, /savePersonelToSupabase\(rows, unit\.unitName, sources\[unit\.key\], confirmPersonelDelete\)/);
});

test('PersonelSection: key stabil, tidak menyimpan _k, dan melaporkan kegagalan simpan', () => {
  const src = read('src/components/features/personel/PersonelSection.tsx');
  assert.match(src, /key=\{row\._k\}/);
  assert.doesNotMatch(src, /key=\{index\}/);
  assert.match(src, /toRecords/);
  assert.match(src, /sayPet\(.*'error'\)/);
});
