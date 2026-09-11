// src/lib/services/operationalReportService.ts

import { supabase } from '../supabaseClient';

export interface OperationalLog {
  id?: string;
  tanggal: string; // YYYY-MM-DD
  shift: 'PS' | 'M' | string;
  jenis: 'Perbaikan' | 'Storing' | 'Kegiatan' | 'Kalibrasi' | string;
  waktu?: string;
  lokasi: string;
  peralatan: string;
  kategori_maintenance?: 'CORRECTIVE' | 'PREVENTIVE' | 'LAIN - LAIN' | 'STORING' | 'KEGIATAN' | string;
  uraian: string;
  tindak_lanjut?: string;
  status?: string;
  teknisi?: string;
  foto_urls?: string[];
  created_at?: string;
}

export interface ChecklistSummaryItem {
  no: number;
  nama: string;
  total: number;
  operasi: number;
  rusak: number;
  persenOperasi: number;
  persenRusak: number;
}

/**
 * Menyimpan catatan kegiatan harian dari tab manapun ke Supabase
 */
export const saveOperationalLog = async (log: OperationalLog) => {
  try {
    const payload = {
      tanggal: log.tanggal,
      shift: log.shift,
      jenis: log.jenis,
      waktu: log.waktu || '-',
      lokasi: log.lokasi || '-',
      peralatan: log.peralatan || '-',
      kategori_maintenance: log.kategori_maintenance || 'CORRECTIVE',
      uraian: log.uraian || '-',
      tindak_lanjut: log.tindak_lanjut || '-',
      status: log.status || 'Normal Operasi',
      teknisi: log.teknisi || '-',
      foto_urls: log.foto_urls || []
    };

    const { data, error } = await supabase
      .from('laporan_operasional')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error saveOperationalLog Supabase:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Catch saveOperationalLog:', err);
    return { success: false, error: err };
  }
};

/**
 * Format objek Date menjadi string YYYY-MM-DD lokal
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Menentukan tanggal & dinas default pada Tab Report:
 * - Setiap jam 10:00 WIB berubah dari tanggal hari sebelumnya menjadi hari ini, dan dinas M hari sebelumnya menjadi PS hari ini.
 * - Setiap jam 22:00 WIB berubah hanya merubah dinas PS hari ini menjadi dinas M hari ini.
 * Rentang waktu:
 * - 00:00 - 09:59 WIB: Tanggal hari sebelumnya, Dinas M
 * - 10:00 - 21:59 WIB: Tanggal hari ini, Dinas PS
 * - 22:00 - 23:59 WIB: Tanggal hari ini, Dinas M
 */
export const getReportDefaultDateAndShift = (d: Date = new Date()): { date: string; shift: 'PS' | 'M' } => {
  const h = d.getHours();
  if (h < 10) {
    const yesterday = new Date(d);
    yesterday.setDate(yesterday.getDate() - 1);
    return { date: getLocalDateString(yesterday), shift: 'M' };
  } else if (h < 22) {
    return { date: getLocalDateString(d), shift: 'PS' };
  } else {
    return { date: getLocalDateString(d), shift: 'M' };
  }
};

/**
 * Menentukan tanggal operasional & dinas saat data diinput:
 * Batas data:
 * - Shift M hari sebelumnya: batasnya setiap jam 8 pagi (00:00 - 07:59 -> Shift M hari sebelumnya)
 * - Shift PS hari ini: batasnya jam 20:00 (08:00 - 19:59 -> Shift PS hari ini)
 * - Shift M hari ini: 20:00 - 23:59 -> Shift M hari ini
 */
export const getOperationalShiftAndDate = (d: Date = new Date()): { date: string; shift: 'PS' | 'M' } => {
  const h = d.getHours();
  if (h < 8) {
    const yesterday = new Date(d);
    yesterday.setDate(yesterday.getDate() - 1);
    return { date: getLocalDateString(yesterday), shift: 'M' };
  } else if (h < 20) {
    return { date: getLocalDateString(d), shift: 'PS' };
  } else {
    return { date: getLocalDateString(d), shift: 'M' };
  }
};

/**
 * Validasi batas waktu kegiatan terhadap shift:
 * - Shift M: batas setiap jam 8 pagi (waktu 20:00 - 23:59 dan 00:00 - 08:00)
 * - Shift PS: batas setiap jam 20:00 (waktu 08:00 - 20:00)
 */
export const isTimeWithinShiftBoundary = (timeStr: string, shift: 'PS' | 'M' | string): boolean => {
  if (!timeStr || timeStr === '-' || shift === 'ALL') return true;
  const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return true;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const totalMinutes = hour * 60 + minute;

  if (shift === 'PS') {
    // Batas data Shift PS: dari pukul 08:00 (480 menit) s.d. pukul 20:00 (1200 menit)
    return totalMinutes >= 480 && totalMinutes <= 1200;
  } else if (shift === 'M') {
    // Batas data Shift M: dari pukul 20:00 (1200 menit) s.d. pukul 08:00 (480 menit) pagi
    return totalMinutes >= 1200 || totalMinutes <= 480;
  }
  return true;
};

/**
 * Mengambil semua log kegiatan operasional untuk tanggal & shift tertentu (untuk Tab Shift Report)
 */
export const fetchShiftOperationalLogs = async (tanggal: string, shift: string): Promise<OperationalLog[]> => {
  try {
    let query = supabase
      .from('laporan_operasional')
      .select('*');

    if (shift === 'ALL') {
      query = query.eq('tanggal', tanggal);
    } else if (shift === 'M') {
      // Ambil data tanggal D shift M dan toleransi dini hari D+1 shift M
      const d = new Date(tanggal);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const nextDateStr = getLocalDateString(nextD);
      query = query.or(`and(tanggal.eq.${tanggal},shift.eq.M),and(tanggal.eq.${nextDateStr},shift.eq.M)`);
    } else {
      query = query.eq('tanggal', tanggal).eq('shift', shift);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetchShiftOperationalLogs:', error);
      return [];
    }

    const logs = (data as OperationalLog[]) || [];
    return logs.filter(item => isTimeWithinShiftBoundary(item.waktu || '', shift));
  } catch (err) {
    console.error('Catch fetchShiftOperationalLogs:', err);
    return [];
  }
};

/**
 * Mengambil jumlah entri laporan untuk masing-masing shift pada tanggal tertentu
 */
export const fetchDailyShiftCounts = async (tanggal: string): Promise<{ ps: number; m: number; total: number }> => {
  try {
    const [psLogs, mLogs] = await Promise.all([
      fetchShiftOperationalLogs(tanggal, 'PS'),
      fetchShiftOperationalLogs(tanggal, 'M')
    ]);

    return {
      ps: psLogs.length,
      m: mLogs.length,
      total: psLogs.length + mLogs.length
    };
  } catch {
    return { ps: 0, m: 0, total: 0 };
  }
};

/**
 * Menghitung ringkasan kelaikan peralatan dari master checklist & toggles status aktif
 */
export const calculateChecklistSummary = (
  checklistDataMaster: any[],
  toggles: Record<string, boolean>
): ChecklistSummaryItem[] => {
  const counts: Record<string, { total: number; operasi: number; rusak: number }> = {
    'XRAY': { total: 0, operasi: 0, rusak: 0 },
    'WTMD': { total: 0, operasi: 0, rusak: 0 },
    'HHMD': { total: 0, operasi: 0, rusak: 0 },
    'BODY SCANNER': { total: 0, operasi: 0, rusak: 0 },
    'ETD': { total: 0, operasi: 0, rusak: 0 },
    'ACCESS CONTROL': { total: 0, operasi: 0, rusak: 0 },
    'CCTV': { total: 0, operasi: 0, rusak: 0 }
  };

  checklistDataMaster.forEach((block: any) => {
    if (block.type === 'location') {
      block.categories?.forEach((cat: any) => {
        let key = (cat.summaryKey || '').toUpperCase().trim();
        if (key === 'X-RAY') key = 'XRAY';
        if (key === 'EXPLOSIVE DETECTOR') key = 'ETD';
        if (!counts[key]) counts[key] = { total: 0, operasi: 0, rusak: 0 };

        cat.items?.forEach((_: any, iIdx: number) => {
          counts[key].total++;
          const tKey = `${block.title}|${cat.title}|${iIdx}`;
          if (toggles[tKey] !== false) {
            counts[key].operasi++;
          } else {
            counts[key].rusak++;
          }
        });
      });
    } else if (block.type === 'access_control') {
      block.terminals?.forEach((term: any) => {
        term.categories?.forEach((cat: any) => {
          cat.items?.forEach((_: any, iIdx: number) => {
            counts['ACCESS CONTROL'].total++;
            const tKey = `${block.title}|${term.title}|${cat.title}|${iIdx}`;
            if (toggles[tKey] !== false) {
              counts['ACCESS CONTROL'].operasi++;
            } else {
              counts['ACCESS CONTROL'].rusak++;
            }
          });
        });
      });
    }
  });

  // Default CCTV 48 jika belum ada form khusus checklist CCTV
  if (counts['CCTV'].total === 0) {
    counts['CCTV'] = { total: 48, operasi: 48, rusak: 0 };
  }

  const items = [
    { name: 'XRAY', key: 'XRAY' },
    { name: 'WTMD', key: 'WTMD' },
    { name: 'HHMD', key: 'HHMD' },
    { name: 'BODY SCANNER', key: 'BODY SCANNER' },
    { name: 'ETD', key: 'ETD' },
    { name: 'ACCESS CONTROL', key: 'ACCESS CONTROL' },
    { name: 'CCTV', key: 'CCTV' },
  ];

  return items.map((item, idx) => {
    const c = counts[item.key] || { total: 0, operasi: 0, rusak: 0 };
    const total = c.total || 0;
    const operasi = c.operasi || 0;
    const rusak = c.rusak || 0;
    const persenOperasi = total > 0 ? parseFloat((operasi / total).toFixed(2)) : 1;
    const persenRusak = total > 0 ? parseFloat((rusak / total).toFixed(2)) : 0;
    return {
      no: idx + 1,
      nama: item.name,
      total,
      operasi,
      rusak,
      persenOperasi,
      persenRusak
    };
  });
};

/**
 * Menyimpan ringkasan kesiapan peralatan (serviceability) per shift
 */
export const saveChecklistSummary = async (tanggal: string, shift: string, summary: ChecklistSummaryItem[]) => {
  try {
    const targetShift = shift === 'ALL' ? 'PS' : shift;
    const { data: existing } = await supabase
      .from('laporan_checklist')
      .select('id')
      .eq('tanggal', tanggal)
      .eq('shift', targetShift)
      .maybeSingle();

    if (existing && existing.id) {
      const { error } = await supabase
        .from('laporan_checklist')
        .update({ summary, created_at: new Date().toISOString() })
        .eq('id', existing.id);
      return { success: !error, error };
    } else {
      const { error } = await supabase
        .from('laporan_checklist')
        .insert([{ tanggal, shift: targetShift, summary, created_at: new Date().toISOString() }]);
      return { success: !error, error };
    }
  } catch (err) {
    console.error('Catch saveChecklistSummary:', err);
    return { success: false, error: err };
  }
};

/**
 * Mengambil ringkasan kesiapan peralatan untuk shift report.
 * Prioritas:
 * 1. Data pada tanggal & shift spesifik
 * 2. Data terakhir yang pernah tersimpan di database (agar selalu menampilkan data terkini saat tab dibuka)
 */
export const fetchChecklistSummary = async (tanggal?: string, shift?: string): Promise<ChecklistSummaryItem[] | null> => {
  try {
    const targetShift = shift === 'ALL' ? 'PS' : shift;
    
    // 1. Coba ambil data untuk tanggal & shift yang diminta
    if (tanggal && targetShift && targetShift !== 'ALL') {
      const { data, error } = await supabase
        .from('laporan_checklist')
        .select('summary')
        .eq('tanggal', tanggal)
        .eq('shift', targetShift)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && data.summary && Array.isArray(data.summary) && data.summary.length > 0) {
        return data.summary as ChecklistSummaryItem[];
      }
    }

    // Jika shift ALL tapi ada tanggal, coba ambil data tanggal tersebut
    if (tanggal) {
      const { data, error } = await supabase
        .from('laporan_checklist')
        .select('summary')
        .eq('tanggal', tanggal)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && data.summary && Array.isArray(data.summary) && data.summary.length > 0) {
        return data.summary as ChecklistSummaryItem[];
      }
    }

    // 2. Jika tidak ada untuk shift/tanggal tersebut, ambil data TERAKHIR yang pernah disimpan di database
    const { data: latest, error: latestErr } = await supabase
      .from('laporan_checklist')
      .select('summary')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestErr && latest && latest.summary && Array.isArray(latest.summary) && latest.summary.length > 0) {
      return latest.summary as ChecklistSummaryItem[];
    }

    return null;
  } catch (err) {
    console.error('Catch fetchChecklistSummary:', err);
    return null;
  }
};
