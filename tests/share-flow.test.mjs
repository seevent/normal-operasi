import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import {
  retrySeparately,
  shareNext,
  skipNext,
  startReportShare,
  videoLinkMessage,
} from '../src/lib/utils/shareFlow.ts';

const img = (name) => ({ name, type: 'image/jpeg', size: 1000 });
const vid = (name, type = 'video/quicktime') => ({ name, type, size: 5_000_000 });
const names = (files) => files.map((f) => f.name);
const tick = () => new Promise((r) => setTimeout(r, 0));
const domError = (name) => Object.assign(new Error(name), { name });

/** Lingkungan tiruan: navigator.share yang bisa selesai, menggantung, atau menolak. */
function env({ share = 'ok', canShare = true, prepared = new Map(), hasShare = true } = {}) {
  const calls = { shares: [], fallbacks: [], downloads: [], copied: [], shared: [] };
  let state = { queue: [], retry: null, failure: null, attempted: false };
  let behaviour = share;
  let id = 0;
  const deps = {
    nav: hasShare
      ? {
          canShare: () => canShare,
          share: (data) => {
            calls.shares.push(data);
            if (behaviour === 'hang') return new Promise(() => {});
            if (behaviour === 'ok') return Promise.resolve();
            return Promise.reject(domError(behaviour));
          },
        }
      : {},
    getState: () => state,
    setState: (patch) => {
      state = { ...state, ...patch };
    },
    preparedVideo: (f) => prepared.get(f),
    newId: () => `id-${++id}`,
    onShared: (item) => calls.shared.push(item),
    fallback: async (message, files) => {
      calls.fallbacks.push({ message, files });
    },
    download: (f) => calls.downloads.push(f),
    copyText: (t) => calls.copied.push(t),
  };
  return { deps, calls, state: () => state, setShare: (b) => (behaviour = b) };
}

// ---- Enam skenario reproduksi (10 Nov 2026): Android/iPhone × video siap/belum × promise selesai/menggantung ----

test('1. video sudah siap: satu share berisi laporan + foto + video konversi', async () => {
  const foto = img('kolase.jpg');
  const asli = vid('IMG_1.MOV');
  const mp4 = vid('IMG_1.mp4', 'video/mp4');
  const e = env({ prepared: new Map([[asli, mp4]]) });
  const out = await startReportShare(e.deps, { message: 'laporan', groups: [[foto, asli]], cheerTab: 'kegiatan' });
  assert.equal(out.result, 'shared');
  assert.equal(e.calls.shares.length, 1);
  assert.deepEqual(names(e.calls.shares[0].files), ['kolase.jpg', 'IMG_1.mp4']);
  assert.equal(e.calls.shares[0].text, 'laporan');
  assert.equal('title' in e.calls.shares[0], false, 'berkas dibagikan tanpa title');
  assert.deepEqual(e.state().queue, []);
  assert.equal(e.calls.shared.length, 1);
});

test('2. Kirim sebelum video siap: share dipanggil SEKETIKA dengan video asli, tidak menunggu konversi', () => {
  const foto = img('kolase.jpg');
  const asli = vid('IMG_2.MOV');
  const e = env({ share: 'hang' });
  void startReportShare(e.deps, { message: 'laporan', groups: [[foto, asli]], cheerTab: 'storing' });
  // Tanpa await: share harus sudah terpanggil di ketukan yang sama (izin ketukan pengguna masih berlaku).
  assert.equal(e.calls.shares.length, 1, 'navigator.share dipanggil sinkron');
  assert.deepEqual(names(e.calls.shares[0].files), ['kolase.jpg', 'IMG_2.MOV']);
});

test('3. iPhone bawaan (gabung): video ikut di share pertama, sama seperti Android', async () => {
  const e = env();
  await startReportShare(e.deps, { message: 'laporan', groups: [[img('a.jpg'), vid('v.mov')]], mode: 'gabung' });
  assert.equal(e.calls.shares.length, 1);
  assert.deepEqual(names(e.calls.shares[0].files), ['a.jpg', 'v.mov']);
});

test('4. promise share pertama menggantung: antrean grup lain dan tombol kirim ulang sudah tersedia', () => {
  const e = env({ share: 'hang' });
  void startReportShare(e.deps, { message: 'laporan', groups: [[img('k1.jpg'), vid('v1.mov')], [img('k2.jpg')]] });
  assert.deepEqual(e.state().queue.map((i) => names(i.files)), [['k2.jpg']], 'antrean diisi sebelum promise selesai');
  assert.deepEqual(names(e.state().retry.files), ['k1.jpg', 'v1.mov'], 'kirim ulang terpisah tersedia');
});

test('5. mode pisah + promise menggantung: tombol video tetap muncul', () => {
  const e = env({ share: 'hang' });
  void startReportShare(e.deps, { message: 'laporan', groups: [[img('k1.jpg'), vid('v1.mov')]], mode: 'pisah' });
  assert.deepEqual(names(e.calls.shares[0].files), ['k1.jpg']);
  assert.deepEqual(e.state().queue.map((i) => names(i.files)), [['v1.mov']]);
});

test('6. share lanjutan ditolak peramban: kiriman tetap di antrean, tidak diunduh diam-diam', async () => {
  const e = env();
  await startReportShare(e.deps, { message: 'laporan', groups: [[img('k1.jpg')], [vid('v2.mov')]] });
  assert.equal(e.state().queue.length, 1);
  e.setShare('NotAllowedError');
  await shareNext(e.deps);
  assert.equal(e.state().queue.length, 1, 'tidak dibuang');
  assert.deepEqual(e.state().failure, { reason: 'ditolak', errorName: 'NotAllowedError' });
  assert.equal(e.calls.downloads.length, 0);
  // Coba lagi berhasil: antrean kosong, tanda gagal hilang.
  e.setShare('ok');
  await shareNext(e.deps);
  assert.deepEqual(e.state().queue, []);
  assert.equal(e.state().failure, null);
});

// ---- Perilaku pendukung ----

test('video memakai salinan MP4 bila sudah siap, selain itu berkas asli', async () => {
  const asli = vid('IMG_3.MOV');
  const mp4 = vid('IMG_3.mp4', 'video/mp4');
  const siap = env({ prepared: new Map([[asli, mp4]]) });
  await startReportShare(siap.deps, { message: 'm', groups: [[asli]] });
  assert.deepEqual(names(siap.calls.shares[0].files), ['IMG_3.mp4']);
  const belum = env({});
  await startReportShare(belum.deps, { message: 'm', groups: [[asli]] });
  assert.deepEqual(names(belum.calls.shares[0].files), ['IMG_3.MOV']);
});

test('hasil share lama yang baru selesai tidak menimpa antrean share baru', async () => {
  const e = env({});
  let selesaiLama;
  e.deps.nav.share = () => new Promise((r) => { selesaiLama = r; });
  const lama = startReportShare(e.deps, { message: 'lama', groups: [[img('a.jpg')], [img('b.jpg')]] });
  e.deps.nav.share = () => Promise.resolve();
  await startReportShare(e.deps, { message: 'baru', groups: [[img('c.jpg')], [img('d.jpg')]] });
  selesaiLama();
  assert.equal((await lama).result, 'aborted');
  assert.deepEqual(e.state().queue.map((i) => names(i.files)), [['d.jpg']]);
});

for (const [kasus, akhiriLama] of [
  ['ditolak', (selesai) => selesai.reject(domError('NotAllowedError'))],
  ['dibatalkan', (selesai) => selesai.reject(domError('AbortError'))],
]) {
  test(`share lama yang baru ${kasus} belakangan tidak menimpa antrean share baru`, async () => {
    const e = env({});
    const selesai = {};
    e.deps.nav.share = () => new Promise((resolve, reject) => Object.assign(selesai, { resolve, reject }));
    const lama = startReportShare(e.deps, { message: 'lama', groups: [[img('a.jpg')], [img('b.jpg')]] });
    e.deps.nav.share = () => Promise.resolve();
    await startReportShare(e.deps, { message: 'baru', groups: [[img('c.jpg')], [img('d.jpg')]] });
    akhiriLama(selesai);
    assert.equal((await lama).result, 'aborted');
    assert.deepEqual(e.state().queue.map((i) => names(i.files)), [['d.jpg']]);
    assert.equal(e.state().failure, null);
    assert.deepEqual(e.calls.shared.map((i) => i.caption), ['baru']);
  });
}

test('share pertama dibatalkan pengguna: antrean dikosongkan', async () => {
  const e = env({ share: 'AbortError' });
  const out = await startReportShare(e.deps, { message: 'laporan', groups: [[img('k1.jpg'), vid('v.mov')], [img('k2.jpg')]] });
  assert.equal(out.result, 'aborted');
  assert.deepEqual(e.state().queue, []);
  assert.equal(e.state().retry, null);
  assert.equal(e.calls.fallbacks.length, 0);
});

test('share pertama ditolak peramban: laporan masuk antrean untuk diketuk ulang, bukan wa.me + unduhan', async () => {
  const e = env({ share: 'NotAllowedError' });
  const out = await startReportShare(e.deps, { message: 'laporan', groups: [[img('k1.jpg'), vid('v.mov')]] });
  assert.equal(out.result, 'queued');
  assert.equal(e.state().queue.length, 1);
  assert.equal(e.state().queue[0].caption, 'laporan');
  assert.equal(e.state().failure.reason, 'ditolak');
  assert.equal(e.calls.fallbacks.length, 0);
  assert.equal(e.calls.downloads.length, 0);
});

test('tanpa Web Share (PC): wa.me + unduh semua berkas seperti sebelumnya', async () => {
  const e = env({ hasShare: false });
  const out = await startReportShare(e.deps, { message: 'laporan', groups: [[img('k1.jpg')], [vid('v2.mov')]] });
  assert.equal(out.result, 'fallback');
  assert.equal(e.calls.fallbacks.length, 1);
  assert.deepEqual(names(e.calls.fallbacks[0].files), ['k1.jpg']);
  assert.deepEqual(names(e.calls.downloads), ['v2.mov']);
  assert.deepEqual(e.state().queue, []);
});

test('laporan tanpa lampiran: share teks dengan title', async () => {
  const e = env();
  await startReportShare(e.deps, { message: 'laporan', groups: [[]] });
  assert.deepEqual(e.calls.shares[0], { title: 'Laporan SSES T2', text: 'laporan' });
});

test('shareNext yang menggantung: kiriman ditandai sudah dicoba dan bisa dilewati', async () => {
  const e = env();
  await startReportShare(e.deps, { message: 'laporan', groups: [[img('k1.jpg')], [vid('v2.mov')], ]});
  e.setShare('hang');
  void shareNext(e.deps);
  await tick();
  assert.equal(e.state().attempted, true);
  assert.equal(e.state().queue.length, 1);
  skipNext(e.deps);
  assert.deepEqual(e.state().queue, []);
  assert.equal(e.state().attempted, false);
});

test('retrySeparately: laporan + foto dulu, lalu tiap video sendiri', async () => {
  const e = env();
  await startReportShare(e.deps, { message: 'laporan', groups: [[img('k1.jpg'), vid('v1.mov')]] });
  await retrySeparately(e.deps);
  assert.deepEqual(names(e.calls.shares[1].files), ['k1.jpg']);
  assert.equal(e.calls.shares[1].text, 'laporan');
  assert.deepEqual(e.state().queue.map((i) => names(i.files)), [['v1.mov']]);
  assert.equal(e.state().retry, null);
});

test('videoLinkMessage: satu tautan per baris', () => {
  assert.equal(videoLinkMessage(['https://a/v1.mp4']), 'Video: https://a/v1.mp4');
  assert.equal(videoLinkMessage(['https://a/v1.mp4', 'https://a/v2.mp4']), 'Video 1: https://a/v1.mp4\nVideo 2: https://a/v2.mp4');
});

// ---- Penyambungan di aplikasi ----

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('shareService memakai shareFlow dan tidak lagi menunggu konversi video sebelum share', () => {
  const src = read('src/lib/services/shareService.ts');
  assert.match(src, /startReportShare\(/);
  assert.doesNotMatch(src, /queueReportWithConvertedVideos|await prepareVideoForWhatsApp/);
  assert.doesNotMatch(src, /shareLogService|logShare|noteHead/);
});

test('PendingShareBar: tombol gagal, lewati, tautan video; tanpa layar tunggu konversi', () => {
  const bar = read('src/components/shared/PendingShareBar.tsx');
  assert.doesNotMatch(bar, /Menyiapkan video/);
  assert.match(bar, /Coba lagi/);
  assert.match(bar, /skipPendingShare/);
  assert.match(bar, /sendPendingVideoLinks/);
  assert.match(bar, /savePendingFiles/);
});

test('halaman Uji Share WA sudah dihapus', () => {
  assert.equal(existsSync(new URL('../src/components/features/ShareTestPanel.tsx', import.meta.url)), false);
  assert.doesNotMatch(read('src/components/features/TabData.tsx'), /ShareTestPanel|uji_share|Uji Share/);
  assert.doesNotMatch(read('src/lib/services/shareService.ts'), /shareTestReport|VideoChoice/);
});

test('pencatatan share sudah dicabut seluruhnya', () => {
  assert.equal(existsSync(new URL('../src/lib/services/shareLogService.ts', import.meta.url)), false);
  const flow = read('src/lib/utils/shareFlow.ts');
  assert.doesNotMatch(flow, /ShareLogEntry|SHARE_HANG_MS|setTimer|VideoChoice|'uji'|deps\.log/);
});

test('migrasi menghapus tabel share_log dan dokumen tidak lagi merujuknya', () => {
  const mig = read('supabase/migrations/20261115120000_drop_share_log.sql');
  assert.match(mig, /drop table if exists public\.share_log;/);
  assert.doesNotMatch(read('agent.md'), /share_log|Uji Share WA/);
});
