import assert from 'node:assert/strict';
import test from 'node:test';
import {
  signCloudinaryParams,
  createUploadTicket,
  confirmUpload,
  PreventiveServerError,
} from '../src/lib/server/preventiveUpload.server.ts';

const SECRET = 'rahasia-uji-jangan-bocor';
const ENV = {
  CLOUDINARY_CLOUD_NAME: 'wha6e7fj',
  CLOUDINARY_API_KEY: '123456789012345',
  CLOUDINARY_API_SECRET: SECRET,
  SUPABASE_URL: 'https://proyek.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-uji',
};
const EQ = 'ESE011000074751';
const wib = (s) => new Date(`${s}+07:00`);
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const ASSET_ROW = [{ asset_type: 'X-RAY KABIN', periods: ['D', 'W', 'M'], active: true }];

/** fetch palsu: mencatat semua panggilan, menjawab sesuai host/path. */
function fakeFetch(routes = {}) {
  const calls = [];
  const fn = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (u.includes('/rest/v1/prima_assets')) return (routes.asset ?? (() => json(ASSET_ROW)))(u, init);
    if (u.includes('api.cloudinary.com')) return (routes.cloudinary ?? (() => json({}, 404)))(u, init);
    if (u.includes('/rest/v1/rpc/record_preventive_photo')) return (routes.rpc ?? (() => json(null)))(u, init);
    throw new Error(`panggilan tak terduga: ${u}`);
  };
  fn.calls = calls;
  return fn;
}
const deps = (fetch, now) => ({ env: ENV, fetch, now: () => now });

// ---------- tanda tangan ----------
test('tanda tangan cocok dengan dua contoh resmi dokumentasi Cloudinary', () => {
  assert.equal(
    signCloudinaryParams({ eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop', public_id: 'sample_image', timestamp: 1315060510 }, 'abcd'),
    'bfd09f95f331f558cbd1320e67aa8d488770583e',
  );
  assert.equal(signCloudinaryParams({ timestamp: 1315060510 }, 'abcd'), 'a21ad0f63beb4de2e5575204b79ab90bffb02c10');
});

test('urutan kunci input tidak memengaruhi tanda tangan; boolean ditulis true/false', () => {
  const a = signCloudinaryParams({ timestamp: 1, overwrite: true, public_id: 'x' }, 's');
  const b = signCloudinaryParams({ public_id: 'x', overwrite: true, timestamp: 1 }, 's');
  assert.equal(a, b);
  assert.notEqual(a, signCloudinaryParams({ timestamp: 1, overwrite: false, public_id: 'x' }, 's'));
});

// ---------- tiket unggah ----------
test('tiket unggah DAILY: public_id, folder, dan tanda tangan benar', async () => {
  const f = fakeFetch();
  const now = wib('2026-10-20T08:30:00');
  const t = await createUploadTicket({ period: 'DAILY', equipmentNumber: EQ }, deps(f, now));
  const ts = Math.floor(now.getTime() / 1000);
  assert.equal(t.publicId, `PRIMA/PREVENTIVE/MAINTENANCE/DAILY/X-RAY KABIN/${EQ}_20261020`);
  assert.equal(t.assetFolder, 'PRIMA/PREVENTIVE/MAINTENANCE/DAILY/X-RAY KABIN');
  assert.equal(t.periodKey, '2026-10-20');
  assert.equal(t.cloudName, 'wha6e7fj');
  assert.equal(t.apiKey, ENV.CLOUDINARY_API_KEY);
  assert.equal(t.timestamp, ts);
  assert.equal(
    t.signature,
    signCloudinaryParams({ asset_folder: t.assetFolder, invalidate: true, overwrite: true, public_id: t.publicId, timestamp: ts }, SECRET),
  );
  assert.equal(t.uploadUrl, 'https://api.cloudinary.com/v1_1/wha6e7fj/image/upload');
});

test('rahasia API tidak pernah ikut dikirim ke klien', async () => {
  const t = await createUploadTicket({ period: 'DAILY', equipmentNumber: EQ }, deps(fakeFetch(), wib('2026-10-20T08:30:00')));
  const dump = JSON.stringify(t);
  assert.ok(!dump.includes(SECRET));
  assert.ok(!dump.includes(ENV.SUPABASE_SERVICE_ROLE_KEY));
});

test('WEEKLY memakai tanggal Minggu awal minggu, MONTHLY tanggal 1', async () => {
  const now = wib('2026-10-22T10:00:00'); // Kamis
  const w = await createUploadTicket({ period: 'WEEKLY', equipmentNumber: EQ }, deps(fakeFetch(), now));
  assert.equal(w.publicId, `PRIMA/PREVENTIVE/MAINTENANCE/WEEKLY/X-RAY KABIN/${EQ}_20261018`);
  const m = await createUploadTicket({ period: 'MONTHLY', equipmentNumber: EQ }, deps(fakeFetch(), now));
  assert.equal(m.publicId, `PRIMA/PREVENTIVE/MAINTENANCE/MONTHLY/X-RAY KABIN/${EQ}_20261001`);
});

test('Daily pukul 06.59 masih memakai tanggal kemarin', async () => {
  const t = await createUploadTicket({ period: 'DAILY', equipmentNumber: EQ }, deps(fakeFetch(), wib('2026-10-20T06:59:59')));
  assert.ok(t.publicId.endsWith(`${EQ}_20261019`));
});

test('aset dicari di database memakai kunci service-role dan nomor yang di-encode', async () => {
  const f = fakeFetch();
  await createUploadTicket({ period: 'DAILY', equipmentNumber: EQ }, deps(f, wib('2026-10-20T08:00:00')));
  const call = f.calls.find((c) => c.url.includes('/rest/v1/prima_assets'));
  assert.ok(call.url.startsWith('https://proyek.supabase.co/rest/v1/prima_assets?'));
  assert.ok(call.url.includes(`equipment_number=eq.${EQ}`));
  assert.equal(call.init.headers.apikey, ENV.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(call.init.headers.Authorization, `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`);
});

const rejects = async (promise, code) => {
  await assert.rejects(promise, (e) => {
    assert.ok(e instanceof PreventiveServerError, `harus PreventiveServerError, dapat ${e}`);
    assert.equal(e.code, code);
    assert.ok(!e.message.includes(SECRET));
    return true;
  });
};

test('input tidak valid ditolak sebelum menyentuh jaringan', async () => {
  const f = fakeFetch();
  const now = wib('2026-10-20T08:00:00');
  await rejects(createUploadTicket({ period: 'YEARLY', equipmentNumber: EQ }, deps(f, now)), 'bad_request');
  await rejects(createUploadTicket({ period: 'DAILY', equipmentNumber: 'ESE1/../x' }, deps(f, now)), 'bad_request');
  await rejects(createUploadTicket({ period: 'DAILY', equipmentNumber: '' }, deps(f, now)), 'bad_request');
  assert.equal(f.calls.length, 0);
});

test('aset tidak ada, nonaktif, atau tidak terjadwal pada periode itu ditolak', async () => {
  const now = wib('2026-10-20T08:00:00');
  await rejects(createUploadTicket({ period: 'DAILY', equipmentNumber: EQ }, deps(fakeFetch({ asset: () => json([]) }), now)), 'not_found');
  await rejects(
    createUploadTicket({ period: 'DAILY', equipmentNumber: EQ }, deps(fakeFetch({ asset: () => json([{ ...ASSET_ROW[0], active: false }]) }), now)),
    'not_found',
  );
  await rejects(
    createUploadTicket({ period: 'WEEKLY', equipmentNumber: EQ }, deps(fakeFetch({ asset: () => json([{ ...ASSET_ROW[0], periods: ['D', 'M'] }]) }), now)),
    'not_scheduled',
  );
});

test('konfigurasi server tidak lengkap menghasilkan galat config tanpa membocorkan nilai', async () => {
  const now = wib('2026-10-20T08:00:00');
  for (const missing of Object.keys(ENV)) {
    const env = { ...ENV };
    delete env[missing];
    await assert.rejects(
      createUploadTicket({ period: 'DAILY', equipmentNumber: EQ }, { env, fetch: fakeFetch(), now: () => now }),
      (e) => {
        assert.ok(e instanceof PreventiveServerError);
        assert.equal(e.code, 'config');
        assert.ok(!e.message.includes(SECRET));
        return true;
      },
      `env ${missing}`,
    );
  }
});

test('database tidak bisa dijangkau -> galat upstream', async () => {
  const now = wib('2026-10-20T08:00:00');
  await rejects(createUploadTicket({ period: 'DAILY', equipmentNumber: EQ }, deps(fakeFetch({ asset: () => json({ message: 'x' }, 500) }), now)), 'upstream');
});

// ---------- konfirmasi ----------
const NOW = wib('2026-10-20T08:30:00');
const NOW_S = Math.floor(NOW.getTime() / 1000);
const PUBLIC_ID = `PRIMA/PREVENTIVE/MAINTENANCE/DAILY/X-RAY KABIN/${EQ}_20261020`;
const FOLDER = 'PRIMA/PREVENTIVE/MAINTENANCE/DAILY/X-RAY KABIN';
const resource = (over = {}) => {
  const version = over.version ?? NOW_S - 20;
  return {
    public_id: PUBLIC_ID,
    version,
    asset_folder: FOLDER,
    format: 'jpg',
    width: 1280,
    height: 960,
    bytes: 250_000,
    secure_url: `https://res.cloudinary.com/wha6e7fj/image/upload/v${version}/${PUBLIC_ID}.jpg`,
    ...over,
  };
};

test('konfirmasi sukses: memverifikasi di Cloudinary lalu mencatat log lewat RPC', async () => {
  const f = fakeFetch({ cloudinary: () => json(resource()), rpc: () => json(null) });
  const r = await confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: NOW_S - 20 }, deps(f, NOW));
  assert.equal(r.ok, true);
  assert.equal(r.periodKey, '2026-10-20');
  assert.equal(r.version, NOW_S - 20);

  const cl = f.calls.find((c) => c.url.includes('api.cloudinary.com'));
  assert.equal(
    cl.url,
    `https://api.cloudinary.com/v1_1/wha6e7fj/resources/image/upload/PRIMA/PREVENTIVE/MAINTENANCE/DAILY/X-RAY%20KABIN/${EQ}_20261020`,
  );
  const basic = Buffer.from(`${ENV.CLOUDINARY_API_KEY}:${SECRET}`).toString('base64');
  assert.equal(cl.init.headers.Authorization, `Basic ${basic}`);

  const rpc = f.calls.find((c) => c.url.includes('/rpc/record_preventive_photo'));
  assert.equal(rpc.init.method, 'POST');
  assert.equal(rpc.init.headers.apikey, ENV.SUPABASE_SERVICE_ROLE_KEY);
  assert.deepEqual(JSON.parse(rpc.init.body), {
    p_period: 'DAILY',
    p_equipment: EQ,
    p_version: NOW_S - 20,
    p_secure_url: `https://res.cloudinary.com/wha6e7fj/image/upload/v${NOW_S - 20}/${PUBLIC_ID}.jpg`,
  });
});

test('URL yang dicatat berasal dari Cloudinary, bukan dari klien', async () => {
  const f = fakeFetch({ cloudinary: () => json(resource()) });
  // Klien mencoba menyelundupkan secureUrl sendiri: harus diabaikan.
  await confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: NOW_S - 20, secureUrl: 'https://evil.example/x.jpg' }, deps(f, NOW));
  const rpc = f.calls.find((c) => c.url.includes('/rpc/record_preventive_photo'));
  assert.ok(!rpc.init.body.includes('evil.example'));
});

test('versi dari klien harus sama dengan versi di Cloudinary (bukan foto lain/lama)', async () => {
  const f = fakeFetch({ cloudinary: () => json(resource({ version: NOW_S - 20 })) });
  await rejects(confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: NOW_S - 99 }, deps(f, NOW)), 'verify_failed');
  assert.ok(!f.calls.some((c) => c.url.includes('/rpc/')), 'tidak boleh mencatat log');
});

test('foto lebih lama dari 15 menit tidak dianggap unggahan baru', async () => {
  const old = NOW_S - 16 * 60;
  const f = fakeFetch({ cloudinary: () => json(resource({ version: old })) });
  await rejects(confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: old }, deps(f, NOW)), 'verify_failed');
  assert.ok(!f.calls.some((c) => c.url.includes('/rpc/')));
});

test('folder atau public_id di Cloudinary tidak cocok -> ditolak', async () => {
  await rejects(
    confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: NOW_S - 20 }, deps(fakeFetch({ cloudinary: () => json(resource({ asset_folder: 'PRIMA/lain' })) }), NOW)),
    'verify_failed',
  );
  await rejects(
    confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: NOW_S - 20 }, deps(fakeFetch({ cloudinary: () => json(resource({ public_id: 'lain/lagi' })) }), NOW)),
    'verify_failed',
  );
});

test('foto belum ada di Cloudinary (404) -> ditolak, tidak mencatat log', async () => {
  const f = fakeFetch({ cloudinary: () => json({ error: { message: 'Resource not found' } }, 404) });
  await rejects(confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: NOW_S - 20 }, deps(f, NOW)), 'verify_failed');
  assert.ok(!f.calls.some((c) => c.url.includes('/rpc/')));
});

test('periode berganti antara unggah dan konfirmasi -> foto tidak dicatat ke periode baru', async () => {
  // Unggah dilakukan 06.59.50 (kunci 2026-10-19); konfirmasi 07.00.05 menghitung kunci 2026-10-20.
  const confirmAt = wib('2026-10-20T07:00:05');
  const f = fakeFetch({ cloudinary: () => json({ error: { message: 'Resource not found' } }, 404) });
  await rejects(
    confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: Math.floor(wib('2026-10-20T06:59:50').getTime() / 1000) }, deps(f, confirmAt)),
    'verify_failed',
  );
  assert.ok(!f.calls.some((c) => c.url.includes('/rpc/')));
});

test('RPC gagal -> galat upstream, tidak pernah mengembalikan ok', async () => {
  const f = fakeFetch({ cloudinary: () => json(resource()), rpc: () => json({ message: 'url tidak valid' }, 400) });
  await rejects(confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: NOW_S - 20 }, deps(f, NOW)), 'record_failed');
});

test('versi bukan bilangan bulat positif ditolak sebelum jaringan', async () => {
  const f = fakeFetch();
  for (const version of [0, -1, 1.5, NaN, '123', null, undefined]) {
    await rejects(confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version }, deps(f, NOW)), 'bad_request');
  }
  assert.equal(f.calls.length, 0);
});

test('foto yang tidak terkompresi (format/dimensi/ukuran) ditolak di server, tidak dicatat', async () => {
  const bad = [
    { format: 'png' },
    { format: 'heic' },
    { width: 4032, height: 3024 },
    { width: 1000, height: 3000 },
    { bytes: 5_000_000 },
    { bytes: undefined },
    { width: undefined },
  ];
  for (const over of bad) {
    const f = fakeFetch({ cloudinary: () => json(resource(over)) });
    await rejects(confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: NOW_S - 20 }, deps(f, NOW)), 'verify_failed');
    assert.ok(!f.calls.some((c) => c.url.includes('/rpc/')), JSON.stringify(over));
  }
});

test('foto terkompresi sesuai batas (<=1280 px, JPEG, <=2 MB) diterima', async () => {
  for (const over of [{ width: 1280, height: 720, bytes: 1_999_999 }, { width: 600, height: 1280, bytes: 90_000 }, { format: 'jpeg' }]) {
    const f = fakeFetch({ cloudinary: () => json(resource(over)) });
    const r = await confirmUpload({ period: 'DAILY', equipmentNumber: EQ, version: NOW_S - 20 }, deps(f, NOW));
    assert.equal(r.ok, true, JSON.stringify(over));
  }
});
