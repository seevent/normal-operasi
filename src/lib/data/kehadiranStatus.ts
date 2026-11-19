// src/lib/data/kehadiranStatus.ts
// Status kehadiran pada jadwal_shift. Modul murni supaya bisa diuji langsung.

export const STATUS_KEHADIRAN = ['Hadir', 'Izin', 'Sakit', 'Dinas Luar'] as const;

/** Status yang berarti personel tidak bertugas pada shift itu. */
const STATUS_TIDAK_HADIR = ['izin', 'sakit', 'off', 'cuti', 'libur'];

export const isTidakHadir = (status: string | null | undefined) =>
  STATUS_TIDAK_HADIR.includes((status || '').trim().toLowerCase());

/** Label penugasan roster (judul bagian di pesan Kehadiran): wajib diisi, maks. 30 karakter, dan bukan status bawaan. */
export const validasiLabelPenugasan = (label: string): string | null => {
  const l = label.trim();
  if (!l) return 'Label status penugasan wajib diisi.';
  if (l.length > 30) return 'Label status penugasan maksimal 30 karakter.';
  const lower = l.toLowerCase();
  if (STATUS_KEHADIRAN.some(s => s.toLowerCase() === lower) || isTidakHadir(l)) {
    return `"${l}" adalah status bawaan; gunakan label penugasan lain, mis. "Bantuan Umroh SV".`;
  }
  return null;
};
