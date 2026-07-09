// src/components/shared/PhotoTextEditorModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Type, RotateCcw, Sparkles, ArrowDown, ArrowUp, Minus, Palette, Clock, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PhotoAnnotation } from './PhotoUploader';

interface PhotoTextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  initialAnnotation?: PhotoAnnotation;
  onSave: (newFile: File, newPreviewUrl: string, annotation?: PhotoAnnotation) => void;
  onReset?: () => void;
  hasOriginal?: boolean;
}

export const drawTextOverlay = (
  canvas: HTMLCanvasElement,
  text: string,
  position: 'top' | 'bottom' | 'center',
  style: 'black' | 'red' | 'green' | 'yellow' | 'clear',
  size: 'small' | 'medium' | 'large' | number,
  align: 'left' | 'center' | 'right' = 'center'
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx || !text.trim()) return;

  // 2. Calculate font size
  const baseDim = Math.max(canvas.width, canvas.height);
  let fontSize = 40;
  if (typeof size === 'number' && !isNaN(size)) {
    fontSize = Math.max(12, Math.min(Math.floor(canvas.height / 2), Math.round(size)));
  } else {
    let fontScale = 0.12;
    if (size === 'small') fontScale = 0.08;
    if (size === 'large') fontScale = 0.18;
    fontSize = Math.max(20, Math.round(baseDim * fontScale));
  }

  ctx.font = `bold ${fontSize}px sans-serif, Arial, Inter`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  // 3. Word wrap
  const lines: string[] = [];
  const rawLines = text.split('\n');
  const maxLineWidth = canvas.width * 0.9;

  rawLines.forEach(rawLine => {
    const words = rawLine.split(' ');
    let currentLine = '';
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxLineWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
  });

  if (lines.length === 0) return;

  // 4. Calculate banner height and Y position
  const lineHeight = fontSize * 1.35;
  const paddingY = fontSize * 0.6;
  const boxHeight = lines.length * lineHeight + paddingY * 2;

  let boxY = canvas.height - boxHeight; // bottom
  if (position === 'top') boxY = 0;
  if (position === 'center') boxY = (canvas.height - boxHeight) / 2;

  // 5. Draw background banner
  if (style !== 'clear') {
    let bgColor = 'rgba(0, 0, 0, 0.65)';
    if (style === 'red') bgColor = 'rgba(220, 38, 38, 0.85)';
    if (style === 'green') bgColor = 'rgba(22, 163, 74, 0.85)';
    if (style === 'yellow') bgColor = 'rgba(234, 179, 8, 0.85)';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, boxY, canvas.width, boxHeight);
  }

  // 6. Draw text lines
  const paddingX = canvas.width * 0.05;
  lines.forEach((line, index) => {
    let textX = canvas.width / 2;
    if (align === 'left') textX = paddingX;
    if (align === 'right') textX = canvas.width - paddingX;

    const textY = boxY + paddingY + (index + 0.5) * lineHeight;

    if (style === 'clear') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = Math.round(fontSize * 0.3);
      ctx.shadowOffsetX = Math.max(2, Math.round(fontSize * 0.05));
      ctx.shadowOffsetY = Math.max(2, Math.round(fontSize * 0.05));
      ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.12));
      ctx.strokeStyle = '#000000';
      ctx.strokeText(line, textX, textY);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, textX, textY);
    } else if (style === 'yellow') {
      ctx.fillStyle = '#000000';
      ctx.fillText(line, textX, textY);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, textX, textY);
    }
  });
};

export const drawTextOnCanvas = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  text: string,
  position: 'top' | 'bottom' | 'center',
  style: 'black' | 'red' | 'green' | 'yellow' | 'clear',
  size: 'small' | 'medium' | 'large' | number,
  align: 'left' | 'center' | 'right' = 'center'
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = img.naturalWidth || img.width || 1200;
  canvas.height = img.naturalHeight || img.height || 1200;

  // 1. Draw image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // 2. Draw text overlay
  drawTextOverlay(canvas, text, position, style, size, align);
};

export const PhotoTextEditorModal: React.FC<PhotoTextEditorModalProps> = ({
  isOpen, onClose, photoUrl, initialAnnotation, onSave, onReset, hasOriginal
}) => {
  const [text, setText] = useState('');
  const [position, setPosition] = useState<'top' | 'bottom' | 'center'>('bottom');
  const [style, setStyle] = useState<'black' | 'red' | 'green' | 'yellow' | 'clear'>('clear');
  const [size, setSize] = useState<'small' | 'medium' | 'large' | number>('medium');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [maxFontSize, setMaxFontSize] = useState<number>(300);
  const [minFontSize, setMinFontSize] = useState<number>(14);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setText(initialAnnotation?.text || '');
      setPosition(initialAnnotation?.position || 'bottom');
      setStyle(initialAnnotation?.style || 'clear');
      setAlign(initialAnnotation?.align || 'center');
      if (initialAnnotation?.size !== undefined) {
        setSize(initialAnnotation.size);
      } else {
        setSize('medium');
      }
    }
  }, [isOpen, initialAnnotation]);

  useEffect(() => {
    if (!isOpen || !photoUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const imgH = img.naturalHeight || img.height || 1200;
      const maxSz = Math.max(24, Math.floor(imgH / 2));
      const minSz = Math.max(12, Math.floor(imgH * 0.02));
      setMaxFontSize(maxSz);
      setMinFontSize(minSz);

      let currentNumericSize = typeof size === 'number' && !isNaN(size) ? size : Math.round(imgH * 0.12);
      if (size === 'small') currentNumericSize = Math.round(imgH * 0.08);
      if (size === 'medium') currentNumericSize = Math.round(imgH * 0.12);
      if (size === 'large') currentNumericSize = Math.round(imgH * 0.18);
      if (typeof size !== 'number') {
        setSize(currentNumericSize);
      }

      if (canvasRef.current) {
        drawTextOnCanvas(canvasRef.current, img, text, position, style, typeof size === 'number' ? size : currentNumericSize, align);
      }
    };
    img.src = photoUrl;
  }, [isOpen, photoUrl, text, position, style, size, align]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current) return;
    setIsProcessing(true);

    const imgH = imageRef.current.naturalHeight || imageRef.current.height || 1200;
    const finalSize = typeof size === 'number' ? size : Math.round(imgH * 0.12);
    drawTextOnCanvas(canvasRef.current, imageRef.current, text, position, style, finalSize, align);

    canvasRef.current.toBlob((blob) => {
      setIsProcessing(false);
      if (!blob) return;
      const filename = `Photo_text_${Date.now()}.jpg`;
      const newFile = new File([blob], filename, { type: 'image/jpeg', lastModified: Date.now() });
      const newPreviewUrl = URL.createObjectURL(blob);

      const annotation: PhotoAnnotation | undefined = text.trim() ? {
        text: text.trim(),
        position,
        style,
        size: finalSize,
        align
      } : undefined;

      onSave(newFile, newPreviewUrl, annotation);
      onClose();
    }, 'image/jpeg', 0.92);
  };

  const presets = [
    "Before",
    "After",
    "Process"
  ];

  const addTimestamp = () => {
    const now = new Date();
    const timeStr = now.toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
    setText(prev => prev ? `${prev}\n${timeStr}` : timeStr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-200" />
            <h3 className="font-bold text-lg">Beri Teks / Watermark Foto</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Live Preview Canvas */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Preview Hasil Teks
            </label>
            <div className="bg-slate-900 rounded-xl p-2 flex items-center justify-center border border-slate-200 shadow-inner min-h-[220px] max-h-[380px] overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[360px] w-auto h-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>

          {/* Text Input & Presets */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex justify-between items-center">
              <span>Teks / Catatan Laporan</span>
              <span className="text-xs font-normal text-slate-400">Bisa beberapa baris (Enter)</span>
            </label>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Contoh: Mesin X-Ray Gate 1 - Rusak / Sebelum PM..."
              rows={2}
              className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition-all shadow-sm"
            />

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500 font-medium">Cepat tambahkan keterangan:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={addTimestamp}
                  className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors border border-blue-200 flex items-center gap-1 shadow-xs"
                >
                  <Clock className="w-3 h-3" /> + Waktu Sekarang
                </button>
                {presets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setText(prev => prev ? `${prev} - ${preset}` : preset)}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors border border-slate-200"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Styling, Alignment & Position Controls */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Position */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  Posisi Teks
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPosition('bottom')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      position === 'bottom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" /> Bawah
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('top')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      position === 'top' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" /> Atas
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('center')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      position === 'center' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Minus className="w-4 h-4" /> Tengah
                  </button>
                </div>
              </div>

              {/* Text Alignment */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  Rata Teks
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAlign('left')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      align === 'left' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" /> Kiri
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlign('center')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      align === 'center' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" /> Tengah
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlign('right')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      align === 'right' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <AlignRight className="w-4 h-4" /> Kanan
                  </button>
                </div>
              </div>

              {/* Background Style */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> Warna & Gaya
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'clear', label: 'Transparan', bg: 'bg-white border-2 border-slate-300 text-slate-800' },
                    { id: 'black', label: 'Hitam', bg: 'bg-black text-white' },
                    { id: 'red', label: 'Merah', bg: 'bg-red-600 text-white' },
                    { id: 'green', label: 'Hijau', bg: 'bg-green-600 text-white' },
                    { id: 'yellow', label: 'Kuning', bg: 'bg-yellow-400 text-black font-bold' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStyle(item.id as any)}
                      className={`py-2 rounded-lg text-[10px] font-bold flex items-center justify-center transition-transform ${item.bg} ${
                        style === item.id ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={item.label}
                    >
                      {style === item.id ? <Check className="w-3.5 h-3.5" /> : item.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Font Size Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Ukuran Font (Maks: Setengah Tinggi Foto)
                </label>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                  {typeof size === 'number' ? `${size}px (${Math.round((size / maxFontSize) * 50)}% Tinggi Foto)` : 'Sedang'}
                </span>
              </div>
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500">A</span>
                <input
                  type="range"
                  min={minFontSize}
                  max={maxFontSize}
                  value={typeof size === 'number' ? size : Math.round((minFontSize + maxFontSize) * 0.1)}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-lg font-black text-slate-800">A</span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            {hasOriginal && onReset && (
              <button
                type="button"
                onClick={() => {
                  onReset();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Hapus Teks
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {isProcessing ? 'Memproses...' : 'Simpan & Terapkan'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
