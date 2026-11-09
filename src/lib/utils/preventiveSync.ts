// src/lib/utils/preventiveSync.ts
// Info sync data PRIMA -> prima_assets untuk tab Preventive: kapan terakhir daftar peralatan diperbarui.
// Modul murni agar bisa diuji langsung.

import { parseServerTime } from './preventiveImage.ts';

/** Daftar peralatan yang lebih tua dari ini ditandai perlu sync ulang. */
export const SYNC_STALE_DAYS = 7;

const DAY_MS = 86_400_000;
const WIB_OFFSET_MS = 7 * 3_600_000;

export interface SyncInfo {
  /** Waktu sync terbaru (epoch ms), null bila belum ada data sync. */
  at: number | null;
  /** Selisih hari kalender WIB antara sync terakhir dan sekarang. */
  ageDays: number | null;
  stale: boolean;
}

const wibDay = (ms: number): number => Math.floor((ms + WIB_OFFSET_MS) / DAY_MS);

export const lastSyncInfo = (assets: Array<{ syncedAt?: string | null }>, nowMs: number): SyncInfo => {
  let at: number | null = null;
  for (const a of assets) {
    const ms = a.syncedAt ? parseServerTime(a.syncedAt) : null;
    if (ms !== null && (at === null || ms > at)) at = ms;
  }
  if (at === null) return { at: null, ageDays: null, stale: false };
  const ageDays = Math.max(0, wibDay(nowMs) - wibDay(at));
  return { at, ageDays, stale: ageDays > SYNC_STALE_DAYS };
};

export const formatSyncTime = (ms: number): string => {
  const parts = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta',
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? '';
  return `${get('weekday')} ${get('day')} ${get('month')} ${get('year')}, ${get('hour')}.${get('minute')} WIB`;
};

export const formatSyncAge = (ageDays: number): string => (ageDays <= 0 ? 'hari ini' : ageDays === 1 ? 'kemarin' : `${ageDays} hari lalu`);
