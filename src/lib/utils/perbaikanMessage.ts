// src/lib/utils/perbaikanMessage.ts
// Pesan WhatsApp laporan Corrective Maintenance (perbaikan) dan verifikasi ETD.
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

import { formatLokasiRows } from './lokasiFormat.ts';

export const generateWA_Perbaikan = (formData: any, isVerifikasiETD: boolean) => {
  if (!formData.peralatan) return "Silakan pilih peralatan terlebih dahulu untuk melihat preview laporan...";
  const dateParts = formData.tanggal ? formData.tanggal.split('-') : ['','',''];
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '';
  const locList = formData.lokasiList && Array.isArray(formData.lokasiList) && formData.lokasiList.length > 0
    ? formData.lokasiList.filter((l: any) => l.lokasi1)
    : [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];

  const lokasiFinal = formatLokasiRows(locList);
  const judulLaporan = isVerifikasiETD ? '*LAPORAN VERIFIKASI*' : '*LAPORAN CORRECTIVE MAINTENANCE*';

  const statusIcon = (formData.status === 'Pekerjaan Selesai' || formData.status === 'Normal Operasi') ? '✅' : '⚠️';

  const header = [
    `Peralatan : ${formData.peralatan}`,
    `Lokasi : ${lokasiFinal}`,
    `Sumber laporan : ${formData.sumberLaporan}`,
    ...(isVerifikasiETD ? [] : [`Indikasi awal : ${formData.indikasiAwal}`])
  ].join('\n');

  return `${judulLaporan}

${header}

🗓️ Tanggal :  ${formattedDate}
🕝 Pukul : ${formData.waktuMulai} - ${formData.waktuSelesai}
⏰ Lama waktu Pengerjaan : ${formData.lamaPengerjaan}
👨🏻‍🔧 Teknisi : ${formData.teknisi}

🪛 Permasalahan :
${formData.permasalahan}
🪛 Tindak lanjut  : 
${formData.tindakLanjut}

${statusIcon} Status : ${formData.status}

Demikian laporan tindak lanjut kami sampaikan.
Terimakasih atas perhatiannya.`;
};
