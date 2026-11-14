// src/lib/server/preventiveQr.server.ts
// Daftar QR code peralatan Preventive yang tersimpan di Cloudinary. HANYA dijalankan di server
// (memakai API secret untuk Search API); pembungkus createServerFn ada di preventive.functions.ts.
//
// Berkas QR ada di PRIMA/QR CODE/{TIPE}/{NO_EQUIPMENT}_{Nama}.png. Bagian nama tidak selalu sama dengan
// nama aset di prima_assets (mis. "Red_Lane_No_1_Arrival_F"), jadi pencocokan HANYA memakai nomor
// equipment di awal nama berkas, bukan nama yang ditebak dari data aset.

import { isValidEquipmentNumber } from '../utils/preventivePeriod.ts';

export const QR_ROOT_FOLDER = 'PRIMA/QR CODE';
/** Spasi pada nama folder di-escape karena ekspresi Search API Cloudinary bergaya Lucene. */
export const QR_SEARCH_EXPRESSION = 'public_id:PRIMA/QR\\ CODE/*';
const PAGE_SIZE = 500;
/** Pengaman bila next_cursor tidak pernah habis: 20 halaman × 500 = 10.000 berkas. */
const MAX_PAGES = 20;
const REQUEST_TIMEOUT_MS = 15_000;

export interface QrDeps {
  env: Record<string, string | undefined>;
  fetch: typeof fetch;
}

export class PreventiveQrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreventiveQrError';
  }
}

interface SearchResource {
  public_id?: string;
  secure_url?: string;
  created_at?: string;
}

interface SearchResponse {
  resources?: SearchResource[];
  next_cursor?: string;
}

const readConfig = (env: QrDeps['env']) => {
  const pick = (...names: string[]): string => {
    for (const n of names) {
      const v = env[n]?.trim();
      if (v) return v;
    }
    return '';
  };
  const cfg = {
    cloudName: pick('CLOUDINARY_CLOUD_NAME', 'VITE_CLOUDINARY_CLOUD_NAME'),
    apiKey: pick('CLOUDINARY_API_KEY'),
    apiSecret: pick('CLOUDINARY_API_SECRET'),
  };
  const missing = [
    ['CLOUDINARY_CLOUD_NAME', cfg.cloudName],
    ['CLOUDINARY_API_KEY', cfg.apiKey],
    ['CLOUDINARY_API_SECRET', cfg.apiSecret],
  ].filter(([, v]) => !v).map(([name]) => name);
  if (missing.length > 0) {
    // Hanya NAMA variabel yang disebut, tidak pernah nilainya.
    throw new PreventiveQrError(`Konfigurasi server belum lengkap: ${missing.join(', ')}.`);
  }
  return cfg;
};

/** Nomor equipment dari public_id "PRIMA/QR CODE/{TIPE}/{NO}_{Nama}", atau null bila bukan berkas QR peralatan. */
export const equipmentNumberFromQrPublicId = (publicId: string): string | null => {
  if (!publicId.startsWith(`${QR_ROOT_FOLDER}/`)) return null;
  const base = publicId.slice(publicId.lastIndexOf('/') + 1);
  const eq = base.split('_')[0];
  return isValidEquipmentNumber(eq) ? eq : null;
};

export interface QrResource {
  publicId: string;
  url: string;
  createdAt: string;
}

/**
 * Berkas QR per nomor equipment (https). Bila satu peralatan punya beberapa berkas QR,
 * yang terbaru (created_at) dipakai.
 */
export const listQrResources = async (deps: QrDeps): Promise<Map<string, QrResource>> => {
  const cfg = readConfig(deps.env);
  const basic = Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString('base64');
  const url = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/resources/search`;

  const best = new Map<string, QrResource>();
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    let res: Response;
    try {
      res = await deps.fetch(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression: QR_SEARCH_EXPRESSION,
          max_results: PAGE_SIZE,
          fields: ['public_id', 'secure_url', 'created_at'],
          ...(cursor ? { next_cursor: cursor } : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new PreventiveQrError('Cloudinary tidak dapat dijangkau. Coba lagi.');
    }
    if (!res.ok) throw new PreventiveQrError(`Daftar QR code tidak dapat dibaca (HTTP ${res.status}).`);
    const body = (await res.json()) as SearchResponse;

    for (const r of body.resources ?? []) {
      if (!r.public_id || !r.secure_url?.startsWith('https://')) continue;
      const eq = equipmentNumberFromQrPublicId(r.public_id);
      if (!eq) continue;
      const createdAt = r.created_at ?? '';
      const prev = best.get(eq);
      if (!prev || createdAt > prev.createdAt) best.set(eq, { publicId: r.public_id, url: r.secure_url, createdAt });
    }

    cursor = body.next_cursor || undefined;
    if (!cursor) break;
  }
  return best;
};

/** Peta nomor equipment → URL gambar QR (https). */
export const listPreventiveQrCodes = async (deps: QrDeps): Promise<Record<string, string>> =>
  Object.fromEntries([...(await listQrResources(deps))].map(([eq, v]) => [eq, v.url]));
