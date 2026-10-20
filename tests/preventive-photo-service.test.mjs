import assert from 'node:assert/strict';
import test from 'node:test';
import { uploadPreventivePhoto, PreventiveUploadError } from '../src/lib/services/preventivePhotoService.ts';

const EQ = 'ESE011000074751';
const TICKET = {
  uploadUrl: 'https://api.cloudinary.com/v1_1/wha6e7fj/image/upload',
  cloudName: 'wha6e7fj',
  apiKey: '123',
  timestamp: 1790000000,
  signature: 'sig-abc',
  publicId: `PRIMA/PREVENTIVE/MAINTENANCE/DAILY/X-RAY KABIN/${EQ}_20261020`,
  assetFolder: 'PRIMA/PREVENTIVE/MAINTENANCE/DAILY/X-RAY KABIN',
  periodKey: '2026-10-20',
  overwrite: true,
  invalidate: true,
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const photo = () => new File([new Uint8Array([1, 2, 3])], 'kamera.jpg', { type: 'image/jpeg' });

function makeDeps(over = {}) {
  const log = [];
  const deps = {
    compress: async (f) => {
      log.push('compress');
      return new Blob([new Uint8Array([9, 9])], { type: 'image/jpeg' });
    },
    getTicket: async (input) => {
      log.push('ticket');
      deps.ticketInput = input;
      return TICKET;
    },
    confirm: async (input) => {
      log.push('confirm');
      deps.confirmInput = input;
      return { ok: true, periodKey: '2026-10-20', version: 1790000005, secureUrl: 'https://res.cloudinary.com/wha6e7fj/image/upload/v1790000005/x.jpg' };
    },
    fetch: async (url, init) => {
      log.push('upload');
      deps.uploadUrl = url;
      deps.uploadInit = init;
      return json({ version: 1790000005, secure_url: 'https://res.cloudinary.com/...' });
    },
    ...over,
  };
  deps.log = log;
  return deps;
}

const failsAt = async (promise, step) =>
  assert.rejects(promise, (e) => {
    assert.ok(e instanceof PreventiveUploadError, `harus PreventiveUploadError, dapat ${e}`);
    assert.equal(e.step, step);
    assert.ok(e.message.length > 0);
    return true;
  });

test('alur sukses: kompres -> tiket -> unggah langsung ke Cloudinary -> konfirmasi', async () => {
  const deps = makeDeps();
  const result = await uploadPreventivePhoto('DAILY', EQ, photo(), deps);
  assert.deepEqual(deps.log, ['compress', 'ticket', 'upload', 'confirm']);
  assert.equal(result.ok, true);
  assert.deepEqual(deps.ticketInput, { period: 'DAILY', equipmentNumber: EQ });
  assert.deepEqual(deps.confirmInput, { period: 'DAILY', equipmentNumber: EQ, version: 1790000005 });
});

test('form unggah memuat tepat parameter yang ditandatangani + file, api_key, signature', async () => {
  const deps = makeDeps();
  await uploadPreventivePhoto('DAILY', EQ, photo(), deps);
  assert.equal(deps.uploadUrl, TICKET.uploadUrl);
  assert.equal(deps.uploadInit.method, 'POST');
  const form = deps.uploadInit.body;
  assert.ok(form instanceof FormData);
  const fields = Object.fromEntries([...form.entries()].filter(([k]) => k !== 'file'));
  assert.deepEqual(fields, {
    api_key: '123',
    timestamp: '1790000000',
    signature: 'sig-abc',
    public_id: TICKET.publicId,
    asset_folder: TICKET.assetFolder,
    overwrite: 'true',
    invalidate: 'true',
  });
  const file = form.get('file');
  assert.ok(file instanceof Blob);
  assert.equal(file.size, 2, 'yang diunggah adalah hasil kompresi, bukan berkas asli');
});

test('gagal kompres -> berhenti sebelum meminta tiket', async () => {
  const deps = makeDeps({ compress: async () => { throw new Error('rusak'); } });
  await failsAt(uploadPreventivePhoto('DAILY', EQ, photo(), deps), 'compress');
  assert.ok(!deps.log.includes('ticket'));
});

test('type kosong (pemilih foto Android tertentu) tidak ditolak di awal: dekode yang menentukan', async () => {
  const deps = makeDeps();
  const r = await uploadPreventivePhoto('DAILY', EQ, new File([new Uint8Array([1, 2, 3])], 'IMG_1.jpg', { type: '' }), deps);
  assert.equal(r.ok, true);
});

test('berkas bukan gambar ditolak', async () => {
  const deps = makeDeps();
  await failsAt(uploadPreventivePhoto('DAILY', EQ, new File(['x'], 'a.pdf', { type: 'application/pdf' }), deps), 'compress');
  assert.deepEqual(deps.log, []);
});

test('gagal meminta tiket -> tidak ada unggahan', async () => {
  const deps = makeDeps({ getTicket: async () => { throw new Error('Peralatan tidak ada di daftar PRIMA'); } });
  await assert.rejects(uploadPreventivePhoto('DAILY', EQ, photo(), deps), (e) => {
    assert.equal(e.step, 'ticket');
    assert.match(e.message, /daftar PRIMA/);
    return true;
  });
  assert.ok(!deps.log.includes('upload'));
});

test('Cloudinary menolak (HTTP 400) -> gagal di langkah upload, konfirmasi tidak dipanggil', async () => {
  const deps = makeDeps({ fetch: async () => json({ error: { message: 'Invalid Signature' } }, 400) });
  await assert.rejects(uploadPreventivePhoto('DAILY', EQ, photo(), deps), (e) => {
    assert.equal(e.step, 'upload');
    assert.match(e.message, /Invalid Signature/);
    return true;
  });
  assert.ok(!deps.log.includes('confirm'));
});

test('jaringan putus saat unggah -> gagal di langkah upload', async () => {
  const deps = makeDeps({ fetch: async () => { throw new TypeError('Failed to fetch'); } });
  await failsAt(uploadPreventivePhoto('DAILY', EQ, photo(), deps), 'upload');
  assert.ok(!deps.log.includes('confirm'));
});

test('balasan Cloudinary tanpa versi yang valid dianggap gagal', async () => {
  for (const body of [{}, { version: 'abc' }, { version: 0 }, { version: 1.5 }]) {
    const deps = makeDeps({ fetch: async () => json(body) });
    await failsAt(uploadPreventivePhoto('DAILY', EQ, photo(), deps), 'upload');
    assert.ok(!deps.log.includes('confirm'));
  }
});

test('konfirmasi gagal -> gagal di langkah confirm dengan pesan server (foto TIDAK dianggap tersimpan)', async () => {
  const deps = makeDeps({ confirm: async () => { throw new Error('Foto terunggah tetapi gagal dicatat. Coba lagi.'); } });
  await assert.rejects(uploadPreventivePhoto('DAILY', EQ, photo(), deps), (e) => {
    assert.equal(e.step, 'confirm');
    assert.match(e.message, /gagal dicatat/);
    return true;
  });
});

test('Retry = memanggil ulang fungsi yang sama dengan berkas yang sama; tidak ada fallback ke jalur lain', async () => {
  let attempts = 0;
  const deps = makeDeps({
    fetch: async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError('Failed to fetch');
      return json({ version: 1790000005 });
    },
  });
  const file = photo();
  await failsAt(uploadPreventivePhoto('DAILY', EQ, file, deps), 'upload');
  const ok = await uploadPreventivePhoto('DAILY', EQ, file, deps);
  assert.equal(ok.ok, true);
  assert.equal(attempts, 2);
});

test('hasil kompresi yang kosong atau bukan JPEG ditolak: foto asli tidak pernah dikirim', async () => {
  for (const out of [new Blob([], { type: 'image/jpeg' }), new Blob([new Uint8Array([1])], { type: 'image/png' }), new Blob([new Uint8Array([1])])]) {
    const deps = makeDeps({ compress: async () => out });
    await failsAt(uploadPreventivePhoto('DAILY', EQ, photo(), deps), 'compress');
    assert.ok(!deps.log.includes('ticket') && !deps.log.includes('upload'));
  }
});

test('yang diunggah selalu keluaran compress, bukan berkas asli', async () => {
  const original = new File([new Uint8Array(500_000)], 'besar.jpg', { type: 'image/jpeg' });
  const deps = makeDeps();
  await uploadPreventivePhoto('DAILY', EQ, original, deps);
  const sent = deps.uploadInit.body.get('file');
  assert.equal(sent.size, 2);
  assert.notEqual(sent.size, original.size);
});
