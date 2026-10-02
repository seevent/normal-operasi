// src/lib/utils/briefingMessage.ts
// Pesan WhatsApp giat briefing (Unit / MOT).
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

import { formatTanggalIndo } from './dateFormat.ts';

export const generateWA_Briefing = (briefingData: any, selectedSpareparts: any[] = []) => {
  const formattedDate = formatTanggalIndo(briefingData.tanggal);
  const judul = briefingData.jenis === 'Unit' ? '*GIAT BRIEFING UNIT SSES T2*' : '*BRIEFING MOT T2*';
  const detail = [
    `Hari/Tanggal : ${formattedDate}`,
    `Shift : ${briefingData.shift}`,
    `Lokasi : ${briefingData.lokasi}`
  ].join('\n');
  let text = `${judul}\n\n${detail}`;

  if (briefingData.jenis === 'Unit' && selectedSpareparts && selectedSpareparts.length > 0) {
    const sparepartsText = selectedSpareparts
      .map(sp => `- ${sp.name} : ${sp.current_stock ?? 0} ${sp.unit || 'PCS'}`)
      .join('\n');
    text += `\n\n${sparepartsText}`;
  }

  return text;
};
