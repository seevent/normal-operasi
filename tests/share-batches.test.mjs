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

test('isRiskyBatch: kiriman berisi video bersama berkas lain atau caption', () => {
  assert.equal(isRiskyBatch([img('a')]), false);
  assert.equal(isRiskyBatch([img('a')], 'laporan'), false);
  assert.equal(isRiskyBatch([vid('v')]), false);
  assert.equal(isRiskyBatch([vid('v')], 'laporan'), true);
  assert.equal(isRiskyBatch([img('a'), img('b')]), false);
  assert.equal(isRiskyBatch([img('a'), vid('v')]), true);
  assert.equal(isRiskyBatch([vid('v1'), vid('v2')]), true);
});

const items = (list) => list.map((i) => ({ files: i.files.map((f) => f.name), caption: i.caption }));

test('splitMediaSafely: caption bersama foto, lalu tiap video sendiri tanpa caption', () => {
  const out = splitMediaSafely({ files: [img('a'), vid('v1'), img('b'), vid('v2')], caption: 'laporan' });
  assert.deepEqual(items(out), [
    { files: ['a', 'b'], caption: 'laporan' },
    { files: ['v1'], caption: undefined },
    { files: ['v2'], caption: undefined },
  ]);
});

test('splitMediaSafely: tanpa foto, laporan dikirim sebagai teks saja sebelum video', () => {
  const out = splitMediaSafely({ files: [vid('v1')], caption: 'laporan' });
  assert.deepEqual(items(out), [{ files: [], caption: 'laporan' }, { files: ['v1'], caption: undefined }]);
  assert.deepEqual(splitMediaSafely({ files: [] }), []);
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

test('Video diubah ke MP4 ramah WhatsApp sebelum laporan dibagikan', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  const service = read('src/lib/services/shareService.ts');
  assert.match(service, /prepareVideoForWhatsApp\(video, category\)/);
  assert.match(service, /caption: message, cheerTab/);
  assert.match(read('src/components/shared/PendingShareBar.tsx'), /Menyiapkan video/);
  // Video harus lewat endpoint video Cloudinary, bukan endpoint gambar.
  assert.match(read('src/lib/services/cloudinaryService.ts'), /\/video\/upload`/);
});
