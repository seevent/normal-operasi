// src/lib/utils/kegiatanMessage.ts
// Pesan WhatsApp laporan Kegiatan.
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

import { formatTanggalIndo } from './dateFormat.ts';
import { normalizeLokasi } from './lokasiFormat.ts';
import type { KegiatanFormData } from '../types.ts';

export const generateWA_Kegiatan = (kegiatanData: KegiatanFormData) => {
  const formattedDate = formatTanggalIndo(kegiatanData.tanggal);
  const waktuText = kegiatanData.waktuSelesai
    ? `${kegiatanData.waktuMulai} - ${kegiatanData.waktuSelesai}`
    : kegiatanData.waktuMulai;
  // Peralatan bersifat opsional: baris hanya dicantumkan bila diisi.
  const peralatan = String(kegiatanData.peralatan ?? '').trim();
  const peralatanLine = peralatan ? `Peralatan : ${peralatan}\n` : '';

  return `*KEGIATAN SSES T2*\nHari/Tanggal/Jam : ${formattedDate}, ${waktuText}\n${peralatanLine}Lokasi : ${normalizeLokasi(kegiatanData.lokasi)}\nKegiatan : ${kegiatanData.kegiatan}`;
};
