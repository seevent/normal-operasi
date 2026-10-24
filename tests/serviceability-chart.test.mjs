import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { buildKesiapanSheetRows, buildKopData } from '../src/lib/utils/shiftReportExport.ts';
import { buildServiceabilityChartSpec, buildShiftReportWorkbook, getSheetLayout } from '../src/lib/utils/shiftReportWorkbook.ts';
import {
  buildServiceabilityChartXml,
  columnLetter,
  embedServiceabilityChart,
  getServiceabilityPlacement,
} from '../src/lib/utils/serviceabilityChart.ts';

// Data berkas acuan "SSES T2-LAPORAN HARIAN (M) 23-10-2026.xlsx": 5 baris kegiatan, 7 peralatan.
// Pada berkas acuan: judul tabel baris 14, data baris 15-19, pita hitam baris 20, tabel Serviceability baris 22-28.
const HEADER = ['No', 'Lokasi', 'Peralatan', 'Corrective Maintenance', 'Preventive Maintenance', 'Lain-lain', 'Uraian Kegiatan', 'Waktu Tindak Lanjut', 'Hasil', 'Dokumentasi'];
const laporanRows = [
  HEADER,
  ...Array.from({ length: 5 }, (_, i) => [String(i + 1), 'PSCP', 'X-Ray', 'CORRECTIVE MAINTENANCE', '-', '-', 'Permasalahan', '08:00', 'Normal', '']),
];
const SUMMARY = [
  ['XRAY', 42, 42], ['WTMD', 21, 21], ['HHMD', 26, 26], ['BODY SCANNER', 8, 8], ['ETD', 5, 4], ['ACCESS CONTROL', 126, 126], ['CCTV', 48, 48],
].map(([nama, total, operasi]) => ({
  nama, total, operasi, rusak: total - operasi, persenOperasi: operasi / total, persenRusak: (total - operasi) / total,
}));
const kesiapanRows = buildKesiapanSheetRows(SUMMARY);
const kop = buildKopData({
  date: '2026-10-23',
  shift: 'M',
  dayName: 'JUMAT',
  dateIndo: '23 OKTOBER 2026',
  apiPersonil: [{ personel: { nama: 'Dwisasono Glory Prayoga', no_hp: '0811' } }, { personel: { nama: 'Rio Anang Kriswanto', no_hp: null } }],
  iasPersonil: [{ personel: { nama: 'Muhammad Agus Sofyan', no_hp: '0822' } }],
});

// PNG 1x1 merah, valid
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
const photo = { dataUrl: PNG_1X1, width: 1, height: 1, extension: 'png' };

const build = async (photos) => {
  const input = { laporanRows, photos, kesiapanRows, kop, logo: photo };
  const wb = buildShiftReportWorkbook(ExcelJS, input);
  const buffer = await wb.xlsx.writeBuffer();
  const spec = buildServiceabilityChartSpec(input);
  return { input, spec, buffer, bytes: await embedServiceabilityChart(JSZip, buffer, spec) };
};

const load = async (buffer) => {
  const back = new ExcelJS.Workbook();
  await back.xlsx.load(buffer);
  return back.getWorksheet('Laporan');
};

test('getServiceabilityPlacement / getSheetLayout: sama dengan berkas acuan (tabel baris 22-28, kolom F-L)', () => {
  assert.deepEqual(getServiceabilityPlacement(19, 7), { startCol: 6, firstRow: 22, lastRow: 28 });
  const layout = getSheetLayout(kop, 5, 7);
  assert.equal(layout.slots, 6);
  assert.equal(layout.headerRow, 14);
  assert.equal(layout.firstDataRow, 15);
  assert.equal(layout.lastDataRow, 19);
  assert.equal(layout.bandRow, 20);
  assert.deepEqual(layout.placement, { startCol: 6, firstRow: 22, lastRow: 28 });
  // Personil lebih dari 6 menambah baris kop dan menggeser semua yang di bawahnya.
  const many = { ...kop, api: Array.from({ length: 8 }, () => ({ nama: 'x', noHp: '' })) };
  assert.equal(getSheetLayout(many, 5, 7).headerRow, 16);
  assert.equal(columnLetter(6), 'F');
  assert.equal(columnLetter(12), 'L');
  assert.equal(columnLetter(27), 'AA');
});

test('kop laporan: logo, judul, personil on duty, sel gabungan dan warna seperti berkas acuan', async () => {
  const { buffer } = await build([[], [], [], [], []]);
  const ws = await load(buffer);
  assert.equal(ws.getImages().length, 1, 'logo di kop');
  const logo = ws.getImages()[0].range;
  assert.equal(logo.tl.nativeCol, 0);
  assert.equal(logo.tl.nativeColOff, 117022);
  assert.equal(logo.br.nativeCol, 2);
  assert.equal(logo.br.nativeRow, 3);

  assert.match(ws.getCell('D1').value, /^PT ANGKASA PURA INDONESIA\nCABANG UTAMA BANDARA SOEKARNO-HATTA\nUNIT SAFETY & SECURITY ELECTRONIC SERVICES – T2$/);
  assert.equal(ws.getCell('K1').value, 'LAPORAN PERBAIKAN SAFETY & SECURITY ELECTRONIC SERVICES\nTERMINAL 2 BANDARA SOEKARNO-HATTA\nPERIODE : OKTOBER');
  assert.equal(ws.getCell('A5').value, 'PERSONIL ON DUTY MALAM');
  assert.equal(ws.getCell('A5').fill.fgColor.argb, 'FF000000');
  assert.equal(ws.getCell('A5').font.color.argb, 'FFFFFFFF');
  assert.equal(ws.getCell('A6').value, 'SHIFT MALAM (M) JUMAT, 23 OKTOBER 2026\n(D,E,F,UMROH)\nTERMINAL 2');
  assert.equal(ws.getCell('D6').value, 'API');
  assert.equal(ws.getCell('K6').value, 'IAS');
  assert.equal(ws.getCell('D6').fill.fgColor.argb, 'FFA6A6A6');
  assert.equal(ws.getCell('D7').value, 'Dwisasono Glory Prayoga');
  assert.equal(ws.getCell('I7').value, '0811');
  assert.equal(ws.getCell('D8').value, 'Rio Anang Kriswanto');
  assert.equal(ws.getCell('I8').value, '-', 'tanpa nomor telepon ditulis "-" seperti dokumen cetak, bukan "null"');
  assert.equal(ws.getCell('K7').value, 'Muhammad Agus Sofyan');
  assert.equal(ws.getCell('O7').value, '0822');

  const merged = new Set(Object.keys(ws._merges));
  for (const range of ['A1:C4', 'D1:J4', 'K1:Q4', 'A5:Q5', 'A6:C12', 'D6:J6', 'K6:Q6', 'D7:H7', 'I7:J7', 'K7:N7', 'O7:Q7', 'A13:Q13', 'B14:D14', 'E14:F14', 'J14:L14', 'O14:Q14', 'B15:D15', 'E19:F19', 'J19:L19', 'O19:Q19', 'A20:Q20']) {
    const [tl] = range.split(':');
    assert.ok(merged.has(tl), `sel gabungan ${range}`);
    assert.equal(ws.getCell(tl).master.address, tl);
  }
  // Garis tepi mengelilingi kotak gabungan: sel di sudut kanan bawah juga bergaris.
  assert.equal(ws.getCell('J4').border.right.style, 'thin');
  assert.equal(ws.getCell('J4').border.bottom.style, 'thin');
  assert.equal(ws.getCell('Q14').border.right.style, 'thin');
});

test('judul tabel kegiatan: baris 14, abu-abu tebal, tinggi cukup agar "WAKTU TINDAK LANJUT" tidak terpotong', async () => {
  const { buffer } = await build([[], [], [], [], []]);
  const ws = await load(buffer);
  const titles = ['No', 'LOKASI', 'PERALATAN', 'CORRECTIVE MAINTENANCE', 'PREVENTIVE MAINTENANCE', 'LAIN - LAIN', 'URAIAN KEGIATAN', 'WAKTU TINDAK LANJUT', 'HASIL', 'DOKUMENTASI'];
  assert.deepEqual(['A14', 'B14', 'E14', 'G14', 'H14', 'I14', 'J14', 'M14', 'N14', 'O14'].map((a) => ws.getCell(a).value), titles);
  assert.equal(ws.getCell('M14').font.bold, true);
  assert.equal(ws.getCell('M14').fill.fgColor.argb, 'FFA6A6A6');
  assert.ok(ws.getRow(14).height >= 37.5);
  // Kolom seperti berkas acuan
  assert.equal(ws.getColumn(1).width, 7.14);
  assert.equal(ws.getColumn(13).width, 22.86);
  assert.equal(ws.getColumn(17).width, 27.29);
  // Data: uraian tebal, kolom lain biasa, semua rata tengah
  assert.ok(!ws.getCell('B15').font.bold);
  assert.equal(ws.getCell('J15').alignment.horizontal, 'center');
  assert.equal(ws.getCell('M15').value, '08:00');
  assert.equal(ws.getCell('N15').value, 'Normal');
  assert.equal(ws.getCell('A20').fill.fgColor.argb, 'FF000000', 'pita hitam penutup tabel kegiatan');
});

test('tabel Serviceability: baris 22-28 kolom F-L, di dalam batas kanan tabel kegiatan (kolom Q), tanpa judul', async () => {
  const { buffer } = await build([[], [], [], [], []]);
  const ws = await load(buffer);
  assert.equal(ws.getCell('F21').value, null, 'satu baris kosong setelah pita hitam');
  assert.equal(ws.getCell('F22').value, 1);
  assert.equal(ws.getCell('G22').value, 'XRAY');
  assert.equal(ws.getCell('H22').value.formula, 'IFERROR(I22/L22,0)');
  assert.equal(ws.getCell('H22').value.result, 1);
  assert.equal(ws.getCell('H22').numFmt, '0%');
  assert.equal(ws.getCell('I22').value, 42);
  assert.equal(ws.getCell('J22').value.formula, 'IFERROR(K22/L22,0)');
  assert.equal(ws.getCell('K22').value, 0);
  assert.equal(ws.getCell('L22').value, 42);
  // ETD: 4 dari 5 normal -> 80% / 20%
  assert.equal(ws.getCell('H26').value.result, 0.8);
  assert.equal(ws.getCell('J26').value.result, 0.2);
  assert.equal(ws.getCell('K26').value, 1);
  assert.equal(ws.getCell('F28').value, 7);
  assert.equal(ws.getCell('G28').value, 'CCTV');
  assert.equal(ws.getCell('F29').value, null, 'tidak ada baris di bawah peralatan terakhir');
  assert.equal(ws.getCell('M22').value, null, 'tabel berhenti di kolom L, tidak melewati tabel di atasnya');
  const fills = ['F', 'G', 'H', 'I', 'J', 'K', 'L'].map((c) => ws.getCell(`${c}22`).fill.fgColor.argb);
  assert.deepEqual(fills, ['FFC5E0B4', 'FFEDEDED', 'FF8FAADC', 'FF8FAADC', 'FFFF0000', 'FFFF0000', 'FFA9D18E']);
  assert.equal(ws.getCell('H22').border.top.style, 'thin');
  assert.equal(ws.getCell('H22').alignment.horizontal, 'center');
  assert.equal(ws.getRow(22).height, 18.75);
  assert.equal(ws.pageSetup.orientation, 'landscape');
  assert.equal(ws.pageSetup.paperSize, 9);
});

test('buildKopData: label shift, periode dan personil; ALL tidak dianggap pagi', () => {
  assert.equal(kop.onDutyLabel, 'PERSONIL ON DUTY MALAM');
  assert.equal(kop.periodLabel, 'OKTOBER');
  assert.deepEqual(kop.api[1], { nama: 'Rio Anang Kriswanto', noHp: '-' });
  const ps = buildKopData({ date: '2026-01-05', shift: 'PS', dayName: 'SENIN', dateIndo: '5 JANUARI 2026', apiPersonil: [], iasPersonil: [] });
  assert.equal(ps.shiftLabel, 'SHIFT PAGI (PS) SENIN, 5 JANUARI 2026\n(D,E,F,UMROH)\nTERMINAL 2');
  assert.equal(ps.onDutyLabel, 'PERSONIL ON DUTY PAGI');
  assert.equal(ps.periodLabel, 'JANUARI');
  const all = buildKopData({ date: '2026-12-31', shift: 'ALL', dayName: 'KAMIS', dateIndo: '31 DESEMBER 2026', apiPersonil: [], iasPersonil: [] });
  assert.equal(all.onDutyLabel, 'PERSONIL ON DUTY');
  assert.match(all.shiftLabel, /^SHIFT PAGI \(PS\) & MALAM \(M\) KAMIS/);
});

test('shift = ALL: kolom Shift digabung ke sel No agar tata letak tetap sama dengan berkas acuan', async () => {
  const rows = [['No', 'Shift', ...HEADER.slice(1)], ['1', 'PS', 'PSCP', 'X-Ray', '-', '-', '-', 'Uraian', '08:00', 'Normal', '']];
  const wb = buildShiftReportWorkbook(ExcelJS, { laporanRows: rows, photos: [[]], kesiapanRows, kop });
  const ws = await load(await wb.xlsx.writeBuffer());
  assert.equal(ws.getCell('A15').value, '1\nPS');
  assert.equal(ws.getCell('B15').value, 'PSCP');
  assert.equal(ws.getCell('J15').value, 'Uraian');
  assert.equal(ws.getCell('G18').value, 'XRAY', 'satu baris data: tabel Serviceability mulai tiga baris di bawahnya, tetap di F:L');
});

test('spec grafik: kategori nama peralatan, OPS dan OFF sebagai pecahan dari total', () => {
  const spec = buildServiceabilityChartSpec({ laporanRows, photos: [], kesiapanRows });
  assert.deepEqual(spec.categories, SUMMARY.map((s) => s.nama));
  assert.equal(spec.ops[4], 0.8);
  assert.ok(Math.abs(spec.off[4] - 0.2) < 1e-9);
  assert.equal(buildServiceabilityChartSpec({ laporanRows, photos: [], kesiapanRows: [] }), null);
});

test('buildServiceabilityChartXml: batang berkelompok OPS biru muda dan OFF merah, sumbu maks 100%, mengacu ke sel tabel', () => {
  const spec = buildServiceabilityChartSpec({ laporanRows, photos: [], kesiapanRows });
  const xml = buildServiceabilityChartXml(spec);
  assert.match(xml, /<c:barDir val="col"\/><c:grouping val="clustered"\/>/);
  assert.match(xml, /TABEL PERFORMA PERALATAN/);
  assert.match(xml, /<c:v>OPS<\/c:v>.*?9DC3E6/s);
  assert.match(xml, /<c:v>OFF<\/c:v>.*?FF0000/s);
  assert.match(xml, /<c:f>'Laporan'!\$G\$22:\$G\$28<\/c:f>/);
  assert.match(xml, /<c:f>'Laporan'!\$H\$22:\$H\$28<\/c:f>/);
  assert.match(xml, /<c:f>'Laporan'!\$J\$22:\$J\$28<\/c:f>/);
  assert.match(xml, /<c:max val="1"\/>/);
  assert.match(xml, /<c:showVal val="1"\/>/);
  assert.doesNotMatch(xml, /<c:legend>/, 'berkas acuan tanpa legenda');
});

// Foto dan logo berada di drawing yang sama dengan grafik; logo selalu ada, jadi drawing sudah ada sebelum grafik.
for (const [label, photos, expectImages] of [
  ['tanpa foto kegiatan (hanya logo)', [[], [], [], [], []], 1],
  ['dengan foto kegiatan', [[photo, photo], [], [], [], []], 3],
]) {
  test(`embedServiceabilityChart ${label}: grafik di kolom C satu baris di bawah tabel, ukuran seperti berkas acuan`, async () => {
    const { bytes } = await build(photos);
    const zip = await JSZip.loadAsync(bytes);
    const names = Object.keys(zip.files);
    assert.ok(names.includes('xl/charts/chart1.xml'));

    const drawing = await zip.file('xl/drawings/drawing1.xml').async('string');
    // Berkas acuan: oneCellAnchor col 2 (+734786) row 28 (+114301), 13030200 x 4169682 EMU.
    assert.match(
      drawing,
      /<xdr:oneCellAnchor><xdr:from><xdr:col>2<\/xdr:col><xdr:colOff>734786<\/xdr:colOff><xdr:row>28<\/xdr:row><xdr:rowOff>114301<\/xdr:rowOff><\/xdr:from><xdr:ext cx="13030200" cy="4169682"\/>/
    );
    assert.equal((drawing.match(/<xdr:pic>/g) ?? []).length, expectImages);

    const rels = await zip.file('xl/drawings/_rels/drawing1.xml.rels').async('string');
    const chartRel = rels.match(/<Relationship Id="([^"]+)" Type="[^"]+\/chart" Target="\.\.\/charts\/chart1\.xml"\/>/);
    assert.ok(chartRel, 'relasi ke chart1.xml');
    assert.ok(drawing.includes(`r:id="${chartRel[1]}"`), 'drawing memakai relasi yang sama');
    const ids = [...rels.matchAll(/Id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'id relasi unik');

    const types = await zip.file('[Content_Types].xml').async('string');
    assert.match(types, /PartName="\/xl\/charts\/chart1\.xml" ContentType="application\/vnd\.openxmlformats-officedocument\.drawingml\.chart\+xml"/);

    const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
    assert.equal((sheet.match(/<drawing r:id=/g) ?? []).length, 1);
    assert.ok(sheet.indexOf('<drawing ') > sheet.indexOf('</sheetData>'), 'drawing setelah sheetData');

    // Berkas tetap bisa dibuka ExcelJS dan foto tidak hilang.
    const ws = await load(bytes);
    assert.equal(ws.getImages().length, expectImages);
    assert.equal(ws.getCell('G22').value, 'XRAY');
  });
}

test('embedServiceabilityChart tanpa logo dan tanpa foto: drawing baru dibuat dan didaftarkan', async () => {
  const input = { laporanRows, photos: [[], [], [], [], []], kesiapanRows };
  const buffer = await buildShiftReportWorkbook(ExcelJS, input).xlsx.writeBuffer();
  const zip = await JSZip.loadAsync(await embedServiceabilityChart(JSZip, buffer, buildServiceabilityChartSpec(input)));
  const types = await zip.file('[Content_Types].xml').async('string');
  assert.equal((types.match(/PartName="\/xl\/drawings\/drawing1\.xml"/g) ?? []).length, 1, 'drawing terdaftar satu kali');
  const sheetRels = await zip.file('xl/worksheets/_rels/sheet1.xml.rels').async('string');
  assert.match(sheetRels, /Target="\.\.\/drawings\/drawing1\.xml"/);
});
