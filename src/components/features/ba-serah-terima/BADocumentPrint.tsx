// src/components/features/ba-serah-terima/BADocumentPrint.tsx
import { forwardRef } from 'react';
import type { BarangItem } from '../../../lib/types';

export type ItemSerahTerima = BarangItem;

export interface BaData {
  tanggal: string;
  waktu: string;
  penyerahNama: string;
  penyerahJabatan: string;
  penyerahInstansi: string;
  penerimaNama: string;
  penerimaJabatan: string;
  penerimaInstansi: string;
}

export interface BADocumentPrintProps {
  baData: BaData;
  items: ItemSerahTerima[];
  signaturePenyerah: string | null;
  signaturePenerima: string | null;
  isPenyerahSses: boolean;
  isPenerimaSses: boolean;
  photos: { preview: string }[];
  autoCollageUrl: string | null;
  formatDateIndo: (dateStr: string) => string;
}

export const BADocumentPrint = forwardRef<HTMLDivElement, BADocumentPrintProps>(({
  baData,
  items,
  signaturePenyerah,
  signaturePenerima,
  isPenyerahSses,
  isPenerimaSses,
  photos,
  autoCollageUrl,
  formatDateIndo
}, ref) => {
  return (
    <div ref={ref} className="space-y-8 print:space-y-0">
      <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-md text-slate-900 font-sans space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:space-y-4 print:text-black">
        <div className="text-center border-b-2 border-slate-900 print:border-black pb-3 print:pb-2">
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide print:text-base text-slate-900 print:text-black">
            BERITA ACARA SERAH TERIMA BARANG
          </h1>
        </div>

        <p className="text-xs leading-relaxed text-slate-900 print:text-black">
          Pada tanggal <strong>{formatDateIndo(baData.tanggal)}</strong> pukul <strong>{baData.waktu} WIB</strong>, telah dilakukan serah terima barang antara pihak-pihak di bawah ini:
        </p>

        {/* PIHAK KESATU & PIHAK KEDUA STACKED (VERTIKAL) */}
        <div className="space-y-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-transparent print:p-0 print:border-none print:space-y-3">
          <div className="print:border-b print:border-slate-300 print:pb-2">
            <p className="font-bold text-blue-900 print:text-black border-b border-blue-200 print:border-none pb-1 mb-2">
              1. PIHAK KESATU (YANG MENYERAHKAN):
            </p>
            <table className="w-full text-xs">
              <tbody>
                <tr><td className="w-24 text-slate-600 print:text-black font-medium py-0.5">Nama</td><td>: <strong className="text-black">{baData.penyerahNama || '-'}</strong></td></tr>
                <tr><td className="text-slate-600 print:text-black font-medium py-0.5">Jabatan</td><td>: <span className="text-black">{baData.penyerahJabatan || '-'}</span></td></tr>
                <tr><td className="text-slate-600 print:text-black font-medium py-0.5">{isPenyerahSses ? 'Unit' : 'Unit/PT'}</td><td>: <span className="text-black">{baData.penyerahInstansi || '-'}</span></td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="font-bold text-emerald-900 print:text-black border-b border-emerald-200 print:border-none pb-1 mb-2">
              2. PIHAK KEDUA (YANG MENERIMA):
            </p>
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
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Preview Lembar Evidence / Lampiran Foto (Siap Cetak / PDF)
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
  );
});

BADocumentPrint.displayName = 'BADocumentPrint';
