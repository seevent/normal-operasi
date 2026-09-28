import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Sparkles, ChevronUp, AlertTriangle, CheckCircle2, PartyPopper } from 'lucide-react';
import { useAppStore, PetTone } from '../../store/useAppStore';
import { getIdleQuote } from '../../lib/data/petMessages';

/**
 * Ukuran tampil maskot. Gambar sumber berukuran 260x485 (rasio 1 : 1,865),
 * jadi tingginya dihitung dari lebar agar tidak gepeng.
 */
const PET_WIDTH = 72;
const PET_HEIGHT = Math.round(PET_WIDTH * 1.865);
/** Ruang ekstra di bawah maskot untuk semburan thruster. */
const PET_FLAME_SPACE = Math.round(PET_HEIGHT * 0.3);

/** Gaya balon dialog & ikon judul per nada pesan. */
const TONE_STYLES: Record<PetTone, { border: string; label: string; labelColor: string; Icon: React.ElementType; iconColor: string }> = {
  info: { border: 'border-amber-500/40', label: 'CHIBI IRON MAN', labelColor: 'text-amber-400', Icon: Sparkles, iconColor: 'text-cyan-400' },
  success: { border: 'border-emerald-500/50', label: 'J.A.R.V.I.S', labelColor: 'text-emerald-400', Icon: CheckCircle2, iconColor: 'text-emerald-400' },
  warning: { border: 'border-amber-400/70', label: 'J.A.R.V.I.S', labelColor: 'text-amber-300', Icon: AlertTriangle, iconColor: 'text-amber-300' },
  error: { border: 'border-red-500/70', label: 'J.A.R.V.I.S', labelColor: 'text-red-400', Icon: AlertTriangle, iconColor: 'text-red-400' },
  cheer: { border: 'border-cyan-400/60', label: 'CHIBI IRON MAN', labelColor: 'text-cyan-300', Icon: PartyPopper, iconColor: 'text-cyan-300' },
};

export const AntigravityPet: React.FC = () => {
  const petMessage = useAppStore((s) => s.petMessage);
  const clearPetMessage = useAppStore((s) => s.clearPetMessage);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dialogText, setDialogText] = useState<string | null>(null);
  const [dialogTone, setDialogTone] = useState<PetTone>('info');
  const [isHovered, setIsHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  }>({ pointerX: 0, pointerY: 0, origX: 0, origY: 0, hasMoved: false });

  const petRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Inisialisasi posisi default di pojok kanan bawah
  useEffect(() => {
    const initX = Math.max(16, window.innerWidth - PET_WIDTH - 16);
    const initY = Math.max(16, window.innerHeight - PET_HEIGHT - PET_FLAME_SPACE - 16);
    setPosition({ x: initX, y: initY });

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const clampedX = Math.min(Math.max(16, prev.x), window.innerWidth - PET_WIDTH - 8);
        const clampedY = Math.min(Math.max(16, prev.y), window.innerHeight - PET_HEIGHT - PET_FLAME_SPACE);
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sembunyikan maskot selama ada isian yang sedang difokuskan, agar tidak
  // menutupi field saat keyboard ponsel muncul.
  useEffect(() => {
    const isFormField = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el || !el.tagName) return false;
      return ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (isFormField(e.target)) setIsTyping(true);
    };
    const handleFocusOut = (e: FocusEvent) => {
      if (isFormField(e.target)) setIsTyping(false);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const showRandomDialog = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setDialogTone('info');
    setDialogText((prev) => getIdleQuote(prev));

    timerRef.current = setTimeout(() => {
      setDialogText(null);
    }, 4500);
  }, []);

  // Kabar operasional dari service / tab selalu menggantikan kalimat santai.
  useEffect(() => {
    if (!petMessage) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setDialogText(petMessage.text);
    setDialogTone(petMessage.tone);
    // Kabar penting memanggil maskot kembali kalau sedang disembunyikan.
    setIsMinimized(false);

    if (petMessage.durationMs > 0) {
      timerRef.current = setTimeout(() => {
        setDialogText(null);
        clearPetMessage();
      }, petMessage.durationMs);
    }
  }, [petMessage, clearPetMessage]);

  // Handler Pointer Drag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    
    const currentX = position?.x ?? (window.innerWidth - PET_WIDTH - 16);
    const currentY = position?.y ?? (window.innerHeight - PET_HEIGHT - PET_FLAME_SPACE - 16);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      origX: currentX,
      origY: currentY,
      hasMoved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragStartRef.current.hasMoved = true;
    }

    const newX = Math.min(
      Math.max(12, dragStartRef.current.origX + deltaX),
      window.innerWidth - PET_WIDTH - 8
    );
    const newY = Math.min(
      Math.max(12, dragStartRef.current.origY + deltaY),
      window.innerHeight - PET_HEIGHT - PET_FLAME_SPACE
    );

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }

    // Jika tidak digeser (hanya klik), munculkan quote
    if (!dragStartRef.current.hasMoved) {
      if (dialogText) {
        setDialogText(null);
        clearPetMessage();
        if (timerRef.current) clearTimeout(timerRef.current);
      } else {
        showRandomDialog();
      }
    }
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50 transition-transform duration-200 hover:scale-110 cursor-pointer"
        onClick={() => {
          setIsMinimized(false);
          showRandomDialog();
        }}
        title="Panggil Antigravity Pet (Chibi Iron Man)"
      >
        <div className="relative group flex items-center justify-center w-11 h-11 bg-slate-900/90 border border-amber-500/50 rounded-full shadow-lg shadow-amber-500/20 backdrop-blur-md">
          {/* Mini Arc Reactor Icon */}
          <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center animate-arc-pulse bg-cyan-950/60">
            <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white flex items-center justify-center">
            <ChevronUp className="w-2 h-2 text-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!position) return null;

  // Balon lebih lebar daripada maskot, jadi sisinya mengikuti posisi maskot
  // supaya teksnya tidak terpotong di tepi layar.
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const bubbleSide: 'left' | 'center' | 'right' =
    position.x > viewportWidth * 0.6 ? 'right' : position.x < viewportWidth * 0.25 ? 'left' : 'center';

  return (
    <div
      ref={petRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      className={`fixed top-0 left-0 z-50 select-none touch-none cursor-grab active:cursor-grabbing transition-opacity duration-200 ${
        isTyping ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={isTyping}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speech Bubble / Balon Dialog */}
      {dialogText && (
        <div
          className={`absolute bottom-full mb-2 w-56 sm:w-64 p-3 bg-slate-900/95 text-slate-100 text-xs rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in-90 duration-200 ${TONE_STYLES[dialogTone].border} ${bubbleSide === 'right' ? 'right-0' : bubbleSide === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}
          role={dialogTone === 'error' || dialogTone === 'warning' ? 'alert' : 'status'}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <span className={`font-bold text-[10px] tracking-wider flex items-center gap-1 ${TONE_STYLES[dialogTone].labelColor}`}>
              {React.createElement(TONE_STYLES[dialogTone].Icon, {
                className: `w-3 h-3 ${TONE_STYLES[dialogTone].iconColor}`,
              })}
              {TONE_STYLES[dialogTone].label}
            </span>
            <button
              onClick={() => {
                setDialogText(null);
                clearPetMessage();
                if (timerRef.current) clearTimeout(timerRef.current);
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              title="Tutup Balon"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="leading-relaxed text-slate-200 font-medium">{dialogText}</p>
          {/* Panah Balon Bawah — mengikuti sisi balon agar tetap menunjuk ke maskot */}
          <div
            className={`absolute top-full border-solid border-t-slate-900/95 border-t-8 border-x-transparent border-x-8 border-b-0 drop-shadow-sm ${
              bubbleSide === 'right' ? 'right-8' : bubbleSide === 'left' ? 'left-8' : 'left-1/2 -translate-x-1/2'
            }`}
          />
        </div>
      )}

      {/* Mini Controls saat di-hover */}
      <div 
        className={`absolute -top-3 right-0 flex items-center gap-1 bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 rounded-full px-1.5 py-0.5 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={showRandomDialog}
          title="Bicara"
          className="text-slate-300 hover:text-cyan-400 p-0.5 transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
        </button>
        <button
          onClick={() => setIsMinimized(true)}
          title="Minimize Pet"
          className="text-slate-300 hover:text-amber-400 p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Karakter Chibi Iron Man Melayang */}
      <div
        className={`relative ${isDragging ? '' : 'animate-antigravity-float'}`}
        style={{ width: PET_WIDTH, height: PET_HEIGHT }}
      >
        {/* Semburan thruster roket di bawah kedua boot */}
        <svg
          className="absolute left-0 w-full pointer-events-none animate-thruster-flame"
          style={{ top: '98%', height: PET_HEIGHT * 0.2 }}
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="petThruster" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="22%" stopColor="#bae6fd" />
              <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Posisi x mengikuti titik tengah masing-masing boot pada gambar */}
          <path d="M 27 0 H 41 C 40 12, 37 26, 34 40 C 31 26, 28 12, 27 0 Z" fill="url(#petThruster)" />
          <path d="M 58 0 H 72 C 71 12, 68 26, 65 40 C 62 26, 59 12, 58 0 Z" fill="url(#petThruster)" />
        </svg>

        <img
          src="/pet-iron-man.webp"
          alt="Maskot Chibi Iron Man"
          width={PET_WIDTH}
          height={PET_HEIGHT}
          draggable={false}
          className="relative block w-full h-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.45)]"
        />

        {/* Denyut Arc Reactor, ditumpangkan tepat di atas reaktor pada gambar */}
        <span
          aria-hidden="true"
          className="absolute rounded-full animate-arc-pulse pointer-events-none"
          style={{
            left: '50%',
            top: '55%',
            width: PET_WIDTH * 0.2,
            height: PET_WIDTH * 0.2,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(224,242,254,0.95) 0%, rgba(56,189,248,0.55) 45%, rgba(56,189,248,0) 72%)',
          }}
        />
      </div>
    </div>
  );
};
export default AntigravityPet;
