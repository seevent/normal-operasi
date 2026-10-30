// src/lib/utils/shiftAssignment.ts
// Menentukan laporan shift (tanggal operasional + PS/M) untuk entri Perbaikan, Storing,
// Kegiatan, dan Kalibrasi berdasarkan pukul kerjanya, bukan pukul laporan dibuat.
// Modul murni agar bisa diuji langsung.

export type ShiftCode = 'PS' | 'M';

export interface ShiftAssignment {
  tanggal: string; // YYYY-MM-DD, tanggal operasional (Shift M tanggal D = D 20:00 s.d. D+1 08:00)
  shift: ShiftCode;
}

const DAY = 24 * 60;
const PS_START = 8 * 60; // 08:00
const M_START = 20 * 60; // 20:00
/** Entri yang selesai lebih dari 7 jam setelah batas akhir shift-nya masuk ke shift berikutnya. */
export const OVERRUN_LIMIT_MINUTES = 7 * 60;

// Tanggal dihitung sebagai nomor hari (UTC murni) agar bebas dari zona waktu dan DST.
const toDayNumber = (tanggal: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(tanggal || '');
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86400000 : null;
};

const fromDayNumber = (day: number): string => new Date(day * 86400000).toISOString().slice(0, 10);

/** Pukul lokal sebuah Date sebagai menit absolut (nomor hari * 1440 + menit). */
const toAbsoluteMinutes = (d: Date): number =>
  Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 60000 + d.getHours() * 60 + d.getMinutes();

/** Mengambil pukul mulai & selesai dari teks waktu seperti "05:30 - 09:15", "05.30", atau "05:30 - ". */
export const parseWaktuRange = (waktu?: string): { start: number; end: number | null } | null => {
  const times = [...(waktu || '').matchAll(/(\d{1,2})[:.](\d{2})/g)]
    .map(m => Number(m[1]) * 60 + Number(m[2]))
    .filter(t => t < DAY);
  if (times.length === 0) return null;
  return { start: times[0], end: times.length > 1 ? times[1] : null };
};

/** Shift yang memuat menit absolut tertentu beserta batas akhirnya. */
const shiftAt = (abs: number): { day: number; shift: ShiftCode; end: number } => {
  const day = Math.floor(abs / DAY);
  const minute = abs - day * DAY;
  if (minute < PS_START) return { day: day - 1, shift: 'M', end: day * DAY + PS_START };
  if (minute < M_START) return { day, shift: 'PS', end: day * DAY + M_START };
  return { day, shift: 'M', end: (day + 1) * DAY + PS_START };
};

const nextShift = (day: number, shift: ShiftCode): { day: number; shift: ShiftCode } =>
  shift === 'PS' ? { day, shift: 'M' } : { day: day + 1, shift: 'PS' };

/**
 * Menentukan laporan shift sebuah entri:
 * 1. Shift ditentukan oleh pukul mulai, walaupun pukul selesai atau pembuatan laporan sudah di luar shift.
 * 2. Bila pukul selesai melebihi 7 jam dari batas akhir shift tersebut, entri masuk ke shift berikutnya.
 *
 * `tanggal` dari form bisa berarti tanggal operasional (default form: dini hari = tanggal kemarin)
 * atau tanggal kalender (form dibuka setelah 08:00 untuk pekerjaan Shift M dini hari). Keduanya
 * diselesaikan dengan `createdAt`: pukul mulai yang dipakai adalah kemunculan terakhir yang tidak
 * melewati waktu laporan dibuat. Tanpa `createdAt`, `tanggal` dianggap tanggal operasional.
 *
 * Mengembalikan `null` bila tanggal atau pukul mulai tidak terbaca.
 */
export const assignReportShift = (
  tanggal: string,
  waktu: string | undefined,
  createdAt?: Date | string | null
): ShiftAssignment | null => {
  const day = toDayNumber(tanggal);
  const range = parseWaktuRange(waktu);
  if (day === null || !range) return null;

  // Tafsiran tanggal operasional: pukul 00:00-07:59 berada di hari kalender berikutnya.
  const operational = (range.start < PS_START ? day + 1 : day) * DAY + range.start;
  let start = operational;

  const created = createdAt ? new Date(createdAt) : null;
  if (created && !Number.isNaN(created.getTime())) {
    const createdAbs = toAbsoluteMinutes(created);
    const candidates = [day + 1, day, day - 1]
      .map(d => d * DAY + range.start)
      .filter(abs => abs <= createdAbs && abs <= operational);
    if (candidates.length > 0) start = Math.max(...candidates);
  }

  const assigned = shiftAt(start);
  let result = { day: assigned.day, shift: assigned.shift };

  if (range.end !== null) {
    const end = start + ((range.end - range.start + DAY) % DAY);
    if (end - assigned.end > OVERRUN_LIMIT_MINUTES) result = nextShift(assigned.day, assigned.shift);
  }

  return { tanggal: fromDayNumber(result.day), shift: result.shift };
};

/** Tanggal YYYY-MM-DD digeser beberapa hari. */
export const shiftDateString = (tanggal: string, days: number): string => {
  const day = toDayNumber(tanggal);
  return day === null ? tanggal : fromDayNumber(day + days);
};
