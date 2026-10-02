import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/lib/utils/waGenerator.ts', import.meta.url), 'utf8');

test('Judul WA Kalibrasi memakai awalan LAPORAN', () => {
  assert.match(source, /'\*LAPORAN PREVENTIVE MAINTENANCE & KALIBRASI SSES T2\*'/);
  assert.doesNotMatch(source, /'\*PREVENTIVE MAINTENANCE & KALIBRASI SSES T2\*'/);
});

test('Pesan WA Kalibrasi: baris kosong setelah judul', () => {
  assert.match(source, /let msg = `\$\{judul\}\\n\\nHari\/Tanggal\/Jam : /);
});
