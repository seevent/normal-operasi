import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('fetchOnDutyPersonnel: nama ringkas tetap untuk laporan harian, nama lengkap tersedia untuk BA', () => {
  const src = read('src/lib/services/operationalReportService.ts');
  assert.match(src, /name: formatNamaPersonel\(toTitleCase\(/);
  assert.match(src, /fullName: toTitleCase\(/);
});

test('BA Serah Terima memakai nama lengkap untuk pilihan personel dan lookup jabatan', () => {
  const src = read('src/components/features/TabBASerahTerima.tsx');
  assert.match(src, /personelFullName\(item\) === name/);
  assert.match(src, /value=\{personelFullName\(p\)\}/g);
  assert.doesNotMatch(src, /value=\{p\.name\}/);
});

test('Maskot tidak ikut tercetak: kedua root fixed memakai print:hidden', () => {
  const src = read('src/components/features/AntigravityPet.tsx');
  const fixedRoots = src.match(/className=[{`"][^\n]*\bfixed\b[^\n]*/g) || [];
  assert.equal(fixedRoots.length, 2, 'ada dua elemen fixed (minimize dan normal)');
  for (const line of fixedRoots) assert.match(line, /print:hidden/, line);
});

test('BA Serah Terima tidak memanggil setter state yang tidak dideklarasikan (setCollageAnnotation)', () => {
  const src = read('src/components/features/TabBASerahTerima.tsx');
  assert.doesNotMatch(src, /setCollageAnnotation/);
});
