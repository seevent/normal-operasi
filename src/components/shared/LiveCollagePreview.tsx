import React, { useEffect, useState, useRef } from 'react';
import { processPhotosToCollage } from '../../lib/utils/canvasUtils';
import { Type } from 'lucide-react';
import { PhotoTextEditorModal } from './PhotoTextEditorModal';
import { PhotoAnnotation } from './PhotoUploader';

interface LiveCollagePreviewProps {
  photos: { preview: string; zoom?: number }[];
  onCollageChange?: (file: File | null, url: string | null, annotation?: PhotoAnnotation) => void;
}

export const LiveCollagePreview: React.FC<LiveCollagePreviewProps> = ({ photos, onCollageChange }) => {
  const [autoCollageUrl, setAutoCollageUrl] = useState<string | null>(null);
  const [autoCollageFile, setAutoCollageFile] = useState<File | null>(null);
  const [rawCollageUrl, setRawCollageUrl] = useState<string | null>(null);
  const [rawCollageFile, setRawCollageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [collageAnnotation, setCollageAnnotation] = useState<PhotoAnnotation | undefined>(undefined);
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const genRef = useRef<number>(0);

  // Buat hash unik dari daftar foto agar perubahan urutan, penambahan/penghapusan, atau zoom memicu re-render
  const photosHash = photos.map((p, idx) => `${idx}_${p.preview}_${p.zoom || 1}`).join('|');

  useEffect(() => {
    const currentGen = ++genRef.current;

    const generate = async () => {
      if (photos.length > 1) {
        setIsGenerating(true);
        const rawResult = await processPhotosToCollage(photos);
        
        // Pastikan ini adalah request generasi kolase terbaru
        if (currentGen !== genRef.current) {
          if (rawResult) URL.revokeObjectURL(rawResult.url);
          return;
        }

        if (rawResult) {
          setRawCollageUrl(rawResult.url);
          setRawCollageFile(rawResult.file);

          if (collageAnnotation) {
            const annotatedResult = await processPhotosToCollage(photos, collageAnnotation);
            if (currentGen !== genRef.current) {
              if (annotatedResult) URL.revokeObjectURL(annotatedResult.url);
              return;
            }
            setIsGenerating(false);
            if (annotatedResult) {
              setAutoCollageUrl(annotatedResult.url);
              setAutoCollageFile(annotatedResult.file);
              if (onCollageChange) onCollageChange(annotatedResult.file, annotatedResult.url, collageAnnotation);
            }
          } else {
            setIsGenerating(false);
            setAutoCollageUrl(rawResult.url);
            setAutoCollageFile(rawResult.file);
            if (onCollageChange) onCollageChange(rawResult.file, rawResult.url, undefined);
          }
        } else {
          setIsGenerating(false);
          setAutoCollageUrl(null);
          setAutoCollageFile(null);
          if (onCollageChange) onCollageChange(null, null, undefined);
        }
      } else {
        setIsGenerating(false);
        setAutoCollageUrl(null);
        setAutoCollageFile(null);
        setRawCollageUrl(null);
        setRawCollageFile(null);
        if (onCollageChange) onCollageChange(null, null, undefined);
      }
    };

    generate();
  }, [photosHash, photos.length, collageAnnotation]);

  // Cleanup URL kolase lama hanya setelah URL baru diterapkan atau saat unmount
  useEffect(() => {
    return () => {
      if (autoCollageUrl && autoCollageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(autoCollageUrl);
      }
      if (rawCollageUrl && rawCollageUrl.startsWith('blob:') && rawCollageUrl !== autoCollageUrl) {
        URL.revokeObjectURL(rawCollageUrl);
      }
    };
  }, [autoCollageUrl, rawCollageUrl]);

  if (photos.length <= 1 || (!autoCollageUrl && !isGenerating)) return null;

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-700">Preview Auto-Kolase:</h3>
        {isGenerating && (
          <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
            Memperbarui...
          </span>
        )}
      </div>
      {autoCollageUrl ? (
        <div className="relative inline-block w-full max-w-sm">
          <img 
            key={autoCollageUrl}
            src={autoCollageUrl} 
            alt="Auto Collage" 
            className={`w-full rounded-lg shadow-sm border border-slate-200 transition-opacity duration-200 ${isGenerating ? 'opacity-50' : 'opacity-100'}`} 
          />
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingText(true)}
              className="py-1.5 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Type className="w-3.5 h-3.5" />
              {collageAnnotation ? 'Edit Teks Kolase' : '+ Beri Teks pada Kolase'}
            </button>
            {collageAnnotation && (
              <span className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-200 truncate max-w-[180px]">
                "{collageAnnotation.text}"
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm h-48 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
          Membuat kolase foto...
        </div>
      )}
      <p className="text-xs text-slate-500 mt-2">Kolase ini digenerate otomatis. Anda dapat mengedit urutan daftar foto dengan menggesernya.</p>

      {isEditingText && (rawCollageUrl || autoCollageUrl) && (
        <PhotoTextEditorModal
          isOpen={isEditingText}
          onClose={() => setIsEditingText(false)}
          photoUrl={rawCollageUrl || autoCollageUrl || ''}
          initialAnnotation={collageAnnotation}
          onSave={(newFile, newUrl, annotation) => {
            setCollageAnnotation(annotation);
            setIsEditingText(false);
          }}
          onReset={() => {
            setCollageAnnotation(undefined);
            setIsEditingText(false);
          }}
        />
      )}
    </div>
  );
};
