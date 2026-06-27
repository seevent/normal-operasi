import React, { useState, useRef, useEffect } from 'react';
import { Calendar, FileText, Download, Share2, Loader2, CheckCircle, Clock, Plus, Edit, Trash2, X } from 'lucide-react';
import { GOOGLE_SHEETS_WEBAPP_URL } from '../../lib/data/constants';
import { shareToWhatsApp } from '../../lib/services/shareService';
import { syncToGoogleSheets, updateSheetReport, deleteSheetReport } from '../../lib/services/sheetsSyncService';
// html2pdf.js is loaded dynamically (browser-only, references `self`)
import { supabase } from '../../lib/supabaseClient';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const TabShiftReport: React.FC = () => {
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const h = now.getHours();
    if (h < 8) {
      const prevDate = new Date(now);
      prevDate.setDate(now.getDate() - 1);
      return prevDate.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  });
  
  const [shift, setShift] = useState<'PS' | 'M'>(() => {
    const h = new Date().getHours();
    return (h >= 8 && h < 20) ? 'PS' : 'M';
  });

  const [loading, setLoading] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  // CRUD State
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [crudSubmitting, setCrudSubmitting] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);

  const [crudForm, setCrudForm] = useState({
    jenis: 'Kegiatan' as 'Perbaikan' | 'Kegiatan' | 'Storing',
    waktu: '',
    peralatan: '',
    lokasi: '',
    uraian: '',
    tindakLanjut: '-',
    status: 'Normal Operasi'
  });

  const openAddModal = () => {
    setModalMode('add');
    setEditingRowIndex(null);
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

  const handleDeleteItem = async (rowIndex: number, namaAlat: string) => {
    if (!window.confirm(`Hapus laporan kegiatan "${namaAlat}" ini dari Google Sheets?`)) return;
    setDeletingRowIndex(rowIndex);
    try {
      const ok = await deleteSheetReport(rowIndex);
      if (ok) {
        setStatusMsg({ text: "Laporan berhasil dihapus.", type: 'success' });
        await loadShiftReports(date, shift);
      } else {
        setStatusMsg({ text: "Gagal menghapus laporan dari server.", type: 'error' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingRowIndex(null);
    }
  };

  const handleCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudSubmitting(true);
    try {
      if (modalMode === 'add') {
        await syncToGoogleSheets({
          jenis: crudForm.jenis,
          tanggal: date,
          waktu: crudForm.waktu,
          shift: shift,
          lokasi: crudForm.lokasi || '-',
          peralatan: crudForm.peralatan || '-',
          uraian: crudForm.uraian || '-',
          tindakLanjut: crudForm.tindakLanjut || '-',
          status: crudForm.status || 'Normal Operasi'
        });
        setStatusMsg({ text: "Laporan baru ditambahkan.", type: 'success' });
      } else if (modalMode === 'edit' && editingRowIndex) {
        await updateSheetReport({
          rowIndex: editingRowIndex,
          jenis: crudForm.jenis,
          tanggal: date,
          waktu: crudForm.waktu,
          shift: shift,
          lokasi: crudForm.lokasi || '-',
          peralatan: crudForm.peralatan || '-',
          uraian: crudForm.uraian || '-',
          tindakLanjut: crudForm.tindakLanjut || '-',
          status: crudForm.status || 'Normal Operasi'
        });
        setStatusMsg({ text: "Laporan diperbarui.", type: 'success' });
      }
      setIsCrudModalOpen(false);
      setTimeout(() => loadShiftReports(date, shift), 1000);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: "Gagal menyimpan perubahan.", type: 'error' });
    } finally {
      setCrudSubmitting(false);
    }
  };

  const [apiPersonil, setApiPersonil] = useState<any[]>([]);
  const [iasPersonil, setIasPersonil] = useState<any[]>([]);
  
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPersonil = async () => {
      try {
        const { data, error } = await supabase
          .from('jadwal_shift')
          .select(`
            id, shift, status_kehadiran,
            personel:personel_id (id, nama, no_hp, unit_kerja(nama))
          `)
          .eq('tanggal', date)
          .eq('shift', shift);

        if (!error && data) {
          const hadir = data.filter(d => d.status_kehadiran !== 'Off' && d.status_kehadiran !== 'Cuti' && d.status_kehadiran !== 'Sakit' && d.status_kehadiran !== 'Izin');
          
          const apiList = hadir.filter(d => {
             const u = d.personel?.unit_kerja?.nama?.toUpperCase() || '';
             return u === 'API T2' || u.includes('API') || u.includes('ANGKASA PURA');
          });
          const iasList = hadir.filter(d => {
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

  const loadShiftReports = async (targetDate: string, targetShift: string) => {
    if (!targetDate) return [];
    setFetchingLive(true);
    try {
      const res1 = await fetch(`${GOOGLE_SHEETS_WEBAPP_URL}?action=get_daily&date=${targetDate}`);
      const data1 = await res1.json();
      let allData = (data1 && data1.status === 'success' && Array.isArray(data1.data)) ? data1.data : [];

      if (targetShift === 'M') {
        const nextDateObj = new Date(targetDate);
        nextDateObj.setDate(nextDateObj.getDate() + 1);
        const nextDateStr = nextDateObj.toISOString().split('T')[0];
        
        const res2 = await fetch(`${GOOGLE_SHEETS_WEBAPP_URL}?action=get_daily&date=${nextDateStr}`);
        const data2 = await res2.json();
        if (data2 && data2.status === 'success' && Array.isArray(data2.data)) {
          allData = [...allData, ...data2.data];
        }
      }

      const filtered = allData.filter((r: any) => {
        if (!r.Waktu) return true;
        const timeMatch = String(r.Waktu).match(/(\d{2}):(\d{2})/);
        if (!timeMatch) return true;
        const hour = parseInt(timeMatch[1], 10);
        
        if (targetShift === 'PS') {
          return hour >= 8 && hour < 20;
        } else {
          return hour >= 20 || hour < 8;
        }
      });

      setReports(filtered);
      return filtered;
    } catch (err) {
      console.error("Gagal menarik data harian shift:", err);
      return [];
    } finally {
      setFetchingLive(false);
    }
  };

  const fetchAndGeneratePDF = async () => {
    if (!date) return;
    setLoading(true);
    setStatusMsg({ text: "Mempersiapkan laporan PDF...", type: 'info' });

    let currentList = reports;
    if (currentList.length === 0) {
      currentList = await loadShiftReports(date, shift) || [];
    }

    if (currentList.length > 0) {
      setStatusMsg({ text: `Memproses ${currentList.length} laporan ke dalam PDF...`, type: 'info' });
      setTimeout(async () => {
        await generateAndSharePdf(currentList);
      }, 1000);
    } else {
      setStatusMsg({ text: "Tidak ada laporan pada shift tersebut.", type: 'error' });
      setLoading(false);
    }
  };

  const generateAndSharePdf = async (reportData: any[]) => {
    try {
      if (!pdfRef.current) return;
      const element = pdfRef.current;
      const opt = {
        margin:       5, // smaller margin for landscape
        filename:     `Laporan_Shift_${shift}_${date}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      const html2pdf = (await import('html2pdf.js')).default;
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      
      setStatusMsg({ text: "PDF berhasil dibuat. Menyimpan ke Google Drive...", type: 'info' });

      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'save_pdf',
              filename: `Laporan_Shift_${shift}_${date}.pdf`,
              pdfBase64: base64String
            })
          });
          setStatusMsg({ text: "PDF tersimpan di Drive. Meneruskan ke WA...", type: 'success' });
        } catch (e) {
          setStatusMsg({ text: "Gagal menyimpan ke Drive, tapi tetap dibagikan ke WA.", type: 'error' });
        }

        const pdfFile = new File([pdfBlob], `Laporan_Shift_${shift}_${date}.pdf`, { type: 'application/pdf' });
        await shareToWhatsApp(`Berikut lampiran rekap laporan perbaikan Shift ${shift} tanggal ${date}`, pdfFile, () => {});
        
        setTimeout(() => setStatusMsg(null), 4000);
        setLoading(false);
      };
      
    } catch (err) {
      setStatusMsg({ text: "Gagal membuat PDF.", type: 'error' });
      setLoading(false);
    }
  };

  const isCorrective = (r: any) => {
    // Basic logic to determine if it's corrective (Perbaikan) or Kegiatan (Storing/Lainnya)
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
      return <div className="text-center font-bold text-[9px]">{r.TindakLanjut || r.Uraian || 'Running test'}</div>;
    }
  };

  const getTime = (waktuStr: string) => {
    if (!waktuStr) return '-';
    const match = waktuStr.match(/(\d{2}:\d{2})/);
    return match ? match[1] : waktuStr;
  };

  const getDayName = (d: string) => {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return days[new Date(d).getDay()];
  };
  
  const formatDateIndo = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTHS[dt.getMonth()].toUpperCase()} ${dt.getFullYear()}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 rounded-2xl">
      {/* LIVE SHIFT LIST SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Daftar Laporan Shift Aktif ({reports.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddModal}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1 px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Manual
            </button>
            <button 
              onClick={() => loadShiftReports(date, shift)}
              disabled={fetchingLive}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 p-2 bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {fetchingLive ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />} Segarkan
            </button>
          </div>
        </div>

        {fetchingLive ? (
          <div className="p-8 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> Memuat data kegiatan shift...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Belum ada laporan (Perbaikan, Kegiatan, atau Storing) tercatat pada shift ini.
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
                {item.Drive_Image_ID && item.Drive_Image_ID !== '-' && item.Drive_Image_ID !== '' ? (
                  <img 
                    src={`https://drive.google.com/uc?export=view&id=${item.Drive_Image_ID}`} 
                    alt="Foto" 
                    className="w-24 h-24 rounded-lg object-cover bg-slate-200 border border-slate-300 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23cbd5e1"/><text x="50%" y="50%" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="%2364748b">No Foto</text></svg>'; }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                    No Foto
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      item.Jenis === 'Perbaikan' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      item.Jenis === 'Storing' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {item.Jenis || 'Kegiatan'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.Waktu || '-'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 truncate">{item.Peralatan || 'Peralatan'}</h4>
                  <p className="text-xs font-semibold text-slate-600 mb-1 truncate">📍 {item.Lokasi || '-'}</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.Uraian || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GENERATE SHIFT REPORT SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <FileText className="w-6 h-6 text-blue-600" /> Generate Laporan Shift (PDF)
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Pilih Tanggal dan Shift. Sistem akan otomatis memuat nama Personil On Duty dari absen dan menarik laporan dari jam operasional shift bersangkutan.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" /> Tanggal Shift
            </label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" /> Shift
            </label>
            <select 
              value={shift} 
              onChange={(e) => setShift(e.target.value as 'PS' | 'M')}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="PS">Pagi - Siang (08:00 - 20:00)</option>
              <option value="M">Malam (20:00 - 08:00)</option>
            </select>
          </div>
          
          <div className="pt-7">
            <button 
              onClick={fetchAndGeneratePDF} 
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
              ) : (
                <><Download className="w-5 h-5" /> Buat Laporan</>
              )}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className={`mt-2 p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
            statusMsg.type === 'error' ? 'bg-rose-100 text-rose-700' :
            statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
             statusMsg.type === 'error' ? <FileText className="w-5 h-5" /> : 
             <Loader2 className="w-5 h-5 animate-spin" />}
            {statusMsg.text}
          </div>
        )}
      </div>

      {/* HIDDEN PDF CONTENT */}
      <div className="overflow-hidden h-0 w-0 absolute opacity-0 pointer-events-none">
        {/* Landscape A4 width is roughly 1122px */}
        <div ref={pdfRef} className="w-[1100px] p-4 bg-white text-black font-sans">
          
          {/* Header */}
          <div className="border-[3px] border-black flex items-stretch">
            <div className="w-[15%] border-r-[3px] border-black flex items-center justify-center p-2">
              <div className="text-[12px] font-bold text-blue-800 text-center">
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
          
          {/* Shift & Personil */}
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
                        <span>{p.personel.nama}</span>
                        <span>{p.personel.no_hp}</span>
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
                        <span>{p.personel.nama}</span>
                        <span>{p.personel.no_hp}</span>
                      </div>
                    ))}
                    {iasPersonil.length === 0 && <div className="text-center text-[10px] text-gray-500 py-1">-</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-4"></div>

          {/* Table */}
          <table className="w-full border-collapse border-[3px] border-black text-[10px]">
            <thead>
              <tr className="bg-gray-200 font-bold text-center">
                <th className="border-[3px] border-black p-1 w-[3%]">No</th>
                <th className="border-[3px] border-black p-1 w-[12%]">LOKASI</th>
                <th className="border-[3px] border-black p-1 w-[15%]">PERALATAN</th>
                <th className="border-[3px] border-black p-1 w-[10%]">CORRECTIVE<br/>MAINTENANCE</th>
                <th className="border-[3px] border-black p-1 w-[10%]">PREVENTIVE<br/>MAINTENANCE</th>
                <th className="border-[3px] border-black p-1 w-[10%]">LAIN - LAIN</th>
                <th className="border-[3px] border-black p-1 w-[20%]">URAIAN KEGIATAN</th>
                <th className="border-[3px] border-black p-1 w-[8%]">WAKTU<br/>TINDAK LANJUT</th>
                <th className="border-[3px] border-black p-1 w-[5%]">HASIL</th>
                <th className="border-[3px] border-black p-1 w-[7%]">DOKUMENTASI</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, idx) => (
                <tr key={idx} className="text-center bg-white">
                  <td className="border-[3px] border-black p-1 font-bold">{idx + 1}</td>
                  <td className="border-[3px] border-black p-1 font-semibold">{report.Lokasi || '-'}</td>
                  <td className="border-[3px] border-black p-1 font-semibold">{report.Peralatan}</td>
                  <td className="border-[3px] border-black p-1 font-bold">{isCorrective(report) ? 'CORRECTIVE MAINTENANCE' : '-'}</td>
                  <td className="border-[3px] border-black p-1 font-bold">-</td>
                  <td className="border-[3px] border-black p-1 font-bold">{isCorrective(report) ? '-' : 'KEGIATAN'}</td>
                  <td className="border-[3px] border-black p-1 text-left align-top">{formatUraian(report)}</td>
                  <td className="border-[3px] border-black p-1 font-bold">{getTime(report.Waktu)}</td>
                  <td className="border-[3px] border-black p-1 font-bold">{report.Status === 'Normal' ? 'Normal' : report.Status}</td>
                  <td className="border-[3px] border-black p-1">
                    {report.Drive_Image_ID ? (
                      <img 
                        src={`https://drive.google.com/uc?id=${report.Drive_Image_ID}`} 
                        alt="Dok" 
                        crossOrigin="anonymous" 
                        className="w-full h-12 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={10} className="border-[3px] border-black p-4 text-center font-bold italic text-gray-500">
                    Tidak ada laporan perbaikan/kegiatan pada shift ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

        </div>
      </div>

      {/* CRUD MODAL FORM */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {modalMode === 'add' ? <Plus className="w-5 h-5 text-blue-600" /> : <Edit className="w-5 h-5 text-blue-600" />}
                {modalMode === 'add' ? 'Tambah Laporan Manual' : 'Edit Laporan Shift'}
              </h3>
              <button onClick={() => setIsCrudModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrudSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Laporan</label>
                  <select
                    value={crudForm.jenis}
                    onChange={(e) => setCrudForm({ ...crudForm, jenis: e.target.value as any })}
                    className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Perbaikan">Perbaikan</option>
                    <option value="Storing">Storing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam / Waktu</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 08:30"
                    value={crudForm.waktu}
                    onChange={(e) => setCrudForm({ ...crudForm, waktu: e.target.value })}
                    className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Peralatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X-Ray Baggage / AC Split"
                  value={crudForm.peralatan}
                  onChange={(e) => setCrudForm({ ...crudForm, peralatan: e.target.value })}
                  className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SCP T2D / Ruang Server"
                  value={crudForm.lokasi}
                  onChange={(e) => setCrudForm({ ...crudForm, lokasi: e.target.value })}
                  className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Uraian / Deskripsi Pekerjaan</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan detail kegiatan yang dilakukan..."
                  value={crudForm.uraian}
                  onChange={(e) => setCrudForm({ ...crudForm, uraian: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tindak Lanjut</label>
                  <input
                    type="text"
                    placeholder="Contoh: Monitoring / Selesai"
                    value={crudForm.tindakLanjut}
                    onChange={(e) => setCrudForm({ ...crudForm, tindakLanjut: e.target.value })}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <input
                    type="text"
                    placeholder="Contoh: Normal Operasi"
                    value={crudForm.status}
                    onChange={(e) => setCrudForm({ ...crudForm, status: e.target.value })}
                    className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                  {crudSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
