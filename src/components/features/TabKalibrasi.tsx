import React, { useState, useRef } from 'react';
import { Clock, Calendar, MapPin, Trash2, Cpu, Plus, Share2, CheckCircle, FileText, Camera, Move, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppStore, sayPet } from '../../store/useAppStore';
import { buildMissingFieldsMessage } from '../../lib/data/petMessages';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { getValidXRayModels, getValidModels, getGeneralLokasiOptions, getIntersectedLocations, getLokasi2Options } from '../../lib/utils/locationRules';
import { generateWA_Kalibrasi, formatKalibrasiEntryKegiatanDanCatatan } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { processPhotosToCollage, compressImageFile } from '../../lib/utils/canvasUtils';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';
import { PhotoUploader } from '../shared/PhotoUploader';
import { saveOperationalLog, getOperationalShiftAndDate } from '../../lib/services/operationalReportService';
import { uploadPhotoToCloudinary } from '../../lib/services/cloudinaryService';
import { KalibrasiParameterFields } from './kalibrasi/KalibrasiParameterFields';
import { formatLokasi, normalizeLokasi } from '../../lib/utils/lokasiFormat';

export const TabKalibrasi: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { jenisPeralatanData } = useMasterDataStore();
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  
  const kalibrasiEquipments = jenisPeralatanData && jenisPeralatanData.length > 0
    ? jenisPeralatanData
        .filter((j: any) => j.tampil_di_kalibrasi)
        .map((j: any) => j.nama)
    : ['X-Ray', 'WTMD', 'HHMD', 'Body Scanner', 'ETD', 'Access Control', 'Extension Conveyor'];

  // === STATE UNTUK TAB 5: KALIBRASI (MULTI LOKASI) ===
  const createEmptyKalibrasiEntry = () => ({
    id: Date.now() + Math.random(),
    peralatan: [] as string[], 
    xrayModel: 'Semua X-Ray', 
    wtmdModel: 'Semua WTMD',
    hhmdModel: 'Semua HHMD',
    bsModel: 'Semua Body Scanner',
    etdModel: 'Semua ETD',
    ecGearbox: 'Normal',
    ecTension: 'Normal',
    ecBelt: 'Normal',
    lokasi1: '', lokasi2: '',
    acLokasi: [] as string[],
    acEmlock: 'Berfungsi', acIntercom: 'Berfungsi', acFingerprint: 'Berfungsi', acCctv: 'Berfungsi', acPengontrolan: 'Berfungsi', acRecordCctv: '+- 1 bulan',
    xrayKvV: '', xrayKvH: '', xrayMaV: '', xrayMaH: '', xrayOnV: '', xrayOnH: '', xrayArchive: '+- 1 bulan',
    wtmdZ1: '', wtmdZ2: '', wtmdZ3: '', wtmdZ4: '', wtmdLc: '', wtmdLs: '', wtmdUc: '', wtmdSe: '', wtmdDs: '',
    bsSuspect: 'Normal', bsMonitor: 'Normal', bsScanning: 'Normal', bsCalibration: 'Normal',
    etdTnt: 'Alarm', etdPetn: 'Alarm', etdRdx: 'Alarm',
  });

  const [kalibrasiGlobal, setKalibrasiGlobal] = useState({
    tanggal: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
    waktuMulai: '',
    waktuSelesai: ''
  });
  const [kalibrasiEntries, setKalibrasiEntries] = useState([createEmptyKalibrasiEntry()]);

  // === STATE UNTUK FOTO KALIBRASI (MULTI KOLASE) ===
  const [kalibrasiPhotoGroups, setKalibrasiPhotoGroups] = useState<any[]>([
    { id: Date.now(), photos: [] as any[], isGenerating: false, autoCollageFile: null, collageAnnotation: undefined }
  ]);

  const photoGroupsRef = React.useRef(kalibrasiPhotoGroups);
  photoGroupsRef.current = kalibrasiPhotoGroups;

  React.useEffect(() => {
    return () => {
      photoGroupsRef.current.forEach(group => {
        group.photos.forEach((p: any) => {
          if (p.preview && p.preview.startsWith('blob:')) {
            URL.revokeObjectURL(p.preview);
          }
        });
      });
    };
  }, []);

  const handleKalibrasiGlobalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (name === 'waktuMulai' && value) {
      if (kalibrasiGlobal.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Mulai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === 'waktuSelesai' && value) {
      if (kalibrasiGlobal.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === 'tanggal' && value) {
      let resetWaktuMulai = false;
      let resetWaktuSelesai = false;
      if (value === todayStr) {
        if (kalibrasiGlobal.waktuMulai && kalibrasiGlobal.waktuMulai > currentTimeStr) resetWaktuMulai = true;
        if (kalibrasiGlobal.waktuSelesai && kalibrasiGlobal.waktuSelesai > currentTimeStr) resetWaktuSelesai = true;
        if (resetWaktuMulai || resetWaktuSelesai) {
          alert(`Pukul direset karena melebihi waktu saat ini (${currentTimeStr})`);
          setKalibrasiGlobal(prev => ({
            ...prev,
            tanggal: value,
            ...(resetWaktuMulai ? { waktuMulai: '' } : {}),
            ...(resetWaktuSelesai ? { waktuSelesai: '' } : {})
          }));
          return;
        }
      }
    }
    setKalibrasiGlobal(prev => ({ ...prev, [name]: value }));
  };

  const handleKalibrasiEntryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setKalibrasiEntries(prev => {
      const newEntries = [...prev];
      const updated = { ...newEntries[index], [name]: value };
      if (name === 'lokasi1') {
        updated.lokasi2 = ''; 
      }

      const l1 = updated.lokasi1;
      const l2 = name === 'lokasi1' ? '' : (name === 'lokasi2' ? value : updated.lokasi2);

      if (l1) {
        if (updated.peralatan.includes('X-Ray')) {
          const valid = getValidXRayModels(l1, l2).filter(m => !m.startsWith('Semua '));
          if (valid.length === 1) updated.xrayModel = valid[0];
          else if (!valid.includes(updated.xrayModel)) updated.xrayModel = 'Semua X-Ray';
        }
        if (updated.peralatan.includes('WTMD')) {
          const valid = getValidModels(l1, 'WTMD', l2).filter(m => !m.startsWith('Semua '));
          if (valid.length === 1) updated.wtmdModel = valid[0];
          else if (!valid.includes(updated.wtmdModel)) updated.wtmdModel = 'Semua WTMD';
        }
        if (updated.peralatan.includes('HHMD')) {
          const valid = getValidModels(l1, 'HHMD', l2).filter(m => !m.startsWith('Semua '));
          if (valid.length === 1) updated.hhmdModel = valid[0];
          else if (!valid.includes(updated.hhmdModel)) updated.hhmdModel = 'Semua HHMD';
        }
        if (updated.peralatan.includes('Body Scanner')) {
          const valid = getValidModels(l1, 'Body Scanner', l2).filter(m => !m.startsWith('Semua '));
          if (valid.length === 1) updated.bsModel = valid[0];
          else if (!valid.includes(updated.bsModel)) updated.bsModel = 'Semua Body Scanner';
        }
        if (updated.peralatan.includes('ETD')) {
          const valid = getValidModels(l1, 'ETD', l2).filter(m => !m.startsWith('Semua '));
          if (valid.length === 1) updated.etdModel = valid[0];
          else if (!valid.includes(updated.etdModel)) updated.etdModel = 'Semua ETD';
        }
      }

      newEntries[index] = updated;
      return newEntries;
    });
  };

  const handleKalibrasiEquipToggle = (index: number, equip: string) => {
    setKalibrasiEntries(prev => {
      const newEntries = [...prev];
      const current = newEntries[index].peralatan;
      let newPeralatan = [...current];
      
      if (newPeralatan.includes(equip)) {
        newPeralatan = newPeralatan.filter(e => e !== equip);
      } else {
        if (equip === 'Access Control') {
          newPeralatan = ['Access Control'];
        } else if (!newPeralatan.includes('Access Control')) {
          newPeralatan.push(equip);
        }
      }
      
      newEntries[index] = { 
        ...newEntries[index], 
        peralatan: newPeralatan,
        lokasi1: '', 
        lokasi2: '',
        acLokasi: []
      };
      return newEntries;
    });
  };

  const handleKalibrasiAcLokasiToggle = (index: number, loc: string) => {
    setKalibrasiEntries(prev => {
      const newEntries = [...prev];
      const current = newEntries[index].acLokasi || [];
      const newAcLokasi = current.includes(loc)
        ? current.filter(l => l !== loc)
        : [...current, loc];
      newEntries[index] = { ...newEntries[index], acLokasi: newAcLokasi };
      return newEntries;
    });
  };

  const addKalibrasiEntry = () => {
    setKalibrasiEntries(prev => [...prev, createEmptyKalibrasiEntry()]);
  };

  const removeKalibrasiEntry = (index: number) => {
    if (kalibrasiEntries.length <= 1) return;
    setKalibrasiEntries(prev => {
      const newEntries = [...prev];
      newEntries.splice(index, 1);
      return newEntries;
    });
  };

  // === PHOTO HANDLERS ===
  const handleKalibrasiPhotoUpload = async (groupId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map(f => compressImageFile(f)));
      const newPhotos = compressedResults.map(res => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
        zoom: 1
      }));
      setKalibrasiPhotoGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return { ...group, photos: [...group.photos, ...newPhotos] };
        }
        return group;
      }));
    }
  };

  const removeKalibrasiPhoto = (groupId: number, photoIndex: number) => {
    setKalibrasiPhotoGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        URL.revokeObjectURL(newPhotos[photoIndex].preview);
        newPhotos.splice(photoIndex, 1);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };

  const updateKalibrasiPhotoZoom = (groupId: number, photoIndex: number, delta: number) => {
    setKalibrasiPhotoGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const currentZoom = newPhotos[photoIndex].zoom || 1;
        newPhotos[photoIndex] = {
          ...newPhotos[photoIndex],
          zoom: Math.max(0.5, Math.min(3, currentZoom + delta))
        };
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };

  const handleKalibrasiPhotoDrop = (e: React.DragEvent, groupId: number, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;

    setKalibrasiPhotoGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
        newPhotos.splice(targetIndex, 0, movedPhoto);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };

  const addKalibrasiPhotoGroup = () => {
    setKalibrasiPhotoGroups(prev => [...prev, { id: Date.now(), photos: [], isGenerating: false, autoCollageFile: null, collageAnnotation: undefined }]);
  };

  const removeKalibrasiPhotoGroup = (groupId: number) => {
    if (kalibrasiPhotoGroups.length <= 1) return;
    setKalibrasiPhotoGroups(prev => {
      const groupToRemove = prev.find(g => g.id === groupId);
      if (groupToRemove) {
        groupToRemove.photos.forEach((p: any) => URL.revokeObjectURL(p.preview));
      }
      return prev.filter(g => g.id !== groupId);
    });
  };

  const renderKalibrasiPhotoSection = () => (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" /> Lampiran Foto/Video
        </h2>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded w-fit">Kirim multi kolase sekaligus</span>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><Move className="w-3 h-3" /> Geser foto untuk urutkan</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {kalibrasiPhotoGroups.map((group, groupIndex) => (
          <div key={group.id} className="p-4 sm:p-5 bg-blue-50/30 border border-blue-100 rounded-xl space-y-4 relative shadow-sm">
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex-1 w-full flex items-center gap-3">
                <h3 className="font-bold text-blue-900 text-sm">Grup Kolase {groupIndex + 1}</h3>
              </div>
              {kalibrasiPhotoGroups.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeKalibrasiPhotoGroup(group.id)} 
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 self-end sm:self-center text-sm font-bold"
                >
                  <Trash2 className="w-4 h-4" /> <span className="sm:hidden">Hapus Grup</span>
                </button>
              )}
            </div>

            <PhotoUploader
              photos={group.photos}
              onUpload={(e) => handleKalibrasiPhotoUpload(group.id, e)}
              onRemove={(pIndex) => removeKalibrasiPhoto(group.id, pIndex)}
              onZoom={(pIndex, delta) => updateKalibrasiPhotoZoom(group.id, pIndex, delta)}
              onDrop={(e, targetIndex) => handleKalibrasiPhotoDrop(e, group.id, targetIndex)}
              onEdit={(pIndex, updatedPhoto) => {
                setKalibrasiPhotoGroups(prev => prev.map(g => {
                  if (g.id !== group.id) return g;
                  const newPhotos = [...g.photos];
                  newPhotos[pIndex] = updatedPhoto;
                  return { ...g, photos: newPhotos };
                }));
              }}
              listType={`kalibrasi-${group.id}`}
              hideHeader={true}
            />
            
            <LiveCollagePreview 
              photos={group.photos} 
              onCollageChange={(file, _url, annotation) => {
                setKalibrasiPhotoGroups(prev => prev.map(g => g.id === group.id ? { ...g, autoCollageFile: file, collageAnnotation: annotation } : g));
              }}
            />
          </div>
        ))}

        <button 
          type="button" 
          onClick={addKalibrasiPhotoGroup} 
          className="w-full p-5 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group flex flex-col items-center justify-center gap-1.5 text-center"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:scale-110 transition-transform flex items-center justify-center text-blue-600 shadow-sm">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-blue-700 block">Tambah Grup Kolase Baru</span>
          <span className="text-xs text-blue-500 block">Klik untuk membuat grup kolase foto baru</span>
        </button>
      </div>
    </div>
  );

  const handleKalibrasiSubmit = async (e: React.FormEvent) => {
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
    if (kalibrasiGlobal.tanggal === todayStr && kalibrasiGlobal.waktuSelesai && kalibrasiGlobal.waktuSelesai > currentTimeStr) {
      alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
      unlock();
      return;
    }

    // Global time validation check
    const hasEmptyGlobalTime = !kalibrasiGlobal.tanggal || !kalibrasiGlobal.waktuMulai || !kalibrasiGlobal.waktuSelesai;

    // Per entry parameters validation check
    const hasEmptyEntryParams = kalibrasiEntries.some(entry => {
      if (entry.peralatan.length === 0) return true;
      if (entry.peralatan.includes('Access Control')) {
        if (!entry.acLokasi || entry.acLokasi.length === 0) return true;
        if (!entry.acEmlock || !entry.acIntercom || !entry.acFingerprint || !entry.acCctv || !entry.acPengontrolan || !entry.acRecordCctv.trim()) return true;
      } else {
        if (!entry.lokasi1) return true;
      }
      
      if (entry.peralatan.includes('X-Ray')) {
        if (!entry.xrayKvV.trim() || !entry.xrayKvH.trim() || !entry.xrayMaV.trim() || !entry.xrayMaH.trim() || !entry.xrayOnV.trim() || !entry.xrayOnH.trim() || !entry.xrayArchive.trim()) return true;
      }
      if (entry.peralatan.includes('WTMD')) {
        if (!entry.wtmdZ1.trim() || !entry.wtmdZ2.trim() || !entry.wtmdZ3.trim() || !entry.wtmdZ4.trim() || !entry.wtmdLc.trim() || !entry.wtmdLs.trim() || !entry.wtmdUc.trim() || !entry.wtmdSe.trim() || !entry.wtmdDs.trim()) return true;
      }
      if (entry.peralatan.includes('Body Scanner')) {
        if (!entry.bsSuspect || !entry.bsMonitor || !entry.bsScanning || !entry.bsCalibration) return true;
      }
      if (entry.peralatan.includes('ETD')) {
        if (!entry.etdTnt || !entry.etdPetn || !entry.etdRdx) return true;
      }
      if (entry.peralatan.includes('Extension Conveyor')) {
        if (!entry.ecGearbox || !entry.ecTension || !entry.ecBelt) return true;
      }
      return false;
    });

    if (hasEmptyGlobalTime || hasEmptyEntryParams) {
      setShowErrors(true);
      const missingMessage = buildMissingFieldsMessage([
        hasEmptyGlobalTime ? 'waktu pelaksanaan kalibrasi' : '',
        hasEmptyEntryParams ? 'pemilihan peralatan & parameter kalibrasi' : '',
      ]);
      if (missingMessage) sayPet(missingMessage, 'warning');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      unlock();
      return;
    }
    
    const customFilesArray: File[] = [];
    
    // Process photos for each group
    for (let i = 0; i < kalibrasiPhotoGroups.length; i++) {
      const group: any = kalibrasiPhotoGroups[i];
      const imagePhotos = group.photos.filter((p: any) => !p.file?.type?.startsWith('video/'));
      const videoFiles = group.photos.filter((p: any) => p.file?.type?.startsWith('video/')).map((p: any) => p.file);

      if (imagePhotos.length > 1) {
        if (group.autoCollageFile) {
          customFilesArray.push(group.autoCollageFile);
        } else {
          const collageResult = await processPhotosToCollage(imagePhotos, group.collageAnnotation);
          if (collageResult && collageResult.file) {
            customFilesArray.push(collageResult.file);
          }
        }
      } else if (imagePhotos.length === 1 && imagePhotos[0]?.file) {
        customFilesArray.push(imagePhotos[0].file);
      }
      if (videoFiles.length > 0) {
        customFilesArray.push(...videoFiles);
      }
    }

    // Jalankan upload foto & simpan ke Supabase di background secara non-blocking
    // agar User Gesture browser tidak kedaluwarsa sehingga WhatsApp langsung terbuka dengan media
    (async () => {
      const uploadedPhotoUrls: string[] = [];
      const imageFiles = customFilesArray.filter(f => !f.type.startsWith('video/'));
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          try {
            const res = await uploadPhotoToCloudinary(file, `Kalibrasi_${Date.now()}.jpg`);
            if (res && res.status === 'success' && res.url) {
              uploadedPhotoUrls.push(res.url);
            } else if (res && res.status === 'error') {
              console.error("Upload foto kalibrasi gagal:", res.message);
            }
          } catch (e) {
            console.error("Gagal upload foto kalibrasi:", e);
          }
        }
      }

      try {
        const { date: opDate, shift: opShift } = getOperationalShiftAndDate();
        const waktuRange = `${kalibrasiGlobal.waktuMulai || ''} - ${kalibrasiGlobal.waktuSelesai || ''}`;

        for (const entry of kalibrasiEntries) {
          if (entry.peralatan.length === 0) continue;
          const alatStr = entry.peralatan.join(', ');
          const locStr = entry.peralatan.includes('Access Control')
            ? (normalizeLokasi(entry.acLokasi?.join(', ')) || 'Access Control')
            : formatLokasi(entry.lokasi1, entry.lokasi2);

          const { fullText } = formatKalibrasiEntryKegiatanDanCatatan(entry);

          await saveOperationalLog({
            tanggal: kalibrasiGlobal.tanggal || opDate,
            shift: opShift,
            jenis: 'Kalibrasi',
            waktu: waktuRange,
            lokasi: locStr || 'Terminal 2',
            peralatan: alatStr,
            kategori_maintenance: 'PREVENTIVE',
            uraian: fullText,
            tindak_lanjut: 'Peralatan telah dikalibrasi & normal operasi',
            status: 'Normal Operasi',
            teknisi: '-',
            foto_urls: uploadedPhotoUrls
          });
        }
      } catch (err) {
        console.error("Gagal menyimpan log kalibrasi ke Supabase:", err);
      }
    })();

    const message = generateWA_Kalibrasi(kalibrasiGlobal, kalibrasiEntries);

    try {
      await shareToWhatsApp(message, customFilesArray.length > 0 ? customFilesArray : null, () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      });
    } finally {
      setTimeout(unlock, 2500);
    }
  };

  return (
    <form onSubmit={handleKalibrasiSubmit} className="p-4 sm:p-8 space-y-8 bg-slate-50/50">
      
      {/* GLOBAL KALIBRASI SETTINGS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-4">
          <Clock className="w-5 h-5 text-blue-600" /> Waktu Pelaksanaan Kalibrasi
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="date" name="tanggal" required value={kalibrasiGlobal.tanggal} onChange={handleKalibrasiGlobalChange} className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                showErrors && !kalibrasiGlobal.tanggal ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
              }`} />
            </div>
            {showErrors && !kalibrasiGlobal.tanggal && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> Tanggal wajib diisi!
              </p>
            )}
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Mulai</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input 
                type="time" 
                name="waktuMulai" 
                required 
                max={kalibrasiGlobal.tanggal === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined}
                value={kalibrasiGlobal.waktuMulai} 
                onChange={handleKalibrasiGlobalChange} 
                className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  showErrors && !kalibrasiGlobal.waktuMulai ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                }`} 
              />
            </div>
            {showErrors && !kalibrasiGlobal.waktuMulai && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> Wajib diisi!
              </p>
            )}
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Selesai</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input 
                type="time" 
                name="waktuSelesai" 
                required 
                max={kalibrasiGlobal.tanggal === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined} 
                value={kalibrasiGlobal.waktuSelesai} 
                onChange={handleKalibrasiGlobalChange} 
                className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  showErrors && !kalibrasiGlobal.waktuSelesai ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                }`} 
              />
            </div>
            {showErrors && !kalibrasiGlobal.waktuSelesai && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> Wajib diisi!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* DYNAMIC ENTRIES LOOP */}
      <div className="space-y-6">
        {kalibrasiEntries.map((entry, index) => {
          const modelsObj = {
            'X-Ray': entry.xrayModel,
            'WTMD': entry.wtmdModel,
            'HHMD': entry.hhmdModel,
            'Body Scanner': entry.bsModel,
            'ETD': entry.etdModel,
          };
          const kalibrasiLok1Opts = entry.peralatan.length > 0 
            ? getIntersectedLocations(entry.peralatan, modelsObj) 
            : [];

          return (
            <div key={entry.id} className="bg-white border-2 border-blue-100 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm relative">
              <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                <h3 className="font-extrabold text-lg text-blue-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" /> Lokasi Kalibrasi #{index + 1}
                </h3>
                {kalibrasiEntries.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeKalibrasiEntry(index)} 
                    className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Cpu className="w-4 h-4 inline-block text-blue-500 mr-1" /> Peralatan <span className="text-xs text-slate-400 font-normal">(Pilih 1 atau lebih)</span>
                  </label>
                  
                  {kalibrasiEquipments && kalibrasiEquipments.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {kalibrasiEquipments.map(equip => {
                      const isACChecked = entry.peralatan.includes('Access Control');
                      const isChecked = entry.peralatan.includes(equip);
                      const isDisabled = isACChecked && equip !== 'Access Control';
                      
                      return (
                        <label 
                          key={equip} 
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50 border-blue-500 shadow-sm font-semibold' : 
                            isDisabled ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 
                            showErrors && entry.peralatan.length === 0 ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' :
                            'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => handleKalibrasiEquipToggle(index, equip)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                          />
                          <span className={`ml-2 text-sm ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>{equip}</span>
                        </label>
                      );
                    })}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm">
                      <p className="font-semibold mb-1">Peralatan Belum Dikonfigurasi!</p>
                      <p>Silakan menuju <b>Tab Data</b> {'>'} <b>Config Peralatan Kalibrasi</b> untuk memilih jenis peralatan yang akan ditampilkan di sini.</p>
                    </div>
                  )}
                  {showErrors && entry.peralatan.length === 0 && (
                    <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Pilih minimal 1 peralatan!
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lokasi{entry.peralatan.includes('Access Control') && <span className="text-xs text-slate-400 font-normal"> (Pilih 1 atau lebih)</span>}</label>
                  {entry.peralatan.includes('Access Control') ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(() => {
                          const acOpts = getGeneralLokasiOptions('Access Control');
                          if (acOpts.length === 0) {
                            return (
                              <div className="col-span-full p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm">
                                <p className="font-semibold">Lokasi Access Control belum tersedia.</p>
                                <p>Pastikan data penempatan peralatan Access Control sudah diisi di database.</p>
                              </div>
                            );
                          }
                          return acOpts.map((loc: string) => {
                            const isChecked = (entry.acLokasi || []).includes(loc);
                            return (
                              <label
                                key={loc}
                                className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-colors ${
                                  isChecked ? 'bg-blue-50 border-blue-500 shadow-sm font-semibold' : 
                                  showErrors && (entry.acLokasi || []).length === 0 ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' :
                                  'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleKalibrasiAcLokasiToggle(index, loc)}
                                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-slate-700">{loc}</span>
                              </label>
                            );
                          });
                        })()}
                      </div>
                      {showErrors && (entry.acLokasi || []).length === 0 && (
                        <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Pilih minimal 1 lokasi Access Control!
                        </p>
                      )}
                    </>
                  ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <select
                          name="lokasi1"
                          required
                          value={entry.lokasi1}
                          onChange={(e) => handleKalibrasiEntryChange(index, e)}
                          disabled={kalibrasiLok1Opts.length === 0}
                          className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed ${
                            showErrors && !entry.lokasi1 ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                          }`}
                        >
                          <option value="">- Pilih Lokasi -</option>
                          {kalibrasiLok1Opts.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="w-1/3">
                        {(() => {
                          const options = getLokasi2Options(entry.lokasi1, entry.peralatan);
                          const isDisabled = options.length === 0 || (options.length === 1 && options[0] === '-');
                          return (
                            <select name="lokasi2" value={entry.lokasi2} onChange={(e) => handleKalibrasiEntryChange(index, e)} disabled={isDisabled} className={`w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-200' : ''}`}>
                              <option value="">- No -</option>
                              {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          );
                        })()}
                      </div>
                    </div>
                    {showErrors && !entry.lokasi1 && (
                      <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Lokasi wajib dipilih!
                      </p>
                    )}
                  </div>
                  )}
                </div>
              </div>

              <KalibrasiParameterFields
                entry={entry}
                index={index}
                showErrors={showErrors}
                handleKalibrasiEntryChange={handleKalibrasiEntryChange}
              />

            </div>
          );
        })}
      </div>

      <button 
        type="button" 
        onClick={addKalibrasiEntry} 
        className="w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group flex flex-col items-center justify-center gap-2 text-center mt-6"
      >
        <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:scale-110 transition-transform flex items-center justify-center text-blue-600 shadow-sm">
          <Plus className="w-6 h-6" />
        </div>
        <span className="text-sm font-bold text-blue-700 block">Tambah Lokasi Kalibrasi Berikutnya</span>
        <span className="text-xs text-blue-500 block">Klik untuk menambahkan formulir kalibrasi peralatan di lokasi lain</span>
      </button>

      {renderKalibrasiPhotoSection()}

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${
            isSubmitting
              ? 'bg-emerald-600 opacity-70 cursor-not-allowed text-white'
              : isCopied
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]'
              : 'bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-0.5 text-white'
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
              <Share2 className="w-6 h-6" /> Share Kalibrasi ke WA
            </>
          )}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Kalibrasi (Real-time)
        </h3>
        <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
          <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
            {generateWA_Kalibrasi(kalibrasiGlobal, kalibrasiEntries)}
          </div>
        </div>
      </div>
    </form>
  );
};
