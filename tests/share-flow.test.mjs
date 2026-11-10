import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  SHARE_HANG_MS,
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
  const calls = { shares: [], logs: [], fallbacks: [], downloads: [], copied: [], shared: [], timers: [] };
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
    log: (entry) => calls.logs.push(entry),
    now: () => 1000,
    newId: () => `id-${++id}`,
    setTimer: (fn, ms) => calls.timers.push({ fn, ms }),
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

test('video paksa asli / wajib konversi (dipakai halaman uji)', async () => {
  const asli = vid('IMG_3.MOV');
  const mp4 = vid('IMG_3.mp4', 'video/mp4');
  const a = env({ prepared: new Map([[asli, mp4]]) });
  await startReportShare(a.deps, { message: 'm', groups: [[asli]], video: 'asli' });
  assert.deepEqual(names(a.calls.shares[0].files), ['IMG_3.MOV']);
  const b = env({ prepared: new Map([[asli, mp4]]) });
  await startReportShare(b.deps, { message: 'm', groups: [[asli]], video: 'siap' });
  assert.deepEqual(names(b.calls.shares[0].files), ['IMG_3.mp4']);
});

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

test('log: tiap share dicatat dengan hasil, sumber video, dan tanda menggantung', async () => {
  const asli = vid('IMG_4.MOV');
  const mp4 = vid('IMG_4.mp4', 'video/mp4');
  const e = env({ prepared: new Map([[asli, mp4]]) });
  const out = await startReportShare(e.deps, { message: 'laporan', groups: [[img('k.jpg'), asli]], cheerTab: 'perbaikan' });
  assert.equal(e.calls.logs.length, 1);
  const row = e.calls.logs[0];
  assert.equal(row.attemptId, out.attemptId);
  assert.deepEqual(
    { kind: row.kind, step: row.step, tab: row.tab, mode: row.mode, photos: row.photos, videos: row.videos, videoSource: row.videoSource, outcome: row.outcome },
    { kind: 'laporan', step: 1, tab: 'perbaikan', mode: 'gabung', photos: 1, videos: 1, videoSource: 'konversi', outcome: 'resolved' },
  );
  assert.equal(row.bytes, 1000 + 5_000_000);

  const h = env({ share: 'hang' });
  void startReportShare(h.deps, { message: 'laporan', groups: [[vid('v.mov')]] });
  assert.equal(h.calls.timers[0].ms, SHARE_HANG_MS);
  h.calls.timers[0].fn();
  assert.equal(h.calls.logs.at(-1).outcome, 'timeout');
  assert.equal(h.calls.logs.at(-1).videoSource, 'asli');
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
  assert.match(src, /log: logShare/);
});

test('PendingShareBar: tombol gagal, lewati, tautan video; tanpa layar tunggu konversi', () => {
  const bar = read('src/components/shared/PendingShareBar.tsx');
  assert.doesNotMatch(bar, /Menyiapkan video/);
  assert.match(bar, /Coba lagi/);
  assert.match(bar, /skipPendingShare/);
  assert.match(bar, /sendPendingVideoLinks/);
  assert.match(bar, /savePendingFiles/);
});

test('halaman Uji share ada di tab Data dan mencatat jawaban "sampai di WhatsApp"', () => {
  assert.match(read('src/components/features/TabData.tsx'), /ShareTestPanel/);
  const panel = read('src/components/features/ShareTestPanel.tsx');
  assert.match(panel, /Sampai di WhatsApp\?/);
  assert.match(panel, /logShareAnswer\(/);
  const mig = read('supabase/migrations/20261110120000_share_log.sql');
  assert.match(mig, /create table public\.share_log/);
  assert.match(mig, /enable row level security/);
});
