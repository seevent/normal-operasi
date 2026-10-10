import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { buildShareBatches } from '../src/lib/utils/shareBatches.ts';

const img = (name) => ({ name, type: 'image/jpeg' });
const vid = (name) => ({ name, type: 'video/mp4' });
const names = (batches) => batches.map((b) => b.map((f) => f.name));

test('satu grup berisi foto saja: satu gelombang (caption ikut foto)', () => {
  assert.deepEqual(names(buildShareBatches([[img('k1')]])), [['k1']]);
});

test('tanpa lampiran: tidak ada gelombang', () => {
  assert.deepEqual(buildShareBatches([[]]), []);
  assert.deepEqual(buildShareBatches([]), []);
});

test('laporan hanya menyertai Grup Kolase 1; gambar grup lain digabung tanpa caption', () => {
  const batches = buildShareBatches([[img('k1')], [img('k2')], [img('k3')]]);
  assert.deepEqual(names(batches), [['k1'], ['k2', 'k3']]);
});

test('video dan foto tidak pernah berada dalam satu gelombang', () => {
  const batches = buildShareBatches([[img('k1'), vid('v1')], [img('k2'), vid('v2')]]);
  assert.deepEqual(names(batches), [['k1'], ['k2'], ['v1'], ['v2']]);
  for (const b of batches) {
    const videos = b.filter((f) => f.type.startsWith('video/')).length;
    assert.ok(videos === 0 || b.length === 1, 'video harus sendirian dalam gelombangnya');
  }
});

test('lebih dari satu video dipisah, satu video per gelombang', () => {
  assert.deepEqual(names(buildShareBatches([[vid('v1'), vid('v2')]])), [['v1'], ['v2']]);
});

test('Grup 1 hanya video: video Grup 1 menjadi gelombang pertama', () => {
  const batches = buildShareBatches([[vid('v1')], [img('k2')], [vid('v3')]]);
  assert.deepEqual(names(batches), [['v1'], ['k2'], ['v3']]);
});

test('Grup 1 kosong: gelombang pertama diisi media grup berikutnya', () => {
  assert.deepEqual(names(buildShareBatches([[], [img('k2')]])), [['k2']]);
});

test('Tab yang melampirkan media memakai shareReportWithMedia', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  for (const f of ['TabInitialReport', 'TabPerbaikan', 'TabKalibrasi', 'TabBriefing', 'TabStoring', 'TabKegiatan']) {
    const src = read(`src/components/features/${f}.tsx`);
    assert.match(src, /shareReportWithMedia\(message,/, `${f} harus memakai shareReportWithMedia`);
    assert.doesNotMatch(src, /shareToWhatsApp\(/, `${f} tidak boleh lagi mengirim semua lampiran dalam satu share`);
  }
  assert.match(read('src/components/App.tsx'), /<PendingShareBar \/>/);
});
