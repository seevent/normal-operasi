import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X } from 'lucide-react';

interface Props {
  url: string;
  title: string;
  /** Baris kedua di bawah judul, tidak terpotong (mis. nomor equipment). */
  subtitle?: string;
  /** Teks kecil di kiri bawah, mis. waktu unggah. */
  caption?: string;
  onClose: () => void;
}

/**
 * Pratinjau foto besar (gaya sama dengan modal foto di tab Report).
 * Dirender lewat portal ke <body> agar tidak terpotong oleh kartu/kontainer ber-transform di atasnya.
 * Tutup: tombol X, ketuk latar gelap, atau tombol Escape.
 */
export const PhotoLightbox: React.FC<Props> = ({ url, title, subtitle, caption, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Foto ${title}`}
        className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-800 truncate">📸 {title}</h3>
            {subtitle && <p className="mt-0.5 font-mono text-xs text-slate-500 break-all">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau foto"
            className="shrink-0 min-h-[44px] min-w-[44px] -my-2 -mr-2 inline-flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center max-h-[70vh]">
          <img src={url} alt={`Foto ${title}`} className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm" />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">{caption}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Buka di tab baru
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
};
