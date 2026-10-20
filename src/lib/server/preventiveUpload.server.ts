// src/lib/server/preventiveUpload.server.ts
// Logika sisi server untuk unggah foto Preventive. HANYA dijalankan di server (memegang API secret
// Cloudinary dan service-role key Supabase). Tidak mengimpor React/TanStack agar bisa diuji dengan
// `fetch` palsu; pembungkus createServerFn ada di preventive.functions.ts.
//
// Alur dua langkah, tanpa fallback:
//   1) createUploadTicket : validasi aset + periode, hitung public_id, tanda tangani parameter unggah.
//   2) confirmUpload      : setelah browser mengunggah langsung ke Cloudinary, verifikasi fotonya benar-benar
//                           ada (Admin API), lalu catat log lewat RPC record_preventive_photo.
// Status "tersimpan" di UI hanya berasal dari hasil langkah 2.

import { createHash } from 'node:crypto';
import { PERIOD_CODE, PREVENTIVE_PERIODS } from '../data/preventiveTypes.ts';
import type { ConfirmResult, PreventivePeriod, UploadTicket } from '../data/preventiveTypes.ts';
import { buildFolder, buildPublicId, isValidEquipmentNumber, periodKey } from '../utils/preventivePeriod.ts';

export type PreventiveErrorCode =
  | 'bad_request'
  | 'config'
  | 'not_found'
  | 'not_scheduled'
  | 'upstream'
  | 'verify_failed'
  | 'record_failed';

export class PreventiveServerError extends Error {
  readonly code: PreventiveErrorCode;
  constructor(code: PreventiveErrorCode, message: string) {
    super(message);
    this.name = 'PreventiveServerError';
    this.code = code;
  }
}

export interface ServerDeps {
  env: Record<string, string | undefined>;
  fetch: typeof fetch;
  now: () => Date;
}

/** Foto dianggap unggahan baru bila versinya (detik epoch) berselisih paling banyak 15 menit dari sekarang. */
export const MAX_VERSION_SKEW_SECONDS = 900;
const REQUEST_TIMEOUT_MS = 15_000;

type SignParams = Record<string, string | number | boolean>;

/**
 * Tanda tangan unggah Cloudinary: SHA-1 dari "k=v&k=v" (kunci terurut) + API secret.
 * Dicocokkan dengan dua contoh resmi di dokumentasi Cloudinary pada tes.
 */
export const signCloudinaryParams = (params: SignParams, apiSecret: string): string => {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
};

interface Config {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  supabaseUrl: string;
  serviceKey: string;
}

const readConfig = (env: ServerDeps['env']): Config => {
  const pick = (...names: string[]): string => {
    for (const n of names) {
      const v = env[n]?.trim();
      if (v) return v;
    }
    return '';
  };
  const cfg: Config = {
    cloudName: pick('CLOUDINARY_CLOUD_NAME', 'VITE_CLOUDINARY_CLOUD_NAME'),
    apiKey: pick('CLOUDINARY_API_KEY'),
    apiSecret: pick('CLOUDINARY_API_SECRET'),
    supabaseUrl: pick('SUPABASE_URL', 'VITE_SUPABASE_URL').replace(/\/+$/, ''),
    serviceKey: pick('SUPABASE_SERVICE_ROLE_KEY'),
  };
  const labels: Array<[keyof Config, string]> = [
    ['cloudName', 'CLOUDINARY_CLOUD_NAME'],
    ['apiKey', 'CLOUDINARY_API_KEY'],
    ['apiSecret', 'CLOUDINARY_API_SECRET'],
    ['supabaseUrl', 'SUPABASE_URL'],
    ['serviceKey', 'SUPABASE_SERVICE_ROLE_KEY'],
  ];
  const missing = labels.filter(([k]) => !cfg[k]).map(([, name]) => name);
  if (missing.length > 0) {
    // Hanya NAMA variabel yang disebut, tidak pernah nilainya.
    throw new PreventiveServerError('config', `Konfigurasi server belum lengkap: ${missing.join(', ')}.`);
  }
  return cfg;
};

const validateInput = (period: unknown, equipmentNumber: unknown): { period: PreventivePeriod; equipmentNumber: string } => {
  if (typeof period !== 'string' || !(PREVENTIVE_PERIODS as readonly string[]).includes(period)) {
    throw new PreventiveServerError('bad_request', 'Periode tidak valid.');
  }
  if (typeof equipmentNumber !== 'string' || !isValidEquipmentNumber(equipmentNumber)) {
    throw new PreventiveServerError('bad_request', 'Nomor equipment tidak valid.');
  }
  return { period: period as PreventivePeriod, equipmentNumber };
};

const callUpstream = async (deps: ServerDeps, url: string, init: RequestInit, what: string): Promise<Response> => {
  try {
    return await deps.fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new PreventiveServerError('upstream', `${what} tidak dapat dijangkau. Coba lagi.`);
  }
};

const supabaseHeaders = (serviceKey: string): Record<string, string> => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
});

interface AssetRow {
  asset_type: string;
  periods: string[];
  active: boolean;
}

/** Aset harus ada di daftar PRIMA (tabel prima_assets), aktif, dan terjadwal pada periode ini. */
const loadAsset = async (deps: ServerDeps, cfg: Config, period: PreventivePeriod, equipmentNumber: string): Promise<string> => {
  const url =
    `${cfg.supabaseUrl}/rest/v1/prima_assets` +
    `?equipment_number=eq.${encodeURIComponent(equipmentNumber)}&select=asset_type,periods,active&limit=1`;
  const res = await callUpstream(deps, url, { headers: supabaseHeaders(cfg.serviceKey) }, 'Database');
  if (!res.ok) throw new PreventiveServerError('upstream', 'Daftar peralatan tidak dapat dibaca. Coba lagi.');
  let rows: unknown;
  try {
    rows = await res.json();
  } catch {
    throw new PreventiveServerError('upstream', 'Balasan database tidak dapat dibaca.');
  }
  const row = Array.isArray(rows) ? (rows[0] as AssetRow | undefined) : undefined;
  if (!row || row.active !== true) {
    throw new PreventiveServerError('not_found', 'Peralatan tidak ada di daftar PRIMA atau sudah nonaktif.');
  }
  if (!Array.isArray(row.periods) || !row.periods.includes(PERIOD_CODE[period])) {
    throw new PreventiveServerError('not_scheduled', 'Peralatan ini tidak terjadwal pada periode tersebut di PRIMA.');
  }
  return row.asset_type;
};

export const createUploadTicket = async (
  input: { period: unknown; equipmentNumber: unknown },
  deps: ServerDeps,
): Promise<UploadTicket> => {
  const { period, equipmentNumber } = validateInput(input.period, input.equipmentNumber);
  const cfg = readConfig(deps.env);
  const assetType = await loadAsset(deps, cfg, period, equipmentNumber);

  const now = deps.now();
  const key = periodKey(period, now);
  const publicId = buildPublicId(period, assetType, equipmentNumber, key);
  const assetFolder = buildFolder(period, assetType);
  const timestamp = Math.floor(now.getTime() / 1000);

  const signature = signCloudinaryParams(
    { asset_folder: assetFolder, invalidate: true, overwrite: true, public_id: publicId, timestamp },
    cfg.apiSecret,
  );

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`,
    cloudName: cfg.cloudName,
    apiKey: cfg.apiKey,
    timestamp,
    signature,
    publicId,
    assetFolder,
    periodKey: key,
    overwrite: true,
    invalidate: true,
  };
};

interface CloudinaryResource {
  public_id?: unknown;
  version?: unknown;
  asset_folder?: unknown;
  secure_url?: unknown;
}

export const confirmUpload = async (
  input: { period: unknown; equipmentNumber: unknown; version: unknown },
  deps: ServerDeps,
): Promise<ConfirmResult> => {
  const { period, equipmentNumber } = validateInput(input.period, input.equipmentNumber);
  const version = input.version;
  if (typeof version !== 'number' || !Number.isSafeInteger(version) || version <= 0) {
    throw new PreventiveServerError('bad_request', 'Versi foto tidak valid.');
  }
  const cfg = readConfig(deps.env);
  const assetType = await loadAsset(deps, cfg, period, equipmentNumber);

  // Kunci periode dihitung ulang di server. Bila periode berganti antara unggah dan konfirmasi,
  // public_id yang dicari tidak ada -> foto tidak pernah salah dicatat ke periode baru.
  const now = deps.now();
  const key = periodKey(period, now);
  const publicId = buildPublicId(period, assetType, equipmentNumber, key);
  const assetFolder = buildFolder(period, assetType);

  const encodedPath = publicId.split('/').map(encodeURIComponent).join('/');
  const basic = Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString('base64');
  const res = await callUpstream(
    deps,
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/resources/image/upload/${encodedPath}`,
    { headers: { Authorization: `Basic ${basic}` } },
    'Cloudinary',
  );
  if (res.status === 404) {
    throw new PreventiveServerError('verify_failed', 'Foto belum ditemukan di Cloudinary. Coba unggah ulang.');
  }
  if (!res.ok) throw new PreventiveServerError('upstream', 'Cloudinary tidak dapat memverifikasi foto. Coba lagi.');

  let resource: CloudinaryResource;
  try {
    resource = (await res.json()) as CloudinaryResource;
  } catch {
    throw new PreventiveServerError('upstream', 'Balasan Cloudinary tidak dapat dibaca.');
  }

  const nowSeconds = Math.floor(now.getTime() / 1000);
  const verified =
    resource.public_id === publicId &&
    resource.asset_folder === assetFolder &&
    resource.version === version &&
    Math.abs(nowSeconds - version) <= MAX_VERSION_SKEW_SECONDS &&
    typeof resource.secure_url === 'string';
  if (!verified) {
    throw new PreventiveServerError('verify_failed', 'Foto di Cloudinary tidak cocok dengan unggahan ini. Coba unggah ulang.');
  }
  const secureUrl = resource.secure_url as string;

  // URL yang dicatat selalu berasal dari Cloudinary, bukan dari klien.
  const rpc = await callUpstream(
    deps,
    `${cfg.supabaseUrl}/rest/v1/rpc/record_preventive_photo`,
    {
      method: 'POST',
      headers: { ...supabaseHeaders(cfg.serviceKey), 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_period: period, p_equipment: equipmentNumber, p_version: version, p_secure_url: secureUrl }),
    },
    'Database',
  );
  if (!rpc.ok) {
    throw new PreventiveServerError('record_failed', 'Foto terunggah tetapi gagal dicatat. Coba lagi.');
  }

  return { ok: true, periodKey: key, version, secureUrl };
};
