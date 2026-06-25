import React, { useState, useRef, useEffect } from 'react';
import { Calendar, FileText, Download, Share2, Loader2, CheckCircle, Clock } from 'lucide-react';
import { GOOGLE_SHEETS_WEBAPP_URL } from '../../lib/data/constants';
import { shareToWhatsApp } from '../../lib/services/shareService';
// html2pdf.js is loaded dynamically (browser-only, references `self`)
import { supabase } from '../../lib/supabaseClient';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const TabShiftReport: React.FC = () => {
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const h = now.getHours();
    if (h < 10) {
      const prevDate = new Date(now);
      prevDate.setDate(now.getDate() - 1);
      return prevDate.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  });
  
  const [shift, setShift] = useState<'PS' | 'M'>(() => {
    const h = new Date().getHours();
    return (h >= 10 && h < 22) ? 'PS' : 'M';
  });

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  
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
  }, [date, shift]);

  const fetchAndGeneratePDF = async () => {
    if (!date) return;
    setLoading(true);
    setStatusMsg({ text: "Mengambil data dari server...", type: 'info' });

    try {
      // Fetch day 1
      const res1 = await fetch(`${GOOGLE_SHEETS_WEBAPP_URL}?action=get_daily&date=${date}`);
      const data1 = await res1.json();
      let allData = (data1.status === 'success' && data1.data) ? data1.data : [];

      // If Malam, fetch day 2
      if (shift === 'M') {
        const nextDateObj = new Date(date);
        nextDateObj.setDate(nextDateObj.getDate() + 1);
        const nextDateStr = nextDateObj.toISOString().split('T')[0];
        
        const res2 = await fetch(`${GOOGLE_SHEETS_WEBAPP_URL}?action=get_daily&date=${nextDateStr}`);
        const data2 = await res2.json();
        if (data2.status === 'success' && data2.data) {
          allData = [...allData, ...data2.data];
        }
      }

      // Filter by time
      const filtered = allData.filter((r: any) => {
        if (!r.Waktu) return true;
        const timeMatch = r.Waktu.match(/(\d{2}):(\d{2})/);
        if (!timeMatch) return true;
        const hour = parseInt(timeMatch[1], 10);
        
        if (shift === 'PS') {
          return hour >= 8 && hour < 20;
        } else {
          return hour >= 20 || hour < 8;
        }
      });

      if (filtered.length > 0) {
        setReports(filtered);
        setStatusMsg({ text: `Ditemukan ${filtered.length} laporan. Memproses PDF...`, type: 'info' });
        
        setTimeout(async () => {
          await generateAndSharePdf(filtered);
        }, 1500);

      } else {
        setReports([]);
        setStatusMsg({ text: "Tidak ada laporan pada shift tersebut.", type: 'error' });
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: "Terjadi kesalahan saat mengambil data.", type: 'error' });
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
    </div>
  );
};
