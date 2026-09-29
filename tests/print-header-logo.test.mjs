import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('Kop cetak Shift Report memakai logo Injourney Airports, bukan teks', () => {
  const doc = read('src/components/features/shift-report/ShiftReportPrintDocument.tsx');

  // Teks lama tidak boleh kembali di kop mana pun
  assert.doesNotMatch(doc, /INJOURNEY<br\s*\/?>AIRPORTS/);

  // Ada dua kop (lembar utama dan lembar serviceability), keduanya memakai logo yang sama
  assert.equal((doc.match(/<InjourneyLogo\s*\/>/g) || []).length, 2);
});

test('Logo ditanam sebagai data URI agar tidak hilang diam-diam dari PDF', () => {
  const doc = read('src/components/features/shift-report/ShiftReportPrintDocument.tsx');

  // Ekspor PDF (prepareImagesForPdf) mengunduh ulang <img> bersumber URL dan
  // menyembunyikannya bila gagal dalam 2 detik. Sumber data: dilewati.
  assert.match(doc, /logo-injourney-airports\.webp\?inline/);

  const tab = read('src/components/features/TabShiftReport.tsx');
  assert.match(tab, /src\.startsWith\('data:'\)\) return/);
});

test('Berkas logo ada dan ukurannya wajar untuk ditanam di bundel', () => {
  const file = new URL('../src/assets/logo-injourney-airports.webp', import.meta.url);
  assert.ok(existsSync(file), 'berkas logo harus ada');
  assert.ok(statSync(file).size < 40 * 1024, 'logo yang ditanam di bundel JS sebaiknya di bawah 40 KB');
});

test('Logo punya teks alternatif untuk pembaca layar', () => {
  const doc = read('src/components/features/shift-report/ShiftReportPrintDocument.tsx');
  assert.match(doc, /alt="Injourney Airports"/);
});
