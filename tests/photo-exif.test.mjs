import assert from 'node:assert/strict';
import test from 'node:test';
import { readExifTakenAt, photoDateWarning, whatsappNameRange } from '../src/lib/utils/photoExif.ts';

/** JPEG minimal berisi APP1/Exif dengan DateTimeOriginal (ExifIFD) atau hanya DateTime (IFD0). */
const buildJpeg = (stamp, { tag = 'original', little = true } = {}) => {
  const ascii = Buffer.from(stamp + '\0', 'latin1'); // 20 byte
  const tiff = Buffer.alloc(8 + 2 + 12 + 4 + 2 + 12 + 4 + 20);
  const w16 = (o, v) => (little ? tiff.writeUInt16LE(v, o) : tiff.writeUInt16BE(v, o));
  const w32 = (o, v) => (little ? tiff.writeUInt32LE(v, o) : tiff.writeUInt32BE(v, o));
  tiff.write(little ? 'II' : 'MM', 0, 'latin1'); w16(2, 42); w32(4, 8);
  // IFD0: 1 entri
  w16(8, 1);
  const exifIfdOffset = 8 + 2 + 12 + 4;
  const dataOffset = exifIfdOffset + 2 + 12 + 4;
  if (tag === 'original') { w16(10, 0x8769); w16(12, 4); w32(14, 1); w32(18, exifIfdOffset); }
  else { w16(10, 0x0132); w16(12, 2); w32(14, 20); w32(18, dataOffset); }
  w32(22, 0);
  // ExifIFD: 1 entri DateTimeOriginal
  w16(exifIfdOffset, 1);
  w16(exifIfdOffset + 2, 0x9003); w16(exifIfdOffset + 4, 2); w32(exifIfdOffset + 6, 20); w32(exifIfdOffset + 10, dataOffset);
  ascii.copy(tiff, dataOffset);
  const body = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const seg = Buffer.alloc(4); seg.writeUInt16BE(0xffe1, 0); seg.writeUInt16BE(body.length + 2, 2);
  const buf = Buffer.concat([Buffer.from([0xff, 0xd8]), seg, body, Buffer.from([0xff, 0xda, 0, 2, 0xff, 0xd9])]);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
};

// 20 Okt 2026 09:30:00 WIB = 02:30:00 UTC
const WIB_0930 = Date.UTC(2026, 9, 20, 2, 30, 0);

test('membaca DateTimeOriginal (little & big endian) sebagai WIB', () => {
  assert.equal(readExifTakenAt(buildJpeg('2026:10:20 09:30:00')), WIB_0930);
  assert.equal(readExifTakenAt(buildJpeg('2026:10:20 09:30:00', { little: false })), WIB_0930);
});

test('cadangan ke DateTime IFD0 bila DateTimeOriginal tidak ada', () => {
  assert.equal(readExifTakenAt(buildJpeg('2026:10:20 09:30:00', { tag: 'datetime' })), WIB_0930);
});

test('bukan JPEG / tanpa EXIF / rusak -> null, tidak melempar', () => {
  assert.equal(readExifTakenAt(new ArrayBuffer(0)), null);
  assert.equal(readExifTakenAt(Buffer.from('PNG....').buffer), null);
  assert.equal(readExifTakenAt(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]).buffer), null);
  assert.equal(readExifTakenAt(buildJpeg('0000:00:00 00:00:00')), null);
  const truncated = buildJpeg('2026:10:20 09:30:00').slice(0, 40);
  assert.doesNotThrow(() => readExifTakenAt(truncated));
});

// periode DAILY 2026-10-20: 20 Okt 07.00 WIB .. 21 Okt 07.00 WIB
const NEXT = Date.UTC(2026, 9, 21, 0, 0, 0);

test('foto di dalam periode tidak diberi peringatan', () => {
  assert.equal(photoDateWarning(WIB_0930, '2026-10-20', NEXT), null);
});

test('toleransi 1 jam di kedua tepi periode', () => {
  assert.equal(photoDateWarning(Date.UTC(2026, 9, 19, 23, 30), '2026-10-20', NEXT), null);
  assert.equal(photoDateWarning(NEXT + 30 * 60 * 1000, '2026-10-20', NEXT), null);
});

test('foto lama diberi peringatan dengan tanggalnya', () => {
  const w = photoDateWarning(Date.UTC(2026, 9, 10, 2, 0), '2026-10-20', NEXT);
  assert.match(w, /di luar periode/);
  assert.match(w, /WIB/);
});

test('foto tanpa tanggal (screenshot/HEIC) diberi peringatan, bukan penolakan', () => {
  assert.match(photoDateWarning(null, '2026-10-20', NEXT), /tidak memuat tanggal/);
});

test('HEIC tanpa tanggal terbaca tidak diberi peringatan, tetapi HEIC yang tanggalnya terbaca tetap diperiksa', () => {
  assert.equal(photoDateWarning(null, '2026-10-20', NEXT, { heic: true }), null);
  assert.match(photoDateWarning(Date.UTC(2026, 9, 10, 2, 0), '2026-10-20', NEXT, { heic: true }), /di luar periode/);
});

test('whatsappNameRange: nama berkas WA diurai ke rentang WIB, selain itu null', () => {
  assert.deepEqual(whatsappNameRange('IMG-20261020-WA0001.jpg'), [Date.UTC(2026, 9, 19, 17), Date.UTC(2026, 9, 20, 17)]);
  assert.deepEqual(whatsappNameRange('WhatsApp Image 2026-10-20 at 09.30.15.jpeg'), [Date.UTC(2026, 9, 20, 2, 30, 15), Date.UTC(2026, 9, 20, 2, 30, 15)]);
  assert.equal(whatsappNameRange('IMG_20261020_093000.jpg'), null);
  assert.equal(whatsappNameRange('IMG-20261345-WA0001.jpg'), null);
  assert.equal(whatsappNameRange(''), null);
});

test('foto WA tanpa EXIF: tanggal pada nama berkas dipakai; dalam periode tanpa peringatan, di luar periode diperingatkan', () => {
  assert.equal(photoDateWarning(null, '2026-10-20', NEXT, { nameRange: whatsappNameRange('IMG-20261020-WA0001.jpg') }), null);
  assert.equal(photoDateWarning(null, '2026-10-20', NEXT, { nameRange: whatsappNameRange('IMG-20261021-WA0001.jpg') }), null, 'hari yang beririsan dengan periode');
  assert.match(photoDateWarning(null, '2026-10-20', NEXT, { nameRange: whatsappNameRange('IMG-20261010-WA0001.jpg') }), /Nama berkas WhatsApp.*di luar periode/);
});

test('EXIF tetap didahulukan atas nama berkas WA', () => {
  assert.match(photoDateWarning(Date.UTC(2026, 9, 10, 2, 0), '2026-10-20', NEXT, { nameRange: whatsappNameRange('IMG-20261020-WA0001.jpg') }), /Foto diambil/);
});
