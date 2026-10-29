// src/lib/utils/whatsappVideo.ts
// Fungsi murni untuk menyiapkan video agar diterima WhatsApp iOS. Tanpa jaringan/DOM, jadi mudah diuji di Node.

/**
 * Transformasi Cloudinary ke format yang selalu diterima WhatsApp: MP4 H.264 Main + AAC,
 * sisi terpanjang paling besar 1280px. Rekaman asli iPhone (HEVC/MOV, ukuran besar) ditolak
 * ekstensi share WhatsApp iOS dengan pesan "Tidak dapat mengirim pesan".
 */
export const WHATSAPP_VIDEO_TRANSFORM = 'c_limit,w_1280,h_1280/vc_h264:main:3.1,ac_aac,q_auto';

/** Ukuran potongan unggah video ke Cloudinary; tiap potongan selain yang terakhir wajib minimal 5 MB. */
export const VIDEO_UPLOAD_CHUNK_BYTES = 20 * 1024 * 1024;

/** URL salinan MP4 ramah WhatsApp dari secure_url hasil unggah video Cloudinary. */
export const buildWhatsAppVideoUrl = (secureUrl: string): string => {
  const marker = '/video/upload/';
  if (!secureUrl.includes(marker)) throw new Error(`bukan URL video Cloudinary: ${secureUrl}`);
  return secureUrl.replace(marker, `${marker}${WHATSAPP_VIDEO_TRANSFORM}/`).replace(/\.[^./]+$/, '.mp4');
};

/** Nama berkas MP4 untuk video hasil konversi, mengikuti nama asli. */
export const whatsappVideoFileName = (originalName: string): string =>
  `${originalName.replace(/\.[^./]+$/, '') || 'video'}.mp4`;

/** Rentang byte [awal, akhir) tiap potongan unggah. */
export const uploadChunkRanges = (size: number, chunkBytes = VIDEO_UPLOAD_CHUNK_BYTES): [number, number][] => {
  const ranges: [number, number][] = [];
  for (let start = 0; start < size; start += chunkBytes) ranges.push([start, Math.min(start + chunkBytes, size)]);
  return ranges;
};
