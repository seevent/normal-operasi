import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  mapExcelLocationToSupabase,
  buildRencanaKegiatan,
  rencanaKegiatanBase,
  RENCANA_KEGIATAN_DASAR,
  RENCANA_KEGIATAN_PM,
  RENCANA_KEGIATAN_GAC
} from '../src/lib/utils/pmScheduleParser.ts';
import { parseSheetGac, findGacSheetName } from '../src/lib/utils/gacScheduleParser.ts';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const GREEN = { s: { fgColor: { rgb: '00B050' } } };
const GREY = { s: { fgColor: { theme: 2, rgb: 'AFABAB' } } }; // arsiran akhir pekan, bukan jadwal

test('Lokasi PM mengikuti nama tempat di tab Preventive', () => {
  const xray = 'X-Ray Smith Heiman HS 100100T-2IS';
  assert.deepEqual(mapExcelLocationToSupabase('Umroh HBS 27 ', 'X-Ray Rapiscan 628 DV'), [{ lokasi: 'HBSCP Umrah', titik: '2.7' }]);
  assert.deepEqual(mapExcelLocationToSupabase('Umroh HBS 28 ', 'X-Ray Rapiscan 628 DV'), [{ lokasi: 'HBSCP Umrah', titik: '2.8' }]);
  assert.deepEqual(mapExcelLocationToSupabase('Umroh bea cukai arrival No 15', xray), [{ lokasi: 'Breakdown Umrah', titik: 'Belt 15' }]);
  assert.deepEqual(mapExcelLocationToSupabase('Umroh bea cukai arrival No 16', xray), [{ lokasi: 'Breakdown Umrah', titik: 'Belt 16' }]);
  assert.deepEqual(mapExcelLocationToSupabase('Redline bea cukai arrival F No. 1', xray), [{ lokasi: 'Red Lane', titik: 'No.1 Arr F' }]);
  assert.deepEqual(mapExcelLocationToSupabase('Redline bea cukai arrival Umroh No. 2', xray), [{ lokasi: 'Red Lane', titik: 'No.2 Arr Umroh' }]);
  assert.deepEqual(mapExcelLocationToSupabase('Arrival Rampout F1', 'X-Ray Smiths Heimann HS 6040-2IS '), [{ lokasi: 'Arrival F', titik: '-' }]);
  // Tidak berubah
  assert.deepEqual(mapExcelLocationToSupabase('Breakdown HBS 25', 'X-Ray NUCTECH 100100 D & ETD QS B220'), [{ lokasi: 'HBSCP', titik: '2.5' }]);
  assert.deepEqual(mapExcelLocationToSupabase('PSCP Umroh No 3', 'X-Ray Nuctech CX6040D & WTMD CEIA '), [{ lokasi: 'PSCP Umrah', titik: '3' }]);
});

// Bentuk sheet "JADWAL GAC": judul + tahun, baris LOKASI, baris nama bulan (sel gabungan),
// baris tanggal, lalu kolom kosong pemisah dan bagian "Jadwal Tindak Lanjut".
const gacSheet = () => ({
  '!ref': 'A1:J12',
  A1: { v: 'JADWAL GENERAL ANNUAL CHECK' },
  A3: { v: 'DESEMBER 2026 - JANUARI 2027' },
  A4: { v: 'NO' }, B4: { v: 'LOKASI' }, C4: { v: 'MERK/TYPE' }, D4: { v: 'TANGGAL' }, I4: { v: 'TANGGAL' },
  D5: { v: 'DESEMBER' }, F5: { v: 'JANUARI' }, I5: { v: 'JANUARI' },
  D6: { v: 30 }, E6: { v: 31 }, F6: { v: 1 }, G6: { v: 2 }, /* H6 kosong = pemisah */ I6: { v: 3 }, J6: { v: 4 },
  B7: { v: 'Redline bea cukai arrival F No. 1' }, C7: { v: 'X-Ray Smith Heiman HS 100100T-2IS' }, D7: GREEN, E7: GREY,
  B8: { v: 'PSCP D No. 2' }, C8: { v: 'X-Ray Smiths Heimann HS 6040-2IS & BS Leidos Prov 2' }, G8: GREEN, I8: GREEN,
  B9: { v: 'Rampout D, Avio D, BL D, Server D & F' }, C9: { v: 'Access Control Honeywell' },
  B11: { v: 'General Annual Check' }, A11: GREEN,
  B12: { v: 'Tindak Lanjut GAC' }, F12: { v: 'TANGERANG, 01 NOVEMBER 2026' }
});

test('parseSheetGac: sel hijau saja, bulan berganti dan tahun bergulir, Tindak Lanjut diabaikan', () => {
  const { records, dariTanggal, sampaiTanggal } = parseSheetGac(gacSheet(), 2020);

  assert.equal(dariTanggal, '2026-12-30');
  assert.equal(sampaiTanggal, '2027-01-02', 'kolom setelah pemisah (Tindak Lanjut) tidak termasuk');
  assert.deepEqual(
    records.map(r => [r.tanggal, r.bulan, r.tahun, r.lokasi, r.titik, r.jenis, r.tipe]),
    [
      ['2026-12-30', 12, 2026, 'Red Lane', 'No.1 Arr F', 'X-Ray', 'X-Ray Smith Heimann HS 100100T-2is'],
      ['2027-01-02', 1, 2027, 'PSCP D', '2', 'X-Ray', 'X-Ray Smith Heimann HS 6040T-2is'],
      ['2027-01-02', 1, 2027, 'PSCP D', '2', 'Body Scanner', 'Body Scanner Leidos Provision 2'],
    ]
  );
});

test('parseSheetGac: tahun dari isian bila judul tidak memuat tahun', () => {
  const ws = gacSheet();
  ws.A3 = { v: 'DESEMBER - JANUARI' };
  const { records } = parseSheetGac(ws, 2030);
  assert.equal(records[0].tanggal, '2030-12-30');
  assert.equal(records[1].tanggal, '2031-01-02');
});

test('findGacSheetName: nama sheet memuat GAC, atau judulnya General Annual Check', () => {
  assert.equal(findGacSheetName({ SheetNames: ['NOVEMBER', 'JADWAL GAC'], Sheets: {} }), 'JADWAL GAC');
  assert.equal(
    findGacSheetName({ SheetNames: ['NOVEMBER', 'Sheet2'], Sheets: { NOVEMBER: { A1: { v: 'JADWAL PREVENTIVE' } }, Sheet2: gacSheet() } }),
    'Sheet2'
  );
  assert.equal(findGacSheetName({ SheetNames: ['NOVEMBER'], Sheets: { NOVEMBER: {} } }), null);
});

test('Rencana Kegiatan: blok GAC di bawah PM; tanpa GAC hasilnya sama seperti sebelumnya', () => {
  const pm = [{ lokasi: 'HBSCP Umrah', titik: '2.7', jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 628DV', kategori_pm: 'PM Mingguan' }];
  const gac = [
    { lokasi: 'Red Lane', titik: 'No.1 Arr F', jenis: 'X-Ray', tipe: 'X-Ray Smith Heimann HS 100100T-2is' },
    { lokasi: 'Red Lane', titik: 'No.2 Arr Umroh', jenis: 'X-Ray', tipe: 'X-Ray Smith Heimann HS 100100T-2is' }
  ];

  assert.equal(
    buildRencanaKegiatan(RENCANA_KEGIATAN_DASAR, pm, true, gac),
    [
      '- Monitoring Operasional',
      '- Storing Peralatan',
      RENCANA_KEGIATAN_PM,
      RENCANA_KEGIATAN_GAC,
      '',
      '*Jadwal Preventive Mingguan :*',
      '📍HBSCP Umrah 2.7',
      '- X-Ray Rapiscan 628DV',
      '',
      '*Jadwal General Annual Check :*',
      '📍Red Lane No.1 Arr F',
      '- X-Ray Smith Heimann HS 100100T-2is',
      '📍Red Lane No.2 Arr Umroh',
      '- X-Ray Smith Heimann HS 100100T-2is'
    ].join('\n')
  );

  // Shift M tanpa PM: hanya GAC
  assert.equal(
    buildRencanaKegiatan(RENCANA_KEGIATAN_DASAR, [], false, gac.slice(0, 1)),
    `${RENCANA_KEGIATAN_DASAR}\n${RENCANA_KEGIATAN_GAC}\n\n*Jadwal General Annual Check :*\n📍Red Lane No.1 Arr F\n- X-Ray Smith Heimann HS 100100T-2is`
  );

  assert.equal(buildRencanaKegiatan(RENCANA_KEGIATAN_DASAR, [], true), `${RENCANA_KEGIATAN_DASAR}\n${RENCANA_KEGIATAN_PM}`);
  assert.equal(buildRencanaKegiatan(RENCANA_KEGIATAN_DASAR, [], false), RENCANA_KEGIATAN_DASAR);
});

test('rencanaKegiatanBase: teks pengguna sebelum baris PM/GAC', () => {
  const pm = [{ lokasi: 'PSCP D', titik: '1', jenis: 'WTMD', tipe: 'WTMD CEIA', kategori_pm: 'PM Mingguan' }];
  const gac = [{ lokasi: 'Arrival F', titik: '-', jenis: 'X-Ray', tipe: 'X-Ray Smith Heimann HS 6040T-2is' }];
  const custom = `${RENCANA_KEGIATAN_DASAR}\n- Pendampingan vendor`;
  assert.equal(rencanaKegiatanBase(buildRencanaKegiatan(custom, pm, true, gac)), custom);
  assert.equal(rencanaKegiatanBase(buildRencanaKegiatan(custom, [], false, gac)), custom);
  assert.equal(rencanaKegiatanBase(custom), custom);
});

test('Tab Data: Upload Jadwal GAC berada di bawah Upload Jadwal PM; Kehadiran membaca jadwal_gac', () => {
  const uploader = readProjectFile('src/components/features/ScheduleUploader.tsx');
  const pmAt = uploader.indexOf('<PmScheduleUploader />');
  const gacAt = uploader.indexOf('<GacScheduleUploader />');
  assert.ok(pmAt !== -1 && gacAt > pmAt);

  const kehadiran = readProjectFile('src/components/features/TabKehadiran.tsx');
  assert.match(kehadiran, /from\('jadwal_gac'\)/);
  assert.match(kehadiran, /buildRencanaKegiatan\(RENCANA_KEGIATAN_DASAR, activePm, targetShiftCode === 'PS', activeGac\)/);
});
