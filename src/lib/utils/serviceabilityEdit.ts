// src/lib/utils/serviceabilityEdit.ts
// Edit manual jumlah unit pada Diagram Serviceability (tab Report). Fungsi murni agar bisa diuji di Node.

export interface ServiceabilityItem {
  no: number;
  nama: string;
  total: number;
  operasi: number;
  rusak: number;
  persenOperasi: number;
  persenRusak: number;
}

export type ServiceabilityField = 'total' | 'rusak';

/** Batas atas jumlah unit per jenis peralatan (mencegah salah ketik seperti 1000000). */
export const MAX_UNIT_COUNT = 9999;

/**
 * Nilai satu karakter digit. Angka lebar penuh dan sejenisnya dinormalkan dengan NFKC; digit sistem
 * lain (mis. Arab-Indik) dihitung dari posisinya dalam deretan 10 digit Unicode yang berurutan.
 */
const digitOf = (ch: string): string => {
  const normalized = ch.normalize('NFKC');
  if (/^[0-9]$/.test(normalized)) return normalized;
  if (!/^\p{Nd}$/u.test(ch)) return '';
  const cp = ch.codePointAt(0) as number;
  let steps = 0;
  while (steps < 60 && /^\p{Nd}$/u.test(String.fromCodePoint(cp - steps - 1))) steps++;
  return String(steps % 10);
};

/**
 * Mengubah isian kolom menjadi jumlah unit. Karakter selain digit diabaikan. Kolom kosong
 * menghasilkan null.
 */
export const parseUnitCount = (raw: string): number | null => {
  const digits = Array.from(raw ?? '').map(digitOf).join('');
  if (digits === '') return null;
  return Math.min(MAX_UNIT_COUNT, parseInt(digits, 10));
};

/** Terapkan satu edit Total/Off lalu hitung ulang Normal dan persentasenya. Item lain tidak berubah. */
export const applyServiceabilityEdit = <T extends ServiceabilityItem>(
  items: T[],
  no: number,
  field: ServiceabilityField,
  value: number,
): T[] =>
  items.map((item) => {
    if (item.no !== no) return item;
    const clean = Math.max(0, Math.min(MAX_UNIT_COUNT, Number.isFinite(value) ? Math.trunc(value) : 0));
    const total = field === 'total' ? clean : item.total;
    const rusak = Math.min(field === 'rusak' ? clean : item.rusak, total);
    const operasi = Math.max(0, total - rusak);
    return {
      ...item,
      total,
      rusak,
      operasi,
      persenOperasi: total > 0 ? operasi / total : 0,
      persenRusak: total > 0 ? rusak / total : 0,
    };
  });

/** Kunci pembanding isi diagram (hanya angka yang disimpan), untuk menandai "Belum disimpan". */
export const serviceabilityKey = (items: ServiceabilityItem[]): string =>
  JSON.stringify(items.map((i) => [i.no, i.total, i.rusak, i.operasi]));
