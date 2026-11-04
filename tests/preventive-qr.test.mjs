import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  equipmentNumberFromQrPublicId,
  listPreventiveQrCodes,
  PreventiveQrError,
  QR_SEARCH_EXPRESSION,
} from '../src/lib/server/preventiveQr.server.ts';

const SECRET = 'rahasia-uji-jangan-bocor';
const ENV = { CLOUDINARY_CLOUD_NAME: 'wha6e7fj', CLOUDINARY_API_KEY: '123456789012345', CLOUDINARY_API_SECRET: SECRET };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const res = (publicId, created_at = '2026-11-04T06:49:00+00:00') => ({
  public_id: publicId,
  secure_url: `https://res.cloudinary.com/wha6e7fj/image/upload/v1/${encodeURI(publicId)}.png`,
  created_at,
});

test('nomor equipment diambil dari awal nama berkas QR, bukan dari nama aset', () => {
  // Nama berkas ini tidak sama dengan nama aset di prima_assets ("X-Ray Bagasi Red Lane No.1 Arr F").
  assert.equal(equipmentNumberFromQrPublicId('PRIMA/QR CODE/X-RAY BAGASI/ESE021000074746_Red_Lane_No_1_Arrival_F'), 'ESE021000074746');
  assert.equal(equipmentNumberFromQrPublicId('PRIMA/QR CODE/X-RAY KABIN/ESE011000074758_X_Ray_Kabin_SSCP_E'), 'ESE011000074758');
  assert.equal(equipmentNumberFromQrPublicId('PRIMA/PREVENTIVE/ESE011000074758_x'), null);
  assert.equal(equipmentNumberFromQrPublicId('PRIMA/QR CODE/X-RAY KABIN/logo'), null);
});

test('daftar QR: Search API dengan Basic auth, semua halaman, petakan per nomor equipment', async () => {
  const calls = [];
  const pages = [
    { resources: [res('PRIMA/QR CODE/X-RAY KABIN/ESE011000074758_X_Ray_Kabin_SSCP_E'), res('PRIMA/QR CODE/X-RAY KABIN/catatan')], next_cursor: 'c2' },
    { resources: [res('PRIMA/QR CODE/X-RAY BAGASI/ESE021000074746_Red_Lane_No_1_Arrival_F')] },
  ];
  const fetch = async (url, init) => {
    calls.push({ url: String(url), init, body: JSON.parse(init.body) });
    return json(pages[calls.length - 1]);
  };
  const map = await listPreventiveQrCodes({ env: ENV, fetch });

  assert.deepEqual(Object.keys(map).sort(), ['ESE011000074758', 'ESE021000074746']);
  assert.match(map.ESE021000074746, /^https:\/\/res\.cloudinary\.com\/.*ESE021000074746_Red_Lane/);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://api.cloudinary.com/v1_1/wha6e7fj/resources/search');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, `Basic ${Buffer.from(`123456789012345:${SECRET}`).toString('base64')}`);
  assert.equal(calls[0].body.expression, QR_SEARCH_EXPRESSION);
  assert.equal(calls[0].body.next_cursor, undefined);
  assert.equal(calls[1].body.next_cursor, 'c2');
  assert.ok(!JSON.stringify(map).includes(SECRET));
});

test('beberapa QR untuk satu peralatan: yang terbaru dipakai', async () => {
  const id = 'PRIMA/QR CODE/X-RAY KABIN/ESE011000074758_';
  const fetch = async () => json({ resources: [res(`${id}baru`, '2026-11-05T00:00:00+00:00'), res(`${id}lama`, '2026-11-01T00:00:00+00:00')] });
  const map = await listPreventiveQrCodes({ env: ENV, fetch });
  assert.match(map.ESE011000074758, /_baru\.png$/);
});

test('kesalahan: konfigurasi kurang dan HTTP gagal dilaporkan tanpa membocorkan rahasia', async () => {
  await assert.rejects(listPreventiveQrCodes({ env: { CLOUDINARY_CLOUD_NAME: 'x' }, fetch: async () => json({}) }), (e) => {
    assert.ok(e instanceof PreventiveQrError);
    assert.match(e.message, /CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET/);
    return true;
  });
  await assert.rejects(listPreventiveQrCodes({ env: ENV, fetch: async () => json({}, 401) }), (e) => {
    assert.match(e.message, /HTTP 401/);
    assert.ok(!e.message.includes(SECRET));
    return true;
  });
});

test('baris Preventive menampilkan tautan QR code dari peta yang dimuat TabPreventive', () => {
  const row = readFileSync(new URL('../src/components/features/preventive/PreventiveAssetRow.tsx', import.meta.url), 'utf8');
  const card = readFileSync(new URL('../src/components/features/preventive/PreventiveGroupCard.tsx', import.meta.url), 'utf8');
  const tab = readFileSync(new URL('../src/components/features/TabPreventive.tsx', import.meta.url), 'utf8');
  assert.match(row, /href=\{qrUrl\}/);
  assert.match(card, /qrUrl=\{qrUrls\[asset\.equipmentNumber\]\}/);
  assert.match(tab, /fetchPreventiveQrCodes\(\)/);
  assert.match(tab, /qrUrls=\{qrUrls\}/);
});
