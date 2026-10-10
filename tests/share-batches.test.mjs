import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { buildShareBatches, isRiskyBatch, splitMediaSafely } from '../src/lib/utils/shareBatches.ts';

const img = (name) => ({ name, type: 'image/jpeg' });
const vid = (name) => ({ name, type: 'video/mp4' });
const names = (batches) => batches.map((b) => b.map((f) => f.name));

test('satu grup berisi foto saja: satu kiriman (caption ikut foto)', () => {
  assert.deepEqual(names(buildShareBatches([[img('k1')]])), [['k1']]);
});

test('tanpa lampiran: tidak ada kiriman', () => {
  assert.deepEqual(buildShareBatches([[]]), []);
  assert.deepEqual(buildShareBatches([]), []);
});

test('laporan hanya menyertai Grup Kolase 1; media grup lain digabung tanpa caption', () => {
  const batches = buildShareBatches([[img('k1')], [img('k2')], [img('k3')]]);
  assert.deepEqual(names(batches), [['k1'], ['k2', 'k3']]);
});

test('foto dan video boleh campur dalam satu kiriman', () => {
  const batches = buildShareBatches([[img('k1'), vid('v1')], [img('k2'), vid('v2')]]);
  assert.deepEqual(names(batches), [['k1', 'v1'], ['k2', 'v2']]);
});

test('Grup 1 kosong: kiriman pertama diisi media grup berikutnya', () => {
  assert.deepEqual(names(buildShareBatches([[], [img('k2')]])), [['k2']]);
});

test('isRiskyBatch: hanya kiriman dengan video bersama berkas lain', () => {
  assert.equal(isRiskyBatch([img('a')]), false);
  assert.equal(isRiskyBatch([vid('v')]), false);
  assert.equal(isRiskyBatch([img('a'), img('b')]), false);
  assert.equal(isRiskyBatch([img('a'), vid('v')]), true);
  assert.equal(isRiskyBatch([vid('v1'), vid('v2')]), true);
});

test('splitMediaSafely: foto jadi satu kiriman, tiap video sendiri', () => {
  const out = splitMediaSafely([img('a'), vid('v1'), img('b'), vid('v2')]);
  assert.deepEqual(names(out), [['a', 'b'], ['v1'], ['v2']]);
  assert.deepEqual(splitMediaSafely([]), []);
});

test('Tab yang melampirkan media memakai shareReportWithMedia', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  for (const f of ['TabInitialReport', 'TabPerbaikan', 'TabKalibrasi', 'TabBriefing', 'TabStoring', 'TabKegiatan']) {
    const src = read(`src/components/features/${f}.tsx`);
    assert.match(src, /shareReportWithMedia\(message,/, `${f} harus memakai shareReportWithMedia`);
    assert.doesNotMatch(src, /shareToWhatsApp\(/, `${f} tidak boleh lagi mengirim semua lampiran dalam satu share`);
  }
  assert.match(read('src/components/App.tsx'), /<PendingShareBar \/>/);
  assert.match(read('src/components/shared/PendingShareBar.tsx'), /retryShareSeparately/);
});
