import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  DOCUMENTATION_CATEGORIES,
  buildDocumentationBaseName,
  buildDocumentationFolder,
  buildDocumentationPhotoTarget,
  isDocumentationCategory,
} from '../src/lib/utils/documentationPhoto.ts';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

// Date dibuat dari komponen lokal, sama seperti yang dibaca helper (zona waktu lokal).
const at = (y, mo, d, h, mi, s) => new Date(y, mo - 1, d, h, mi, s);

test('folder tiap jenis berada di bawah SSES_T2_Dokumentasi', () => {
  assert.deepEqual([...DOCUMENTATION_CATEGORIES], ['Kalibrasi', 'Storing', 'Perbaikan', 'Kegiatan']);
  for (const c of DOCUMENTATION_CATEGORIES) {
    assert.equal(buildDocumentationFolder(c), `SSES_T2_Dokumentasi/${c}`);
  }
});

test('nama file mengikuti {Jenis}_YYYY-MM-DD_HHmmss', () => {
  assert.equal(buildDocumentationBaseName('Kalibrasi', at(2026, 10, 24, 16, 15, 46)), 'Kalibrasi_2026-10-24_161546');
  assert.equal(buildDocumentationBaseName('Storing', at(2026, 1, 2, 3, 4, 5)), 'Storing_2026-01-02_030405');
  assert.equal(buildDocumentationBaseName('Kegiatan', at(2026, 12, 31, 23, 59, 59)), 'Kegiatan_2026-12-31_235959');
});

test('public_id memuat folder dan tidak berisi spasi atau karakter bermasalah', () => {
  const { folder, fileName, publicId } = buildDocumentationPhotoTarget('Perbaikan', at(2026, 10, 24, 16, 15, 46));
  assert.equal(folder, 'SSES_T2_Dokumentasi/Perbaikan');
  assert.equal(fileName, 'Perbaikan_2026-10-24_161546');
  assert.equal(publicId, 'SSES_T2_Dokumentasi/Perbaikan/Perbaikan_2026-10-24_161546');
  assert.match(publicId, /^[A-Za-z0-9_\-/]+$/);
});

test('akhiran urutan hanya muncul bila terjadi tabrakan', () => {
  const used = new Set();
  const t = at(2026, 10, 24, 16, 15, 46);
  assert.equal(buildDocumentationPhotoTarget('Kalibrasi', t, used).fileName, 'Kalibrasi_2026-10-24_161546');
  assert.equal(buildDocumentationPhotoTarget('Kalibrasi', t, used).fileName, 'Kalibrasi_2026-10-24_161546_2');
  assert.equal(buildDocumentationPhotoTarget('Kalibrasi', t, used).fileName, 'Kalibrasi_2026-10-24_161546_3');
  // detik berbeda atau jenis berbeda tidak bertabrakan
  assert.equal(buildDocumentationPhotoTarget('Kalibrasi', at(2026, 10, 24, 16, 15, 47), used).fileName, 'Kalibrasi_2026-10-24_161547');
  assert.equal(buildDocumentationPhotoTarget('Storing', t, used).fileName, 'Storing_2026-10-24_161546');
});

test('jenis atau tanggal tidak valid ditolak', () => {
  assert.equal(isDocumentationCategory('Preventive'), false);
  assert.equal(isDocumentationCategory('Kalibrasi'), true);
  assert.throws(() => buildDocumentationFolder('Preventive'));
  assert.throws(() => buildDocumentationBaseName('Kalibrasi', new Date('x')));
});

test('keempat tab (dan form CRUD Report) mengunggah dengan jenis foto masing-masing', () => {
  const expectations = {
    'TabKalibrasi.tsx': /category: 'Kalibrasi'/,
    'TabStoring.tsx': /category: 'Storing'/,
    'TabPerbaikan.tsx': /category: 'Perbaikan'/,
    'TabKegiatan.tsx': /category: 'Kegiatan'/,
  };
  for (const [file, pattern] of Object.entries(expectations)) {
    assert.match(readProjectFile(`src/components/features/${file}`), pattern, file);
  }
  assert.match(readProjectFile('src/components/features/TabShiftReport.tsx'), /category: crudForm\.jenis/);
});

test('cloudinaryService mengirim asset_folder + public_id untuk jenis dokumentasi', () => {
  const service = readProjectFile('src/lib/services/cloudinaryService.ts');
  assert.match(service, /nextDocumentationPhotoTarget/);
  assert.match(service, /formData\.append\('asset_folder'/);
  assert.match(service, /formData\.append\('public_id'/);
});
