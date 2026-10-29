import React, { useEffect, useRef } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { clearPendingShare, shareNextPendingBatch, retryShareSeparately } from '../../lib/services/shareService';

/**
 * Bilah di dasar layar untuk kiriman WhatsApp lanjutan: kemajuan konversi video, laporan + media
 * setelah video siap, sisa media tanpa caption, dan kirim ulang terpisah bila WhatsApp menolak.
 * Web Share API butuh ketukan baru tiap kali, jadi tiap kiriman punya tombolnya sendiri.
 */
export const PendingShareBar: React.FC = () => {
  const batches = useAppStore((s) => s.pendingShareBatches);
  const retry = useAppStore((s) => s.shareRetry);
  const videoPrep = useAppStore((s) => s.videoPrep);
  const setBottomInset = useAppStore((s) => s.setBottomInset);
  const barRef = useRef<HTMLDivElement>(null);
  const visible = batches.length > 0 || retry !== null || videoPrep !== null;

  useEffect(() => {
    setBottomInset(visible ? (barRef.current?.offsetHeight ?? 88) + 8 : 0);
    return () => setBottomInset(0);
  }, [visible, batches.length, retry, videoPrep, setBottomInset]);

  if (!visible) return null;

  const next = batches[0];
  const mediaLabel = next && next.files.length === 1 && next.files[0].type.startsWith('video/') ? '1 video' : `${next?.files.length} media`;
  const nextLabel = next?.caption
    ? (next.files.length > 0 ? `Kirim laporan + ${mediaLabel}` : 'Kirim laporan')
    : `Kirim berikutnya (${mediaLabel})`;

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {videoPrep && (
        <p className="text-xs text-slate-600 mb-2">
          Video diubah ke format WhatsApp agar bisa terkirim. Tunggu sebentar, jangan tutup aplikasi.
        </p>
      )}
      {!videoPrep && next && (
        <p className="text-xs text-slate-600 mb-2">
          {next.caption
            ? 'Siap dikirim. Ketuk tombol hijau untuk membagikan laporan ke WhatsApp.'
            : `Laporan sudah dikirim. Masih ada ${batches.length} kiriman media tanpa caption.`}
        </p>
      )}
      <div className="flex gap-2">
        {videoPrep && (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin" /> Menyiapkan video ({videoPrep.done}/{videoPrep.total})
          </div>
        )}
        {!videoPrep && next && (
          <button
            type="button"
            onClick={() => void shareNextPendingBatch()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl"
          >
            <Send className="w-5 h-5" /> {nextLabel}
          </button>
        )}
        {retry && (
          <button
            type="button"
            onClick={() => void retryShareSeparately()}
            className={`${next ? '' : 'flex-1 '}px-4 py-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-sm`}
          >
            WhatsApp gagal? Kirim ulang terpisah
          </button>
        )}
        <button
          type="button"
          onClick={clearPendingShare}
          aria-label="Tutup"
          className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
