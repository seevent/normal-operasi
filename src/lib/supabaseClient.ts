import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key dari Environment Variables Vite (.env)
type EnvRecord = Record<string, string | undefined>;
const env: EnvRecord = (typeof import.meta !== 'undefined' && import.meta.env)
  ? (import.meta.env as unknown as EnvRecord)
  : (typeof process !== 'undefined' ? (process.env as EnvRecord) : {});
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
  console.warn("⚠️ Perhatian: Kredensial Supabase (VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY) belum diisi di file .env");
}

// Inisialisasi client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
