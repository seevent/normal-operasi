import React, { useEffect, useState } from 'react';
import { processPhotosToCollage } from '../../lib/utils/canvasUtils';

interface LiveCollagePreviewProps {
  photos: { preview: string; zoom?: number }[];
}

export const LiveCollagePreview: React.FC<LiveCollagePreviewProps> = ({ photos }) => {
  const [autoCollageUrl, setAutoCollageUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const generate = async () => {
      if (photos.length > 1) {
        const result = await processPhotosToCollage(photos);
        if (!active && result) {
          URL.revokeObjectURL(result.url);
        } else if (active && result) {
          setAutoCollageUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return result.url;
          });
        }
      } else {
        if (active) {
          setAutoCollageUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      }
    };
    generate();
    return () => {
      active = false;
    };
  }, [photos]);

  if (!autoCollageUrl || photos.length <= 1) return null;

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <h3 className="text-sm font-bold text-slate-700 mb-2">Preview Auto-Kolase:</h3>
      <img src={autoCollageUrl} alt="Auto Collage" className="w-full max-w-sm rounded-lg shadow-sm border border-slate-200" />
      <p className="text-xs text-slate-500 mt-2">Kolase ini akan digenerate otomatis saat dikirim. Anda dapat menyesuaikannya melalui tombol "Advanced Editor" (jika tersedia).</p>
    </div>
  );
};
