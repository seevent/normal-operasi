import React, { useRef } from 'react';
import { AlertCircle, Camera, CheckCircle2, Circle, ExternalLink, Loader2, Pencil, RotateCcw } from 'lucide-react';
import type { PreventiveAsset, RowStatus } from '../../../lib/utils/preventiveGrouping';
import type { SavedEntry } from '../../../lib/utils/preventiveStatus';

interface Props {
  asset: PreventiveAsset;
  status: RowStatus;
  error?: string;
  saved?: SavedEntry;
  /** Data periode belum dimuat: tombol dinonaktifkan agar foto tidak masuk ke periode yang salah. */
  disabled: boolean;
  onPick: (asset: PreventiveAsset, file: File) => void;
  /** Mengembalikan false bila berkas percobaan sebelumnya sudah tidak ada -> baris meminta foto lagi. */
  onRetry: (asset: PreventiveAsset) => Promise<boolean>;
}

const BADGE: Record<RowStatus, { label: string; className: string; icon: React.ReactNode }> = {
  idle: { label: 'Belum', className: 'bg-slate-100 text-slate-700 border-slate-300', icon: <Circle className="w-3.5 h-3.5" aria-hidden="true" /> },
  uploading: { label: 'Mengunggah…', className: 'bg-blue-50 text-blue-800 border-blue-300', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> },
  saved: { label: 'Tersimpan', className: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> },
  failed: { label: 'Gagal tersimpan', className: 'bg-red-50 text-red-800 border-red-300', icon: <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> },
};

const PreventiveAssetRowBase: React.FC<Props> = ({ asset, status, error, saved, disabled, onPick, onRetry }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const badge = BADGE[status];
  const busy = status === 'uploading';
  const openPicker = () => inputRef.current?.click();

  const handleButton = async () => {
    if (status === 'failed') {
      const resumed = await onRetry(asset);
      if (!resumed) openPicker();
      return;
    }
    openPicker();
  };

  const button =
    status === 'failed'
      ? { label: 'Retry', icon: <RotateCcw className="w-4 h-4" aria-hidden="true" />, className: 'bg-red-600 text-white border-red-700 hover:bg-red-700' }
      : status === 'saved'
        ? { label: 'Edit', icon: <Pencil className="w-4 h-4" aria-hidden="true" />, className: 'bg-white text-blue-800 border-blue-300 hover:bg-blue-50' }
        : { label: 'Upload', icon: <Camera className="w-4 h-4" aria-hidden="true" />, className: 'bg-blue-700 text-white border-blue-800 hover:bg-blue-800' };

  return (
    <li className="flex items-start gap-3 px-3 py-3 border-t border-slate-200 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 leading-snug break-words">{asset.name}</p>
        <p className="mt-0.5 font-mono text-[11px] text-slate-500 tracking-tight">{asset.equipmentNumber}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>
            {badge.icon}
            {badge.label}
          </span>
          {saved && status !== 'uploading' && (
            <a
              href={saved.secureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 underline-offset-2 hover:underline"
            >
              Lihat foto
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>
        {status === 'failed' && error && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-700 leading-snug">
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label={`Foto ${asset.name}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onPick(asset, file);
        }}
      />
      <button
        type="button"
        onClick={handleButton}
        disabled={busy || disabled}
        aria-label={`${button.label} foto ${asset.name}`}
        className={`shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[92px] rounded-xl border px-3 text-sm font-bold shadow-sm transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${button.className}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : button.icon}
        {busy ? 'Tunggu' : button.label}
      </button>
    </li>
  );
};

export const PreventiveAssetRow = React.memo(PreventiveAssetRowBase);
