// src/lib/services/preventiveAssetAdminService.ts
// Kelola peralatan Preventive dari tab Data: baca/tulis prima_assets (RLS: pengguna login boleh tambah & ubah,
// tidak menghapus), unggah gambar QR code, dan periksa isi seluruh QR terhadap database.
// Isi QR selalu dibaca dari pikselnya (decode), bukan dari nama berkas.

import { supabase } from '../supabaseClient';
import { usePreventiveStore } from '../../store/usePreventiveStore';
import { fetchPreventiveQrCodes, resetPreventiveQrCodes } from './preventiveDataService';
import { reconcileQr } from '../utils/preventiveAssetAdmin';
import type { AssetValidation, QrCheckReport } from '../utils/preventiveAssetAdmin';

export interface AdminAsset {
  equipmentNumber: string;
  name: string;
  assetType: string;
  locationGroup: string;
  locationOverride: string | null;
  periods: string[];
  active: boolean;
  qrTarget: string | null;
}

interface Row {
  equipment_number: string;
  name: string;
  asset_type: string;
  location_group: string;
  location_override: string | null;
  periods: string[] | null;
  active: boolean;
  qr_target: string | null;
}

/** Batas ukuran gambar QR yang diunggah; berkas QR PRIMA ±140 KB. */
export const MAX_QR_BYTES = 5_000_000;

const UNIQUE_VIOLATION = '23505';

export async function fetchAdminAssets(): Promise<AdminAsset[]> {
  const { data, error } = await supabase
    .from('prima_assets')
    .select('equipment_number,name,asset_type,location_group,location_override,periods,active,qr_target')
    .order('name', { ascending: true })
    .limit(2000);
  if (error) throw new Error('Daftar peralatan tidak dapat dimuat.');
  return ((data ?? []) as Row[]).map((r) => ({
    equipmentNumber: r.equipment_number,
    name: r.name,
    assetType: r.asset_type,
    locationGroup: r.location_group,
    locationOverride: r.location_override,
    periods: r.periods ?? [],
    active: r.active,
    qrTarget: r.qr_target,
  }));
}

/** Tab Preventive memakai daftar dan peta QR terbaru tanpa perlu memuat ulang aplikasi. */
const refreshPreventive = (): void => {
  resetPreventiveQrCodes();
  const store = usePreventiveStore.getState();
  // Belum pernah dibuka: tab Preventive memuat data terbaru sendiri saat dibuka.
  if (store.assets.length > 0) void store.refresh({ reloadAssets: true });
};

export async function saveAsset(valid: Extract<AssetValidation, { ok: true }>['row'], isNew: boolean): Promise<void> {
  const { equipment_number, ...fields } = valid;
  const { error } = isNew
    ? await supabase.from('prima_assets').insert(valid)
    : await supabase.from('prima_assets').update(fields).eq('equipment_number', equipment_number);
  if (error?.code === UNIQUE_VIOLATION) throw new Error(`Nomor equipment ${equipment_number} sudah ada di daftar.`);
  if (error) throw new Error(`Peralatan tidak dapat disimpan: ${error.message}`);
  refreshPreventive();
}

// ---- QR code ----

/** Isi QR dari sebuah gambar, atau null bila tidak ada QR yang terbaca. */
export async function decodeQrImage(image: Blob): Promise<string | null> {
  const [{ default: jsQR }, bitmap] = await Promise.all([import('jsqr'), createImageBitmap(image)]);
  // QR berukuran besar di label PRIMA; diperkecil agar decode cepat tanpa kehilangan modul QR.
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Peramban tidak dapat membaca gambar.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h);
  return code?.data.trim() || null;
}

const accessToken = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sesi login berakhir. Silakan login ulang di tab Data.');
  return token;
};

/**
 * Unggah/ganti gambar QR satu peralatan. Gambar ditolak bila tidak berisi QR atau isinya sudah dipakai
 * peralatan lain (dicek di sini dan dijamin UNIQUE di database). Mengembalikan isi QR yang disimpan.
 */
export async function uploadAssetQr(asset: AdminAsset, file: File, others: AdminAsset[]): Promise<string> {
  if (!/^image\/(png|jpeg)$/.test(file.type)) throw new Error('Gunakan gambar PNG atau JPG.');
  if (file.size > MAX_QR_BYTES) throw new Error('Gambar terlalu besar (maks 5 MB).');
  const target = await decodeQrImage(file);
  if (!target) throw new Error('Tidak ada QR code yang terbaca di gambar ini.');
  if (!/^https?:\/\/\S+$/.test(target)) throw new Error(`Isi QR bukan tautan: "${target.slice(0, 80)}".`);
  const owner = others.find((a) => a.qrTarget === target && a.equipmentNumber !== asset.equipmentNumber);
  if (owner) throw new Error(`QR ini sudah dipakai ${owner.name} (${owner.equipmentNumber}).`);

  const { getPreventiveQrUploadTicket } = await import('../server/preventive.functions.ts');
  const ticket = await getPreventiveQrUploadTicket({
    data: { accessToken: await accessToken(), equipmentNumber: asset.equipmentNumber },
  });
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', ticket.apiKey);
  form.append('timestamp', String(ticket.timestamp));
  form.append('signature', ticket.signature);
  form.append('public_id', ticket.publicId);
  form.append('asset_folder', ticket.assetFolder);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');
  const res = await fetch(ticket.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Gambar QR gagal diunggah ke Cloudinary (HTTP ${res.status}).`);

  const { error } = await supabase
    .from('prima_assets')
    .update({ qr_target: target })
    .eq('equipment_number', asset.equipmentNumber);
  if (error?.code === UNIQUE_VIOLATION) throw new Error('QR ini sudah dipakai peralatan lain.');
  if (error) throw new Error(`Gambar terunggah, tetapi isi QR gagal disimpan: ${error.message}`);
  refreshPreventive();
  return target;
}

export interface QrCheckResult extends QrCheckReport {
  /** Nomor equipment yang gagal diperbarui beserta alasannya. */
  failed: { equipmentNumber: string; reason: string }[];
}

/**
 * Decode semua gambar QR di Cloudinary, bandingkan dengan qr_target, lalu isi/perbarui yang berbeda.
 * QR ganda, tak terbaca, dan aset tanpa gambar hanya dilaporkan.
 */
export async function checkAllQr(assets: AdminAsset[], onProgress: (done: number, total: number) => void): Promise<QrCheckResult> {
  resetPreventiveQrCodes();
  const urls = await fetchPreventiveQrCodes();
  const decoded = new Map<string, string | null>();
  const withImage = assets.filter((a) => urls[a.equipmentNumber]);
  let done = 0;
  const queue = [...withImage];
  const worker = async () => {
    for (let a = queue.shift(); a; a = queue.shift()) {
      try {
        const res = await fetch(urls[a.equipmentNumber]);
        decoded.set(a.equipmentNumber, res.ok ? await decodeQrImage(await res.blob()) : null);
      } catch {
        decoded.set(a.equipmentNumber, null);
      }
      onProgress(++done, withImage.length);
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));

  const report = reconcileQr(
    assets.map((a) => ({
      equipmentNumber: a.equipmentNumber,
      name: a.name,
      stored: a.qrTarget,
      decoded: decoded.get(a.equipmentNumber) ?? null,
      hasImage: Boolean(urls[a.equipmentNumber]),
    })),
  );
  const failed: QrCheckResult['failed'] = [];
  for (const u of report.toUpdate) {
    const { error } = await supabase.from('prima_assets').update({ qr_target: u.qrTarget }).eq('equipment_number', u.equipmentNumber);
    if (error) failed.push({ equipmentNumber: u.equipmentNumber, reason: error.code === UNIQUE_VIOLATION ? 'QR sudah tercatat di peralatan lain' : error.message });
  }
  if (report.toUpdate.length > 0) refreshPreventive();
  return { ...report, failed };
}
