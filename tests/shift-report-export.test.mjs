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
import { layoutPhotos, rowHeightPt, buildShiftReportWorkbook, PHOTO_BOX } from '../src/lib/utils/shiftReportWorkbook.ts';
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

test('buildKesiapanSheetRows: persentase tetap pecahan agar Excel memformatnya sebagai %', () => {
  const rows = buildKesiapanSheetRows([
    { nama: 'ETD', total: 5, operasi: 4, rusak: 1, persenOperasi: 0.8, persenRusak: 0.2 },
  ]);
  assert.deepEqual(rows[0], ['No', 'Peralatan', 'Total', 'Operasi', 'Rusak', '% Operasi', '% Rusak']);
  assert.deepEqual(rows[1], [1, 'ETD', 5, 4, 1, 0.8, 0.2]);
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

test('layoutPhotos: kisi 2 kolom, rasio terjaga, tidak membesarkan foto, tinggi baris mengikuti jumlah foto', () => {
  assert.deepEqual(layoutPhotos([]), { placements: [], heightPx: 0 });

  const one = layoutPhotos([{ width: 480, height: 360 }]);
  assert.equal(one.placements[0].width, 109); // 110/480 -> 0.229 * 480; tinggi 82/360 -> 0.2277 menang
  assert.equal(one.placements[0].height, 82);
  assert.equal(one.heightPx, PHOTO_BOX.gap + PHOTO_BOX.height + PHOTO_BOX.gap);

  const small = layoutPhotos([{ width: 40, height: 30 }]);
  assert.equal(small.placements[0].width, 40);
  assert.equal(small.placements[0].height, 30);

  const three = layoutPhotos(Array.from({ length: 3 }, () => ({ width: 110, height: 82 })));
  assert.equal(three.placements[0].xPx, PHOTO_BOX.gap);
  assert.equal(three.placements[1].xPx, PHOTO_BOX.gap * 2 + PHOTO_BOX.width);
  assert.equal(three.placements[2].xPx, PHOTO_BOX.gap); // baris kedua kembali ke kolom pertama
  assert.ok(three.placements[2].yPx > three.placements[0].yPx);
  assert.equal(three.heightPx, PHOTO_BOX.gap + 2 * (PHOTO_BOX.height + PHOTO_BOX.gap));
});

test('rowHeightPt: mengikuti teks terpanjang atau tinggi foto, dibatasi 409 pt', () => {
  assert.equal(rowHeightPt(['a'], [10], 0), 17.5);
  assert.equal(rowHeightPt(['a\nb\nc'], [10], 0), 3 * 13.5 + 4);
  assert.equal(rowHeightPt(['a'], [10], 200), 150);
  assert.equal(rowHeightPt(['x'.repeat(100000)], [10], 0), 409);
});

// PNG 1x1 merah, valid
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

test('buildShiftReportWorkbook: foto tertanam di kolom Dokumentasi, bukan tautan', async () => {
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
  assert.deepEqual(back.worksheets.map((w) => w.name), ['Laporan', 'Kesiapan Fasilitas']);

  const laporan = back.getWorksheet('Laporan');
  assert.equal(laporan.getImages().length, 3, 'tiga foto pada baris pertama');
  assert.ok(!laporan.getCell(2, 10).value, 'sel Dokumentasi tidak berisi tautan/teks');
  assert.equal(laporan.getCell(2, 7).value, 'Permasalahan : Mati\nTindak lanjut :\nGanti');
  const docCol = laporanRows[0].indexOf('Dokumentasi');
  const { placements } = layoutPhotos([photo, photo, photo]);
  laporan.getImages().forEach(({ range }, i) => {
    assert.equal(range.tl.nativeCol, docCol, 'foto berada di kolom Dokumentasi');
    assert.equal(range.tl.nativeRow, 1, 'foto berada di baris data pertama');
    // Offset dalam EMU (9525 per piksel) agar foto tidak bertumpuk
    assert.equal(range.tl.nativeColOff, placements[i].xPx * 9525);
    assert.equal(range.tl.nativeRowOff, placements[i].yPx * 9525);
  });
  assert.ok(laporan.getRow(2).height >= 0.75 * layoutPhotos([photo, photo, photo]).heightPx, 'baris cukup tinggi untuk dua baris foto');

  const kesiapan = back.getWorksheet('Kesiapan Fasilitas');
  assert.equal(kesiapan.getCell(2, 6).value, 0.8);
  assert.equal(kesiapan.getCell(2, 6).numFmt, '0%');
});
