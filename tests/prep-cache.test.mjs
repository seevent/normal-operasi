import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createPrepCache } from '../src/lib/utils/prepCache.ts';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

test('start: berjalan sekali per kunci; status preparing lalu ready', async () => {
  const d = deferred();
  let runs = 0;
  const cache = createPrepCache(() => { runs += 1; return d.promise; });
  const key = {};

  const a = cache.start(key);
  const b = cache.start(key);
  assert.equal(a, b);
  assert.equal(runs, 1);
  assert.equal(cache.status(key), 'preparing');
  assert.equal(cache.value(key), undefined);

  d.resolve('mp4');
  assert.equal(await a, 'mp4');
  assert.equal(cache.status(key), 'ready');
  assert.equal(cache.value(key), 'mp4');
  assert.equal(cache.start(key), a);
  assert.equal(runs, 1);
});

test('start: kunci yang gagal dijalankan ulang dan bisa berhasil', async () => {
  let runs = 0;
  const cache = createPrepCache(async () => {
    runs += 1;
    if (runs === 1) throw new Error('jaringan putus');
    return 'ok';
  });
  const key = {};

  await assert.rejects(cache.start(key), /jaringan putus/);
  assert.equal(cache.status(key), 'failed');
  assert.equal(cache.value(key), undefined);

  assert.equal(await cache.start(key), 'ok');
  assert.equal(cache.status(key), 'ready');
  assert.equal(runs, 2);
});

test('start: konteks diteruskan ke run; kunci berbeda tidak saling memengaruhi', async () => {
  const cache = createPrepCache(async (key, ctx) => `${key.name}:${ctx}`);
  const a = { name: 'a' };
  const b = { name: 'b' };
  assert.equal(await cache.start(a, 'Kegiatan'), 'a:Kegiatan');
  assert.equal(cache.status(b), undefined);
  assert.equal(await cache.start(b, 'Storing'), 'b:Storing');
});

test('subscribe: pendengar diberi tahu saat mulai dan selesai, berhenti setelah unsubscribe', async () => {
  const cache = createPrepCache(async () => 'x');
  let calls = 0;
  const off = cache.subscribe(() => { calls += 1; });
  await cache.start({});
  assert.equal(calls, 2);
  off();
  await cache.start({});
  assert.equal(calls, 2);
});

test('Video dikonversi di latar belakang sejak dipilih di setiap tab pengirim media', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  const prefetch = {
    TabKegiatan: /prefetchVideosForWhatsApp\(compressedResults\.map\(res => res\.file\), 'Kegiatan'\)/,
    TabStoring: /prefetchVideosForWhatsApp\(compressedResults\.map\(res => res\.file\), 'Storing'\)/,
    TabKalibrasi: /prefetchVideosForWhatsApp\(compressedResults\.map\(res => res\.file\), 'Kalibrasi'\)/,
    TabBriefing: /prefetchVideosForWhatsApp\(compressedResults\.map\(res => res\.file\)\)/,
  };
  for (const [tab, pattern] of Object.entries(prefetch)) {
    assert.match(read(`src/components/features/${tab}.tsx`), pattern, `${tab} harus memulai konversi video saat dipilih`);
  }
  assert.match(read('src/lib/hooks/usePhotoGroups.ts'), /prefetchVideosForWhatsApp\(.*videoCategory\)/);
  assert.match(read('src/components/features/TabPerbaikan.tsx'), /usePhotoGroups\('Perbaikan'\)/);
  // Bila semua video sudah siap, share langsung dibuka tanpa menunggu tombol di PendingShareBar.
  assert.match(read('src/lib/services/shareService.ts'), /videos\.every\(\(v\) => getPreparedVideo\(v\)\)/);
  assert.match(read('src/components/shared/PhotoUploader.tsx'), /<VideoPrepBadge file=\{photo\.file\} \/>/);
});
