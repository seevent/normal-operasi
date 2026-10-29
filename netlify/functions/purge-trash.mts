// netlify/functions/purge-trash.mts
// Fungsi terjadwal Netlify: setiap hari pukul 03.17 WIB (20.17 UTC) mengosongkan Sampah laporan yang sudah
// 7 hari: baris laporan dihapus permanen, foto/video yang tidak dipakai laporan lain dihapus dari
// Cloudinary dan Supabase Storage. Logika ada di src/lib/server/storagePurge.server.ts.

import { purgeDueTrash } from '../../src/lib/server/storagePurge.server.ts';

export default async () => {
  const summaries = await purgeDueTrash({
    env: process.env as Record<string, string | undefined>,
    fetch: globalThis.fetch,
    now: () => new Date(),
  });
  console.log('Pengosongan Sampah laporan:', JSON.stringify(summaries));
  return new Response(JSON.stringify(summaries), { headers: { 'content-type': 'application/json' } });
};

export const config = {
  schedule: '17 20 * * *',
};
