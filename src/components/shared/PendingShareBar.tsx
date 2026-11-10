import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Download, Link2, Send, SkipForward, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  clearPendingShare,
  pendingVideoLinks,
  retryShareSeparately,
  savePendingFiles,
  sendPendingVideoLinks,
  shareNextPendingBatch,
  skipPendingShare,
} from '../../lib/services/shareService';

/**
 * Bilah di dasar layar untuk kiriman WhatsApp yang belum selesai: media grup kolase lain, kiriman yang
 * ditolak peramban (tetap di antrean, bisa dicoba lagi atau dikirim lewat jalan cadangan), dan kirim
 * ulang terpisah bila WhatsApp menolak video. Web Share API butuh ketukan baru tiap kali, jadi tiap
 * kiriman punya tombolnya sendiri. Bilah ini tampil sejak share pertama DIMULAI, tidak menunggu peramban
 * melaporkan share itu selesai (di iOS laporan itu bisa tidak pernah datang).
 */
export const PendingShareBar: React.FC = () => {
  const batches = useAppStore((s) => s.pendingShareBatches);
  const retry = useAppStore((s) => s.shareRetry);
  const failure = useAppStore((s) => s.shareFailure);
  const attempted = useAppStore((s) => s.shareAttempted);
  const setBottomInset = useAppStore((s) => s.setBottomInset);
  const barRef = useRef<HTMLDivElement>(null);
  const visible = batches.length > 0 || retry !== null;

  useEffect(() => {
    setBottomInset(visible ? (barRef.current?.offsetHeight ?? 88) + 8 : 0);
    return () => setBottomInset(0);
  }, [visible, batches.length, retry, failure, attempted, setBottomInset]);

  if (!visible) return null;

  const next = batches[0];
  const videoCount = next ? next.files.filter((f) => f.type.startsWith('video/')).length : 0;
  const mediaLabel = next && next.files.length === videoCount && videoCount > 0 ? `${videoCount} video` : `${next?.files.length} media`;
  const nextLabel = failure
    ? 'Coba lagi'
    : next?.caption
      ? next.files.length > 0
        ? `Kirim laporan + ${mediaLabel}`
        : 'Kirim laporan'
      : `Kirim berikutnya (${mediaLabel})`;
  const links = failure ? pendingVideoLinks(next) : [];
  const secondary = 'min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5';

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {next && failure && (
        <p role="alert" className="text-xs font-semibold text-rose-700 mb-2 flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            Belum terkirim: {failure.reason === 'tidak_didukung' ? 'peramban ini tidak bisa membagikan berkas tersebut' : 'peramban menolak membuka menu bagikan'}.
            Coba lagi, atau pakai jalan lain di bawah.
          </span>
        </p>
      )}
      {next && !failure && (
        <p className="text-xs text-slate-600 mb-2">
          {next.caption
            ? 'Laporan belum terkirim. Ketuk tombol hijau untuk membagikannya ke WhatsApp.'
            : attempted
              ? `Sudah terkirim? Ketuk Lewati. Masih ada ${batches.length} kiriman media di antrean.`
              : `Masih ada ${batches.length} kiriman media tanpa caption. Ketuk setelah laporan terkirim.`}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {next && (
          <button
            type="button"
            onClick={() => void shareNextPendingBatch()}
            className="flex-1 min-w-[10rem] min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl"
          >
            <Send className="w-5 h-5" aria-hidden="true" /> {nextLabel}
          </button>
        )}
        {next && failure && links.length > 0 && (
          <button type="button" onClick={sendPendingVideoLinks} className={`${secondary} bg-sky-100 hover:bg-sky-200 text-sky-900`}>
            <Link2 className="w-4 h-4" aria-hidden="true" /> Kirim tautan video
          </button>
        )}
        {next && failure && next.files.length > 0 && (
          <button type="button" onClick={savePendingFiles} className={`${secondary} bg-slate-100 hover:bg-slate-200 text-slate-800`}>
            <Download className="w-4 h-4" aria-hidden="true" /> Simpan ke HP
          </button>
        )}
        {next && (attempted || failure) && (
          <button type="button" onClick={skipPendingShare} className={`${secondary} bg-slate-100 hover:bg-slate-200 text-slate-800`}>
            <SkipForward className="w-4 h-4" aria-hidden="true" /> Lewati
          </button>
        )}
        {retry && (
          <button
            type="button"
            onClick={() => void retryShareSeparately()}
            className={`${next ? '' : 'flex-1 '}${secondary} bg-amber-100 hover:bg-amber-200 text-amber-900`}
          >
            WhatsApp gagal? Kirim ulang terpisah
          </button>
        )}
        <button
          type="button"
          onClick={clearPendingShare}
          aria-label="Tutup"
          className="min-h-[44px] min-w-[44px] px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl flex items-center justify-center"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
