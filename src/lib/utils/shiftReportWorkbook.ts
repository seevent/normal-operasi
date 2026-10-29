// src/lib/utils/shiftReportWorkbook.ts
// Menyusun workbook Excel laporan shift dengan foto tertanam di kolom Dokumentasi.
// ExcelJS diberikan dari luar (impor dinamis di browser) sehingga modul ini bisa diuji di Node.

import {
  CHART_ROWS_BELOW_TABLE,
  columnLetter,
  getServiceabilityPlacement,
  type ServiceabilityChartSpec,
  type ServiceabilityPlacement,
} from './serviceabilityChart.ts';

export interface LoadedPhoto {
  /** Data URL JPEG, mis. "data:image/jpeg;base64,...". */
  dataUrl: string;
  width: number;
  height: number;
  extension: 'jpeg' | 'png';
}

const PX_TO_PT = 0.75;
/** Satuan offset jangkar gambar pada berkas Excel (EMU) per piksel. */
const EMU_PER_PX = 9525;
const MAX_ROW_PT = 409;
/** Tinggi satu baris teks Excel untuk font standar (Calibri 11), ditambah ruang cadangan per sel. */
const LINE_PT = 15;
const CELL_PAD_PT = 6;
/** Bagian lebar kolom yang dipakai perkiraan pembungkusan; sisanya cadangan agar teks tidak terpotong. */
const WRAP_SAFETY = 0.9;
const BASE_FONT_PT = 11;
const MIN_FONT_PT = 5;

/** Jarak antar-foto dan ke tepi sel (px). */
const PHOTO_GAP = 4;
/**
 * Tinggi baris yang disiapkan untuk foto bila teksnya pendek: cukup agar satu foto landscape 4:3 memenuhi
 * lebar area Dokumentasi. Baris yang lebih tinggi karena teks dipakai seluruhnya oleh foto.
 */
export const PHOTO_ROW_PX = 240;

export interface PhotoPlacement {
  index: number;
  xPx: number;
  yPx: number;
  width: number;
  height: number;
}

/**
 * Susun foto agar memenuhi sel Dokumentasi selebar `widthPx` dan setinggi baris (teks atau PHOTO_ROW_PX,
 * maks. 409 pt). Semua pilihan jumlah foto per baris dicoba; dipilih yang membuat foto paling besar.
 * Rasio foto terjaga, foto tidak dibesarkan melebihi ukuran aslinya, dan kumpulan foto berada di tengah sel.
 * `heightPx` = tinggi baris yang dibutuhkan (minimal `minHeightPx`).
 */
export const layoutPhotosInCell = (
  sizes: Array<{ width: number; height: number }>,
  opts: { widthPx?: number; minHeightPx?: number; maxHeightPx?: number } = {}
): { placements: PhotoPlacement[]; heightPx: number } => {
  if (sizes.length === 0) return { placements: [], heightPx: 0 };
  const widthPx = opts.widthPx ?? DOC_WIDTH_PX;
  const maxHeightPx = Math.floor(opts.maxHeightPx ?? MAX_ROW_PT / PX_TO_PT);
  const minHeightPx = Math.min(maxHeightPx, Math.ceil(opts.minHeightPx ?? 0));
  const targetPx = Math.max(minHeightPx, Math.min(PHOTO_ROW_PX, maxHeightPx));

  let best: { perLine: number; boxW: number; scaled: Array<{ width: number; height: number }>; area: number } | null = null;
  for (let perLine = 1; perLine <= sizes.length; perLine++) {
    const lines = Math.ceil(sizes.length / perLine);
    const boxW = Math.floor((widthPx - PHOTO_GAP * (perLine + 1)) / perLine);
    const boxH = Math.floor((targetPx - PHOTO_GAP * (lines + 1)) / lines);
    if (boxW < 1 || boxH < 1) break;
    const scaled = sizes.map(s => {
      const scale = Math.min(boxW / s.width, boxH / s.height, 1);
      return { width: Math.max(1, Math.floor(s.width * scale)), height: Math.max(1, Math.floor(s.height * scale)) };
    });
    const area = scaled.reduce((sum, s) => sum + s.width * s.height, 0);
    // Luas sama (selisih < 1%): pilih lebih banyak foto per baris agar baris lebih pendek.
    if (!best || area > best.area * 1.01) best = { perLine, boxW, scaled, area };
  }
  if (!best) return { placements: [], heightPx: minHeightPx };

  // Tinggi tiap baris foto = foto tertinggi di baris itu; baris foto dirapatkan lalu ditengahkan dalam sel.
  const { perLine, boxW, scaled } = best;
  const lineHeights: number[] = [];
  scaled.forEach((s, i) => {
    const line = Math.floor(i / perLine);
    lineHeights[line] = Math.max(lineHeights[line] ?? 0, s.height);
  });
  const usedPx = PHOTO_GAP + lineHeights.reduce((sum, h) => sum + h + PHOTO_GAP, 0);
  const heightPx = Math.max(minHeightPx, usedPx);
  const top = Math.floor((heightPx - usedPx) / 2);
  const lineTops = lineHeights.map((_, line) => top + PHOTO_GAP + lineHeights.slice(0, line).reduce((sum, h) => sum + h + PHOTO_GAP, 0));
  // Baris foto terakhir yang tidak penuh ikut ditengahkan secara horizontal.
  const rowWidth = (count: number) => count * boxW + (count + 1) * PHOTO_GAP;

  const placements = scaled.map((s, index) => {
    const line = Math.floor(index / perLine);
    const col = index % perLine;
    const count = Math.min(perLine, sizes.length - line * perLine);
    const left = Math.floor((widthPx - rowWidth(count)) / 2);
    return {
      index,
      xPx: left + PHOTO_GAP + col * (boxW + PHOTO_GAP) + Math.floor((boxW - s.width) / 2),
      yPx: lineTops[line] + Math.floor((lineHeights[line] - s.height) / 2),
      width: s.width,
      height: s.height,
    };
  });
  return { placements, heightPx };
};

/**
 * Lebar satu karakter relatif terhadap angka "0" (satuan lebar kolom Excel) pada Calibri.
 * Perkiraan sengaja sedikit lebar: huruf kapital dan M/W jauh lebih lebar daripada huruf kecil.
 */
const charUnits = (ch: string): number => {
  if (ch === ' ') return 0.45;
  if ('il.,:;!|\'`'.includes(ch)) return 0.5;
  if ('jtfr()[]-/\\'.includes(ch)) return 0.65;
  if (ch === '\u2022') return 0.7;
  if (ch === 'I') return 0.5;
  if (ch === 'm') return 1.6;
  if (ch === 'w') return 1.4;
  if (ch === 'M' || ch === 'W') return 1.75;
  if (ch === '&' || ch === '%' || ch === '@') return 1.4;
  if (ch >= 'A' && ch <= 'Z') return 1.2;
  if (ch >= 'a' && ch <= 'z') return 1;
  if (ch >= '0' && ch <= '9') return 1;
  return 1.2;
};

const wordUnits = (word: string): number => Array.from(word).reduce((sum, ch) => sum + charUnits(ch), 0);

/** Jumlah baris tampilan sebuah teks pada kolom selebar `wch` karakter: bungkus per kata, kata panjang dipatahkan. */
export const wrappedLineCount = (text: string, wch: number): number => {
  const avail = Math.max(1, wch * WRAP_SAFETY);
  const space = charUnits(' ');
  let total = 0;
  for (const paragraph of String(text ?? '').split('\n')) {
    let lines = 1;
    let used = 0;
    for (const word of paragraph.split(' ').filter(Boolean)) {
      const w = wordUnits(word);
      if (used > 0 && used + space + w <= avail) {
        used += space + w;
      } else if (w <= avail) {
        if (used > 0) lines += 1;
        used = w;
      } else {
        if (used > 0) lines += 1;
        lines += Math.ceil(w / avail) - 1;
        used = w - (Math.ceil(w / avail) - 1) * avail;
      }
    }
    total += lines;
  }
  return Math.max(1, total);
};

/** Tinggi (pt) yang dibutuhkan teks terpanjang di antara sel-sel satu baris. */
export const textHeightPt = (cells: string[], widthsWch: number[]): number => {
  const lines = cells.reduce((max, cell, i) => Math.max(max, wrappedLineCount(cell, widthsWch[i] || 10)), 1);
  return lines * LINE_PT + CELL_PAD_PT;
};

/** Tinggi baris (pt) agar teks terpanjang dan semua foto muat; dibatasi batas Excel. */
export const rowHeightPt = (cells: string[], widthsWch: number[], photoHeightPx: number): number =>
  Math.min(MAX_ROW_PT, Math.max(LINE_PT, textHeightPt(cells, widthsWch), photoHeightPx * PX_TO_PT));

// --- Tata letak sheet Laporan: meniru berkas acuan "SSES T2-LAPORAN HARIAN" (kolom A-Q, sel gabungan).

/** Lebar kolom A-R (karakter) pada berkas acuan. */
const COL_WCH = [7.14, 9.14, 19.57, 5.29, 12.14, 19.57, 22.14, 21.57, 15.71, 12.29, 9.14, 28.43, 22.86, 14.86, 9.14, 9.14, 27.29, 9.14];
const LAST_COL = 17;
/** Lebar piksel kolom: lebar tersimpan (termasuk ruang kosong) x 7 untuk font standar. */
const colPx = (col: number): number => Math.round(COL_WCH[col] * 7);

interface Field {
  /** Judul pada header tabel. */
  title: string;
  /** Nama kolom pada laporanRows (header sumber). */
  source: string;
  /** Kolom (1 = A) awal dan akhir sel gabungan. */
  from: number;
  to: number;
  bold?: boolean;
}

const FIELDS: Field[] = [
  { title: 'No', source: 'No', from: 1, to: 1 },
  { title: 'LOKASI', source: 'Lokasi', from: 2, to: 4 },
  { title: 'PERALATAN', source: 'Peralatan', from: 5, to: 6 },
  { title: 'CORRECTIVE MAINTENANCE', source: 'Corrective Maintenance', from: 7, to: 7 },
  { title: 'PREVENTIVE MAINTENANCE', source: 'Preventive Maintenance', from: 8, to: 8 },
  { title: 'LAIN - LAIN', source: 'Lain-lain', from: 9, to: 9 },
  { title: 'URAIAN KEGIATAN', source: 'Uraian Kegiatan', from: 10, to: 12, bold: true },
  { title: 'WAKTU TINDAK LANJUT', source: 'Waktu Tindak Lanjut', from: 13, to: 13 },
  { title: 'HASIL', source: 'Hasil', from: 14, to: 14 },
  { title: 'DOKUMENTASI', source: 'Dokumentasi', from: 15, to: 17 },
];
const DOC_FIELD = FIELDS[FIELDS.length - 1];
/** Lebar area Dokumentasi (kolom O:Q) dalam piksel: 64 + 64 + 191 = 319 pada berkas acuan. */
export const DOC_WIDTH_PX = Array.from({ length: DOC_FIELD.to - DOC_FIELD.from + 1 }, (_, i) => colPx(DOC_FIELD.from - 1 + i)).reduce((a, b) => a + b, 0);
const URAIAN_FIELD = FIELDS[6];
/** Kolom tempat lebar tambahan diberikan bila uraian terlalu panjang (juga kolom "Total" tabel Serviceability). */
const EXTRA_WIDTH_COL = URAIAN_FIELD.to;

const spanWch = (f: Field, widths: number[]): number => {
  let sum = 0;
  for (let c = f.from; c <= f.to; c++) sum += widths[c - 1];
  return sum;
};

/** Teks tebal lebih lebar daripada teks biasa pada lebar kolom yang sama. */
const BOLD_FACTOR = 0.9;
/** Header memakai huruf kapital tebal; perkiraannya diberi cadangan lebih besar agar judul tidak terpotong. */
const HEADER_FACTOR = 0.7;
const HEADER_PAD_PT = 10;
const HEADER_MIN_PT = 37.5;

export interface PersonilRow {
  nama: string;
  noHp: string;
}

/** Isi kop laporan (judul, shift, personil on duty). */
export interface ShiftReportKop {
  /** "PERSONIL ON DUTY MALAM" */
  onDutyLabel: string;
  /** Teks sel shift (3 baris), mis. "SHIFT MALAM (M) JUMAT, 23 OKTOBER 2026\n(D,E,F,UMROH)\nTERMINAL 2". */
  shiftLabel: string;
  /** "OKTOBER" */
  periodLabel: string;
  api: PersonilRow[];
  ias: PersonilRow[];
}

const EMPTY_KOP: ShiftReportKop = { onDutyLabel: 'PERSONIL ON DUTY', shiftLabel: '', periodLabel: '', api: [], ias: [] };

const TITLE_LEFT = 'PT ANGKASA PURA INDONESIA\nCABANG UTAMA BANDARA SOEKARNO-HATTA\nUNIT SAFETY & SECURITY ELECTRONIC SERVICES – T2';
const titleRight = (period: string) =>
  `LAPORAN PERBAIKAN SAFETY & SECURITY ELECTRONIC SERVICES\nTERMINAL 2 BANDARA SOEKARNO-HATTA\nPERIODE : ${period}`;

/** Baris personil pada berkas acuan (baris 7-12); bertambah bila personil lebih banyak. */
const MIN_PERSONIL_SLOTS = 6;

export interface SheetLayout {
  slots: number;
  /** Baris judul tabel kegiatan (baris 14 pada berkas acuan). */
  headerRow: number;
  firstDataRow: number;
  lastDataRow: number;
  /** Baris hitam penutup tabel kegiatan. */
  bandRow: number;
  placement: ServiceabilityPlacement;
}

export const getSheetLayout = (kop: ShiftReportKop | undefined, dataRowCount: number, itemCount: number): SheetLayout => {
  const k = kop ?? EMPTY_KOP;
  const slots = Math.max(MIN_PERSONIL_SLOTS, k.api.length, k.ias.length);
  const headerRow = slots + 8;
  const lastDataRow = headerRow + dataRowCount;
  return {
    slots,
    headerRow,
    firstDataRow: headerRow + 1,
    lastDataRow,
    bandRow: lastDataRow + 1,
    placement: getServiceabilityPlacement(lastDataRow, itemCount),
  };
};

export interface ShiftReportWorkbookInput {
  /** Baris pertama adalah header. */
  laporanRows: string[][];
  /** Satu entri per baris data (tanpa header); null = foto gagal dimuat. */
  photos: Array<Array<LoadedPhoto | null>>;
  /** Satu baris per peralatan, tanpa header: [no, nama, operasi, rusak, total]. */
  kesiapanRows: Array<string | number>[];
  kop?: ShiftReportKop;
  /** Logo Injourney Airports (PNG/JPEG) untuk kop. */
  logo?: LoadedPhoto | null;
}

const THIN = { style: 'thin' } as const;
const BLACK = 'FF000000';
const WHITE = 'FFFFFFFF';
const GREY = 'FFA6A6A6';

interface BoxStyle {
  bold?: boolean;
  fill?: string;
  color?: string;
  size?: number;
  wrap?: boolean;
}

/** Judul bagian dalam uraian yang dicetak tebal; teks lainnya biasa (seperti berkas acuan dan dokumen cetak). */
const URAIAN_LABEL = /(Permasalahan\s*:|Tindak lanjut\s*:|Kegiatan\s*:|Catatan\s*:)/gi;

/**
 * Isi sel uraian: bila memuat judul bagian ("Permasalahan :", "Tindak lanjut :", "Kegiatan :", "Catatan :")
 * hanya judul itu yang tebal; uraian tanpa judul (mis. "Storing Peralatan") seluruhnya tebal.
 */
export const uraianCellValue = (text: string, size: number): string | { richText: any[] } => {
  const parts = text.split(URAIAN_LABEL).filter(Boolean);
  if (parts.length === 1 && !new RegExp(URAIAN_LABEL.source, 'i').test(text)) return text;
  const run = (part: string) => ({
    text: part,
    font: { name: 'Calibri', size, bold: new RegExp(`^${URAIAN_LABEL.source}$`, 'i').test(part), color: { argb: BLACK } },
  });
  return { richText: parts.map(run) };
};

/** Gabungkan sel (bila lebih dari satu) lalu beri gaya dan garis tepi di sekeliling kotak gabungan. */
const paintBox = (ws: any, r1: number, c1: number, r2: number, c2: number, style: BoxStyle, value?: string | number | { richText: any[] }) => {
  if (r1 !== r2 || c1 !== c2) ws.mergeCells(r1, c1, r2, c2);
  if (value !== undefined) ws.getCell(r1, c1).value = value;
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: 'Calibri', size: style.size ?? 11, bold: !!style.bold, color: { argb: style.color ?? BLACK } };
      if (style.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: !!style.wrap };
      cell.border = {
        ...(r === r1 ? { top: THIN } : {}),
        ...(r === r2 ? { bottom: THIN } : {}),
        ...(c === c1 ? { left: THIN } : {}),
        ...(c === c2 ? { right: THIN } : {}),
      };
    }
  }
};

/** Letak foto: x piksel dari tepi kiri area Dokumentasi diubah ke kolom dan offset (EMU) di dalam kolom itu. */
const docAnchor = (xPx: number): { col: number; off: number } => {
  let col = DOC_FIELD.from;
  let rem = xPx;
  while (col < DOC_FIELD.to && rem >= colPx(col - 1)) {
    rem -= colPx(col - 1);
    col += 1;
  }
  return { col: col - 1, off: rem * EMU_PER_PX };
};

const writeKop = (ws: any, wb: any, kop: ShiftReportKop, layout: SheetLayout, logo: LoadedPhoto | null | undefined) => {
  const { slots } = layout;
  for (let r = 1; r <= 4; r++) ws.getRow(r).height = 15;

  paintBox(ws, 1, 1, 4, 3, {});
  paintBox(ws, 1, 4, 4, 10, { bold: true, wrap: true }, TITLE_LEFT);
  paintBox(ws, 1, 11, 4, 17, { bold: true, wrap: true }, titleRight(kop.periodLabel));
  paintBox(ws, 5, 1, 5, LAST_COL, { bold: true, fill: BLACK, color: WHITE }, kop.onDutyLabel);
  paintBox(ws, 6, 1, 6 + slots, 3, { bold: true, wrap: true }, kop.shiftLabel);
  paintBox(ws, 6, 4, 6, 10, { bold: true, fill: GREY }, 'API');
  paintBox(ws, 6, 11, 6, 17, { bold: true, fill: GREY }, 'IAS');
  for (let i = 0; i < slots; i++) {
    const r = 7 + i;
    ws.getRow(r).height = 15;
    paintBox(ws, r, 4, r, 8, { bold: true }, kop.api[i]?.nama ?? '');
    paintBox(ws, r, 9, r, 10, { bold: true, wrap: true }, kop.api[i]?.noHp ?? '');
    paintBox(ws, r, 11, r, 14, { bold: true, wrap: true }, kop.ias[i]?.nama ?? '');
    paintBox(ws, r, 15, r, 17, { bold: true, wrap: true }, kop.ias[i]?.noHp ?? '');
  }
  paintBox(ws, layout.headerRow - 1, 1, layout.headerRow - 1, LAST_COL, { bold: true, fill: BLACK });

  if (logo) {
    const id = wb.addImage({ base64: logo.dataUrl, extension: logo.extension });
    // Jangkar dua sel seperti berkas acuan: A1 (+117022, +28575) sampai C4 (+1225922, +161150) EMU.
    ws.addImage(id, {
      tl: { nativeCol: 0, nativeColOff: 117022, nativeRow: 0, nativeRowOff: 28575 },
      br: { nativeCol: 2, nativeColOff: 1225922, nativeRow: 3, nativeRowOff: 161150 },
      editAs: 'oneCell',
    });
  }
};

export const buildShiftReportWorkbook = (ExcelJS: any, input: ShiftReportWorkbookInput): any => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Laporan', {
    views: [{ state: 'normal', zoomScale: 80 }],
    properties: { defaultRowHeight: 15 },
  });

  const [header, ...dataRows] = input.laporanRows;
  const kop = input.kop ?? EMPTY_KOP;
  const layout = getSheetLayout(kop, dataRows.length, input.kesiapanRows.length);
  const shiftCol = header.indexOf('Shift');

  /** Nilai sel per kolom tabel; kolom Shift (shift = ALL) digabung ke sel No sebagai baris kedua. */
  const rowTexts = (cells: string[]): string[] =>
    FIELDS.slice(0, -1).map(f => {
      const value = String(cells[header.indexOf(f.source)] ?? '');
      return f.source === 'No' && shiftCol >= 0 ? `${value}\n${cells[shiftCol] ?? ''}` : value;
    });
  const heightWidths = (widths: number[]): number[] =>
    FIELDS.slice(0, -1).map(f => spanWch(f, widths) * (f.bold ? BOLD_FACTOR : 1));

  // Lebar kolom: seperti berkas acuan; kolom L dilebarkan bertahap bila ada uraian yang tingginya melewati batas Excel.
  let widths = COL_WCH;
  for (const extra of [0, 25, 55, 90, 130]) {
    widths = COL_WCH.map((w, i) => (i === EXTRA_WIDTH_COL - 1 ? w + extra : w));
    if (dataRows.every(cells => textHeightPt(rowTexts(cells), heightWidths(widths)) <= MAX_ROW_PT)) break;
  }
  ws.columns = widths.map(width => ({ width }));

  writeKop(ws, wb, kop, layout, input.logo);

  // --- Judul tabel kegiatan
  FIELDS.forEach(f => paintBox(ws, layout.headerRow, f.from, layout.headerRow, f.to, { bold: true, fill: GREY, wrap: true }, f.title));
  const headerLines = textHeightPt(
    FIELDS.map(f => f.title),
    FIELDS.map(f => spanWch(f, widths) * HEADER_FACTOR)
  );
  ws.getRow(layout.headerRow).height = Math.max(HEADER_MIN_PT, headerLines - CELL_PAD_PT + HEADER_PAD_PT);

  // --- Baris kegiatan
  dataRows.forEach((cells, i) => {
    const r = layout.firstDataRow + i;
    const photos = (input.photos[i] ?? []).filter((p): p is LoadedPhoto => !!p);
    const texts = rowTexts(cells);
    // Foto memenuhi sel Dokumentasi: selebar kolom O:Q dan setinggi baris (yang tingginya ditentukan teks bila lebih panjang).
    const { placements, heightPx } = layoutPhotosInCell(photos, { minHeightPx: textHeightPt(texts, heightWidths(widths)) / PX_TO_PT });
    ws.getRow(r).height = rowHeightPt(texts, heightWidths(widths), heightPx);

    // Teks lebih tinggi dari batas baris Excel (409 pt) tidak mungkin muat pada ukuran huruf biasa:
    // kecilkan hurufnya agar seluruh isi tetap terbaca.
    const needPt = textHeightPt(texts, heightWidths(widths));
    const size =
      needPt > MAX_ROW_PT
        ? Math.max(MIN_FONT_PT, Math.floor((BASE_FONT_PT * (MAX_ROW_PT - CELL_PAD_PT)) / (needPt - CELL_PAD_PT)))
        : BASE_FONT_PT;
    FIELDS.forEach((f, k) => {
      if (k >= texts.length) return paintBox(ws, r, f.from, r, f.to, { fill: WHITE, size, wrap: true });
      // Uraian: judul bagian tebal saja; uraian tanpa judul seluruhnya tebal.
      const value = f.bold ? uraianCellValue(texts[k], size) : texts[k];
      const plainBold = f.bold && typeof value === 'string';
      paintBox(ws, r, f.from, r, f.to, { bold: plainBold, fill: WHITE, size, wrap: true }, value);
    });

    placements.forEach(p => {
      const imageId = wb.addImage({ base64: photos[p.index].dataUrl, extension: photos[p.index].extension });
      const x = docAnchor(p.xPx);
      // Offset dalam EMU lewat bentuk "native": pecahan col/row ExcelJS dihitung dengan skala
      // lebar*10000 / tinggi*10000 yang bukan piksel sebenarnya sehingga foto bertumpuk.
      ws.addImage(imageId, {
        tl: { nativeCol: x.col, nativeColOff: x.off, nativeRow: r - 1, nativeRowOff: p.yPx * EMU_PER_PX },
        ext: { width: p.width, height: p.height },
        editAs: 'oneCell',
      });
    });
  });
  paintBox(ws, layout.bandRow, 1, layout.bandRow, LAST_COL, { bold: true, fill: BLACK });

  // --- Tabel Serviceability Peralatan: di bawah tabel kegiatan pada sheet yang sama, seperti berkas acuan.
  writeServiceabilityTable(ws, layout.placement, input.kesiapanRows);

  // Cetak: A4 lanskap selebar satu halaman, margin seperti berkas acuan.
  ws.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 1.1023622047244095, right: 1.1023622047244095, top: 0.19685039370078741, bottom: 0.19685039370078741, header: 0.78740157480314965, footer: 0.78740157480314965 },
    printArea: `A1:Q${layout.placement.lastRow + CHART_ROWS_BELOW_TABLE}`,
  };

  return wb;
};

// Warna isian tabel Serviceability pada berkas acuan (tema Office, sudah dengan tint).
const SERVICEABILITY_FILLS = ['FFC5E0B4', 'FFEDEDED', 'FF8FAADC', 'FF8FAADC', 'FFFF0000', 'FFFF0000', 'FFA9D18E'];
const SERVICEABILITY_ROW_PT = 18.75;

/**
 * Tujuh kolom tanpa judul: No, Peralatan, % OPS, jumlah OPS, % OFF, jumlah OFF, Total.
 * Persentase berupa rumus (OPS / Total, OFF / Total) seperti pada berkas acuan, dengan hasil tersimpan.
 */
const writeServiceabilityTable = (ws: any, p: ServiceabilityPlacement, rows: Array<string | number>[]) => {
  rows.forEach(([no, nama, operasi, rusak, total], i) => {
    const r = p.firstRow + i;
    const ref = (offset: number) => `${columnLetter(p.startCol + offset)}${r}`;
    const totalNum = Number(total);
    const pct = (n: unknown) => (totalNum > 0 ? Number(n) / totalNum : 0);
    const values: any[] = [
      no,
      nama,
      { formula: `IFERROR(${ref(3)}/${ref(6)},0)`, result: pct(operasi) },
      operasi,
      { formula: `IFERROR(${ref(5)}/${ref(6)},0)`, result: pct(rusak) },
      rusak,
      total,
    ];
    values.forEach((value, offset) => {
      const cell = ws.getCell(r, p.startCol + offset);
      cell.value = value;
      cell.font = { name: 'Calibri', size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SERVICEABILITY_FILLS[offset] } };
      cell.border = { top: THIN, left: THIN, bottom: THIN, right: THIN };
      cell.alignment = { horizontal: 'center' };
      if (offset === 2 || offset === 4) cell.numFmt = '0%';
    });
    ws.getRow(r).height = SERVICEABILITY_ROW_PT;
  });
};

/** Isi grafik Serviceability (dari baris yang sama dengan tabel) dan letaknya, untuk disisipkan ke paket xlsx. */
export const buildServiceabilityChartSpec = (input: ShiftReportWorkbookInput): ServiceabilityChartSpec | null => {
  if (input.kesiapanRows.length === 0) return null;
  const pct = (n: unknown, total: unknown) => (Number(total) > 0 ? Number(n) / Number(total) : 0);
  const layout = getSheetLayout(input.kop, Math.max(input.laporanRows.length - 1, 0), input.kesiapanRows.length);
  return {
    placement: layout.placement,
    categories: input.kesiapanRows.map(r => String(r[1])),
    ops: input.kesiapanRows.map(r => pct(r[2], r[4])),
    off: input.kesiapanRows.map(r => pct(r[3], r[4])),
  };
};
