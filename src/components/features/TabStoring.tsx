import React, { useState, useRef, useMemo } from 'react';
import { Calendar, AlertCircle, Share2, CheckCircle, FileText, User, RefreshCw, MapPin, Check, Sparkles } from 'lucide-react';
import { MonitorSearchIcon } from '../shared/MonitorSearchIcon';
import { useAppStore } from '../../store/useAppStore';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { PhotoUploader, Photo } from '../shared/PhotoUploader';
import { getGeneralLokasiOptions, getAcNomorOptions, checkNeedsStoringSupervisorAvsec, getStoringSupervisorLocations } from '../../lib/utils/locationRules';
import { generateWA_Storing } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { saveStoringToChecklistSync } from '../../lib/services/checklistSyncService';
import { processPhotosToCollage, compressImageFile } from '../../lib/utils/canvasUtils';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';
import { uploadPhotoToCloudinary } from '../../lib/services/cloudinaryService';
import { saveOperationalLog, getOperationalShiftAndDate } from '../../lib/services/operationalReportService';
import { buildLocationEquipmentMap, deriveStoringEquipment } from '../../lib/utils/storingLokasi';

type StoringMode = 'lokasi' | 'Access Control' | 'Mirroring X-Ray';

const MODE_OPTIONS: Array<{ id: StoringMode; label: string }> = [
  { id: 'lokasi', label: 'Per Lokasi' },
  { id: 'Access Control', label: 'Access Control' },
  { id: 'Mirroring X-Ray', label: 'Mirroring X-Ray' },
];

const EQUIP_CHIP_STYLE: Record<string, string> = {
  'x-ray': 'bg-blue-100 text-blue-700 border-blue-200',
  'wtmd': 'bg-violet-100 text-violet-700 border-violet-200',
  'hhmd': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'body scanner': 'bg-amber-100 text-amber-700 border-amber-200',
  'etd': 'bg-rose-100 text-rose-700 border-rose-200',
  'extension conveyor': 'bg-teal-100 text-teal-700 border-teal-200',
};
const equipChipStyle = (equip: string) => EQUIP_CHIP_STYLE[equip.trim().toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200';

export const TabStoring: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { penempatanData } = useMasterDataStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const locationMap = useMemo(() => buildLocationEquipmentMap(penempatanData), [penempatanData]);
  const [mode, setMode] = useState<StoringMode>('lokasi');
  const [excluded, setExcluded] = useState<string[]>([]);

  const [storingData, setStoringData] = useState({
    tanggal: getOperationalShiftAndDate().date,
    waktuMulai: '',
    waktuSelesai: '',
    peralatan: [] as string[],
    lokasi: '',
    acLokasi: [] as string[],
    acNomor: {} as Record<string, string>,
    nomor: '',
    hasil: 'Normal Operasi',
    supervisorAvsec: '',
    supervisorAvsecMap: {} as Record<string, string>
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
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (name === 'waktuMulai' && value) {
      if (storingData.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Mulai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === 'waktuSelesai' && value) {
      if (storingData.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === 'tanggal' && value) {
      let resetWaktuMulai = false;
      let resetWaktuSelesai = false;
      if (value === todayStr) {
        if (storingData.waktuMulai && storingData.waktuMulai > currentTimeStr) resetWaktuMulai = true;
        if (storingData.waktuSelesai && storingData.waktuSelesai > currentTimeStr) resetWaktuSelesai = true;
        if (resetWaktuMulai || resetWaktuSelesai) {
          alert(`Pukul direset karena melebihi waktu saat ini (${currentTimeStr})`);
          setStoringData(prev => ({
            ...prev,
            tanggal: value,
            ...(resetWaktuMulai ? { waktuMulai: '' } : {}),
            ...(resetWaktuSelesai ? { waktuSelesai: '' } : {})
          }));
          return;
        }
      }
    }
    setStoringData(prev => ({ ...prev, [name]: value }));
  };

  // Setelah lokasi/nomor/pengecualian berubah: peralatan (mode Per Lokasi) dihitung ulang dan
  // Supervisor Avsec dibersihkan bila tidak lagi diperlukan.
  const applyLocations = (
    prev: typeof storingData,
    newLocs: string[],
    newNomor: Record<string, string>,
    nextExcluded: string[] = excluded
  ) => {
    const peralatan = mode === 'lokasi' ? deriveStoringEquipment(newLocs, locationMap, nextExcluded) : prev.peralatan;
    const needSupervisor = checkNeedsStoringSupervisorAvsec(peralatan, newLocs, newNomor);
    return {
      ...prev,
      acLokasi: newLocs,
      acNomor: newNomor,
      peralatan,
      supervisorAvsec: needSupervisor ? prev.supervisorAvsec : ''
    };
  };

  const handleModeChange = (next: StoringMode) => {
    if (next === mode) return;
    setMode(next);
    setExcluded([]);
    setStoringData(prev => ({
      ...prev,
      peralatan: next === 'lokasi' ? [] : [next],
      lokasi: '',
      acLokasi: [],
      acNomor: {},
      nomor: '',
      supervisorAvsec: '',
      supervisorAvsecMap: {}
    }));
  };

  const toggleLocation = (loc: string) => {
    const exists = (storingData.acLokasi || []).includes(loc);
    const newLocs = exists ? storingData.acLokasi.filter(l => l !== loc) : [...(storingData.acLokasi || []), loc];
    const newNomor = { ...(storingData.acNomor || {}) };
    const nomorOpts = getAcNomorOptions(loc);
    if (!exists && nomorOpts.length > 0) newNomor[loc] = nomorOpts[0];
    else if (exists) delete newNomor[loc];
    const nextExcluded = newLocs.length === 0 ? [] : excluded;
    if (nextExcluded !== excluded) setExcluded(nextExcluded);
    setStoringData(prev => applyLocations(prev, newLocs, newNomor, nextExcluded));
  };

  const changeLocationNomor = (loc: string, value: string) => {
    setStoringData(prev => applyLocations(prev, prev.acLokasi, { ...(prev.acNomor || {}), [loc]: value }));
  };

  const toggleExcludedEquipment = (equip: string) => {
    const next = excluded.includes(equip) ? excluded.filter(e => e !== equip) : [...excluded, equip];
    setExcluded(next);
    setStoringData(prev => applyLocations(prev, prev.acLokasi, prev.acNomor, next));
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

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    const unlock = () => {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (storingData.tanggal === todayStr && storingData.waktuSelesai && storingData.waktuSelesai > currentTimeStr) {
      alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
      unlock();
      return;
    }
    
    if (storingData.peralatan.length > 0 && (storingData.acLokasi || []).length === 0) {
      alert("Pastikan Anda memilih minimal 1 lokasi untuk peralatan terpilih!");
      unlock();
      return;
    }
    
    let generatedCollageFile: File | null = null;
    const finalFilesToShare: File[] = [];

    if (photos.length > 0) {
      const imagePhotos = photos.filter(p => !p.file?.type?.startsWith('video/'));
      const videoFiles = photos.filter(p => p.file?.type?.startsWith('video/')).map(p => p.file);

      if (imagePhotos.length === 1) {
        generatedCollageFile = imagePhotos[0].file || null;
      } else if (imagePhotos.length > 1) {
        if (autoCollageFile) {
          generatedCollageFile = autoCollageFile;
        } else {
          const collageResult = await processPhotosToCollage(imagePhotos, collageAnnotation);
          if (collageResult) {
            generatedCollageFile = collageResult.file;
          }
        }
      }
      if (generatedCollageFile) finalFilesToShare.push(generatedCollageFile);
      if (videoFiles.length > 0) finalFilesToShare.push(...videoFiles);
    }

    // Jalankan upload Cloudinary, simpan Supabase, dan sync checklist di background secara non-blocking
    // agar User Gesture browser tidak kedaluwarsa sehingga WhatsApp langsung terbuka dengan media
    (async () => {
      const uploadedPhotoUrls: string[] = [];
      if (finalFilesToShare.length > 0) {
        for (const file of finalFilesToShare) {
          try {
            const res = await uploadPhotoToCloudinary(file, `Storing_${storingData.peralatan.join('_')}_${Date.now()}.jpg`);
            if (res && res.status === 'success' && res.url) {
              uploadedPhotoUrls.push(res.url);
            } else if (res && res.status === 'error') {
              console.error("Upload Cloudinary gagal:", res.message);
              alert(`⚠️ Foto gagal disimpan ke Cloudinary:\n${res.message}`);
            }
          } catch (e) {
            console.error("Gagal upload foto storing ke Cloudinary:", e);
            alert(`⚠️ Foto gagal disimpan ke Cloudinary:\n${(e as Error).message}`);
          }
        }
      }

      try {
        const { date: opDate, shift: opShift } = getOperationalShiftAndDate();
        const locString = (storingData.acLokasi && storingData.acLokasi.length > 0)
          ? storingData.acLokasi.join(', ')
          : (storingData.lokasi ? `${storingData.lokasi} ${storingData.nomor || ''}`.trim() : 'Terminal 2');

        const waktuRange = `${storingData.waktuMulai || ''}${storingData.waktuSelesai ? ' - ' + storingData.waktuSelesai : ''}`;

        await saveOperationalLog({
          tanggal: storingData.tanggal || opDate,
          shift: opShift,
          jenis: 'Storing',
          waktu: waktuRange,
          lokasi: locString,
          peralatan: storingData.peralatan.join(', ') || 'All Faskampen',
          kategori_maintenance: 'STORING',
          uraian: `Storing Peralatan: ${storingData.peralatan.join(', ')}`,
          tindak_lanjut: storingData.hasil || 'Storing Peralatan',
          status: storingData.hasil || 'Normal',
          foto_urls: uploadedPhotoUrls
        });
      } catch (dbErr) {
        console.error("Gagal menyimpan data storing ke database:", dbErr);
      }

      saveStoringToChecklistSync({
        supervisorAvsec: storingData.supervisorAvsec,
        supervisorAvsecMap: storingData.supervisorAvsecMap,
        acLokasi: storingData.acLokasi,
        acNomor: storingData.acNomor,
        waktuMulai: storingData.waktuMulai,
        waktuSelesai: storingData.waktuSelesai
      });
    })();

    const message = generateWA_Storing(storingData);

    try {
      await shareToWhatsApp(message, finalFilesToShare.length > 0 ? finalFilesToShare : null, () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      });
    } finally {
      setTimeout(unlock, 2500);
    }
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
            <input 
              type="time" 
              name="waktuMulai" 
              required 
              max={storingData.tanggal === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined} 
              value={storingData.waktuMulai} 
              onChange={handleStoringChange} 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Selesai</label>
            <input 
              type="time" 
              name="waktuSelesai" 
              required 
              max={storingData.tanggal === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined} 
              value={storingData.waktuSelesai} 
              onChange={handleStoringChange} 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Storing</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200" role="tablist">
              {MODE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === opt.id}
                  onClick={() => handleModeChange(opt.id)}
                  className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    mode === opt.id ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <div className="flex items-end justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Lokasi <span className="text-xs text-slate-400 font-normal">(Pilih 1 atau lebih)</span>
              </label>
              {storingData.acLokasi.length > 0 && (
                <span className="text-xs font-semibold text-blue-600">{storingData.acLokasi.length} dipilih</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(() => {
                const locOpts = mode === 'lokasi' ? Array.from(locationMap.keys()) : getGeneralLokasiOptions(mode);

                if (locOpts.length === 0) {
                  return (
                    <div className="col-span-full p-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm text-center">
                      Data lokasi belum tersedia di database.
                    </div>
                  );
                }

                return locOpts.map((loc: string) => {
                  const isChecked = (storingData.acLokasi || []).includes(loc);
                  const nomorOpts = getAcNomorOptions(loc);
                  const equipHere = mode === 'lokasi' ? (locationMap.get(loc) || []) : [];

                  return (
                    <div
                      key={loc}
                      className={`rounded-xl border transition-all ${
                        isChecked ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <label className="flex items-start gap-2.5 p-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleLocation(loc)}
                          className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="flex-1 min-w-0">
                          <span className={`flex items-center gap-1 text-sm ${isChecked ? 'font-bold text-blue-800' : 'font-semibold text-slate-700'}`}>
                            <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? 'text-blue-500' : 'text-slate-400'}`} />
                            <span className="truncate" title={loc}>{loc}</span>
                          </span>
                          {equipHere.length > 0 && (
                            <span className="mt-1.5 flex flex-wrap gap-1">
                              {equipHere.map(eq => (
                                <span key={eq} className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold leading-none ${equipChipStyle(eq)}`}>{eq}</span>
                              ))}
                            </span>
                          )}
                        </span>
                      </label>

                      {isChecked && nomorOpts.length > 0 && (
                        <div className="flex items-center gap-2 px-3 pb-3 -mt-1">
                          <span className="text-[11px] font-semibold text-slate-500">Nomor</span>
                          <select
                            value={(storingData.acNomor || {})[loc] || nomorOpts[0]}
                            onChange={(e) => changeLocationNomor(loc, e.target.value)}
                            className="flex-1 text-xs py-1 px-2 bg-white border border-blue-300 rounded-lg text-blue-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
                          >
                            {nomorOpts.map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Peralatan</label>
              {mode === 'lokasi' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <Sparkles className="w-3.5 h-3.5" /> Otomatis dari lokasi terpilih
                </span>
              )}
            </div>
            {mode === 'lokasi' ? (() => {
              const available = deriveStoringEquipment(storingData.acLokasi, locationMap);
              if (available.length === 0) {
                return (
                  <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 text-center">
                    Pilih lokasi, peralatannya akan tercentang otomatis.
                  </div>
                );
              }
              return (
                <>
                  <div className="flex flex-wrap gap-2">
                    {available.map(equip => {
                      const isOn = !excluded.includes(equip);
                      return (
                        <button
                          key={equip}
                          type="button"
                          aria-pressed={isOn}
                          onClick={() => toggleExcludedEquipment(equip)}
                          className={`inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full border text-sm font-semibold transition-all ${
                            isOn ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' : 'bg-white border-slate-300 text-slate-400 line-through'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${isOn ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>
                            {isOn && <Check className="w-3 h-3" strokeWidth={3} />}
                          </span>
                          {equip}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Ketuk peralatan untuk mengecualikannya dari laporan.</p>
                </>
              );
            })() : (
              <div className="inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full border bg-emerald-50 border-emerald-500 text-emerald-800 text-sm font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="w-3 h-3" strokeWidth={3} /></span>
                {mode}
              </div>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Hasil</label>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="text" name="hasil" required value={storingData.hasil} onChange={handleStoringChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
            </div>
          </div>

          {(() => {
            const supervisorLocs = getStoringSupervisorLocations(storingData.peralatan, storingData.acLokasi, storingData.acNomor);

            if (supervisorLocs.length === 0) return null;

            return (
              <div className="col-span-2 space-y-3">
                {supervisorLocs.map((locKey) => {
                  const labelText = `Supervisor Avsec ${locKey}`;
                  const currentValue = (storingData.supervisorAvsecMap || {})[locKey] || (supervisorLocs.length === 1 ? storingData.supervisorAvsec : '');

                  return (
                    <div key={locKey}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{labelText}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStoringData(prev => {
                              const newMap = { ...(prev.supervisorAvsecMap || {}), [locKey]: val };
                              const firstVal = Object.values(newMap)[0] || '';
                              return {
                                ...prev,
                                supervisorAvsecMap: newMap,
                                supervisorAvsec: firstVal
                              };
                            });
                          }}
                          placeholder={`Nama ${labelText}`}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${
            isSubmitting
              ? 'bg-emerald-600 opacity-70 cursor-not-allowed text-white'
              : isCopied
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]'
              : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-6 h-6 animate-spin" /> Memproses Share...
            </>
          ) : isCopied ? (
            <>
              <CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!
            </>
          ) : (
            <>
              <Share2 className="w-6 h-6" /> Share Storing ke WA
            </>
          )}
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
