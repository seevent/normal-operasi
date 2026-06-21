import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: d1 } = await supabase.from('lokasi').select('*').limit(1);
  console.log('Lokasi:', Object.keys(d1[0] || {}));
  
  const { data: d2 } = await supabase.from('jenis_peralatan').select('*').limit(1);
  console.log('Jenis:', Object.keys(d2[0] || {}));
  
  const { data: d3 } = await supabase.from('tipe_peralatan').select('*').limit(1);
  console.log('Tipe:', Object.keys(d3[0] || {}));
  
  const { data: d4 } = await supabase.from('penempatan_peralatan').select('*').limit(1);
  console.log('Penempatan:', Object.keys(d4[0] || {}));
}
check();
