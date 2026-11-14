import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildQrPublicId, qrNameSlug, reconcileQr, validateAssetDraft } from '../src/lib/utils/preventiveAssetAdmin.ts';
import { equipmentNumberFromQrPublicId } from '../src/lib/server/preventiveQr.server.ts';
import { createQrUploadTicket } from '../src/lib/server/preventiveQrUpload.server.ts';
import { signCloudinaryParams } from '../src/lib/server/preventiveUpload.server.ts';

const draft = (over = {}) => ({
  equipmentNumber: ' ese011000074758 ',
  name: '  X-Ray Kabin   SSCP E ',
  assetType: 'X-RAY KABIN',
  locationGroup: ' SSCP E ',
  locationOverride: '  ',
  periods: ['M', 'X', 'D'],
  active: true,
  ...over,
});

test('isian aset dinormalkan: nomor huruf besar, spasi dirapikan, override kosong = null, periode urut PRIMA', () => {
  const v = validateAssetDraft(draft());
  assert.equal(v.ok, true);
  assert.deepEqual(v.row, {
    equipment_number: 'ESE011000074758',
    name: 'X-Ray Kabin SSCP E',
    asset_type: 'X-RAY KABIN',
    location_group: 'SSCP E',
    location_override: null,
    periods: ['D', 'M', 'X'],
    active: true,
  });
});

test('isian aset salah ditolak per kolom, sesuai constraint prima_assets', () => {
  const v = validateAssetDraft(draft({ equipmentNumber: 'ESE0110', name: ' ', assetType: 'PRINTER', locationGroup: '' }));
  assert.equal(v.ok, false);
  assert.deepEqual(Object.keys(v.errors).sort(), ['assetType', 'equipmentNumber', 'locationGroup', 'name']);
});

test('nama berkas QR baru mengikuti gaya berkas PRIMA dan terbaca balik sebagai nomor equipment yang sama', () => {
  assert.equal(qrNameSlug('Walk Through Metal Detector PSCP 2D No.5'), 'Walk_Through_Metal_Detector_PSCP_2D_No_5');
  const id = buildQrPublicId('X-RAY KABIN', 'ESE011000074758', 'X-Ray Kabin SSCP E');
  assert.equal(id, 'PRIMA/QR CODE/X-RAY KABIN/ESE011000074758_X_Ray_Kabin_SSCP_E');
  assert.equal(equipmentNumberFromQrPublicId(id), 'ESE011000074758');
  assert.equal(buildQrPublicId('ETD DESKTOP', 'ESE091000074897', '***'), 'PRIMA/QR CODE/ETD DESKTOP/ESE091000074897');
});

test('rekonsiliasi QR: cocok, perlu diisi, tanpa gambar, tak terbaca, dan QR ganda tidak pernah ditulis', () => {
  const r = (equipmentNumber, stored, decoded, hasImage = true) => ({ equipmentNumber, name: equipmentNumber, stored, decoded, hasImage });
  const report = reconcileQr([
    r('A', 'https://o/1', 'https://o/1'),
    r('B', null, 'https://o/2'),
    r('C', 'https://o/old', 'https://o/3'),
    r('D', null, null, false),
    r('E', null, null),
    r('F', null, 'https://o/dup'),
    r('G', 'https://o/dup', 'https://o/dup'),
  ]);
  assert.equal(report.match, 1);
  assert.deepEqual(report.toUpdate, [
    { equipmentNumber: 'B', qrTarget: 'https://o/2' },
    { equipmentNumber: 'C', qrTarget: 'https://o/3' },
  ]);
  assert.deepEqual(report.noImage, ['D']);
  assert.deepEqual(report.unreadable, ['E']);
  assert.deepEqual(report.duplicates, [{ qrTarget: 'https://o/dup', equipmentNumbers: ['F', 'G'] }]);
});

const SECRET = 'rahasia-uji-jangan-bocor';
const ENV = {
  CLOUDINARY_CLOUD_NAME: 'wha6e7fj',
  CLOUDINARY_API_KEY: '123456789012345',
  CLOUDINARY_API_SECRET: SECRET,
  SUPABASE_URL: 'https://proj.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key-uji',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const NOW = new Date('2026-11-14T03:00:00Z');

const fakeFetch = ({ loggedIn = true, asset = { asset_type: 'X-RAY KABIN', name: 'X-Ray Kabin SSCP E' }, qr = [] } = {}) => {
  const calls = [];
  const fetch = async (url) => {
    const u = String(url);
    calls.push(u);
    if (u.endsWith('/auth/v1/user')) return loggedIn ? json({ id: 'u1', email: 'a@b.c' }) : json({}, 401);
    if (u.includes('/rest/v1/prima_assets')) return json(asset ? [asset] : []);
    if (u.endsWith('/resources/search')) return json({ resources: qr });
    throw new Error(`tak terduga: ${u}`);
  };
  return { fetch, calls };
};

test('tiket unggah QR: wajib login', async () => {
  const { fetch, calls } = fakeFetch({ loggedIn: false });
  await assert.rejects(createQrUploadTicket({ accessToken: 'x'.repeat(40), equipmentNumber: 'ESE011000074758' }, { env: ENV, fetch, now: () => NOW }), /Harus login/);
  assert.ok(!calls.some((c) => c.includes('resources/search')));
});

test('tiket unggah QR: berkas QR lama dipakai ulang (ditimpa), tanda tangan sah, rahasia tidak ikut', async () => {
  const oldId = 'PRIMA/QR CODE/X-RAY BAGASI/ESE011000074758_Nama_Lama';
  const { fetch } = fakeFetch({ qr: [{ public_id: oldId, secure_url: 'https://res.cloudinary.com/x/a.png', created_at: '2026-11-04' }] });
  const t = await createQrUploadTicket({ accessToken: 'x'.repeat(40), equipmentNumber: 'ESE011000074758' }, { env: ENV, fetch, now: () => NOW });
  assert.equal(t.publicId, oldId);
  assert.equal(t.assetFolder, 'PRIMA/QR CODE/X-RAY BAGASI');
  assert.equal(t.uploadUrl, 'https://api.cloudinary.com/v1_1/wha6e7fj/image/upload');
  assert.equal(t.timestamp, Math.floor(NOW.getTime() / 1000));
  assert.equal(
    t.signature,
    signCloudinaryParams({ asset_folder: t.assetFolder, invalidate: true, overwrite: true, public_id: oldId, timestamp: t.timestamp }, SECRET),
  );
  assert.ok(!JSON.stringify(t).includes(SECRET));
});

test('tiket unggah QR: tanpa QR lama -> PRIMA/QR CODE/{TIPE}/{NO}_{Nama}; peralatan harus sudah ada', async () => {
  const t = await createQrUploadTicket(
    { accessToken: 'x'.repeat(40), equipmentNumber: 'ESE011000074758' },
    { env: ENV, fetch: fakeFetch().fetch, now: () => NOW },
  );
  assert.equal(t.publicId, 'PRIMA/QR CODE/X-RAY KABIN/ESE011000074758_X_Ray_Kabin_SSCP_E');
  await assert.rejects(
    createQrUploadTicket({ accessToken: 'x'.repeat(40), equipmentNumber: 'ESE011000074758' }, { env: ENV, fetch: fakeFetch({ asset: null }).fetch, now: () => NOW }),
    /Simpan peralatannya dulu/,
  );
});

test('tab Data punya sub-tab Peralatan Preventive; migrasi menjaga QR unik dan tanpa hapus', () => {
  const tabData = readFileSync(new URL('../src/components/features/TabData.tsx', import.meta.url), 'utf8');
  assert.match(tabData, /id: 'peralatan_preventive'/);
  assert.match(tabData, /<PreventiveAssetManager \/>/);
  const sql = readFileSync(new URL('../supabase/migrations/20261113120000_prima_assets_manage_and_qr_target.sql', import.meta.url), 'utf8');
  assert.match(sql, /create unique index if not exists prima_assets_qr_target_key on public\.prima_assets \(qr_target\)/);
  assert.doesNotMatch(sql, /grant delete|for delete/i);
  assert.doesNotMatch(sql.match(/grant update \(([^)]*)\)/)[1], /equipment_number/);
});
