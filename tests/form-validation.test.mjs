import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMissingPetMessage, validateKehadiran, validateBriefing, validateChecklist, validateStoring,
  validateKegiatan, validateBASerahTerima, validateInitialReport, validatePerbaikan, validateKalibrasi,
} from '../src/lib/utils/formValidation.ts';

const keys = (list) => list.map(m => m.key);

test('Kehadiran: wajib minimal 1 personel API dan 1 personel OM, tlp ruangan, rencana kegiatan', () => {
  const ok = { tanggal: '2026-09-30', tlpRuangan: '021', rencanaKegiatan: '- Monitoring Ops', apiList: [{ name: 'A' }], omList: [{ name: 'B' }] };
  assert.deepEqual(validateKehadiran(ok), []);
  assert.deepEqual(keys(validateKehadiran({ ...ok, apiList: [{ name: '' }], omList: [] })), ['apiList', 'omList']);
  assert.deepEqual(keys(validateKehadiran({ ...ok, tlpRuangan: ' ', rencanaKegiatan: '' })), ['tlpRuangan', 'rencanaKegiatan']);
});

test('Briefing, Checklist dan Kegiatan: isian wajib mengikuti urutan form', () => {
  assert.deepEqual(keys(validateBriefing({ tanggal: '', lokasi: '' })), ['tanggal', 'lokasi']);
  assert.deepEqual(validateBriefing({ tanggal: '2026-09-30', lokasi: 'Terminal 2' }), []);
  assert.deepEqual(keys(validateChecklist({ tanggal: '2026-09-30', waktuMulai: '', waktuSelesai: '' })), ['waktuMulai', 'waktuSelesai']);
  assert.deepEqual(keys(validateKegiatan({ tanggal: 'x', waktuMulai: '09:00', lokasi: '', kegiatan: '' })), ['lokasi', 'kegiatan']);
  // peralatan Kegiatan opsional
  assert.deepEqual(validateKegiatan({ tanggal: 'x', waktuMulai: '09:00', lokasi: 'T2', kegiatan: 'a', peralatan: '' }), []);
});

test('Storing: peralatan, lokasi, hasil dan Supervisor Avsec per lokasi wajib', () => {
  const base = { tanggal: 'x', waktuMulai: '08:00', waktuSelesai: '09:00', peralatan: ['X-Ray'], acLokasi: ['PSCP D'], hasil: 'Normal Operasi', supervisorAvsecMap: {}, supervisorAvsec: '' };
  assert.deepEqual(validateStoring(base, []), []);
  assert.deepEqual(keys(validateStoring({ ...base, peralatan: [], acLokasi: [] })), ['peralatan']);
  assert.deepEqual(keys(validateStoring({ ...base, acLokasi: [] })), ['lokasi']);
  assert.deepEqual(keys(validateStoring({ ...base, hasil: ' ' })), ['hasil']);
  // satu lokasi supervisor memakai supervisorAvsec; beberapa lokasi memakai peta per lokasi
  assert.deepEqual(keys(validateStoring(base, ['Rampout D'])), ['supervisor-Rampout D']);
  assert.deepEqual(validateStoring({ ...base, supervisorAvsec: 'Budi' }, ['Rampout D']), []);
  const two = validateStoring({ ...base, supervisorAvsecMap: { 'Rampout D': 'Budi' } }, ['Rampout D', 'Rampout E']);
  assert.deepEqual(two.map(m => m.label), ['Supervisor Avsec Rampout E']);
});

test('BA Serah Terima: nama penyerah/penerima dan minimal 1 barang berisi nama', () => {
  const ba = { tanggal: 'x', waktu: '10:00', penyerahNama: 'A', penerimaNama: 'B' };
  assert.deepEqual(validateBASerahTerima(ba, [{ nama: 'Kabel' }, { nama: '' }]), []);
  assert.deepEqual(keys(validateBASerahTerima({ ...ba, penyerahNama: '', penerimaNama: ' ' }, [{ nama: '' }])), ['penyerahNama', 'penerimaNama', 'items']);
});

test('Initial Report dan Perbaikan: penanda poin kosong dianggap belum diisi', () => {
  const ir = { peralatan: 'X', lokasiList: [{ lokasi1: 'PSCP D' }], tanggal: 'x', waktuMulai: '1', teknisi: 'A', permasalahan: '• ', uraian: '•', dampak: '1. ', tindakanMitigasi: 'a', status: 'On Progress' };
  assert.deepEqual(keys(validateInitialReport(ir)), ['permasalahan', 'uraian', 'dampak']);
  const pb = { peralatan: 'X', lokasiList: [{ lokasi1: '' }], sumberLaporan: '', indikasiAwal: '', tanggal: 'x', waktuMulai: '1', waktuSelesai: '', teknisi: '-', permasalahan: '• ', tindakLanjut: '• ' };
  assert.deepEqual(keys(validatePerbaikan(pb, false)), ['lokasi', 'sumberLaporan', 'indikasiAwal', 'waktuSelesai', 'teknisi', 'permasalahan', 'tindakLanjut']);
  assert.ok(!keys(validatePerbaikan(pb, true)).includes('indikasiAwal'));
});

test('Kalibrasi: pesan menyebut parameter spesifik dan nomor lokasi bila lebih dari satu entri', () => {
  const g = { tanggal: 'x', waktuMulai: '08:00', waktuSelesai: '09:00' };
  const xray = { peralatan: ['X-Ray'], lokasi1: 'PSCP D', xrayKvV: '', xrayKvH: '140', xrayMaV: '0.7', xrayMaH: '0.7', xrayOnV: 'Normal', xrayOnH: 'Normal', xrayArchive: '+- 1 bulan' };
  assert.deepEqual(validateKalibrasi(g, [xray]), [{ key: 'kal-0-xrayKvV', label: 'kV Vertikal X-Ray' }]);
  const two = validateKalibrasi(g, [xray, { peralatan: [], lokasi1: '' }]);
  assert.deepEqual(two.map(m => m.label), ['kV Vertikal X-Ray (Lokasi #1)', 'peralatan (Lokasi #2)']);
  assert.deepEqual(keys(validateKalibrasi({ tanggal: '', waktuMulai: '', waktuSelesai: '' }, [xray])).slice(0, 3), ['tanggal', 'waktuMulai', 'waktuSelesai']);
  const ac = { peralatan: ['Access Control'], acLokasi: [], acEmlock: 'Berfungsi', acIntercom: 'Berfungsi', acFingerprint: 'Berfungsi', acCctv: 'Berfungsi', acPengontrolan: 'Berfungsi', acRecordCctv: '' };
  assert.deepEqual(keys(validateKalibrasi(g, [ac])), ['kal-0-lokasi', 'kal-0-acRecordCctv']);
});

test('Pesan maskot: menyebut isian, dan meringkas daftar panjang', () => {
  assert.equal(buildMissingPetMessage([{ key: 'a', label: 'lokasi' }]), 'Bip bip! Hasil scan: lokasi belum diisi.');
  assert.equal(buildMissingPetMessage([]), null);
  const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(k => ({ key: k, label: k }));
  assert.equal(buildMissingPetMessage(many), 'Bip bip! Hasil scan: a, b, c, d dan 3 isian lainnya belum diisi.');
});

import { readFileSync } from 'node:fs';

test('Semua tab berformulir mematikan validasi bawaan browser dan melapor lewat reportMissingFields', () => {
  const tabs = ['Kehadiran', 'Briefing', 'Storing', 'Checklist', 'InitialReport', 'Perbaikan', 'Kalibrasi', 'Kegiatan', 'BASerahTerima'];
  for (const tab of tabs) {
    const src = readFileSync(new URL(`../src/components/features/Tab${tab}.tsx`, import.meta.url), 'utf8');
    assert.match(src, /<form onSubmit=\{\w+\} noValidate/, `Tab${tab} harus memakai noValidate`);
    assert.match(src, /reportMissingFields\(missing\)/, `Tab${tab} harus melapor lewat reportMissingFields`);
    assert.doesNotMatch(src, /window\.scrollTo\(\{ top: 0/, `Tab${tab} tidak boleh menggulir ke atas halaman`);
  }
});

test('Peringatan isian kosong tidak lagi memakai alert()', () => {
  for (const tab of ['Storing', 'BASerahTerima']) {
    const src = readFileSync(new URL(`../src/components/features/Tab${tab}.tsx`, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /alert\(["'`](Harap|Pastikan)/);
  }
});
