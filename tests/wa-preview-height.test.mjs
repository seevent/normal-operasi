import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// Kotak preview harus memanjang sesuai isi pesan, bukan dibatasi tinggi dengan scroll internal.
const previewBox = (source, marker) => {
  const i = source.indexOf(marker);
  assert.ok(i !== -1, `penanda ${marker} tidak ditemukan`);
  return source.slice(i, source.indexOf('>', source.indexOf('className=', i)));
};

test('Preview WA tab Kalibrasi mengikuti panjang pesan (tanpa max-h / scroll internal)', () => {
  const box = previewBox(read('src/components/features/TabKalibrasi.tsx'), 'Preview Laporan Kalibrasi');
  assert.doesNotMatch(box, /max-h-/);
  assert.doesNotMatch(box, /overflow-y-auto/);
});

test('Preview WA tab Report mengikuti panjang pesan (tanpa max-h / scroll internal)', () => {
  const tab = read('src/components/features/TabShiftReport.tsx');
  const i = tab.indexOf('data-testid="wa-preview"');
  const box = tab.slice(i, tab.indexOf('>', tab.indexOf('className=', i)));
  assert.doesNotMatch(box, /max-h-/);
  assert.doesNotMatch(box, /overflow-y-auto/);
});
