// src/components/features/TabShiftReport.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, FileText, Loader2, CheckCircle, Clock, Plus, 
  Edit, Trash2, X, Share2, ExternalLink, Printer
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
import { getDefaultKalibrasiUraian, generateWA_ShiftReport } from '../../lib/utils/waGenerator';
import {
  isPreventiveReport as isPreventive,
  isStoringReport as isStoring,
  isCorrectiveReport as isCorrective,
  sortPersonelRows
} from '../../lib/utils/shiftReportMessage';
import { formatPreventivePeralatan } from '../../lib/utils/locationRules';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { useAppStore } from '../../store/useAppStore';
import { ShiftReportPrintDocument } from './shift-report/ShiftReportPrintDocument';
import { ShiftReportCrudModal } from './shift-report/ShiftReportCrudModal';
import { ServiceabilityDiagram } from './shift-report/ServiceabilityDiagram';


const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const TabShiftReport: React.FC = () => {
  const penempatanData = useMasterDataStore(state => state.penempatanData);
  const setIsCopied = useAppStore(state => state.setIsCopied);
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
        // Jabatan dan urutan dipakai untuk mengurutkan personel seperti di tab Kehadiran;
        // bila kolomnya belum ada di database, pakai pilihan kolom yang lebih sedikit.
        const personelColumns = [
          'id, nama, no_hp, jabatan, urutan, unit_kerja(nama)',
          'id, nama, no_hp, jabatan, unit_kerja(nama)',
          'id, nama, no_hp, unit_kerja(nama)',
        ];
        let data: any[] | null = null;
        let error: unknown = null;
        for (const columns of personelColumns) {
          let query = supabase
            .from('jadwal_shift')
            .select(`id, shift, status_kehadiran, personel:personel_id (${columns})`)
            .eq('tanggal', date);
          if (shift !== 'ALL') {
            query = query.eq('shift', shift);
          }
          const res = await query;
          data = res.data as any[] | null;
          error = res.error;
          if (!error && data) break;
        }

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

          setApiPersonil(sortPersonelRows(apiList));
          setIasPersonil(sortPersonelRows(iasList));
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
        const newKategori = crudForm.jenis === 'Perbaikan' ? 'CORRECTIVE' : (crudForm.jenis === 'Storing' ? 'STORING' : (crudForm.jenis === 'Kalibrasi' ? 'PREVENTIVE' : 'KEGIATAN'));
        // Simpan ke Supabase
        const dbRes = await saveOperationalLog({
          tanggal: date,
          shift: shift,
          jenis: crudForm.jenis,
          waktu: crudForm.waktu,
          lokasi: crudForm.lokasi || '-',
          peralatan: crudForm.peralatan || '-',
          kategori_maintenance: newKategori,
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
          kategori_maintenance: newKategori,
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
        const newKategori = crudForm.jenis === 'Perbaikan' ? 'CORRECTIVE' : (crudForm.jenis === 'Storing' ? 'STORING' : (crudForm.jenis === 'Kalibrasi' ? 'PREVENTIVE' : 'KEGIATAN'));

        if (targetItem?.id) {
          await supabase.from('laporan_operasional').update({
            jenis: crudForm.jenis,
            waktu: crudForm.waktu,
            peralatan: crudForm.peralatan,
            lokasi: crudForm.lokasi,
            kategori_maintenance: newKategori,
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
          kategori_maintenance: newKategori,
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
  const waMessagePreview = React.useMemo(
    () => generateWA_ShiftReport(date, shift, apiPersonil, iasPersonil, reports),
    [date, shift, apiPersonil, iasPersonil, reports]
  );
  const generateShiftWaSummary = () => waMessagePreview;

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
          pagebreak: { 
            mode: ['css'],
            before: '.serviceability-page-sheet'
          }
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

  const renderTindakLanjutBullets = (text: string) => {
    if (!text || text === '-') return <span className="ml-1">-</span>;
    if (text.includes('•')) {
      const items = text.split('•').map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        return (
          <div className="space-y-0.5 mt-0.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-1">
                <span className="shrink-0 select-none">•</span>
                <span className="whitespace-pre-line leading-tight">{item}</span>
              </div>
            ))}
          </div>
        );
      }
    }
    return <span className="ml-1 whitespace-pre-line">{text}</span>;
  };

  const formatUraian = (r: any) => {
    if (isCorrective(r)) {
      return (
        <div className="text-left text-[9px] leading-tight">
          <div>
            <span className="font-bold">Permasalahan :</span>{' '}
            <span className="whitespace-pre-line">{r.Uraian}</span>
          </div>
          <div className="mt-1">
            <span className="font-bold">Tindak lanjut :</span>
            {renderTindakLanjutBullets(r.TindakLanjut)}
          </div>
        </div>
      );
    }

    if (isStoring(r)) {
      return (
        <div className="text-center font-bold text-[9px] w-full">
          Storing Peralatan
        </div>
      );
    }

    if (isPreventive(r)) {
      let rawText = (r.Uraian && r.Uraian.includes('Kegiatan :')) 
        ? r.Uraian 
        : getDefaultKalibrasiUraian(r.Peralatan, r.Lokasi);

      if (!rawText.includes('Catatan :')) {
        const defaultUraian = getDefaultKalibrasiUraian(r.Peralatan, r.Lokasi);
        const catatanIndex = defaultUraian.indexOf('Catatan :');
        if (catatanIndex !== -1) {
          rawText = `${rawText.trim()}\n   \n${defaultUraian.slice(catatanIndex)}`;
        }
      }

      const kegiatanIdx = rawText.indexOf('Kegiatan :');
      const cleanText = kegiatanIdx !== -1 ? rawText.slice(kegiatanIdx) : rawText;

      const parts = cleanText.split(/(Kegiatan\s*:|Catatan\s*:)/g).filter(Boolean);
      return (
        <div className="text-left text-[9px] leading-tight">
          {parts.map((part: string, i: number) => {
            const trimmed = part.trim();
            if (/^Kegiatan\s*:/i.test(trimmed)) {
              return <div key={i} className="font-bold text-black mt-0.5">Kegiatan :</div>;
            }
            if (/^Catatan\s*:/i.test(trimmed)) {
              return <div key={i} className="font-bold text-black mt-1">Catatan :</div>;
            }
            return <div key={i} className="whitespace-pre-line text-slate-800">{trimmed}</div>;
          })}
        </div>
      );
    }

    return <div className="text-center font-bold text-[9px]">{r.TindakLanjut || r.Uraian || 'Normal Operasi'}</div>;
  };

  const getTime = (waktuStr: string) => {
    if (!waktuStr) return '-';
    return waktuStr;
  };

  const formatHasil = (r: any) => {
    const s = (r.Status || '').toLowerCase();
    if (isCorrective(r)) {
      return (s.includes('selesai') || s.includes('normal')) ? 'Normal' : 'On Progress';
    }
    return (!s || s.includes('normal')) ? 'Normal' : r.Status;
  };

  const formatLokasiPrint = (lokasi?: string) => {
    if (!lokasi || lokasi === '-') return '-';
    return lokasi.split(',').map(seg => {
      const trimmed = seg.trim();
      // Untuk lokasi yang mengandung kata "PSCP" (dan bukan HBSCP), pertahankan kata "No."
      if (/\bPSCP\b/i.test(trimmed)) {
        if (!/\bNo\.?\b/i.test(trimmed)) {
          return trimmed.replace(/(PSCP\s+[A-Za-z0-9_-]+)\s+(\d+(?:\.\d+)?)/i, '$1 No.$2');
        }
        return trimmed;
      }
      // Untuk lokasi selain PSCP (misal HBSCP, Rampout, Aviobridge), hilangkan kata "No." tapi tetap sertakan angkanya
      return trimmed.replace(/\s*\bNo\.?\s*(?=\d)/gi, ' ').trim();
    }).join(', ');
  };

  // Menghitung range waktu kegiatan storing (dari waktu paling awal s.d. waktu paling akhir)
  const getCombinedTimeRange = (items: any[], currentShift?: string) => {
    const times: { raw: string; minutes: number }[] = [];
    
    items.forEach(item => {
      if (!item.Waktu || item.Waktu === '-') return;
      const matches = item.Waktu.match(/\b\d{1,2}[:.]\d{2}\b/g);
      if (matches) {
        matches.forEach((t: string) => {
          const cleanTime = t.replace('.', ':');
          const [hStr, mStr] = cleanTime.split(':');
          const h = parseInt(hStr, 10);
          const m = parseInt(mStr, 10);
          let adjustedH = h;
          if (currentShift === 'M' && h < 12) {
            adjustedH += 24;
          }
          times.push({
            raw: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            minutes: adjustedH * 60 + m
          });
        });
      }
    });

    if (times.length === 0) return '-';
    times.sort((a, b) => a.minutes - b.minutes);
    const earliest = times[0].raw;
    const latest = times[times.length - 1].raw;
    return earliest === latest ? earliest : `${earliest} - ${latest}`;
  };

  // Helper memecah lokasi kalibrasi yang jamak (jika lebih dari satu lokasi dibikin baris baru)
  const splitKalibrasiLocations = (lokasiStr: string): string[] => {
    if (!lokasiStr || lokasiStr === '-') return ['-'];
    if (lokasiStr.includes(',')) {
      return lokasiStr.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (lokasiStr.includes(' & ') && !lokasiStr.toUpperCase().includes('AVIO & BL')) {
      const parts = lokasiStr.split(' & ').map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        const matchPrefix = parts[0].match(/^(.*?)(\s+\bNo\.?\s*\d+|\s+\d+)/i);
        const prefix = matchPrefix ? matchPrefix[1].trim() : '';
        return parts.map((p, idx) => {
          if (idx > 0 && prefix && !p.toLowerCase().includes(prefix.toLowerCase())) {
            return `${prefix} ${p}`.trim();
          }
          return p;
        });
      }
    }
    return [lokasiStr.trim()];
  };

  // Menggabungkan seluruh kegiatan storing menjadi 1 baris untuk tabel cetak / PDF
  // dan memecah preventive maintenance yang memiliki multi-lokasi menjadi baris baru
  const printReports = React.useMemo(() => {
    const storingItems = reports.filter(isStoring);
    const firstStoringIndex = reports.findIndex(isStoring);
    const timeRange = storingItems.length > 0 ? getCombinedTimeRange(storingItems, shift) : '-';

    // Kumpulkan seluruh foto unik dari semua baris storing
    const allPhotos: string[] = [];
    storingItems.forEach(item => {
      if (Array.isArray(item.fotoUrls) && item.fotoUrls.length > 0) {
        item.fotoUrls.forEach((url: string) => {
          if (url && !allPhotos.includes(url)) allPhotos.push(url);
        });
      } else if (item.imageUrl && !allPhotos.includes(item.imageUrl)) {
        allPhotos.push(item.imageUrl);
      }
    });

    const mergedStoringReport = storingItems.length > 0 ? {
      rowIndex: 'merged-storing',
      id: 'merged-storing',
      shift: shift,
      Jenis: 'Storing',
      Waktu: timeRange,
      Lokasi: 'Terminal 2 D,E,F & Umroh',
      Peralatan: 'All Faskampen',
      kategori_maintenance: 'STORING',
      Uraian: 'Storing Peralatan',
      TindakLanjut: 'Storing Peralatan',
      Status: 'Normal Operasi',
      imageUrl: allPhotos[0] || null,
      fotoUrls: allPhotos
    } : null;

    const result: any[] = [];
    reports.forEach((item, idx) => {
      if (isStoring(item)) {
        if (idx === firstStoringIndex && mergedStoringReport) {
          result.push(mergedStoringReport);
        }
      } else if (isPreventive(item)) {
        const subLocs = splitKalibrasiLocations(item.Lokasi);
        if (subLocs.length > 1) {
          subLocs.forEach((loc, sIdx) => {
            const formattedEquip = formatPreventivePeralatan(item.Peralatan, loc);
            result.push({
              ...item,
              rowIndex: `${item.rowIndex || idx}-loc-${sIdx}`,
              Lokasi: loc,
              Peralatan: formattedEquip
            });
          });
        } else {
          const loc = subLocs[0] || item.Lokasi;
          const formattedEquip = formatPreventivePeralatan(item.Peralatan, loc);
          result.push({
            ...item,
            Lokasi: loc,
            Peralatan: formattedEquip
          });
        }
      } else {
        result.push(item);
      }
    });

    return result;
  }, [reports, shift, penempatanData]);

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

      <ServiceabilityDiagram
        checklistSummary={checklistSummary}
        handleChecklistSummaryChange={handleChecklistSummaryChange}
        handleManualSaveSummary={handleManualSaveSummary}
        saveStatus={saveStatus}
      />

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

      {/* PREVIEW PESAN WHATSAPP (REAL-TIME) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 print:hidden">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> Preview Laporan WhatsApp (Real-time)
        </h3>
        <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
          <div
            data-testid="wa-preview"
            className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%]"
          >
            {waMessagePreview}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Pesan ini yang dikirim lewat tombol Share WA, bersama berkas PDF laporan.</p>
      </div>

      {/* CSS KHUSUS UNTUK PRINT NATIVE BROWSER (WINDOW.PRINT) */}
      <style>{`
        @page {
          size: landscape;
          size: A4 landscape;
          margin: 5mm;
        }
        @media print {
          @page {
            size: landscape;
            size: A4 landscape;
            margin: 5mm;
          }
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
          #printable-shift-report > div {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .serviceability-page-sheet {
            page-break-before: always !important;
            break-before: page !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: block !important;
            clear: both !important;
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
        <ShiftReportPrintDocument
          ref={pdfRef}
          date={date}
          shift={shift}
          apiPersonil={apiPersonil}
          iasPersonil={iasPersonil}
          printReports={printReports}
          checklistSummary={checklistSummary}
          formatLokasiPrint={formatLokasiPrint}
          formatHasil={formatHasil}
          formatUraian={formatUraian}
          isCorrective={isCorrective}
          isPreventive={isPreventive}
          isStoring={isStoring}
          getTime={getTime}
          getDayName={getDayName}
          formatDateIndo={formatDateIndo}
        />
      </div>

      {/* CRUD MODAL FORM */}
      <ShiftReportCrudModal
        isOpen={isCrudModalOpen}
        onClose={() => setIsCrudModalOpen(false)}
        modalMode={modalMode}
        crudForm={crudForm}
        setCrudForm={setCrudForm}
        shift={shift}
        crudPhotoPreview={crudPhotoPreview}
        setCrudPhotoPreview={setCrudPhotoPreview}
        setCrudPhotoFile={setCrudPhotoFile}
        onSubmit={handleCrudSubmit}
        isSubmitting={crudSubmitting}
      />

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
