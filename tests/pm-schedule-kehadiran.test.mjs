import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { 
  formatPmRencanaKegiatan, 
  filterActivePm,
  parseSheetPm
} from '../src/lib/utils/pmScheduleParser.ts';

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

  const formatted = formatPmRencanaKegiatan(mixedRecords);
  assert.ok(formatted.includes(' Jadwal Mingguan:'));
  assert.ok(formatted.includes(' Jadwal Bulanan:'));
  assert.ok(formatted.includes(' PSCP D 1:'));
  assert.ok(formatted.includes(' - WTMD CEIA'));
  assert.ok(formatted.includes(' PSCP D 2:'));
  assert.ok(formatted.includes(' - X-Ray Rapiscan 620DV'));
  assert.ok(formatted.includes(' - ETD Leidos B220'));

  // Test only Mingguan
  const mingguanOnly = [
    { lokasi: 'PSCP D', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA', kategori_pm: 'PM Mingguan' }
  ];
  const formattedMingguan = formatPmRencanaKegiatan(mingguanOnly);
  assert.ok(formattedMingguan.includes(' Jadwal Mingguan:'));
  assert.ok(!formattedMingguan.includes(' Jadwal Bulanan:'));

  // Test only Bulanan
  const bulananOnly = [
    { lokasi: 'HBSCP', titik: '1.1', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 628DV', kategori_pm: 'Kalibrasi & PM Bulanan (M)' }
  ];
  const formattedBulanan = formatPmRencanaKegiatan(bulananOnly);
  assert.ok(!formattedBulanan.includes(' Jadwal Mingguan:'));
  assert.ok(formattedBulanan.includes(' Jadwal Bulanan:'));
  assert.ok(formattedBulanan.includes(' HBSCP 1.1:'));
  assert.ok(formattedBulanan.includes(' - X-Ray Rapiscan 628DV'));
});

test('PM Display Settings Filter: can disable specific categories or equipment types', () => {
  const records = [
    { lokasi: 'PSCP D', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA', kategori_pm: 'PM Mingguan', shift: 'PS' },
    { lokasi: 'PSCP D', titik: '2', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 620DV', kategori_pm: 'Kalibrasi & PM Bulanan (PS)', shift: 'PS' },
    { lokasi: 'Breakdown E1', titik: '-', jenis: 'Access Control', tipe: 'Access Control', kategori_pm: 'PM Mingguan', shift: 'PS' }
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
  assert.equal(filterNoMingguan.length, 1);
  assert.equal(filterNoMingguan[0].kategori_pm, 'Kalibrasi & PM Bulanan (PS)');
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

test('Complete Rencana Kegiatan format matches user template', () => {
  const sampleRecords = [
    { lokasi: 'HBSCP', titik: '1.1', tipe: 'X-Ray Rapiscan 628DV', kategori_pm: 'PM Mingguan' },
    { lokasi: 'HBSCP', titik: '1.3', tipe: 'X-Ray Rapiscan 628DV', kategori_pm: 'PM Mingguan' },
    { lokasi: 'PSCP E', titik: '2', tipe: 'X-Ray Rapiscan 620DV', kategori_pm: 'PM Mingguan' },
    { lokasi: 'PSCP E', titik: '2', tipe: 'Body Scanner Leidos Provision 2', kategori_pm: 'PM Mingguan' },
    { lokasi: 'PSCP E', titik: '2', tipe: 'ETD Leidos B220', kategori_pm: 'PM Mingguan' },
    { lokasi: 'PSCP F', titik: '2', tipe: 'X-Ray Rapiscan 620DV', kategori_pm: 'PM Mingguan' },
    { lokasi: 'PSCP F', titik: '2', tipe: 'Body Scanner Leidos Provision 2', kategori_pm: 'PM Mingguan' },
    { lokasi: 'PSCP F', titik: '2', tipe: 'WTMD CEIA HI-PE/PZ Multizone', kategori_pm: 'PM Mingguan' },
    { lokasi: 'Rampout D', titik: '2', tipe: 'Access Control', kategori_pm: 'Kalibrasi & PM Bulanan (PS)' },
    { lokasi: 'Aviobridge D', titik: '1', tipe: 'Access Control', kategori_pm: 'Kalibrasi & PM Bulanan (PS)' },
    { lokasi: 'Server Access', titik: '-', tipe: 'Access Control', kategori_pm: 'Kalibrasi & PM Bulanan (PS)' }
  ];

  const pmBlock = formatPmRencanaKegiatan(sampleRecords);
  const baseKegiatan = '1. Monitoring Operasional\n2. Storing Peralatan';
  const rencanaKegiatan = `${baseKegiatan}\n3. Preventive Maintenance & Kalibrasi Peralatan\n\n${pmBlock}`;

  const expected = [
    '1. Monitoring Operasional',
    '2. Storing Peralatan',
    '3. Preventive Maintenance & Kalibrasi Peralatan',
    '',
    ' Jadwal Mingguan:',
    ' HBSCP 1.1:',
    ' - X-Ray Rapiscan 628DV',
    ' HBSCP 1.3:',
    ' - X-Ray Rapiscan 628DV',
    ' PSCP E 2:',
    ' - X-Ray Rapiscan 620DV',
    ' - Body Scanner Leidos Provision 2',
    ' - ETD Leidos B220',
    ' PSCP F 2:',
    ' - X-Ray Rapiscan 620DV',
    ' - Body Scanner Leidos Provision 2',
    ' - WTMD CEIA HI-PE/PZ Multizone',
    '',
    ' Jadwal Bulanan:',
    ' Rampout D 2:',
    ' - Access Control',
    ' Aviobridge D 1:',
    ' - Access Control',
    ' Server Access:',
    ' - Access Control'
  ].join('\n');

  assert.equal(rencanaKegiatan, expected);
});

