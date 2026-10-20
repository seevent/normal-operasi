import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assetsForPeriod,
  effectiveLocation,
  groupAssets,
  summarize,
  UNMAPPED_LOCATION,
} from '../src/lib/utils/preventiveGrouping.ts';
import { PREVENTIVE_ASSET_TYPES } from '../src/lib/data/preventiveTypes.ts';

const A = (equipmentNumber, name, assetType, locationGroup, extra = {}) => ({
  equipmentNumber,
  name,
  assetType,
  locationGroup,
  locationOverride: null,
  periods: ['D', 'W', 'M'],
  active: true,
  ...extra,
});

const assets = [
  A('ESE011000074751', 'X-Ray Kabin PSCP D No.4', 'X-RAY KABIN', 'PSCP D'),
  A('ESE011000074748', 'X-Ray Kabin PSCP D No.1', 'X-RAY KABIN', 'PSCP D'),
  A('ESE011000074750', 'X-Ray Kabin PSCP D No.10', 'X-RAY KABIN', 'PSCP D'),
  A('ESE011000074758', 'X-Ray Kabin SSCP E', 'X-RAY KABIN', 'SSCP E'),
  A('ESE121000074896', 'Access Control System', 'ACCESS CONTROL SYSTEM', UNMAPPED_LOCATION),
  A('ESE121000074827', 'Access Control System Pintu Avio D1', 'ACCESS CONTROL SYSTEM', 'Zona D'),
  A('ESE091000074899', 'ETD Desktop PSCP Umrah', 'ETD DESKTOP', 'PSCP Umrah', { periods: ['D', 'W', 'M', '4M', '1Y', '2Y'] }),
  A('ESE051000074801', 'Handheld Metal Detector PSCP 2D No.1', 'HANDHELD METAL DETECTOR', 'PSCP D', { periods: ['D', 'W', 'M', '1Y'] }),
  A('ESE051000074899', 'Handheld Metal Detector nonaktif', 'HANDHELD METAL DETECTOR', 'PSCP D', { active: false }),
  A('ESE051000074802', 'Handheld Metal Detector hanya tahunan', 'HANDHELD METAL DETECTOR', 'PSCP D', { periods: ['1Y'] }),
];

const statusMap = (m) => (a) => m[a.equipmentNumber] ?? 'idle';

test('urutan tipe mengikuti daftar tetap dari permintaan (bukan abjad data)', () => {
  assert.deepEqual([...PREVENTIVE_ASSET_TYPES], [
    'ACCESS CONTROL SYSTEM',
    'BODY SCANNER',
    'ETD DESKTOP',
    'HANDHELD METAL DETECTOR',
    'WALK THROUGH METAL DETECTOR',
    'X-RAY BAGASI',
    'X-RAY KABIN',
  ]);
  const groups = groupAssets(assets, 'DAILY', statusMap({}), { query: '', filter: 'all' });
  assert.deepEqual(groups.map((g) => g.assetType), ['ACCESS CONTROL SYSTEM', 'ETD DESKTOP', 'HANDHELD METAL DETECTOR', 'X-RAY KABIN']);
});

test('assetsForPeriod hanya aset aktif yang terjadwal pada periode itu', () => {
  const daily = assetsForPeriod(assets, 'DAILY').map((a) => a.equipmentNumber);
  assert.ok(!daily.includes('ESE051000074899'), 'aset nonaktif tidak tampil');
  assert.ok(!daily.includes('ESE051000074802'), 'aset tanpa jadwal D tidak tampil di Daily');
  assert.equal(daily.length, 8);
});

test('aset dalam satu lokasi diurutkan alami (No.2 sebelum No.10)', () => {
  const g = groupAssets(assets, 'DAILY', statusMap({}), { query: '', filter: 'all' }).find((x) => x.assetType === 'X-RAY KABIN');
  const pscpD = g.locations.find((l) => l.location === 'PSCP D');
  assert.deepEqual(pscpD.assets.map((a) => a.name), ['X-Ray Kabin PSCP D No.1', 'X-Ray Kabin PSCP D No.4', 'X-Ray Kabin PSCP D No.10']);
});

test('lokasi diurutkan alami dan "Lokasi belum terpetakan" selalu paling bawah', () => {
  const g = groupAssets(assets, 'DAILY', statusMap({}), { query: '', filter: 'all' }).find((x) => x.assetType === 'ACCESS CONTROL SYSTEM');
  assert.deepEqual(g.locations.map((l) => l.location), ['Zona D', UNMAPPED_LOCATION]);
});

test('koreksi lokasi (override) menang atas hasil parse', () => {
  const a = A('ESE121000074896', 'Access Control System', 'ACCESS CONTROL SYSTEM', UNMAPPED_LOCATION, { locationOverride: 'Zona E' });
  assert.equal(effectiveLocation(a), 'Zona E');
  assert.equal(effectiveLocation({ ...a, locationOverride: '  ' }), UNMAPPED_LOCATION);
  assert.equal(effectiveLocation({ ...a, locationOverride: null }), UNMAPPED_LOCATION);
});

test('pencarian cocok pada nomor equipment (dengan/tanpa ESE), nama, dan lokasi; tidak peka huruf besar', () => {
  const find = (query) =>
    groupAssets(assets, 'DAILY', statusMap({}), { query, filter: 'all' }).flatMap((g) => g.locations.flatMap((l) => l.assets.map((a) => a.equipmentNumber)));
  assert.deepEqual(find('ese011000074758'), ['ESE011000074758']);
  assert.deepEqual(find('011000074758'), ['ESE011000074758']);
  assert.deepEqual(find('sscp e'), ['ESE011000074758']);
  assert.deepEqual(find('  umrah '), ['ESE091000074899']);
  assert.deepEqual(find('tidak-ada'), []);
});

test('filter status: belum = belum tersimpan (idle/uploading/failed), gagal, tersimpan', () => {
  const st = statusMap({ ESE011000074748: 'saved', ESE011000074751: 'failed', ESE011000074750: 'uploading' });
  const ids = (filter) =>
    groupAssets(assets, 'DAILY', st, { query: '', filter })
      .filter((g) => g.assetType === 'X-RAY KABIN')
      .flatMap((g) => g.locations.flatMap((l) => l.assets.map((a) => a.equipmentNumber)))
      .sort();
  assert.deepEqual(ids('tersimpan'), ['ESE011000074748']);
  assert.deepEqual(ids('gagal'), ['ESE011000074751']);
  assert.deepEqual(ids('belum'), ['ESE011000074750', 'ESE011000074751', 'ESE011000074758']);
});

test('hitungan tersimpan/total per tipe dan lokasi tidak ikut berubah oleh pencarian atau filter', () => {
  const st = statusMap({ ESE011000074748: 'saved', ESE011000074758: 'saved' });
  const g = groupAssets(assets, 'DAILY', st, { query: 'no.4', filter: 'belum' }).find((x) => x.assetType === 'X-RAY KABIN');
  assert.equal(g.total, 4);
  assert.equal(g.saved, 2);
  assert.equal(g.locations.length, 1);
  const pscpD = g.locations[0];
  assert.equal(pscpD.total, 3);
  assert.equal(pscpD.saved, 1);
  assert.deepEqual(pscpD.assets.map((a) => a.equipmentNumber), ['ESE011000074751']);
});

test('grup yang tidak punya aset terlihat disembunyikan', () => {
  const groups = groupAssets(assets, 'DAILY', statusMap({}), { query: 'umrah', filter: 'all' });
  assert.deepEqual(groups.map((g) => g.assetType), ['ETD DESKTOP']);
});

test('summarize menghitung ringkasan keseluruhan untuk progress bar', () => {
  const st = statusMap({ ESE011000074748: 'saved', ESE011000074751: 'failed', ESE011000074750: 'uploading', ESE121000074827: 'saved' });
  assert.deepEqual(summarize(assets, 'DAILY', st), { total: 8, saved: 2, failed: 1, uploading: 1, pending: 4 });
});

test('Weekly dan Monthly memakai semua aset aktif yang terjadwal W/M', () => {
  assert.equal(assetsForPeriod(assets, 'WEEKLY').length, 8);
  assert.equal(assetsForPeriod(assets, 'MONTHLY').length, 8);
});
