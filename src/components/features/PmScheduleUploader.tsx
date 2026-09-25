import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';
import { 
  Wrench, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, 
  Trash2, Clock, Layers, Sparkles, Check
} from 'lucide-react';
import { 
  parseSheetPm, enrichRecordsWithSupabaseIds, MONTH_NAMES_ID, JadwalPmRecord 
} from '../../lib/utils/pmScheduleParser';

export const PmScheduleUploader: React.FC = () => {
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
  const [uploadMode, setUploadMode] = useState<'single' | 'multi'>('multi');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    summary?: {
      total: number;
      countsByCat: Record<string, number>;
      countsByJenis: Record<string, number>;
    } | null;
  }>({ type: null, message: '', summary: null });

  const [historyList, setHistoryList] = useState<{ yearMonth: string; count: number }[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const { data, error } = await supabase
        .from('jadwal_pm')
        .select('tahun, bulan');
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(row => {
        const ym = `${row.tahun}-${String(row.bulan).padStart(2, '0')}`;
        counts[ym] = (counts[ym] || 0) + 1;
      });

      const list = Object.keys(counts)
        .sort((a, b) => b.localeCompare(a))
        .map(ym => ({ yearMonth: ym, count: counts[ym] }));

      setHistoryList(list);
    } catch (err) {
      console.error('Error fetching PM history:', err);
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
    setUploadStatus({ type: null, message: '', summary: null });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellStyles: true });

      const sheetsToProcess: Array<{ name: string; bulan: number; tahun: number }> = [];

      if (uploadMode === 'single') {
        const monthName = MONTH_NAMES_ID[selectedBulan - 1];
        const targetSheet = workbook.SheetNames.find(s => 
          s.toUpperCase().includes(monthName)
        ) || workbook.SheetNames[0];

        if (!targetSheet) {
          throw new Error(`Sheet untuk bulan ${monthName} tidak ditemukan dalam file Excel.`);
        }
        sheetsToProcess.push({ name: targetSheet, bulan: selectedBulan, tahun: selectedTahun });
      } else {
        // Multi-sheet mode (otomatis membaca seluruh sheet nama bulan)
        workbook.SheetNames.forEach(sheetName => {
          const upper = sheetName.toUpperCase().trim();
          // Cek apakah sheet bernama nama bulan (Januari-Desember)
          const mIdx = MONTH_NAMES_ID.findIndex(m => upper.includes(m));
          if (mIdx !== -1) {
            // Hindari duplikat jika ada sheet "SEPTEMBER (1)"
            const alreadyHasMonth = sheetsToProcess.some(sp => sp.bulan === mIdx + 1);
            if (!alreadyHasMonth) {
              sheetsToProcess.push({ name: sheetName, bulan: mIdx + 1, tahun: selectedTahun });
            }
          }
        });

        if (sheetsToProcess.length === 0) {
          // Fallback: gunakan sheet pertama dengan bulan terpilih
          sheetsToProcess.push({ name: workbook.SheetNames[0], bulan: selectedBulan, tahun: selectedTahun });
        }
      }

      const allRecords: JadwalPmRecord[] = [];
      for (const item of sheetsToProcess) {
        const ws = workbook.Sheets[item.name];
        if (ws) {
          const records = parseSheetPm(ws, item.bulan, item.tahun);
          allRecords.push(...records);
        }
      }

      if (allRecords.length === 0) {
        throw new Error('Tidak ada data jadwal PM yang berhasil dibaca. Pastikan format tabel memiliki kolom LOKASI, MERK/TYPE, tanggal 1-31, dan cell berwarna.');
      }

      // Lengkapi dengan ID relasional Supabase
      const enriched = await enrichRecordsWithSupabaseIds(allRecords);

      // Hapus data lama pada periode terkait terlebih dahulu agar tidak terjadi duplikasi
      const affectedPeriods = Array.from(new Set(enriched.map(r => `${r.tahun}-${r.bulan}`)));
      for (const p of affectedPeriods) {
        const [thn, bln] = p.split('-').map(Number);
        await supabase.from('jadwal_pm').delete().eq('tahun', thn).eq('bulan', bln);
      }

      // Simpan ke Supabase dalam batch per 200 baris
      const chunkSize = 200;
      for (let i = 0; i < enriched.length; i += chunkSize) {
        const chunk = enriched.slice(i, i + chunkSize);
        const { error } = await supabase.from('jadwal_pm').insert(chunk);
        if (error) throw new Error('Gagal menyimpan jadwal PM ke Supabase: ' + error.message);
      }

      // Hitung ringkasan statistik
      const countsByCat: Record<string, number> = {};
      const countsByJenis: Record<string, number> = {};
      enriched.forEach(r => {
        countsByCat[r.kategori_pm] = (countsByCat[r.kategori_pm] || 0) + 1;
        countsByJenis[r.jenis] = (countsByJenis[r.jenis] || 0) + 1;
      });

      setUploadStatus({
        type: 'success',
        message: `Berhasil mengunggah ${enriched.length} jadwal PM untuk ${affectedPeriods.length} periode bulan (${affectedPeriods.map(p => {
          const [y, m] = p.split('-').map(Number);
          return `${MONTH_NAMES_ID[m-1]} ${y}`;
        }).join(', ')}).`,
        summary: {
          total: enriched.length,
          countsByCat,
          countsByJenis
        }
      });

      await fetchHistory();
    } catch (err: any) {
      console.error('PM upload error:', err);
      setUploadStatus({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat memproses Excel PM.',
        summary: null
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteSchedule = async (yearMonth: string) => {
    if (!window.confirm(`Anda yakin ingin menghapus seluruh jadwal PM untuk periode ${yearMonth}?`)) {
      return;
    }

    setIsDeleting(yearMonth);
    try {
      const [year, month] = yearMonth.split('-').map(Number);
      const { error } = await supabase
        .from('jadwal_pm')
        .delete()
        .eq('tahun', year)
        .eq('bulan', month);

      if (error) throw error;
      await fetchHistory();
    } catch (err) {
      console.error('Failed to delete PM schedule:', err);
      alert('Gagal menghapus jadwal PM dari database.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Upload Jadwal PM (Preventive Maintenance)</h2>
          <p className="text-sm text-slate-500">
            Unggah file Excel jadwal PM bulanan/tahunan. Data disimpan dengan penamaan lokasi, jenis, dan tipe standar Supabase.
          </p>
        </div>
      </div>

      {/* Mode Upload Selector */}
      <div className="mb-5 bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-wrap items-center gap-4">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mode Upload:</span>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
          <input 
            type="radio" 
            name="pmUploadMode" 
            checked={uploadMode === 'multi'} 
            onChange={() => setUploadMode('multi')}
            className="text-emerald-600 focus:ring-emerald-500" 
          />
          <Layers className="w-4 h-4 text-emerald-600" /> Semua Bulan di Excel (Multi-Sheet)
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
          <input 
            type="radio" 
            name="pmUploadMode" 
            checked={uploadMode === 'single'} 
            onChange={() => setUploadMode('single')}
            className="text-emerald-600 focus:ring-emerald-500" 
          />
          Hanya Bulan Tertentu
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Bulan {uploadMode === 'multi' && <span className="text-xs font-normal text-slate-400">(Sebagai acuan/default)</span>}
          </label>
          <select 
            value={selectedBulan} 
            onChange={e => setSelectedBulan(Number(e.target.value))} 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {MONTH_NAMES_ID.map((m, i) => (
              <option key={i} value={i+1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Tahun</label>
          <input 
            type="number" 
            value={selectedTahun} 
            onChange={e => setSelectedTahun(Number(e.target.value))} 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
      </div>

      {/* Dropzone */}
      <div className="relative border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50/50 hover:bg-emerald-100/50 transition-colors cursor-pointer text-center p-8">
        <input 
          type="file" 
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-emerald-600">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-bold">Memproses File Excel & Sinkronisasi ke Supabase...</p>
            <p className="text-xs text-slate-500">Mendeteksi warna cell & mencocokkan peralatan ke database...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-emerald-700">
            <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
            <p className="font-bold text-base">Pilih atau Drag File Excel Jadwal PM</p>
            <p className="text-xs text-emerald-600">
              Format: Matriks bulanan dengan kolom LOKASI, MERK/TYPE, tanggal 1-31 (Warna Kuning: Mingguan, Merah: Bulanan PS, Biru: Bulanan M)
            </p>
          </div>
        )}
      </div>

      {/* Status Alert */}
      {uploadStatus.type === 'success' && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
            <div className="flex-1">
              <p className="font-bold">Upload Jadwal PM Berhasil!</p>
              <p className="text-sm text-emerald-800">{uploadStatus.message}</p>
            </div>
          </div>

          {uploadStatus.summary && (
            <div className="mt-4 pt-3 border-t border-emerald-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Rincian Kategori PM:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(uploadStatus.summary.countsByCat).map(([cat, cnt]) => (
                    <span 
                      key={cat} 
                      className={`px-2.5 py-1 rounded-full font-semibold border ${
                        cat.includes('Mingguan') 
                          ? 'bg-amber-100 text-amber-800 border-amber-300' 
                          : cat.includes('(PS)') 
                            ? 'bg-rose-100 text-rose-800 border-rose-300' 
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                    >
                      {cat}: {cnt}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Rincian Jenis Peralatan:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(uploadStatus.summary.countsByJenis).map(([jns, cnt]) => (
                    <span key={jns} className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700">
                      {jns}: <strong>{cnt}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {uploadStatus.type === 'error' && (
        <div className="mt-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Upload Jadwal PM Gagal</p>
            <p className="text-sm">{uploadStatus.message}</p>
          </div>
        </div>
      )}

      {/* Histori Upload Jadwal PM */}
      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-emerald-600" /> Histori Upload Jadwal PM
          {isFetchingHistory && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
        </h3>

        {historyList.length === 0 && !isFetchingHistory ? (
          <p className="text-sm text-slate-500 italic">Belum ada histori upload jadwal PM.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {historyList.map(h => {
              const [y, m] = h.yearMonth.split('-').map(Number);
              const monthName = MONTH_NAMES_ID[m - 1] || h.yearMonth;
              return (
                <div key={h.yearMonth} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{monthName} {y}</p>
                    <p className="text-xs text-emerald-600 font-semibold">{h.count} entri jadwal PM</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteSchedule(h.yearMonth)}
                    disabled={isDeleting === h.yearMonth}
                    className="p-2 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50"
                    title="Hapus Jadwal PM Periode Ini"
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
