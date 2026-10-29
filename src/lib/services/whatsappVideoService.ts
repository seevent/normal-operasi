// src/lib/services/whatsappVideoService.ts
import { uploadVideoToCloudinary } from './cloudinaryService';
import type { DocumentationCategory } from '../utils/documentationPhoto';
import { createPrepCache } from '../utils/prepCache';
import { isVideo } from '../utils/shareBatches';
import { buildWhatsAppVideoUrl, whatsappVideoFileName } from '../utils/whatsappVideo';

/** Cloudinary menjawab 423 selama video masih dikonversi; tunggu sebentar lalu coba lagi. */
const CONVERT_RETRY_MS = 3000;
const CONVERT_MAX_ATTEMPTS = 40;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mengubah video menjadi MP4 H.264/AAC ≤1280px lewat Cloudinary agar bisa dikirim WhatsApp iOS.
 * Unggahan memakai berkas yang sama dengan simpan dokumentasi, jadi video tidak diunggah dua kali.
 */
const convertVideoForWhatsApp = async (file: File, category?: DocumentationCategory): Promise<File> => {
  const upload = await uploadVideoToCloudinary(file, { category });
  if (upload.status !== 'success' || !upload.url) throw new Error(upload.message || 'Upload video gagal');

  const url = buildWhatsAppVideoUrl(upload.url);
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      return new File([blob], whatsappVideoFileName(file.name), { type: 'video/mp4', lastModified: file.lastModified });
    }
    if (res.status !== 423 || attempt >= CONVERT_MAX_ATTEMPTS) {
      throw new Error(`Konversi video gagal (HTTP ${res.status})`);
    }
    await wait(CONVERT_RETRY_MS);
  }
};

const videoCache = createPrepCache(convertVideoForWhatsApp);

/** Hasil konversi per video; satu video hanya dikonversi sekali, di mana pun dipanggil. */
export const prepareVideoForWhatsApp = (file: File, category?: DocumentationCategory): Promise<File> =>
  videoCache.start(file, category);

/**
 * Memulai konversi di latar belakang begitu video dipilih, supaya saat Kirim ditekan video sudah
 * siap dan menu share WhatsApp langsung terbuka. Tanpa Web Share API tidak ada yang perlu dikonversi.
 */
export const prefetchVideosForWhatsApp = (files: File[], category?: DocumentationCategory): void => {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return;
  files.filter(isVideo).forEach((file) => {
    prepareVideoForWhatsApp(file, category).catch((err) => console.warn('Konversi video latar belakang gagal', err));
  });
};

/** MP4 hasil konversi bila sudah siap, selain itu undefined. */
export const getPreparedVideo = (file: File): File | undefined => videoCache.value(file);

export const getVideoPrepStatus = videoCache.status;
export const subscribeVideoPrep = videoCache.subscribe;
