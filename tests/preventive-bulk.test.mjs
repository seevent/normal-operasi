import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultAssignment, defaultStartKey, orderPhotos, reassign } from '../src/lib/utils/preventiveBulk.ts';

const T = (h, m) => Date.UTC(2026, 9, 30, h, m);

test('orderPhotos: jam EXIF dulu, lalu tanggal nama WhatsApp, lalu urutan dipilih', () => {
  const photos = [
    { index: 0, takenAt: null, nameRange: null },
    { index: 1, takenAt: T(1, 5), nameRange: null },
    { index: 2, takenAt: null, nameRange: [T(0, 50), T(0, 51)] },
    { index: 3, takenAt: T(0, 40), nameRange: null },
    { index: 4, takenAt: null, nameRange: null },
  ];
  assert.deepEqual(orderPhotos(photos).map((p) => p.index), [3, 2, 1, 0, 4]);
});

const assets = (savedFlags) => savedFlags.map((saved, i) => ({ key: `a${i}`, saved }));

test('defaultAssignment: mulai dari alat pertama yang belum tersimpan, lanjut berurutan (yang tersimpan ikut ditimpa)', () => {
  // a0..a4 tersimpan, a5..a9 belum, a10 tersimpan
  const list = assets([true, true, true, true, true, false, false, false, false, false, true]);
  assert.deepEqual(defaultAssignment(5, list), ['a5', 'a6', 'a7', 'a8', 'a9']);
  assert.deepEqual(defaultAssignment(6, list), ['a5', 'a6', 'a7', 'a8', 'a9', 'a10']);
  // Foto lebih banyak dari sisa alat: sisanya tanpa pasangan
  assert.deepEqual(defaultAssignment(8, list), ['a5', 'a6', 'a7', 'a8', 'a9', 'a10', null, null]);
});

test('defaultAssignment: semua sudah tersimpan -> mulai dari alat pertama (ditimpa)', () => {
  assert.deepEqual(defaultAssignment(2, assets([true, true, true])), ['a0', 'a1']);
  assert.deepEqual(defaultAssignment(2, []), [null, null]);
});

test('reassign: memilih alat yang sudah dipakai foto lain menukar pasangannya; null melepas', () => {
  const a = ['a1', 'a2', 'a3'];
  assert.deepEqual(reassign(a, 0, 'a3'), ['a3', 'a2', 'a1']);
  assert.deepEqual(reassign(a, 1, 'a9'), ['a1', 'a9', 'a3']);
  assert.deepEqual(reassign(a, 2, null), ['a1', 'a2', null]);
  assert.deepEqual(a, ['a1', 'a2', 'a3'], 'tidak mengubah array asal');
});

test('defaultAssignment: "Mulai dari" alat tertentu (mis. tempat lain), tersimpan ikut ditimpa', () => {
  const list = assets([false, false, true, true, false]);
  assert.equal(defaultStartKey(list), 'a0');
  assert.deepEqual(defaultAssignment(3, list, 'a2'), ['a2', 'a3', 'a4']);
  assert.deepEqual(defaultAssignment(2, list, 'tidak-ada'), ['a0', 'a1']);
  assert.equal(defaultStartKey(assets([true, true])), 'a0');
  assert.equal(defaultStartKey([]), null);
});
