import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildShiftReportFilename,
  buildLaporanSheetRows,
  buildKesiapanSheetRows,
  plainUraian,
  resolvePreventiveText,
  fotoUrlsOf,
} from '../src/lib/utils/shiftReportExport.ts';
import {
  layoutPhotosInCell, rowHeightPt, textHeightPt, wrappedLineCount, buildShiftReportWorkbook, uraianCellValue, DOC_WIDTH_PX, PHOTO_ROW_PX,
} from '../src/lib/utils/shiftReportWorkbook.ts';
import ExcelJS from 'exceljs';
import {
  isPreventiveReport,
  isStoringReport,
  isCorrectiveReport,
} from '../src/lib/utils/shiftReportMessage.ts';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const PREVENTIVE_BODY = `Kegiatan :
- Pembersihan Emlock

Catatan :
- Fungsi Emlock : Berfungsi`;

const classifiers = {
  isCorrective: isCorrectiveReport,
  isPreventive: isPreventiveReport,
  isStoring: isStoringReport,
  getDefaultUraian: () => PREVENTIVE_BODY,
  formatLokasi: (l) => l || '-',
  formatHasil: (r) => (r.Status || 'Normal'),
};

test('nama berkas: shift PS 24 Oktober 2026 untuk PDF dan Excel', () => {
  assert.equal(buildShiftReportFilename('PS', '2026-10-24', 'pdf'), 'SSES T2-LAPORAN HARIAN (PS) 24-10-2026.pdf');
  assert.equal(buildShiftReportFilename('PS', '2026-10-24', 'xlsx'), 'SSES T2-LAPORAN HARIAN (PS) 24-10-2026.xlsx');
  assert.equal(buildShiftReportFilename('M', '2026-01-05', 'xlsx'), 'SSES T2-LAPORAN HARIAN (M) 05-01-2026.xlsx');
  assert.equal(buildShiftReportFilename('ALL', '2026-12-31', 'pdf'), 'SSES T2-LAPORAN HARIAN (ALL) 31-12-2026.pdf');
});

test('plainUraian: corrective, storing, preventive, dan kegiatan umum', () => {
  const corrective = { Jenis: 'Perbaikan', kategori_maintenance: 'CORRECTIVE', Uraian: 'X-Ray mati', TindakLanjut: '• Cek kabel • Ganti PSU' };
  assert.equal(plainUraian(corrective, classifiers), 'Permasalahan : X-Ray mati\nTindak lanjut :\n• Cek kabel\n• Ganti PSU');

  assert.equal(plainUraian({ Jenis: 'Storing', kategori_maintenance: 'STORING' }, classifiers), 'Storing Peralatan');

  const preventive = { Jenis: 'Preventive', kategori_maintenance: 'PREVENTIVE', Uraian: '-' };
  assert.equal(plainUraian(preventive, classifiers), PREVENTIVE_BODY);

  const umum = { Jenis: 'Kegiatan', kategori_maintenance: 'KEGIATAN', Uraian: 'Briefing', TindakLanjut: '-' };
  assert.equal(plainUraian(umum, classifiers), '-');
  assert.equal(plainUraian({ ...umum, TindakLanjut: '' }, classifiers), 'Briefing');
});

test('resolvePreventiveText: menambah Catatan bawaan bila uraian tersimpan belum memuatnya', () => {
  const out = resolvePreventiveText(
    { Uraian: 'Kegiatan :\n- Cek unit', Peralatan: 'A', Lokasi: 'B' },
    () => PREVENTIVE_BODY
  );
  assert.ok(out.startsWith('Kegiatan :\n- Cek unit'));
  assert.ok(out.includes('Catatan :\n- Fungsi Emlock : Berfungsi'));
});

test('buildLaporanSheetRows: kolom sama dengan tabel cetak, kolom Shift hanya saat ALL', () => {
  const reports = [
    { shift: 'PS', Jenis: 'Perbaikan', kategori_maintenance: 'CORRECTIVE', Lokasi: 'T2 D', Peralatan: 'XRAY 1', Uraian: 'Mati', TindakLanjut: 'Ganti', Waktu: '08:00', Status: 'Normal', fotoUrls: ['https://a/1.jpg', 'https://a/2.jpg'] },
    { shift: 'M', Jenis: 'Kegiatan', kategori_maintenance: 'KEGIATAN', Lokasi: 'T2 E', Peralatan: 'Briefing', Uraian: 'Briefing', TindakLanjut: '-', Waktu: '20:00', Status: 'Normal' },
  ];

  const ps = buildLaporanSheetRows(reports, 'PS', classifiers);
  assert.deepEqual(ps[0], [
    'No', 'Lokasi', 'Peralatan', 'Corrective Maintenance', 'Preventive Maintenance',
    'Lain-lain', 'Uraian Kegiatan', 'Waktu Tindak Lanjut', 'Hasil', 'Dokumentasi',
  ]);
  assert.deepEqual(ps[1], [
    '1', 'T2 D', 'XRAY 1', 'CORRECTIVE MAINTENANCE', '-', '-',
    'Permasalahan : Mati\nTindak lanjut :\nGanti', '08:00', 'Normal', '',
  ]);
  assert.equal(ps[2][5], 'KEGIATAN');
  assert.equal(ps[2][9], '');
  assert.deepEqual(fotoUrlsOf(reports[0]), ['https://a/1.jpg', 'https://a/2.jpg']);
  assert.deepEqual(fotoUrlsOf({ imageUrl: 'https://a/x.jpg' }), ['https://a/x.jpg']);
  assert.deepEqual(fotoUrlsOf({ fotoUrls: ['u', 'u'] }), ['u']);
  assert.deepEqual(fotoUrlsOf({}), []);

  const all = buildLaporanSheetRows(reports, 'ALL', classifiers);
  assert.equal(all[0][1], 'Shift');
  assert.equal(all[1][1], 'PS');
  assert.equal(all[2][1], 'M');
  assert.equal(all[0].length, ps[0].length + 1);
});

test('buildKesiapanSheetRows: baris tabel Serviceability tanpa header, urutan no, nama, operasi, rusak, total', () => {
  const rows = buildKesiapanSheetRows([
    { nama: 'ETD', total: 5, operasi: 4, rusak: 1, persenOperasi: 0.8, persenRusak: 0.2 },
  ]);
  assert.deepEqual(rows, [[1, 'ETD', 4, 1, 5]]);
});

test('TabShiftReport: tombol Export Excel dan PDF memakai format nama berkas yang sama', () => {
  const content = readProjectFile('src/components/features/TabShiftReport.tsx');
  assert.match(content, /onClick=\{handleExportExcel\}/);
  assert.match(content, /buildShiftReportFilename\(shift, date, 'pdf'\)/);
  assert.match(content, /filename: buildShiftReportFilename\(shift, date, 'xlsx'\)/);
  assert.match(content, /photoUrls: printReports\.map\(fotoUrlsOf\)/);
  assert.match(content, /triggerFileDownload\(file\)/);
  assert.doesNotMatch(content, /SSES_T2_Laporan_Shift_/);
});

const LANDSCAPE = { width: 480, height: 360 };
const PORTRAIT = { width: 360, height: 480 };
const area = (ps) => ps.reduce((sum, p) => sum + p.width * p.height, 0);
const insideCell = (placements, heightPx, widthPx = DOC_WIDTH_PX) => {
  for (const p of placements) {
    assert.ok(p.xPx >= 0 && p.xPx + p.width <= widthPx, `foto keluar lebar kolom: ${JSON.stringify(p)}`);
    assert.ok(p.yPx >= 0 && p.yPx + p.height <= heightPx, `foto keluar tinggi baris: ${JSON.stringify(p)} > ${heightPx}`);
  }
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i], b = placements[j];
      const overlap = a.xPx < b.xPx + b.width && b.xPx < a.xPx + a.width && a.yPx < b.yPx + b.height && b.yPx < a.yPx + a.height;
      assert.ok(!overlap, `foto ${i} dan ${j} bertumpuk`);
    }
  }
};

test('layoutPhotosInCell: area Dokumentasi O:Q = 319 px; tanpa foto tidak memakan tinggi', () => {
  assert.equal(DOC_WIDTH_PX, 64 + 64 + 191);
  assert.deepEqual(layoutPhotosInCell([]), { placements: [], heightPx: 0 });
});

test('layoutPhotosInCell: satu foto memenuhi lebar kolom (sebelumnya kotak tetap 150x112)', () => {
  const one = layoutPhotosInCell([LANDSCAPE]);
  assert.ok(one.placements[0].width >= DOC_WIDTH_PX - 12, `lebar ${one.placements[0].width}`);
  assert.ok(area(one.placements) >= 4 * 149 * 112, 'minimal 4x luas sebelumnya');
  assert.ok(Math.abs(one.placements[0].width / one.placements[0].height - 4 / 3) < 0.02, 'rasio terjaga');
  assert.ok(one.heightPx <= PHOTO_ROW_PX, 'tinggi baris tidak melebihi tinggi foto bawaan');
  insideCell(one.placements, one.heightPx);

  const portrait = layoutPhotosInCell([PORTRAIT]);
  assert.ok(area(portrait.placements) >= 4 * 84 * 112, 'foto potret juga jauh lebih besar');
  insideCell(portrait.placements, portrait.heightPx);
});

test('layoutPhotosInCell: baris tinggi karena teks dipakai foto untuk membesar, foto di tengah sel', () => {
  const short = layoutPhotosInCell([PORTRAIT]);
  const tall = layoutPhotosInCell([PORTRAIT], { minHeightPx: 400 });
  assert.equal(tall.heightPx, 400);
  assert.ok(tall.placements[0].height > short.placements[0].height, 'foto potret membesar mengikuti tinggi baris');
  insideCell(tall.placements, tall.heightPx);
  const p = tall.placements[0];
  assert.ok(Math.abs(p.yPx - (400 - p.yPx - p.height)) <= 1, 'tengah vertikal');
  assert.ok(Math.abs(p.xPx - (DOC_WIDTH_PX - p.xPx - p.width)) <= 1, 'tengah horizontal');
});

test('layoutPhotosInCell: foto tidak dibesarkan melebihi ukuran aslinya', () => {
  const small = layoutPhotosInCell([{ width: 40, height: 30 }]);
  assert.equal(small.placements[0].width, 40);
  assert.equal(small.placements[0].height, 30);
});

test('layoutPhotosInCell: banyak foto tetap di dalam kolom dan batas 409 pt, tanpa bertumpuk', () => {
  const maxPx = 409 / 0.75;
  for (const n of [2, 3, 4, 5, 7, 12, 30]) {
    for (const size of [LANDSCAPE, PORTRAIT]) {
      const sizes = Array.from({ length: n }, () => size);
      const r = layoutPhotosInCell(sizes);
      assert.ok(r.heightPx <= maxPx, `${n} foto: ${r.heightPx}px`);
      assert.equal(r.placements.length, n);
      insideCell(r.placements, r.heightPx);
    }
  }
  // Campuran potret dan landscape
  const mix = layoutPhotosInCell([LANDSCAPE, PORTRAIT, LANDSCAPE], { minHeightPx: 300 });
  insideCell(mix.placements, mix.heightPx);
});

test('wrappedLineCount: bungkus per kata, kapital lebih lebar, kata panjang dipatahkan', () => {
  assert.equal(wrappedLineCount('', 70), 1);
  assert.equal(wrappedLineCount('a\nb\nc', 70), 3);
  assert.equal(wrappedLineCount('baris\n\nbaris', 70), 3, 'baris kosong tetap menempati satu baris');
  // Dari tangkapan layar: judul kapital 22 karakter membungkus jadi 2 baris di kolom selebar 22
  assert.equal(wrappedLineCount('CORRECTIVE MAINTENANCE', 22), 2);
  // Teks huruf kecil yang sama panjang tetap muat satu baris
  assert.equal(wrappedLineCount('corrective maintenance', 22), 1);
  // Kata tanpa spasi lebih panjang dari kolom dipatahkan, bukan dianggap satu baris
  assert.ok(wrappedLineCount('x'.repeat(200), 70) >= 3);
  // Kalimat panjang membungkus di batas kata
  assert.ok(wrappedLineCount('kata '.repeat(60).trim(), 70) >= 4);
});

test('rowHeightPt: 15 pt per baris + ruang cadangan, mengikuti teks atau foto, dibatasi 409 pt', () => {
  assert.equal(rowHeightPt(['a'], [10], 0), 21);
  assert.equal(rowHeightPt(['a\nb\nc'], [10], 0), 3 * 15 + 6);
  assert.equal(rowHeightPt(['a'], [10], 200), 150);
  assert.equal(rowHeightPt(['x'.repeat(100000)], [10], 0), 409);
});

test('regresi tangkapan layar: baris dengan 7 baris teks cukup tinggi sehingga "Normal Operasi" tidak terpotong', () => {
  const uraian = 'Permasalahan : • Mirorr Regeneration in progress\nTindak lanjut :\n• Menunggu miror regeneration Selesai\n• Calibration ETD\n• Verifikasi ETD\n• test Sample\n• Normal Operasi';
  const cells = ['4', 'HBSCP 2.5', 'ETD Leidos B220', 'CORRECTIVE MAINTENANCE', '-', '-', uraian, '09:00 - 10:15', 'Normal', ''];
  const widths = [7.14, 33.99, 31.71, 22.14, 21.57, 15.71, 49.99 * 0.9, 22.86, 14.86, 45.57];
  assert.ok(rowHeightPt(cells, widths, 90) >= 7 * 15 + 6, 'minimal 7 baris x 15 pt');
});

// PNG 1x1 merah, valid
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

test('buildShiftReportWorkbook: foto tertanam di area Dokumentasi (O:Q), bukan tautan', async () => {
  const reports = [
    { shift: 'PS', Jenis: 'Perbaikan', kategori_maintenance: 'CORRECTIVE', Lokasi: 'T2 D', Peralatan: 'XRAY 1', Uraian: 'Mati', TindakLanjut: 'Ganti', Waktu: '08:00', Status: 'Normal' },
    { shift: 'PS', Jenis: 'Kegiatan', kategori_maintenance: 'KEGIATAN', Lokasi: 'T2 E', Peralatan: 'Briefing', Uraian: 'Briefing', TindakLanjut: '-', Waktu: '09:00', Status: 'Normal' },
  ];
  const laporanRows = buildLaporanSheetRows(reports, 'PS', classifiers);
  const photo = { dataUrl: PNG_1X1, width: 1, height: 1, extension: 'png' };

  const wb = buildShiftReportWorkbook(ExcelJS, {
    laporanRows,
    photos: [[photo, photo, photo], []],
    kesiapanRows: buildKesiapanSheetRows([{ nama: 'ETD', total: 5, operasi: 4, rusak: 1, persenOperasi: 0.8, persenRusak: 0.2 }]),
  });
  const buffer = await wb.xlsx.writeBuffer();

  const back = new ExcelJS.Workbook();
  await back.xlsx.load(buffer);
  assert.deepEqual(back.worksheets.map((w) => w.name), ['Laporan'], 'Serviceability berada di sheet Laporan, bukan sheet terpisah');

  const laporan = back.getWorksheet('Laporan');
  assert.equal(laporan.getImages().length, 3, 'tiga foto pada baris pertama');
  assert.ok(!laporan.getCell('O15').value, 'sel Dokumentasi tidak berisi tautan/teks');
  assert.equal(laporan.getCell('J15').value.richText.map((r) => r.text).join(''), 'Permasalahan : Mati\nTindak lanjut :\nGanti');
  // Area Dokumentasi = kolom O (64 px), P (64 px), Q (191 px); foto berada di dalamnya dan tidak bertumpuk.
  const colsPx = [64, 64, 191];
  const boxes = laporan.getImages().map(({ range }) => {
    assert.ok(range.tl.nativeCol >= 14 && range.tl.nativeCol <= 16, 'foto berada di kolom O sampai Q');
    assert.equal(range.tl.nativeRow, 14, 'foto berada di baris data pertama (baris 15)');
    const before = colsPx.slice(0, range.tl.nativeCol - 14).reduce((a, b) => a + b, 0);
    // Offset dalam EMU (9525 per piksel) agar foto tidak bertumpuk
    assert.equal(range.tl.nativeColOff % 9525, 0);
    return { xPx: before + range.tl.nativeColOff / 9525, yPx: range.tl.nativeRowOff / 9525, width: range.ext.width, height: range.ext.height };
  });
  insideCell(boxes, laporan.getRow(15).height / 0.75 + 1);
});

const HEADER_10 = ['No', 'Lokasi', 'Peralatan', 'Corrective Maintenance', 'Preventive Maintenance', 'Lain-lain', 'Uraian Kegiatan', 'Waktu Tindak Lanjut', 'Hasil', 'Dokumentasi'];
// Tata letak berkas acuan: baris judul tabel = 14 (6 slot personil), baris data pertama = 15; Uraian = kolom J:L.
const FIRST_DATA_ROW = 15;
const URAIAN_COL = 10;
const uraianWidth = (ws) => [10, 11, 12].reduce((sum, c) => sum + ws.getColumn(c).width, 0);

test('buildShiftReportWorkbook: teks lebih tinggi dari batas 409 pt dikecilkan hurufnya, bukan dipotong', () => {
  const panjang = Array.from({ length: 40 }, (_, i) => `• Langkah pemeriksaan nomor ${i + 1} dilakukan oleh teknisi`).join('\n');
  const rows = [HEADER_10, ['1', 'T2 D', 'XRAY', 'CORRECTIVE MAINTENANCE', '-', '-', panjang, '08:00', 'Normal', '']];
  const wb = buildShiftReportWorkbook(ExcelJS, { laporanRows: rows, photos: [[]], kesiapanRows: [] });
  const ws = wb.getWorksheet('Laporan');
  assert.equal(ws.getRow(FIRST_DATA_ROW).height, 409);
  const size = ws.getCell(FIRST_DATA_ROW, URAIAN_COL).font.size;
  assert.ok(size < 11 && size >= 5, `ukuran huruf ${size}`);
  const lines = wrappedLineCount(panjang, uraianWidth(ws) * 0.9);
  assert.ok(lines * (size * 15 / 11) + 6 <= 409, `${lines} baris pada huruf ${size} pt melewati 409 pt`);
  // Baris biasa tidak diubah hurufnya
  const normal = buildShiftReportWorkbook(ExcelJS, { laporanRows: [HEADER_10, ['1', 'a', 'b', '-', '-', '-', 'singkat', '-', 'Normal', '']], photos: [[]], kesiapanRows: [] });
  assert.equal(normal.getWorksheet('Laporan').getCell(FIRST_DATA_ROW, URAIAN_COL).font.size, 11);
});

test('uraianCellValue: hanya judul bagian yang tebal, uraian tanpa judul seluruhnya tebal', () => {
  const corrective = uraianCellValue('Permasalahan : Mati\nTindak lanjut :\n• Ganti', 11);
  assert.deepEqual(
    corrective.richText.map((r) => [r.text, r.font.bold]),
    [['Permasalahan :', true], [' Mati\n', false], ['Tindak lanjut :', true], ['\n• Ganti', false]],
  );
  const preventive = uraianCellValue('Kegiatan : Cek rutin\n   \nCatatan : Normal', 11);
  assert.deepEqual(preventive.richText.filter((r) => r.font.bold).map((r) => r.text), ['Kegiatan :', 'Catatan :']);
  assert.equal(uraianCellValue('Storing Peralatan', 11), 'Storing Peralatan');
  assert.equal(uraianCellValue('Permasalahan : x', 7).richText[0].font.size, 7);
});

test('buildShiftReportWorkbook: uraian korektif memakai teks kaya, uraian lain dan kolom lain tidak tebal', () => {
  const wb = buildShiftReportWorkbook(ExcelJS, {
    laporanRows: [
      HEADER_10,
      ['1', 'T2 D', 'XRAY', 'CORRECTIVE MAINTENANCE', '-', '-', 'Permasalahan : Mati\nTindak lanjut :\nGanti', '08:00', 'Normal', ''],
      ['2', 'T2 D', 'XRAY', '-', '-', 'KEGIATAN', 'Storing Peralatan', '08:00', 'Normal', ''],
    ],
    photos: [[], []],
    kesiapanRows: [],
  });
  const ws = wb.getWorksheet('Laporan');
  const runs = ws.getCell(FIRST_DATA_ROW, URAIAN_COL).value.richText;
  assert.deepEqual(runs.filter((r) => r.font.bold).map((r) => r.text), ['Permasalahan :', 'Tindak lanjut :']);
  assert.ok(!ws.getCell(FIRST_DATA_ROW, 2).font.bold);
  assert.ok(!ws.getCell(FIRST_DATA_ROW, 13).font.bold);
  assert.equal(ws.getCell(FIRST_DATA_ROW + 1, URAIAN_COL).value, 'Storing Peralatan');
  assert.equal(ws.getCell(FIRST_DATA_ROW + 1, URAIAN_COL).font.bold, true);
});

test('buildShiftReportWorkbook: satu paragraf sangat panjang melebarkan kolom uraian sampai tingginya muat', () => {
  const paragraf = 'kata '.repeat(400).trim();
  const rows = [HEADER_10, ['1', 'T2 D', 'XRAY', '-', '-', 'KEGIATAN', paragraf, '08:00', 'Normal', '']];
  const wb = buildShiftReportWorkbook(ExcelJS, { laporanRows: rows, photos: [[]], kesiapanRows: [] });
  const ws = wb.getWorksheet('Laporan');
  assert.ok(ws.getColumn(12).width > 28.43, 'lebar tambahan diberikan pada kolom L (ujung kolom uraian)');
  assert.ok(ws.getRow(FIRST_DATA_ROW).height <= 409);
  assert.ok(ws.getRow(FIRST_DATA_ROW).height >= textHeightPt([paragraf], [uraianWidth(ws) * 0.9]), 'tinggi cukup untuk teks pada lebar yang dipakai');
});

test('buildShiftReportWorkbook: judul tabel tidak terpotong, tingginya mengikuti judul yang membungkus', () => {
  const wb = buildShiftReportWorkbook(ExcelJS, { laporanRows: [HEADER_10], photos: [], kesiapanRows: [] });
  const ws = wb.getWorksheet('Laporan');
  // Dua baris judul (mis. "WAKTU TINDAK / LANJUT") + ruang cadangan; berkas acuan memakai 37,5 pt.
  assert.ok(ws.getRow(14).height >= 37.5);
  assert.equal(ws.getCell('M14').value, 'WAKTU TINDAK LANJUT');
  assert.equal(ws.getCell('M14').alignment.wrapText, true);
});
