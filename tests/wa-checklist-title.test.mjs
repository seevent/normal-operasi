import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/lib/utils/waGenerator.ts', import.meta.url), 'utf8');

test('Judul WA Checklist dan Storing sama-sama bercetak tebal', () => {
  const checklist = source.slice(source.indexOf('export const generateWA_Checklist'));
  assert.match(checklist, /let result = `\*KEGIATAN STORING PERALATAN SSES T2\*\\n`;/);
  // tidak boleh ada judul polos (tanpa tanda bintang) di pesan manapun
  assert.doesNotMatch(source, /(^|[^*])KEGIATAN STORING PERALATAN SSES T2(?!\*)/);
});

test('Pesan WA Storing: baris kosong setelah judul, sebelum Hasil, dan sebelum Supervisor', () => {
  const storing = source.slice(source.indexOf('export const generateWA_Storing'), source.indexOf('export const generateWA_Checklist'));
  assert.match(storing, /\*KEGIATAN STORING PERALATAN SSES T2\*\n\nHari\/Tanggal\/Jam/);
  assert.match(storing, /Lokasi : \$\{locString\}\n\nHasil : /);
  assert.match(storing, /supervisorAvsecLine = '\\n\\n' \+ lines\.join\('\\n'\)/);
});
