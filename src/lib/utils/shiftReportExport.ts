// src/lib/utils/shiftReportExport.ts
// Nama berkas dan isi sheet untuk ekspor laporan shift (PDF dan Excel).
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

import type { DefaultUraianFn } from './shiftReportMessage.ts';

export type ShiftReportFileExt = 'pdf' | 'xlsx';

/** "2026-10-24" -> "24-10-2026". Nilai di luar format YYYY-MM-DD dikembalikan apa adanya. */
const formatTanggalFile = (isoDate: string): string => {
  const [y, m, d] = (isoDate || '').split('-');
  return y && m && d ? `${d}-${m}-${y}` : isoDate;
};

/** Contoh: shift PS, 2026-10-24 -> "SSES T2-LAPORAN HARIAN (PS) 24-10-2026.pdf". */
export const buildShiftReportFilename = (shift: string, date: string, ext: ShiftReportFileExt): string =>
  `SSES T2-LAPORAN HARIAN (${shift}) ${formatTanggalFile(date)}.${ext}`;

/**
 * Teks uraian preventive: memakai uraian tersimpan bila memuat "Kegiatan :", selain itu uraian bawaan,
 * dan menambahkan bagian "Catatan :" bawaan bila belum ada.
 */
export const resolvePreventiveText = (r: any, getDefaultUraian: DefaultUraianFn): string => {
  const defaultUraian = getDefaultUraian(r.Peralatan, r.Lokasi);
  let rawText: string = r.Uraian && r.Uraian.includes('Kegiatan :') ? r.Uraian : defaultUraian;

  if (!rawText.includes('Catatan :')) {
    const catatanIndex = defaultUraian.indexOf('Catatan :');
    if (catatanIndex !== -1) {
      rawText = `${rawText.trim()}\n   \n${defaultUraian.slice(catatanIndex)}`;
    }
  }

  const kegiatanIdx = rawText.indexOf('Kegiatan :');
  return kegiatanIdx !== -1 ? rawText.slice(kegiatanIdx) : rawText;
};

export interface ShiftReportClassifiers {
  isCorrective: (r: any) => boolean;
  isPreventive: (r: any) => boolean;
  isStoring: (r: any) => boolean;
  getDefaultUraian: DefaultUraianFn;
  formatLokasi: (lokasi?: string) => string;
  formatHasil: (r: any) => string;
}

const tindakLanjutLines = (text: unknown): string => {
  const t = String(text ?? '').trim();
  if (!t || t === '-') return '-';
  if (!t.includes('•')) return t;
  return t
    .split('•')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => `• ${s}`)
    .join('\n');
};

/** Uraian kegiatan sebagai teks polos (padanan formatUraian pada dokumen cetak). */
export const plainUraian = (r: any, c: ShiftReportClassifiers): string => {
  if (c.isCorrective(r)) {
    return `Permasalahan : ${r.Uraian ?? '-'}\nTindak lanjut :\n${tindakLanjutLines(r.TindakLanjut)}`;
  }
  if (c.isStoring(r)) return 'Storing Peralatan';
  if (c.isPreventive(r)) return resolvePreventiveText(r, c.getDefaultUraian).trim();
  return r.TindakLanjut || r.Uraian || 'Normal Operasi';
};

const LAPORAN_HEADER = [
  'No', 'Lokasi', 'Peralatan', 'Corrective Maintenance', 'Preventive Maintenance',
  'Lain-lain', 'Uraian Kegiatan', 'Waktu Tindak Lanjut', 'Hasil', 'Dokumentasi',
];

/** URL foto sebuah baris laporan (fotoUrls, atau imageUrl tunggal), tanpa duplikat. */
export const fotoUrlsOf = (r: any): string[] => {
  const urls: string[] = Array.isArray(r.fotoUrls) && r.fotoUrls.length > 0 ? r.fotoUrls : r.imageUrl ? [r.imageUrl] : [];
  return Array.from(new Set(urls.filter(Boolean)));
};

/**
 * Sheet "Laporan": satu baris per baris tabel cetak. Kolom Shift hanya ada saat shift = ALL.
 * Sel Dokumentasi dikosongkan; fotonya ditanam sebagai gambar oleh pembuat workbook.
 */
export const buildLaporanSheetRows = (reports: any[], shift: string, c: ShiftReportClassifiers): string[][] => {
  const withShift = shift === 'ALL';
  const header = withShift ? [LAPORAN_HEADER[0], 'Shift', ...LAPORAN_HEADER.slice(1)] : LAPORAN_HEADER;
  const rows = reports.map((r, idx) => {
    const corrective = c.isCorrective(r);
    const preventive = c.isPreventive(r);
    const cols = [
      String(idx + 1),
      c.formatLokasi(r.Lokasi),
      r.Peralatan ?? '-',
      corrective ? 'CORRECTIVE MAINTENANCE' : '-',
      preventive ? 'PREVENTIVE MAINTENANCE' : '-',
      corrective || preventive ? '-' : 'KEGIATAN',
      plainUraian(r, c),
      r.Waktu || '-',
      c.formatHasil(r),
      '',
    ];
    return withShift ? [cols[0], r.shift ?? '-', ...cols.slice(1)] : cols;
  });
  return [header, ...rows];
};

export interface ChecklistSummaryRow {
  nama: string;
  total: number;
  operasi: number;
  rusak: number;
  persenOperasi: number;
  persenRusak: number;
}

/** Sheet "Kesiapan Fasilitas": persentase disimpan sebagai pecahan agar Excel memformatnya sebagai %. */
export const buildKesiapanSheetRows = (summary: ChecklistSummaryRow[]): Array<string | number>[] => [
  ['No', 'Peralatan', 'Total', 'Operasi', 'Rusak', '% Operasi', '% Rusak'],
  ...summary.map((s, idx) => [idx + 1, s.nama, s.total, s.operasi, s.rusak, s.persenOperasi, s.persenRusak]),
];
