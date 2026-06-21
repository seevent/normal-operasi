import React, { useState } from 'react';
import { Box, Calendar, MapPin, Hash, AlertCircle, Share2, CheckCircle, FileText } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { PhotoUploader, Photo } from '../shared/PhotoUploader';
import { getStoringValidLocations, getStoringValidNumbers } from '../../lib/utils/locationRules';
import { generateWA_Storing } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { processPhotosToCollage } from '../../lib/utils/canvasUtils';
import { lazy, Suspense } from 'react';

const CollageEditor = lazy(() => import('../shared/CollageEditor').then(m => ({ default: m.CollageEditor })));

export const TabStoring: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { jenisPeralatanData, storingLocAc, storingLocDefault } = useMasterDataStore();

  const storingEquipments = Array.from(new Set(jenisPeralatanData.map(j => j.nama)));

  const [storingData, setStoringData] = useState({
    tanggal: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
    waktuMulai: '',
    waktuSelesai: '',
    peralatan: [] as string[],
    lokasi: '',
    nomor: '',
    hasil: 'Normal Operasi'
  });

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customCollageFile, setCustomCollageFile] = useState<File | null>(null);
  const [customCollageUrl, setCustomCollageUrl] = useState<string | null>(null);

  // === Handlers ===
  const handleStoringChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStoringData(prev => ({ ...prev, [name]: value }));
  };

  const handleStoringEquipToggle = (equip: string) => {
    setStoringData(prev => {
      let newPeralatan = [...prev.peralatan];
      if (newPeralatan.includes(equip)) {
        newPeralatan = newPeralatan.filter(e => e !== equip);
      } else {
        newPeralatan.push(equip);
      }
      
      // Reset lokasi & nomor jika kombinasi peralatan berubah drastis
      return { ...prev, peralatan: newPeralatan, lokasi: '', nomor: '' };
    });
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
  const handleStoringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let generatedCollageFile: File | null = customCollageFile;
    let generatedCollageUrl: string | null = customCollageUrl;

    if (photos.length > 0 && !generatedCollageFile) {
      // Create fallback collage
      const collageResult = await processPhotosToCollage(photos);
      if (collageResult) {
        generatedCollageUrl = collageResult.url;
        const res = await fetch(collageResult.url);
        const blob = await res.blob();
        generatedCollageFile = new File([blob], `Dokumentasi_Storing_${Date.now()}.jpg`, { type: 'image/jpeg' });
      }
    }

    const message = generateWA_Storing(storingData);
    
    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });

    if (generatedCollageUrl) {
      // Optional: Store to global context if needed
    }
  };

  return (
    <form onSubmit={handleStoringSubmit} className="p-6 sm:p-8 space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b pb-2">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-600" /> Detail Kegiatan Storing
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="date" name="tanggal" required value={storingData.tanggal} onChange={handleStoringChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Mulai</label>
            <input type="time" name="waktuMulai" required value={storingData.waktuMulai} onChange={handleStoringChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Selesai</label>
            <input type="time" name="waktuSelesai" required value={storingData.waktuSelesai} onChange={handleStoringChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Peralatan <span className="text-xs text-slate-400">(Bisa pilih lebih dari 1)</span></label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {storingEquipments.map(equip => {
                const isACChecked = storingData.peralatan.includes('Access Control');
                const isChecked = storingData.peralatan.includes(equip);
                const isDisabled = isACChecked && equip !== 'Access Control';

                return (
                  <label 
                    key={equip} 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      isChecked ? 'bg-blue-50 border-blue-500 shadow-sm' : 
                      isDisabled ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => handleStoringEquipToggle(equip)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className={`ml-2 text-sm font-medium ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>
                      {equip}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <select 
                  name="lokasi" 
                  required 
                  value={storingData.lokasi} 
                  onChange={handleStoringChange} 
                  disabled={storingData.peralatan.length === 0}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="">- Pilih Lokasi -</option>
                  {getStoringValidLocations(storingData.peralatan, storingLocAc, storingLocDefault).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {storingData.peralatan.includes('Access Control') && (storingData.lokasi.includes('Avio') || storingData.lokasi.includes('Rampout')) && (
                <div className="w-1/3 relative">
                  <Hash className="absolute left-2.5 top-2.5 h-5 w-5 text-slate-400" />
                  <select 
                    name="nomor" 
                    required 
                    value={storingData.nomor} 
                    onChange={handleStoringChange} 
                    className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="">- No -</option>
                    {getStoringValidNumbers(storingData.lokasi).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Hasil</label>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="text" name="hasil" required value={storingData.hasil} onChange={handleStoringChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
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

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'}`}>
          {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Storing ke WA</>}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Storing (Real-time)
        </h3>
        <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
          <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
            {generateWA_Storing(storingData)}
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
