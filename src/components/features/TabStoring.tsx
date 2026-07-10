import React, { useState } from 'react';
import { Calendar, AlertCircle, Share2, CheckCircle, FileText, User } from 'lucide-react';
import { MonitorSearchIcon } from '../shared/MonitorSearchIcon';
import { useAppStore } from '../../store/useAppStore';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { PhotoUploader, Photo } from '../shared/PhotoUploader';
import { getStoringValidLocations, getGeneralLokasiOptions, getAcNomorOptions } from '../../lib/utils/locationRules';
import { generateWA_Storing } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { syncToGoogleSheets } from '../../lib/services/sheetsSyncService';
import { processPhotosToCollage, compressImageFile } from '../../lib/utils/canvasUtils';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';

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
    acLokasi: [] as string[],
    acNomor: {} as Record<string, string>,
    nomor: '',
    hasil: 'Normal Operasi',
    supervisorAvsec: ''
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
  const handleStoringChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'waktuSelesai' && value) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (storingData.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === 'tanggal' && value) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (value === todayStr && storingData.waktuSelesai && storingData.waktuSelesai > currentTimeStr) {
        alert(`Pukul Selesai direset karena melebihi waktu saat ini (${currentTimeStr})`);
        setStoringData(prev => ({ ...prev, tanggal: value, waktuSelesai: '' }));
        return;
      }
    }
    setStoringData(prev => ({ ...prev, [name]: value }));
  };

  const handleStoringEquipToggle = (equip: string) => {
    setStoringData(prev => {
      let newPeralatan = [...prev.peralatan];
      if (newPeralatan.includes(equip)) {
        newPeralatan = newPeralatan.filter(e => e !== equip);
      } else {
        if (equip === 'Access Control') {
          newPeralatan = ['Access Control'];
        } else if (!newPeralatan.includes('Access Control')) {
          newPeralatan.push(equip);
        }
      }
      
      // Reset lokasi & nomor jika kombinasi peralatan berubah drastis
      return { ...prev, peralatan: newPeralatan, lokasi: '', acLokasi: [], acNomor: {}, nomor: '' };
    });
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
  const handleStoringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (storingData.tanggal === todayStr && storingData.waktuSelesai && storingData.waktuSelesai > currentTimeStr) {
      alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
      return;
    }
    
    if (storingData.peralatan.length > 0 && (storingData.acLokasi || []).length === 0) {
      alert("Pastikan Anda memilih minimal 1 lokasi untuk peralatan terpilih!");
      return;
    }
    
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

    const message = generateWA_Storing(storingData);
    
    const waktuFull = storingData.waktuSelesai ? `${storingData.waktuMulai} - ${storingData.waktuSelesai}` : storingData.waktuMulai;
    const lokasiFull = storingData.lokasi || (storingData.acLokasi && storingData.acLokasi.length > 0 ? storingData.acLokasi.join(', ') : '-');
    const alatFull = storingData.peralatan.join(', ') || 'Peralatan';

    syncToGoogleSheets({
      jenis: 'Storing',
      tanggal: storingData.tanggal,
      waktu: waktuFull,
      lokasi: lokasiFull,
      peralatan: alatFull,
      uraian: `Kegiatan Storing : ${alatFull}${storingData.supervisorAvsec ? `\nSupervisor Avsec : ${storingData.supervisorAvsec}` : ''}`,
      tindakLanjut: '-',
      status: storingData.hasil || 'Normal Operasi',
      imageFile: generatedCollageFile
    });

    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  return (
    <form onSubmit={handleStoringSubmit} className="p-6 sm:p-8 space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b pb-2">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <MonitorSearchIcon className="w-5 h-5 text-blue-600" /> Detail Kegiatan Storing
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
            <input type="time" name="waktuSelesai" required max={storingData.tanggal === new Date().toISOString().split('T')[0] ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined} value={storingData.waktuSelesai} onChange={handleStoringChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lokasi{storingData.peralatan.length > 0 && <span className="text-xs text-slate-400 font-normal"> (Pilih 1 atau lebih)</span>}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {(() => {
                const locOpts = storingData.peralatan.includes('Access Control')
                  ? getGeneralLokasiOptions('Access Control')
                  : getStoringValidLocations(storingData.peralatan, storingLocAc, storingLocDefault);

                if (locOpts.length === 0) {
                  return (
                    <div className="col-span-full p-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm text-center">
                      {storingData.peralatan.length === 0 ? "Pilih peralatan terlebih dahulu untuk melihat daftar lokasi." : "Data lokasi belum tersedia di database."}
                    </div>
                  );
                }

                return locOpts.map((loc: string) => {
                  const isChecked = (storingData.acLokasi || []).includes(loc);
                  const nomorOpts = getAcNomorOptions(loc);

                  return (
                    <div
                      key={loc}
                      className={`flex items-center justify-between p-2 border rounded-lg transition-colors ${
                        isChecked ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <label className="flex items-center cursor-pointer flex-1 min-w-0 mr-1.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setStoringData(prev => {
                              const exists = (prev.acLokasi || []).includes(loc);
                              const newLocs = exists ? (prev.acLokasi || []).filter(l => l !== loc) : [...(prev.acLokasi || []), loc];
                              const newNomor = { ...(prev.acNomor || {}) };
                              if (!exists && nomorOpts.length > 0) {
                                newNomor[loc] = nomorOpts[0];
                              } else if (exists) {
                                delete newNomor[loc];
                              }
                              return { ...prev, acLokasi: newLocs, acNomor: newNomor };
                            });
                          }}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className={`ml-2 text-xs truncate select-none ${isChecked ? 'font-semibold text-blue-700' : 'text-slate-700'}`} title={loc}>
                          {loc}
                        </span>
                      </label>

                      {isChecked && nomorOpts.length > 0 && (
                        <select
                          value={(storingData.acNomor || {})[loc] || nomorOpts[0]}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStoringData(prev => ({
                              ...prev,
                              acNomor: { ...(prev.acNomor || {}), [loc]: val }
                            }));
                          }}
                          className="text-xs py-1 px-1 bg-white border border-blue-300 rounded text-blue-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0 cursor-pointer shadow-sm"
                        >
                          {nomorOpts.map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Hasil</label>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="text" name="hasil" required value={storingData.hasil} onChange={handleStoringChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor Avsec</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="text" name="supervisorAvsec" value={storingData.supervisorAvsec} onChange={handleStoringChange} placeholder="Nama Supervisor Avsec" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
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
    </form>
  );
};
