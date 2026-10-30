import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { assignReportShift, parseWaktuRange, shiftDateString } from '../src/lib/utils/shiftAssignment.ts';

// Waktu lokal (WIB di perangkat petugas); konstruktor lokal agar tes tidak bergantung zona waktu mesin.
const at = (y, mo, d, h, mi = 0) => new Date(y, mo - 1, d, h, mi);

test('parseWaktuRange membaca pukul mulai & selesai', () => {
  assert.deepEqual(parseWaktuRange('05:30 - 09:15'), { start: 330, end: 555 });
  assert.deepEqual(parseWaktuRange('05.30'), { start: 330, end: null });
  assert.deepEqual(parseWaktuRange('05:30 - '), { start: 330, end: null });
  assert.equal(parseWaktuRange(' - '), null);
  assert.equal(parseWaktuRange('-'), null);
  assert.equal(parseWaktuRange(undefined), null);
});

test('dibuat jam 9 pagi, mulai di Shift M, selesai di luar shift: masuk Shift M malam sebelumnya', () => {
  // Form dibuka setelah 08:00 sehingga tanggal default = hari ini (31 Okt)
  assert.deepEqual(assignReportShift('2026-10-31', '06:00 - 08:45', at(2026, 10, 31, 9)), { tanggal: '2026-10-30', shift: 'M' });
  // Petugas mengganti tanggal ke tanggal dinas malam (30 Okt): hasilnya sama
  assert.deepEqual(assignReportShift('2026-10-30', '06:00 - 08:45', at(2026, 10, 31, 9)), { tanggal: '2026-10-30', shift: 'M' });
});

test('mulai & selesai di dalam Shift M tetapi laporan dibuat di luar shift: ikut shift pukul mulai', () => {
  assert.deepEqual(assignReportShift('2026-10-31', '03:00 - 05:00', at(2026, 10, 31, 9, 30)), { tanggal: '2026-10-30', shift: 'M' });
  // Mulai sebelum tengah malam, laporan dibuat pagi hari dengan tanggal default hari ini
  assert.deepEqual(assignReportShift('2026-10-31', '23:00 - 01:30', at(2026, 10, 31, 9)), { tanggal: '2026-10-30', shift: 'M' });
  // Shift PS yang dilaporkan malam hari
  assert.deepEqual(assignReportShift('2026-10-30', '18:00 - 19:30', at(2026, 10, 30, 21)), { tanggal: '2026-10-30', shift: 'PS' });
});

test('selesai lebih dari 7 jam setelah batas shift: masuk shift berikutnya', () => {
  // Shift M 30 Okt berakhir 31 Okt 08:00; batas toleransi 15:00
  assert.deepEqual(assignReportShift('2026-10-31', '07:00 - 15:00', at(2026, 10, 31, 16)), { tanggal: '2026-10-30', shift: 'M' });
  assert.deepEqual(assignReportShift('2026-10-31', '07:00 - 15:01', at(2026, 10, 31, 16)), { tanggal: '2026-10-31', shift: 'PS' });
  // Shift PS: selesai sebelum tengah malam tidak pernah lewat 7 jam dari 20:00
  assert.deepEqual(assignReportShift('2026-10-30', '19:00 - 23:59', at(2026, 10, 31, 1)), { tanggal: '2026-10-30', shift: 'PS' });
});

test('selesai lebih awal dari mulai di luar Shift Malam dianggap salah ketik: ikut pukul mulai saja', () => {
  // Data nyata: "10:20 - 10:05" tidak boleh dibaca sebagai kerja hampir 24 jam
  assert.deepEqual(assignReportShift('2026-09-23', '10:20 - 10:05', at(2026, 9, 23, 11, 3)), { tanggal: '2026-09-23', shift: 'PS' });
  assert.deepEqual(assignReportShift('2026-10-14', '00:40 - 00:05', at(2026, 10, 14, 1, 8)), { tanggal: '2026-10-13', shift: 'M' });
  assert.deepEqual(assignReportShift('2026-10-30', '19:00 - 03:30', at(2026, 10, 31, 4)), { tanggal: '2026-10-30', shift: 'PS' });
  // Shift Malam yang sah melewati tengah malam tetap dihitung
  assert.deepEqual(assignReportShift('2026-10-15', '22:03 - 07:40', at(2026, 10, 16, 8, 7)), { tanggal: '2026-10-15', shift: 'M' });
});

test('dibuat di dalam shift tetap seperti sebelumnya', () => {
  // Dini hari dengan tanggal default = tanggal dinas malam
  assert.deepEqual(assignReportShift('2026-10-30', '01:00 - 02:00', at(2026, 10, 31, 3)), { tanggal: '2026-10-30', shift: 'M' });
  assert.deepEqual(assignReportShift('2026-10-30', '21:00 - 22:00', at(2026, 10, 30, 22, 30)), { tanggal: '2026-10-30', shift: 'M' });
  assert.deepEqual(assignReportShift('2026-10-30', '10:00 - 11:00', at(2026, 10, 30, 11, 5)), { tanggal: '2026-10-30', shift: 'PS' });
  assert.deepEqual(assignReportShift('2026-10-30', '08:00', at(2026, 10, 30, 8, 5)), { tanggal: '2026-10-30', shift: 'PS' });
  assert.deepEqual(assignReportShift('2026-10-30', '20:00', at(2026, 10, 30, 20, 5)), { tanggal: '2026-10-30', shift: 'M' });
});

test('laporan susulan beberapa hari kemudian memakai tanggal form sebagai tanggal dinas', () => {
  assert.deepEqual(assignReportShift('2026-10-25', '05:00 - 06:00', at(2026, 10, 30, 10)), { tanggal: '2026-10-25', shift: 'M' });
  assert.deepEqual(assignReportShift('2026-10-25', '14:00 - 15:00', at(2026, 10, 30, 10)), { tanggal: '2026-10-25', shift: 'PS' });
});

test('tanpa waktu dibuat (data lama tanpa created_at): tanggal dianggap tanggal dinas', () => {
  assert.deepEqual(assignReportShift('2026-10-30', '05:00 - 06:00'), { tanggal: '2026-10-30', shift: 'M' });
  assert.deepEqual(assignReportShift('2026-10-30', '07:00 - 15:30'), { tanggal: '2026-10-31', shift: 'PS' });
  assert.deepEqual(assignReportShift('2026-10-30', '12:00 - 13:00', 'bukan-tanggal'), { tanggal: '2026-10-30', shift: 'PS' });
});

test('created_at ISO dari Supabase diterima', () => {
  const iso = at(2026, 10, 31, 9).toISOString();
  assert.deepEqual(assignReportShift('2026-10-31', '06:00 - 08:45', iso), { tanggal: '2026-10-30', shift: 'M' });
});

test('waktu atau tanggal tidak terbaca: null', () => {
  assert.equal(assignReportShift('2026-10-30', '-'), null);
  assert.equal(assignReportShift('', '05:00'), null);
});

test('shiftDateString melewati batas bulan & tahun', () => {
  assert.equal(shiftDateString('2026-10-31', 1), '2026-11-01');
  assert.equal(shiftDateString('2026-01-01', -1), '2025-12-31');
});

test('keempat tab menyimpan shift dari pukul kerja, bukan dari jam pembuatan laporan', () => {
  for (const tab of ['TabPerbaikan', 'TabStoring', 'TabKegiatan', 'TabKalibrasi']) {
    const src = readFileSync(new URL(`../src/components/features/${tab}.tsx`, import.meta.url), 'utf8');
    assert.match(src, /resolveLogShift\(/, `${tab} harus memakai resolveLogShift`);
    assert.doesNotMatch(src, /shift: opShift/, `${tab} masih memakai shift dari jam pembuatan`);
  }
});
