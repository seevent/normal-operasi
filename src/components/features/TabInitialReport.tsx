import React, { useState } from 'react';
import { Cpu, FileText, MapPin, Clock, Calendar, AlertCircle, Share2, CheckCircle, Plus, X, FileWarning, Camera, Move, Trash2 } from 'lucide-react';
import { useAppStore, sayPet } from '../../store/useAppStore';
import { buildMissingFieldsMessage } from '../../lib/data/petMessages';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { PhotoUploader } from '../shared/PhotoUploader';
import { getLokasi2Options, getGeneralLokasiOptions } from '../../lib/utils/locationRules';
import { generateWA_InitialReport } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { processPhotosToCollage } from '../../lib/utils/canvasUtils';
import { usePhotoGroups } from '../../lib/hooks/usePhotoGroups';
import { useAutoResizeTextarea } from '../../lib/hooks/useAutoResizeTextarea';
import { supabase } from '../../lib/supabaseClient';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';
import { fetchOnDutyPersonnel } from '../../lib/services/operationalReportService';
import {
  getApplicableMitigasiList,
  getApplicableDampakList,
  getApplicablePermasalahanList,
  appendNumberedItem,
  appendBulletItem,
} from '../../lib/utils/initialReportShortcuts';

export const TabInitialReport: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const [showErrors, setShowErrors] = useState(false);

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
      lokasiList: [{ lokasi1: '', lokasi2: '', isManual: false }] as { lokasi1: string; lokasi2: string; isManual?: boolean }[],
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
  const [tipeToJenisMap, setTipeToJenisMap] = useState<Record<string, string>>({});
  const [tipeToVarianMap, setTipeToVarianMap] = useState<Record<string, string>>({});
  const [isManualPeralatan, setIsManualPeralatan] = useState<boolean>(false);

  React.useEffect(() => {
    const fetchData = async () => {
      const onDuty = await fetchOnDutyPersonnel();
      setAvailableTeknisi(onDuty);

      const { data: dataTipe } = await supabase
        .from('tipe_peralatan')
        .select('nama, varian, jenis_peralatan ( nama )')
        .order('nama', { ascending: true });
        
      if (dataTipe) {
        setTipePeralatanOptions(dataTipe.map((d: any) => d.nama));
        const jenisMapping: Record<string, string> = {};
        const varianMapping: Record<string, string> = {};
        dataTipe.forEach((d: any) => {
          if (d.nama) {
            if (d.jenis_peralatan?.nama) {
              jenisMapping[d.nama] = d.jenis_peralatan.nama;
            }
            if (d.varian) {
              varianMapping[d.nama] = d.varian;
            }
          }
        });
        setTipeToJenisMap(jenisMapping);
        setTipeToVarianMap(varianMapping);
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

  const {
    photoGroups,
    setPhotoGroups,
    handlePhotoUpload,
    removePhoto,
    updatePhotoZoom,
    handlePhotoDrop,
    addPhotoGroup,
    removePhotoGroup,
  } = usePhotoGroups();

  const permasalahanRef = useAutoResizeTextarea(formData.permasalahan);
  const uraianRef = useAutoResizeTextarea(formData.uraian);
  const dampakRef = useAutoResizeTextarea(formData.dampak);
  const mitigasiRef = useAutoResizeTextarea(formData.tindakanMitigasi);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (name === 'waktuMulai' && value) {
      if (formData.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === 'tanggal' && value) {
      if (value === todayStr && formData.waktuMulai && formData.waktuMulai > currentTimeStr) {
        alert(`Pukul direset karena melebihi waktu saat ini (${currentTimeStr})`);
        setFormData(prev => ({ ...prev, tanggal: value, waktuMulai: '' }));
        return;
      }
    }

    const newFormData = { ...formData, [name]: value };

    if (name === 'peralatan') {
      newFormData.lokasi1 = '';
      newFormData.lokasi2 = '';
      newFormData.lokasiList = [{ lokasi1: '', lokasi2: '', isManual: false }];
    }

    setFormData(newFormData);
  };

  const handleLokasiEntryChange =(index: number, field: 'lokasi1' | 'lokasi2' | 'isManualToggle', value: string) => {
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
    setFormData(prev => ({ ...prev, peralatan: value, lokasi1: '', lokasi2: '', lokasiList: [{ lokasi1: '', lokasi2: '', isManual: false }] }));
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

  const getSelectedJenisPeralatan = React.useCallback((): string => {
    if (!formData.peralatan) return '';
    if (tipeToJenisMap[formData.peralatan]) {
      return tipeToJenisMap[formData.peralatan];
    }
    const penempatan = useMasterDataStore.getState().penempatanData || [];
    for (const p of penempatan) {
      if (p.tipe_peralatan?.nama === formData.peralatan && p.tipe_peralatan?.jenis_peralatan?.nama) {
        return p.tipe_peralatan.jenis_peralatan.nama;
      }
    }
    const lower = formData.peralatan.toLowerCase();
    if (lower.includes('mirroring')) return 'Mirroring X-Ray';
    if (lower.includes('extension conveyor')) return 'Extension Conveyor';
    if (lower.includes('atrs')) return 'ATRS';
    if (lower.includes('x-ray') || lower.includes('xray')) return 'X-Ray';
    if (lower.includes('wtmd')) return 'WTMD';
    if (lower.includes('hhmd')) return 'HHMD';
    if (lower.includes('body scanner')) return 'Body Scanner';
    if (lower.includes('etd')) return 'ETD';
    if (lower.includes('access control')) return 'Access Control';
    if (lower.includes('autogate')) return 'Autogate';
    if (lower.includes('cctv')) return 'CCTV';
    return formData.peralatan;
  }, [formData.peralatan, tipeToJenisMap]);

  const getSelectedVarianPeralatan = React.useCallback((): string => {
    if (!formData.peralatan) return '';
    if (tipeToVarianMap[formData.peralatan]) {
      return tipeToVarianMap[formData.peralatan];
    }
    const penempatan = useMasterDataStore.getState().penempatanData || [];
    for (const p of penempatan) {
      if (p.tipe_peralatan?.nama === formData.peralatan && p.tipe_peralatan?.varian) {
        return p.tipe_peralatan.varian;
      }
    }
    return '';
  }, [formData.peralatan, tipeToVarianMap]);

  const shortcutContext = React.useMemo(
    () => ({
      peralatan: formData.peralatan,
      jenis: getSelectedJenisPeralatan(),
      varian: getSelectedVarianPeralatan(),
      lokasiList: formData.lokasiList,
      lokasi1: formData.lokasi1,
    }),
    [formData.peralatan, formData.lokasiList, formData.lokasi1, getSelectedJenisPeralatan, getSelectedVarianPeralatan]
  );

  const mitigasiShortcuts = React.useMemo(() => getApplicableMitigasiList(shortcutContext), [shortcutContext]);
  const dampakShortcuts = React.useMemo(() => getApplicableDampakList(shortcutContext), [shortcutContext]);
  const permasalahanShortcuts = React.useMemo(
    () => getApplicablePermasalahanList(shortcutContext),
    [shortcutContext]
  );

  const handleAddMitigasiItem = (itemText: string) => {
    setFormData(prev => {
      const next = appendNumberedItem(prev.tindakanMitigasi, itemText);
      return next === null ? prev : { ...prev, tindakanMitigasi: next };
    });
  };

  const handleAddDampakItem = (itemText: string) => {
    setFormData(prev => {
      const next = appendNumberedItem(prev.dampak, itemText);
      return next === null ? prev : { ...prev, dampak: next };
    });
  };

  const handleAddPermasalahanItem = (itemText: string) => {
    setFormData(prev => {
      const next = appendBulletItem(prev.permasalahan, itemText);
      return next === null ? prev : { ...prev, permasalahan: next };
    });
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

            <PhotoUploader
              photos={group.photos}
              onUpload={(e) => handlePhotoUpload(group.id, e)}
              onRemove={(pIndex) => removePhoto(group.id, pIndex)}
              onZoom={(pIndex, delta) => updatePhotoZoom(group.id, pIndex, delta)}
              onDrop={(e, targetIndex) => handlePhotoDrop(e, group.id, targetIndex)}
              onEdit={(pIndex, updatedPhoto) => {
                setPhotoGroups(prev => prev.map(g => {
                  if (g.id !== group.id) return g;
                  const newPhotos = [...g.photos];
                  newPhotos[pIndex] = updatedPhoto;
                  return { ...g, photos: newPhotos };
                }));
              }}
              listType={`initial-${group.id}`}
              hideHeader={true}
            />
            
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation check
    const activeLocs = (formData.lokasiList || [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }]).filter((l: any) => l.lokasi1);
    const hasEmptyPeralatan = !formData.peralatan;
    const hasEmptyLokasi = activeLocs.length === 0;
    const hasEmptyTanggal = !formData.tanggal;
    const hasEmptyWaktu = !formData.waktuMulai;
    const hasEmptyTeknisi = !formData.teknisi || formData.teknisi === '-';
    const hasEmptyPermasalahan = !formData.permasalahan || formData.permasalahan.trim() === '•' || formData.permasalahan.trim() === '';
    const hasEmptyUraian = !formData.uraian || formData.uraian.trim() === '•' || formData.uraian.trim() === '';
    const hasEmptyDampak = !formData.dampak || formData.dampak.trim() === '1.' || formData.dampak.trim() === '';
    const hasEmptyMitigasi = !formData.tindakanMitigasi || formData.tindakanMitigasi.trim() === '1.' || formData.tindakanMitigasi.trim() === '';

    if (hasEmptyPeralatan || hasEmptyLokasi || hasEmptyTanggal || hasEmptyWaktu || hasEmptyTeknisi || hasEmptyPermasalahan || hasEmptyUraian || hasEmptyDampak || hasEmptyMitigasi) {
      setShowErrors(true);
      const missingMessage = buildMissingFieldsMessage([
        hasEmptyPeralatan ? 'peralatan' : '',
        hasEmptyLokasi ? 'lokasi' : '',
        hasEmptyTanggal ? 'tanggal' : '',
        hasEmptyWaktu ? 'waktu mulai' : '',
        hasEmptyTeknisi ? 'teknisi bertugas' : '',
        hasEmptyPermasalahan ? 'permasalahan' : '',
        hasEmptyUraian ? 'uraian' : '',
        hasEmptyDampak ? 'dampak' : '',
        hasEmptyMitigasi ? 'tindakan mitigasi' : '',
      ]);
      if (missingMessage) sayPet(missingMessage, 'warning');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const customFilesArray: File[] = [];

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

    const message = generateWA_InitialReport(formData);

    await shareToWhatsApp(message, customFilesArray.length > 0 ? customFilesArray : null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl">
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
                  className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm ${
                    showErrors && !formData.peralatan ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-blue-300'
                  }`}
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
              <select 
                required 
                value={formData.peralatan} 
                onChange={handlePeralatanChange} 
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium shadow-sm cursor-pointer appearance-none ${
                  showErrors && !formData.peralatan ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-blue-300'
                }`}
              >
                <option value="">-- Pilih Peralatan --</option>
                {tipePeralatanOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="MANUAL_ENTRY">+ Ketik Manual (Peralatan Lainnya)</option>
              </select>
            )}
            {showErrors && !formData.peralatan && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> Pilihan Peralatan wajib diisi!
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
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

                const isRowManual = loc.isManual || isManualPeralatan;
                return (
                  <div key={index} className="flex flex-col gap-1">
                    <div className="flex gap-2 items-center">
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
                              className={`w-full pl-10 pr-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 font-medium shadow-sm ${
                                showErrors && index === 0 && !loc.lokasi1 ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-blue-300'
                              }`}
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
                              className={`w-full pl-10 pr-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:bg-slate-200 disabled:opacity-70 disabled:cursor-not-allowed text-sm ${
                                showErrors && index === 0 && !loc.lokasi1 ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                              }`}
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
                    {showErrors && index === 0 && !loc.lokasi1 && (
                      <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Lokasi wajib dipilih!
                      </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input type="date" name="tanggal" required value={formData.tanggal} onChange={handleFieldChange} className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  showErrors && !formData.tanggal ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                }`} />
              </div>
              {showErrors && !formData.tanggal && (
                <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Tanggal wajib diisi!
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pukul</label>
              <input 
                type="time" 
                name="waktuMulai" 
                required 
                max={formData.tanggal === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined}
                value={formData.waktuMulai} 
                onChange={handleFieldChange} 
                className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  showErrors && !formData.waktuMulai ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
                }`} 
              />
              {showErrors && !formData.waktuMulai && (
                <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Wajib diisi!
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                Teknisi Bertugas (Otomatis dari Shift)
                {availableTeknisi.length === 0 && <span className="text-xs text-rose-500 font-normal">*(Tidak ada teknisi hadir/jadwal kosong)</span>}
              </label>
              
              <div className={`flex flex-col gap-3 bg-slate-50 p-3 rounded-lg border ${
                showErrors && (!formData.teknisi || formData.teknisi === '-') ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-200'
              }`}>
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
              {showErrors && (!formData.teknisi || formData.teknisi === '-') && (
                <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Teknisi bertugas wajib dipilih/diisi!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" /> Detail Laporan Awal
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Permasalahan</label>
            {permasalahanShortcuts.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-0.5">Shortcut:</span>
                {permasalahanShortcuts.map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPermasalahanItem(text)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 font-medium transition-all text-left cursor-pointer"
                    title="Klik untuk menyisipkan ke isian permasalahan"
                  >
                    + {text}
                  </button>
                ))}
              </div>
            )}
            <textarea ref={permasalahanRef} name="permasalahan" required rows={3} value={formData.permasalahan} onChange={(e) => handleBulletChange(e, 'permasalahan')} onKeyDown={(e) => handleBulletKeyDown(e, 'permasalahan')} className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all ${
              showErrors && (!formData.permasalahan || formData.permasalahan.trim() === '•') ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
            }`}></textarea>
            {showErrors && (!formData.permasalahan || formData.permasalahan.trim() === '•') && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> Detail Permasalahan wajib diisi!
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <input type="text" name="status" required placeholder="Cth: On Progress / Menunggu Sparepart" value={formData.status} onChange={handleFieldChange} className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm ${
              showErrors && !formData.status ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
            }`} />
            {showErrors && !formData.status && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> Status wajib diisi!
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URAIAN</label>
            <p className="text-xs text-slate-500 mb-1">(Uraian kronologis kerusakan s.d saat dilaporkan)</p>
            <textarea ref={uraianRef} name="uraian" required rows={4} value={formData.uraian} onChange={(e) => handleBulletChange(e, 'uraian')} onKeyDown={(e) => handleBulletKeyDown(e, 'uraian')} className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all ${
              showErrors && (!formData.uraian || formData.uraian.trim() === '•' || formData.uraian.trim() === '') ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
            }`}></textarea>
            {showErrors && (!formData.uraian || formData.uraian.trim() === '•' || formData.uraian.trim() === '') && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> Uraian kronologis wajib diisi!
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DAMPAK</label>

            {dampakShortcuts.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-0.5">Shortcut:</span>
                {dampakShortcuts.map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddDampakItem(text)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 font-medium transition-all text-left cursor-pointer"
                    title="Klik untuk menyisipkan ke isian dampak"
                  >
                    + {text}
                  </button>
                ))}
              </div>
            )}

            <textarea ref={dampakRef} name="dampak" required rows={3} value={formData.dampak} onChange={(e) => handleNumberedChange(e, 'dampak')} onKeyDown={(e) => handleNumberedKeyDown(e, 'dampak')} className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all ${
              showErrors && (!formData.dampak || formData.dampak.trim() === '1.' || formData.dampak.trim() === '') ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
            }`}></textarea>
            {showErrors && (!formData.dampak || formData.dampak.trim() === '1.' || formData.dampak.trim() === '') && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> Dampak wajib diisi!
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">MITIGASI</label>
            
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-0.5">Shortcut:</span>
              {mitigasiShortcuts.map((text, idx) => {
                const isBreakglass = text === 'Pecahkan Emergency Breakglass jika diperlukan.';
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddMitigasiItem(text)}
                    style={isBreakglass ? { fontSize: 'calc(0.75rem * 1.15)' } : undefined}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all text-left cursor-pointer border ${
                      isBreakglass
                        ? 'text-xs bg-red-50 hover:bg-red-100 text-red-600 border-red-300 hover:border-red-400 font-bold'
                        : 'text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border-slate-200 text-slate-700'
                    }`}
                    title="Klik untuk menyisipkan ke isian mitigasi"
                  >
                    + {text}
                  </button>
                );
              })}
            </div>

            <textarea ref={mitigasiRef} name="tindakanMitigasi" required rows={3} value={formData.tindakanMitigasi} onChange={(e) => handleNumberedChange(e, 'tindakanMitigasi')} onKeyDown={(e) => handleNumberedKeyDown(e, 'tindakanMitigasi')} className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed transition-all ${
              showErrors && (!formData.tindakanMitigasi || formData.tindakanMitigasi.trim() === '1.' || formData.tindakanMitigasi.trim() === '') ? 'border-red-500 ring-2 ring-red-300 bg-red-50/50' : 'border-slate-300'
            }`}></textarea>
            {showErrors && (!formData.tindakanMitigasi || formData.tindakanMitigasi.trim() === '1.' || formData.tindakanMitigasi.trim() === '') && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> Mitigasi wajib diisi!
              </p>
            )}
          </div>
        </div>

        {renderPhotoSection()}

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
      </div>
    </form>
  );
};
