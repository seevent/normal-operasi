// src/components/features/TabShiftReport.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, FileText, Loader2, CheckCircle, Clock, Plus, 
  Edit, Trash2, X, Share2, ExternalLink, Printer, BarChart2, Save
} from 'lucide-react';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { generatePdfBlob } from '../../lib/services/pdfService';
import { supabase } from '../../lib/supabaseClient';
import { 
  fetchShiftOperationalLogs, 
  fetchDailyShiftCounts,
  fetchChecklistSummary, 
  saveChecklistSummary,
  ChecklistSummaryItem,
  saveOperationalLog,
  getReportDefaultDateAndShift,
  isTimeWithinShiftBoundary
} from '../../lib/services/operationalReportService';
import { uploadPhotoToCloudinary } from '../../lib/services/cloudinaryService';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const TabShiftReport: React.FC = () => {
  const [date, setDate] = useState<string>(() => getReportDefaultDateAndShift().date);
  
  const [shift, setShift] = useState<'PS' | 'M' | 'ALL'>(() => getReportDefaultDateAndShift().shift);

  const [dailyCounts, setDailyCounts] = useState<{ ps: number; m: number; total: number }>({ ps: 0, m: 0, total: 0 });
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [sharingWa, setSharingWa] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Kesiapan Fasilitas (Checklist Summary) State
  const [checklistSummary, setChecklistSummary] = useState<ChecklistSummaryItem[]>([
    { no: 1, nama: 'XRAY', total: 42, operasi: 42, rusak: 0, persenOperasi: 1, persenRusak: 0 },
    { no: 2, nama: 'WTMD', total: 21, operasi: 21, rusak: 0, persenOperasi: 1, persenRusak: 0 },
    { no: 3, nama: 'HHMD', total: 26, operasi: 26, rusak: 0, persenOperasi: 1, persenRusak: 0 },
    { no: 4, nama: 'BODY SCANNER', total: 8, operasi: 8, rusak: 0, persenOperasi: 1, persenRusak: 0 },
    { no: 5, nama: 'ETD', total: 5, operasi: 4, rusak: 1, persenOperasi: 0.8, persenRusak: 0.2 },
    { no: 6, nama: 'ACCESS CONTROL', total: 126, operasi: 126, rusak: 0, persenOperasi: 1, persenRusak: 0 },
    { no: 7, nama: 'CCTV', total: 48, operasi: 48, rusak: 0, persenOperasi: 1, persenRusak: 0 }
  ]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceSaveTimer = useRef<any>(null);

  const handleChecklistSummaryChange = (no: number, field: 'total' | 'rusak' | 'operasi', val: number) => {
    const cleanVal = Math.max(0, isNaN(val) ? 0 : val);
    setChecklistSummary(prev => {
      const updated = prev.map(item => {
        if (item.no !== no) return item;
        let newTotal = item.total;
        let newRusak = item.rusak;
        let newOperasi = item.operasi;

        if (field === 'total') {
          newTotal = cleanVal;
          if (newRusak > newTotal) newRusak = newTotal;
          newOperasi = Math.max(0, newTotal - newRusak);
        } else if (field === 'rusak') {
          newRusak = Math.min(cleanVal, newTotal);
          newOperasi = Math.max(0, newTotal - newRusak);
        } else if (field === 'operasi') {
          newOperasi = cleanVal;
          newTotal = newOperasi + newRusak;
        }

        return {
          ...item,
          total: newTotal,
          rusak: newRusak,
          operasi: newOperasi,
          persenOperasi: newTotal > 0 ? newOperasi / newTotal : 0,
          persenRusak: newTotal > 0 ? newRusak / newTotal : 0
        };
      });

      // Auto-save debounced to Supabase database
      setSaveStatus('saving');
      if (debounceSaveTimer.current) {
        clearTimeout(debounceSaveTimer.current);
      }
      debounceSaveTimer.current = setTimeout(async () => {
        const res = await saveChecklistSummary(date, shift, updated);
        if (res.success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2500);
        } else {
          setSaveStatus('error');
        }
      }, 600);

      return updated;
    });
  };

  const handleManualSaveSummary = async () => {
    setSaveStatus('saving');
    const res = await saveChecklistSummary(date, shift, checklistSummary);
    if (res.success) {
      setSaveStatus('saved');
      setStatusMsg({ text: "Data kelaikan peralatan berhasil disimpan ke database.", type: 'success' });
      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMsg(null);
      }, 3000);
    } else {
      setSaveStatus('error');
      setStatusMsg({ text: "Gagal menyimpan data kelaikan peralatan ke database.", type: 'error' });
    }
  };

  // CRUD State
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingRowIndex, setEditingRowIndex] = useState<any>(null);
  const [crudSubmitting, setCrudSubmitting] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<any>(null);

  const [crudForm, setCrudForm] = useState({
    jenis: 'Kegiatan' as 'Perbaikan' | 'Kegiatan' | 'Storing' | 'Kalibrasi',
    waktu: '',
    peralatan: '',
    lokasi: '',
    uraian: '',
    tindakLanjut: '-',
    status: 'Normal Operasi'
  });
  const [crudPhotoFile, setCrudPhotoFile] = useState<File | null>(null);
  const [crudPhotoPreview, setCrudPhotoPreview] = useState<string | null>(null);

  const [apiPersonil, setApiPersonil] = useState<any[]>([]);
  const [iasPersonil, setIasPersonil] = useState<any[]>([]);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Load Personil On Duty & Shift Data
  useEffect(() => {
    const fetchPersonil = async () => {
      try {
        let query = supabase
          .from('jadwal_shift')
          .select(`
            id, shift, status_kehadiran,
            personel:personel_id (id, nama, no_hp, unit_kerja(nama))
          `)
          .eq('tanggal', date);

        if (shift !== 'ALL') {
          query = query.eq('shift', shift);
        }

        const { data, error } = await query;

        if (!error && data) {
          const hadir = data.filter(d => d.status_kehadiran !== 'Off' && d.status_kehadiran !== 'Cuti' && d.status_kehadiran !== 'Sakit' && d.status_kehadiran !== 'Izin');
          
          const apiList = hadir.filter((d: any) => {
             const u = d.personel?.unit_kerja?.nama?.toUpperCase() || '';
             return u === 'API T2' || u.includes('API') || u.includes('ANGKASA PURA');
          });
          const iasList = hadir.filter((d: any) => {
             const u = d.personel?.unit_kerja?.nama?.toUpperCase() || '';
             return u === 'OM/IAS T2' || u.includes('IAS') || u.includes('INJOURNEY');
          });

          setApiPersonil(apiList);
          setIasPersonil(iasList);
        }
      } catch (err) {
        console.error("Gagal fetch personil", err);
      }
    };

    fetchPersonil();
    loadShiftReports(date, shift);
  }, [date, shift]);

  // Auto-switch saat jam 10:00 (ke tanggal hari ini & PS) dan jam 22:00 (ke tanggal hari ini & M)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if ((now.getHours() === 10 || now.getHours() === 22) && now.getMinutes() === 0) {
        const next = getReportDefaultDateAndShift(now);
        setDate(next.date);
        setShift(next.shift);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch log operasional dan ringkasan checklist dari database
  const loadShiftReports = async (targetDate: string, targetShift: string) => {
    setFetchingLive(true);
    try {
      // 1. Fetch data kegiatan dari laporan_operasional Supabase dan hitung rekap per shift
      const [logs, counts] = await Promise.all([
        fetchShiftOperationalLogs(targetDate, targetShift),
        fetchDailyShiftCounts(targetDate)
      ]);
      setDailyCounts(counts);

      const mappedReports = logs.map((item, idx) => ({
        rowIndex: item.id || idx,
        id: item.id,
        shift: item.shift,
        Jenis: item.jenis,
        Waktu: item.waktu || '-',
        Peralatan: item.peralatan || '-',
        Lokasi: item.lokasi || '-',
        kategori_maintenance: item.kategori_maintenance,
        Uraian: item.uraian || '-',
        TindakLanjut: item.tindak_lanjut || '-',
        Status: item.status || 'Normal Operasi',
        imageUrl: (item.foto_urls && item.foto_urls.length > 0) ? item.foto_urls[0] : null,
        fotoUrls: item.foto_urls || []
      }));
      setReports(mappedReports);

      // 2. Fetch data checklist summary dari Supabase
      const summaryShift = targetShift === 'ALL' ? 'PS' : targetShift;
      const summary = await fetchChecklistSummary(targetDate, summaryShift);
      if (summary && summary.length > 0) {
        setChecklistSummary(summary);
      }
    } catch (err) {
      console.error("Gagal load shift reports:", err);
    } finally {
      setFetchingLive(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingRowIndex(null);
    setCrudPhotoFile(null);
    setCrudPhotoPreview(null);
    const now = new Date();
    const timeStr = `${('0'+now.getHours()).slice(-2)}:${('0'+now.getMinutes()).slice(-2)}`;
    setCrudForm({
      jenis: 'Kegiatan',
      waktu: timeStr,
      peralatan: '',
      lokasi: '',
      uraian: '',
      tindakLanjut: '-',
      status: 'Normal Operasi'
    });
    setIsCrudModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setModalMode('edit');
    setEditingRowIndex(item.rowIndex);
    setCrudPhotoFile(null);
    setCrudPhotoPreview(item.imageUrl || null);
    setCrudForm({
      jenis: (item.Jenis as any) || 'Kegiatan',
      waktu: item.Waktu || '',
      peralatan: item.Peralatan || '',
      lokasi: item.Lokasi || '',
      uraian: item.Uraian || '',
      tindakLanjut: item.TindakLanjut || '-',
      status: item.Status || 'Normal Operasi'
    });
    setIsCrudModalOpen(true);
  };

  const handleDeleteItem = async (rowIndex: any, namaAlat: string) => {
    if (!window.confirm(`Hapus laporan kegiatan "${namaAlat}" ini?`)) return;
    setDeletingRowIndex(rowIndex);
    
    // Hapus dari Supabase jika ada ID
    const targetItem = reports.find(r => r.rowIndex === rowIndex);
    if (targetItem?.id) {
      try {
        await supabase.from('laporan_operasional').delete().eq('id', targetItem.id);
      } catch (err) {
        console.error("Gagal hapus dari DB:", err);
      }
    }

    setReports(prev => prev.filter(item => item.rowIndex !== rowIndex));
    setStatusMsg({ text: "Laporan berhasil dihapus.", type: 'success' });
    setDeletingRowIndex(null);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudSubmitting(true);
    try {
      // 1. Upload foto jika pengguna memilih file foto baru
      let uploadedUrl: string | null = null;
      if (crudPhotoFile) {
        const uploadRes = await uploadPhotoToCloudinary(crudPhotoFile, `${crudForm.jenis}_${Date.now()}.jpg`);
        if (uploadRes && uploadRes.status === 'success' && uploadRes.url) {
          uploadedUrl = uploadRes.url;
        } else if (uploadRes && uploadRes.status === 'error') {
          alert(`⚠️ Foto gagal disimpan ke Cloudinary:\n${uploadRes.message}`);
        }
      }

      if (modalMode === 'add') {
        const finalFotoUrls = uploadedUrl ? [uploadedUrl] : [];
        // Simpan ke Supabase
        const dbRes = await saveOperationalLog({
          tanggal: date,
          shift: shift,
          jenis: crudForm.jenis,
          waktu: crudForm.waktu,
          lokasi: crudForm.lokasi || '-',
          peralatan: crudForm.peralatan || '-',
          kategori_maintenance: crudForm.jenis === 'Perbaikan' ? 'CORRECTIVE' : (crudForm.jenis === 'Storing' ? 'STORING' : 'KEGIATAN'),
          uraian: crudForm.uraian || '-',
          tindak_lanjut: crudForm.tindakLanjut || '-',
          status: crudForm.status || 'Normal Operasi',
          foto_urls: finalFotoUrls
        });

        const newReport = {
          rowIndex: dbRes.data?.[0]?.id || Date.now(),
          id: dbRes.data?.[0]?.id,
          Jenis: crudForm.jenis,
          Waktu: crudForm.waktu,
          Peralatan: crudForm.peralatan || '-',
          Lokasi: crudForm.lokasi || '-',
          Uraian: crudForm.uraian || '-',
          TindakLanjut: crudForm.tindakLanjut || '-',
          Status: crudForm.status || 'Normal Operasi',
          imageUrl: uploadedUrl,
          fotoUrls: finalFotoUrls
        };
        setReports(prev => [...prev, newReport]);
        setStatusMsg({ text: "Laporan baru berhasil ditambahkan.", type: 'success' });
      } else if (modalMode === 'edit' && editingRowIndex !== null) {
        const targetItem = reports.find(r => r.rowIndex === editingRowIndex);
        const finalFotoUrls = uploadedUrl ? [uploadedUrl] : (targetItem?.fotoUrls || (targetItem?.imageUrl ? [targetItem.imageUrl] : []));
        const finalImageUrl = uploadedUrl || targetItem?.imageUrl || null;

        if (targetItem?.id) {
          await supabase.from('laporan_operasional').update({
            jenis: crudForm.jenis,
            waktu: crudForm.waktu,
            peralatan: crudForm.peralatan,
            lokasi: crudForm.lokasi,
            uraian: crudForm.uraian,
            tindak_lanjut: crudForm.tindakLanjut,
            status: crudForm.status,
            foto_urls: finalFotoUrls
          }).eq('id', targetItem.id);
        }

        setReports(prev => prev.map(r => r.rowIndex === editingRowIndex ? {
          ...r,
          Jenis: crudForm.jenis,
          Waktu: crudForm.waktu,
          Peralatan: crudForm.peralatan || '-',
          Lokasi: crudForm.lokasi || '-',
          Uraian: crudForm.uraian || '-',
          TindakLanjut: crudForm.tindakLanjut || '-',
          Status: crudForm.status || 'Normal Operasi',
          imageUrl: finalImageUrl,
          fotoUrls: finalFotoUrls
        } : r));
        setStatusMsg({ text: "Laporan berhasil diperbarui.", type: 'success' });
      }
      setIsCrudModalOpen(false);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: "Gagal menyimpan perubahan.", type: 'error' });
    } finally {
      setCrudSubmitting(false);
    }
  };

  const getDayName = (d: string) => {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return days[new Date(d).getDay()];
  };
  
  const formatDateIndo = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTHS[dt.getMonth()].toUpperCase()} ${dt.getFullYear()}`;
  };

  // Format Pesan WhatsApp Executive Summary
  // Format Pesan WhatsApp Executive Summary
  const generateShiftWaSummary = () => {
    const formattedDate = formatDateIndo(date);
    const dayName = getDayName(date);
    const shiftLabel = shift === 'M' ? 'Malam (M)' : (shift === 'PS' ? 'Pagi (PS)' : 'Semua Shift (24 Jam)');

    const apiNames = apiPersonil.map(p => p.personel?.nama).filter(Boolean).join(', ') || '-';
    const iasNames = iasPersonil.map(p => p.personel?.nama).filter(Boolean).join(', ') || '-';

    let summaryText = `*LAPORAN HARIAN SSES TERMINAL 2*\n`;
    summaryText += `*Hari/Tanggal:* ${dayName}, ${formattedDate}\n`;
    summaryText += `*Dinas:* Shift ${shiftLabel} (Area D, E, F, Umroh)\n\n`;

    summaryText += `*👨‍✈️ Personel On Duty:*\n`;
    summaryText += `- API T2: ${apiNames}\n`;
    summaryText += `- OM/IAS: ${iasNames}\n\n`;

    if (checklistSummary.length > 0) {
      summaryText += `*📊 Kesiapan Peralatan (Serviceability):*\n`;
      checklistSummary.forEach(item => {
        const icon = item.rusak > 0 ? '⚠️' : '✅';
        const persen = Math.round(item.persenOperasi * 100);
        summaryText += `- ${item.nama}: ${item.operasi}/${item.total} (${persen}%) ${icon}\n`;
      });
      summaryText += `\n`;
    }

    summaryText += `*🔧 Tindak Lanjut & Kegiatan:*\n`;
    if (reports.length === 0) {
      summaryText += `_Tidak ada catatan gangguan / kegiatan khusus pada shift ini._\n`;
    } else {
      reports.forEach((r, idx) => {
        const title = r.Peralatan || r.Jenis || 'Pekerjaan';
        const loc = r.Lokasi && r.Lokasi !== '-' ? ` [${r.Lokasi}]` : '';
        const time = r.Waktu && r.Waktu !== '-' ? `(${r.Waktu}) ` : '';
        let detail = '';
        if (r.Uraian && r.Uraian !== '-') {
          detail = `\n   Ket: ${r.Uraian}`;
        }
        if (r.TindakLanjut && r.TindakLanjut !== '-' && r.TindakLanjut !== 'Normal Operasi') {
          detail += ` | TL: ${r.TindakLanjut}`;
        }
        summaryText += `${idx + 1}. ${time}${title}${loc} - ${r.Status || 'Normal Operasi'}${detail}\n`;
      });
    }

    summaryText += `\n📄 _File PDF Laporan Resmi terlampir._`;
    return summaryText;
  };

  // Konversi semua gambar di dalam kontainer PDF menjadi Base64 Data URL dengan timeout aman agar bebas tainted canvas
  const prepareImagesForPdf = async (container: HTMLElement) => {
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const resp = await fetch(src, { mode: 'cors', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              img.src = reader.result as string;
            }
            resolve(null);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        // Sembunyikan gambar yang gagal di-fetch agar tidak merusak kanvas PDF
        img.style.display = 'none';
      }
    }));
  };

  // 1. Cetak Langsung (Dialog Print Browser - 100% Reliabel & Bersih)
  const handleDirectPrint = () => {
    window.print();
  };

  // 2. Bagikan pesan ringkasan shift & lampirkan berkas PDF ke WhatsApp
  const handleShareWa = async () => {
    setSharingWa(true);
    setStatusMsg({ text: "Membuat dokumen PDF Laporan Shift...", type: 'info' });

    try {
      let pdfFile: File | null = null;

      if (pdfRef.current) {
        const element = pdfRef.current;
        await prepareImagesForPdf(element);

        const filename = `SSES_T2_Laporan_Shift_${shift}_${date}.pdf`;
        const opt = {
          margin: [5, 5, 5, 5],
          filename: filename,
          image: { type: 'jpeg' as const, quality: 0.95 },
          html2canvas: { scale: 1.5, useCORS: true, logging: false, scrollY: 0, scrollX: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const pdfBlob = await generatePdfBlob(element, opt);
        pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
      }

      const waMessage = generateShiftWaSummary();
      await shareToWhatsApp(waMessage, pdfFile, () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      });

      setStatusMsg({ text: "Dokumen PDF & ringkasan shift berhasil dibagikan ke WhatsApp!", type: 'success' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      console.error("Gagal membuat PDF / share:", err);
      // Fallback: bagikan teks ringkasan jika PDF bermasalah
      const waMessage = generateShiftWaSummary();
      await shareToWhatsApp(waMessage, null, () => {});
      setStatusMsg({ text: "WhatsApp terbuka dengan ringkasan laporan (PDF dilewati).", type: 'info' });
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setSharingWa(false);
    }
  };

  const isCorrective = (r: any) => {
    if (r.kategori_maintenance) return r.kategori_maintenance === 'CORRECTIVE';
    if (r.Uraian?.toLowerCase().includes('permasalahan') || r.TindakLanjut?.toLowerCase().includes('perbaikan')) return true;
    if (r.Peralatan?.toLowerCase().includes('kegiatan') || r.Uraian?.toLowerCase().includes('storing') || r.Uraian?.toLowerCase().includes('running test')) return false;
    return true; 
  };

  const formatUraian = (r: any) => {
    if (isCorrective(r)) {
      return (
        <div className="text-left text-[9px]">
          <span className="font-bold">Permasalahan :</span> {r.Uraian}<br/>
          <span className="font-bold">Tindak lanjut :</span> {r.TindakLanjut}
        </div>
      );
    } else {
      return <div className="text-center font-bold text-[9px]">{r.TindakLanjut || r.Uraian || 'Normal Operasi'}</div>;
    }
  };

  const getTime = (waktuStr: string) => {
    if (!waktuStr) return '-';
    return waktuStr;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 sm:p-6 rounded-2xl">
      
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b border-slate-300 pb-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Laporan Harian Operasional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekapitulasi shift terintegrasi database & Cloudinary.
          </p>
        </div>

      </div>

      {/* FILTER TANGGAL & SHIFT */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" /> Tanggal Laporan
            </label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" /> Shift Dinas
            </label>
            <select 
              value={shift} 
              onChange={(e) => setShift(e.target.value as 'PS' | 'M' | 'ALL')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Shift (PS & Malam) {dailyCounts.total > 0 ? `(${dailyCounts.total})` : ''}</option>
              <option value="M">Shift Malam (M) 20:00 - 08:00 {dailyCounts.m > 0 ? `(${dailyCounts.m})` : ''}</option>
              <option value="PS">Shift Pagi (PS) 08:00 - 20:00 {dailyCounts.ps > 0 ? `(${dailyCounts.ps})` : ''}</option>
            </select>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {shift === 'M' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  <Clock className="w-3 h-3 text-purple-600" /> Batas data: s.d. 08:00 WIB (Pagi)
                </span>
              )}
              {shift === 'PS' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  <Clock className="w-3 h-3 text-blue-600" /> Batas data: s.d. 20:00 WIB
                </span>
              )}
              {shift === 'ALL' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  <Clock className="w-3 h-3 text-slate-500" /> Batas: PS s.d. 20:00 | M s.d. 08:00
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {/* Tombol Cetak Langsung (Dialog Print Browser) */}
            <button 
              onClick={handleDirectPrint}
              type="button"
              title="Cetak langsung ke printer atau Simpan sebagai PDF via dialog cetak browser"
              className="flex-1 min-w-[130px] flex justify-center items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Cetak (Print)</span>
            </button>

            {/* Tombol Kirim ke WhatsApp */}
            <button 
              onClick={handleShareWa} 
              disabled={loading || sharingWa}
              title="Bagikan ringkasan laporan shift ke WhatsApp"
              className="flex-1 min-w-[130px] flex justify-center items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {sharingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              <span>Share WA</span>
            </button>
          </div>
        </div>

        {/* Notifikasi Cerdas jika shift yang dipilih kosong tapi shift lain di tanggal ini ada data */}
        {shift === 'PS' && reports.length === 0 && dailyCounts.m > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Shift Pagi (PS) belum ada data, namun ada <strong>{dailyCounts.m} laporan</strong> pada Shift Malam (M).</span>
            </div>
            <button 
              onClick={() => setShift('M')} 
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs shrink-0"
            >
              Buka Shift Malam
            </button>
          </div>
        )}

        {shift === 'M' && reports.length === 0 && dailyCounts.ps > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Shift Malam (M) belum ada data, namun ada <strong>{dailyCounts.ps} laporan</strong> pada Shift Pagi (PS).</span>
            </div>
            <button 
              onClick={() => setShift('PS')} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs shrink-0"
            >
              Buka Shift Pagi
            </button>
          </div>
        )}

        {statusMsg && (
          <div className={`mt-4 p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold ${
            statusMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : 
             statusMsg.type === 'error' ? <FileText className="w-4 h-4 text-rose-600" /> : 
             <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* REKAP KESIAPAN PERALATAN (DIAGRAM BATANG SERVICEABILITY) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" /> Diagram Serviceability Peralatan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Diagram batang kesiapan operasional per jenis peralatan (Jumlah unit Total dan Off dapat diedit manual)
            </p>
          </div>

          {/* Legend Batang & Kontrol Simpan */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto flex-wrap justify-between sm:justify-end">
            {/* Status Simpan Database */}
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> Menyimpan...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Tersimpan
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                Gagal Simpan
              </span>
            )}

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block shadow-sm"></span>
                <span className="text-slate-700">Peralatan Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block shadow-sm"></span>
                <span className="text-slate-700">Peralatan Off</span>
              </div>
            </div>

            {/* Tombol Simpan Manual */}
            <button
              onClick={handleManualSaveSummary}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Simpan data kesiapan peralatan ke database"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan
            </button>
          </div>
        </div>

        {/* Diagram Batang Container */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[840px] pl-11 pr-4 pt-8">
            {/* Area Grafik dengan Garis Referensi Persentase */}
            <div className="relative h-56 border-b-2 border-slate-300 bg-gradient-to-b from-slate-50/60 to-white rounded-t-xl">
              {/* Garis Grid Horizontal Persentase */}
              {[100, 75, 50, 25, 0].map((pct) => (
                <div
                  key={pct}
                  className={`absolute left-0 right-0 pointer-events-none flex items-center ${
                    pct === 0 ? '' : 'border-b border-dashed border-slate-200'
                  }`}
                  style={{ bottom: `${pct}%` }}
                >
                  <span className="absolute -left-10 text-[10px] text-slate-400 font-semibold w-8 text-right -translate-y-1/2 select-none">
                    {pct}%
                  </span>
                </div>
              ))}

              {/* Kelompok Batang Tiap Jenis Peralatan */}
              <div className="absolute inset-0 grid grid-cols-7 gap-2">
                {checklistSummary.map((item) => {
                  const persenNormal = Math.round(item.persenOperasi * 100);
                  const persenOff = Math.round(item.persenRusak * 100);

                  return (
                    <div key={item.no} className="flex justify-center items-end gap-1.5 sm:gap-2 h-full">
                      {/* Batang Normal (Biru) */}
                      <div className="relative flex flex-col items-center justify-end h-full w-7 sm:w-8">
                        <div 
                          style={{ height: persenNormal > 0 ? `${persenNormal}%` : '2px' }}
                          className={`relative w-full rounded-t-md shadow-sm transition-all duration-300 flex items-center justify-center cursor-pointer ${
                            persenNormal > 0 
                              ? 'bg-gradient-to-t from-blue-600 to-blue-500 hover:brightness-110' 
                              : 'bg-slate-200'
                          }`}
                          title={`${item.nama} Normal: ${item.operasi} Unit (${persenNormal}%)`}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] font-bold text-blue-700 leading-none whitespace-nowrap">
                            {persenNormal}%
                          </span>
                        </div>
                      </div>

                      {/* Batang Off (Merah) */}
                      <div className="relative flex flex-col items-center justify-end h-full w-7 sm:w-8">
                        <div 
                          style={{ height: persenOff > 0 ? `${persenOff}%` : '2px' }}
                          className={`relative w-full rounded-t-md shadow-sm transition-all duration-300 flex items-center justify-center cursor-pointer ${
                            persenOff > 0 
                              ? 'bg-gradient-to-t from-rose-600 to-red-500 hover:brightness-110' 
                              : 'bg-slate-200'
                          }`}
                          title={`${item.nama} Off: ${item.rusak} Unit (${persenOff}%)`}
                        >
                          <span className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] font-bold leading-none whitespace-nowrap ${persenOff > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400'}`}>
                            {persenOff}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Label Peralatan & Form Edit Manual Nilai Unit (Total & Off) */}
            <div className="grid grid-cols-7 gap-2 pt-3.5">
              {checklistSummary.map((item) => (
                <div 
                  key={item.no} 
                  className="flex flex-col justify-between bg-slate-50/90 hover:bg-slate-100/90 transition-all p-2 rounded-xl border border-slate-200 shadow-2xs text-center"
                >
                  {/* Nama Peralatan & Status Normal */}
                  <div className="mb-2">
                    <span 
                      className="text-[11px] font-bold text-slate-800 uppercase tracking-tight block truncate" 
                      title={item.nama}
                    >
                      {item.nama}
                    </span>
                    <span className="inline-flex items-center justify-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/70 mt-1 w-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                      Normal: <strong className="font-bold">{item.operasi}</strong>
                    </span>
                  </div>

                  {/* Input Manual Total & Off */}
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-200/80">
                    {/* Input Total */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-600 select-none">
                        Total:
                      </span>
                      <input 
                        type="number"
                        min="0"
                        value={item.total}
                        onChange={(e) => handleChecklistSummaryChange(item.no, 'total', parseInt(e.target.value, 10))}
                        className="w-11 px-1 py-0.5 text-center text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-2xs"
                        title="Edit jumlah unit Total"
                      />
                    </div>

                    {/* Input Off */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                        Off:
                      </span>
                      <input 
                        type="number"
                        min="0"
                        max={item.total}
                        value={item.rusak}
                        onChange={(e) => handleChecklistSummaryChange(item.no, 'rusak', parseInt(e.target.value, 10))}
                        className={`w-11 px-1 py-0.5 text-center text-xs font-bold rounded border focus:ring-1 outline-none transition-all shadow-2xs ${
                          item.rusak > 0 
                            ? 'text-rose-700 border-rose-300 bg-rose-50/60 focus:border-rose-500 focus:ring-rose-500' 
                            : 'text-slate-700 border-slate-300 bg-white focus:border-slate-500 focus:ring-slate-500'
                        }`}
                        title="Edit jumlah unit Off"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DAFTAR LOG KEGIATAN & PERBAIKAN SHIFT AKTIF (TABEL 1) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Rekap Pekerjaan & Kegiatan Shift ({reports.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddModal}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Manual
            </button>
            <button 
              onClick={() => loadShiftReports(date, shift)}
              disabled={fetchingLive}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 p-1.5 bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {fetchingLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />} Segarkan
            </button>
          </div>
        </div>

        {fetchingLive ? (
          <div className="p-8 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> Memuat data kegiatan dari database...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Belum ada kegiatan (Perbaikan, Storing, Kegiatan, atau Kalibrasi) yang tercatat pada shift ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((item, idx) => (
              <div key={idx} className="relative flex gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all shadow-sm group pr-16">
                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                  <button
                    onClick={() => openEditModal(item)}
                    title="Edit Laporan"
                    className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 rounded-lg border border-slate-200 shadow-sm cursor-pointer transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.rowIndex, item.Peralatan || 'item')}
                    disabled={deletingRowIndex === item.rowIndex}
                    title="Hapus Laporan"
                    className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {deletingRowIndex === item.rowIndex ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="shrink-0 flex flex-col items-center">
                  {item.imageUrl ? (
                    <div 
                      onClick={() => setSelectedPhoto({ url: item.imageUrl, title: `${item.Peralatan || item.Jenis} - ${item.Lokasi}` })}
                      className="relative cursor-pointer group/img"
                      title="Klik untuk melihat foto lebih besar"
                    >
                      <img 
                        src={item.imageUrl} 
                        alt="Dokumentasi" 
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-lg object-cover bg-slate-200 border border-slate-300 transition-transform group-hover/img:scale-105"
                        onError={(e) => { 
                          const target = e.target as HTMLImageElement;
                          const match = item.imageUrl?.match(/\/d\/([a-zA-Z0-9_-]+)/);
                          if (match && !target.dataset.tried) {
                            target.dataset.tried = 'true';
                            target.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
                          } else {
                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23cbd5e1"/><text x="50%" y="50%" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="%2364748b">No Foto</text></svg>';
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 rounded-lg transition-opacity flex items-center justify-center text-white">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      {item.fotoUrls && item.fotoUrls.length > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          +{item.fotoUrls.length}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      No Foto
                    </div>
                  )}
                  {item.imageUrl && (
                    <button
                      onClick={() => setSelectedPhoto({ url: item.imageUrl, title: `${item.Peralatan || item.Jenis} - ${item.Lokasi}` })}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 mt-1 cursor-pointer flex items-center gap-0.5"
                    >
                      <span>Lihat Foto</span>
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      item.Jenis === 'Perbaikan' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      item.Jenis === 'Storing' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      item.Jenis === 'Kalibrasi' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                      'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {item.Jenis || 'Kegiatan'}
                    </span>
                    {shift === 'ALL' && item.shift && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        Shift {item.shift}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.Waktu || '-'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 truncate">{item.Peralatan || 'Peralatan'}</h4>
                  <p className="text-xs font-semibold text-slate-600 mb-0.5 truncate">📍 {item.Lokasi || '-'}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.Uraian || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS KHUSUS UNTUK PRINT NATIVE BROWSER (WINDOW.PRINT) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-shift-report, #printable-shift-report * {
            visibility: visible !important;
          }
          #printable-shift-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            opacity: 1 !important;
            z-index: 99999 !important;
            display: block !important;
          }
          @page {
            size: landscape A4;
            margin: 5mm;
          }
          .html2pdf__page-break {
            page-break-before: always !important;
            break-before: page !important;
            display: block !important;
          }
        }
      `}</style>

      {/* PDF CONTENT CONTAINER (LAYOUT LANDSCAPE A4 IDENTIK DENGAN EXCEL SSES T2) */}
      <div 
        id="printable-shift-report"
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: 0, 
          width: '1100px', 
          pointerEvents: 'none', 
          zIndex: -1000 
        }}
      >
        <div ref={pdfRef} className="w-[1100px] p-6 bg-white text-black font-sans">
          
          {/* Header Kop Surat */}
          <div className="border-[3px] border-black flex items-stretch">
            <div className="w-[15%] border-r-[3px] border-black flex items-center justify-center p-2">
              <div className="text-[12px] font-bold text-blue-800 text-center leading-tight">
                INJOURNEY<br/>AIRPORTS
              </div>
            </div>
            <div className="w-[50%] border-r-[3px] border-black p-2 flex flex-col items-center justify-center text-center">
              <h1 className="font-extrabold text-[13px]">PT ANGKASA PURA INDONESIA</h1>
              <h2 className="font-bold text-[11px]">CABANG UTAMA BANDARA SOEKARNO-HATTA</h2>
              <h2 className="font-bold text-[11px]">UNIT SAFETY & SECURITY ELECTRONIC SERVICES – T2</h2>
            </div>
            <div className="w-[35%] p-2 flex flex-col items-center justify-center text-center bg-gray-100">
              <h1 className="font-extrabold text-[11px]">LAPORAN PERBAIKAN SAFETY & SECURITY ELECTRONIC SERVICES</h1>
              <h2 className="font-bold text-[10px]">TERMINAL 2 BANDARA SOEKARNO-HATTA</h2>
              <h2 className="font-bold text-[10px]">PERIODE : {MONTHS[new Date(date).getMonth()].toUpperCase()}</h2>
            </div>
          </div>
          
          {/* Shift & Personil On Duty */}
          <div className="border-l-[3px] border-r-[3px] border-b-[3px] border-black flex items-stretch bg-white">
            <div className="w-[15%] border-r-[3px] border-black p-2 flex flex-col items-center justify-center text-center text-[10px] font-bold">
              SHIFT {shift === 'M' ? 'MALAM (M)' : 'PAGI (PS)'} {getDayName(date)}, {formatDateIndo(date)}<br/>
              (D,E,F,UMROH)<br/>
              TERMINAL 2
            </div>
            <div className="w-[85%] flex flex-col">
              <div className="bg-black text-white text-center font-bold text-[11px] py-1 border-b-[3px] border-black uppercase">
                PERSONIL ON DUTY {shift === 'M' ? 'MALAM' : 'PAGI'}
              </div>
              <div className="flex flex-1">
                <div className="w-1/2 border-r-[3px] border-black flex flex-col">
                  <div className="bg-gray-200 text-center font-bold text-[10px] py-1 border-b-[3px] border-black">API</div>
                  <div className="p-1 flex-1 flex flex-col justify-around">
                    {apiPersonil.map((p, i) => (
                      <div key={i} className="flex justify-between text-[10px] font-semibold px-4">
                        <span>{p.personel?.nama}</span>
                        <span>{p.personel?.no_hp || '-'}</span>
                      </div>
                    ))}
                    {apiPersonil.length === 0 && <div className="text-center text-[10px] text-gray-500 py-1">-</div>}
                  </div>
                </div>
                <div className="w-1/2 flex flex-col">
                  <div className="bg-gray-200 text-center font-bold text-[10px] py-1 border-b-[3px] border-black">IAS</div>
                  <div className="p-1 flex-1 flex flex-col justify-around">
                    {iasPersonil.map((p, i) => (
                      <div key={i} className="flex justify-between text-[10px] font-semibold px-4">
                        <span>{p.personel?.nama}</span>
                        <span>{p.personel?.no_hp || '-'}</span>
                      </div>
                    ))}
                    {iasPersonil.length === 0 && <div className="text-center text-[10px] text-gray-500 py-1">-</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-3"></div>

          {/* TABEL 1: TINDAK LANJUT & KEGIATAN */}
          <table className="w-full border-collapse border-[2px] border-black text-[9px]">
            <thead>
              <tr className="bg-gray-200 font-bold text-center">
                <th className="border-[2px] border-black p-1 w-[3%]">No</th>
                <th className="border-[2px] border-black p-1 w-[13%]">LOKASI</th>
                <th className="border-[2px] border-black p-1 w-[15%]">PERALATAN</th>
                <th className="border-[2px] border-black p-1 w-[10%]">CORRECTIVE<br/>MAINTENANCE</th>
                <th className="border-[2px] border-black p-1 w-[10%]">PREVENTIVE<br/>MAINTENANCE</th>
                <th className="border-[2px] border-black p-1 w-[8%]">LAIN - LAIN</th>
                <th className="border-[2px] border-black p-1 w-[25%]">URAIAN KEGIATAN</th>
                <th className="border-[2px] border-black p-1 w-[8%]">WAKTU<br/>TINDAK LANJUT</th>
                <th className="border-[2px] border-black p-1 w-[4%]">HASIL</th>
                <th className="border-[2px] border-black p-1 w-[8%]">DOKUMENTASI</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, idx) => (
                <tr key={idx} className="text-center bg-white">
                  <td className="border-[2px] border-black p-1 font-bold">{idx + 1}</td>
                  <td className="border-[2px] border-black p-1 font-semibold text-left px-1.5">{report.Lokasi || '-'}</td>
                  <td className="border-[2px] border-black p-1 font-semibold text-left px-1.5">{report.Peralatan}</td>
                  <td className="border-[2px] border-black p-1 font-bold">{isCorrective(report) ? 'CORRECTIVE MAINTENANCE' : '-'}</td>
                  <td className="border-[2px] border-black p-1 font-bold">{report.Jenis === 'Kalibrasi' ? 'PREVENTIVE MAINTENANCE' : '-'}</td>
                  <td className="border-[2px] border-black p-1 font-bold">{isCorrective(report) ? '-' : (report.Jenis === 'Storing' ? 'STORING' : 'KEGIATAN')}</td>
                  <td className="border-[2px] border-black p-1 text-left align-top">{formatUraian(report)}</td>
                  <td className="border-[2px] border-black p-1 font-bold">{getTime(report.Waktu)}</td>
                  <td className="border-[2px] border-black p-1 font-bold">{report.Status === 'Normal' ? 'Normal' : report.Status}</td>
                  <td className="border-[2px] border-black p-1">
                    {report.imageUrl ? (
                      <img 
                        src={report.imageUrl} 
                        alt="Dok" 
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous" 
                        className="w-full h-12 object-cover rounded border border-gray-300"
                        onError={(e) => { 
                          const target = e.target as HTMLImageElement;
                          const match = report.imageUrl?.match(/\/d\/([a-zA-Z0-9_-]+)/);
                          if (match && !target.dataset.tried) {
                            target.dataset.tried = 'true';
                            target.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={10} className="border-[2px] border-black p-4 text-center font-bold italic text-gray-500">
                    Tidak ada laporan perbaikan/kegiatan pada shift ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ========================================================================= */}
          {/* LEMBAR TERAKHIR TERSENDIRI: TABEL & DIAGRAM SERVICEABILITY PERALATAN      */}
          {/* ========================================================================= */}
          <div 
            className="html2pdf__page-break" 
            style={{ 
              pageBreakBefore: 'always', 
              breakBefore: 'page',
              height: 0,
              margin: 0,
              padding: 0
            }} 
          />

          <div className="pt-2">
            {/* Header Kop Surat Lembar Serviceability */}
            <div className="border-[3px] border-black flex items-stretch mb-3">
              <div className="w-[15%] border-r-[3px] border-black flex items-center justify-center p-2">
                <div className="text-[12px] font-bold text-blue-800 text-center leading-tight">
                  INJOURNEY<br/>AIRPORTS
                </div>
              </div>
              <div className="w-[50%] border-r-[3px] border-black p-2 flex flex-col items-center justify-center text-center">
                <h1 className="font-extrabold text-[12px]">PT ANGKASA PURA INDONESIA</h1>
                <h2 className="font-bold text-[10px]">CABANG UTAMA BANDARA SOEKARNO-HATTA</h2>
                <h2 className="font-bold text-[10px]">UNIT SAFETY & SECURITY ELECTRONIC SERVICES – T2</h2>
              </div>
              <div className="w-[35%] p-2 flex flex-col items-center justify-center text-center bg-gray-100">
                <h1 className="font-extrabold text-[11px]">KESIAPAN FASILITAS & SERVICEABILITY PERALATAN</h1>
                <h2 className="font-bold text-[10px]">TERMINAL 2 BANDARA SOEKARNO-HATTA</h2>
                <h2 className="font-bold text-[10px]">SHIFT {shift === 'M' ? 'MALAM (M)' : 'PAGI (PS)'} - {formatDateIndo(date).toUpperCase()}</h2>
              </div>
            </div>

            {/* TABEL 2: KESIAPAN FASILITAS (SERVICEABILITY CHECKLIST) */}
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="w-[64%]">
                <table className="w-full border-collapse border-[2px] border-black text-[9px]">
                  <thead>
                    <tr className="bg-gray-200 font-bold text-center">
                      <th className="border-[2px] border-black p-1 w-[6%]">No</th>
                      <th className="border-[2px] border-black p-1 w-[32%]">Peralatan</th>
                      <th className="border-[2px] border-black p-1 w-[12%]">%</th>
                      <th className="border-[2px] border-black p-1 w-[12%]">Jumlah</th>
                      <th className="border-[2px] border-black p-1 w-[12%]">Rusak</th>
                      <th className="border-[2px] border-black p-1 w-[13%]">Rusak %</th>
                      <th className="border-[2px] border-black p-1 w-[13%]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklistSummary.map((item) => (
                      <tr key={item.no} className="text-center font-medium">
                        <td className="border-[2px] border-black p-1 font-bold">{item.no}</td>
                        <td className="border-[2px] border-black p-1 text-left font-bold px-2">{item.nama}</td>
                        <td className="border-[2px] border-black p-1 font-bold">{Math.round(item.persenOperasi * 100)}%</td>
                        <td className="border-[2px] border-black p-1">{item.operasi}</td>
                        <td className="border-[2px] border-black p-1">{item.rusak}</td>
                        <td className="border-[2px] border-black p-1">{Math.round(item.persenRusak * 100)}%</td>
                        <td className="border-[2px] border-black p-1 font-bold">{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="w-[36%] pl-4 flex flex-col justify-between text-[9px] text-gray-700 italic border-l border-gray-300">
                <div>
                  <p className="font-bold not-italic text-black mb-1">Catatan Laporan:</p>
                  <p>• Kepada yang bertugas menulis laporan, mohon dicek kembali data, tanggal, dan tabel pada laporan.</p>
                  <p className="mt-1">• Terimakasih atas kerjasamanya.</p>
                </div>

                <div className="mt-5 pt-3 border-t border-black text-center not-italic font-bold text-black">
                  <p>Safety & Security Electronic Services (SSES)</p>
                  <p className="text-[8px] font-normal">Bandara Internasional Soekarno-Hatta Terminal 2</p>
                </div>
              </div>
            </div>

            {/* DIAGRAM BATANG SERVICEABILITY PADA LAPORAN PDF */}
            <div className="border-[2px] border-black p-3 bg-white">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-300">
                <span className="font-bold text-[11px] text-black uppercase tracking-wide">
                  Diagram Serviceability Peralatan
                </span>
                <div className="flex items-center gap-4 text-[9px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 bg-blue-600 inline-block border border-black"></span>
                    <span>Peralatan Normal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 bg-red-600 inline-block border border-black"></span>
                    <span>Peralatan Off</span>
                  </div>
                </div>
              </div>

              {/* Area Grafik Batang */}
              <div className="pl-9 pr-3 pt-6">
                <div className="relative h-44 border-b-2 border-black bg-gray-50/40">
                  {/* Garis Grid Persentase */}
                  {[100, 75, 50, 25, 0].map((pct) => (
                    <div
                      key={pct}
                      className={`absolute left-0 right-0 pointer-events-none flex items-center ${
                        pct === 0 ? '' : 'border-b border-dashed border-gray-300'
                      }`}
                      style={{ bottom: `${pct}%` }}
                    >
                      <span className="absolute -left-8 text-[8px] text-gray-500 font-semibold w-7 text-right -translate-y-1/2 select-none">
                        {pct}%
                      </span>
                    </div>
                  ))}

                  {/* Batang per Peralatan */}
                  <div className="absolute inset-0 grid grid-cols-7 gap-2">
                    {checklistSummary.map((item) => {
                      const persenNormal = Math.round(item.persenOperasi * 100);
                      const persenOff = Math.round(item.persenRusak * 100);

                      return (
                        <div key={item.no} className="flex justify-center items-end gap-1.5 h-full">
                          {/* Batang Normal (Biru) */}
                          <div className="relative flex flex-col items-center justify-end h-full w-6 sm:w-7">
                            <div 
                              style={{ height: persenNormal > 0 ? `${persenNormal}%` : '2px' }}
                              className={`relative w-full rounded-t-xs flex items-center justify-center ${
                                persenNormal > 0 
                                  ? 'bg-blue-600 border border-blue-900' 
                                  : 'bg-gray-200 border border-gray-300'
                              }`}
                            >
                              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-blue-800 leading-none whitespace-nowrap">
                                {persenNormal}%
                              </span>
                            </div>
                          </div>

                          {/* Batang Off (Merah) */}
                          <div className="relative flex flex-col items-center justify-end h-full w-6 sm:w-7">
                            <div 
                              style={{ height: persenOff > 0 ? `${persenOff}%` : '2px' }}
                              className={`relative w-full rounded-t-xs flex items-center justify-center ${
                                persenOff > 0 
                                  ? 'bg-red-600 border border-red-900' 
                                  : 'bg-gray-200 border border-gray-300'
                              }`}
                            >
                              <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-bold leading-none whitespace-nowrap ${
                                persenOff > 0 ? 'text-red-700 font-black' : 'text-gray-400'
                              }`}>
                                {persenOff}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Label Bawah Batang */}
                <div className="grid grid-cols-7 gap-2 pt-2 text-center">
                  {checklistSummary.map((item) => (
                    <div key={item.no} className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-black uppercase leading-tight truncate w-full">
                        {item.nama}
                      </span>
                      <span className="text-[8px] text-gray-600 font-semibold mt-0.5">
                        {item.operasi}/{item.total} Unit
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CRUD MODAL FORM */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {modalMode === 'add' ? <Plus className="w-5 h-5 text-blue-600" /> : <Edit className="w-5 h-5 text-blue-600" />}
                {modalMode === 'add' ? 'Tambah Pekerjaan Manual' : 'Edit Pekerjaan Shift'}
              </h3>
              <button onClick={() => setIsCrudModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrudSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pekerjaan</label>
                  <select
                    value={crudForm.jenis}
                    onChange={(e) => setCrudForm({ ...crudForm, jenis: e.target.value as any })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Perbaikan">Perbaikan (Corrective)</option>
                    <option value="Storing">Storing</option>
                    <option value="Kalibrasi">Kalibrasi (Preventive)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam / Waktu</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 08:25 - 08:35"
                    value={crudForm.waktu}
                    onChange={(e) => setCrudForm({ ...crudForm, waktu: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {!isTimeWithinShiftBoundary(crudForm.waktu, shift) && (
                    <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                      ⚠️ Di luar batas shift {shift === 'PS' ? 'PS (s.d. 20:00)' : 'M (s.d. 08:00 pagi)'}.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Peralatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Access Control / ETD Leidos"
                  value={crudForm.peralatan}
                  onChange={(e) => setCrudForm({ ...crudForm, peralatan: e.target.value })}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ruang Monitoring E1 / PSCP E No.2"
                  value={crudForm.lokasi}
                  onChange={(e) => setCrudForm({ ...crudForm, lokasi: e.target.value })}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Uraian / Permasalahan</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan detail permasalahan / kegiatan..."
                  value={crudForm.uraian}
                  onChange={(e) => setCrudForm({ ...crudForm, uraian: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tindak Lanjut</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembersihan sensor & normal"
                    value={crudForm.tindakLanjut}
                    onChange={(e) => setCrudForm({ ...crudForm, tindakLanjut: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <input
                    type="text"
                    placeholder="Contoh: Normal / Normal Operasi"
                    value={crudForm.status}
                    onChange={(e) => setCrudForm({ ...crudForm, status: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto Dokumentasi</label>
                <div className="flex items-center gap-3">
                  {crudPhotoPreview && (
                    <img src={crudPhotoPreview} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCrudPhotoFile(file);
                        setCrudPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={crudSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {crudSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{crudSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW FOTO */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 truncate pr-2">
                📸 {selectedPhoto.title}
              </h3>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center max-h-[70vh]">
              <img 
                src={selectedPhoto.url} 
                alt="Preview Dokumentasi" 
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const match = selectedPhoto.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                  if (match && !target.dataset.tried) {
                    target.dataset.tried = 'true';
                    target.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Tersimpan di Cloudinary
              </span>
              <a 
                href={(() => {
                  const match = selectedPhoto.url.match(/\/d\/([a-zA-Z0-9_-]+)/) || selectedPhoto.url.match(/id=([a-zA-Z0-9_-]+)/);
                  if (match && match[1]) {
                    return `https://drive.google.com/file/d/${match[1]}/view`;
                  }
                  return selectedPhoto.url;
                })()} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Cloudinary</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
