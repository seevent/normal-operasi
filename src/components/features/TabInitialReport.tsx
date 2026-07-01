import React, { useState, lazy, Suspense } from 'react';
import { Cpu, FileText, MapPin, Clock, Calendar, AlertCircle, Share2, CheckCircle, Plus, X, FileWarning } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PhotoUploader, Photo } from '../shared/PhotoUploader';
import { getLokasi2Options, getGeneralLokasiOptions } from '../../lib/utils/locationRules';
import { generateWA_InitialReport } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { processPhotosToCollage } from '../../lib/utils/canvasUtils';
import { supabase } from '../../lib/supabaseClient';
import { toTitleCase } from '../../lib/data/masterData';
import { syncToGoogleSheets } from '../../lib/services/sheetsSyncService';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';

const CollageEditor = lazy(() => import('../shared/CollageEditor').then(m => ({ default: m.CollageEditor })));

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

export const TabInitialReport: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();

  const [formData, setFormData] = useState(() => {
    const now = new Date();
    const realYear = now.getFullYear();
    const realMonth = String(now.getMonth() + 1).padStart(2, '0');
    const realDay = String(now.getDate()).padStart(2, '0');
    const realDate = `${realYear}-${realMonth}-${realDay}`;
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');

    return {
      peralatan: '',
      lokasi1: '',
      lokasi2: '',
      lokasiList: [{ lokasi1: '', lokasi2: '' }] as { lokasi1: string; lokasi2: string }[],
      tanggal: realDate,
      waktuMulai: `${currentHour}:${currentMin}`,
      jamPengerjaan: '',
      menitPengerjaan: '',
      lamaPengerjaan: '-',
      teknisi: '-',
      permasalahan: '• ',
      status: 'On Progress',
      uraian: '• ',
      dampak: '1. ',
      tindakanMitigasi: '1. ',
      tindakan: '1. ',
      hasilTindakan: '1. '
    };
  });

  const [availableTeknisi, setAvailableTeknisi] = useState<{id: string, name: string, unit?: string}[]>([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState<string[]>([]);
  const [manualTeknisi, setManualTeknisi] = useState<string>('');
  const [tipePeralatanOptions, setTipePeralatanOptions] = useState<string[]>([]);
  const [isManualPeralatan, setIsManualPeralatan] = useState<boolean>(false);

  React.useEffect(() => {
    const fetchData = async () => {
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

  React.useEffect(() => {
    setFormData(prev => {
      const allTeknisi = [...selectedTeknisi];
      if (manualTeknisi.trim()) {
        const manualList = manualTeknisi.split(',').map(t => t.trim()).filter(t => t);
        allTeknisi.push(...manualList);
      }
      
      let teknisiStr = '-';
      if (allTeknisi.length === 1) {
        teknisiStr = allTeknisi[0];
      } else if (allTeknisi.length > 1) {
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

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customCollageFile, setCustomCollageFile] = useState<File | null>(null);
  const [customCollageUrl, setCustomCollageUrl] = useState<string | null>(null);

  const permasalahanRef = React.useRef<HTMLTextAreaElement>(null);
  const uraianRef = React.useRef<HTMLTextAreaElement>(null);
  const dampakRef = React.useRef<HTMLTextAreaElement>(null);
  const mitigasiRef = React.useRef<HTMLTextAreaElement>(null);
  const tindakanRef = React.useRef<HTMLTextAreaElement>(null);
  const hasilRef = React.useRef<HTMLTextAreaElement>(null);

  const autoResize = (ref: React.RefObject<HTMLTextAreaElement | null>, minHeight: number) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${Math.max(minHeight, ref.current.scrollHeight)}px`;
    }
  };

  React.useEffect(() => autoResize(permasalahanRef, 80), [formData.permasalahan]);
  React.useEffect(() => autoResize(uraianRef, 100), [formData.uraian]);
  React.useEffect(() => autoResize(dampakRef, 80), [formData.dampak]);
  React.useEffect(() => autoResize(mitigasiRef, 80), [formData.tindakanMitigasi]);
  React.useEffect(() => autoResize(tindakanRef, 100), [formData.tindakan]);
  React.useEffect(() => autoResize(hasilRef, 100), [formData.hasilTindakan]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'peralatan') {
      newFormData.lokasi1 = '';
      newFormData.lokasi2 = '';
      newFormData.lokasiList = [{ lokasi1: '', lokasi2: '' }];
    }

    setFormData(newFormData);
  };

  const handleJamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Hanya angka
    setFormData(prev => {
      const jam = val;
      const menit = prev.menitPengerjaan;
      const jamNum = parseInt(jam, 10) || 0;
      const menitNum = parseInt(menit, 10) || 0;
      let lama = '-';
      if (jamNum > 0 && menitNum > 0) lama = `${jamNum} Jam ${menitNum} Menit`;
      else if (jamNum > 0) lama = `${jamNum} Jam`;
      else if (menitNum > 0) lama = `${menitNum} Menit`;
      return { ...prev, jamPengerjaan: jam, lamaPengerjaan: lama };
    });
  };

  const handleMenitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Hanya angka
    setFormData(prev => {
      const jam = prev.jamPengerjaan;
      const menit = val;
      const jamNum = parseInt(jam, 10) || 0;
      const menitNum = parseInt(menit, 10) || 0;
      let lama = '-';
      if (jamNum > 0 && menitNum > 0) lama = `${jamNum} Jam ${menitNum} Menit`;
      else if (jamNum > 0) lama = `${jamNum} Jam`;
      else if (menitNum > 0) lama = `${menitNum} Menit`;
      return { ...prev, menitPengerjaan: menit, lamaPengerjaan: lama };
    });
  };

  const handleLokasiEntryChange = (index: number, field: 'lokasi1' | 'lokasi2', value: string) => {
    setFormData(prev => {
      const newList = [...(prev.lokasiList || [{ lokasi1: prev.lokasi1 || '', lokasi2: prev.lokasi2 || '' }])];
      newList[index] = { ...newList[index], [field]: value };
      if (field === 'lokasi1') {
        const pts = getLokasi2Options(value, [prev.peralatan]);
        newList[index].lokasi2 = (pts.length === 0 || (pts.length === 1 && pts[0] === '-')) ? '-' : '';
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
      const newList = [...(prev.lokasiList || [{ lokasi1: prev.lokasi1 || '', lokasi2: prev.lokasi2 || '' }]), { lokasi1: '', lokasi2: '' }];
      return { ...prev, lokasiList: newList };
    });
  };

  const removeLokasiEntry = (index: number) => {
    setFormData(prev => {
      const newList = [...(prev.lokasiList || [{ lokasi1: prev.lokasi1 || '', lokasi2: prev.lokasi2 || '' }])];
      newList.splice(index, 1);
      if (newList.length === 0) newList.push({ lokasi1: '', lokasi2: '' });
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
      setFormData(prev => ({ ...prev, peralatan: '', lokasi1: '', lokasi2: '', lokasiList: [{ lokasi1: '', lokasi2: '' }] }));
      return;
    }
    setFormData(prev => ({ ...prev, peralatan: value, lokasi1: '', lokasi2: '', lokasiList: [{ lokasi1: '', lokasi2: '' }] }));
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
      setFormData(prev => ({ ...prev, [field]: (prev as any)[field] + '\n• ' }));
    }
  };

  const handleNumberedChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: string) => {
    let value = e.target.value;
    if (value.length > 0 && !value.match(/^\d+\.\s/)) {
      value = '1. ' + value.replace(/^\d+\.\s*/, '');
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberedKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      const textBefore = textarea.value.substring(0, cursorPosition);
      const textAfter = textarea.value.substring(cursorPosition);
      
      const linesBefore = textBefore.split('\n');
      const nextNum = linesBefore.length + 1;
      
      const newText = textBefore + `\n${nextNum}. ` + textAfter;
      setFormData(prev => ({ ...prev, [field]: newText }));
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPosition + 3 + String(nextNum).length;
      }, 0);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let generatedCollageFile: File | null = customCollageFile;

    if (photos.length > 0 && !generatedCollageFile) {
      if (photos.length === 1) {
        generatedCollageFile = photos[0].file || null;
      } else {
        const collageResult = await processPhotosToCollage(photos);
        if (collageResult) {
          const res = await fetch(collageResult.url);
          const blob = await res.blob();
          generatedCollageFile = new File([blob], `Dokumentasi_InitialReport_${Date.now()}.jpg`, { type: 'image/jpeg' });
        }
      }
    }

    const message = generateWA_InitialReport(formData);

    const locList = formData.lokasiList && Array.isArray(formData.lokasiList) && formData.lokasiList.length > 0
      ? formData.lokasiList.filter((l: any) => l.lokasi1)
      : [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
      
    const lokasiFinal = locList.map((loc: any) => {
      return loc.lokasi1 + (loc.lokasi2 && loc.lokasi2 !== '-' ? ((formData.peralatan === 'Access Control' || loc.lokasi1 === 'HBSCP') ? ` ${loc.lokasi2}` : ` No.${loc.lokasi2}`) : '');
    }).join(', ') || '-';

    syncToGoogleSheets({
      jenis: 'Initial Report',
      tanggal: formData.tanggal,
      waktu: formData.waktuMulai || '-',
      lokasi: lokasiFinal,
      peralatan: formData.peralatan || '-',
      uraian: `[Permasalahan: ${formData.permasalahan}] ${formData.uraian}`,
      tindakLanjut: `[Mitigasi: ${formData.tindakanMitigasi}] [Tindakan: ${formData.tindakan}] [Hasil: ${formData.hasilTindakan}]`,
      status: formData.status || '-',
      teknisi: formData.teknisi,
      imageFile: generatedCollageFile
    });

    await shareToWhatsApp(message, generatedCollageFile, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  return (
    <div className="bg-white rounded-b-2xl">
      <div className="p-6 sm:p-8 bg-blue-50/50 border-b border-blue-100">
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
                    setFormData(prev => ({ ...prev, peralatan: '' }));
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
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-amber-600" /> Informasi Initial Report
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

                return (
                  <div key={index} className="flex gap-2 items-center">
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
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
            <Clock className="w-5 h-5 text-blue-600" /> Waktu & Pelaksana
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input type="date" name="tanggal" required value={formData.tanggal} onChange={handleFieldChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pukul</label>
              <input type="time" name="waktuMulai" required value={formData.waktuMulai} onChange={handleFieldChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lama Waktu Pengerjaan</label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formData.jamPengerjaan}
                    onChange={handleJamChange}
                    className="w-full pr-12 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm text-right"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-500 pointer-events-none">Jam</span>
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formData.menitPengerjaan}
                    onChange={handleMenitChange}
                    className="w-full pr-14 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm text-right"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-500 pointer-events-none">Menit</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                Teknisi Bertugas (Opsional, Default: -)
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
                <input 
                  type="text" 
                  placeholder={availableTeknisi.length === 0 ? "Ketik manual nama teknisi..." : "Tambah teknisi lain (pisahkan dengan koma)..."}
                  value={manualTeknisi} 
                  onChange={(e) => setManualTeknisi(e.target.value)} 
                  className="w-full mt-1 px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" /> Detail Laporan Awal
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Permasalahan</label>
            <textarea ref={permasalahanRef} name="permasalahan" required rows={3} value={formData.permasalahan} onChange={(e) => handleBulletChange(e, 'permasalahan')} onKeyDown={(e) => handleBulletKeyDown(e, 'permasalahan')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <input type="text" name="status" required placeholder="Cth: On Progress / Menunggu Sparepart" value={formData.status} onChange={handleFieldChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URAIAN</label>
            <p className="text-xs text-slate-500 mb-1">(Uraian kronologis kerusakan s.d saat dilaporkan)</p>
            <textarea ref={uraianRef} name="uraian" rows={4} value={formData.uraian} onChange={(e) => handleBulletChange(e, 'uraian')} onKeyDown={(e) => handleBulletKeyDown(e, 'uraian')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DAMPAK</label>
            <textarea ref={dampakRef} name="dampak" rows={3} value={formData.dampak} onChange={(e) => handleNumberedChange(e, 'dampak')} onKeyDown={(e) => handleNumberedKeyDown(e, 'dampak')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">TINDAKAN MITIGASI</label>
            <textarea ref={mitigasiRef} name="tindakanMitigasi" rows={3} value={formData.tindakanMitigasi} onChange={(e) => handleNumberedChange(e, 'tindakanMitigasi')} onKeyDown={(e) => handleNumberedKeyDown(e, 'tindakanMitigasi')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">TINDAKAN</label>
            <textarea ref={tindakanRef} name="tindakan" rows={4} value={formData.tindakan} onChange={(e) => handleNumberedChange(e, 'tindakan')} onKeyDown={(e) => handleNumberedKeyDown(e, 'tindakan')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">HASIL TINDAKAN</label>
            <textarea ref={hasilRef} name="hasilTindakan" rows={4} value={formData.hasilTindakan} onChange={(e) => handleNumberedChange(e, 'hasilTindakan')} onKeyDown={(e) => handleNumberedKeyDown(e, 'hasilTindakan')} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all"></textarea>
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
            {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!</> : <><Share2 className="w-6 h-6" /> Share Initial Report ke WA</>}
          </button>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Preview Initial Report (Real-time)
          </h3>
          <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
            <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
              {generateWA_InitialReport(formData)}
            </div>
          </div>
        </div>
      </form>

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
    </div>
  );
};
