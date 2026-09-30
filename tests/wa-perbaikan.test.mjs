import assert from 'node:assert/strict';
import test from 'node:test';
import { generateWA_Perbaikan } from '../src/lib/utils/perbaikanMessage.ts';

const formData = {
  peralatan: 'X-Ray Rapiscan 620DV',
  lokasiList: [{ lokasi1: 'PSCP F', lokasi2: '3', isManual: false }],
  sumberLaporan: 'Avsec',
  indikasiAwal: 'Xray off',
  tanggal: '2026-09-30',
  waktuMulai: '04:39',
  waktuSelesai: '05:39',
  lamaPengerjaan: '1 Jam 0 Menit',
  teknisi: 'Ridho & Agus',
  permasalahan: '• xray off karena tidak ada tegangan',
  tindakLanjut: '• cek power, tidak ada tegangan\n• koordinasi dengan teknik listrik',
  status: 'Pekerjaan Selesai'
};

test('Laporan Corrective Maintenance WA cocok dengan contoh format', () => {
  const expected = [
    '*LAPORAN CORRECTIVE MAINTENANCE*',
    '',
    'Peralatan : X-Ray Rapiscan 620DV',
    'Lokasi : PSCP F No.3',
    'Sumber laporan : Avsec',
    'Indikasi awal : Xray off',
    '',
    '🗓️ Tanggal :  30/09/2026',
    '🕝 Pukul : 04:39 - 05:39',
    '⏰ Lama waktu Pengerjaan : 1 Jam 0 Menit',
    '👨🏻‍🔧 Teknisi : Ridho & Agus',
    '',
    '🪛 Permasalahan :',
    '• xray off karena tidak ada tegangan',
    '🪛 Tindak lanjut  : ',
    '• cek power, tidak ada tegangan',
    '• koordinasi dengan teknik listrik',
    '',
    '✅ Status : Pekerjaan Selesai',
    '',
    'Demikian laporan tindak lanjut kami sampaikan.',
    'Terimakasih atas perhatiannya.'
  ].join('\n');
  assert.equal(generateWA_Perbaikan(formData, false), expected);
});

test('Laporan verifikasi ETD tanpa Indikasi awal dan tanpa baris kosong berlebih', () => {
  const msg = generateWA_Perbaikan({ ...formData, peralatan: 'ETD Leidos B220' }, true);
  assert.ok(msg.startsWith('*LAPORAN VERIFIKASI*\n\nPeralatan : ETD Leidos B220\nLokasi : PSCP F No.3\nSumber laporan : Avsec\n\n🗓️'));
  assert.ok(!msg.includes('Indikasi awal'));
});

test('Status selain selesai memakai ikon peringatan', () => {
  assert.ok(generateWA_Perbaikan({ ...formData, status: 'Monitoring' }, false).includes('⚠️ Status : Monitoring'));
});

test('Tanpa peralatan menampilkan petunjuk', () => {
  assert.match(generateWA_Perbaikan({ ...formData, peralatan: '' }, false), /pilih peralatan/);
});
