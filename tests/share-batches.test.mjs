import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { buildShareBatches, isAppleMobile, isRiskyBatch, planShareItems, splitMediaSafely } from '../src/lib/utils/shareBatches.ts';

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
  assert.match(service, /setPendingShareBatches\(\[\{ \.\.\.head, cheerTab \}, \.\.\.rest\]\)/, 'kiriman pertama membawa caption laporan + cheerTab');
  assert.match(read('src/components/shared/PendingShareBar.tsx'), /Menyiapkan video/);
  // Video harus lewat endpoint video Cloudinary, bukan endpoint gambar.
  assert.match(read('src/lib/services/cloudinaryService.ts'), /\/video\/upload`/);
});

const plan = (items) => items.map((i) => ({ files: i.files.map((f) => f.name), ...(i.caption ? { caption: i.caption } : {}) }));

test('planShareItems Android: laporan + foto + video tetap satu kiriman, grup lain tanpa caption', () => {
  const items = planShareItems([[img('a'), vid('v1')], [img('b'), vid('v2')]], 'laporan', false);
  assert.deepEqual(plan(items), [
    { files: ['a', 'v1'], caption: 'laporan' },
    { files: ['b', 'v2'] },
  ]);
});

test('planShareItems iPhone: video tidak pernah bersama caption atau berkas lain', () => {
  const items = planShareItems([[img('a'), vid('v1'), img('c')], [img('b'), vid('v2')]], 'laporan', true);
  assert.deepEqual(plan(items), [
    { files: ['a', 'c'], caption: 'laporan' },
    { files: ['v1'] },
    { files: ['b'] },
    { files: ['v2'] },
  ]);
  for (const item of items) assert.equal(isRiskyBatch(item.files, item.caption), false);
});

test('planShareItems iPhone: laporan dengan video saja = teks dulu, lalu video', () => {
  assert.deepEqual(plan(planShareItems([[vid('v1')]], 'laporan', true)), [{ files: [], caption: 'laporan' }, { files: ['v1'] }]);
  assert.deepEqual(plan(planShareItems([[img('a')]], 'laporan', true)), [{ files: ['a'], caption: 'laporan' }]);
  assert.deepEqual(plan(planShareItems([], 'laporan', true)), [{ files: [], caption: 'laporan' }]);
});

test('isAppleMobile: Safari & Chrome iPhone, iPad (termasuk iPadOS bermode desktop); bukan Android/Mac', () => {
  const chromeIphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1';
  const safariIphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
  const ipadDesktop = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15';
  const android = 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
  assert.equal(isAppleMobile(chromeIphone, 'iPhone', 5), true);
  assert.equal(isAppleMobile(safariIphone, 'iPhone', 5), true);
  assert.equal(isAppleMobile(ipadDesktop, 'MacIntel', 5), true);
  assert.equal(isAppleMobile(ipadDesktop, 'MacIntel', 0), false, 'Mac sungguhan');
  assert.equal(isAppleMobile(android, 'Linux armv8l', 5), false);
});

test('shareService: berkas dibagikan tanpa title; iPhone memakai planShareItems dengan video terpisah', () => {
  const src = readFileSync(new URL('../src/lib/services/shareService.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /files: finalFiles,\s*title:/);
  assert.match(src, /hasFiles \? \{ files: next\.files \} : \{ title: 'Laporan SSES T2' \}/);
  assert.equal((src.match(/planShareItems\(/g) ?? []).length, 2, 'share langsung dan share setelah konversi');
  assert.equal((src.match(/shouldSeparateVideos\(\)/g) ?? []).length, 2);
});
