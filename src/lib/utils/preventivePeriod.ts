// src/lib/utils/preventivePeriod.ts
// Aturan periode & penamaan foto Preventive. Modul murni (tanpa React/Supabase) agar bisa diuji langsung
// dan dipakai bersama oleh klien dan server function.
//
// Semua periode berganti pukul 07.00 WIB, dihitung dari "hari operasional":
//   hari operasional = tanggal (WIB) dari (sekarang - 7 jam)
//   DAILY   -> hari operasional
//   WEEKLY  -> hari Minggu awal minggu (reset Minggu 07.00)
//   MONTHLY -> tanggal 1 (reset tanggal 1 pukul 07.00)
// Hasilnya HARUS sama dengan fungsi SQL public.preventive_period_key() di Supabase.
// Dihitung dari instan (epoch), bukan dari zona waktu perangkat: WIB tetap UTC+7 sepanjang tahun.

import { PREVENTIVE_ASSET_TYPES, PREVENTIVE_PERIODS } from '../data/preventiveTypes.ts';
import type { PreventivePeriod } from '../data/preventiveTypes.ts';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const WIB_OFFSET_HOURS = 7;
export const RESET_HOUR_WIB = 7;

function assertPeriod(period: string): asserts period is PreventivePeriod {
  if (!(PREVENTIVE_PERIODS as readonly string[]).includes(period)) {
    throw new Error(`periode tidak valid: ${period}`);
  }
}

const utcMidnight = (ms: number): Date => {
  const d = new Date(ms);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/** Tanggal operasional (tengah malam UTC dari tanggal kalender WIB setelah dikurangi 7 jam). */
export const operationalDay = (now: Date): Date =>
  utcMidnight(now.getTime() + WIB_OFFSET_HOURS * HOUR_MS - RESET_HOUR_WIB * HOUR_MS);

/** Awal periode sebagai tanggal kalender (tengah malam UTC). */
const periodStart = (period: PreventivePeriod, now: Date): Date => {
  const day = operationalDay(now);
  if (period === 'DAILY') return day;
  if (period === 'WEEKLY') return new Date(day.getTime() - day.getUTCDay() * DAY_MS);
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
};

const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

/** Kunci periode 'YYYY-MM-DD' (DAILY: hari operasional, WEEKLY: Minggu awal minggu, MONTHLY: tanggal 1). */
export const periodKey = (period: string, now: Date): string => {
  assertPeriod(period);
  return toIsoDate(periodStart(period, now));
};

/** 'YYYY-MM-DD' -> 'YYYYMMDD' (format tanggal pada nama file). */
export const compactKey = (key: string): string => key.replace(/-/g, '');

/** Instan reset berikutnya (07.00 WIB) untuk periode ini. */
export const nextResetAt = (period: string, now: Date): Date => {
  assertPeriod(period);
  const start = periodStart(period, now);
  let nextStartMs: number;
  if (period === 'DAILY') nextStartMs = start.getTime() + DAY_MS;
  else if (period === 'WEEKLY') nextStartMs = start.getTime() + 7 * DAY_MS;
  else nextStartMs = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
  // Tanggal awal periode berikutnya pukul 07.00 WIB.
  return new Date(nextStartMs + (RESET_HOUR_WIB - WIB_OFFSET_HOURS) * HOUR_MS);
};

export const isValidEquipmentNumber = (value: string): boolean => /^ESE[0-9]{12}$/.test(value);

const assertAssetType = (assetType: string): void => {
  if (!(PREVENTIVE_ASSET_TYPES as readonly string[]).includes(assetType)) {
    throw new Error(`tipe aset tidak valid: ${assetType}`);
  }
};

/** Nama file yang terlihat: {Equipment Number}_{YYYYMMDD}. */
export const buildFileName = (equipmentNumber: string, key: string): string =>
  `${equipmentNumber}_${compactKey(key)}`;

/** Folder Cloudinary (asset_folder): PRIMA/PREVENTIVE/MAINTENANCE/{PERIODE}/{TIPE}. */
export const buildFolder = (period: string, assetType: string): string => {
  assertPeriod(period);
  assertAssetType(assetType);
  return `PRIMA/PREVENTIVE/MAINTENANCE/${period}/${assetType}`;
};

/**
 * public_id memuat path folder: akun memakai dynamic folder mode, jadi public_id bersifat global.
 * Tanpa path, foto DAILY dan WEEKLY dengan nama file yang sama akan saling menimpa.
 */
export const buildPublicId = (period: string, assetType: string, equipmentNumber: string, key: string): string =>
  `${buildFolder(period, assetType)}/${buildFileName(equipmentNumber, key)}`;
