// src/lib/data/kehadiranStatus.ts
// Status kehadiran pada jadwal_shift. Modul murni supaya bisa diuji langsung.

export const STATUS_KEHADIRAN = ['Hadir', 'Izin', 'Sakit', 'Dinas Luar'] as const;

/** Status yang berarti personel tidak bertugas pada shift itu. */
const STATUS_TIDAK_HADIR = ['izin', 'sakit', 'off', 'cuti', 'libur'];

export const isTidakHadir = (status: string | null | undefined) =>
  STATUS_TIDAK_HADIR.includes((status || '').trim().toLowerCase());

/**
 * Pilihan dropdown status untuk satu baris. Status penugasan dari roster
 * (mis. "Bantuan Umrah SV") ikut tampil agar tidak hilang saat disimpan ulang.
 */
export const statusOptions = (current?: string | null): string[] => {
  const base: string[] = [...STATUS_KEHADIRAN];
  const c = (current || '').trim();
  return c && !base.some(s => s.toLowerCase() === c.toLowerCase()) ? [...base, c] : base;
};

/** Label penugasan roster: wajib diisi, maks. 30 karakter, dan bukan status bawaan. */
export const validasiLabelPenugasan = (label: string): string | null => {
  const l = label.trim();
  if (!l) return 'Label status penugasan wajib diisi.';
  if (l.length > 30) return 'Label status penugasan maksimal 30 karakter.';
  const lower = l.toLowerCase();
  if (STATUS_KEHADIRAN.some(s => s.toLowerCase() === lower) || isTidakHadir(l)) {
    return `"${l}" adalah status bawaan; gunakan label penugasan lain, mis. "Bantuan Umrah SV".`;
  }
  return null;
};
