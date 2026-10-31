import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';
import { ClipboardCheck, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Trash2, Clock } from 'lucide-react';
import { MONTH_NAMES_ID, enrichRecordsWithSupabaseIds } from '../../lib/utils/pmScheduleParser';
import { parseSheetGac, findGacSheetName } from '../../lib/utils/gacScheduleParser';
import { getErrorMessage } from '../../lib/utils/errorUtils';

const formatTanggal = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_NAMES_ID[m - 1]} ${y}`;
};

/** Upload Jadwal General Annual Check (sheet "JADWAL GAC", sel hijau). Tampil di Rencana Kegiatan semua shift. */
export const GacScheduleUploader: React.FC = () => {
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [historyList, setHistoryList] = useState<{ yearMonth: string; count: number }[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const { data, error } = await supabase.from('jadwal_gac').select('tahun, bulan');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(row => {
        const ym = `${row.tahun}-${String(row.bulan).padStart(2, '0')}`;
        counts[ym] = (counts[ym] || 0) + 1;
      });
      setHistoryList(Object.keys(counts).sort((a, b) => b.localeCompare(a)).map(ym => ({ yearMonth: ym, count: counts[ym] })));
    } catch (err) {
      console.error('Error fetching GAC history:', err);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { cellStyles: true });
      const sheetName = findGacSheetName(workbook);
      if (!sheetName) {
        throw new Error('Sheet jadwal GAC tidak ditemukan. Pastikan nama sheet memuat "GAC" atau judulnya "Jadwal General Annual Check".');
      }

      const { records, dariTanggal, sampaiTanggal } = parseSheetGac(workbook.Sheets[sheetName], selectedTahun);
      if (records.length === 0 || !dariTanggal || !sampaiTanggal) {
        throw new Error('Tidak ada jadwal GAC yang terbaca. Pastikan tabel memiliki kolom LOKASI, MERK/TYPE, baris nama bulan, baris tanggal, dan sel berwarna hijau.');
      }

      const enriched = await enrichRecordsWithSupabaseIds(records);

      // Ganti jadwal lama pada rentang tanggal sheet ini agar tidak terjadi duplikasi
      const { error: deleteError } = await supabase
        .from('jadwal_gac')
        .delete()
        .gte('tanggal', dariTanggal)
        .lte('tanggal', sampaiTanggal);
      if (deleteError) throw new Error('Gagal menghapus jadwal GAC lama: ' + deleteError.message);

      const { error } = await supabase.from('jadwal_gac').insert(enriched);
      if (error) throw new Error('Gagal menyimpan jadwal GAC ke Supabase: ' + error.message);

      const tanggalCount = new Set(enriched.map(r => r.tanggal)).size;
      setUploadStatus({
        type: 'success',
        message: `Berhasil mengunggah ${enriched.length} jadwal GAC pada ${tanggalCount} tanggal (${formatTanggal(dariTanggal)} – ${formatTanggal(sampaiTanggal)}) dari sheet "${sheetName}".`,
      });
      await fetchHistory();
    } catch (err) {
      console.error('GAC upload error:', err);
      setUploadStatus({ type: 'error', message: getErrorMessage(err, 'Terjadi kesalahan saat memproses Excel GAC.') });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteSchedule = async (yearMonth: string) => {
    if (!window.confirm(`Anda yakin ingin menghapus seluruh jadwal GAC untuk periode ${yearMonth}?`)) return;

    setIsDeleting(yearMonth);
    try {
      const [year, month] = yearMonth.split('-').map(Number);
      const { error } = await supabase.from('jadwal_gac').delete().eq('tahun', year).eq('bulan', month);
      if (error) throw error;
      await fetchHistory();
    } catch (err) {
      console.error('Failed to delete GAC schedule:', err);
      alert('Gagal menghapus jadwal GAC dari database.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 text-green-700 rounded-lg">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Upload Jadwal GAC (General Annual Check)</h2>
          <p className="text-sm text-slate-500">
            Unggah file Excel berisi sheet "JADWAL GAC". Jadwal tampil di Rencana Kegiatan Tab Kehadiran pada semua shift.
          </p>
        </div>
      </div>

      <div className="mb-6 max-w-xs">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Tahun <span className="text-xs font-normal text-slate-400">(dipakai bila judul sheet tidak memuat tahun)</span>
        </label>
        <input
          type="number"
          value={selectedTahun}
          onChange={e => setSelectedTahun(Number(e.target.value))}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      <div className="relative border-2 border-dashed border-green-300 rounded-xl bg-green-50/50 hover:bg-green-100/50 transition-colors cursor-pointer text-center p-8">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-green-700">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-bold">Memproses File Excel & Sinkronisasi ke Supabase...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-green-800">
            <FileSpreadsheet className="w-10 h-10 text-green-600" />
            <p className="font-bold text-base">Pilih atau Drag File Excel Jadwal GAC</p>
            <p className="text-xs text-green-700">
              Format: kolom LOKASI, MERK/TYPE, baris nama bulan & tanggal (Warna Hijau: General Annual Check). Jadwal Tindak Lanjut tidak ikut dibaca.
            </p>
          </div>
        )}
      </div>

      {uploadStatus.type === 'success' && (
        <div className="mt-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 text-green-900 rounded-lg">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
          <div>
            <p className="font-bold">Upload Jadwal GAC Berhasil!</p>
            <p className="text-sm text-green-800">{uploadStatus.message}</p>
          </div>
        </div>
      )}

      {uploadStatus.type === 'error' && (
        <div className="mt-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Upload Jadwal GAC Gagal</p>
            <p className="text-sm">{uploadStatus.message}</p>
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-green-600" /> Histori Upload Jadwal GAC
          {isFetchingHistory && <Loader2 className="w-4 h-4 text-green-500 animate-spin" />}
        </h3>

        {historyList.length === 0 && !isFetchingHistory ? (
          <p className="text-sm text-slate-500 italic">Belum ada histori upload jadwal GAC.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {historyList.map(h => {
              const [y, m] = h.yearMonth.split('-').map(Number);
              return (
                <div key={h.yearMonth} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-green-300 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{MONTH_NAMES_ID[m - 1] || h.yearMonth} {y}</p>
                    <p className="text-xs text-green-700 font-semibold">{h.count} entri jadwal GAC</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(h.yearMonth)}
                    disabled={isDeleting === h.yearMonth}
                    className="p-2 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50"
                    title="Hapus Jadwal GAC Periode Ini"
                  >
                    {isDeleting === h.yearMonth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
