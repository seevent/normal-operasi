import assert from 'node:assert/strict';
import test from 'node:test';
import {
  operationalDay,
  periodKey,
  compactKey,
  nextResetAt,
  buildFileName,
  buildFolder,
  buildPublicId,
  isValidEquipmentNumber,
} from '../src/lib/utils/preventivePeriod.ts';

// Waktu ditulis dengan offset +07:00 (WIB) agar mudah dibaca terhadap aturan "reset pukul 07.00".
const wib = (s) => new Date(`${s}+07:00`);
const keys = (s) => {
  const d = wib(s);
  return [periodKey('DAILY', d), periodKey('WEEKLY', d), periodKey('MONTHLY', d)].map(compactKey).join(' ');
};

// Nilai harapan di bawah ini diambil dari hasil fungsi SQL public.preventive_period_key() di Supabase
// pada instan yang sama, sehingga tes ini sekaligus menjaga paritas TypeScript <-> database.
test('Daily berganti tepat pukul 07.00 WIB', () => {
  assert.equal(keys('2026-10-20T06:59:59'), '20261019 20261018 20261001');
  assert.equal(keys('2026-10-20T07:00:00'), '20261020 20261018 20261001');
  assert.equal(keys('2026-10-21T06:59:59'), '20261020 20261018 20261001');
  assert.equal(keys('2026-10-21T07:00:00'), '20261021 20261018 20261001');
});

test('Weekly berganti hari Minggu pukul 07.00 WIB', () => {
  assert.equal(keys('2026-10-18T06:59:59'), '20261017 20261011 20261001');
  assert.equal(keys('2026-10-18T07:00:00'), '20261018 20261018 20261001');
  assert.equal(keys('2026-10-24T07:00:00'), '20261024 20261018 20261001');
  assert.equal(keys('2026-10-25T06:59:59'), '20261024 20261018 20261001');
  assert.equal(keys('2026-10-25T07:00:00'), '20261025 20261025 20261001');
});

test('Monthly berganti tanggal 1 pukul 07.00 WIB', () => {
  assert.equal(keys('2026-11-01T06:59:59'), '20261031 20261025 20261001');
  assert.equal(keys('2026-11-01T07:00:00'), '20261101 20261101 20261101');
  assert.equal(keys('2026-11-30T23:59:59'), '20261130 20261129 20261101');
});

test('pergantian tahun: 1 Januari 00.00-06.59 masih periode tahun lama', () => {
  assert.equal(keys('2026-12-31T23:59:59'), '20261231 20261227 20261201');
  assert.equal(keys('2027-01-01T00:00:00'), '20261231 20261227 20261201');
  assert.equal(keys('2027-01-01T06:59:59'), '20261231 20261227 20261201');
  assert.equal(keys('2027-01-01T07:00:00'), '20270101 20261227 20270101');
});

test('hasil tidak bergantung pada zona waktu perangkat (instan UTC yang sama, hasil sama)', () => {
  // 2026-10-19T23:59:59Z = 2026-10-20 06:59:59 WIB; 2026-10-20T00:00:00Z = 07:00:00 WIB.
  assert.equal(compactKey(periodKey('DAILY', new Date('2026-10-19T23:59:59Z'))), '20261019');
  assert.equal(compactKey(periodKey('DAILY', new Date('2026-10-20T00:00:00Z'))), '20261020');
});

test('operationalDay mengembalikan tengah malam UTC dari tanggal operasional', () => {
  assert.equal(operationalDay(wib('2026-10-20T06:59:59')).toISOString(), '2026-10-19T00:00:00.000Z');
  assert.equal(operationalDay(wib('2026-10-20T07:00:00')).toISOString(), '2026-10-20T00:00:00.000Z');
});

test('nextResetAt: batas berikutnya selalu pukul 07.00 WIB', () => {
  const at = (period, s) => nextResetAt(period, wib(s)).toISOString();
  // 07.00 WIB = 00.00 UTC
  assert.equal(at('DAILY', '2026-10-20T06:59:59'), '2026-10-20T00:00:00.000Z');
  assert.equal(at('DAILY', '2026-10-20T07:00:00'), '2026-10-21T00:00:00.000Z');
  assert.equal(at('WEEKLY', '2026-10-20T12:00:00'), '2026-10-25T00:00:00.000Z');
  assert.equal(at('WEEKLY', '2026-10-25T06:59:59'), '2026-10-25T00:00:00.000Z');
  assert.equal(at('WEEKLY', '2026-10-25T07:00:00'), '2026-11-01T00:00:00.000Z');
  assert.equal(at('MONTHLY', '2026-10-20T12:00:00'), '2026-11-01T00:00:00.000Z');
  assert.equal(at('MONTHLY', '2026-12-31T23:59:59'), '2027-01-01T00:00:00.000Z');
});

test('nextResetAt selalu setelah instan sekarang dan periodenya berganti tepat di situ', () => {
  const samples = ['2026-10-18T07:00:00', '2026-10-31T23:00:00', '2026-12-31T06:00:00', '2027-02-28T08:00:00', '2028-02-29T07:00:00'];
  for (const s of samples) {
    const now = wib(s);
    for (const p of ['DAILY', 'WEEKLY', 'MONTHLY']) {
      const next = nextResetAt(p, now);
      assert.ok(next.getTime() > now.getTime(), `${p} ${s}`);
      assert.notEqual(periodKey(p, new Date(next.getTime())), periodKey(p, now), `${p} ${s} harus berganti di batas`);
      assert.equal(periodKey(p, new Date(next.getTime() - 1)), periodKey(p, now), `${p} ${s} belum berganti 1 ms sebelum batas`);
    }
  }
});

test('nama file, folder, dan public_id mengikuti format yang diminta', () => {
  assert.equal(buildFileName('ESE061000074773', '2026-10-20'), 'ESE061000074773_20261020');
  assert.equal(buildFolder('DAILY', 'WALK THROUGH METAL DETECTOR'), 'PRIMA/PREVENTIVE/MAINTENANCE/DAILY/WALK THROUGH METAL DETECTOR');
  assert.equal(
    buildPublicId('WEEKLY', 'X-RAY KABIN', 'ESE011000074751', '2026-10-18'),
    'PRIMA/PREVENTIVE/MAINTENANCE/WEEKLY/X-RAY KABIN/ESE011000074751_20261018',
  );
});

test('public_id DAILY dan WEEKLY pada tanggal yang sama tidak bentrok', () => {
  const a = buildPublicId('DAILY', 'X-RAY KABIN', 'ESE011000074751', '2026-10-18');
  const b = buildPublicId('WEEKLY', 'X-RAY KABIN', 'ESE011000074751', '2026-10-18');
  assert.notEqual(a, b);
});

test('nomor equipment valid hanya pola ESE + 12 digit', () => {
  assert.equal(isValidEquipmentNumber('ESE061000074773'), true);
  assert.equal(isValidEquipmentNumber('ESE06100007477'), false);
  assert.equal(isValidEquipmentNumber('esE061000074773'), false);
  assert.equal(isValidEquipmentNumber('ESE061000074773/../x'), false);
  assert.equal(isValidEquipmentNumber(''), false);
});

test('periode tidak dikenal ditolak', () => {
  assert.throws(() => periodKey('YEARLY', new Date()), /periode/i);
  assert.throws(() => nextResetAt('YEARLY', new Date()), /periode/i);
});
