import assert from 'node:assert/strict';
import test from 'node:test';
import { formatXRayParams, formatWtmdParams } from '../src/lib/utils/kalibrasiParams.ts';

test('Parameter X-Ray kosong: hanya satuan, kecuali Archive +- 1 bulan', () => {
  assert.equal(
    formatXRayParams({}),
    [
      '- kV Vertikal/Horizontal : kV / kV',
      '- mA Vertikal/Horizontal : mA / mA',
      '- Ontime Vertikal/Horizontal : h / h',
      '- Archive : +- 1 bulan'
    ].join('\n')
  );
});

test('Parameter WTMD kosong: tanpa nilai bawaan', () => {
  assert.equal(formatWtmdParams({}), '- Z1 : - Z2 : - Z3 : - Z4 :\n- LC : - LS : - UC : - SE : - DS :');
});

test('Parameter terisi tetap tampil, satuan ditambahkan bila belum ada', () => {
  assert.equal(
    formatXRayParams({ xrayKvV: '140', xrayKvH: '140 kV', xrayMaV: '0.7', xrayMaH: '0.7mA', xrayOnV: 'Normal', xrayOnH: '5', xrayArchive: '+- 2 bulan' }),
    [
      '- kV Vertikal/Horizontal : 140 kV / 140 kV',
      '- mA Vertikal/Horizontal : 0.7 mA / 0.7mA',
      '- Ontime Vertikal/Horizontal : Normal / 5 h',
      '- Archive : +- 2 bulan'
    ].join('\n')
  );
  assert.equal(
    formatWtmdParams({ wtmdZ1: 'Normal', wtmdZ2: '5', wtmdLc: 'OK' }),
    '- Z1 : Normal - Z2 : 5 - Z3 : - Z4 :\n- LC : OK - LS : - UC : - SE : - DS :'
  );
});
