import React, { useState } from 'react';
import { Cpu, FileText, MapPin, User, Clock, Calendar, AlertCircle, Share2, CheckCircle, Plus, X, Wrench, Camera, Move, ZoomIn, ZoomOut, ImagePlus, Type, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PhotoTextEditorModal } from '../shared/PhotoTextEditorModal';
import { getLokasi2Options, getGeneralLokasiOptions } from '../../lib/utils/locationRules';
import { generateWA_Perbaikan } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { processPhotosToCollage, compressImageFile } from '../../lib/utils/canvasUtils';
import { supabase } from '../../lib/supabaseClient';
import { toTitleCase } from '../../lib/data/masterData';
import { syncToGoogleSheets } from '../../lib/services/sheetsSyncService';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';

function formatNamaPersonel(fullName: string): string {
  if (!fullName) return '';
  const words = fullName.trim().split(/\s+/);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];
  
  const firstWord = words[0].toLowerCase();
  const titlePrefixes = ['m.', 'muh.', 'muhammad', 'moch.', 'mochammad', 'abdul'];
  
  if (titlePrefixes.includes(firstWord)) {
    return words[1];
  }
  return words[0];
}

export const TabPerbaikan: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();

  const [formData, setFormData] = useState(() => {
    const now = new Date();
    // Real-time local date for the tanggal field
    const realYear = now.getFullYear();
    const realMonth = String(now.getMonth() + 1).padStart(2, '0');
    const realDay = String(now.getDate()).padStart(2, '0');
    const realDate = `${realYear}-${realMonth}-${realDay}`;
    return {
      peralatan: '', lokasi1: '', lokasi2: '', lokasiList: [{ lokasi1: '', lokasi2: '', isManual: false }] as { lokasi1: string; lokasi2: string; isManual?: boolean }[], sumberLaporan: 'Avsec', indikasiAwal: '',
      tanggal: realDate, waktuMulai: '', waktuSelesai: '',
      lamaPengerjaan: '', teknisi: '', permasalahan: '• ', tindakLanjut: '• ', status: 'Pekerjaan Selesai'
    };
  });
  
  const [availableTeknisi, setAvailableTeknisi] = useState<{id: string, name: string, unit?: string}[]>([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState<string[]>([]);
  const [manualTeknisi, setManualTeknisi] = useState<string>('');
  const [tipePeralatanOptions, setTipePeralatanOptions] = useState<string[]>([]);
  const [isManualPeralatan, setIsManualPeralatan] = useState<boolean>(false);

  // Ambil data teknisi dan tipe peralatan dari Supabase
  React.useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Teknisi
      const now = new Date();
      const currentHour = now.getHours();
      const logicalDateObj = new Date(now.getTime());
      if (currentHour < 8) {
        logicalDateObj.setDate(logicalDateObj.getDate() - 1);
      }
      const tzOffset = logicalDateObj.getTimezoneOffset() * 60000;
      const todayStr = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split('T')[0];
      const isPagi = currentHour >= 8 && currentHour < 20;

      const { data: dataTeknisi } = await supabase
        .from('jadwal_shift')
        .select(`id, shift, status_kehadiran, personel:personel_id(nama, unit_kerja(nama))`)
        .eq('tanggal', todayStr)
        .eq('status_kehadiran', 'Hadir');

      if (dataTeknisi) {
        const filteredTeknisi = dataTeknisi.filter((d: any) => {
          const s = (d.shift || '').toUpperCase();
          if (isPagi) {
            return s === 'PS';
          } else {
            return s === 'M';
          }
        });

        setAvailableTeknisi(filteredTeknisi.map((d: any) => ({
          id: d.id,
          name: formatNamaPersonel(toTitleCase(d.personel?.nama || '')),
          unit: d.personel?.unit_kerja?.nama || ''
        })).filter((t: any) => t.name !== ''));
      }

      // 2. Fetch Tipe Peralatan
      const { data: dataTipe } = await supabase
        .from('tipe_peralatan')
        .select('nama')
        .order('nama', { ascending: true });
        
      if (dataTipe) {
        setTipePeralatanOptions(dataTipe.map(d => d.nama));
      }
    };
    fetchData();
  }, []);

  // Update string 'teknisi' di formData jika checkbox berubah
  React.useEffect(() => {
    setFormData(prev => {
      const allTeknisi = [...selectedTeknisi];
      if (manualTeknisi.trim()) {
        const manualList = manualTeknisi.split(',').map(t => t.trim()).filter(t => t);
        allTeknisi.push(...manualList);
      }
      
      let teknisiStr = '';
      if (allTeknisi.length === 0) {
        teknisiStr = '';
      } else if (allTeknisi.length === 1) {
        teknisiStr = allTeknisi[0];
      } else {
        const last = allTeknisi[allTeknisi.length - 1];
        const rest = allTeknisi.slice(0, -1);
        teknisiStr = `${rest.join(', ')} & ${last}`;
      }
      return { ...prev, teknisi: teknisiStr };
    });
  }, [selectedTeknisi, manualTeknisi]);

  const toggleTeknisi = (name: string) => {
    setSelectedTeknisi(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };
  
  const [isVerifikasiETD, setIsVerifikasiETD] = useState(false);
  const [photoGroups, setPhotoGroups] = useState<any[]>([
    { id: Date.now(), photos: [] as any[], isGenerating: false, autoCollageFile: null, collageAnnotation: undefined }
  ]);
  const [editingPhoto, setEditingPhoto] = useState<{ groupId: number; photoIndex: number } | null>(null);

  const photoGroupsRef = React.useRef(photoGroups);
  photoGroupsRef.current = photoGroups;

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

  const permasalahanRef = React.useRef<HTMLTextAreaElement>(null);
  const tindakLanjutRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (permasalahanRef.current) {
      permasalahanRef.current.style.height = 'auto';
      permasalahanRef.current.style.height = `${Math.max(80, permasalahanRef.current.scrollHeight)}px`;
    }
  }, [formData.permasalahan]);

  React.useEffect(() => {
    if (tindakLanjutRef.current) {
      tindakLanjutRef.current.style.height = 'auto';
      tindakLanjutRef.current.style.height = `${Math.max(140, tindakLanjutRef.current.scrollHeight)}px`;
    }
  }, [formData.tindakLanjut]);

  // === Handlers ===
  const handleRepairChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'waktuSelesai' && value) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (formData.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === 'tanggal' && value) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (value === todayStr && formData.waktuSelesai && formData.waktuSelesai > currentTimeStr) {
        alert(`Pukul Selesai direset karena melebihi waktu saat ini (${currentTimeStr})`);
        setFormData(prev => ({ ...prev, tanggal: value, waktuSelesai: '', lamaPengerjaan: '' }));
        return;
      }
    }
    let newFormData = { ...formData, [name]: value };

    if (name === 'peralatan') {
      newFormData.lokasi1 = '';
      newFormData.lokasi2 = '';
      newFormData.lokasiList = [{ lokasi1: '', lokasi2: '', isManual: false }];
    }

    if (name === 'waktuMulai' || name === 'waktuSelesai') {
      const start = name === 'waktuMulai' ? value : formData.waktuMulai;
      const end = name === 'waktuSelesai' ? value : formData.waktuSelesai;
      
      if (start && end) {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        let diff = (endH * 60 + endM) - (startH * 60 + startM);
        if (diff < 0) diff += 24 * 60; // Lintas hari
        
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        newFormData.lamaPengerjaan = `${hours > 0 ? `${hours} Jam ` : ''}${minutes} Menit`;
      }
    }

    setFormData(newFormData);
  };

  const handleLokasiEntryChange = (index: number, field: 'lokasi1' | 'lokasi2' | 'isManualToggle', value: string) => {
    if (field === 'isManualToggle') {
      setFormData(prev => {
        const newList = [...(prev.lokasiList || [{ lokasi1: prev.lokasi1 || '', lokasi2: prev.lokasi2 || '' }])];
        newList[index] = { ...newList[index], lokasi1: '', lokasi2: '', isManual: false };
        return {
          ...prev,
          lokasiList: newList,
          lokasi1: newList[0]?.lokasi1 || '',
          lokasi2: newList[0]?.lokasi2 || ''
        };
      });
      return;
    }

    if (field === 'lokasi1' && value === 'MANUAL_ENTRY') {
      setFormData(prev => {
        const newList = [...(prev.lokasiList || [{ lokasi1: prev.lokasi1 || '', lokasi2: prev.lokasi2 || '' }])];
        newList[index] = { ...newList[index], lokasi1: '', lokasi2: '-', isManual: true };
        return {
          ...prev,
          lokasiList: newList,
          lokasi1: newList[0]?.lokasi1 || '',
          lokasi2: newList[0]?.lokasi2 || ''
        };
      });
      return;
    }

    setFormData(prev => {
      const newList = [...(prev.lokasiList || [{ lokasi1: prev.lokasi1 || '', lokasi2: prev.lokasi2 || '' }])];
      newList[index] = { ...newList[index], [field]: value };
      if (field === 'lokasi1') {
        if (newList[index].isManual || isManualPeralatan) {
          newList[index].lokasi2 = '-';
        } else {
          const pts = getLokasi2Options(value, [prev.peralatan]);
          newList[index].lokasi2 = (pts.length === 0 || (pts.length === 1 && pts[0] === '-')) ? '-' : '';
        }
      }
      return {
        ...prev,
        lokasiList: newList,
        lokasi1: newList[0]?.lokasi1 || '',
        lokasi2: newList[0]?.lokasi2 || ''
      };
    });
  };

  const addLokasiEntry = () => {
    setFormData(prev => {
      const newList = [...(prev.lokasiList || [{ lokasi1: prev.lokasi1 || '', lokasi2: prev.lokasi2 || '' }]), { lokasi1: '', lokasi2: isManualPeralatan ? '-' : '', isManual: isManualPeralatan }];
      return { ...prev, lokasiList: newList };
    });
  };

  const removeLokasiEntry = (index: number) => {
    setFormData(prev => {
      const newList = [...(prev.lokasiList || [{ lokasi1: prev.lokasi1 || '', lokasi2: prev.lokasi2 || '' }])];
      newList.splice(index, 1);
      if (newList.length === 0) newList.push({ lokasi1: '', lokasi2: isManualPeralatan ? '-' : '', isManual: isManualPeralatan });
      return {
        ...prev,
        lokasiList: newList,
        lokasi1: newList[0]?.lokasi1 || '',
        lokasi2: newList[0]?.lokasi2 || ''
      };
    });
  };

  const handlePeralatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'MANUAL_ENTRY') {
      setIsManualPeralatan(true);
      setFormData(prev => ({ ...prev, peralatan: '', lokasi1: '', lokasi2: '-', lokasiList: [{ lokasi1: '', lokasi2: '-', isManual: true }] }));
      return;
    }
    const isETD = value === 'ETD Leidos QS-B220';
    
    if (!isETD && isVerifikasiETD) {
      setIsVerifikasiETD(false);
      setFormData(prev => ({ ...prev, peralatan: value, lokasi1: '', lokasi2: '', lokasiList: [{ lokasi1: '', lokasi2: '', isManual: false }], permasalahan: '• ', tindakLanjut: '• ' }));
    } else {
      setFormData(prev => ({ ...prev, peralatan: value, lokasi1: '', lokasi2: '', lokasiList: [{ lokasi1: '', lokasi2: '', isManual: false }] }));
    }
  };

  const handleVerifikasiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => {
      const newData = { ...prev };
      if (checked && newData.peralatan !== 'ETD Leidos QS-B220') {
        newData.peralatan = 'ETD Leidos QS-B220';
        newData.lokasi1 = '';
        newData.lokasi2 = '';
        newData.lokasiList = [{ lokasi1: '', lokasi2: '', isManual: false }];
      }
      
      if (checked) {
        newData.permasalahan = '• Verification Required';
        newData.tindakLanjut = '• Melakukan Verifikasi Negatif';
      } else {
        newData.permasalahan = '• ';
        newData.tindakLanjut = '• ';
      }
      return newData;
    });
    setIsVerifikasiETD(checked);
  };

  const handleBulletChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: string) => {
    let value = e.target.value;
    if (!value.startsWith('• ')) {
      value = '• ' + value.replace(/^•\s*/, '');
    }
    value = value.replace(/\n([^•])/g, '\n• $1');
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBulletKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setFormData(prev => ({ ...prev, [field]: prev[field as keyof typeof formData] + '\n• ' }));
    }
  };

  // === Photo Handlers ===
  const handlePhotoUpload = async (groupId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map(f => compressImageFile(f)));
      const newPhotos = compressedResults.map(res => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
        zoom: 1
      }));
      setPhotoGroups(prev => prev.map(g => g.id === groupId ? { ...g, photos: [...g.photos, ...newPhotos] } : g));
    }
  };

  const removePhoto = (groupId: number, photoIndex: number) => {
    setPhotoGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        URL.revokeObjectURL(newPhotos[photoIndex].preview);
        newPhotos.splice(photoIndex, 1);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };

  const updatePhotoZoom = (groupId: number, photoIndex: number, delta: number) => {
    setPhotoGroups(prev => prev.map(group => {
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

  const handlePhotoDrop = (e: React.DragEvent | any, groupId: number, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData('text/plain');
    if (!sourceIndexStr) return;
    
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    
    setPhotoGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newPhotos = [...group.photos];
        const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
        newPhotos.splice(targetIndex, 0, movedPhoto);
        return { ...group, photos: newPhotos };
      }
      return group;
    }));
  };

  const handleSaveText = (newFile: File, newPreviewUrl: string, annotation?: any) => {
    if (!editingPhoto) return;
    const { groupId, photoIndex } = editingPhoto;
    setPhotoGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      const newPhotos = [...group.photos];
      const currentPhoto = newPhotos[photoIndex];
      newPhotos[photoIndex] = {
        ...currentPhoto,
        originalFile: currentPhoto.originalFile || currentPhoto.file,
        originalPreview: currentPhoto.originalPreview || currentPhoto.preview,
        file: newFile,
        preview: newPreviewUrl,
        annotation
      };
      return { ...group, photos: newPhotos };
    }));
    setEditingPhoto(null);
  };

  const handleResetText = () => {
    if (!editingPhoto) return;
    const { groupId, photoIndex } = editingPhoto;
    setPhotoGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      const newPhotos = [...group.photos];
      const currentPhoto = newPhotos[photoIndex];
      if (!currentPhoto.originalFile || !currentPhoto.originalPreview) return group;
      newPhotos[photoIndex] = {
        ...currentPhoto,
        file: currentPhoto.originalFile,
        preview: currentPhoto.originalPreview,
        annotation: undefined
      };
      return { ...group, photos: newPhotos };
    }));
    setEditingPhoto(null);
  };

  const addPhotoGroup = () => {
    setPhotoGroups(prev => [...prev, { id: Date.now(), photos: [], isGenerating: false, autoCollageFile: null, collageAnnotation: undefined }]);
  };

  const removePhotoGroup = (groupId: number) => {
    if (photoGroups.length <= 1) return;
    setPhotoGroups(prev => {
      const groupToRemove = prev.find(g => g.id === groupId);
      if (groupToRemove) {
        groupToRemove.photos.forEach((p: any) => URL.revokeObjectURL(p.preview));
      }
      return prev.filter(g => g.id !== groupId);
    });
    if (editingPhoto?.groupId === groupId) {
      setEditingPhoto(null);
    }
  };

  const renderPhotoSection = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-blue-50/50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" /> Lampiran Foto/Video
        </h2>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded w-fit">Kirim multi kolase sekaligus</span>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><Move className="w-3 h-3" /> Geser foto untuk urutkan</span>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {photoGroups.map((group, groupIndex) => (
          <div key={group.id} className="p-4 sm:p-5 bg-blue-50/30 border border-blue-100 rounded-xl space-y-4 relative shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex-1 w-full flex items-center gap-3">
                <h3 className="font-bold text-blue-900 text-sm">Grup Kolase {groupIndex + 1}</h3>
              </div>
              {photoGroups.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removePhotoGroup(group.id)} 
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 self-end sm:self-center text-sm font-bold"
                >
                  <Trash2 className="w-4 h-4" /> <span className="sm:hidden">Hapus Grup</span>
                </button>
              )}
            </div>

            <div>
              <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors group">
                <div className="flex flex-col items-center gap-2 text-center">
                  <ImagePlus className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-blue-700">Pilih / Ambil Foto/Video</span>
                  <span className="text-xs text-blue-500">Galeri, File (Foto/Video), atau Kamera langsung</span>
                </div>
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(group.id, e)} />
              </label>
            </div>

            {group.photos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Daftar Foto/Video ({group.photos.length}):</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {group.photos.map((photo: any, pIndex: number) => (
                    <div 
                      key={photo.id} 
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', pIndex.toString())}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handlePhotoDrop(e, group.id, pIndex)}
                      className="relative bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm group/photo hover:shadow-md transition-shadow aspect-square cursor-move flex flex-col"
                    >
                      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                        {photo.file?.type?.startsWith('video/') ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            <video 
                              src={photo.preview} 
                              className="absolute w-full h-full object-cover" 
                              muted 
                              playsInline
                              onLoadedData={(e) => (e.target as HTMLVideoElement).currentTime = 0.1}
                            />
                            <div className="absolute z-10 bg-black/60 p-2 rounded-full text-white backdrop-blur-sm pointer-events-none shadow-lg border border-white/20">
                              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={photo.preview} 
                            alt="Preview" 
                            className="absolute w-full h-full object-cover transition-transform"
                            style={{ transform: `scale(${photo.zoom || 1})` }}
                          />
                        )}
                      </div>
                      
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm z-10">
                        {pIndex + 1}
                      </div>

                      <div className="absolute top-1 right-1 flex flex-col gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.preventDefault(); removePhoto(group.id, pIndex); }} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {!photo.file?.type?.startsWith('video/') && (
                        <>
                          <div className="absolute bottom-1 left-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity">
                            <button 
                              type="button" 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPhoto({ groupId: group.id, photoIndex: pIndex }); }} 
                              className={`p-1.5 rounded-full shadow-md flex items-center gap-1 text-xs font-semibold px-2.5 py-1 transition-colors ${
                                photo.annotation ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Beri Teks / Watermark"
                            >
                              <Type className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">{photo.annotation ? 'Edit Teks' : 'Teks'}</span>
                            </button>
                          </div>

                          <div className="absolute bottom-1 right-1 flex gap-1 z-10 opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => { e.preventDefault(); updatePhotoZoom(group.id, pIndex, 0.1); }} className="bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={(e) => { e.preventDefault(); updatePhotoZoom(group.id, pIndex, -0.1); }} className="bg-white text-slate-700 p-1.5 rounded-full hover:bg-slate-100 shadow-md">
                              <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <LiveCollagePreview 
              photos={group.photos} 
              onCollageChange={(file, _url, annotation) => {
                setPhotoGroups(prev => prev.map(g => g.id === group.id ? { ...g, autoCollageFile: file, collageAnnotation: annotation } : g));
              }}
            />
          </div>
        ))}

        <button 
          type="button" 
          onClick={addPhotoGroup} 
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

  // === Submit ===
  const handleRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (formData.tanggal === todayStr && formData.waktuSelesai && formData.waktuSelesai > currentTimeStr) {
      alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
      return;
    }

    let customFilesArray: File[] = [];

    // Process photos for each group
    for (let i = 0; i < photoGroups.length; i++) {
      const group: any = photoGroups[i];
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

    const message = generateWA_Perbaikan(formData, isVerifikasiETD);
    
    const uraianText = `Permasalahan : ${formData.permasalahan}`;
    const activeLocs = (formData.lokasiList || [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }]).filter((l: any) => l.lokasi1);
    const lokasiFull = activeLocs.map((l: any) => {
      if (l.isManual || (l.lokasi2 === '-' && !l.lokasi2)) return l.lokasi1;
      return l.lokasi1 + (l.lokasi2 && l.lokasi2 !== '-' ? ` - ${l.lokasi2}` : '');
    }).join(', ');
    const waktuFull = formData.waktuSelesai ? `${formData.waktuMulai} - ${formData.waktuSelesai}` : formData.waktuMulai;

    syncToGoogleSheets({
      jenis: 'Perbaikan',
      tanggal: formData.tanggal,
      waktu: waktuFull,
      teknisi: formData.teknisi,
      lokasi: lokasiFull || '-',
      peralatan: formData.peralatan,
      uraian: uraianText,
      tindakLanjut: formData.tindakLanjut,
      status: formData.status,
      imageFile: customFilesArray.length > 0 ? customFilesArray[0] : null
    });

    await shareToWhatsApp(message, customFilesArray.length > 0 ? customFilesArray : null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  return (
    <div>
      <div className="bg-blue-50/50 px-6 py-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full">
            <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" /> Pilihan Peralatan
            </label>
            {isManualPeralatan ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ketik nama peralatan secara manual..."
                  value={formData.peralatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, peralatan: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsManualPeralatan(false);
                    setFormData(prev => ({ ...prev, peralatan: '', lokasi1: '', lokasi2: '', lokasiList: [{ lokasi1: '', lokasi2: '', isManual: false }] }));
                  }}
                  className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs shrink-0 transition-colors"
                >
                  Pilih dari Daftar
                </button>
              </div>
            ) : (
              <select required value={formData.peralatan} onChange={handlePeralatanChange} className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm cursor-pointer appearance-none">
                <option value="">-- Pilih Peralatan --</option>
                {tipePeralatanOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="MANUAL_ENTRY">+ Ketik Manual (Peralatan Lainnya)</option>
              </select>
            )}
          </div>
          
          <div className="flex items-center gap-2 pt-2 sm:pt-7">
            <input type="checkbox" id="verifikasiETD_tab" checked={isVerifikasiETD} onChange={handleVerifikasiChange} className="w-5 h-5 text-blue-600 bg-white border-blue-300 rounded focus:ring-2 focus:ring-blue-400 cursor-pointer" />
            <label htmlFor="verifikasiETD_tab" className="text-sm font-bold text-blue-900 cursor-pointer select-none">
              Verifikasi ETD
            </label>
          </div>
        </div>
      </div>

      <form onSubmit={handleRepairSubmit} className="p-6 sm:p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" /> Informasi Laporan Perbaikan
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-3">
              <label className="block text-sm font-medium text-slate-700">Lokasi</label>
              {(formData.lokasiList || [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }]).map((loc, index) => {
                const allRows = formData.lokasiList || [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
                const otherRows = allRows.filter((_, idx) => idx !== index);

                const availableOptions = getGeneralLokasiOptions(formData.peralatan).filter((opt: string) => {
                  if (opt === loc.lokasi1) return true;
                  const otherRowsWithOpt = otherRows.filter(r => r.lokasi1 === opt);
                  if (otherRowsWithOpt.length === 0) return true;
                  const pts = getLokasi2Options(opt, [formData.peralatan]);
                  if (pts.length === 0 || pts[0] === '-') return false;
                  const takenPts = otherRowsWithOpt.map(r => r.lokasi2).filter(Boolean);
                  return !pts.every(p => takenPts.includes(p));
                });

                const allOptions2 = getLokasi2Options(loc.lokasi1, [formData.peralatan]);
                const takenOptions2ForThisLoc1 = otherRows
                  .filter(r => r.lokasi1 === loc.lokasi1)
                  .map(r => r.lokasi2)
                  .filter(Boolean);
                const options2 = allOptions2.filter(opt => !takenOptions2ForThisLoc1.includes(opt) || opt === loc.lokasi2);
                const isDisabled2 = allOptions2.length === 0 || (allOptions2.length === 1 && allOptions2[0] === '-');

                const isRowManual = loc.isManual || isManualPeralatan;
                return (
                  <div key={index} className="flex gap-2 items-center">
                    {isRowManual ? (
                      <div className="flex gap-2 flex-1 items-center">
                        <div className="relative flex-1">
                          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            required={index === 0}
                            placeholder="Ketik nama lokasi / nomor titik secara manual..."
                            value={loc.lokasi1}
                            onChange={(e) => handleLokasiEntryChange(index, 'lokasi1', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 font-medium shadow-sm"
                          />
                        </div>
                        {!isManualPeralatan && (
                          <button
                            type="button"
                            onClick={() => handleLokasiEntryChange(index, 'isManualToggle', 'false')}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs shrink-0 transition-colors"
                          >
                            Pilih dari Daftar
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="relative flex-1">
                          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                          <select 
                            required={index === 0}
                            disabled={!formData.peralatan}
                            value={loc.lokasi1} 
                            onChange={(e) => handleLokasiEntryChange(index, 'lokasi1', e.target.value)} 
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                          >
                            <option value="">{index === 0 ? '- Pilih Lokasi -' : '- Pilih Lokasi Tambahan (Opsional) -'}</option>
                            {availableOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            <option value="MANUAL_ENTRY">+ Ketik Manual (Lokasi Lainnya)</option>
                          </select>
                        </div>
                        <div className="w-1/3">
                          <select 
                            value={loc.lokasi2} 
                            onChange={(e) => handleLokasiEntryChange(index, 'lokasi2', e.target.value)} 
                            disabled={isDisabled2} 
                            className={`w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm ${isDisabled2 ? 'opacity-50 cursor-not-allowed bg-slate-200' : ''}`}
                          >
                            <option value="">- No -</option>
                            {options2.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                    {index > 0 && (
                      <button 
                        type="button" 
                        onClick={() => removeLokasiEntry(index)}
                        className="p-2 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-lg transition-colors flex items-center justify-center shrink-0"
                        title="Hapus lokasi tambahan ini"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
              <div>
                <button
                  type="button"
                  disabled={!formData.peralatan}
                  onClick={addLokasiEntry}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 pt-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Lokasi
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sumber Laporan</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input type="text" name="sumberLaporan" required value={formData.sumberLaporan} onChange={handleRepairChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Indikasi Awal</label>
              <textarea name="indikasiAwal" required={!isVerifikasiETD} disabled={isVerifikasiETD} rows={2} placeholder="Cth: Mesin tidak menyala..." value={formData.indikasiAwal} onChange={handleRepairChange} className={`w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${isVerifikasiETD ? 'opacity-60 cursor-not-allowed bg-slate-200 text-slate-500' : ''}`}></textarea>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
            <Clock className="w-5 h-5 text-blue-600" /> Waktu & Pelaksana
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input type="date" name="tanggal" required value={formData.tanggal} onChange={handleRepairChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Mulai</label>
              <input type="time" name="waktuMulai" required value={formData.waktuMulai} onChange={handleRepairChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Selesai</label>
              <input type="time" name="waktuSelesai" required max={formData.tanggal === new Date().toISOString().split('T')[0] ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined} value={formData.waktuSelesai} onChange={handleRepairChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Lama Pengerjaan</label>
              <input type="text" name="lamaPengerjaan" required readOnly placeholder="Terisi otomatis..." value={formData.lamaPengerjaan} className="w-full px-4 py-2 bg-slate-200 border border-slate-300 rounded-lg outline-none cursor-not-allowed text-slate-600 font-medium select-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                Teknisi Bertugas (Otomatis dari Shift)
                {availableTeknisi.length === 0 && <span className="text-xs text-rose-500 font-normal">*(Tidak ada teknisi hadir/jadwal kosong)</span>}
              </label>
              
              <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {(() => {
                  const apiTeknisi = availableTeknisi.filter(t => t.unit === 'API T2');
                  const iasTeknisi = availableTeknisi.filter(t => t.unit === 'OM/IAS T2');
                  const otherTeknisi = availableTeknisi.filter(t => t.unit !== 'API T2' && t.unit !== 'OM/IAS T2');

                  return (
                    <>
                      {apiTeknisi.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {apiTeknisi.map(t => (
                            <label key={t.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors">
                              <input 
                                type="checkbox" 
                                checked={selectedTeknisi.includes(t.name)}
                                onChange={() => toggleTeknisi(t.name)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                              />
                              <span className="text-sm font-medium text-slate-700 select-none">{t.name}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {apiTeknisi.length > 0 && (iasTeknisi.length > 0 || otherTeknisi.length > 0) && (
                        <div className="border-t border-slate-300 border-dashed my-1"></div>
                      )}

                      {iasTeknisi.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {iasTeknisi.map(t => (
                            <label key={t.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors">
                              <input 
                                type="checkbox" 
                                checked={selectedTeknisi.includes(t.name)}
                                onChange={() => toggleTeknisi(t.name)}
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" 
                              />
                              <span className="text-sm font-medium text-slate-700 select-none">{t.name}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {iasTeknisi.length > 0 && otherTeknisi.length > 0 && (
                        <div className="border-t border-slate-300 border-dashed my-1"></div>
                      )}

                      {otherTeknisi.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {otherTeknisi.map(t => (
                            <label key={t.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-md transition-colors">
                              <input 
                                type="checkbox" 
                                checked={selectedTeknisi.includes(t.name)}
                                onChange={() => toggleTeknisi(t.name)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                              />
                              <span className="text-sm font-medium text-slate-700 select-none">{t.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Teks input manual teknisi */}
              <input 
                type="text" 
                placeholder={availableTeknisi.length === 0 ? "Ketik manual nama teknisi karena jadwal kosong..." : "Tambah teknisi lain (pisahkan dengan koma)..."}
                value={manualTeknisi} 
                onChange={(e) => setManualTeknisi(e.target.value)} 
                className="w-full mt-3 px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" /> Detail Pengerjaan
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Permasalahan</label>
            <textarea ref={permasalahanRef} name="permasalahan" required rows={3} value={formData.permasalahan} onChange={(e) => handleBulletChange(e, 'permasalahan')} onKeyDown={(e) => handleBulletKeyDown(e, 'permasalahan')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tindak Lanjut</label>
            <textarea ref={tindakLanjutRef} name="tindakLanjut" required rows={6} value={formData.tindakLanjut} onChange={(e) => handleBulletChange(e, 'tindakLanjut')} onKeyDown={(e) => handleBulletKeyDown(e, 'tindakLanjut')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleRepairChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
              <option value="Pekerjaan Selesai">Pekerjaan Selesai</option>
              <option value="Normal Operasi">Normal Operasi</option>
              <option value="On Progress">On Progress</option>
              <option value="Menunggu Sparepart">Menunggu Sparepart</option>
              <option value="Perlu Eskalasi Lanjut">Perlu Eskalasi Lanjut</option>
            </select>
          </div>
        </div>

        {renderPhotoSection()}

        {editingPhoto && (() => {
          const group = photoGroups.find(g => g.id === editingPhoto.groupId);
          const photo = group?.photos[editingPhoto.photoIndex];
          if (!photo) return null;
          return (
            <PhotoTextEditorModal
              isOpen={true}
              onClose={() => setEditingPhoto(null)}
              photoUrl={photo.originalPreview || photo.preview}
              initialAnnotation={photo.annotation}
              onSave={handleSaveText}
              onReset={handleResetText}
              hasOriginal={!!photo.originalPreview}
            />
          );
        })()}

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'}`}>
            {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Perbaikan ke WA</>}
          </button>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Perbaikan (Real-time)
          </h3>
          <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
            <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
              {generateWA_Perbaikan(formData, isVerifikasiETD)}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
