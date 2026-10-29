import assert from 'node:assert/strict';
import test from 'node:test';
import { mediaRefFromUrl } from '../src/lib/utils/mediaRefs.ts';

test('Cloudinary image dengan versi dan folder', () => {
  assert.deepEqual(
    mediaRefFromUrl('https://res.cloudinary.com/wha6e7fj/image/upload/v1793156064/SSES_T2_Dokumentasi/Storing/Storing_2026-10-28_095414.jpg'),
    { provider: 'cloudinary', cloudName: 'wha6e7fj', resourceType: 'image', publicId: 'SSES_T2_Dokumentasi/Storing/Storing_2026-10-28_095414' },
  );
});

test('Cloudinary: spasi %20 pada folder (Preventive) didekode', () => {
  const ref = mediaRefFromUrl('https://res.cloudinary.com/wha6e7fj/image/upload/v1793000000/PRIMA/PREVENTIVE/MAINTENANCE/DAILY/ETD%20DESKTOP/ESE011000074751_2026-10-20.jpg');
  assert.equal(ref.publicId, 'PRIMA/PREVENTIVE/MAINTENANCE/DAILY/ETD DESKTOP/ESE011000074751_2026-10-20');
});

test('Cloudinary video tanpa versi, lewati segmen transformasi', () => {
  assert.deepEqual(
    mediaRefFromUrl('https://res.cloudinary.com/wha6e7fj/video/upload/c_limit,w_1280,h_1280/vc_h264:main:3.1,ac_aac,q_auto/SSES_T2_Dokumentasi/Kegiatan/Kegiatan_2026-10-29_094100.mp4'),
    { provider: 'cloudinary', cloudName: 'wha6e7fj', resourceType: 'video', publicId: 'SSES_T2_Dokumentasi/Kegiatan/Kegiatan_2026-10-29_094100' },
  );
});

test('Cloudinary tanpa folder dan tanpa versi', () => {
  assert.equal(mediaRefFromUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg').publicId, 'sample');
});

test('Supabase Storage publik', () => {
  assert.deepEqual(
    mediaRefFromUrl('https://mpwemvdedpihlwghdmpa.supabase.co/storage/v1/object/public/dokumentasi/uploads/1793156064072_Storing_2026-10-28_095414.jpg'),
    { provider: 'supabase', origin: 'https://mpwemvdedpihlwghdmpa.supabase.co', bucket: 'dokumentasi', path: 'uploads/1793156064072_Storing_2026-10-28_095414.jpg' },
  );
});

test('URL lain atau rusak tidak dianggap berkas aplikasi', () => {
  assert.deepEqual(mediaRefFromUrl('https://example.com/foto.jpg'), { provider: 'lain' });
  assert.deepEqual(mediaRefFromUrl('bukan url'), { provider: 'lain' });
  assert.deepEqual(mediaRefFromUrl('https://res.cloudinary.com/demo/image/fetch/https://x.com/a.jpg'), { provider: 'lain' });
});
