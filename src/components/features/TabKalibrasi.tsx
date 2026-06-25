import React, { useState } from 'react';
import { Clock, Calendar, MapPin, Trash2, Cpu, Plus, Share2, CheckCircle, FileText, Camera, Move, ZoomIn, ZoomOut, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { getValidXRayModels, getValidModels, getGeneralLokasiOptions, getIntersectedLocations, getLokasi2Options } from '../../lib/utils/locationRules';
import { generateWA_Kalibrasi } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { processPhotosToCollage } from '../../lib/utils/canvasUtils';
import { lazy, Suspense } from 'react';
import { LayoutGrid } from 'lucide-react';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';

const CollageEditor = lazy(() => import('../shared/CollageEditor').then(m => ({ default: m.CollageEditor })));

export const TabKalibrasi: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { jenisPeralatanData } = useMasterDataStore();
  
  const kalibrasiEquipments = jenisPeralatanData
    .filter((j: any) => j.tampil_di_kalibrasi)
    .map((j: any) => j.nama);

  // === STATE UNTUK TAB 5: KALIBRASI (MULTI LOKASI) ===
  const createEmptyKalibrasiEntry = () => ({
    id: Date.now() + Math.random(),
    peralatan: [] as string[], 
    xrayModel: 'Semua X-Ray', 
    wtmdModel: 'Semua WTMD',
    hhmdModel: 'Semua HHMD',
    bsModel: 'Semua Body Scanner',
    etdModel: 'Semua ETD',
    lokasi1: '', lokasi2: '',
    acLokasi: [] as string[],
    acEmlock: 'Berfungsi', acIntercom: 'Berfungsi', acFingerprint: 'Berfungsi', acCctv: 'Berfungsi', acPengontrolan: 'Berfungsi', acRecordCctv: '',
    xrayKvV: '', xrayKvH: '', xrayMaV: '', xrayMaH: '', xrayOnV: '', xrayOnH: '', xrayArchive: '',
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
  const [kalibrasiPhotoGroups, setKalibrasiPhotoGroups] = useState([
    { id: Date.now(), photos: [] as any[], collageUrl: null as string | null, collageFile: null as File | null, isGenerating: false }
  ]);
  const [editorGroupId, setEditorGroupId] = useState<number | null>(null);

  // === HANDLERS ===
  const handleKalibrasiGlobalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKalibrasiGlobal(prev => ({ ...prev, [name]: value }));
  };

  const handleKalibrasiEntryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setKalibrasiEntries(prev => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [name]: value };
      if (name === 'lokasi1') {
        newEntries[index].lokasi2 = ''; 
      }
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
        newPeralatan.push(equip);
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
  const handleKalibrasiPhotoUpload = (groupId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((file: any) => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
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
        newPhotos[photoIndex].zoom = Math.max(0.5, Math.min(3, currentZoom + delta));
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
    setKalibrasiPhotoGroups(prev => [...prev, { id: Date.now(), photos: [], collageUrl: null, collageFile: null, isGenerating: false }]);
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
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" /> Lampiran Foto
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
                {group.photos.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setEditorGroupId(group.id)} 
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-lg font-semibold flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <LayoutGrid className="w-3 h-3" /> Edit Kolase (Pro)
                  </button>
                )}
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

            <div>
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50 cursor-pointer transition-colors group">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-blue-700">Tambah Foto ke Kolase Ini</span>
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleKalibrasiPhotoUpload(group.id, e)} />
              </label>
            </div>

            {group.photos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Daftar Foto ({group.photos.length}):</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {group.photos.map((photo: any, pIndex: number) => (
                    <div 
                      key={photo.id} 
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', pIndex.toString())}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleKalibrasiPhotoDrop(e, group.id, pIndex)}
                      className="relative bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm group/photo hover:shadow-md transition-shadow aspect-square cursor-move flex flex-col"
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
                        {pIndex + 1}
                      </div>

                      <div className="absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.preventDefault(); removeKalibrasiPhoto(group.id, pIndex); }} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="absolute bottom-1 right-1 flex gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.preventDefault(); updateKalibrasiPhotoZoom(group.id, pIndex, 0.1); }} className="bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={(e) => { e.preventDefault(); updateKalibrasiPhotoZoom(group.id, pIndex, -0.1); }} className="bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md">
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {group.collageUrl && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-blue-200">
                <h3 className="text-sm font-bold text-blue-800 mb-2">Preview Kolase Kustom:</h3>
                <img src={group.collageUrl} alt="Custom Collage" className="w-full max-w-sm rounded-lg shadow-sm border border-slate-200" />
                <button 
                  type="button" 
                  onClick={() => {
                    setKalibrasiPhotoGroups(prev => prev.map(g => g.id === group.id ? { ...g, collageUrl: null, collageFile: null } : g));
                  }} 
                  className="mt-2 text-xs text-red-600 font-semibold hover:text-red-700"
                >
                  Hapus Kolase Kustom
                </button>
              </div>
            )}
            {!group.collageUrl && <LiveCollagePreview photos={group.photos} />}
          </div>
        ))}

        <button 
          type="button" 
          onClick={addKalibrasiPhotoGroup} 
          className="w-full border-2 border-dashed border-blue-400 text-blue-700 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Tambah Grup Kolase Baru
        </button>
      </div>
    </div>
  );

  const handleKalibrasiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kalibrasiEntries.some(entry => entry.peralatan.length === 0)) {
      alert("Pastikan Anda memilih minimal 1 peralatan untuk setiap lokasi kalibrasi yang ditambahkan!");
      return;
    }

    if (kalibrasiEntries.some(entry => entry.peralatan.includes('Access Control') && (entry.acLokasi || []).length === 0)) {
      alert("Pastikan Anda mencentang minimal 1 lokasi untuk peralatan Access Control!");
      return;
    }
    
    let customFilesArray: File[] = [];
    
    // Process photos for each group
    for (let i = 0; i < kalibrasiPhotoGroups.length; i++) {
      const group = kalibrasiPhotoGroups[i];
      if (group.collageFile) {
        customFilesArray.push(group.collageFile);
      } else if (group.photos.length > 1) {
        // Build fallback grid collage
        const collageResult = await processPhotosToCollage(group.photos);
        if (collageResult) {
          const res = await fetch(collageResult.url);
          const blob = await res.blob();
          const file = new File([blob], `Dokumentasi_Kalibrasi_Kolase_${i+1}_${Date.now()}.jpg`, { type: 'image/jpeg' });
          customFilesArray.push(file);
        }
      } else if (group.photos.length === 1 && group.photos[0]?.file) {
        customFilesArray.push(group.photos[0].file);
      }
    }

    const message = generateWA_Kalibrasi(kalibrasiGlobal, kalibrasiEntries);

    await shareToWhatsApp(message, customFilesArray.length > 0 ? customFilesArray : null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
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
              <input type="date" name="tanggal" required value={kalibrasiGlobal.tanggal} onChange={handleKalibrasiGlobalChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Mulai</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="time" name="waktuMulai" required value={kalibrasiGlobal.waktuMulai} onChange={handleKalibrasiGlobalChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Selesai</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="time" name="waktuSelesai" required value={kalibrasiGlobal.waktuSelesai} onChange={handleKalibrasiGlobalChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
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
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lokasi{entry.peralatan.includes('Access Control') && <span className="text-xs text-slate-400 font-normal"> (Pilih 1 atau lebih)</span>}</label>
                  {entry.peralatan.includes('Access Control') ? (
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
                                isChecked ? 'bg-blue-50 border-blue-500 shadow-sm font-semibold' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
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
                  ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                      <select
                        name="lokasi1"
                        required
                        value={entry.lokasi1}
                        onChange={(e) => handleKalibrasiEntryChange(index, e)}
                        disabled={kalibrasiLok1Opts.length === 0}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
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
                  )}
                </div>
              </div>

              {/* Dynamic Configurations based on selected equipments */}
              {entry.peralatan.includes('X-Ray') && (
                <div className="bg-blue-50/40 p-4 sm:p-5 rounded-xl border border-blue-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200 pb-3">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                      ⚡ Parameter X-Ray
                    </h3>
                    <select name="xrayModel" value={entry.xrayModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                      {getValidXRayModels(entry.lokasi1).map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua X-Ray' ? '-- Semua Model X-Ray --' : model.replace('X-Ray ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">kV Vertikal</label><input type="text" inputMode="decimal" name="xrayKvV" value={entry.xrayKvV} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">kV Horizontal</label><input type="text" inputMode="decimal" name="xrayKvH" value={entry.xrayKvH} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">mA Vertikal</label><input type="text" inputMode="decimal" name="xrayMaV" value={entry.xrayMaV} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">mA Horizontal</label><input type="text" inputMode="decimal" name="xrayMaH" value={entry.xrayMaH} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Ontime Vertikal</label><input type="text" inputMode="decimal" name="xrayOnV" value={entry.xrayOnV} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Ontime Horizontal</label><input type="text" inputMode="decimal" name="xrayOnH" value={entry.xrayOnH} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                    <div className="col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1">Archive</label><input type="text" name="xrayArchive" value={entry.xrayArchive} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
                  </div>
                </div>
              )}

              {entry.peralatan.includes('WTMD') && (
                <div className="bg-indigo-50/40 p-4 sm:p-5 rounded-xl border border-indigo-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-200 pb-3">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                      🎛️ Parameter WTMD
                    </h3>
                    <select name="wtmdModel" value={entry.wtmdModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                      {getValidModels(entry.lokasi1, 'WTMD').map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua WTMD' ? '-- Semua Model WTMD --' : model.replace('WTMD ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Z1</label><input type="text" inputMode="numeric" name="wtmdZ1" value={entry.wtmdZ1} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Z2</label><input type="text" inputMode="numeric" name="wtmdZ2" value={entry.wtmdZ2} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Z3</label><input type="text" inputMode="numeric" name="wtmdZ3" value={entry.wtmdZ3} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">Z4</label><input type="text" inputMode="numeric" name="wtmdZ4" value={entry.wtmdZ4} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">LC</label><input type="text" inputMode="numeric" name="wtmdLc" value={entry.wtmdLc} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">LS</label><input type="text" inputMode="numeric" name="wtmdLs" value={entry.wtmdLs} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">UC</label><input type="text" inputMode="numeric" name="wtmdUc" value={entry.wtmdUc} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">SE</label><input type="text" inputMode="numeric" name="wtmdSe" value={entry.wtmdSe} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1">DS</label><input type="text" inputMode="numeric" name="wtmdDs" value={entry.wtmdDs} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                  </div>
                </div>
              )}

              {entry.peralatan.includes('HHMD') && (
                <div className="bg-purple-50/40 p-4 sm:p-5 rounded-xl border border-purple-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-200 pb-3">
                    <h3 className="font-bold text-purple-900 flex items-center gap-2">
                      📱 Parameter HHMD
                    </h3>
                    <select name="hhmdModel" value={entry.hhmdModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-800 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer">
                      {getValidModels(entry.lokasi1, 'HHMD').map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua HHMD' ? '-- Semua Model HHMD --' : model.replace('HHMD ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {entry.peralatan.includes('Body Scanner') && (
                <div className="bg-emerald-50/40 p-4 sm:p-5 rounded-xl border border-emerald-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200 pb-3">
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                      🔍 Parameter Body Scanner
                    </h3>
                    <select name="bsModel" value={entry.bsModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer">
                      {getValidModels(entry.lokasi1, 'Body Scanner').map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua Body Scanner' ? '-- Semua Model Body Scanner --' : model.replace('Body Scanner ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Test Tampilan Suspect Item</label>
                      <select name="bsSuspect" value={entry.bsSuspect} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                        <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Test Monitor</label>
                      <select name="bsMonitor" value={entry.bsMonitor} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                        <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Test Fungsi Scanning</label>
                      <select name="bsScanning" value={entry.bsScanning} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                        <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Test Fungsi Kalibrasi</label>
                      <select name="bsCalibration" value={entry.bsCalibration} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500">
                        <option value="Normal">Normal</option><option value="Error">Error</option><option value="Perlu Penyetelan">Perlu Penyetelan</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {entry.peralatan.includes('ETD') && (
                <div className="bg-amber-50/40 p-4 sm:p-5 rounded-xl border border-amber-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-3">
                    <h3 className="font-bold text-amber-900 flex items-center gap-2">
                      🧪 Parameter ETD
                    </h3>
                    <select name="etdModel" value={entry.etdModel} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-800 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer">
                      {getValidModels(entry.lokasi1, 'ETD').map((model: string) => (
                        <option key={model} value={model}>
                          {model === 'Semua ETD' ? '-- Semua Model ETD --' : model.replace('ETD ', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sampling Test TNT</label>
                      <select name="etdTnt" value={entry.etdTnt} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500">
                        <option value="Alarm">Alarm</option><option value="Tidak Alarm">Tidak Alarm</option><option value="Error">Error</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sampling Test PETN</label>
                      <select name="etdPetn" value={entry.etdPetn} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500">
                        <option value="Alarm">Alarm</option><option value="Tidak Alarm">Tidak Alarm</option><option value="Error">Error</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sampling Test RDX</label>
                      <select name="etdRdx" value={entry.etdRdx} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-amber-500">
                        <option value="Alarm">Alarm</option><option value="Tidak Alarm">Tidak Alarm</option><option value="Error">Error</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {entry.peralatan.includes('Access Control') && (
                <div className="bg-rose-50/40 p-4 sm:p-5 rounded-xl border border-rose-200 space-y-4">
                  <h3 className="font-bold text-rose-900 flex items-center gap-2 border-b border-rose-200 pb-2">
                    🔐 Parameter Access Control
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Emlock</label>
                    <select name="acEmlock" value={entry.acEmlock} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Intercom</label>
                    <select name="acIntercom" value={entry.acIntercom} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Fingerprint</label>
                    <select name="acFingerprint" value={entry.acFingerprint} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi CCTV</label>
                    <select name="acCctv" value={entry.acCctv} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fungsi Pengontrolan Kunci Pintu</label>
                    <select name="acPengontrolan" value={entry.acPengontrolan} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none cursor-pointer focus:ring-1 focus:ring-rose-500">
                      <option value="Berfungsi">Berfungsi</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Record CCTV</label>
                    <input type="text" name="acRecordCctv" value={entry.acRecordCctv} onChange={(e) => handleKalibrasiEntryChange(index, e)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-rose-500" />
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      <button 
        type="button" 
        onClick={addKalibrasiEntry} 
        className="w-full border-2 border-dashed border-blue-400 text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-4"
      >
        <Plus className="w-5 h-5" /> Tambah Lokasi Kalibrasi Berikutnya
      </button>

      {renderKalibrasiPhotoSection()}

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-0.5 text-white'}`}>
          {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Kalibrasi ke WA</>}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Kalibrasi (Real-time)
        </h3>
        <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
          <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%] max-h-[500px] overflow-y-auto">
            {generateWA_Kalibrasi(kalibrasiGlobal, kalibrasiEntries)}
          </div>
        </div>
      </div>
      
      {editorGroupId !== null && (
        <Suspense fallback={null}>
          <CollageEditor 
            photos={kalibrasiPhotoGroups.find(g => g.id === editorGroupId)?.photos || []} 
            isOpen={editorGroupId !== null} 
            onClose={() => setEditorGroupId(null)} 
            onSave={(file, url) => {
              setKalibrasiPhotoGroups(prev => prev.map(g => g.id === editorGroupId ? { ...g, collageUrl: url, collageFile: file } : g));
              setEditorGroupId(null);
            }}
          />
        </Suspense>
      )}
    </form>
  );
};
