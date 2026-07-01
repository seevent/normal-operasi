import React, { useState, lazy, Suspense } from 'react';
import { Briefcase, Calendar, MapPin, Clock, Share2, CheckCircle, FileText, ClipboardList } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PhotoUploader, Photo } from '../shared/PhotoUploader';
import { generateWA_Kegiatan } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { syncToGoogleSheets } from '../../lib/services/sheetsSyncService';
import { processPhotosToCollage } from '../../lib/utils/canvasUtils';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';

const CollageEditor = lazy(() => import('../shared/CollageEditor').then(m => ({ default: m.CollageEditor })));

export const TabKegiatan: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();

  const [kegiatanData, setKegiatanData] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
    
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');

    return {
      tanggal: localDate,
      waktuMulai: `${currentHour}:${currentMinute}`,
      waktuSelesai: '',
      lokasi: '',
      kegiatan: ''
    };
  });

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customCollageFile, setCustomCollageFile] = useState<File | null>(null);
  const [customCollageUrl, setCustomCollageUrl] = useState<string | null>(null);

  // === Handlers ===
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setKegiatanData({ ...kegiatanData, [name]: value });
  };

  // === Photo Handlers ===
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map(file => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        zoom: 1
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const updatePhotoZoom = (index: number, delta: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      const currentZoom = newPhotos[index].zoom || 1;
      newPhotos[index].zoom = Math.max(0.5, Math.min(3, currentZoom + delta));
      return newPhotos;
    });
  };

  const handlePhotoDrop = (e: React.DragEvent | any, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData('text/plain');
    if (!sourceIndexStr) return;
    
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    
    setPhotos(prev => {
      const newPhotos = [...prev];
      const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
      newPhotos.splice(targetIndex, 0, movedPhoto);
      return newPhotos;
    });
  };

  // === Submit ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let generatedCollageFile: File | null = customCollageFile;
    let generatedCollageUrl: string | null = customCollageUrl;

    if (photos.length > 0 && !generatedCollageFile) {
      if (photos.length === 1) {
        generatedCollageFile = photos[0].file || null;
      } else {
        // Create fallback collage
        const collageResult = await processPhotosToCollage(photos);
        if (collageResult) {
          generatedCollageUrl = collageResult.url;
          const res = await fetch(collageResult.url);
          const blob = await res.blob();
          generatedCollageFile = new File([blob], `Dokumentasi_Kegiatan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        }
      }
    }

    const message = generateWA_Kegiatan(kegiatanData);
    
    const waktuFull = kegiatanData.waktuSelesai ? `${kegiatanData.waktuMulai} - ${kegiatanData.waktuSelesai}` : kegiatanData.waktuMulai;
    syncToGoogleSheets({
      jenis: 'Kegiatan',
      tanggal: kegiatanData.tanggal,
      waktu: waktuFull,
      lokasi: kegiatanData.lokasi || '-',
      peralatan: 'Kegiatan Lapangan',
      uraian: kegiatanData.kegiatan || '-',
      tindakLanjut: '-',
      status: 'Normal Operasi',
      imageFile: generatedCollageFile
    });

    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });

    if (generatedCollageUrl) {
      // Optional: Store to global context if needed
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
          <Briefcase className="w-5 h-5 text-blue-600" /> Informasi Laporan Kegiatan
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="date" name="tanggal" required value={kegiatanData.tanggal} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Mulai</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input type="time" name="waktuMulai" required value={kegiatanData.waktuMulai} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Selesai <span className="text-slate-400 text-xs font-normal">(Opsional)</span></label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input type="time" name="waktuSelesai" value={kegiatanData.waktuSelesai} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="text" name="lokasi" required placeholder="Contoh: Terminal D" value={kegiatanData.lokasi} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Kegiatan</label>
            <div className="relative">
              <ClipboardList className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <textarea name="kegiatan" required placeholder="Contoh: Mendampingi Audit dari Otban" rows={3} value={kegiatanData.kegiatan} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>
          </div>
        </div>
      </div>

      <PhotoUploader 
        photos={photos}
        onUpload={handlePhotoUpload}
        onRemove={removePhoto}
        onZoom={updatePhotoZoom}
        onDrop={handlePhotoDrop}
        listType="general"
        onOpenEditor={() => setIsEditorOpen(true)}
      />

      {customCollageUrl && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="text-sm font-bold text-blue-800 mb-2">Preview Kolase Kustom:</h3>
          <img src={customCollageUrl} alt="Custom Collage" className="w-full max-w-sm rounded-lg shadow-sm border border-slate-200" />
          <button type="button" onClick={() => { setCustomCollageUrl(null); setCustomCollageFile(null); }} className="mt-2 text-xs text-red-600 font-semibold hover:text-red-700">Hapus Kolase Kustom</button>
        </div>
      )}
      {!customCollageUrl && <LiveCollagePreview photos={photos} />}

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'}`}>
          {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Kegiatan ke WA</>}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Kegiatan (Real-time)
        </h3>
        <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
          <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
            {generateWA_Kegiatan(kegiatanData)}
          </div>
        </div>
      </div>
      
      <Suspense fallback={null}>
        <CollageEditor 
          photos={photos} 
          isOpen={isEditorOpen} 
          onClose={() => setIsEditorOpen(false)} 
          onSave={(file, url) => {
            setCustomCollageFile(file);
            setCustomCollageUrl(url);
            setIsEditorOpen(false);
          }}
        />
      </Suspense>
    </form>
  );
};
