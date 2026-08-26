import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileCheck, Share2, CheckCircle, FileText, Plus, Trash2, ArrowLeftRight, Download } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { PhotoUploader, Photo } from '../shared/PhotoUploader';
import { generateWA_BASerahTerima } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { generatePdfBlob } from '../../lib/services/pdfService';
import { processPhotosToCollage, compressImageFile } from '../../lib/utils/canvasUtils';
import { LiveCollagePreview } from '../shared/LiveCollagePreview';
import { SignaturePad } from '../shared/SignaturePad';
import { toTitleCase } from '../../lib/data/masterData';
import { supabase } from '../../lib/supabaseClient';

export interface BarangItem {
  id: string;
  nama: string;
  qty: number;
  satuan: string;
  kondisi: 'Baik / Baru' | 'Bekas / Normal' | 'Rusak / Perlu Perbaikan';
  snList: string[]; // Serial number for each item unit
}

const formatDateIndo = (d: string): string => {
  if (!d) return '-';
  const MONTHS_INDO = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const parts = d.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(day) && month >= 0 && month < 12) {
      return `${day} ${MONTHS_INDO[month]} ${year}`;
    }
  }
  return d;
};

export const TabBASerahTerima: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { dataApiT2, dataOmIasT2 } = useMasterDataStore();

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [dinasPersonelList, setDinasPersonelList] = useState<any[]>([]);

  useEffect(() => {
    const loadDinasPersonel = async () => {
      try {
        const currentHour = new Date().getHours();
        const targetShiftCode = (currentHour >= 8 && currentHour < 20) ? 'PS' : 'M';
        const { data } = await supabase
          .from('jadwal_shift')
          .select(`
            id, shift, status_kehadiran,
            personel:personel_id (id, nama, jabatan, unit_kerja(nama))
          `)
          .eq('tanggal', dateStr)
          .neq('shift', 'D');

        if (data && data.length > 0) {
          const filtered = data.filter((d: any) => {
            const s = (d.shift || '').toUpperCase();
            return targetShiftCode === 'PS' ? s === 'PS' : s === 'M';
          });
          const list = filtered.map((d: any) => {
            const unitName = d.personel?.unit_kerja?.nama || 'API T2';
            return {
              name: d.personel?.nama ? toTitleCase(d.personel.nama) : '',
              jabatan: d.personel?.jabatan || '',
              unit: unitName
            };
          }).filter(p => p.name);
          if (list.length > 0) {
            setDinasPersonelList(list);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching dinas personel:', err);
      }
      // Fallback if no attendance list found for today
      const fallbackList = [
        ...dataApiT2.map(p => ({ ...p, unit: 'API T2' })),
        ...dataOmIasT2.map(p => ({ ...p, unit: 'OM IAS T2' }))
      ];
      setDinasPersonelList(fallbackList);
    };

    loadDinasPersonel();
  }, [dateStr, dataApiT2, dataOmIasT2]);

  const [baData, setBaData] = useState({
    jenisTransaksi: 'masuk' as 'masuk' | 'keluar',
    tanggal: dateStr,
    waktu: timeStr,
    
    // Pihak Kesatu (Menyerahkan)
    penyerahNama: '',
    penyerahJabatan: '',
    penyerahInstansi: '', // Default kosong

    // Pihak Kedua (Menerima)
    penerimaNama: '',
    penerimaJabatan: 'T2 - Safety & Security Electronic Services',
    penerimaInstansi: 'T2 - Safety & Security Electronic Services',
  });

  const [items, setItems] = useState<BarangItem[]>([
    { id: '1', nama: '', qty: 1, satuan: 'Pcs', kondisi: 'Baik / Baru', snList: [''] }
  ]);

  const [signaturePenyerah, setSignaturePenyerah] = useState<string | null>(null);
  const [signaturePenerima, setSignaturePenerima] = useState<string | null>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [autoCollageFile, setAutoCollageFile] = useState<File | null>(null);
  const [autoCollageUrl, setAutoCollageUrl] = useState<string | null>(null);
  const [isSharingPdf, setIsSharingPdf] = useState<boolean>(false);
  const printableBaRef = React.useRef<HTMLDivElement>(null);
  const photosRef = React.useRef(photos);
  photosRef.current = photos;

  React.useEffect(() => {
    return () => {
      photosRef.current.forEach(p => {
        if (p.preview && p.preview.startsWith('blob:')) {
          URL.revokeObjectURL(p.preview);
        }
      });
      if (autoCollageUrl && autoCollageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(autoCollageUrl);
      }
    };
  }, [autoCollageUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'penyerahNama' || name === 'penerimaNama') {
      setBaData(prev => ({ ...prev, [name]: toTitleCase(value) }));
    } else {
      setBaData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleJenisToggle = (jenis: 'masuk' | 'keluar') => {
    setBaData(prev => ({
      ...prev,
      jenisTransaksi: jenis,
      penyerahNama: '',
      penyerahJabatan: jenis === 'keluar' ? 'T2 - Safety & Security Electronic Services' : '',
      penyerahInstansi: jenis === 'keluar' ? 'T2 - Safety & Security Electronic Services' : '',
      penerimaNama: '',
      penerimaJabatan: jenis === 'masuk' ? 'T2 - Safety & Security Electronic Services' : '',
      penerimaInstansi: jenis === 'masuk' ? 'T2 - Safety & Security Electronic Services' : ''
    }));
  };

  const handleSelectSsesPersonel = (name: string, isPenyerah: boolean) => {
    const p = dinasPersonelList.find(item => item.name === name) ||
              dataApiT2.find(item => item.name === name) ||
              dataOmIasT2.find(item => item.name === name);

    let unitFormatted = 'T2 - Safety & Security Electronic Services';
    let jabatanFormatted = 'T2 - Safety & Security Electronic Services';

    if (p) {
      if (p.unit === 'OM IAS T2' || p.unit === 'OM/IAS T2') {
        unitFormatted = 'OM IAS T2';
        jabatanFormatted = p.jabatan ? String(p.jabatan).trim() : 'Teknisi';
      } else {
        unitFormatted = 'T2 - Safety & Security Electronic Services';
        const rawJabatan = p.jabatan ? String(p.jabatan).trim() : '';
        jabatanFormatted = rawJabatan
          ? `T2 - Safety & Security Electronic Services ${rawJabatan}`
          : `T2 - Safety & Security Electronic Services`;
      }
    }

    if (isPenyerah) {
      setBaData(prev => ({
        ...prev,
        penyerahNama: name,
        penyerahJabatan: jabatanFormatted,
        penyerahInstansi: unitFormatted
      }));
    } else {
      setBaData(prev => ({
        ...prev,
        penerimaNama: name,
        penerimaJabatan: jabatanFormatted,
        penerimaInstansi: unitFormatted
      }));
    }
  };

  // Item handlers
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: String(Date.now()), nama: '', qty: 1, satuan: 'Pcs', kondisi: 'Baik / Baru', snList: [''] }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof BarangItem, value: any) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      if (field === 'qty') {
        const newQty = Math.max(1, parseInt(value, 10) || 1);
        const newSnList = Array.from({ length: newQty }, (_, i) => it.snList[i] || '');
        return { ...it, qty: newQty, snList: newSnList };
      }
      return { ...it, [field]: value };
    }));
  };

  const handleItemSnChange = (id: string, index: number, value: string) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const newSnList = [...it.snList];
      newSnList[index] = value;
      return { ...it, snList: newSnList };
    }));
  };

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

  const handleExportPDF = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baData.penyerahNama.trim() || !baData.penerimaNama.trim()) {
      alert('Harap isi nama Pihak Kesatu (Menyerahkan) dan Pihak Kedua (Menerima)!');
      return;
    }

    const validItems = items.filter(it => it.nama.trim() !== '');
    if (validItems.length === 0) {
      alert('Harap masukkan minimal 1 barang pada tabel daftar barang!');
      return;
    }

    setIsSharingPdf(true);

    try {
      let pdfFile: File | null = null;

      if (printableBaRef.current) {
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `BA_Serah_Terima_${baData.tanggal}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const pdfBlob = await generatePdfBlob(printableBaRef.current, opt);
        pdfFile = new File([pdfBlob], `BA_Serah_Terima_${baData.tanggal}.pdf`, { type: 'application/pdf' });
      }

      const payloadData = { ...baData, items: validItems };
      const message = generateWA_BASerahTerima(payloadData);

      await shareToWhatsApp(message, pdfFile, () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      });
    } catch (err) {
      console.error('Error generating/sharing PDF:', err);
      const payloadData = { ...baData, items: validItems };
      const message = generateWA_BASerahTerima(payloadData);
      await shareToWhatsApp(message, null, () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      });
    } finally {
      setIsSharingPdf(false);
    }
  };

  const payloadData = { ...baData, items: items.filter(it => it.nama.trim() !== '') };
  const isPenyerahSses = baData.jenisTransaksi === 'keluar';
  const isPenerimaSses = baData.jenisTransaksi === 'masuk';

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 print:p-0 print:m-0 print:space-y-0">
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-blue-600" /> Berita Acara Serah Terima Barang
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Form penyerahan & penerimaan barang dari/ke SSES T2 dengan pihak internal atau luar.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
          >
            <Download className="w-4 h-4" /> Cetak / Export PDF
          </button>
        </div>

        {/* Pemilihan Arah Transaksi */}
        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4 text-blue-600" /> Tipe / Arah Serah Terima Barang
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleJenisToggle('masuk')}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                baData.jenisTransaksi === 'masuk'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              📥 Terima Barang (Masuk ke SSES T2)
            </button>
            <button
              type="button"
              onClick={() => handleJenisToggle('keluar')}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                baData.jenisTransaksi === 'keluar'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              📤 Serah Barang (Keluar dari SSES T2)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                name="tanggal"
                required
                value={baData.tanggal}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu (WIB)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="time"
                name="waktu"
                required
                value={baData.waktu}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section Para Pihak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PIHAK KESATU (PENYERAH) */}
          <div className="bg-blue-50/60 p-4 sm:p-5 rounded-xl border border-blue-200 space-y-4">
            <h3 className="text-sm font-bold text-blue-900 flex items-center justify-between border-b border-blue-200 pb-2">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Pihak Kesatu (Yang Menyerahkan)
              </span>
              <span className="text-[10px] font-semibold uppercase bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                {isPenyerahSses ? 'SSES T2' : 'Pihak Luar / Lain'}
              </span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Penyerah {isPenyerahSses && '(Berdinas saat ini)'}
              </label>
              {isPenyerahSses ? (
                <select
                  required
                  value={baData.penyerahNama}
                  onChange={(e) => handleSelectSsesPersonel(e.target.value, true)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value="">-- Pilih Personel SSES T2 Berdinas --</option>
                  {dinasPersonelList.map((p, idx) => (
                    <option key={idx} value={p.name}>{p.name} {p.jabatan ? `(${p.jabatan})` : ''}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="penyerahNama"
                  required
                  value={baData.penyerahNama}
                  onChange={handleChange}
                  placeholder="Ketik nama lengkap penyerah..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan</label>
              <input
                type="text"
                name="penyerahJabatan"
                readOnly={isPenyerahSses}
                value={baData.penyerahJabatan}
                onChange={handleChange}
                placeholder="Contoh: Teknisi / Vendor / Staff"
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-medium ${
                  isPenyerahSses ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isPenyerahSses ? 'Unit' : 'Unit/PT'}
              </label>
              <input
                type="text"
                name="penyerahInstansi"
                readOnly={isPenyerahSses}
                value={baData.penyerahInstansi}
                onChange={handleChange}
                placeholder={isPenyerahSses ? 'T2 - Safety & Security Electronic Services' : 'Default kosong (bebas diisi nama unit/PT...)'}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-medium ${
                  isPenyerahSses ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            <SignaturePad
              label="Tanda Tangan Pihak Kesatu (Penyerah)"
              onSave={(dataUrl) => setSignaturePenyerah(dataUrl)}
              height={140}
            />
          </div>

          {/* PIHAK KEDUA (PENERIMA) */}
          <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-xl border border-emerald-200 space-y-4">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" /> Pihak Kedua (Yang Menerima)
              </span>
              <span className="text-[10px] font-semibold uppercase bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                {isPenerimaSses ? 'SSES T2' : 'Pihak Luar / Lain'}
              </span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Penerima {isPenerimaSses && '(Berdinas saat ini)'}
              </label>
              {isPenerimaSses ? (
                <select
                  required
                  value={baData.penerimaNama}
                  onChange={(e) => handleSelectSsesPersonel(e.target.value, false)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                >
                  <option value="">-- Pilih Personel SSES T2 Berdinas --</option>
                  {dinasPersonelList.map((p, idx) => (
                    <option key={idx} value={p.name}>{p.name} {p.jabatan ? `(${p.jabatan})` : ''}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="penerimaNama"
                  required
                  value={baData.penerimaNama}
                  onChange={handleChange}
                  placeholder="Ketik nama lengkap penerima..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan</label>
              <input
                type="text"
                name="penerimaJabatan"
                readOnly={isPenerimaSses}
                value={baData.penerimaJabatan}
                onChange={handleChange}
                placeholder="Contoh: Teknisi / Vendor / Staff"
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-medium ${
                  isPenerimaSses ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-emerald-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isPenerimaSses ? 'Unit' : 'Unit/PT'}
              </label>
              <input
                type="text"
                name="penerimaInstansi"
                readOnly={isPenerimaSses}
                value={baData.penerimaInstansi}
                onChange={handleChange}
                placeholder={isPenerimaSses ? 'T2 - Safety & Security Electronic Services' : 'Default kosong (bebas diisi nama unit/PT...)'}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none font-medium ${
                  isPenerimaSses ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-emerald-500'
                }`}
              />
            </div>

            <SignaturePad
              label="Tanda Tangan Pihak Kedua (Penerima)"
              onSave={(dataUrl) => setSignaturePenerima(dataUrl)}
              height={140}
            />
          </div>
        </div>

        {/* Tabel Dinamis Daftar Barang */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" /> Daftar Barang
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Barang
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3 min-w-[180px]">Nama Barang / Sparepart</th>
                  <th className="p-3 w-20 text-center">Jumlah</th>
                  <th className="p-3 w-24">Satuan</th>
                  <th className="p-3 min-w-[180px]">Serial Number</th>
                  <th className="p-3 min-w-[140px]">Kondisi</th>
                  <th className="p-3 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        value={item.nama}
                        onChange={(e) => handleItemChange(item.id, 'nama', e.target.value)}
                        placeholder="Nama barang..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-center focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.satuan}
                        onChange={(e) => handleItemChange(item.id, 'satuan', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Unit">Unit</option>
                        <option value="Set">Set</option>
                        <option value="Roll">Roll</option>
                        <option value="Box">Box</option>
                        <option value="Batang">Batang</option>
                        <option value="Meter">Meter</option>
                      </select>
                    </td>
                    <td className="p-2 space-y-1">
                      {Array.from({ length: item.qty }).map((_, snIdx) => (
                        <input
                          key={snIdx}
                          type="text"
                          value={item.snList[snIdx] || ''}
                          onChange={(e) => handleItemSnChange(item.id, snIdx, e.target.value)}
                          placeholder={item.qty > 1 ? `Serial Number ${snIdx + 1}` : 'Serial Number'}
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                        />
                      ))}
                    </td>
                    <td className="p-2">
                      <select
                        value={item.kondisi}
                        onChange={(e) => handleItemChange(item.id, 'kondisi', e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="Baik / Baru">Baik / Baru</option>
                        <option value="Bekas / Normal">Bekas / Normal</option>
                        <option value="Rusak / Perlu Perbaikan">Rusak / Perlu Perbaikan</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          onCollageChange={(file, url, annotation) => {
            setAutoCollageFile(file);
            setAutoCollageUrl(url);
            setCollageAnnotation(annotation);
          }}
        />

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            type="submit"
            disabled={isSharingPdf}
            className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform ${
              isSharingPdf
                ? 'bg-blue-600 text-white cursor-wait'
                : isCopied
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]'
                : 'bg-[#25D366] hover:bg-[#20b858] hover:shadow-xl hover:-translate-y-0.5 text-white'
            }`}
          >
            {isSharingPdf ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyiapkan PDF & Membuka WA...</span>
              </>
            ) : isCopied ? (
              <>
                <CheckCircle className="w-6 h-6 animate-pulse" /> Berhasil Disalin / Dibagikan!
              </>
            ) : (
              <>
                <Share2 className="w-6 h-6" /> Share BA Serah Terima Barang ke WA (Kirim PDF & Teks)
              </>
            )}
          </button>
        </div>
      </div>

      {/* RENDER PREVIEW SURAT BERITA ACARA RESMI DENGAN TANDA TANGAN (LEMBAR 1) */}
      <div className="mt-10 border-t border-slate-300 pt-8 print:mt-0 print:border-none print:p-0 print:pt-0">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Preview Dokumen Berita Acara Resmi (Siap Cetak / PDF)
          </h3>
          <button
            type="button"
            onClick={handleExportPDF}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Download className="w-4 h-4" /> Cetak PDF
          </button>
        </div>

        <div ref={printableBaRef} className="space-y-8 print:space-y-0">
          <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-md text-slate-900 font-sans space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:space-y-4 print:text-black">
          <div className="text-center border-b-2 border-slate-900 print:border-black pb-3 print:pb-2">
            <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide print:text-base text-slate-900 print:text-black">BERITA ACARA SERAH TERIMA BARANG</h1>
          </div>

          <p className="text-xs leading-relaxed text-slate-900 print:text-black">
            Pada tanggal <strong>{formatDateIndo(baData.tanggal)}</strong> pukul <strong>{baData.waktu} WIB</strong>, telah dilakukan serah terima barang antara pihak-pihak di bawah ini:
          </p>

          {/* PIHAK KESATU & PIHAK KEDUA STACKED (VERTIKAL) */}
          <div className="space-y-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-transparent print:p-0 print:border-none print:space-y-3">
            <div className="print:border-b print:border-slate-300 print:pb-2">
              <p className="font-bold text-blue-900 print:text-black border-b border-blue-200 print:border-none pb-1 mb-2">1. PIHAK KESATU (YANG MENYERAHKAN):</p>
              <table className="w-full text-xs">
                <tbody>
                  <tr><td className="w-24 text-slate-600 print:text-black font-medium py-0.5">Nama</td><td>: <strong className="text-black">{baData.penyerahNama || '-'}</strong></td></tr>
                  <tr><td className="text-slate-600 print:text-black font-medium py-0.5">Jabatan</td><td>: <span className="text-black">{baData.penyerahJabatan || '-'}</span></td></tr>
                  <tr><td className="text-slate-600 print:text-black font-medium py-0.5">{isPenyerahSses ? 'Unit' : 'Unit/PT'}</td><td>: <span className="text-black">{baData.penyerahInstansi || '-'}</span></td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <p className="font-bold text-emerald-900 print:text-black border-b border-emerald-200 print:border-none pb-1 mb-2">2. PIHAK KEDUA (YANG MENERIMA):</p>
              <table className="w-full text-xs">
                <tbody>
                  <tr><td className="w-24 text-slate-600 print:text-black font-medium py-0.5">Nama</td><td>: <strong className="text-black">{baData.penerimaNama || '-'}</strong></td></tr>
                  <tr><td className="text-slate-600 print:text-black font-medium py-0.5">Jabatan</td><td>: <span className="text-black">{baData.penerimaJabatan || '-'}</span></td></tr>
                  <tr><td className="text-slate-600 print:text-black font-medium py-0.5">{isPenerimaSses ? 'Unit' : 'Unit/PT'}</td><td>: <span className="text-black">{baData.penerimaInstansi || '-'}</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800 print:text-black">Daftar Barang yang diserahterimakan:</p>
            <table className="w-full border-collapse border border-slate-400 print:border-black text-xs print:text-[11px]">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-100 text-slate-800 print:text-black font-bold">
                  <th className="border border-slate-400 print:border-black p-2 text-center w-8">No</th>
                  <th className="border border-slate-400 print:border-black p-2 text-left">Nama Barang / Sparepart</th>
                  <th className="border border-slate-400 print:border-black p-2 text-center w-24">Jumlah</th>
                  <th className="border border-slate-400 print:border-black p-2 text-left">Serial Number</th>
                  <th className="border border-slate-400 print:border-black p-2 text-left w-36">Kondisi</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(it => it.nama.trim() !== '').map((item, idx) => {
                  const validSnList = item.snList.filter(s => s && s.trim() !== '');
                  return (
                    <tr key={item.id} className="print:break-inside-avoid">
                      <td className="border border-slate-400 print:border-black p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-400 print:border-black p-2 font-medium">{item.nama}</td>
                      <td className="border border-slate-400 print:border-black p-2 text-center whitespace-nowrap">{item.qty} {item.satuan}</td>
                      <td className="border border-slate-400 print:border-black p-2">
                        {validSnList.length > 0 ? (
                          validSnList.map((sn, snI) => (
                            <div key={snI}>{sn}</div>
                          ))
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="border border-slate-400 print:border-black p-2">{item.kondisi}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-800 print:text-black font-medium pt-1">
            Demikian Berita Acara ini dibuat dengan sebenar-benarnya untuk dapat digunakan sebagaimana mestinya.
          </p>

          {/* AREA TANDA TANGAN DIGITAL RESMI */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid print:break-inside-avoid print:pt-4">
            <div className="flex flex-col items-center justify-between min-h-[140px] print:min-h-[120px]">
              <p className="font-bold print:text-black">PIHAK KESATU (MENYERAHKAN)</p>
              <div className="my-2 h-20 flex items-center justify-center">
                {signaturePenyerah ? (
                  <img src={signaturePenyerah} alt="TTD Penyerah" className="max-h-20 object-contain" />
                ) : (
                  <div className="text-slate-400 print:text-transparent text-[10px] italic border border-dashed border-slate-300 print:border-none px-4 py-2 rounded">
                    (Belum Tanda Tangan)
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold underline uppercase print:text-black">{baData.penyerahNama || '( .................................... )'}</p>
                <p className="text-slate-600 print:text-black">{baData.penyerahJabatan}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between min-h-[140px] print:min-h-[120px]">
              <p className="font-bold print:text-black">PIHAK KEDUA (MENERIMA)</p>
              <div className="my-2 h-20 flex items-center justify-center">
                {signaturePenerima ? (
                  <img src={signaturePenerima} alt="TTD Penerima" className="max-h-20 object-contain" />
                ) : (
                  <div className="text-slate-400 print:text-transparent text-[10px] italic border border-dashed border-slate-300 print:border-none px-4 py-2 rounded">
                    (Belum Tanda Tangan)
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold underline uppercase print:text-black">{baData.penerimaNama || '( .................................... )'}</p>
                <p className="text-slate-600 print:text-black">{baData.penerimaJabatan}</p>
              </div>
            </div>
          </div>
        </div>

        {/* LEMBAR LAMPIRAN DOKUMENTASI / EVIDENCE (LEMBAR 2 - HANYA JIKA ADA FOTO YANG DITAMBAHKAN) */}
        {photos.length > 0 && (
          <div className="html2pdf__page-break print:mt-0 print:border-none print:p-0 print:pt-0 print:break-before-page print:[page-break-before:always]">
            <div data-html2canvas-ignore="true" className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> Preview Lembar Evidence / Lampiran Foto (Siap Cetak / PDF)
              </h3>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-md text-slate-900 font-sans space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:space-y-4 print:text-black">
              <div className="text-center border-b-2 border-slate-900 print:border-black pb-3 print:pb-2">
                <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide print:text-base text-slate-900 print:text-black">
                  LAMPIRAN DOKUMENTASI / EVIDENCE
                </h1>
                <p className="text-xs text-slate-600 print:text-black mt-1 font-semibold">
                  BERITA ACARA SERAH TERIMA BARANG — {formatDateIndo(baData.tanggal)}
                </p>
              </div>

              <div className="space-y-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-transparent print:p-0 print:border-none print:space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 print:text-black font-semibold">Pihak Kesatu (Menyerahkan):</p>
                    <p className="font-bold text-slate-900 print:text-black">{baData.penyerahNama || '-'}</p>
                    <p className="text-slate-600 print:text-black">{baData.penyerahInstansi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 print:text-black font-semibold">Pihak Kedua (Menerima):</p>
                    <p className="font-bold text-slate-900 print:text-black">{baData.penerimaNama || '-'}</p>
                    <p className="text-slate-600 print:text-black">{baData.penerimaInstansi || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800 print:text-black">Dokumentasi Fisik Barang:</p>
                {autoCollageUrl ? (
                  <div className="flex justify-center items-center rounded-lg border border-slate-300 print:border-slate-400 p-2 bg-slate-50 print:bg-white overflow-hidden">
                    <img
                      src={autoCollageUrl}
                      alt="Evidence Kolase Foto"
                      className="max-h-[580px] w-auto max-w-full object-contain rounded"
                    />
                  </div>
                ) : photos.length === 1 ? (
                  <div className="flex justify-center items-center rounded-lg border border-slate-300 print:border-slate-400 p-2 bg-slate-50 print:bg-white overflow-hidden">
                    <img
                      src={photos[0].preview}
                      alt="Evidence Foto Barang"
                      className="max-h-[580px] w-auto max-w-full object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((p, idx) => (
                      <div key={idx} className="border border-slate-300 print:border-slate-400 p-2 rounded-lg bg-slate-50 print:bg-white flex flex-col items-center">
                        <img
                          src={p.preview}
                          alt={`Evidence Foto ${idx + 1}`}
                          className="max-h-[260px] w-auto max-w-full object-contain rounded"
                        />
                        <span className="text-[10px] text-slate-600 print:text-black mt-1 font-semibold">Foto {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-500 print:text-black italic">
                Lampiran dokumentasi foto ini merupakan bagian resmi dari Berita Acara Serah Terima Barang tanggal {formatDateIndo(baData.tanggal)}.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Teks Format WA Realtime */}
      <div className="mt-8 border-t border-slate-200 pt-8 print:hidden">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Preview Format WhatsApp (Real-time)
        </h3>
        <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
          <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]">
            {generateWA_BASerahTerima(payloadData)}
          </div>
        </div>
      </div>
    </form>
  );
};
