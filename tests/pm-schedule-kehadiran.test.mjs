import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { 
  formatPmRencanaKegiatan, 
  filterActivePm,
  parseSheetPm,
  buildRencanaKegiatan,
  RENCANA_KEGIATAN_DASAR
} from '../src/lib/utils/pmScheduleParser.ts';
import { generateWA_Kehadiran } from '../src/lib/utils/kehadiranMessage.ts';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('Excel Parser Cell Color: Yellow and Red are Shift PS, Blue is Shift M', () => {
  // Mock sheet with headers and colored cells
  const mockWorksheet = {
    '!ref': 'A1:E6',
    'B1': { v: 'LOKASI' },
    'C1': { v: 'MERK/TYPE' },
    'D2': { v: 1 },
    'E2': { v: 2 },
    // Row 3: WTMD CEIA with Kuning on col D (date 1), Merah on col E (date 2)
    'B3': { v: 'PSCP D 1' },
    'C3': { v: 'WTMD CEIA' },
    'D3': { v: '', s: { fgColor: { rgb: 'FFFF00' } } }, // Kuning -> Mingguan PS
    'E3': { v: '', s: { fgColor: { rgb: 'FF0000' } } }, // Merah -> Bulanan PS
    // Row 4: X-Ray with Biru on col D (date 1)
    'B4': { v: 'HBSCP' },
    'C4': { v: 'X-Ray Rapiscan 628 DV' },
    'D4': { v: '', s: { fgColor: { rgb: '0070C0' } } }  // Biru -> Bulanan M
  };

  const records = parseSheetPm(mockWorksheet, 9, 2026);
  assert.equal(records.length, 3);

  const kuningRec = records.find(r => r.kategori_pm === 'PM Mingguan');
  assert.ok(kuningRec);
  assert.equal(kuningRec.shift, 'PS', 'Kuning must be shift PS (not ALL or M)');

  const merahRec = records.find(r => r.kategori_pm === 'Kalibrasi & PM Bulanan (PS)');
  assert.ok(merahRec);
  assert.equal(merahRec.shift, 'PS', 'Merah must be shift PS');

  const biruRec = records.find(r => r.kategori_pm === 'Kalibrasi & PM Bulanan (M)');
  assert.ok(biruRec);
  assert.equal(biruRec.shift, 'M', 'Biru must be shift M');
});

test('Shift & Color Rules: Blue is Shift M only, Red & Yellow are Shift PS only', () => {
  const mockPmRecords = [
    { lokasi: 'PSCP D', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA', kategori_pm: 'PM Mingguan', shift: 'PS' },
    { lokasi: 'PSCP D', titik: '2', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 620DV', kategori_pm: 'Kalibrasi & PM Bulanan (PS)', shift: 'PS' },
    { lokasi: 'HBSCP', titik: '1.1', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 628DV', kategori_pm: 'Kalibrasi & PM Bulanan (M)', shift: 'M' }
  ];

  // Test Shift PS: kuning & merah harus tampil, biru TIDAK tampil
  const psFiltered = filterActivePm(mockPmRecords, 'PS');
  assert.equal(psFiltered.length, 2);
  assert.ok(psFiltered.some(r => r.kategori_pm === 'PM Mingguan'));
  assert.ok(psFiltered.some(r => r.kategori_pm === 'Kalibrasi & PM Bulanan (PS)'));
  assert.ok(!psFiltered.some(r => r.shift === 'M'));

  // Test Shift M: biru harus tampil, kuning & merah TIDAK tampil
  const mFiltered = filterActivePm(mockPmRecords, 'M');
  assert.equal(mFiltered.length, 1);
  assert.equal(mFiltered[0].shift, 'M');
  assert.equal(mFiltered[0].kategori_pm, 'Kalibrasi & PM Bulanan (M)');
});

test('Format PM Rencana Kegiatan: groups Mingguan and Bulanan with explicit headers', () => {
  const mixedRecords = [
    { lokasi: 'PSCP D', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA', kategori_pm: 'PM Mingguan' },
    { lokasi: 'PSCP D', titik: '2', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 620DV', kategori_pm: 'Kalibrasi & PM Bulanan (PS)' },
    { lokasi: 'PSCP D', titik: '2', jenis: 'ETD', tipe: 'ETD Leidos B220', kategori_pm: 'Kalibrasi & PM Bulanan (PS)' }
  ];

  assert.equal(formatPmRencanaKegiatan(mixedRecords), [
    '*Jadwal Preventive Mingguan :*',
    '📍PSCP D 1',
    '- WTMD CEIA',
    '',
    '*Jadwal Preventive Bulanan :*',
    '📍PSCP D 2',
    '- X-Ray Rapiscan 620DV',
    '- ETD Leidos B220'
  ].join('\n'));

  // Hanya Mingguan
  const mingguanOnly = [
    { lokasi: 'PSCP D', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA', kategori_pm: 'PM Mingguan' }
  ];
  const formattedMingguan = formatPmRencanaKegiatan(mingguanOnly);
  assert.ok(formattedMingguan.includes('*Jadwal Preventive Mingguan :*'));
  assert.ok(!formattedMingguan.includes('*Jadwal Preventive Bulanan :*'));

  // Hanya Bulanan
  const bulananOnly = [
    { lokasi: 'HBSCP', titik: '1.1', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 628DV', kategori_pm: 'Kalibrasi & PM Bulanan (M)' }
  ];
  assert.equal(formatPmRencanaKegiatan(bulananOnly), '*Jadwal Preventive Bulanan :*\n📍HBSCP 1.1\n- X-Ray Rapiscan 628DV');
});

test('PM Display Settings Filter: can disable specific categories or equipment types', () => {
  const records = [
    { lokasi: 'PSCP D', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA', kategori_pm: 'PM Mingguan', shift: 'PS' },
    { lokasi: 'PSCP D', titik: '2', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 620DV', kategori_pm: 'Kalibrasi & PM Bulanan (PS)', shift: 'PS' },
    { lokasi: 'Breakdown E1', titik: '-', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: 'Kalibrasi & PM Bulanan (PS)', shift: 'PS' }
  ];

  // 1. Disable Access Control type
  const filterNoAccess = filterActivePm(records, 'PS', {
    types: { 'Access Control': false }
  });
  assert.equal(filterNoAccess.length, 2);
  assert.ok(!filterNoAccess.some(r => r.jenis === 'Access Control'));

  // 2. Disable PM Mingguan category
  const filterNoMingguan = filterActivePm(records, 'PS', {
    categories: { 'PM Mingguan': false }
  });
  assert.equal(filterNoMingguan.length, 2);
  assert.ok(filterNoMingguan.every(r => r.kategori_pm === 'Kalibrasi & PM Bulanan (PS)'));
});

test('Access Control PM Mingguan tampil pada shift M, bukan shift PS', () => {
  const records = [
    { lokasi: 'Breakdown E1', titik: '-', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: 'PM Mingguan', shift: 'PS' },
    { lokasi: 'PSCP D', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA', kategori_pm: 'PM Mingguan', shift: 'PS' }
  ];

  const ps = filterActivePm(records, 'PS');
  assert.deepEqual(ps.map(r => r.jenis), ['WTMD']);

  const m = filterActivePm(records, 'M');
  assert.deepEqual(m.map(r => r.jenis), ['Access Control']);

  // Pengaturan tampilan tetap berlaku di shift M
  assert.equal(filterActivePm(records, 'M', { categories: { 'PM Mingguan': false } }).length, 0);
  assert.equal(filterActivePm(records, 'M', { types: { 'Access Control': false } }).length, 0);
});

test('TabKehadiran & PmScheduleUploader integration: uses pmDisplaySettings and filterActivePm', () => {
  const tabKehadiran = readProjectFile('src/components/features/TabKehadiran.tsx');
  const uploader = readProjectFile('src/components/features/PmScheduleUploader.tsx');
  const store = readProjectFile('src/store/useMasterDataStore.ts');

  assert.match(tabKehadiran, /filterActivePm/);
  assert.match(tabKehadiran, /pmDisplaySettings/);

  assert.match(uploader, /Pengaturan Tampilan Jenis PM di Tab Kehadiran/);
  assert.match(uploader, /togglePmCategorySetting/);
  assert.match(uploader, /togglePmTypeSetting/);

  assert.match(store, /pmDisplaySettings/);
  assert.match(store, /togglePmCategorySetting/);
  assert.match(store, /togglePmTypeSetting/);
});

const M = 'PM Mingguan';
const B = 'Kalibrasi & PM Bulanan (PS)';
// Sengaja dalam urutan acak untuk memastikan hasil diurutkan: lokasi alfabetis (angka natural),
// peralatan X-Ray, WTMD, Body Scanner, ETD; Access Control di bawah.
const sampleRecords = [
  { lokasi: 'Server Access', titik: '-', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: M },
  { lokasi: 'PSCP Umrah', titik: '2', jenis: 'Body Scanner', tipe: 'Body Scanner Leidos Provision 2', kategori_pm: M },
  { lokasi: 'PSCP Umrah', titik: '2', jenis: 'X-Ray', tipe: 'X-Ray Nuctech CX6040D', kategori_pm: M },
  { lokasi: 'PSCP E', titik: '3', jenis: 'WTMD', tipe: 'WTMD CEIA HI-PE/PZ Multizone', kategori_pm: M },
  { lokasi: 'PSCP E', titik: '3', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 620DV', kategori_pm: M },
  { lokasi: 'HBSCP', titik: '1.4', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 628DV', kategori_pm: M },
  { lokasi: 'PSCP Umrah', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA HI-PE/PZ Multizone', kategori_pm: M },
  { lokasi: 'PSCP Umrah', titik: '1', jenis: 'X-Ray', tipe: 'X-Ray Smith Heimann HS 6040T-2is', kategori_pm: M },
  { lokasi: 'Rampout D', titik: '2', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: M },
  { lokasi: 'Aviobridge D', titik: '1', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: M },
  { lokasi: 'Server Access', titik: '-', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: B },
  { lokasi: 'Rampout D', titik: '2', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: B },
  { lokasi: 'Aviobridge D', titik: '1', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: B },
  { lokasi: 'PSCP D', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA HI-PE/PZ Multizone', kategori_pm: B },
  { lokasi: 'PSCP D', titik: '1', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 620DV', kategori_pm: B }
];

const EXPECTED_JADWAL = [
  '*Jadwal Preventive Mingguan :*',
  '📍HBSCP 1.4',
  '- X-Ray Rapiscan 628DV',
  '📍PSCP E 3',
  '- X-Ray Rapiscan 620DV',
  '- WTMD CEIA HI-PE/PZ Multizone',
  '📍PSCP Umrah 1',
  '- X-Ray Smith Heimann HS 6040T-2is',
  '- WTMD CEIA HI-PE/PZ Multizone',
  '📍PSCP Umrah 2',
  '- X-Ray Nuctech CX6040D',
  '- Body Scanner Leidos Provision 2',
  '',
  '- Access Control',
  '📍Aviobridge D 1',
  '📍Rampout D 2',
  '📍Server Access',
  '',
  '*Jadwal Preventive Bulanan :*',
  '📍PSCP D 1',
  '- X-Ray Rapiscan 620DV',
  '- WTMD CEIA HI-PE/PZ Multizone',
  '',
  '- Access Control',
  '📍Aviobridge D 1',
  '📍Rampout D 2',
  '📍Server Access'
].join('\n');

test('Jadwal Preventive cocok dengan contoh format (Mingguan dan Bulanan, Access Control di bawah)', () => {
  assert.equal(formatPmRencanaKegiatan(sampleRecords), EXPECTED_JADWAL);
});

test('Jadwal Preventive: bagian yang hanya berisi Access Control tidak diawali baris kosong', () => {
  assert.equal(
    formatPmRencanaKegiatan([{ lokasi: 'Rampout D', titik: '2', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: B }]),
    '*Jadwal Preventive Bulanan :*\n- Access Control\n📍Rampout D 2'
  );
});

test('Laporan Kehadiran WA matches user template', () => {
  const message = generateWA_Kehadiran({
    tanggal: '2026-09-28',
    shift: 'Pagi, 08.00 - 20.00 WIB',
    apiList: [
      { name: 'Dimas Aria Wiratama', phone: '081296778575', status: 'Hadir', dbOrder: 1 },
      { name: 'Dhea Febriani', phone: '087883390219', status: 'Hadir', dbOrder: 2 }
    ],
    omList: [
      { name: 'Sayuti', phone: '083804054535', status: 'Hadir', dbOrder: 1 },
      { name: 'Nora Agil Rumayani', phone: '08970320998', status: 'Hadir', dbOrder: 2 },
      { name: 'Harmin Sanjayah', phone: '081803767148', status: 'Hadir', dbOrder: 3 },
      { name: 'Abdul Rifan Sukarno', phone: '083111807154', status: 'Hadir', dbOrder: 4 }
    ],
    tlpRuangan: '- 021 550 5910',
    rencanaKegiatan: buildRencanaKegiatan(RENCANA_KEGIATAN_DASAR, sampleRecords, true)
  });

  const expected = [
    'Semangat Pagii.....!!!',
    '',
    '*LAPORAN DINAS*',
    '*T2 Safety & Security Electronic Services*',
    '',
    'Dinas    : Pagi, 08.00 - 20.00 WIB',
    'Hari      : Senin, 28 September 2026',
    '',
    '*Personel API T2 :*',
    '- Dimas Aria Wiratama - Hadir',
    '     Tlp : 081296778575',
    '- Dhea Febriani - Hadir',
    '     Tlp : 087883390219',
    '',
    '*Personel OM IASS T2 :*',
    '- Sayuti - Hadir',
    '     Tlp : 083804054535',
    '- Nora Agil Rumayani - Hadir',
    '     Tlp : 08970320998',
    '- Harmin Sanjayah - Hadir',
    '     Tlp : 081803767148',
    '- Abdul Rifan Sukarno - Hadir',
    '     Tlp : 083111807154',
    '',
    'Tlp Ruangan :',
    '- 021 550 5910',
    '',
    '*Rencana Kegiatan :*',
    '- Monitoring Operasional',
    '- Storing Peralatan',
    '- Preventive Maintenance & Kalibrasi Peralatan',
    ''
  ].join('\n') + '\n' + EXPECTED_JADWAL;

  assert.equal(message, expected);
});

test('Rencana Kegiatan tanpa jadwal PM: shift Pagi tetap ada baris PM, shift Malam tidak', () => {
  assert.equal(buildRencanaKegiatan(RENCANA_KEGIATAN_DASAR, [], true), '- Monitoring Operasional\n- Storing Peralatan\n- Preventive Maintenance & Kalibrasi Peralatan');
  assert.equal(buildRencanaKegiatan(RENCANA_KEGIATAN_DASAR, [], false), '- Monitoring Operasional\n- Storing Peralatan');
});
