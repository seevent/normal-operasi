import * as XLSX from 'xlsx';
import { MONTH_NAMES_ID, expandScheduleRow, isScheduleFooterRow, type ScheduleEquipment } from './pmScheduleParser.ts';

/** Satu peralatan yang dijadwalkan General Annual Check pada satu tanggal (tabel jadwal_gac). */
export interface JadwalGacRecord extends ScheduleEquipment {
  tanggal: string; // YYYY-MM-DD
  bulan: number;
  tahun: number;
}

export interface GacSheetResult {
  records: JadwalGacRecord[];
  /** Tanggal pertama dan terakhir pada kolom jadwal GAC; dipakai untuk mengganti data lama di rentang ini. */
  dariTanggal: string | null;
  sampaiTanggal: string | null;
}

const GAC_GREEN = ['00B050', 'FF00B050'];

const cellAt = (ws: XLSX.WorkSheet, r: number, c: number) => ws[XLSX.utils.encode_cell({ r, c })];

const lastRowCol = (ref: string | undefined): { rows: number; cols: number } => {
  const range = XLSX.utils.decode_range(ref || 'A1:AW80');
  return { rows: range.e.r + 1, cols: range.e.c + 1 };
};

const isGacCell = (cell: XLSX.CellObject | undefined): boolean => {
  const style = (cell as { s?: { fgColor?: { rgb?: string } } } | undefined)?.s;
  const rgb = String(style?.fgColor?.rgb || '').toUpperCase();
  if (GAC_GREEN.includes(rgb)) return true;
  const text = String(cell?.v ?? '').trim().toUpperCase();
  return text === 'GAC' || text.includes('ANNUAL');
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Baca sheet "JADWAL GAC": tabel LOKASI | MERK/TYPE | TANGGAL, dengan baris nama bulan
 * (sel gabungan, mis. NOVEMBER lalu DESEMBER) dan baris nomor tanggal di bawahnya.
 * Sel hijau = General Annual Check. Bagian "Jadwal Tindak Lanjut" di sebelah kanan
 * (setelah kolom kosong pemisah) tidak ikut dibaca.
 */
export function parseSheetGac(ws: XLSX.WorkSheet, tahunDefault: number): GacSheetResult {
  const empty: GacSheetResult = { records: [], dariTanggal: null, sampaiTanggal: null };
  const { rows, cols } = lastRowCol(ws['!ref']);

  let headerRow = -1;
  let tahun = tahunDefault;
  for (let r = 0; r < Math.min(rows, 15) && headerRow === -1; r++) {
    for (let c = 0; c < cols; c++) {
      const val = String(cellAt(ws, r, c)?.v ?? '').trim().toUpperCase();
      const year = val.match(/\b(20\d{2})\b/);
      if (year && headerRow === -1) tahun = Number(year[1]);
      if (val === 'LOKASI') {
        headerRow = r;
        break;
      }
    }
  }
  if (headerRow === -1) return empty;

  // Cari baris nomor tanggal (1-31) dan baris nama bulan di atasnya.
  let dayRow = -1;
  for (let r = headerRow; r <= headerRow + 3 && dayRow === -1; r++) {
    const n = Number(cellAt(ws, r, 3)?.v);
    if (Number.isInteger(n) && n >= 1 && n <= 31) dayRow = r;
  }
  if (dayRow === -1) return empty;

  const dateCols: Array<{ col: number; tanggal: string; bulan: number; tahun: number }> = [];
  let bulan = -1;
  let year = tahun;
  for (let c = 3; c < cols; c++) {
    for (let r = headerRow; r < dayRow; r++) {
      const text = String(cellAt(ws, r, c)?.v ?? '').trim().toUpperCase();
      const idx = MONTH_NAMES_ID.findIndex(m => text.includes(m));
      if (idx !== -1) {
        if (bulan !== -1 && idx + 1 < bulan) year += 1; // DESEMBER -> JANUARI
        bulan = idx + 1;
      }
    }
    const day = Number(cellAt(ws, dayRow, c)?.v);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      if (dateCols.length > 0) break; // kolom pemisah sebelum "Jadwal Tindak Lanjut"
      continue;
    }
    if (bulan === -1) return empty;
    dateCols.push({ col: c, tanggal: `${year}-${pad(bulan)}-${pad(day)}`, bulan, tahun: year });
  }
  if (dateCols.length === 0) return empty;

  const records: JadwalGacRecord[] = [];
  for (let r = dayRow + 1; r < rows; r++) {
    const locVal = String(cellAt(ws, r, 1)?.v ?? '').trim();
    const merkVal = String(cellAt(ws, r, 2)?.v ?? '').trim();
    if (!locVal || !merkVal || isScheduleFooterRow(locVal)) continue;

    const equipment = expandScheduleRow(locVal, merkVal);
    for (const dc of dateCols) {
      if (!isGacCell(cellAt(ws, r, dc.col))) continue;
      for (const item of equipment) {
        records.push({ tanggal: dc.tanggal, bulan: dc.bulan, tahun: dc.tahun, ...item });
      }
    }
  }

  return { records, dariTanggal: dateCols[0].tanggal, sampaiTanggal: dateCols[dateCols.length - 1].tanggal };
}

/** Pilih sheet jadwal GAC: nama sheet memuat "GAC", atau judulnya "General Annual Check". */
export function findGacSheetName(workbook: XLSX.WorkBook): string | null {
  const byName = workbook.SheetNames.find(name => /\bGAC\b/i.test(name));
  if (byName) return byName;
  const byTitle = workbook.SheetNames.find(name => {
    const ws = workbook.Sheets[name];
    return [0, 1, 2].some(r => String(cellAt(ws, r, 0)?.v ?? '').toUpperCase().includes('GENERAL ANNUAL CHECK'));
  });
  return byTitle || null;
}
