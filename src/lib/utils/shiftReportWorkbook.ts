// src/lib/utils/shiftReportWorkbook.ts
// Menyusun workbook Excel laporan shift dengan foto tertanam di kolom Dokumentasi.
// ExcelJS diberikan dari luar (impor dinamis di browser) sehingga modul ini bisa diuji di Node.

export interface LoadedPhoto {
  /** Data URL JPEG, mis. "data:image/jpeg;base64,...". */
  dataUrl: string;
  width: number;
  height: number;
  extension: 'jpeg' | 'png';
}

export const PHOTO_BOX = { width: 110, height: 82, gap: 4, perLine: 2 } as const;

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

// Lebar kolom Excel (karakter) = (piksel - 5) / 7 untuk font standar.
const DOC_WCH = Math.ceil((PHOTO_BOX.perLine * (PHOTO_BOX.width + PHOTO_BOX.gap) + PHOTO_BOX.gap - 5) / 7);

export interface PhotoPlacement {
  index: number;
  xPx: number;
  yPx: number;
  width: number;
  height: number;
}

/** Letakkan foto dalam kisi `perLine` kolom per baris; tiap foto dimuat ke kotak tetap tanpa mengubah rasio. */
export const layoutPhotos = (
  sizes: Array<{ width: number; height: number }>,
  box: { width: number; height: number; gap: number; perLine: number } = PHOTO_BOX
): { placements: PhotoPlacement[]; heightPx: number } => {
  const placements = sizes.map((s, index) => {
    const scale = Math.min(box.width / s.width, box.height / s.height, 1);
    const width = Math.max(1, Math.round(s.width * scale));
    const height = Math.max(1, Math.round(s.height * scale));
    const line = Math.floor(index / box.perLine);
    const col = index % box.perLine;
    return {
      index,
      xPx: box.gap + col * (box.width + box.gap) + Math.round((box.width - width) / 2),
      yPx: box.gap + line * (box.height + box.gap) + Math.round((box.height - height) / 2),
      width,
      height,
    };
  });
  const lines = Math.ceil(sizes.length / box.perLine);
  return { placements, heightPx: sizes.length === 0 ? 0 : box.gap + lines * (box.height + box.gap) };
};

/**
 * Susun foto dengan batas tinggi baris Excel (409 pt). Bila 2 foto per baris tidak muat, jumlah foto per
 * baris dinaikkan dan kotaknya dikecilkan sehingga lebar total tetap sama dengan lebar kolom.
 */
export const layoutPhotosWithin = (
  sizes: Array<{ width: number; height: number }>,
  maxHeightPx: number = MAX_ROW_PT / PX_TO_PT
): { placements: PhotoPlacement[]; heightPx: number } => {
  let result = layoutPhotos(sizes);
  const columnPx = PHOTO_BOX.perLine * (PHOTO_BOX.width + PHOTO_BOX.gap) + PHOTO_BOX.gap;
  for (let perLine = PHOTO_BOX.perLine + 1; result.heightPx > maxHeightPx && perLine <= 8; perLine++) {
    // Lebar kotak dihitung dari lebar kolom dikurangi semua jarak, agar baris penuh tidak melewati kolom.
    const width = Math.floor((columnPx - PHOTO_BOX.gap * (perLine + 1)) / perLine);
    result = layoutPhotos(sizes, {
      width,
      height: Math.floor((width * PHOTO_BOX.height) / PHOTO_BOX.width),
      gap: PHOTO_BOX.gap,
      perLine,
    });
  }
  return result;
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

const COLUMN_WCH: Record<string, number> = {
  No: 5,
  Shift: 7,
  Lokasi: 24,
  Peralatan: 24,
  'Corrective Maintenance': 22,
  'Preventive Maintenance': 22,
  'Lain-lain': 12,
  'Uraian Kegiatan': 70,
  'Waktu Tindak Lanjut': 16,
  Hasil: 12,
  Dokumentasi: DOC_WCH,
};

export interface ShiftReportWorkbookInput {
  /** Baris pertama adalah header. */
  laporanRows: string[][];
  /** Satu entri per baris data (tanpa header); null = foto gagal dimuat. */
  photos: Array<Array<LoadedPhoto | null>>;
  kesiapanRows: Array<string | number>[];
}

const BORDER = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

const styleHeader = (row: any) => {
  row.font = { bold: true };
  row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  row.eachCell((cell: any) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    cell.border = BORDER;
  });
};

/**
 * Lebar kolom per judul. Kolom Uraian dilebarkan bertahap bila ada baris yang tingginya akan melewati
 * batas Excel, supaya tidak ada teks yang tertutup.
 */
const pickColumnWidths = (header: string[], dataRows: string[][]): number[] => {
  const base = header.map(h => COLUMN_WCH[h] ?? 20);
  const uraianCol = header.indexOf('Uraian Kegiatan');
  let widths = base;
  for (const uraianWch of [COLUMN_WCH['Uraian Kegiatan'], 90, 110, 140, 180]) {
    widths = base.map((w, i) => (i === uraianCol ? uraianWch : w));
    if (dataRows.every(cells => textHeightPt(cells, widths) <= MAX_ROW_PT)) break;
  }
  return widths;
};

export const buildShiftReportWorkbook = (ExcelJS: any, input: ShiftReportWorkbookInput): any => {
  const wb = new ExcelJS.Workbook();

  // --- Sheet Laporan
  const ws = wb.addWorksheet('Laporan');
  const [header, ...dataRows] = input.laporanRows;
  const widths = pickColumnWidths(header, dataRows);
  const docCol = header.indexOf('Dokumentasi');
  ws.columns = header.map((h, i) => ({ header: h, key: `c${i}`, width: widths[i] }));
  styleHeader(ws.getRow(1));
  // Header tebal: lebar efektif dikurangi agar judul kolom yang membungkus tetap terlihat utuh.
  ws.getRow(1).height = Math.max(30, textHeightPt(header, widths.map(w => w * 0.85)));

  dataRows.forEach((cells, i) => {
    const photos = (input.photos[i] ?? []).filter((p): p is LoadedPhoto => !!p);
    const { placements, heightPx } = layoutPhotosWithin(photos);
    const row = ws.addRow(cells);
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell({ includeEmpty: true }, (cell: any) => {
      cell.border = BORDER;
    });
    row.height = rowHeightPt(cells, widths, heightPx);

    // Teks lebih tinggi dari batas baris Excel (409 pt) tidak mungkin muat pada ukuran huruf biasa:
    // kecilkan hurufnya agar seluruh isi tetap terbaca.
    const needPt = textHeightPt(cells, widths);
    if (needPt > MAX_ROW_PT) {
      const size = Math.max(MIN_FONT_PT, Math.floor((BASE_FONT_PT * (MAX_ROW_PT - CELL_PAD_PT)) / (needPt - CELL_PAD_PT)));
      row.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.font = { ...(cell.font || {}), size };
      });
    }

    placements.forEach(p => {
      const imageId = wb.addImage({ base64: photos[p.index].dataUrl, extension: photos[p.index].extension });
      // Offset dalam EMU lewat bentuk "native": pecahan col/row ExcelJS dihitung dengan skala
      // lebar*10000 / tinggi*10000 yang bukan piksel sebenarnya sehingga foto bertumpuk.
      ws.addImage(imageId, {
        tl: {
          nativeCol: docCol,
          nativeColOff: p.xPx * EMU_PER_PX,
          nativeRow: i + 1,
          nativeRowOff: p.yPx * EMU_PER_PX,
        },
        ext: { width: p.width, height: p.height },
        editAs: 'oneCell',
      });
    });
  });

  // --- Sheet Kesiapan Fasilitas
  const wk = wb.addWorksheet('Kesiapan Fasilitas');
  wk.columns = [5, 22, 9, 9, 9, 11, 11].map(width => ({ width }));
  input.kesiapanRows.forEach(r => wk.addRow(r));
  styleHeader(wk.getRow(1));
  for (let r = 2; r <= input.kesiapanRows.length; r++) {
    wk.getRow(r).eachCell((cell: any) => {
      cell.border = BORDER;
    });
    wk.getCell(r, 6).numFmt = '0%';
    wk.getCell(r, 7).numFmt = '0%';
  }

  return wb;
};
