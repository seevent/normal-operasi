import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { Calendar, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Trash2, Clock } from 'lucide-react';

export const ScheduleUploader: React.FC = () => {
  const store = useMasterDataStore();
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  const [historyList, setHistoryList] = useState<{yearMonth: string, count: number}[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const { data, error } = await supabase.from('jadwal_shift').select('tanggal');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(row => {
        const yyyyMm = row.tanggal.substring(0, 7);
        counts[yyyyMm] = (counts[yyyyMm] || 0) + 1;
      });

      const list = Object.keys(counts)
        .sort((a, b) => b.localeCompare(a))
        .slice(0, 12)
        .map(ym => ({ yearMonth: ym, count: counts[ym] }));
        
      setHistoryList(list);
    } catch (err) {
      console.error('Error fetching history:', err);
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
    setUploadStatus({type: null, message: ''});

    const yearStr = selectedTahun;
    const monthStr = String(selectedBulan).padStart(2, '0');
    const targetYm = `${yearStr}-${monthStr}`;

    if (historyList.some(h => h.yearMonth === targetYm)) {
      setUploadStatus({type: 'error', message: `Jadwal untuk periode ${monthStr}-${yearStr} sudah ada. Harap hapus jadwal tersebut di histori sebelum melakukan upload ulang.`});
      setIsUploading(false);
      e.target.value = '';
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      const allPersonel = [...store.dataApiT2, ...store.dataOmIasT2];
      const nikToIdMap = new Map(allPersonel.map(p => [String(p.nik).trim(), p.id]));

      let headerRowIndex = -1;
      let codeColIndex = -1;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '').trim().toUpperCase();
          if (cell === 'CODE' || cell === 'NIK') {
            headerRowIndex = i;
            codeColIndex = j;
            break;
          }
        }
        if (headerRowIndex !== -1) break;
      }

      if (headerRowIndex === -1 || codeColIndex === -1) {
        throw new Error('Gagal menemukan kolom "CODE" pada Excel. Pastikan format tabel sesuai.');
      }

      const headerRow = jsonData[headerRowIndex];
      const dateColumns: { colIndex: number, dateNum: number }[] = [];
      for (let j = 0; j < headerRow.length; j++) {
        const cellValue = Number(headerRow[j]);
        if (!isNaN(cellValue) && cellValue >= 1 && cellValue <= 31) {
          dateColumns.push({ colIndex: j, dateNum: cellValue });
        }
      }

      if (dateColumns.length === 0) {
        throw new Error('Gagal menemukan kolom tanggal (1-31) pada baris Header.');
      }

      const shiftsToInsert = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        
        const rawNik = String(row[codeColIndex] || '').trim();
        if (!rawNik) continue;

        const personelId = nikToIdMap.get(rawNik);
        if (!personelId) continue;

        for (const dateCol of dateColumns) {
          const shiftCode = String(row[dateCol.colIndex] || '').trim().toUpperCase();
          if (!shiftCode || shiftCode === '' || shiftCode === '-' || shiftCode.toLowerCase() === 'off') {
            continue; 
          }

          const yearStr = selectedTahun;
          const monthStr = String(selectedBulan).padStart(2, '0');
          const dayStr = String(dateCol.dateNum).padStart(2, '0');
          const dateString = `${yearStr}-${monthStr}-${dayStr}`;

          shiftsToInsert.push({
            personel_id: personelId,
            tanggal: dateString,
            shift: shiftCode,
            status_kehadiran: 'Hadir'
          });
        }
      }

      if (shiftsToInsert.length === 0) {
        throw new Error('Tidak ada data shift valid yang ditemukan untuk dimasukkan.');
      }

      const { error } = await supabase
        .from('jadwal_shift')
        .upsert(shiftsToInsert, { onConflict: 'personel_id, tanggal' });

      if (error) throw new Error('Gagal menyimpan ke database: ' + error.message);

      setUploadStatus({type: 'success', message: `Berhasil mengunggah jadwal untuk ${shiftsToInsert.length} shift.`});
      await fetchHistory();
      
    } catch (err: any) {
      setUploadStatus({type: 'error', message: err.message || 'Terjadi kesalahan saat memproses Excel.'});
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteSchedule = async (yearMonth: string) => {
    if (!window.confirm(`Anda yakin ingin menghapus seluruh jadwal untuk periode ${yearMonth}?`)) {
      return;
    }
    
    setIsDeleting(yearMonth);
    try {
      const startDate = `${yearMonth}-01`;
      
      // Hitung awal bulan berikutnya
      const [year, month] = yearMonth.split('-').map(Number);
      const nextMonthDate = new Date(year, month, 1); // month is 0-indexed in JS but our array has 1-based, so month is actually the next month!
      const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

      const { error } = await supabase
        .from('jadwal_shift')
        .delete()
        .gte('tanggal', startDate)
        .lt('tanggal', nextMonthStr);

      if (error) throw error;
      
      await fetchHistory();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      alert('Gagal menghapus jadwal dari database.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Upload Jadwal Teknisi</h2>
          <p className="text-sm text-slate-500">Unggah file Excel (.xlsx) daftar jadwal bulanan.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Bulan</label>
          <select value={selectedBulan} onChange={e => setSelectedBulan(Number(e.target.value))} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
              <option key={i} value={i+1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Tahun</label>
          <input type="number" value={selectedTahun} onChange={e => setSelectedTahun(Number(e.target.value))} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="relative border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer text-center p-8">
        <input 
          type="file" 
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-blue-600">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-bold">Memproses File Excel...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-blue-600">
            <FileSpreadsheet className="w-10 h-10" />
            <p className="font-bold">Pilih File Excel Jadwal</p>
            <p className="text-xs text-blue-500">Hanya .xlsx atau .xls (Format Harus Terdapat Kolom 'CODE' dan Angka 1-31)</p>
          </div>
        )}
      </div>

      {uploadStatus.type === 'success' && (
        <div className="mt-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Upload Berhasil!</p>
            <p className="text-sm">{uploadStatus.message}</p>
          </div>
        </div>
      )}

      {uploadStatus.type === 'error' && (
        <div className="mt-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Upload Gagal</p>
            <p className="text-sm">{uploadStatus.message}</p>
          </div>
        </div>
      )}

      {/* Bagian Histori */}
      <div className="mt-8 border-t border-slate-200 pt-8">
        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" /> Histori Upload Jadwal
          {isFetchingHistory && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
        </h3>
        
        {historyList.length === 0 && !isFetchingHistory ? (
          <p className="text-sm text-slate-500 italic">Belum ada histori upload jadwal.</p>
        ) : (
          <div className="space-y-3">
            {historyList.map(h => (
              <div key={h.yearMonth} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-bold text-slate-700">{h.yearMonth}</p>
                  <p className="text-xs text-slate-500">{h.count} data shift</p>
                </div>
                <button 
                  onClick={() => handleDeleteSchedule(h.yearMonth)}
                  disabled={isDeleting === h.yearMonth}
                  className="p-2 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50"
                  title="Hapus Jadwal"
                >
                  {isDeleting === h.yearMonth ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
