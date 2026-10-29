import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Archive, Cloud, Database, Eye, Loader2, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { triggerFileDownload } from '../../../lib/services/shareService';
import {
  REPORT_JENIS,
  buildRangeArchive,
  fetchCleanupJobs,
  fetchCloudinaryUsage,
  fetchStorageOverview,
  previewReportRange,
  restoreTrashJob,
  runDueTrashPurgeNow,
  trashReportRange,
  type ArchiveProgress,
  type CleanupJob,
  type CloudinaryUsage,
  type RangePreview,
  type StorageOverview,
} from '../../../lib/services/storageManagerService';

const mb = (bytes: number | null | undefined) => (bytes == null ? '-' : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
const tgl = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const STATUS_LABEL: Record<CleanupJob['status'], { text: string; tone: string }> = {
  sampah: { text: 'Di Sampah', tone: 'bg-amber-100 text-amber-800' },
  dipulihkan: { text: 'Dipulihkan', tone: 'bg-emerald-100 text-emerald-800' },
  mengosongkan: { text: 'Sedang dikosongkan', tone: 'bg-sky-100 text-sky-800' },
  sebagian: { text: 'Sebagian gagal, dicoba lagi', tone: 'bg-rose-100 text-rose-800' },
  dikosongkan: { text: 'Dihapus permanen', tone: 'bg-slate-200 text-slate-700' },
};

const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-3">
      {icon} {title}
    </h3>
    {children}
  </div>
);

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="bg-slate-50 rounded-lg px-3 py-2">
    <div className="text-[11px] text-slate-500">{label}</div>
    <div className="text-sm font-bold text-slate-800">{value}</div>
  </div>
);

export const StorageManagerPanel: React.FC = () => {
  const [overview, setOverview] = useState<StorageOverview | null>(null);
  const [usage, setUsage] = useState<CloudinaryUsage | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<CleanupJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [jenis, setJenis] = useState<string[]>([...REPORT_JENIS]);
  const [preview, setPreview] = useState<RangePreview | null>(null);
  const [busy, setBusy] = useState<'preview' | 'archive' | 'trash' | 'restore' | 'purge' | null>(null);
  const [archiveProgress, setArchiveProgress] = useState<ArchiveProgress | null>(null);
  const [archivedKey, setArchivedKey] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const rangeKey = `${from}|${to}|${[...jenis].sort().join(',')}`;

  const refresh = useCallback(async () => {
    try {
      const [o, j] = await Promise.all([fetchStorageOverview(), fetchCleanupJobs()]);
      setOverview(o);
      setJobs(j);
    } catch (err) {
      setError((err as Error).message);
    }
    fetchCloudinaryUsage()
      .then((u) => {
        setUsage(u);
        setUsageError(null);
      })
      .catch((err) => setUsageError((err as Error).message));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Pratinjau dan arsip hanya berlaku untuk rentang yang sama persis.
  useEffect(() => {
    setPreview(null);
    setConfirmText('');
  }, [rangeKey]);

  const run = async <T,>(kind: NonNullable<typeof busy>, fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      return await fn();
    } catch (err) {
      setError((err as Error).message);
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  const handlePreview = () => run('preview', async () => setPreview(await previewReportRange(from, to, jenis)));

  const handleArchive = () =>
    run('archive', async () => {
      const result = await buildRangeArchive(from, to, jenis, setArchiveProgress);
      triggerFileDownload(result.file);
      setArchivedKey(rangeKey);
      setNotice(
        `Arsip ${result.file.name} diunduh: ${result.reports} laporan, ${result.media - result.failed} dari ${result.media} foto/video` +
          (result.failed > 0 ? ` (${result.failed} gagal diunduh, lihat media_gagal.txt di dalam ZIP).` : '.'),
      );
    }).finally(() => setArchiveProgress(null));

  const handleTrash = () =>
    run('trash', async () => {
      await trashReportRange(from, to, jenis);
      setNotice(`${preview?.reports ?? 0} laporan dipindah ke Sampah. Dihapus permanen beserta foto/videonya 7 hari lagi; sebelum itu bisa dipulihkan.`);
      setPreview(null);
      setConfirmText('');
      setArchivedKey(null);
      await refresh();
    });

  const handleRestore = (job: CleanupJob) =>
    run('restore', async () => {
      const n = await restoreTrashJob(job.id);
      setNotice(`${n} laporan dipulihkan.`);
      await refresh();
    });

  const handlePurgeDue = () =>
    run('purge', async () => {
      const out = await runDueTrashPurgeNow();
      setNotice(out.length === 0 ? 'Tidak ada Sampah yang sudah 7 hari.' : `${out.length} job Sampah dikosongkan.`);
      await refresh();
    });

  const cutoff = overview?.retention_cutoff ?? preview?.retention_cutoff ?? '';
  const expectedConfirm = preview ? `HAPUS ${preview.reports}` : '';
  const canTrash =
    !!preview && preview.retention_ok && preview.reports > 0 && archivedKey === rangeKey && confirmText.trim() === expectedConfirm && !busy;
  const creditPct = usage?.creditsUsed != null && usage.creditsLimit ? (usage.creditsUsed / usage.creditsLimit) * 100 : null;

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-sm flex gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {notice && <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm">{notice}</div>}

      <Card title="Pemakaian" icon={<Cloud className="w-4 h-4 text-sky-600" />}>
        {usage ? (
          <>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Kredit Cloudinary bulan ini ({usage.plan})</span>
                <span className="font-bold">
                  {usage.creditsUsed?.toFixed(2)} / {usage.creditsLimit}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${creditPct != null && creditPct >= 90 ? 'bg-rose-500' : creditPct != null && creditPct >= 70 ? 'bg-amber-500' : 'bg-sky-500'}`}
                  style={{ width: `${Math.min(100, creditPct ?? 0)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Angka Cloudinary diperbarui harian (terakhir {tgl(usage.lastUpdated)}).</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Penyimpanan" value={mb(usage.storageBytes)} />
              <Stat label="Bandwidth" value={mb(usage.bandwidthBytes)} />
              <Stat label="Transformasi" value={usage.transformations ?? '-'} />
              <Stat label="Jumlah berkas" value={usage.resources ?? '-'} />
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500">{usageError ? `Pemakaian Cloudinary tidak dapat dibaca: ${usageError}` : 'Memuat pemakaian Cloudinary…'}</p>
        )}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <Stat label="Database" value={mb(overview.database_bytes)} />
            <Stat label="Laporan" value={overview.reports} />
            <Stat label="Laporan tertua" value={tgl(overview.oldest_report)} />
            <Stat label="Di Sampah" value={overview.trash_reports} />
          </div>
        )}
      </Card>

      <Card title="Hapus laporan per rentang tanggal" icon={<Database className="w-4 h-4 text-indigo-600" />}>
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          Laporan disimpan minimal <strong>12 bulan</strong>. Yang boleh dihapus: laporan bertanggal sampai{' '}
          <strong>{tgl(cutoff)}</strong>. Laporan yang dihapus masuk <strong>Sampah 7 hari</strong> (bisa dipulihkan), lalu dihapus
          permanen beserta foto/videonya di Cloudinary dan Supabase Storage. Foto yang juga dipakai laporan lain tidak ikut dihapus.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-bold text-slate-700">
            Dari tanggal
            <input type="date" value={from} max={cutoff || undefined} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full px-3 py-2 text-base border border-slate-300 rounded-lg" />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Sampai tanggal
            <input type="date" value={to} max={cutoff || undefined} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full px-3 py-2 text-base border border-slate-300 rounded-lg" />
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {REPORT_JENIS.map((j) => (
            <label key={j} className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg border border-slate-200 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={jenis.includes(j)}
                onChange={(e) => setJenis((prev) => (e.target.checked ? [...prev, j] : prev.filter((x) => x !== j)))}
              />
              {j}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={handlePreview}
          disabled={!from || !to || jenis.length === 0 || !!busy}
          className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold disabled:opacity-50"
        >
          {busy === 'preview' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Pratinjau
        </button>

        {preview && (
          <div className="mt-4 border-t border-slate-200 pt-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Laporan" value={preview.reports} />
              <Stat label="Foto/video" value={preview.media} />
              <Stat label="Dipakai laporan lain (disimpan)" value={preview.media_shared} />
              <Stat label="Tautan sudah rusak" value={preview.media_broken} />
            </div>
            <p className="text-xs text-slate-600">
              Per jenis: {Object.entries(preview.per_jenis).map(([k, v]) => `${k} ${v}`).join(' · ') || '-'}
              <br />
              Per bulan: {Object.entries(preview.per_bulan).sort().map(([k, v]) => `${k}: ${v}`).join(' · ') || '-'}
            </p>

            {!preview.retention_ok ? (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                Rentang ini menyentuh laporan yang belum berumur 12 bulan. Ubah tanggal akhir menjadi paling lambat {tgl(preview.retention_cutoff)}.
              </div>
            ) : preview.reports === 0 ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm">Tidak ada laporan pada rentang ini.</div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={!!busy}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {busy === 'archive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  {busy === 'archive' && archiveProgress
                    ? `Mengunduh media ${archiveProgress.done}/${archiveProgress.total}…`
                    : archivedKey === rangeKey
                      ? 'Arsip sudah diunduh ✓ (unduh lagi)'
                      : '1. Unduh arsip (ZIP: CSV, JSON, foto/video)'}
                </button>
                <label className="block text-xs font-bold text-slate-700">
                  2. Ketik <span className="font-mono bg-slate-100 px-1 rounded">{expectedConfirm}</span> untuk konfirmasi
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={archivedKey !== rangeKey}
                    placeholder={archivedKey === rangeKey ? expectedConfirm : 'Unduh arsip dulu'}
                    className="mt-1 w-full px-3 py-2 text-base border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleTrash}
                  disabled={!canTrash}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {busy === 'trash' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} 3. Pindahkan {preview.reports} laporan ke Sampah
                </button>
              </>
            )}
          </div>
        )}
      </Card>

      <Card title="Sampah & riwayat penghapusan" icon={<Trash2 className="w-4 h-4 text-rose-600" />}>
        <div className="flex flex-wrap gap-2 mb-3">
          <button type="button" onClick={() => refresh()} className="flex items-center gap-2 px-3 py-2 min-h-[44px] border border-slate-300 rounded-lg text-sm">
            <RefreshCw className="w-4 h-4" /> Muat ulang
          </button>
          <button
            type="button"
            onClick={handlePurgeDue}
            disabled={!!busy}
            className="flex items-center gap-2 px-3 py-2 min-h-[44px] border border-slate-300 rounded-lg text-sm disabled:opacity-50"
          >
            {busy === 'purge' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Kosongkan yang sudah 7 hari
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">Sampah yang sudah 7 hari dikosongkan otomatis setiap hari pukul 03.17 WIB.</p>
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada penghapusan.</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li key={job.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">
                    {job.row_count} laporan · {tgl(job.range_from)} – {tgl(job.range_to)}
                    {job.kind === 'satuan' && <span className="font-normal text-slate-500"> (dari menu Report)</span>}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_LABEL[job.status].tone}`}>{STATUS_LABEL[job.status].text}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Dihapus {tgl(job.created_at)} oleh {job.created_by_email ?? 'petugas tanpa login'}
                  {job.jenis && ` · ${job.jenis.join(', ')}`}
                </div>
                {job.status === 'sampah' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <span className="text-xs text-amber-700">Dihapus permanen mulai {tgl(job.purge_after)}</span>
                    <button
                      type="button"
                      onClick={() => handleRestore(job)}
                      disabled={!!busy}
                      className="flex items-center gap-1 px-3 py-2 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" /> Pulihkan
                    </button>
                  </div>
                )}
                {job.media_total != null && (
                  <div className="text-xs text-slate-600 mt-1">
                    Foto/video: {job.media_deleted} dihapus · {job.media_kept} dipakai laporan lain (disimpan) · {job.media_missing} sudah tidak ada
                    {job.media_failed ? ` · ${job.media_failed} gagal (dicoba lagi otomatis)` : ''}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
