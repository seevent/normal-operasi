import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildShiftReportMessage } from '../src/lib/utils/shiftReportMessage.ts';

const PREVENTIVE_BODY = `Kegiatan :
- Pembersihan Emlock, Switch, Intercom, Fingerprint & CCTV
- Pengecekan Fungsi Emlock, Intercom, Fingerprint, CCTV, Pengontrolan Kunci Pintu, Record CCTV
   
Catatan :
- Fungsi Emlock : Berfungsi
- Fungsi Intercom : Berfungsi
- Fungsi Fingerprint: Berfungsi
- Fungsi CCTV : Berfungsi
- Fungsi Pengontrolan Kunci Pintu : Berfungsi
- Record CCTV : +- 1 bulan`;

const getDefaultUraian = () => PREVENTIVE_BODY;
const person = (shift, nama) => ({ shift, personel: { nama } });

const api = [person('PS', 'Romie Ade Putra A'), person('M', 'Dimas Aria Wiratama')];
const ias = [
  person('PS', 'Sayuti'), person('PS', 'Nora Agil R'), person('PS', 'Wellynthon Agustinus '), person('PS', 'Nandio Prihardana'),
  person('M', 'Harmin Sanjayah'), person('M', 'Abdul Rifan Sukarno'),
];

const reports = [
  { shift: 'PS', Jenis: 'Storing', Peralatan: 'X-Ray', Lokasi: 'PSCP D', Uraian: 'Storing Peralatan', TindakLanjut: '-', Status: 'Normal Operasi' },
  { shift: 'PS', Jenis: 'Storing', Peralatan: 'WTMD', Lokasi: 'PSCP E', Uraian: 'Storing Peralatan', TindakLanjut: '-', Status: 'Normal Operasi' },
  {
    shift: 'PS', Jenis: 'Perbaikan', kategori_maintenance: 'CORRECTIVE', Peralatan: 'ETD Leidos QS-B220', Lokasi: 'PSCP E No.2',
    Uraian: 'Etd membutuhkan kalibrasi negatif',
    TindakLanjut: '• Dilakukan Melakukan pemeriksaan pc cctv D & E\n• Reconnect pada aplikasi fvms\n• Test Fungsi', Status: 'Normal Operasi',
  },
  {
    shift: 'PS', Jenis: 'Perbaikan', kategori_maintenance: 'CORRECTIVE', Peralatan: 'Acces Control', Lokasi: 'Ruang Monitoring E1 PC CCTV D dan E',
    Uraian: 'Terdapat disconect pada tampilan cctv D & E',
    TindakLanjut: 'Dilakukan pemeriksaan pc cctv D & E\nReconnect pada aplikasi fvms\nTest Fungsi', Status: 'Normal Operasi',
  },
  {
    shift: 'PS', Jenis: 'Kalibrasi', kategori_maintenance: 'PREVENTIVE', Peralatan: 'Acces Control',
    Lokasi: 'Rampout E, Ruang Monitoring E1, Aviobridge E & BL E', Uraian: PREVENTIVE_BODY, TindakLanjut: '-', Status: 'Normal Operasi',
  },
];

const EXPECTED = `Assalamualaikum Warahmatullahi Wabarakatuh
Izin menyampaikan Closing briefing tim T2 SSES

Daftar Personil :
Hari/Tanggal/Dinas : Selasa, 29 September 2026/PS

Personel API T2 :
- Romie Ade Putra A

Personel OM IAS T2 :
- Sayuti
- Nora Agil R
- Wellynthon Agustinus
- Nandio Prihardana

Kegiatan :

1. Storing Peralatan : Semua Peralatan Faskampen (X-Ray, WTMD, HHMD, BodyScanner, ETD, Dan Access Control) Dalam Keadaan Normal Operasi

2. Perbaikan ETD Leidos QS-B220, Lokasi PSCP E No.2, Etd membutuhkan kalibrasi negatif, Dilakukan Melakukan pemeriksaan pc cctv D & E, Reconnect pada aplikasi fvms, Test Fungsi, Normal Operasi

3. Perbaikan Acces Control, Lokasi Ruang Monitoring E1 PC CCTV D dan E, Terdapat disconect pada tampilan cctv D & E, Dilakukan pemeriksaan pc cctv D & E, Reconnect pada aplikasi fvms, Test Fungsi, Normal Operasi

4. Preventive Maintenance & Kalibrasi Acces Control, Lokasi Rampout E, Ruang Monitoring E1, Aviobridge E & BL E, Normal Operasi
${PREVENTIVE_BODY}

Daftar Personil :
Hari/Tanggal/Dinas : Selasa, 29 September 2026/M

Personel API T2 :
- Dimas Aria Wiratama

Personel OM IAS T2 :
- Harmin Sanjayah
- Abdul Rifan Sukarno

Demikian disampaikan laporan kegiatan unit T2 SSES.
Terima Kasih

Wassalamualaikum Warahmatullahi Wabarakatuh
#salam sehat, salam sejahtera 🤲🤲🤲`;

test('semua shift: keluaran sama persis dengan contoh format Closing briefing', () => {
  assert.equal(buildShiftReportMessage('2026-09-29', 'ALL', api, ias, reports, getDefaultUraian), EXPECTED);
});

test('satu shift: hanya blok shift tersebut dan semua kegiatan dimasukkan', () => {
  const msg = buildShiftReportMessage('2026-09-29', 'M', api, ias, [], getDefaultUraian);
  assert.match(msg, /Hari\/Tanggal\/Dinas : Selasa, 29 September 2026\/M/);
  assert.doesNotMatch(msg, /\/PS/);
  assert.match(msg, /- Dimas Aria Wiratama/);
  assert.doesNotMatch(msg, /Romie/);
  assert.doesNotMatch(msg, /Kegiatan :/);
});

test('storing beberapa baris digabung menjadi satu butir', () => {
  const msg = buildShiftReportMessage('2026-09-29', 'PS', api, ias, reports.slice(0, 2), getDefaultUraian);
  assert.equal((msg.match(/Storing Peralatan :/g) || []).length, 1);
  assert.match(msg, /1\. Storing Peralatan/);
  assert.doesNotMatch(msg, /\n2\. /);
});

test('personel kosong ditulis "- -" dan shift kosong dilewati pada mode semua shift', () => {
  const single = buildShiftReportMessage('2026-09-29', 'PS', [], [], [], getDefaultUraian);
  assert.match(single, /Personel API T2 :\n- -\n\nPersonel OM IAS T2 :\n- -/);
  const onlyPs = buildShiftReportMessage('2026-09-29', 'ALL', [person('PS', 'Sayuti')], [], [], getDefaultUraian);
  assert.doesNotMatch(onlyPs, /\/M\b/);
});

test('hari dan tanggal tidak bergeser oleh zona waktu', () => {
  const prev = process.env.TZ;
  try {
    for (const tz of ['UTC', 'America/Los_Angeles', 'Asia/Jakarta', 'Pacific/Kiritimati']) {
      process.env.TZ = tz;
      for (const [iso, expected] of [['2026-09-29', 'Selasa, 29 September 2026'], ['2026-01-01', 'Kamis, 1 Januari 2026'], ['2026-12-31', 'Kamis, 31 Desember 2026']]) {
        assert.match(buildShiftReportMessage(iso, 'PS', [], [], [], getDefaultUraian), new RegExp(`Dinas : ${expected}/PS`), `${tz} ${iso}`);
      }
    }
  } finally {
    if (prev === undefined) delete process.env.TZ; else process.env.TZ = prev;
  }
});

test('preventive tanpa Kegiatan pada uraian memakai teks bawaan', () => {
  const r = [{ shift: 'PS', Jenis: 'Kalibrasi', kategori_maintenance: 'PREVENTIVE', Peralatan: 'Extension Conveyor', Lokasi: 'PSCP D', Uraian: '-', TindakLanjut: '-', Status: 'Normal Operasi' }];
  const msg = buildShiftReportMessage('2026-09-29', 'PS', [], [], r, getDefaultUraian);
  assert.match(msg, /1\. Preventive Maintenance Extension Conveyor, Lokasi PSCP D, Normal Operasi\nKegiatan :/);
  assert.match(msg, /Catatan :\n- Fungsi Emlock/);
});

test('TabShiftReport menampilkan preview real-time dari pesan yang sama dengan Share WA', () => {
  const src = readFileSync(new URL('../src/components/features/TabShiftReport.tsx', import.meta.url), 'utf8');
  assert.match(src, /Preview Laporan WhatsApp \(Real-time\)/);
  assert.match(src, /\{waMessagePreview\}/);
  assert.match(src, /generateShiftWaSummary = \(\) => waMessagePreview/);
});

test('Perbaikan: tanda • pada permasalahan tidak ikut ke pesan, satu atau beberapa butir', () => {
  const msg = buildShiftReportMessage('2026-09-30', 'PS', api, ias, [
    {
      shift: 'PS', Jenis: 'Perbaikan', kategori_maintenance: 'CORRECTIVE', Peralatan: 'ETD Leidos B220', Lokasi: 'PSCP E No.2',
      Uraian: '• Muncul Notif Calibration Required',
      TindakLanjut: '• Dilakukan Cleaning\n• Dilakukan Calibrasi Negative\n• Blank Sample Test\n• Normal Operasi', Status: 'Pekerjaan Selesai',
    },
    {
      shift: 'PS', Jenis: 'Perbaikan', kategori_maintenance: 'CORRECTIVE', Peralatan: 'X-Ray Rapiscan 620DV', Lokasi: 'PSCP F No.3',
      Uraian: '• xray off karena tidak ada tegangan',
      TindakLanjut: '• cek power, tidak ada tegangan\n• koordinasi dengan teknik listrik', Status: 'Pekerjaan Selesai',
    },
    {
      shift: 'PS', Jenis: 'Perbaikan', kategori_maintenance: 'CORRECTIVE', Peralatan: 'WTMD CEIA', Lokasi: 'PSCP D No.1',
      Uraian: '• alarm terus menyala\n• sensitivitas tidak stabil', TindakLanjut: '• reset', Status: 'Normal Operasi',
    },
  ], getDefaultUraian);

  assert.ok(msg.includes('1. Perbaikan ETD Leidos B220, Lokasi PSCP E No.2, Muncul Notif Calibration Required, Dilakukan Cleaning, Dilakukan Calibrasi Negative, Blank Sample Test, Normal Operasi, Pekerjaan Selesai'));
  assert.ok(msg.includes('2. Perbaikan X-Ray Rapiscan 620DV, Lokasi PSCP F No.3, xray off karena tidak ada tegangan, cek power, tidak ada tegangan, koordinasi dengan teknik listrik, Pekerjaan Selesai'));
  assert.ok(msg.includes('3. Perbaikan WTMD CEIA, Lokasi PSCP D No.1, alarm terus menyala, sensitivitas tidak stabil, reset, Normal Operasi'));
  assert.ok(!msg.includes('•'));
});

test('Urutan personel di laporan mengikuti jabatan lalu urutan, sama dengan tab Kehadiran dan Data', () => {
  const p = (nama, jabatan, urutan) => ({ shift: 'PS', personel: { nama, jabatan, urutan } });
  // urutan masuk sengaja acak (seperti hasil query tanpa ORDER BY)
  const ias = [
    p('Aly Masmudi', 'Pembantu Teknisi', 3),
    p('Sayuti', 'Teknisi', 2),
    p('Edo Ferry Ardian', 'Supervisor', 1),
    p('Nora Agil Rumayani', 'Teknisi', 1),
  ];
  const apiRows = [p('Dhea Febriani', 'Technician', 2), p('Ageng Pandanaran', 'Supervisor', 1), p('Yuli Syarif', 'Engineer', 1)];
  const msg = buildShiftReportMessage('2026-10-01', 'PS', apiRows, ias, [], () => '');
  assert.ok(msg.includes('Personel API T2 :\n- Ageng Pandanaran\n- Yuli Syarif\n- Dhea Febriani'));
  assert.match(msg, /Personel OM IAS{1,2} T2 :\n- Edo Ferry Ardian\n- Nora Agil Rumayani\n- Sayuti\n- Aly Masmudi/);
});

test('Personel tanpa jabatan/urutan tetap pada urutan semula', () => {
  const p = (nama) => ({ shift: 'PS', personel: { nama } });
  const msg = buildShiftReportMessage('2026-10-01', 'PS', [p('Budi'), p('Andi'), p('Citra')], [], [], () => '');
  assert.ok(msg.includes('Personel API T2 :\n- Budi\n- Andi\n- Citra'));
});
