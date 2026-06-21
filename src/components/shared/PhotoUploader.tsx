// src/components/shared/PhotoUploader.tsx
import React from 'react';
import { Camera, Move, ImagePlus, X } from 'lucide-react';

export type Photo = {
  id: number | string;
  file: File;
  preview: string;
  zoom?: number;
};

type PhotoUploaderProps = {
  photos: Photo[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onZoom: (index: number, delta: number) => void;
  onDrop: (e: any, targetIndex: number) => void;
  listType: string;
  onOpenEditor?: () => void;
};

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos, onUpload, onRemove, onZoom, onDrop, listType, onOpenEditor
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" /> Lampiran Foto
        </h2>
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <Move className="w-3 h-3" /> Geser foto untuk urutkan
        </span>
      </div>
      <div>
        <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors group">
          <div className="flex flex-col items-center gap-2 text-center">
            <ImagePlus className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-blue-700">Pilih / Ambil Foto</span>
            <span className="text-xs text-blue-500">Galeri, File, atau Kamera langsung</span>
          </div>
          <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} />
        </label>
      </div>

      {photos.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-slate-500">Foto Terpilih ({photos.length}):</p>
            {onOpenEditor && (
              <button type="button" onClick={onOpenEditor} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                Edit Kolase (Pro)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <div 
                key={photo.id} 
                data-photo-index={index}
                data-list-type={listType}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, index)}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    (window as any).touchDragState = { type: listType, index: index, startX: e.touches[0].clientX, startY: e.touches[0].clientY, isDragging: false };
                  }
                }}
                onTouchMove={(e) => {
                  if ((window as any).touchDragState && e.touches.length === 1) {
                    if (Math.abs(e.touches[0].clientY - (window as any).touchDragState.startY) > 10 || Math.abs(e.touches[0].clientX - (window as any).touchDragState.startX) > 10) {
                       (window as any).touchDragState.isDragging = true;
                    }
                  }
                }}
                onTouchEnd={(e) => {
                  if ((window as any).touchDragState && (window as any).touchDragState.isDragging && (window as any).touchDragState.type === listType) {
                    const touch = e.changedTouches[0];
                    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
                    const target = elem?.closest(`[data-list-type="${listType}"]`);
                    if (target) {
                      const targetIdx = parseInt(target.getAttribute('data-photo-index') || '', 10);
                      if (!isNaN(targetIdx) && targetIdx !== (window as any).touchDragState.index) {
                        const mockEvent = { preventDefault: () => {}, dataTransfer: { getData: () => (window as any).touchDragState.index.toString() } };
                        onDrop(mockEvent, targetIdx);
                      }
                    }
                  }
                  (window as any).touchDragState = null;
                }}
                className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 cursor-move hover:border-blue-400 transition-colors touch-pan-y"
                title="Tahan & Geser untuk mengubah urutan"
              >
                <div className="w-full h-full flex items-center justify-center bg-slate-800 overflow-hidden">
                  <img 
                    src={photo.preview} 
                    alt={`Preview ${index}`} 
                    className="w-full h-full object-cover transition-transform duration-200" 
                    style={{ transform: `scale(${photo.zoom || 1})` }}
                  />
                </div>

                <button type="button" onClick={() => onRemove(index)} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity shadow-md z-10">
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onZoom(index, -0.1); }} className="text-white hover:text-blue-300 font-bold px-2 py-0.5 text-lg leading-none">-</button>
                  <span className="text-white text-[11px] font-medium">{Math.round((photo.zoom || 1) * 100)}%</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onZoom(index, 0.1); }} className="text-white hover:text-blue-300 font-bold px-2 py-0.5 text-lg leading-none">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
