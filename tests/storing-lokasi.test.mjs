import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLocationEquipmentMap, deriveStoringEquipment, sortStoringEquipment } from '../src/lib/utils/storingLokasi.ts';

const row = (lokasi, jenis) => ({ lokasi: { nama: lokasi }, tipe_peralatan: { nama: `${jenis} X`, jenis_peralatan: { nama: jenis } } });
const data = [
  row('PSCP D', 'WTMD'), row('PSCP D', 'X-Ray'), row('PSCP D', 'X-Ray'), row('PSCP D', 'ETD'),
  row('PSCP E', 'X-Ray'), row('PSCP E', 'Body Scanner'),
  row('HBSCP', 'X-Ray'),
  row('Rampout D', 'Access Control'), row('Mirror', 'Mirroring X-Ray'),
  { lokasi: null, tipe_peralatan: null },
];

test('Peta lokasi: peralatan unik per lokasi, berurutan, tanpa Access Control dan Mirroring X-Ray', () => {
  const map = buildLocationEquipmentMap(data);
  assert.deepEqual(Array.from(map.keys()), ['HBSCP', 'PSCP D', 'PSCP E']);
  assert.deepEqual(map.get('PSCP D'), ['X-Ray', 'WTMD', 'ETD']);
  assert.deepEqual(map.get('PSCP E'), ['X-Ray', 'Body Scanner']);
  assert.ok(!map.has('Rampout D') && !map.has('Mirror'));
});

test('Memilih lokasi otomatis menghasilkan gabungan peralatan di lokasi itu', () => {
  const map = buildLocationEquipmentMap(data);
  assert.deepEqual(deriveStoringEquipment([], map), []);
  assert.deepEqual(deriveStoringEquipment(['PSCP D'], map), ['X-Ray', 'WTMD', 'ETD']);
  assert.deepEqual(deriveStoringEquipment(['PSCP D', 'PSCP E'], map), ['X-Ray', 'WTMD', 'Body Scanner', 'ETD']);
  assert.deepEqual(deriveStoringEquipment(['PSCP D', 'Tidak Ada'], map), ['X-Ray', 'WTMD', 'ETD']);
});

test('Peralatan yang dikecualikan pengguna tidak ikut dicentang', () => {
  const map = buildLocationEquipmentMap(data);
  assert.deepEqual(deriveStoringEquipment(['PSCP D', 'PSCP E'], map, ['ETD', 'WTMD']), ['X-Ray', 'Body Scanner']);
});

test('Urutan peralatan baku, yang tak dikenal di akhir', () => {
  assert.deepEqual(sortStoringEquipment(['ETD', 'ATRS', 'WTMD', 'X-Ray', 'Body Scanner']), ['X-Ray', 'WTMD', 'Body Scanner', 'ETD', 'ATRS']);
});
