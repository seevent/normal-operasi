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
