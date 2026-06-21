import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key dari Environment Variables Vite (.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Perhatian: Kredensial Supabase (VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY) belum diisi di file .env");
}

// Inisialisasi client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
