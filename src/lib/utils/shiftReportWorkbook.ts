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
const LINE_PT = 13.5;

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

/** Tinggi baris (pt) agar teks terpanjang dan semua foto muat; dibatasi batas Excel. */
export const rowHeightPt = (cells: string[], widthsWch: number[], photoHeightPx: number): number => {
  let textLines = 1;
  cells.forEach((cell, i) => {
    const wch = widthsWch[i] || 10;
    const lines = String(cell ?? '')
      .split('\n')
      .reduce((sum, part) => sum + Math.max(1, Math.ceil(part.length / wch)), 0);
    textLines = Math.max(textLines, lines);
  });
  const textPt = textLines * LINE_PT + 4;
  return Math.min(MAX_ROW_PT, Math.max(15, textPt, photoHeightPx * PX_TO_PT));
};

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

export const buildShiftReportWorkbook = (ExcelJS: any, input: ShiftReportWorkbookInput): any => {
  const wb = new ExcelJS.Workbook();

  // --- Sheet Laporan
  const ws = wb.addWorksheet('Laporan');
  const [header, ...dataRows] = input.laporanRows;
  const widths = header.map(h => COLUMN_WCH[h] ?? 20);
  const docCol = header.indexOf('Dokumentasi');
  ws.columns = header.map((h, i) => ({ header: h, key: `c${i}`, width: widths[i] }));
  styleHeader(ws.getRow(1));
  ws.getRow(1).height = 30;

  dataRows.forEach((cells, i) => {
    const photos = (input.photos[i] ?? []).filter((p): p is LoadedPhoto => !!p);
    const { placements, heightPx } = layoutPhotos(photos);
    const row = ws.addRow(cells);
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell({ includeEmpty: true }, (cell: any) => {
      cell.border = BORDER;
    });
    row.height = rowHeightPt(cells, widths, heightPx);

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
