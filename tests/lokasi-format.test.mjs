import assert from 'node:assert/strict';
import test from 'node:test';
import { formatLokasi, normalizeLokasi, formatLokasiRows, formatStoringLokasi, formatACLokasiList } from '../src/lib/utils/lokasiFormat.ts';
import { generateWA_Perbaikan } from '../src/lib/utils/perbaikanMessage.ts';
import { generateWA_Kegiatan } from '../src/lib/utils/kegiatanMessage.ts';

test('formatLokasi: "<Lokasi> <Nomor>" dengan spasi, nomor kosong atau "-" dilewati', () => {
  assert.equal(formatLokasi('PSCP D', '2'), 'PSCP D 2');
  assert.equal(formatLokasi('Rampout E', '1'), 'Rampout E 1');
  assert.equal(formatLokasi('HBSCP', '2.5'), 'HBSCP 2.5');
  assert.equal(formatLokasi('Arrival Hall F', '-'), 'Arrival Hall F');
  assert.equal(formatLokasi('Terminal 2', ''), 'Terminal 2');
  assert.equal(formatLokasi(undefined, undefined), '');
});

test('normalizeLokasi: buang "No." dan beri spasi pada zona+nomor, tanpa merusak nama lokasi', () => {
  assert.equal(normalizeLokasi('PSCP F No.3'), 'PSCP F 3');
  assert.equal(normalizeLokasi('PSCP E No. 2'), 'PSCP E 2');
  assert.equal(normalizeLokasi('PSCP D no 1, PSCP E No.2'), 'PSCP D 1, PSCP E 2');
  assert.equal(normalizeLokasi('Rampout E1'), 'Rampout E 1');
  assert.equal(normalizeLokasi('Aviobridge D2'), 'Aviobridge D 2');
  assert.equal(normalizeLokasi('Avio & BL D1'), 'Avio & BL D 1');
  assert.equal(normalizeLokasi('HBSCP 2.5'), 'HBSCP 2.5');
  // "E1" pada nama ruangan adalah bagian nama, bukan nomor
  assert.equal(normalizeLokasi('Ruang Monitoring E1'), 'Ruang Monitoring E1');
  assert.equal(normalizeLokasi('Breakdown E1'), 'Breakdown E1');
  assert.equal(normalizeLokasi('No Telepon'), 'No Telepon');
  // aman dipanggil berulang
  assert.equal(normalizeLokasi(normalizeLokasi('PSCP F No.3')), 'PSCP F 3');
  assert.equal(normalizeLokasi(null), '');
});

test('formatLokasiRows: baris form digabung koma, baris manual apa adanya', () => {
  assert.equal(formatLokasiRows([{ lokasi1: 'PSCP F', lokasi2: '3' }, { lokasi1: 'Rampout E', lokasi2: '1' }]), 'PSCP F 3, Rampout E 1');
  assert.equal(formatLokasiRows([{ lokasi1: 'Lantai 2 Gedung', lokasi2: '-', isManual: true }]), 'Lantai 2 Gedung');
  assert.equal(formatLokasiRows([{ lokasi1: '', lokasi2: '' }]), '');
});

test('Storing: lokasi memakai spasi sebelum nomor, termasuk Rampout dan Avio & BL', () => {
  assert.equal(formatStoringLokasi(['Rampout E'], { 'Rampout E': '2' }), 'Rampout E 2');
  assert.equal(formatStoringLokasi(['Avio & BL D'], { 'Avio & BL D': '1-7' }), 'Avio & BL D 1-7');
  assert.equal(formatStoringLokasi(['HBSCP'], { HBSCP: '2.1-2.6' }), 'HBSCP 2.1-2.6');
  assert.equal(formatStoringLokasi(['PSCP D']), 'PSCP D');
  assert.equal(formatStoringLokasi([], {}, 'Rampout F', '3'), 'Rampout F 3');
  assert.equal(formatStoringLokasi([], {}, '', ''), '-');
  // beberapa nomor pada satu lokasi digabung ringkas
  assert.equal(formatACLokasiList(['Rampout D 2', 'Rampout D 4']), 'Rampout D 2 & 4');
  assert.equal(formatACLokasiList(['Rampout D 2,4,6', 'Rampout E 2,4,6']), 'Rampout D & Rampout E 2,4,6');
});

test('Pesan WA memakai standar lokasi: Perbaikan tanpa "No." dan Kegiatan dirapikan', () => {
  const msg = generateWA_Perbaikan({
    peralatan: 'X-Ray Rapiscan 620DV', lokasiList: [{ lokasi1: 'PSCP F', lokasi2: '3' }, { lokasi1: 'HBSCP', lokasi2: '2.5' }],
    sumberLaporan: 'Avsec', indikasiAwal: 'x', tanggal: '2026-09-30', waktuMulai: '1', waktuSelesai: '2', lamaPengerjaan: '1', teknisi: 'A',
    permasalahan: '• a', tindakLanjut: '• b', status: 'Pekerjaan Selesai'
  }, false);
  assert.ok(msg.includes('Lokasi : PSCP F 3, HBSCP 2.5'));
  assert.ok(!msg.includes('No.'));
  assert.ok(generateWA_Kegiatan({ tanggal: '2026-09-30', waktuMulai: '09:00', lokasi: 'PSCP D No.2', kegiatan: 'x' }).includes('Lokasi : PSCP D 2'));
});
