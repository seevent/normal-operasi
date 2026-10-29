import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { joinLokasiList, kalibrasiPrintLocations, splitKalibrasiLocations } from '../src/lib/utils/kalibrasiLocations.ts';

test('joinLokasiList: [tempat 1], [tempat 2] & [tempat terakhir]', () => {
  assert.equal(joinLokasiList(['Aviobridge D']), 'Aviobridge D');
  assert.equal(joinLokasiList(['Rampout E', 'Ruang Monitoring E1']), 'Rampout E & Ruang Monitoring E1');
  assert.equal(joinLokasiList(['Aviobridge D', 'BL D', 'Rampout D']), 'Aviobridge D, BL D & Rampout D');
  assert.equal(joinLokasiList(['Breakdown D', 'Breakdown E2', 'Breakdown E1', 'Breakdown F']), 'Breakdown D, Breakdown E2, Breakdown E1 & Breakdown F');
});

test('Kalibrasi Access Control lebih dari 1 tempat: satu baris dengan lokasi digabung (data asli)', () => {
  assert.deepEqual(kalibrasiPrintLocations('Access Control', 'Aviobridge D, BL D, Rampout D'), ['Aviobridge D, BL D & Rampout D']);
  assert.deepEqual(
    kalibrasiPrintLocations('Access Control', 'Rampout E, Ruang Monitoring E1, Aviobridge E, BL E'),
    ['Rampout E, Ruang Monitoring E1, Aviobridge E & BL E'],
  );
  // Ejaan "Acces Control" yang pernah dipakai di data tetap dikenali
  assert.deepEqual(kalibrasiPrintLocations('Acces Control', 'Lift D, Mainframe E'), ['Lift D & Mainframe E']);
  assert.deepEqual(kalibrasiPrintLocations('Access Control', 'BL E 3'), ['BL E 3']);
});

test('Kalibrasi peralatan lain tetap dipecah satu baris per tempat (tidak berubah)', () => {
  assert.deepEqual(kalibrasiPrintLocations('X-Ray, WTMD', 'PSCP D, PSCP E'), ['PSCP D', 'PSCP E']);
  assert.deepEqual(kalibrasiPrintLocations('X-Ray', 'PSCP D No.1 & 2'), ['PSCP D No.1', 'PSCP D 2']);
  assert.deepEqual(splitKalibrasiLocations('-'), ['-']);
  assert.deepEqual(splitKalibrasiLocations('Avio & BL D'), ['Avio & BL D']);
});

test('Tabel cetak/PDF dan Excel memakai aturan lokasi kalibrasi yang sama', () => {
  const tab = readFileSync(new URL('../src/components/features/TabShiftReport.tsx', import.meta.url), 'utf8');
  assert.match(tab, /kalibrasiPrintLocations\(item\.Peralatan, item\.Lokasi\)/);
  assert.doesNotMatch(tab, /const splitKalibrasiLocations =/);
});
