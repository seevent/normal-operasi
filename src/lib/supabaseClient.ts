import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key dari Environment Variables Vite (.env)
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = (env as any).VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = (env as any).VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!(env as any).VITE_SUPABASE_URL || !(env as any).VITE_SUPABASE_ANON_KEY) {
  console.warn("⚠️ Perhatian: Kredensial Supabase (VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY) belum diisi di file .env");
}

// Inisialisasi client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
