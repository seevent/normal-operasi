// src/lib/utils/preventiveStatus.ts
// Status baris Preventive dihitung dari DATA (log di database + percobaan lokal), bukan dari jam/cron.
// "Reset 07.00" terjadi dengan sendirinya: kunci periode berganti, log lama tak lagi cocok.
// Modul murni agar bisa diuji.

import type { PreventivePeriod } from '../data/preventiveTypes.ts';
import type { RowStatus } from './preventiveGrouping.ts';

export type PeriodKeys = Record<PreventivePeriod, string>;

/** Percobaan unggah yang sedang berjalan/gagal di perangkat ini (tidak disimpan ke mana pun). */
export interface LocalEntry {
  status: 'uploading' | 'failed';
  /** Kunci periode saat percobaan dimulai; dipakai membuang entri yang periodenya sudah berganti. */
  periodKey: string;
  error?: string;
}

/** Foto yang sudah tercatat di database untuk periode berjalan. */
export interface SavedEntry {
  periodKey: string;
  version: number;
  secureUrl: string;
  uploadedAt: string;
}

export interface PhotoLogRow {
  period: string;
  equipment_number: string;
  period_key: string;
  secure_url: string;
  cloudinary_version: number | string;
  uploaded_at: string;
}

export const rowKey = (period: PreventivePeriod, equipmentNumber: string): string => `${period}:${equipmentNumber}`;

export const deriveStatus = (
  local: LocalEntry | undefined,
  saved: SavedEntry | undefined,
  currentKey: string,
): RowStatus => {
  if (local && local.periodKey === currentKey) return local.status;
  if (saved && saved.periodKey === currentKey) return 'saved';
  return 'idle';
};

/**
 * Buang percobaan lokal milik periode yang sudah berganti. Foto yang gagal kemarin tidak boleh
 * di-Retry otomatis menjadi foto hari ini.
 */
export const pruneStaleLocals = (locals: Record<string, LocalEntry>, keys: PeriodKeys): Record<string, LocalEntry> => {
  const out: Record<string, LocalEntry> = {};
  for (const [k, entry] of Object.entries(locals)) {
    const period = k.slice(0, k.indexOf(':')) as PreventivePeriod;
    if (keys[period] === entry.periodKey) out[k] = entry;
  }
  return out;
};

/** Ubah baris log menjadi peta rowKey -> foto tersimpan, hanya untuk kunci periode berjalan. */
export const buildSavedMap = (rows: PhotoLogRow[], keys: PeriodKeys): Record<string, SavedEntry> => {
  const out: Record<string, SavedEntry> = {};
  for (const row of rows) {
    const period = row.period as PreventivePeriod;
    if (keys[period] !== row.period_key) continue;
    const version = Number(row.cloudinary_version);
    const k = rowKey(period, row.equipment_number);
    const prev = out[k];
    if (prev && prev.version >= version) continue;
    out[k] = { periodKey: row.period_key, version, secureUrl: row.secure_url, uploadedAt: row.uploaded_at };
  }
  return out;
};
