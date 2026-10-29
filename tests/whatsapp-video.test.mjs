import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildUncategorizedVideoPublicId,
  buildWhatsAppVideoUrl,
  uploadChunkRanges,
  whatsappVideoFileName,
  WHATSAPP_VIDEO_TRANSFORM,
} from '../src/lib/utils/whatsappVideo.ts';

test('buildWhatsAppVideoUrl: sisipkan transformasi H.264 dan ganti ekstensi ke .mp4', () => {
  const url = 'https://res.cloudinary.com/demo/video/upload/v1793249207/SSES_T2_Dokumentasi/Kegiatan/Kegiatan_2026-10-29_094100.mov';
  assert.equal(
    buildWhatsAppVideoUrl(url),
    `https://res.cloudinary.com/demo/video/upload/${WHATSAPP_VIDEO_TRANSFORM}/v1793249207/SSES_T2_Dokumentasi/Kegiatan/Kegiatan_2026-10-29_094100.mp4`,
  );
  assert.match(WHATSAPP_VIDEO_TRANSFORM, /vc_h264/);
  assert.match(WHATSAPP_VIDEO_TRANSFORM, /ac_aac/);
});

test('buildWhatsAppVideoUrl: menolak URL yang bukan video Cloudinary', () => {
  assert.throws(() => buildWhatsAppVideoUrl('https://res.cloudinary.com/demo/image/upload/v1/a.jpg'));
});

test('whatsappVideoFileName: nama asli dengan ekstensi .mp4', () => {
  assert.equal(whatsappVideoFileName('IMG_1234.MOV'), 'IMG_1234.mp4');
  assert.equal(whatsappVideoFileName('rekaman'), 'rekaman.mp4');
  assert.equal(whatsappVideoFileName('.mov'), 'video.mp4');
});

test('uploadChunkRanges: potongan 20 MB, potongan terakhir sisa', () => {
  const MB = 1024 * 1024;
  assert.deepEqual(uploadChunkRanges(5 * MB), [[0, 5 * MB]]);
  assert.deepEqual(uploadChunkRanges(45 * MB), [[0, 20 * MB], [20 * MB, 40 * MB], [40 * MB, 45 * MB]]);
  assert.deepEqual(uploadChunkRanges(0), []);
});

test('buildUncategorizedVideoPublicId: unik per unggahan walau nama berkas asli sama', () => {
  const a = buildUncategorizedVideoPublicId('SSES_T2_Dokumentasi', 1793249206000, 0.123456789);
  const b = buildUncategorizedVideoPublicId('SSES_T2_Dokumentasi', 1793249206000, 0.987654321);
  assert.match(a, /^SSES_T2_Dokumentasi\/Video_1793249206000_[a-z0-9]{1,6}$/);
  assert.notEqual(a, b);
});
