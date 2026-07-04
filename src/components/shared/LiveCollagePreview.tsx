import React, { useEffect, useState, useRef } from 'react';
import { processPhotosToCollage } from '../../lib/utils/canvasUtils';

interface LiveCollagePreviewProps {
  photos: { preview: string; zoom?: number }[];
}

export const LiveCollagePreview: React.FC<LiveCollagePreviewProps> = ({ photos }) => {
  const [autoCollageUrl, setAutoCollageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const genRef = useRef<number>(0);

  // Buat hash unik dari daftar foto agar perubahan urutan, penambahan/penghapusan, atau zoom memicu re-render
  const photosHash = photos.map((p, idx) => `${idx}_${p.preview}_${p.zoom || 1}`).join('|');

  useEffect(() => {
    const currentGen = ++genRef.current;

    const generate = async () => {
      if (photos.length > 1) {
        setIsGenerating(true);
        const result = await processPhotosToCollage(photos);
        
        // Pastikan ini adalah request generasi kolase terbaru
        if (currentGen !== genRef.current) {
          if (result) URL.revokeObjectURL(result.url);
          return;
        }

        setIsGenerating(false);
        if (result) {
          setAutoCollageUrl(result.url);
        }
      } else {
        setIsGenerating(false);
        setAutoCollageUrl(null);
      }
    };

    generate();
  }, [photosHash, photos.length]);

  // Cleanup URL kolase lama hanya setelah URL baru diterapkan atau saat unmount
  useEffect(() => {
    return () => {
      if (autoCollageUrl && autoCollageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(autoCollageUrl);
      }
    };
  }, [autoCollageUrl]);

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
        <img 
          key={autoCollageUrl}
          src={autoCollageUrl} 
          alt="Auto Collage" 
          className={`w-full max-w-sm rounded-lg shadow-sm border border-slate-200 transition-opacity duration-200 ${isGenerating ? 'opacity-50' : 'opacity-100'}`} 
        />
      ) : (
        <div className="w-full max-w-sm h-48 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
          Membuat kolase foto...
        </div>
      )}
      <p className="text-xs text-slate-500 mt-2">Kolase ini digenerate otomatis. Anda dapat mengedit urutan daftar foto dengan menggesernya.</p>
    </div>
  );
};
