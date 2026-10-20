// src/lib/utils/timeRange.ts
// Aturan pukul mulai tidak boleh melebihi pukul selesai. Modul murni agar bisa diuji langsung.

const toMinutes = (t?: string): number | null => {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec((t ?? '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

// Batas Shift Malam (20:00-08:00): satu-satunya rentang yang sah melewati tengah malam.
const SHIFT_MALAM_START = 20 * 60;
const SHIFT_MALAM_END = 8 * 60;

/**
 * `true` bila pukul mulai lebih lambat dari pukul selesai.
 * Rentang yang melewati tengah malam di Shift Malam (mulai >= 20:00 dan selesai < 08:00) tetap sah.
 * Isian kosong atau tidak terbaca dianggap belum bisa dibandingkan, bukan salah.
 */
export const isStartAfterEnd = (start?: string, end?: string): boolean => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null || s <= e) return false;
  return !(s >= SHIFT_MALAM_START && e < SHIFT_MALAM_END);
};

/** Kalimat maskot untuk rentang pukul yang terbalik. */
export const buildTimeRangeMessage = (start: string, end: string, noun = 'pukul'): string =>
  `Bip bip! Hasil scan: ${noun} mulai (${start}) melebihi ${noun} selesai (${end}). Mohon periksa lagi.`;
