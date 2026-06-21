import { supabase } from '../supabaseClient';

export interface ChecklistCategory {
  title: string;
  summaryKey: string;
  items: string[];
}

export interface ChecklistLocation {
  type: 'location' | 'group' | 'access_control';
  title: string;
  summary: string;
  categories?: ChecklistCategory[];
  locations?: { title: string; categories: ChecklistCategory[] }[];
  terminals?: any[];
}

export const fetchMasterChecklist = async () => {
  // Ambil semua data penempatan beserta relasinya
  const { data, error } = await supabase
    .from('penempatan_peralatan')
    .select(`
      id,
      is_active,
      tipe_peralatan ( nama, jenis_peralatan ( nama ) ),
      lokasi ( nama ),
      titik_lokasi ( nomor )
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching from Supabase:', error.message);
    throw error;
  }

  // Proses data relational menjadi format hierarchical UI
  // Catatan: Karena format UI saat ini sangat spesifik (grouping per lokasi, tipe alat A, B, C dll),
  // kita perlu memetakan raw data ini ke format DEFAULT_CHECKLIST_DATA.
  // Untuk saat ini, kita kembalikan raw data agar bisa diproses lebih lanjut oleh store, 
  // atau store tetap menggunakan default sementara jika data dari supabase kosong.
  
  return data;
};
