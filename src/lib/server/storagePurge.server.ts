// src/lib/server/storagePurge.server.ts
// Pengosongan Sampah laporan. HANYA dijalankan di server (memegang API secret Cloudinary dan service-role
// key Supabase). Tidak mengimpor React/TanStack agar bisa diuji dengan `fetch` palsu; pemanggilnya fungsi
// terjadwal Netlify (netlify/functions/purge-trash.mts) dan server function storageAdmin.functions.ts.
//
// Per job yang sudah 7 hari di Sampah:
//   1) RPC begin_purge_job : hapus permanen baris laporan, kembalikan URL foto/video yang tidak dipakai
//                            laporan lain (dicek di database).
//   2) Hapus berkas di Cloudinary (Admin API, ≤ 100 public_id per panggilan) dan Supabase Storage.
//   3) RPC finish_purge_job: catat hasil per berkas; job "sebagian" bila ada yang gagal, dan dicoba lagi
//                            pada pengosongan berikutnya.

import { mediaRefFromUrl } from '../utils/mediaRefs.ts';

export interface PurgeDeps {
  env: Record<string, string | undefined>;
  fetch: typeof fetch;
  now: () => Date;
}

export type ItemStatus = 'dihapus' | 'tidak_ada' | 'gagal' | 'dilewati';

export interface ItemResult {
  url: string;
  status: ItemStatus;
  error: string | null;
}

export interface JobSummary {
  jobId: string;
  status: string;
  deleted: number;
  missing: number;
  failed: number;
  skipped: number;
}

export class StoragePurgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoragePurgeError';
  }
}

const REQUEST_TIMEOUT_MS = 20_000;
/** Batas Admin API Cloudinary untuk satu panggilan hapus. */
export const CLOUDINARY_DELETE_BATCH = 100;

interface Config {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  supabaseUrl: string;
  serviceKey: string;
}

const readConfig = (env: PurgeDeps['env']): Config => {
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
  // Hanya NAMA variabel yang disebut, tidak pernah nilainya.
  if (missing.length > 0) throw new StoragePurgeError(`Konfigurasi server belum lengkap: ${missing.join(', ')}.`);
  return cfg;
};

const call = (deps: PurgeDeps, url: string, init: RequestInit = {}): Promise<Response> =>
  deps.fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

const supabaseHeaders = (cfg: Config): Record<string, string> => ({
  apikey: cfg.serviceKey,
  Authorization: `Bearer ${cfg.serviceKey}`,
  'Content-Type': 'application/json',
});

const rpc = async <T>(deps: PurgeDeps, cfg: Config, name: string, body: unknown): Promise<T> => {
  const res = await call(deps, `${cfg.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: supabaseHeaders(cfg),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new StoragePurgeError(`Database menolak ${name} (HTTP ${res.status}).`);
  return (await res.json()) as T;
};

/** Hapus satu kelompok public_id Cloudinary (satu jenis sumber daya, ≤ 100). */
const deleteCloudinaryBatch = async (
  deps: PurgeDeps,
  cfg: Config,
  resourceType: string,
  items: { url: string; publicId: string }[],
): Promise<ItemResult[]> => {
  const query = items.map((i) => `public_ids[]=${encodeURIComponent(i.publicId)}`).join('&');
  const basic = Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString('base64');
  try {
    const res = await call(
      deps,
      `https://api.cloudinary.com/v1_1/${cfg.cloudName}/resources/${resourceType}/upload?${query}&invalidate=true`,
      { method: 'DELETE', headers: { Authorization: `Basic ${basic}` } },
    );
    if (!res.ok) {
      return items.map((i) => ({ url: i.url, status: 'gagal' as const, error: `Cloudinary HTTP ${res.status}` }));
    }
    const data = (await res.json()) as { deleted?: Record<string, string> };
    return items.map((i) => {
      const outcome = data.deleted?.[i.publicId];
      if (outcome === 'deleted') return { url: i.url, status: 'dihapus' as const, error: null };
      if (outcome === 'not_found') return { url: i.url, status: 'tidak_ada' as const, error: null };
      return { url: i.url, status: 'gagal' as const, error: `Cloudinary: ${outcome ?? 'tanpa jawaban'}` };
    });
  } catch {
    return items.map((i) => ({ url: i.url, status: 'gagal' as const, error: 'Cloudinary tidak dapat dijangkau' }));
  }
};

/** Hapus berkas di satu bucket Supabase Storage. Berkas yang tidak dikembalikan sebagai terhapus = tidak ada. */
const deleteStorageBatch = async (
  deps: PurgeDeps,
  cfg: Config,
  bucket: string,
  items: { url: string; path: string }[],
): Promise<ItemResult[]> => {
  try {
    const res = await call(deps, `${cfg.supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: 'DELETE',
      headers: supabaseHeaders(cfg),
      body: JSON.stringify({ prefixes: items.map((i) => i.path) }),
    });
    if (!res.ok) {
      return items.map((i) => ({ url: i.url, status: 'gagal' as const, error: `Storage HTTP ${res.status}` }));
    }
    const removed = new Set(((await res.json()) as { name?: string }[]).map((o) => o.name));
    return items.map((i) => ({
      url: i.url,
      status: removed.has(i.path) ? ('dihapus' as const) : ('tidak_ada' as const),
      error: null,
    }));
  } catch {
    return items.map((i) => ({ url: i.url, status: 'gagal' as const, error: 'Storage tidak dapat dijangkau' }));
  }
};

const chunk = <T>(list: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

/**
 * Menghapus berkas di balik setiap URL. Hanya berkas milik akun Cloudinary dan proyek Supabase ini yang
 * disentuh; URL lain dilewati.
 */
const deleteMediaUrls = async (deps: PurgeDeps, cfg: Config, urls: string[]): Promise<ItemResult[]> => {
  const results: ItemResult[] = [];
  const cloudinary = new Map<string, { url: string; publicId: string }[]>();
  const storage = new Map<string, { url: string; path: string }[]>();
  const supabaseOrigin = new URL(cfg.supabaseUrl).origin;

  for (const url of urls) {
    const ref = mediaRefFromUrl(url);
    if (ref.provider === 'cloudinary' && ref.cloudName === cfg.cloudName) {
      const list = cloudinary.get(ref.resourceType) ?? [];
      list.push({ url, publicId: ref.publicId });
      cloudinary.set(ref.resourceType, list);
    } else if (ref.provider === 'supabase' && ref.origin === supabaseOrigin) {
      const list = storage.get(ref.bucket) ?? [];
      list.push({ url, path: ref.path });
      storage.set(ref.bucket, list);
    } else {
      results.push({ url, status: 'dilewati', error: 'Bukan berkas Cloudinary/Supabase milik aplikasi ini' });
    }
  }

  for (const [resourceType, items] of cloudinary) {
    for (const batch of chunk(items, CLOUDINARY_DELETE_BATCH)) {
      results.push(...(await deleteCloudinaryBatch(deps, cfg, resourceType, batch)));
    }
  }
  for (const [bucket, items] of storage) {
    for (const batch of chunk(items, CLOUDINARY_DELETE_BATCH)) {
      results.push(...(await deleteStorageBatch(deps, cfg, bucket, batch)));
    }
  }
  return results;
};

const summarize = (jobId: string, status: string, results: ItemResult[]): JobSummary => ({
  jobId,
  status,
  deleted: results.filter((r) => r.status === 'dihapus').length,
  missing: results.filter((r) => r.status === 'tidak_ada').length,
  failed: results.filter((r) => r.status === 'gagal').length,
  skipped: results.filter((r) => r.status === 'dilewati').length,
});

/** Kosongkan satu job: hapus permanen barisnya, lalu berkas yang tidak dipakai laporan lain. */
export const purgeJob = async (jobId: string, deps: PurgeDeps): Promise<JobSummary> => {
  const cfg = readConfig(deps.env);
  const rows = await rpc<{ url: string }[]>(deps, cfg, 'begin_purge_job', { p_job: jobId });
  const results = await deleteMediaUrls(deps, cfg, rows.map((r) => r.url));
  const status = await rpc<string>(deps, cfg, 'finish_purge_job', { p_job: jobId, p_results: results });
  return summarize(jobId, status, results);
};

/** Kosongkan semua job yang sudah 7 hari di Sampah, serta job yang sebelumnya terputus atau sebagian gagal. */
export const purgeDueTrash = async (deps: PurgeDeps): Promise<JobSummary[]> => {
  const cfg = readConfig(deps.env);
  const nowIso = deps.now().toISOString();
  const res = await call(
    deps,
    `${cfg.supabaseUrl}/rest/v1/storage_cleanup_jobs?select=id` +
      `&or=(and(status.eq.sampah,purge_after.lte.${encodeURIComponent(nowIso)}),status.eq.mengosongkan,status.eq.sebagian)` +
      `&order=purge_after.asc`,
    { headers: supabaseHeaders(cfg) },
  );
  if (!res.ok) throw new StoragePurgeError(`Daftar Sampah tidak dapat dibaca (HTTP ${res.status}).`);
  const jobs = (await res.json()) as { id: string }[];

  const summaries: JobSummary[] = [];
  for (const job of jobs) {
    try {
      summaries.push(await purgeJob(job.id, deps));
    } catch (err) {
      // Satu job gagal tidak boleh menghentikan job lain; dicoba lagi pada jadwal berikutnya.
      summaries.push({ jobId: job.id, status: `galat: ${(err as Error).message}`, deleted: 0, missing: 0, failed: 0, skipped: 0 });
    }
  }
  return summaries;
};

/** Pastikan token berasal dari akun yang login (Supabase Auth). Mengembalikan email akun. */
export const requireLoggedIn = async (accessToken: unknown, deps: PurgeDeps): Promise<string> => {
  if (typeof accessToken !== 'string' || accessToken.length < 20) throw new StoragePurgeError('Harus login.');
  const cfg = readConfig(deps.env);
  const res = await call(deps, `${cfg.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new StoragePurgeError('Harus login.');
  const user = (await res.json()) as { email?: string; id?: string };
  if (!user.id) throw new StoragePurgeError('Harus login.');
  return user.email ?? user.id;
};

interface CloudinaryUsage {
  plan?: string;
  last_updated?: string;
  credits?: { usage?: number; limit?: number };
  storage?: { usage?: number };
  bandwidth?: { usage?: number };
  transformations?: { usage?: number };
  resources?: number;
  media_limits?: { video_max_size_bytes?: number };
}

/** Pemakaian Cloudinary (kredit, penyimpanan, bandwidth, transformasi) untuk panel Penyimpanan. */
export const getCloudinaryUsage = async (deps: PurgeDeps): Promise<Record<string, unknown>> => {
  const cfg = readConfig(deps.env);
  const basic = Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString('base64');
  const res = await call(deps, `https://api.cloudinary.com/v1_1/${cfg.cloudName}/usage`, {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) throw new StoragePurgeError(`Pemakaian Cloudinary tidak dapat dibaca (HTTP ${res.status}).`);
  const u = (await res.json()) as CloudinaryUsage;
  return {
    plan: u.plan,
    lastUpdated: u.last_updated,
    creditsUsed: u.credits?.usage ?? null,
    creditsLimit: u.credits?.limit ?? null,
    storageBytes: u.storage?.usage ?? null,
    bandwidthBytes: u.bandwidth?.usage ?? null,
    transformations: u.transformations?.usage ?? null,
    resources: u.resources ?? null,
    videoMaxBytes: u.media_limits?.video_max_size_bytes ?? null,
  };
};
