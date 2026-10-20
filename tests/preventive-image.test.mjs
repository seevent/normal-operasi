import assert from 'node:assert/strict';
import test from 'node:test';
import { fitWithin } from '../src/lib/utils/preventiveImage.ts';
import { MAX_PHOTO_EDGE, MAX_PHOTO_BYTES, PHOTO_JPEG_QUALITY } from '../src/lib/data/preventiveTypes.ts';

test('batas kompresi: sisi terpanjang 1280 px, JPEG kualitas 0.8, maks 2 MB', () => {
  assert.equal(MAX_PHOTO_EDGE, 1280);
  assert.equal(PHOTO_JPEG_QUALITY, 0.8);
  assert.equal(MAX_PHOTO_BYTES, 2_000_000);
});

test('foto kamera 4032x3024 diperkecil menjaga rasio', () => {
  assert.deepEqual(fitWithin(4032, 3024, 1280), { width: 1280, height: 960 });
});

test('foto potret 3024x4032 diperkecil menjaga rasio', () => {
  assert.deepEqual(fitWithin(3024, 4032, 1280), { width: 960, height: 1280 });
});

test('foto yang sudah kecil tidak diperbesar', () => {
  assert.deepEqual(fitWithin(800, 600, 1280), { width: 800, height: 600 });
  assert.deepEqual(fitWithin(1280, 1280, 1280), { width: 1280, height: 1280 });
});

test('dimensi tidak valid melempar galat', () => {
  for (const [w, h] of [[0, 10], [10, 0], [-1, 5], [NaN, 5], [5, Infinity]]) {
    assert.throws(() => fitWithin(w, h, 1280), /dimensi/i);
  }
});

test('hasil selalu bilangan bulat >= 1 dan tidak melebihi batas', () => {
  const r = fitWithin(10000, 3, 1280);
  assert.equal(r.width, 1280);
  assert.ok(r.height >= 1 && Number.isInteger(r.height));
});

import { isAcceptableImage, isHeicLike, parseServerTime, createLimiter } from '../src/lib/utils/preventiveImage.ts';

test('isAcceptableImage: image/* atau type kosong (beberapa pemilih foto Android) diterima; selain itu ditolak', () => {
  assert.equal(isAcceptableImage({ type: 'image/jpeg', name: 'a.jpg' }), true);
  assert.equal(isAcceptableImage({ type: 'image/heic', name: 'a.heic' }), true);
  assert.equal(isAcceptableImage({ type: '', name: 'IMG_0001.JPG' }), true);
  assert.equal(isAcceptableImage({ type: '', name: 'IMG_0001.HEIC' }), true);
  assert.equal(isAcceptableImage({ type: '', name: 'catatan' }), false);
  assert.equal(isAcceptableImage({ type: 'application/pdf', name: 'a.pdf' }), false);
  assert.equal(isAcceptableImage({ type: 'video/mp4', name: 'a.mp4' }), false);
});

test('isHeicLike mengenali HEIC/HEIF dari type atau nama berkas', () => {
  assert.equal(isHeicLike({ type: 'image/heic', name: 'x' }), true);
  assert.equal(isHeicLike({ type: 'image/heif', name: 'x' }), true);
  assert.equal(isHeicLike({ type: '', name: 'IMG_1.HEIC' }), true);
  assert.equal(isHeicLike({ type: 'image/jpeg', name: 'IMG_1.jpg' }), false);
});

test('parseServerTime tahan format mikrodetik dari Postgres (Safari) dan tidak pernah NaN', () => {
  assert.equal(parseServerTime('2026-10-20T06:02:53.426441+00:00'), Date.parse('2026-10-20T06:02:53.426Z'));
  assert.equal(parseServerTime('2026-10-20T06:02:53+00:00'), Date.parse('2026-10-20T06:02:53Z'));
  assert.equal(parseServerTime('2026-10-20T06:02:53.4Z'), Date.parse('2026-10-20T06:02:53.400Z'));
  assert.equal(parseServerTime('bukan tanggal'), null);
  assert.equal(parseServerTime(''), null);
});

test('createLimiter menjalankan paling banyak N tugas bersamaan, urut kedatangan, dan lepas saat galat', async () => {
  const limit = createLimiter(2);
  let running = 0, peak = 0;
  const order = [];
  const task = (id, ms, fail = false) => limit(async () => {
    running += 1; peak = Math.max(peak, running); order.push(`mulai${id}`);
    await new Promise((r) => setTimeout(r, ms));
    running -= 1;
    if (fail) throw new Error(`gagal${id}`);
    return id;
  });
  const results = await Promise.allSettled([task(1, 30), task(2, 30, true), task(3, 10), task(4, 10), task(5, 10)]);
  assert.equal(peak, 2);
  assert.deepEqual(results.map((r) => r.status), ['fulfilled', 'rejected', 'fulfilled', 'fulfilled', 'fulfilled']);
  assert.deepEqual(order.slice(0, 2), ['mulai1', 'mulai2']);
  assert.equal(order.length, 5, 'tugas setelah yang gagal tetap berjalan');
});
