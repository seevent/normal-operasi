import assert from 'node:assert/strict';
import test from 'node:test';
import {
  purgeDueTrash,
  purgeJob,
  requireLoggedIn,
  getCloudinaryUsage,
  CLOUDINARY_DELETE_BATCH,
} from '../src/lib/server/storagePurge.server.ts';

const SECRET = 'rahasia-uji-jangan-bocor';
const SERVICE = 'service-role-uji-jangan-bocor';
const ENV = {
  CLOUDINARY_CLOUD_NAME: 'wha6e7fj',
  CLOUDINARY_API_KEY: '123456789012345',
  CLOUDINARY_API_SECRET: SECRET,
  SUPABASE_URL: 'https://proyek.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: SERVICE,
};
const NOW = new Date('2026-11-05T20:00:00Z');
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const cld = (pid, type = 'image', ext = 'jpg') => `https://res.cloudinary.com/wha6e7fj/${type}/upload/v1790000000/${pid}.${ext}`;
const sto = (path) => `https://proyek.supabase.co/storage/v1/object/public/dokumentasi/${path}`;

/** fetch palsu: mencatat panggilan, menjawab sesuai tujuan. */
function fakeFetch({ begin = [], cloudinary, storage, jobs = [], finish } = {}) {
  const calls = [];
  const fn = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (u.endsWith('/rest/v1/rpc/begin_purge_job')) return json(begin);
    if (u.endsWith('/rest/v1/rpc/finish_purge_job')) return finish ? finish(JSON.parse(init.body)) : json('dikosongkan');
    if (u.includes('/rest/v1/storage_cleanup_jobs')) return json(jobs);
    if (u.startsWith('https://api.cloudinary.com/') && init.method === 'DELETE') {
      const ids = new URL(u).searchParams.getAll('public_ids[]');
      return cloudinary ? cloudinary(ids, u) : json({ deleted: Object.fromEntries(ids.map((i) => [i, 'deleted'])) });
    }
    if (u.includes('/storage/v1/object/') && init.method === 'DELETE') {
      const { prefixes } = JSON.parse(init.body);
      return storage ? storage(prefixes) : json(prefixes.map((name) => ({ name })));
    }
    throw new Error(`panggilan tak terduga: ${u}`);
  };
  fn.calls = calls;
  return fn;
}
const deps = (fetch) => ({ env: ENV, fetch, now: () => NOW });
const finishBody = (f) => JSON.parse(f.calls.find((c) => c.url.endsWith('finish_purge_job')).init.body);

test('purgeJob: hapus foto Cloudinary, video Cloudinary, dan foto Supabase Storage lalu catat hasilnya', async () => {
  const urls = [cld('SSES_T2_Dokumentasi/Storing/a'), cld('SSES_T2_Dokumentasi/Kegiatan/v', 'video', 'mov'), sto('uploads/1_Storing.jpg')];
  const f = fakeFetch({ begin: urls.map((url) => ({ url })) });
  const summary = await purgeJob('job-1', deps(f));

  assert.deepEqual(summary, { jobId: 'job-1', status: 'dikosongkan', deleted: 3, missing: 0, failed: 0, skipped: 0 });
  const deletes = f.calls.filter((c) => c.init.method === 'DELETE').map((c) => c.url);
  assert.ok(deletes.some((u) => u.includes('/resources/image/upload?public_ids[]=SSES_T2_Dokumentasi%2FStoring%2Fa')));
  assert.ok(deletes.some((u) => u.includes('/resources/video/upload?public_ids[]=SSES_T2_Dokumentasi%2FKegiatan%2Fv')));
  assert.ok(deletes.some((u) => u.endsWith('/storage/v1/object/dokumentasi')));
  const body = finishBody(f);
  assert.equal(body.p_job, 'job-1');
  assert.deepEqual(body.p_results.map((r) => r.status), ['dihapus', 'dihapus', 'dihapus']);
});

test('purgeJob: baris dihapus dulu (begin) sebelum berkas, hasil dicatat terakhir (finish)', async () => {
  const f = fakeFetch({ begin: [{ url: cld('x') }] });
  await purgeJob('job-2', deps(f));
  const order = f.calls.map((c) => (c.url.includes('begin_purge_job') ? 'begin' : c.url.includes('finish_purge_job') ? 'finish' : 'hapus'));
  assert.deepEqual(order, ['begin', 'hapus', 'finish']);
});

test('purgeJob: hanya URL yang dikembalikan database yang dihapus (media yang masih dipakai laporan lain tidak disentuh)', async () => {
  const f = fakeFetch({ begin: [] });
  const summary = await purgeJob('job-3', deps(f));
  assert.equal(f.calls.filter((c) => c.init.method === 'DELETE').length, 0);
  assert.equal(summary.deleted, 0);
});

test('purgeJob: berkas yang sudah tidak ada dicatat "tidak_ada", galat dicatat "gagal"', async () => {
  const f = fakeFetch({
    begin: [{ url: cld('ada') }, { url: cld('hilang') }, { url: sto('uploads/hilang.jpg') }],
    cloudinary: (ids) => json({ deleted: { ada: 'deleted', hilang: 'not_found' } }),
    storage: () => json([], 500),
    finish: () => json('sebagian'),
  });
  const summary = await purgeJob('job-4', deps(f));
  assert.deepEqual(summary, { jobId: 'job-4', status: 'sebagian', deleted: 1, missing: 1, failed: 1, skipped: 0 });
  const results = finishBody(f).p_results;
  assert.equal(results.find((r) => r.url.endsWith('hilang.jpg') && r.url.includes('cloudinary')).status, 'tidak_ada');
  assert.equal(results.find((r) => r.url.includes('supabase')).status, 'gagal');
});

test('purgeJob: URL di luar akun ini dilewati, tidak pernah dihapus', async () => {
  const f = fakeFetch({
    begin: [{ url: 'https://res.cloudinary.com/akun-lain/image/upload/v1/a.jpg' }, { url: 'https://contoh.com/a.jpg' }, { url: 'https://lain.supabase.co/storage/v1/object/public/dokumentasi/a.jpg' }],
  });
  const summary = await purgeJob('job-5', deps(f));
  assert.equal(summary.skipped, 3);
  assert.equal(f.calls.filter((c) => c.init.method === 'DELETE').length, 0);
});

test(`purgeJob: Cloudinary dipanggil paling banyak ${CLOUDINARY_DELETE_BATCH} public_id per panggilan`, async () => {
  const begin = Array.from({ length: 250 }, (_, i) => ({ url: cld(`f${i}`) }));
  const f = fakeFetch({ begin });
  const summary = await purgeJob('job-6', deps(f));
  const batches = f.calls.filter((c) => c.url.startsWith('https://api.cloudinary.com/')).map((c) => new URL(c.url).searchParams.getAll('public_ids[]').length);
  assert.deepEqual(batches, [100, 100, 50]);
  assert.equal(summary.deleted, 250);
});

test('purgeDueTrash: hanya job jatuh tempo/terputus; satu job galat tidak menghentikan yang lain', async () => {
  let n = 0;
  const f = fakeFetch({ jobs: [{ id: 'j1' }, { id: 'j2' }], begin: [{ url: cld('a') }] });
  const wrapped = async (url, init) => {
    if (String(url).endsWith('begin_purge_job') && ++n === 1) return json({ message: 'x' }, 500);
    return f(url, init);
  };
  const out = await purgeDueTrash(deps(wrapped));
  assert.equal(out.length, 2);
  assert.match(out[0].status, /^galat/);
  assert.equal(out[1].status, 'dikosongkan');
  const list = f.calls.find((c) => c.url.includes('storage_cleanup_jobs')).url;
  assert.match(decodeURIComponent(list), /status\.eq\.sampah,purge_after\.lte\.2026-11-05T20:00:00\.000Z/);
  assert.match(list, /status\.eq\.mengosongkan/);
  assert.match(list, /status\.eq\.sebagian/);
});

test('rahasia tidak pernah ada di URL atau pesan galat', async () => {
  const f = fakeFetch({ begin: [{ url: cld('a') }, { url: sto('b.jpg') }] });
  await purgeJob('job-7', deps(f));
  for (const c of f.calls) assert.ok(!c.url.includes(SECRET) && !c.url.includes(SERVICE), c.url);
  await assert.rejects(purgeJob('j', { env: { ...ENV, CLOUDINARY_API_SECRET: '' }, fetch: f, now: () => NOW }), (err) => {
    assert.match(err.message, /CLOUDINARY_API_SECRET/);
    assert.ok(!err.message.includes(SERVICE));
    return true;
  });
});

test('requireLoggedIn: tolak tanpa token / token ditolak Supabase, terima akun valid', async () => {
  const ok = async (url, init) => (init.headers.Authorization === 'Bearer token-valid-panjang-sekali' ? json({ id: 'u1', email: 'a@b.c' }) : json({}, 401));
  await assert.rejects(requireLoggedIn(undefined, deps(ok)), /Harus login/);
  await assert.rejects(requireLoggedIn('token-salah-panjang-sekali-x', deps(ok)), /Harus login/);
  assert.equal(await requireLoggedIn('token-valid-panjang-sekali', deps(ok)), 'a@b.c');
});

test('getCloudinaryUsage: memetakan angka pemakaian', async () => {
  const f = async () => json({ plan: 'Free', last_updated: '2026-10-28', credits: { usage: 1.54, limit: 25 }, storage: { usage: 197043665 }, bandwidth: { usage: 3 }, transformations: { usage: 1077 }, resources: 827, media_limits: { video_max_size_bytes: 104857600 } });
  const u = await getCloudinaryUsage(deps(f));
  assert.equal(u.creditsUsed, 1.54);
  assert.equal(u.storageBytes, 197043665);
  assert.equal(u.videoMaxBytes, 104857600);
});
