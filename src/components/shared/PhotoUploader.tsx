// src/components/shared/PhotoUploader.tsx
import React, { useState } from 'react';
import { Camera, Move, ImagePlus, X, ZoomIn, ZoomOut, Type } from 'lucide-react';
import { PhotoTextEditorModal } from './PhotoTextEditorModal';

export type PhotoAnnotation = {
  text: string;
  position: 'top' | 'bottom' | 'center';
  style: 'black' | 'red' | 'green' | 'yellow' | 'clear';
  size: 'small' | 'medium' | 'large';
};

export type Photo = {
  id: number | string;
  file: File;
  preview: string;
  zoom?: number;
  originalFile?: File;
  originalPreview?: string;
  annotation?: PhotoAnnotation;
};

type PhotoUploaderProps = {
  photos: Photo[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onZoom: (index: number, delta: number) => void;
  onDrop: (e: any, targetIndex: number) => void;
  onEdit?: (index: number, updatedPhoto: Photo) => void;
  listType: string;
};

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos, onUpload, onRemove, onZoom, onDrop, onEdit, listType
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [, forceUpdate] = useState({});

  const handleSaveText = (newFile: File, newPreviewUrl: string, annotation?: PhotoAnnotation) => {
    if (editingIndex === null) return;
    const currentPhoto = photos[editingIndex];
    const updatedPhoto: Photo = {
      ...currentPhoto,
      originalFile: currentPhoto.originalFile || currentPhoto.file,
      originalPreview: currentPhoto.originalPreview || currentPhoto.preview,
      file: newFile,
      preview: newPreviewUrl,
      annotation
    };
    if (onEdit) {
      onEdit(editingIndex, updatedPhoto);
    } else {
      photos[editingIndex] = updatedPhoto;
      forceUpdate({});
    }
    setEditingIndex(null);
  };

  const handleResetText = () => {
    if (editingIndex === null) return;
    const currentPhoto = photos[editingIndex];
    if (!currentPhoto.originalFile || !currentPhoto.originalPreview) return;
    const resetPhoto: Photo = {
      ...currentPhoto,
      file: currentPhoto.originalFile,
      preview: currentPhoto.originalPreview,
      annotation: undefined
    };
    if (onEdit) {
      onEdit(editingIndex, resetPhoto);
    } else {
      photos[editingIndex] = resetPhoto;
      forceUpdate({});
    }
    setEditingIndex(null);
  };

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
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={(e) => {
              onUpload(e);
              e.target.value = '';
            }} 
          />
        </label>
      </div>

      {photos.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-slate-500">Daftar Foto ({photos.length}):</p>
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
                className="relative bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm group/photo hover:shadow-md transition-shadow aspect-square cursor-move flex flex-col touch-pan-y"
              >
                <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                  <img 
                    src={photo.preview} 
                    alt="Preview" 
                    className="absolute w-full h-full object-cover transition-transform"
                    style={{ transform: `scale(${photo.zoom || 1})` }}
                  />
                </div>
                
                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm z-10">
                  {index + 1}
                </div>

                <div className="absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity">
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(index); }} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-1 left-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity">
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingIndex(index); }} 
                    className={`p-1.5 rounded-full shadow-md flex items-center gap-1 text-xs font-semibold px-2.5 py-1 transition-colors ${
                      photo.annotation ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                    title="Beri Teks / Watermark"
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{photo.annotation ? 'Edit Teks' : 'Teks'}</span>
                  </button>
                </div>

                <div className="absolute bottom-1 right-1 flex gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity">
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onZoom(index, 0.1); }} className="bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onZoom(index, -0.1); }} className="bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingIndex !== null && photos[editingIndex] && (
        <PhotoTextEditorModal
          isOpen={true}
          onClose={() => setEditingIndex(null)}
          photoUrl={photos[editingIndex].originalPreview || photos[editingIndex].preview}
          initialAnnotation={photos[editingIndex].annotation}
          onSave={handleSaveText}
          onReset={handleResetText}
          hasOriginal={!!photos[editingIndex].originalPreview}
        />
      )}
    </div>
  );
};

