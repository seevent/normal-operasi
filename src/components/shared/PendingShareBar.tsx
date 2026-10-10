import React, { useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { shareNextPendingBatch } from '../../lib/services/shareService';

/**
 * Bilah di dasar layar untuk mengirim sisa media WhatsApp (tanpa caption).
 * Web Share API butuh ketukan baru tiap kali, jadi tiap gelombang punya tombolnya sendiri.
 */
export const PendingShareBar: React.FC = () => {
  const batches = useAppStore((s) => s.pendingShareBatches);
  const setPendingShareBatches = useAppStore((s) => s.setPendingShareBatches);
  const setBottomInset = useAppStore((s) => s.setBottomInset);
  const barRef = useRef<HTMLDivElement>(null);
  const visible = batches.length > 0;

  useEffect(() => {
    setBottomInset(visible ? (barRef.current?.offsetHeight ?? 88) + 8 : 0);
    return () => setBottomInset(0);
  }, [visible, setBottomInset]);

  if (!visible) return null;

  const next = batches[0];
  const nextLabel = next.length === 1 && next[0].type.startsWith('video/') ? '1 video' : `${next.length} foto`;

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <p className="text-xs text-slate-600 mb-2">
        Laporan sudah dikirim. Masih ada {batches.length} kiriman media tanpa caption.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void shareNextPendingBatch()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl"
        >
          <Send className="w-5 h-5" /> Kirim berikutnya ({nextLabel})
        </button>
        <button
          type="button"
          onClick={() => setPendingShareBatches([])}
          aria-label="Lewati sisa media"
          className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
