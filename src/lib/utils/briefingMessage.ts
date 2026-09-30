// src/lib/utils/briefingMessage.ts
// Pesan WhatsApp giat briefing (Unit / MOT).
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

import { formatTanggalIndo } from './dateFormat.ts';

export const generateWA_Briefing = (briefingData: any, selectedSpareparts: any[] = []) => {
  const formattedDate = formatTanggalIndo(briefingData.tanggal);
  const judul = briefingData.jenis === 'Unit' ? '*GIAT BRIEFING UNIT SSES T2*' : '*Briefing MOT T2*';
  let text = `${judul}\nHari/Tanggal : ${formattedDate}\nShift : ${briefingData.shift}\nLokasi : ${briefingData.lokasi}`;

  if (briefingData.jenis === 'Unit' && selectedSpareparts && selectedSpareparts.length > 0) {
    const sparepartsText = selectedSpareparts
      .map(sp => `- ${sp.name} : ${sp.current_stock ?? 0} ${sp.unit || 'PCS'}`)
      .join('\n');
    text += `\n\n${sparepartsText}`;
  }

  return text;
};
