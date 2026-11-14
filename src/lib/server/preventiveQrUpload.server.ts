// src/lib/server/preventiveQrUpload.server.ts
// Tanda tangan unggah gambar QR code peralatan (tab Data > Peralatan Preventive). HANYA di server:
// memakai API secret Cloudinary dan service-role key Supabase. Wajib akun login.
//
// Satu berkas QR per peralatan: bila QR lama sudah ada, public_id-nya dipakai lagi (ditimpa), sehingga
// tidak ada dua berkas QR untuk nomor equipment yang sama. Bila belum ada: PRIMA/QR CODE/{TIPE}/{NO}_{Nama}.

import { requireLoggedIn } from './storagePurge.server.ts';
import { signCloudinaryParams } from './preventiveUpload.server.ts';
import { listQrResources, PreventiveQrError } from './preventiveQr.server.ts';
import type { QrDeps } from './preventiveQr.server.ts';
import { buildQrPublicId } from '../utils/preventiveAssetAdmin.ts';
import { isValidEquipmentNumber } from '../utils/preventivePeriod.ts';

export interface QrUploadDeps extends QrDeps {
  now: () => Date;
}

export interface QrUploadTicket {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  assetFolder: string;
}

const REQUEST_TIMEOUT_MS = 15_000;

const env = (deps: QrDeps, ...names: string[]): string => {
  for (const n of names) {
    const v = deps.env[n]?.trim();
    if (v) return v;
  }
  return '';
};

const loadAsset = async (deps: QrDeps, equipmentNumber: string): Promise<{ asset_type: string; name: string }> => {
  const base = env(deps, 'SUPABASE_URL', 'VITE_SUPABASE_URL').replace(/\/+$/, '');
  const key = env(deps, 'SUPABASE_SERVICE_ROLE_KEY');
  let res: Response;
  try {
    res = await deps.fetch(
      `${base}/rest/v1/prima_assets?equipment_number=eq.${encodeURIComponent(equipmentNumber)}&select=asset_type,name&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );
  } catch {
    throw new PreventiveQrError('Database tidak dapat dijangkau. Coba lagi.');
  }
  if (!res.ok) throw new PreventiveQrError('Daftar peralatan tidak dapat dibaca. Coba lagi.');
  const rows = (await res.json()) as { asset_type: string; name: string }[];
  if (!rows[0]) throw new PreventiveQrError('Peralatan belum ada di daftar. Simpan peralatannya dulu.');
  return rows[0];
};

export const createQrUploadTicket = async (
  input: { accessToken: unknown; equipmentNumber: unknown },
  deps: QrUploadDeps,
): Promise<QrUploadTicket> => {
  await requireLoggedIn(input.accessToken, deps);
  const eq = input.equipmentNumber;
  if (typeof eq !== 'string' || !isValidEquipmentNumber(eq)) throw new PreventiveQrError('Nomor equipment tidak valid.');

  const [asset, existing] = await Promise.all([loadAsset(deps, eq), listQrResources(deps)]);
  const publicId = existing.get(eq)?.publicId ?? buildQrPublicId(asset.asset_type, eq, asset.name);
  const assetFolder = publicId.slice(0, publicId.lastIndexOf('/'));
  const timestamp = Math.floor(deps.now().getTime() / 1000);
  const signature = signCloudinaryParams(
    { asset_folder: assetFolder, invalidate: true, overwrite: true, public_id: publicId, timestamp },
    env(deps, 'CLOUDINARY_API_SECRET'),
  );
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env(deps, 'CLOUDINARY_CLOUD_NAME', 'VITE_CLOUDINARY_CLOUD_NAME')}/image/upload`,
    apiKey: env(deps, 'CLOUDINARY_API_KEY'),
    timestamp,
    signature,
    publicId,
    assetFolder,
  };
};
