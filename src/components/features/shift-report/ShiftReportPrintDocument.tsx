// src/components/features/shift-report/ShiftReportPrintDocument.tsx
import React, { forwardRef } from 'react';
import { ChecklistSummaryItem } from '../../../lib/services/operationalReportService';
// `?inline` menanam logo sebagai data URI. Ekspor PDF mengunduh ulang setiap
// <img> bersumber URL dan menyembunyikannya bila gagal dalam 2 detik, sehingga
// logo bisa hilang diam-diam dari PDF di jaringan lambat. Sumber data: dilewati.
import injourneyLogo from '../../../assets/logo-injourney-airports.webp?inline';

const InjourneyLogo: React.FC = () => (
  <img
    src={injourneyLogo}
    alt="Injourney Airports"
    width={520}
    height={163}
    draggable={false}
    className="w-full h-auto object-contain"
  />
);

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export interface ShiftReportPrintDocumentProps {
  date: string;
  shift: 'PS' | 'M' | 'ALL';
  apiPersonil: any[];
  iasPersonil: any[];
  printReports: any[];
  checklistSummary: ChecklistSummaryItem[];
  formatLokasiPrint: (lokasi?: string) => string;
  formatHasil: (r: any) => string;
  formatUraian: (r: any) => React.ReactNode;
  isCorrective: (r: any) => boolean;
  isPreventive: (r: any) => boolean;
  isStoring: (r: any) => boolean;
  getTime: (waktuStr: string) => string;
  getDayName: (d: string) => string;
  formatDateIndo: (d: string) => string;
}

export const ShiftReportPrintDocument = forwardRef<HTMLDivElement, ShiftReportPrintDocumentProps>(({
  date,
  shift,
  apiPersonil,
  iasPersonil,
  printReports,
  checklistSummary,
  formatLokasiPrint,
  formatHasil,
  formatUraian,
  isCorrective,
  isPreventive,
  isStoring,
  getTime,
  getDayName,
  formatDateIndo
}, ref) => {
  return (
    <div ref={ref} className="w-[1100px] p-6 bg-white text-black font-sans">
      {/* Header Kop Surat */}
      <div className="border-[3px] border-black flex items-stretch">
        <div className="w-[15%] border-r-[3px] border-black flex items-center justify-center p-2">
          <InjourneyLogo />
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
              <div className="bg-gray-200 text-center font-bold text-[10px] py-1 border-b-[3px] border-black">IASS</div>
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
          {printReports.map((report, idx) => (
            <tr key={idx} className="text-center bg-white">
              <td className="border-[2px] border-black p-1 font-bold">{idx + 1}</td>
              <td className="border-[2px] border-black p-1 font-semibold text-left px-1.5">{formatLokasiPrint(report.Lokasi)}</td>
              <td className="border-[2px] border-black p-1 font-semibold text-left px-1.5">{report.Peralatan}</td>
              <td className="border-[2px] border-black p-1 font-bold">{isCorrective(report) ? 'CORRECTIVE MAINTENANCE' : '-'}</td>
              <td className="border-[2px] border-black p-1 font-bold">{isPreventive(report) ? 'PREVENTIVE MAINTENANCE' : '-'}</td>
              <td className="border-[2px] border-black p-1 font-bold">{isCorrective(report) || isPreventive(report) ? '-' : 'KEGIATAN'}</td>
              <td 
                style={isStoring(report) ? { verticalAlign: 'middle', textAlign: 'center' } : { verticalAlign: 'top', textAlign: 'left' }}
                className={`border-[2px] border-black p-1 ${isStoring(report) ? 'align-middle text-center' : 'text-left align-top'}`}
              >
                {formatUraian(report)}
              </td>
              <td className="border-[2px] border-black p-1 font-bold">{getTime(report.Waktu)}</td>
              <td className="border-[2px] border-black p-1 font-bold">{formatHasil(report)}</td>
              <td className="border-[2px] border-black p-1">
                {report.fotoUrls && report.fotoUrls.length > 0 ? (
                  <div className={`grid ${report.fotoUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5`}>
                    {report.fotoUrls.map((url: string, pIdx: number) => (
                      <img 
                        key={pIdx}
                        src={url} 
                        alt="Dok" 
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous" 
                        className={`w-full ${report.fotoUrls.length === 1 ? 'h-12' : 'h-10'} object-cover rounded border border-gray-300`}
                        onError={(e) => { 
                          const target = e.target as HTMLImageElement;
                          const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)/);
                          if (match && !target.dataset.tried) {
                            target.dataset.tried = 'true';
                            target.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : report.imageUrl ? (
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
          {printReports.length === 0 && (
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
        className="serviceability-page-sheet pt-1" 
        style={{ 
          pageBreakBefore: 'always', 
          breakBefore: 'page',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          width: '100%'
        }} 
      >
        {/* Header Kop Surat Lembar Serviceability */}
        <div className="border-[3px] border-black flex items-stretch mb-2">
          <div className="w-[15%] border-r-[3px] border-black flex items-center justify-center p-2">
            <InjourneyLogo />
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
        <div className="mb-2">
          <table className="w-full border-collapse border-[2px] border-black text-[9px]">
            <thead>
              <tr className="bg-gray-200 font-bold text-center">
                <th className="border-[2px] border-black py-0.5 px-1 w-[6%]">No</th>
                <th className="border-[2px] border-black py-0.5 px-1.5 w-[32%]">Peralatan</th>
                <th className="border-[2px] border-black py-0.5 px-1 w-[12%]">%</th>
                <th className="border-[2px] border-black py-0.5 px-1 w-[12%]">Jumlah</th>
                <th className="border-[2px] border-black py-0.5 px-1 w-[12%]">Rusak</th>
                <th className="border-[2px] border-black py-0.5 px-1 w-[13%]">Rusak %</th>
                <th className="border-[2px] border-black py-0.5 px-1 w-[13%]">Total</th>
              </tr>
            </thead>
            <tbody>
              {checklistSummary.map((item) => (
                <tr key={item.no} className="text-center font-medium">
                  <td className="border-[2px] border-black py-0.5 px-1 font-bold">{item.no}</td>
                  <td className="border-[2px] border-black py-0.5 px-1.5 text-left font-bold">{item.nama}</td>
                  <td className="border-[2px] border-black py-0.5 px-1 font-bold">{Math.round(item.persenOperasi * 100)}%</td>
                  <td className="border-[2px] border-black py-0.5 px-1">{item.operasi}</td>
                  <td className="border-[2px] border-black py-0.5 px-1">{item.rusak}</td>
                  <td className="border-[2px] border-black py-0.5 px-1">{Math.round(item.persenRusak * 100)}%</td>
                  <td className="border-[2px] border-black py-0.5 px-1 font-bold">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DIAGRAM BATANG SERVICEABILITY PADA LAPORAN PDF */}
        <div className="border-[2px] border-black p-2.5 bg-white">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-300">
            <span className="font-bold text-[10px] text-black uppercase tracking-wide">
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
          <div className="pl-9 pr-3 pt-3">
            <div className="relative h-32 border-b-2 border-black bg-gray-50/40">
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
  );
});

ShiftReportPrintDocument.displayName = 'ShiftReportPrintDocument';
