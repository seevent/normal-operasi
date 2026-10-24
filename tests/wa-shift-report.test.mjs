import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildShiftReportMessage, nextShiftOf } from '../src/lib/utils/shiftReportMessage.ts';

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

const NEXT = { date: '2026-09-30', shift: 'PS', api: [person('PS', 'Romie Ade Putra A')], ias: [person('PS', 'Sayuti'), person('PS', 'Nora Agil R')] };

const EXPECTED = `Assalamualaikum Warahmatullahi Wabarakatuh
Izin menyampaikan _Closing Briefing_ Unit SSES T2

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

2. Perbaikan ETD Leidos QS-B220 di PSCP E 2
Permasalahan : Etd membutuhkan kalibrasi negatif
Tindak lanjut  :
- Dilakukan Melakukan pemeriksaan pc cctv D & E
- Reconnect pada aplikasi fvms
- Test Fungsi, Normal Operasi

3. Perbaikan Acces Control di Ruang Monitoring E1 PC CCTV D dan E
Permasalahan : Terdapat disconect pada tampilan cctv D & E
Tindak lanjut  :
- Dilakukan pemeriksaan pc cctv D & E
- Reconnect pada aplikasi fvms
- Test Fungsi, Normal Operasi

4. Preventive Maintenance & Kalibrasi Acces Control, Lokasi Rampout E, Ruang Monitoring E1, Aviobridge E & BL E, Normal Operasi
${PREVENTIVE_BODY}

Daftar Personil :
Hari/Tanggal/Dinas : Selasa, 29 September 2026/M

Personel API T2 :
- Dimas Aria Wiratama

Personel OM IAS T2 :
- Harmin Sanjayah
- Abdul Rifan Sukarno

Daftar Personil :
Hari/Tanggal/Dinas : Rabu, 30 September 2026/PS

Personel API T2 :
- Romie Ade Putra A

Personel OM IAS T2 :
- Sayuti
- Nora Agil R

Demikian disampaikan laporan kegiatan unit SSES T2.
Terima Kasih

Wassalamualaikum Warahmatullahi Wabarakatuh
#salam sehat, salam sejahtera 🤲🤲🤲`;

test('semua shift: keluaran sama persis dengan contoh format Closing Briefing, diakhiri blok shift berikutnya', () => {
  assert.equal(buildShiftReportMessage('2026-09-29', 'ALL', api, ias, reports, getDefaultUraian, NEXT), EXPECTED);
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

  assert.ok(msg.includes('1. Perbaikan ETD Leidos B220 di PSCP E 2\nPermasalahan : Muncul Notif Calibration Required\nTindak lanjut  :\n- Dilakukan Cleaning\n- Dilakukan Calibrasi Negative\n- Blank Sample Test\n- Normal Operasi, Pekerjaan Selesai'));
  assert.ok(msg.includes('2. Perbaikan X-Ray Rapiscan 620DV di PSCP F 3\nPermasalahan : xray off karena tidak ada tegangan\nTindak lanjut  :\n- cek power, tidak ada tegangan\n- koordinasi dengan teknik listrik, Pekerjaan Selesai'));
  assert.ok(msg.includes('3. Perbaikan WTMD CEIA di PSCP D 1\nPermasalahan :\n- alarm terus menyala\n- sensitivitas tidak stabil\nTindak lanjut  :\n- reset, Normal Operasi'));
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

test('nextShiftOf: PS -> M hari yang sama; M dan semua shift -> PS esok hari, tanpa bergeser zona waktu', () => {
  assert.deepEqual(nextShiftOf('2026-10-24', 'PS'), { date: '2026-10-24', shift: 'M' });
  assert.deepEqual(nextShiftOf('2026-10-23', 'M'), { date: '2026-10-24', shift: 'PS' });
  assert.deepEqual(nextShiftOf('2026-10-23', 'ALL'), { date: '2026-10-24', shift: 'PS' });
  assert.deepEqual(nextShiftOf('2026-12-31', 'M'), { date: '2027-01-01', shift: 'PS' });
  assert.deepEqual(nextShiftOf('2028-02-28', 'M'), { date: '2028-02-29', shift: 'PS' });
  assert.deepEqual(nextShiftOf('bukan-tanggal', 'M'), { date: 'bukan-tanggal', shift: 'PS' });
});

test('tanpa data shift berikutnya, pesan tidak memuat blok serah terima', () => {
  const msg = buildShiftReportMessage('2026-09-29', 'PS', api, ias, [], getDefaultUraian);
  assert.equal((msg.match(/Daftar Personil :/g) || []).length, 1);
});

test('jadwal shift berikutnya kosong tampil "- -" agar terlihat belum ada jadwal', () => {
  const msg = buildShiftReportMessage('2026-09-29', 'PS', api, ias, [], getDefaultUraian, { date: '2026-09-29', shift: 'M', api: [], ias: [] });
  assert.match(msg, /Dinas : Selasa, 29 September 2026\/M\n\nPersonel API T2 :\n- -\n\nPersonel OM IAS T2 :\n- -\n\nDemikian/);
});

test('contoh dari pengguna: Closing Briefing shift M 23 Oktober 2026 dengan serah terima ke PS 24 Oktober 2026', () => {
  const o = (shift, nama) => ({ shift, personel: { nama } });
  const apiRows = [o('M', 'Dwisasono Glory Prayoga'), o('M', 'Rio Anang Kriswanto')];
  const iasRows = [o('M', 'Muhammad Agus Sofyan'), o('M', 'Abdul Rifan Sukarno')];
  const fix = (extra) => ({ shift: 'M', Jenis: 'Perbaikan', kategori_maintenance: 'CORRECTIVE', Status: 'Normal Operasi', ...extra });
  const rows = [
    fix({ Peralatan: 'X-Ray Rapiscan 620DV', Lokasi: 'PSCP Umrah 5', Uraian: '• X-ray Tidak Bisa Login\n• PC X-ray hang', TindakLanjut: '• Dilakukan Restart PC\n• Test Input User \n• Running Test' }),
    { shift: 'M', Jenis: 'Storing', Peralatan: 'X-Ray', Lokasi: 'PSCP D', Uraian: 'Storing Peralatan', TindakLanjut: '-', Status: 'Normal Operasi' },
    fix({ Peralatan: 'Access Control', Lokasi: 'Arrival F 7 In', Uraian: 'Device Fingerprint Off', TindakLanjut: '• Dilakukan Pengecekan Cable, Hasil Normal\n• Dilakukan Pengecekan Device, Hasil Eror\n• Dilakukan Setting Device Fingerprint Baru\n• Menggunakan IP Existing(172.17.62.102)\n• Dilakukan Penggantian Device Baru\n• Test Fungsi' }),
    fix({ Peralatan: 'ETD Leidos B220', Lokasi: 'PSCP E 2', Uraian: 'Muncul Notif Calibration Required ', TindakLanjut: '• Dilakukan Mirroring Regeneration \n• Dilakukan Cleaning Proses\n• Dilakukan Calibrasi Negative\n• Test Blank Sample' }),
    fix({ Peralatan: 'X-Ray Nuctech CX100100D', Lokasi: 'HBSCP 2.1', Uraian: 'Gambar Monitor X-ray Kanan Bergaris', TindakLanjut: '• Dilakukan Proses emandation \n• Running Test' }),
  ];
  const next = {
    date: '2026-10-24', shift: 'PS',
    api: [o('PS', 'Romie Ade Putra Apriansyah'), o('PS', 'Yuli Syarif')],
    ias: [o('PS', 'Aly Masmudi'), o('PS', 'Wellynthon Agustinus'), o('PS', 'Nandio Prihardana')],
  };

  const expected = `Assalamualaikum Warahmatullahi Wabarakatuh
Izin menyampaikan _Closing Briefing_ Unit SSES T2

Daftar Personil :
Hari/Tanggal/Dinas : Jumat, 23 Oktober 2026/M

Personel API T2 :
- Dwisasono Glory Prayoga
- Rio Anang Kriswanto

Personel OM IAS T2 :
- Muhammad Agus Sofyan
- Abdul Rifan Sukarno

Kegiatan :

1. Perbaikan X-Ray Rapiscan 620DV di PSCP Umrah 5
Permasalahan :
- X-ray Tidak Bisa Login
- PC X-ray hang
Tindak lanjut  :
- Dilakukan Restart PC
- Test Input User
- Running Test, Normal Operasi

2. Storing Peralatan : Semua Peralatan Faskampen (X-Ray, WTMD, HHMD, BodyScanner, ETD, Dan Access Control) Dalam Keadaan Normal Operasi

3. Perbaikan Access Control di Arrival F 7 In
Permasalahan : Device Fingerprint Off
Tindak lanjut  :
- Dilakukan Pengecekan Cable, Hasil Normal
- Dilakukan Pengecekan Device, Hasil Eror
- Dilakukan Setting Device Fingerprint Baru
- Menggunakan IP Existing(172.17.62.102)
- Dilakukan Penggantian Device Baru
- Test Fungsi, Normal Operasi

4. Perbaikan ETD Leidos B220 di PSCP E 2
Permasalahan : Muncul Notif Calibration Required
Tindak lanjut  :
- Dilakukan Mirroring Regeneration
- Dilakukan Cleaning Proses
- Dilakukan Calibrasi Negative
- Test Blank Sample, Normal Operasi

5. Perbaikan X-Ray Nuctech CX100100D di HBSCP 2.1
Permasalahan : Gambar Monitor X-ray Kanan Bergaris
Tindak lanjut  :
- Dilakukan Proses emandation
- Running Test, Normal Operasi

Daftar Personil :
Hari/Tanggal/Dinas : Sabtu, 24 Oktober 2026/PS

Personel API T2 :
- Romie Ade Putra Apriansyah
- Yuli Syarif

Personel OM IAS T2 :
- Aly Masmudi
- Wellynthon Agustinus
- Nandio Prihardana

Demikian disampaikan laporan kegiatan unit SSES T2.
Terima Kasih

Wassalamualaikum Warahmatullahi Wabarakatuh
#salam sehat, salam sejahtera 🤲🤲🤲`;

  assert.equal(buildShiftReportMessage('2026-10-23', 'M', apiRows, iasRows, rows, getDefaultUraian, next), expected);
});

test('TabShiftReport mengambil jadwal shift berikutnya untuk blok serah terima', () => {
  const src = readFileSync(new URL('../src/components/features/TabShiftReport.tsx', import.meta.url), 'utf8');
  assert.match(src, /nextShiftOf\(date, shift\)/);
  assert.match(src, /generateWA_ShiftReport\(date, shift, apiPersonil, iasPersonil, reports, nextPersonil \?\? undefined\)/);
});
