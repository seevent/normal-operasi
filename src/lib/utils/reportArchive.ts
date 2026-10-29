// src/lib/utils/reportArchive.ts
// Isi arsip ZIP sebelum laporan dihapus: CSV + JSON baris laporan dan nama berkas foto/video di dalamnya.
// Fungsi murni: tanpa jaringan/DOM, jadi mudah diuji di Node.

export interface ArchiveReportRow {
  id: string;
  tanggal: string;
  shift?: string | null;
  jenis?: string | null;
  waktu?: string | null;
  lokasi?: string | null;
  peralatan?: string | null;
  kategori_maintenance?: string | null;
  uraian?: string | null;
  tindak_lanjut?: string | null;
  status?: string | null;
  teknisi?: string | null;
  foto_urls?: string[] | null;
  created_at?: string | null;
}

const CSV_COLUMNS: (keyof ArchiveReportRow)[] = [
  'id', 'tanggal', 'shift', 'jenis', 'waktu', 'lokasi', 'peralatan', 'kategori_maintenance',
  'uraian', 'tindak_lanjut', 'status', 'teknisi', 'foto_urls', 'created_at',
];

const csvCell = (value: unknown): string => {
  const text = Array.isArray(value) ? value.join(' ') : value == null ? '' : String(value);
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV laporan; diawali BOM agar Excel membaca huruf non-ASCII dengan benar. */
export const buildReportCsv = (rows: ArchiveReportRow[]): string =>
  '﻿' + [CSV_COLUMNS.join(','), ...rows.map((r) => CSV_COLUMNS.map((c) => csvCell(r[c])).join(','))].join('\r\n');

const safe = (s: string | null | undefined): string => (s ?? '').replace(/[^A-Za-z0-9-]+/g, '_').replace(/^_+|_+$/g, '') || 'x';

const extensionOf = (url: string): string => {
  const m = url.split('?')[0].match(/\.([A-Za-z0-9]{2,5})$/);
  return m ? m[1].toLowerCase() : 'bin';
};

/** media/<tanggal>_<jenis>_<8 karakter id>_<urutan>.<ext> — urut per tanggal dan mudah dicocokkan dengan CSV. */
export const archiveMediaName = (row: ArchiveReportRow, index: number, url: string): string =>
  `media/${safe(row.tanggal)}_${safe(row.jenis)}_${row.id.slice(0, 8)}_${index + 1}.${extensionOf(url)}`;
