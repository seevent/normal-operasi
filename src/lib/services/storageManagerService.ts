// src/lib/services/storageManagerService.ts
// Panel Penyimpanan (tab Data): pemakaian, pratinjau rentang, arsip ZIP, pindah ke Sampah, pulihkan.
// Aturan (12 bulan, 7 hari, wajib login) ditegakkan di database; berkas ini hanya memanggilnya.
import { supabase } from '../supabaseClient';
import { archiveMediaName, buildReportCsv, type ArchiveReportRow } from '../utils/reportArchive';

export const REPORT_JENIS = ['Storing', 'Perbaikan', 'Kalibrasi', 'Kegiatan'] as const;

export interface StorageOverview {
  database_bytes: number;
  reports: number;
  reports_with_media: number;
  oldest_report: string | null;
  newest_report: string | null;
  per_bulan: Record<string, number>;
  retention_cutoff: string;
  trash_reports: number;
  storage_bytes: number;
  storage_objects: number;
}

/** Batas paket Free Supabase (organisasi SSES T2 memakai paket Free per 29 Okt 2026). */
export const SUPABASE_FREE_LIMITS = {
  databaseBytes: 500 * 1024 * 1024,
  storageBytes: 1024 * 1024 * 1024,
} as const;

export interface RangePreview {
  reports: number;
  per_jenis: Record<string, number>;
  per_bulan: Record<string, number>;
  media: number;
  media_shared: number;
  media_broken: number;
  retention_cutoff: string;
  retention_ok: boolean;
  oldest_report: string | null;
}

export interface CleanupJob {
  id: string;
  kind: 'rentang' | 'satuan';
  range_from: string | null;
  range_to: string | null;
  jenis: string[] | null;
  row_count: number;
  status: 'sampah' | 'dipulihkan' | 'mengosongkan' | 'sebagian' | 'dikosongkan';
  created_at: string;
  created_by_email: string | null;
  purge_after: string;
  purged_at: string | null;
  media_total: number | null;
  media_deleted: number | null;
  media_kept: number | null;
  media_missing: number | null;
  media_failed: number | null;
}

export type { CloudinaryUsageSummary as CloudinaryUsage } from '../server/storagePurge.server.ts';

const jenisParam = (jenis: string[]) => (jenis.length === 0 || jenis.length === REPORT_JENIS.length ? null : jenis);

const unwrap = <T>({ data, error }: { data: T | null; error: { message: string } | null }): T => {
  if (error) throw new Error(error.message);
  return data as T;
};

const accessToken = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sesi login berakhir. Silakan login ulang di tab Data.');
  return token;
};

export const fetchStorageOverview = async (): Promise<StorageOverview> =>
  unwrap(await supabase.rpc('report_storage_overview'));

export const fetchCloudinaryUsage = async () => {
  const { fetchCloudinaryUsage: call } = await import('../server/storageAdmin.functions.ts');
  return call({ data: { accessToken: await accessToken() } });
};

export const previewReportRange = async (from: string, to: string, jenis: string[]): Promise<RangePreview> =>
  unwrap(await supabase.rpc('preview_report_range', { p_from: from, p_to: to, p_jenis: jenisParam(jenis) }));

export const trashReportRange = async (from: string, to: string, jenis: string[]): Promise<string> =>
  unwrap(await supabase.rpc('trash_report_range', { p_from: from, p_to: to, p_jenis: jenisParam(jenis) }));

export const restoreTrashJob = async (jobId: string): Promise<number> =>
  unwrap(await supabase.rpc('restore_trash_job', { p_job: jobId }));

export const fetchCleanupJobs = async (): Promise<CleanupJob[]> =>
  unwrap(
    await supabase
      .from('storage_cleanup_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),
  );

/** Jalankan pengosongan untuk job yang sudah 7 hari (cadangan bila jadwal harian terlewat). */
export const runDueTrashPurgeNow = async () => {
  const { runDueTrashPurge } = await import('../server/storageAdmin.functions.ts');
  return runDueTrashPurge({ data: { accessToken: await accessToken() } });
};

/** Hapus satuan dari menu Report: tanpa login, masuk Sampah 7 hari. */
export const trashReportRows = async (ids: string[]): Promise<string> =>
  unwrap(await supabase.rpc('trash_report_rows', { p_ids: ids }));

const PAGE = 1000;

const fetchRangeRows = async (from: string, to: string, jenis: string[]): Promise<ArchiveReportRow[]> => {
  const rows: ArchiveReportRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    let query = supabase
      .from('laporan_operasional')
      .select('*')
      .gte('tanggal', from)
      .lte('tanggal', to)
      .order('tanggal')
      .order('id')
      .range(offset, offset + PAGE - 1);
    const filter = jenisParam(jenis);
    if (filter) query = query.in('jenis', filter);
    const page = unwrap(await query) as ArchiveReportRow[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
};

export interface ArchiveProgress {
  done: number;
  total: number;
}

/**
 * Arsip ZIP rentang: laporan.csv, laporan.json, dan semua foto/video asli di folder media/.
 * Berkas yang tidak bisa diunduh dicatat di media_gagal.txt (mis. tautan Supabase Storage yang sudah rusak).
 */
export const buildRangeArchive = async (
  from: string,
  to: string,
  jenis: string[],
  onProgress: (p: ArchiveProgress) => void,
): Promise<{ file: File; reports: number; media: number; failed: number }> => {
  const rows = await fetchRangeRows(from, to, jenis);
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('laporan.csv', buildReportCsv(rows));
  zip.file('laporan.json', JSON.stringify(rows, null, 2));

  const media = rows.flatMap((row) => (row.foto_urls ?? []).map((url, i) => ({ url, name: archiveMediaName(row, i, url) })));
  const failed: string[] = [];
  let done = 0;
  onProgress({ done, total: media.length });
  for (const item of media) {
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Media sudah terkompresi; STORE menghemat waktu dan memori di ponsel.
      zip.file(item.name, await res.blob(), { compression: 'STORE' });
    } catch (err) {
      failed.push(`${item.name}\t${item.url}\t${(err as Error).message}`);
    }
    done += 1;
    onProgress({ done, total: media.length });
  }
  if (failed.length > 0) zip.file('media_gagal.txt', failed.join('\n'));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const name = `Arsip_Laporan_${from}_sd_${to}.zip`;
  return { file: new File([blob], name, { type: 'application/zip' }), reports: rows.length, media: media.length, failed: failed.length };
};
