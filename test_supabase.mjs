import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('jadwal_shift')
    .select(`
      id, shift, status_kehadiran,
      personel:personel_id (id, nama, no_hp, unit_kerja(nama))
    `)
    .limit(1);

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('DATA:', JSON.stringify(data, null, 2));
  }
}

test();
