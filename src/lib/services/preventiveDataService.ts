// src/lib/services/preventiveDataService.ts
// Pembacaan data tab Preventive dari Supabase (hanya SELECT; tulis hanya lewat server function).

import { supabase } from '../supabaseClient';
import type { PreventiveAsset } from '../utils/preventiveGrouping';
import type { PeriodKeys, PhotoLogRow } from '../utils/preventiveStatus';
import { parseServerTime } from '../utils/preventiveImage';

interface AssetRow {
  equipment_number: string;
  name: string;
  asset_type: string;
  location_group: string;
  location_override: string | null;
  periods: string[] | null;
  active: boolean;
  synced_at: string | null;
}

/** Daftar peralatan = salinan daftar PRIMA (Preventive > Maintenance > Electronica > Soekarno-Hatta > Terminal 2). */
export async function fetchPreventiveAssets(): Promise<PreventiveAsset[]> {
  const { data, error } = await supabase
    .from('prima_assets')
    .select('equipment_number,name,asset_type,location_group,location_override,periods,active,synced_at')
    .order('name', { ascending: true })
    .limit(2000);
  if (error) throw new Error('Daftar peralatan tidak dapat dimuat.');
  return ((data ?? []) as AssetRow[]).map((r) => ({
    equipmentNumber: r.equipment_number,
    name: r.name,
    assetType: r.asset_type,
    locationGroup: r.location_group,
    locationOverride: r.location_override,
    periods: r.periods ?? [],
    active: r.active,
    syncedAt: r.synced_at,
  }));
}

export interface ServerClock {
  keys: PeriodKeys;
  /** Selisih jam server terhadap jam perangkat (ms): server = perangkat + offset. */
  offsetMs: number;
}

/** Kunci periode dihitung database (otoritas waktu), bukan jam perangkat yang bisa salah. */
export async function fetchServerClock(): Promise<ServerClock> {
  const t0 = Date.now();
  const { data, error } = await supabase.rpc('preventive_current_keys');
  const t1 = Date.now();
  if (error || !data) throw new Error('Waktu server tidak dapat dibaca.');
  const k = data as { now: string; daily: string; weekly: string; monthly: string };
  // Kunci periode (tanggal) tetap sah walau jam server tak terbaca; selisih jam hanya dipakai untuk penjadwalan ulang.
  const serverNow = parseServerTime(String(k.now));
  return {
    keys: { DAILY: k.daily, WEEKLY: k.weekly, MONTHLY: k.monthly },
    offsetMs: serverNow === null ? 0 : serverNow - (t0 + t1) / 2,
  };
}

/** Log foto untuk kunci periode berjalan (maks 3 x jumlah aset baris). */
export async function fetchPhotoLog(keys: PeriodKeys): Promise<PhotoLogRow[]> {
  const { data, error } = await supabase
    .from('preventive_photo_log')
    .select('period,equipment_number,period_key,secure_url,cloudinary_version,uploaded_at')
    .in('period_key', [keys.DAILY, keys.WEEKLY, keys.MONTHLY])
    .limit(5000);
  if (error) throw new Error('Status foto tidak dapat dimuat.');
  return (data ?? []) as PhotoLogRow[];
}

let qrCodesPromise: Promise<Record<string, string>> | null = null;

/**
 * Peta nomor equipment → URL gambar QR code di Cloudinary. Diambil sekali per sesi lewat server function
 * (Search API butuh API secret); bila gagal, panggilan berikutnya mencoba lagi.
 */
export function fetchPreventiveQrCodes(): Promise<Record<string, string>> {
  if (!qrCodesPromise) {
    qrCodesPromise = import('../server/preventive.functions.ts')
      .then(({ getPreventiveQrCodes }) => getPreventiveQrCodes())
      .catch((err: unknown) => {
        qrCodesPromise = null;
        throw err;
      });
  }
  return qrCodesPromise;
}
