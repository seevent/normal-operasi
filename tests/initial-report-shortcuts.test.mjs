import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getApplicableMitigasiList,
  getApplicableDampakList,
  getApplicablePermasalahanList,
  appendNumberedItem,
  appendBulletItem,
} from '../src/lib/utils/initialReportShortcuts.ts';

const ctx = (overrides = {}) => ({
  peralatan: '',
  jenis: '',
  varian: '',
  lokasiList: undefined,
  lokasi1: '',
  ...overrides,
});

test('Mitigasi: selalu diawali koordinasi TOCC, pengecekan peralatan, lalu koordinasi pihak terkait', () => {
  const items = getApplicableMitigasiList(ctx({ peralatan: 'X-Ray Rapiscan 620DV', jenis: 'X-Ray', lokasi1: 'PSCP D 1' }));

  assert.equal(items[0], 'Koordinasi dengan TOCC.');
  assert.equal(items[1], 'Melakukan pengecekan peralatan X-Ray.');
  assert.equal(items[2], 'Koordinasi dengan pihak Avsec.');
  // X-Ray di PSCP boleh pindah jalur pemeriksaan
  assert.ok(items.includes('Pindahkan jalur pemeriksaan pada line yang kosong.'));
  assert.ok(items.includes('Melakukan pengecekan power listrik.'));
});

test('Mitigasi: Mirroring X-Ray berkoordinasi dengan Custom, bukan Avsec', () => {
  const items = getApplicableMitigasiList(ctx({ peralatan: 'Mirroring X-Ray HBS', jenis: 'Mirroring X-Ray', lokasi1: 'HBSCP D' }));

  assert.ok(items.includes('Koordinasi dengan pihak Custom.'));
  assert.ok(!items.includes('Koordinasi dengan pihak Avsec.'));
  assert.ok(items.includes('Melakukan pengecekan jaringan.'));
});

test('Mitigasi: Extension Conveyor di lokasi conveyor berkoordinasi dengan Ground Handling', () => {
  const items = getApplicableMitigasiList(
    ctx({ peralatan: 'Extension Conveyor', jenis: 'Extension Conveyor', lokasi1: 'Conveyor Belt HBSCP E' })
  );

  assert.ok(items.includes('Koordinasi dengan Ground Handling.'));
});

test('Mitigasi: Access Control di lift pakai Teknik Mekanik, tanpa Breakglass & tanpa Teknik Sipil', () => {
  const lift = getApplicableMitigasiList(ctx({ peralatan: 'Access Control Lift', jenis: 'Access Control', lokasi1: 'Lift Kargo D' }));
  assert.ok(lift.includes('Koordinasi dengan Teknik Mekanik.'));
  assert.ok(!lift.includes('Pecahkan Emergency Breakglass jika diperlukan.'));
  assert.ok(!lift.includes('Koordinasi dengan Teknik Sipil.'));

  const pintuBiasa = getApplicableMitigasiList(ctx({ peralatan: 'Access Control', jenis: 'Access Control', lokasi1: 'Gate D3' }));
  assert.ok(pintuBiasa.includes('Pecahkan Emergency Breakglass jika diperlukan.'));
  assert.ok(pintuBiasa.includes('Melakukan pengecekan pintu.'));
  assert.ok(pintuBiasa.includes('Koordinasi dengan Teknik Sipil.'));
});

test('Mitigasi: PETD dikecualikan dari pengecekan power listrik', () => {
  const petd = getApplicableMitigasiList(ctx({ peralatan: 'PETD Smiths', jenis: 'ETD', lokasi1: 'PSCP D' }));
  const etdBiasa = getApplicableMitigasiList(ctx({ peralatan: 'ETD Smiths', jenis: 'ETD', lokasi1: 'PSCP D' }));

  assert.ok(!petd.includes('Melakukan pengecekan power listrik.'));
  assert.ok(etdBiasa.includes('Melakukan pengecekan power listrik.'));
});

test('Mitigasi: daftar tidak pernah memuat duplikat', () => {
  const items = getApplicableMitigasiList(
    ctx({ peralatan: 'X-Ray', jenis: 'X-Ray', lokasiList: [{ lokasi1: 'PSCP D 1' }, { lokasi1: 'PSCP D 2' }] })
  );

  assert.equal(new Set(items).size, items.length);
});

test('Dampak: X-Ray Bagasi di HBSCP memunculkan dampak bagasi, bukan dampak kabin', () => {
  const items = getApplicableDampakList(
    ctx({ peralatan: 'X-Ray Bagasi Nuctech', jenis: 'X-Ray', varian: 'Bagasi', lokasi1: 'HBSCP E' })
  );

  assert.ok(items.includes('Terjadi resiko penumpukan jumlah bagasi.'));
  assert.ok(items.includes('Proses pemeriksaan bagasi pax terganggu.'));
  assert.ok(!items.includes('Proses pemeriksaan barang pax terganggu.'));
});

test('Dampak: X-Ray Cabin di SSCP berbeda kalimat dengan di lokasi lain', () => {
  const sscp = getApplicableDampakList(ctx({ peralatan: 'X-Ray Cabin', jenis: 'X-Ray', varian: 'Cabin', lokasi1: 'SSCP D' }));
  const pscp = getApplicableDampakList(ctx({ peralatan: 'X-Ray Cabin', jenis: 'X-Ray', varian: 'Cabin', lokasi1: 'PSCP D' }));

  assert.ok(sscp.includes('Proses pemeriksaan barang terganggu.'));
  assert.ok(pscp.includes('Proses pemeriksaan barang pax terganggu.'));
});

test('Dampak: Access Control & WTMD punya dampak khasnya masing-masing', () => {
  const ac = getApplicableDampakList(ctx({ peralatan: 'Access Control', jenis: 'Access Control' }));
  assert.ok(ac.includes('Resiko pintu Access dilewati oleh orang yang tidak berhak.'));

  const wtmd = getApplicableDampakList(ctx({ peralatan: 'WTMD CEIA', jenis: 'WTMD' }));
  assert.ok(wtmd.includes('Terjadi penumpukan antrian pemeriksaan orang.'));
  assert.ok(wtmd.includes('Barang yang mengandung bahan metal tidak dapat terdeteksi.'));
});

test('Permasalahan: daftar spesifik per merk X-Ray (Rapiscan vs Nuctech)', () => {
  const rapiscan = getApplicablePermasalahanList(ctx({ peralatan: 'X-Ray Rapiscan 620DV', jenis: 'X-Ray' }));
  const nuctech = getApplicablePermasalahanList(ctx({ peralatan: 'X-Ray Nuctech 6040', jenis: 'X-Ray' }));

  assert.ok(rapiscan.includes('Muncul notif Inverter Fault.'));
  assert.ok(!rapiscan.includes('Muncul notif Missing Data Aquisition.'));

  assert.ok(nuctech.includes('Muncul notif Missing Data Aquisition.'));
  assert.ok(!nuctech.includes('Muncul notif Inverter Fault.'));

  // Keduanya berbagi permasalahan umum X-Ray
  for (const shared of ['X-Ray off.', 'X-Ray hang.']) {
    assert.ok(rapiscan.includes(shared));
    assert.ok(nuctech.includes(shared));
  }
});

test('Permasalahan: peralatan tanpa daftar khusus menghasilkan array kosong', () => {
  assert.deepEqual(getApplicablePermasalahanList(ctx({ peralatan: 'Genset', jenis: 'Genset' })), []);
});

test('appendNumberedItem: menambah item bernomor & menolak duplikat (case-insensitive)', () => {
  assert.equal(appendNumberedItem('', 'Koordinasi dengan TOCC.'), '1. Koordinasi dengan TOCC.');
  assert.equal(appendNumberedItem('1. ', 'Koordinasi dengan TOCC.'), '1. Koordinasi dengan TOCC.');

  const after = appendNumberedItem('1. Koordinasi dengan TOCC.', 'Melakukan pengecekan jaringan.');
  assert.equal(after, '1. Koordinasi dengan TOCC.\n2. Melakukan pengecekan jaringan.');

  // Duplikat -> null, supaya pemanggil membiarkan state apa adanya
  assert.equal(appendNumberedItem('1. Koordinasi dengan TOCC.', 'koordinasi dengan tocc.'), null);
});

test('appendBulletItem: menambah bullet & menolak duplikat', () => {
  assert.equal(appendBulletItem('', 'X-Ray off.'), '• X-Ray off.');
  assert.equal(appendBulletItem('•', 'X-Ray off.'), '• X-Ray off.');
  assert.equal(appendBulletItem('• X-Ray off.', 'X-Ray hang.'), '• X-Ray off.\n• X-Ray hang.');
  assert.equal(appendBulletItem('• X-Ray off.', 'x-ray off.'), null);
});

test('TabInitialReport mendelegasikan logika shortcut ke modul terpisah', async () => {
  const { readFileSync } = await import('node:fs');
  const tab = readFileSync(new URL('../src/components/features/TabInitialReport.tsx', import.meta.url), 'utf8');

  assert.match(tab, /from '\.\.\/\.\.\/lib\/utils\/initialReportShortcuts'/);
  // Logika tidak boleh kembali ditulis inline di dalam komponen
  assert.doesNotMatch(tab, /const getApplicableMitigasiList = React\.useCallback/);
  assert.doesNotMatch(tab, /const getApplicableDampakList = React\.useCallback/);
  assert.doesNotMatch(tab, /const getApplicablePermasalahanList = React\.useCallback/);
});
