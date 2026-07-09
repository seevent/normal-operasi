import React, { useState } from 'react';
import { Megaphone, Calendar, MapPin, ClipboardList, Share2, CheckCircle, FileText } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PhotoUploader, Photo } from '../shared/PhotoUploader';
import { generateWA_Briefing } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { processPhotosToCollage, compressImageFile } from '../../lib/utils/canvasUtils';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';

export const TabBriefing: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();

  const [briefingData, setBriefingData] = useState(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeInMinutes = currentHour * 60 + currentMinute;
    
    // Shift changes at 07:30 (450 mins) and 19:30 (1170 mins)
    const isPagi = timeInMinutes >= 450 && timeInMinutes < 1170;
    
    const logicalDateObj = new Date(now.getTime());
    if (timeInMinutes < 450) {
      logicalDateObj.setDate(logicalDateObj.getDate() - 1);
    }
    const tzOffset = logicalDateObj.getTimezoneOffset() * 60000;
    const localDate = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split('T')[0];

    return {
      jenis: 'Unit', // 'Unit' | 'MOT'
      tanggal: localDate,
      shift: isPagi ? 'Pagi' : 'Malam',
      lokasi: 'Terminal 2'
    };
  });

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [autoCollageFile, setAutoCollageFile] = useState<File | null>(null);
  const [collageAnnotation, setCollageAnnotation] = useState<any>(undefined);

  const photosRef = React.useRef(photos);
  photosRef.current = photos;

  React.useEffect(() => {
    return () => {
      photosRef.current.forEach(p => {
        if (p.preview && p.preview.startsWith('blob:')) {
          URL.revokeObjectURL(p.preview);
        }
      });
    };
  }, []);

  // === Handlers ===
  const handleBriefingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBriefingData({ ...briefingData, [name]: value });
  };

  // === Photo Handlers ===
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map(f => compressImageFile(f)));
      const newPhotos = compressedResults.map(res => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
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
      newPhotos[index] = {
        ...newPhotos[index],
        zoom: Math.max(0.5, Math.min(3, currentZoom + delta))
      };
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

  const handlePhotoEdit = (index: number, updatedPhoto: any) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index] = updatedPhoto;
      return newPhotos;
    });
  };

  // === Submit ===
  const handleBriefingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let generatedCollageFile: File | null = null;

    if (photos.length > 0) {
      if (photos.length === 1) {
        generatedCollageFile = photos[0].file || null;
      } else {
        if (autoCollageFile) {
          generatedCollageFile = autoCollageFile;
        } else {
          const collageResult = await processPhotosToCollage(photos, collageAnnotation);
          if (collageResult) {
            generatedCollageFile = collageResult.file;
          }
        }
      }
    }

    const message = generateWA_Briefing(briefingData);
    
    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });

    if (generatedCollageUrl) {
      // Optional: Store to global context if needed
    }
  };

  return (
    <form onSubmit={handleBriefingSubmit} className="p-6 sm:p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
          <Megaphone className="w-5 h-5 text-blue-600" /> Detail Briefing
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Briefing</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex-1 hover:bg-blue-50 transition-colors">
                <input type="radio" name="jenis" value="Unit" checked={briefingData.jenis === 'Unit'} onChange={handleBriefingChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-semibold text-slate-700">Briefing Unit SSES T2</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex-1 hover:bg-blue-50 transition-colors">
                <input type="radio" name="jenis" value="MOT" checked={briefingData.jenis === 'MOT'} onChange={handleBriefingChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-semibold text-slate-700">Briefing MOT T2</span>
              </label>
            </div>
            
            {briefingData.jenis === 'MOT' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 animate-fadeIn shadow-sm">
                <div className="p-2 bg-white text-blue-600 rounded-lg shrink-0 border border-blue-100 shadow-sm">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm text-slate-700 font-bold block mb-0.5">Link Absensi :</span>
                  <a 
                    href="https://bit.ly/4h3EYMY?r=qr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline break-all"
                  >
                    https://bit.ly/4h3EYMY?r=qr
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PhotoUploader 
        photos={photos}
        onUpload={handlePhotoUpload}
        onRemove={removePhoto}
        onZoom={updatePhotoZoom}
        onDrop={handlePhotoDrop}
        onEdit={handlePhotoEdit}
        listType="general"
      />

      <LiveCollagePreview 
        photos={photos} 
        onCollageChange={(file, _url, annotation) => {
          setAutoCollageFile(file);
          setCollageAnnotation(annotation);
        }} 
      />

      <div className="space-y-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="date" name="tanggal" required value={briefingData.tanggal} onChange={handleBriefingChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
            <select name="shift" value={briefingData.shift} onChange={handleBriefingChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
              <option value="Pagi">Pagi</option>
              <option value="Malam">Malam</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="text" name="lokasi" required value={briefingData.lokasi} onChange={handleBriefingChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'}`}>
          {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Briefing ke WA</>}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Briefing (Real-time)
        </h3>
        <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
          <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
            {generateWA_Briefing(briefingData)}
          </div>
        </div>
      </div>
    </form>
  );
};
