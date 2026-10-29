import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  canonicalPlace,
  groupAssets,
  groupAssetsByPlace,
  isPlaceAssetType,
  UNMAPPED_LOCATION,
} from '../src/lib/utils/preventiveGrouping.ts';

const A = (equipmentNumber, name, assetType, locationGroup, extra = {}) => ({
  equipmentNumber, name, assetType, locationGroup, locationOverride: null, periods: ['D', 'W', 'M'], active: true, ...extra,
});

// Cuplikan data PRIMA sungguhan: nama memakai "2D/2E/2F", lokasi sudah "PSCP D".
const assets = [
  A('ESE071000074793', 'Body Scanner PSCP 2D No.2', 'BODY SCANNER', 'PSCP D'),
  A('ESE091000074897', 'ETD Desktop PSCP 2D', 'ETD DESKTOP', 'PSCP D'),
  A('ESE051000074801', 'Handheld Metal Detector PSCP 2D No.1', 'HANDHELD METAL DETECTOR', 'PSCP D'),
  A('ESE061000074772', 'Walk Through Metal Detector PSCP 2D No.1', 'WALK THROUGH METAL DETECTOR', 'PSCP D'),
  A('ESE011000074749', 'X-Ray Kabin PSCP D No.2', 'X-RAY KABIN', 'PSCP D'),
  A('ESE011000074748', 'X-Ray Kabin PSCP D No.1', 'X-RAY KABIN', 'PSCP D'),
  // Bila sinkron PRIMA kelak mengirim lokasi bentuk "2D", tetap satu tempat.
  A('ESE061000099999', 'Walk Through Metal Detector PSCP 2D No.9', 'WALK THROUGH METAL DETECTOR', 'PSCP 2D'),
  A('ESE011000074753', 'X-Ray Kabin PSCP E No.1', 'X-RAY KABIN', 'PSCP E'),
  A('ESE051000074807', 'Handheld Metal Detector PSCP 2E No.1', 'HANDHELD METAL DETECTOR', 'PSCP 2E'),
  A('ESE061000074781', 'Walk Through Metal Detector SSCP 2E', 'WALK THROUGH METAL DETECTOR', 'SSCP E'),
  A('ESE051000074806', 'Handheld Metal Detector Transfer Desk 2D', 'HANDHELD METAL DETECTOR', 'Transfer Desk 2D'),
  A('ESE021000074730', 'X-Ray Bagasi HBSCP 1.1', 'X-RAY BAGASI', 'HBSCP'),
  A('ESE091000074900', 'ETD Desktop HBSCP 2.5', 'ETD DESKTOP', 'HBSCP'),
  A('ESE011000074771', 'X-Ray Kabin Arrival F', 'X-RAY KABIN', 'Arrival F'),
  A('ESE011000074764', 'X-Ray Kabin PSCP Umrah No.1', 'X-RAY KABIN', 'PSCP Umrah'),
  A('ESE021000074746', 'X-Ray Bagasi Red Lane No.1', 'X-RAY BAGASI', 'Red Lane'),
  A('ESE121000074827', 'Access Control System Pintu Avio D1', 'ACCESS CONTROL SYSTEM', 'Zona D'),
  A('ESE051000074899', 'HHMD nonaktif', 'HANDHELD METAL DETECTOR', 'PSCP D', { active: false }),
];
const idle = () => 'idle';
const all = { query: '', filter: 'all' };

test('canonicalPlace: 2D/2E/2F sama dengan D/E/F untuk PSCP, SSCP, Transfer Desk', () => {
  assert.equal(canonicalPlace('PSCP 2D'), 'PSCP D');
  assert.equal(canonicalPlace('pscp 2e'), 'PSCP E');
  assert.equal(canonicalPlace('PSCP 2F'), 'PSCP F');
  assert.equal(canonicalPlace('SSCP 2E'), 'SSCP E');
  assert.equal(canonicalPlace('SSCP 2F'), 'SSCP F');
  assert.equal(canonicalPlace('Transfer Desk 2D'), 'Transfer Desk D');
  assert.equal(canonicalPlace('Transfer Desk 2E'), 'Transfer Desk E');
  assert.equal(canonicalPlace('PSCP D'), 'PSCP D');
  assert.equal(canonicalPlace('HBSCP'), 'HBSCP');
  assert.equal(canonicalPlace('PSCP Umrah'), 'PSCP Umrah');
});

test('tempat berurutan sesuai alur lapangan; Access Control tidak ikut', () => {
  const places = groupAssetsByPlace(assets, 'DAILY', idle, all);
  assert.deepEqual(places.map((p) => p.location), ['PSCP D', 'PSCP E', 'PSCP Umrah', 'SSCP E', 'Transfer Desk D', 'HBSCP', 'Red Lane', 'Arrival F']);
  assert.ok(!places.some((p) => p.types.some((t) => t.assetType === 'ACCESS CONTROL SYSTEM')));
  assert.equal(isPlaceAssetType('ACCESS CONTROL SYSTEM'), false);
});

test('PSCP D berisi semua jenis di tempat itu dengan urutan X-Ray, WTMD, ETD, HHMD, Body Scanner', () => {
  const d = groupAssetsByPlace(assets, 'DAILY', idle, all).find((p) => p.location === 'PSCP D');
  assert.deepEqual(d.types.map((t) => t.assetType), ['X-RAY KABIN', 'WALK THROUGH METAL DETECTOR', 'ETD DESKTOP', 'HANDHELD METAL DETECTOR', 'BODY SCANNER']);
  assert.equal(d.total, 7, 'aset nonaktif tidak dihitung; aset berlokasi "PSCP 2D" ikut PSCP D');
  assert.deepEqual(d.types[0].assets.map((a) => a.name), ['X-Ray Kabin PSCP D No.1', 'X-Ray Kabin PSCP D No.2']);
  assert.equal(d.types.find((t) => t.assetType === 'WALK THROUGH METAL DETECTOR').total, 2);
});

test('HBSCP: X-Ray Bagasi lalu ETD', () => {
  const h = groupAssetsByPlace(assets, 'DAILY', idle, all).find((p) => p.location === 'HBSCP');
  assert.deepEqual(h.types.map((t) => t.assetType), ['X-RAY BAGASI', 'ETD DESKTOP']);
});

test('progres per tempat dan per jenis; pencarian "2D" menemukan aset PSCP D', () => {
  const st = (a) => (a.equipmentNumber === 'ESE011000074748' ? 'saved' : 'idle');
  const d = groupAssetsByPlace(assets, 'DAILY', st, all).find((p) => p.location === 'PSCP D');
  assert.equal(d.saved, 1);
  assert.equal(d.types[0].saved, 1);

  const found = groupAssetsByPlace(assets, 'DAILY', idle, { query: '2D', filter: 'all' });
  assert.deepEqual(found.map((p) => p.location), ['PSCP D', 'Transfer Desk D']);
  // Total tempat tetap menghitung semua aset walau sebagian tersaring.
  assert.equal(found[0].total, 7);
});

test('filter Tersimpan: tempat tanpa aset tersimpan tidak tampil', () => {
  const st = (a) => (a.equipmentNumber === 'ESE021000074730' ? 'saved' : 'idle');
  const places = groupAssetsByPlace(assets, 'DAILY', st, { query: '', filter: 'tersimpan' });
  assert.deepEqual(places.map((p) => p.location), ['HBSCP']);
  assert.deepEqual(places[0].types.map((t) => t.assetType), ['X-RAY BAGASI']);
});

test('lokasi belum terpetakan berada paling akhir', () => {
  const extra = [...assets, A('ESE011000000001', 'X-Ray Kabin baru', 'X-RAY KABIN', UNMAPPED_LOCATION), A('ESE011000000002', 'X-Ray Kabin Zona Baru', 'X-RAY KABIN', 'Zona Baru')];
  const locs = groupAssetsByPlace(extra, 'DAILY', idle, all).map((p) => p.location);
  assert.deepEqual(locs.slice(-2), ['Zona Baru', UNMAPPED_LOCATION]);
});

test('Access Control System tetap dikelompokkan per jenis lalu lokasi (tidak berubah)', () => {
  const acs = groupAssets(assets.filter((a) => !isPlaceAssetType(a.assetType)), 'DAILY', idle, all);
  assert.deepEqual(acs.map((g) => g.assetType), ['ACCESS CONTROL SYSTEM']);
  assert.deepEqual(acs[0].locations.map((l) => l.location), ['Zona D']);
});

test('TabPreventive: Access Control memakai pengelompokan lama, peralatan lain per tempat', () => {
  const tab = readFileSync(new URL('../src/components/features/TabPreventive.tsx', import.meta.url), 'utf8');
  assert.match(tab, /groupAssetsByPlace\(/);
  assert.match(tab, /groupAssets\(assets\.filter\(\(a\) => !isPlaceAssetType\(a\.assetType\)\)/);
});
