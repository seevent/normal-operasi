import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Sparkles, ChevronUp } from 'lucide-react';

const PET_QUOTES = [
  "I am Iron Man! Versi sachet tapi Arc Reactor tetap menyala!",
  "J.A.R.V.I.S: Semua sistem operasional SSES T2 dalam kondisi optimal, Sir.",
  "Alat aman, form terisi, hati tenang. Semangat dinas hari ini!",
  "Arc Reactor 100%! Jangan lupa istirahat sejenak & minum air putih ya.",
  "Aku cinta kalian 3000%! Tetap teliti dalam setiap pengecekan.",
  "X-Ray, WTMD, ETD... kalau ada kendala teknis, hadapi dengan kepala dingin!",
  "Laporan sudah dicek kembali? Detail kecil mencegah kendala besar.",
  "Ssst... armor ini anti-stres dan anti-overthinking!"
];

export const AntigravityPet: React.FC = () => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dialogText, setDialogText] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

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
    const initX = Math.max(16, window.innerWidth - 130);
    const initY = Math.max(16, window.innerHeight - 175);
    setPosition({ x: initX, y: initY });

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const clampedX = Math.min(Math.max(16, prev.x), window.innerWidth - 120);
        const clampedY = Math.min(Math.max(16, prev.y), window.innerHeight - 150);
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showRandomDialog = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setDialogText((prev) => {
      const available = PET_QUOTES.filter((q) => q !== prev);
      const randomQuote = available[Math.floor(Math.random() * available.length)];
      return randomQuote;
    });

    timerRef.current = setTimeout(() => {
      setDialogText(null);
    }, 4500);
  }, []);

  // Handler Pointer Drag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    
    const currentX = position?.x ?? (window.innerWidth - 130);
    const currentY = position?.y ?? (window.innerHeight - 175);

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
      window.innerWidth - 115
    );
    const newY = Math.min(
      Math.max(12, dragStartRef.current.origY + deltaY),
      window.innerHeight - 145
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

  return (
    <div
      ref={petRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      className="fixed top-0 left-0 z-50 select-none touch-none cursor-grab active:cursor-grabbing transition-transform duration-75"
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
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 sm:w-64 p-3 bg-slate-900/95 text-slate-100 text-xs rounded-xl shadow-2xl border border-amber-500/40 backdrop-blur-md animate-in fade-in zoom-in-90 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <span className="font-bold text-[10px] text-amber-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              CHIBI IRON MAN
            </span>
            <button
              onClick={() => {
                setDialogText(null);
                if (timerRef.current) clearTimeout(timerRef.current);
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              title="Tutup Balon"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="leading-relaxed text-slate-200 font-medium">{dialogText}</p>
          {/* Panah Balon Bawah */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-slate-900/95 border-t-8 border-x-transparent border-x-8 border-b-0 drop-shadow-sm" />
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
      <div className={`relative ${isDragging ? '' : 'animate-antigravity-float'}`}>
        <svg
          width="90"
          height="115"
          viewBox="0 0 100 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transition-transform duration-200 hover:scale-105"
        >
          <defs>
            {/* Gradien Armor Merah */}
            <linearGradient id="armorRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>

            {/* Gradien Emas Faceplate */}
            <linearGradient id="goldPlate" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Arc & Eye Glow Filter */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Thruster Flame Gradient */}
            <linearGradient id="thrusterFire" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="85%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Semburan Api Thruster Kaki (Zero-G Propulsion) */}
          <g className="animate-thruster-flame">
            {/* Api Kaki Kiri */}
            <polygon points="34,115 39,115 36.5,129" fill="url(#thrusterFire)" />
            {/* Api Kaki Kanan */}
            <polygon points="61,115 66,115 63.5,129" fill="url(#thrusterFire)" />
          </g>

          {/* ===================== TUBUH MINI ===================== */}
          {/* Lengan Kiri */}
          <path d="M 28 82 L 20 94 A 4 4 0 0 0 25 99 L 32 88 Z" fill="url(#armorRed)" stroke="#7f1d1d" strokeWidth="1.2" />
          <circle cx="23" cy="97" r="2.2" fill="#38bdf8" filter="url(#cyanGlow)" />

          {/* Lengan Kanan */}
          <path d="M 72 82 L 80 94 A 4 4 0 0 1 75 99 L 68 88 Z" fill="url(#armorRed)" stroke="#7f1d1d" strokeWidth="1.2" />
          <circle cx="77" cy="97" r="2.2" fill="#38bdf8" filter="url(#cyanGlow)" />

          {/* Kaki Kiri Mini */}
          <rect x="32" y="98" width="9" height="17" rx="3" fill="url(#armorRed)" stroke="#7f1d1d" strokeWidth="1" />
          <rect x="33" y="103" width="7" height="4" rx="1" fill="url(#goldPlate)" />
          {/* Sepatu Boot Kiri */}
          <path d="M 31 113 L 41 113 L 41 116 L 31 116 Z" fill="#991b1b" />

          {/* Kaki Kanan Mini */}
          <rect x="59" y="98" width="9" height="17" rx="3" fill="url(#armorRed)" stroke="#7f1d1d" strokeWidth="1" />
          <rect x="60" y="103" width="7" height="4" rx="1" fill="url(#goldPlate)" />
          {/* Sepatu Boot Kanan */}
          <path d="M 59 113 L 69 113 L 69 116 L 59 116 Z" fill="#991b1b" />

          {/* Torso / Badan Utama */}
          <path
            d="M 32 78 L 68 78 L 65 100 L 35 100 Z"
            fill="url(#armorRed)"
            stroke="#7f1d1d"
            strokeWidth="1.5"
          />

          {/* Pelat Pinggang Emas */}
          <path d="M 36 94 L 64 94 L 62 100 L 38 100 Z" fill="url(#goldPlate)" />

          {/* Shoulder Pads Emas */}
          <ellipse cx="32" cy="80" rx="6" ry="3.5" fill="url(#goldPlate)" />
          <ellipse cx="68" cy="80" rx="6" ry="3.5" fill="url(#goldPlate)" />

          {/* Arc Reactor Dada */}
          <g className="animate-arc-pulse">
            <circle cx="50" cy="86" r="6" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
            <circle cx="50" cy="86" r="4.2" fill="#e0f2fe" filter="url(#cyanGlow)" />
            <circle cx="50" cy="86" r="2" fill="#ffffff" />
          </g>

          {/* ===================== KEPALA BOBBLEHEAD BESAR ===================== */}
          {/* Telinga Pod Kiri & Kanan */}
          <rect x="14" y="38" width="6" height="15" rx="3" fill="url(#goldPlate)" stroke="#78350f" strokeWidth="1" />
          <rect x="80" y="38" width="6" height="15" rx="3" fill="url(#goldPlate)" stroke="#78350f" strokeWidth="1" />

          {/* Helm Tempur Utama (Merah Bulat Chibi) */}
          <rect
            x="18"
            y="12"
            width="64"
            height="62"
            rx="24"
            fill="url(#armorRed)"
            stroke="#7f1d1d"
            strokeWidth="2"
          />

          {/* Garis Aksen Dahi Helm */}
          <path d="M 34 16 L 50 20 L 66 16" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />

          {/* Faceplate Emas Ikonik Iron Man */}
          <path
            d="
              M 27 28 
              C 35 25, 65 25, 73 28 
              C 77 35, 77 56, 73 66 
              C 67 73, 56 74, 50 74 
              C 44 74, 33 73, 27 66 
              C 23 56, 23 35, 27 28 Z
            "
            fill="url(#goldPlate)"
            stroke="#92400e"
            strokeWidth="1.8"
          />

          {/* Lekukan Pipi & Dahi Faceplate */}
          <path
            d="M 33 27 L 41 38 L 59 38 L 67 27"
            fill="none"
            stroke="#b45309"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Mata Celah Kiri Menyala Cyan */}
          <g filter="url(#cyanGlow)">
            <polygon points="34,44 45,46 44,50 35,48" fill="#e0f2fe" />
            <polygon points="34,44 45,46 44,50 35,48" stroke="#38bdf8" strokeWidth="1" />
          </g>

          {/* Mata Celah Kanan Menyala Cyan */}
          <g filter="url(#cyanGlow)">
            <polygon points="66,44 55,46 56,50 65,48" fill="#e0f2fe" />
            <polygon points="66,44 55,46 56,50 65,48" stroke="#38bdf8" strokeWidth="1" />
          </g>

          {/* Mulut / Ventilasi Dagu Helm */}
          <line x1="44" y1="67" x2="56" y2="67" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
export default AntigravityPet;
