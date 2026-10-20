// src/lib/services/preventivePhotoService.ts
// Alur unggah foto Preventive di browser. TANPA fallback: gagal di langkah mana pun -> galat dengan
// nama langkahnya; UI menampilkan "gagal" dan tombol Retry (memanggil fungsi yang sama lagi).
//
//   compress -> ticket (server tanda tangan) -> upload (browser -> Cloudinary langsung) -> confirm (server verifikasi + catat log)
// "Tersimpan" hanya bila confirm berhasil.

import { MAX_PHOTO_EDGE, PHOTO_JPEG_QUALITY } from '../data/preventiveTypes.ts';
import type { ConfirmResult, UploadTicket } from '../data/preventiveTypes.ts';
import { fitWithin, isAcceptableImage, isHeicLike } from '../utils/preventiveImage.ts';

export type UploadStep = 'compress' | 'ticket' | 'upload' | 'confirm';

export class PreventiveUploadError extends Error {
  readonly step: UploadStep;
  constructor(step: UploadStep, message: string) {
    super(message);
    this.name = 'PreventiveUploadError';
    this.step = step;
  }
}

export interface UploadDeps {
  compress: (file: Blob) => Promise<Blob>;
  getTicket: (input: { period: string; equipmentNumber: string }) => Promise<UploadTicket>;
  confirm: (input: { period: string; equipmentNumber: string; version: number }) => Promise<ConfirmResult>;
  fetch: typeof fetch;
}

const UPLOAD_TIMEOUT_MS = 60_000;

/** AbortSignal.timeout tidak ada di Safari iOS < 16; pakai AbortController. */
const timeoutSignal = (ms: number): { signal: AbortSignal; clear: () => void } => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new DOMException('Waktu habis', 'TimeoutError')), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
};

const messageOf = (e: unknown, fallback: string): string => (e instanceof Error && e.message ? e.message : fallback);

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

/** Dekode lewat <img> (paling luas didukung, menghormati orientasi EXIF); bila gagal coba createImageBitmap. */
const decodeImage = async (file: Blob): Promise<Decoded> => {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('decode'));
      img.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    if (typeof createImageBitmap === 'function') {
      const bmp = await createImageBitmap(file);
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() };
    }
    throw new Error('decode');
  }
};

/**
 * Kompresi WAJIB dan ketat: gambar didekode, diperkecil (sisi terpanjang 1280 px) lalu di-encode ulang ke JPEG.
 * Bila salah satu langkah gagal, galat dilempar. Tidak pernah mengembalikan berkas asli
 * (berbeda dengan compressImage umum yang diam-diam jatuh ke berkas asli).
 */
export const compressPhotoStrict = async (file: Blob & { name?: string }): Promise<Blob> => {
  let decoded: Decoded;
  try {
    decoded = await decodeImage(file);
  } catch {
    throw new Error(
      isHeicLike({ type: file.type, name: file.name ?? '' })
        ? 'Foto HEIC tidak bisa dibaca di perangkat ini. Di iPhone: Pengaturan > Kamera > Format > Paling Kompatibel, lalu ambil foto lagi.'
        : 'Foto tidak bisa dibaca. Ambil ulang foto dengan kamera.',
    );
  }
  const canvas = document.createElement('canvas');
  try {
    const { width, height } = fitWithin(decoded.width, decoded.height, MAX_PHOTO_EDGE);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Foto tidak dapat dikompres di perangkat ini.');
    ctx.drawImage(decoded.source, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_JPEG_QUALITY));
    if (!blob || blob.size === 0) throw new Error('Foto gagal dikompres.');
    return blob;
  } finally {
    // Safari iOS membatasi total memori canvas; tanpa dilepas, puluhan foto berturut-turut mulai gagal.
    canvas.width = 0;
    canvas.height = 0;
    decoded.release();
  }
};

/** Dependensi bawaan (dimuat saat dipakai agar modul ini tetap bisa diuji di Node tanpa React/TanStack). */
export const defaultUploadDeps = (): UploadDeps => ({
  compress: compressPhotoStrict,
  getTicket: async (input) => {
    const { getPreventiveUploadTicket } = await import('../server/preventive.functions.ts');
    return getPreventiveUploadTicket({ data: input });
  },
  confirm: async (input) => {
    const { confirmPreventiveUpload } = await import('../server/preventive.functions.ts');
    return confirmPreventiveUpload({ data: input });
  },
  fetch: (...args) => globalThis.fetch(...args),
});

export async function uploadPreventivePhoto(
  period: string,
  equipmentNumber: string,
  file: Blob,
  deps: UploadDeps = defaultUploadDeps(),
): Promise<ConfirmResult> {
  if (!isAcceptableImage({ type: file.type, name: (file as File).name ?? '' })) {
    throw new PreventiveUploadError('compress', 'Berkas yang dipilih bukan gambar.');
  }

  let blob: Blob;
  try {
    blob = await deps.compress(file);
  } catch (e) {
    throw new PreventiveUploadError('compress', messageOf(e, 'Foto tidak dapat dikompres.'));
  }
  // Pagar kedua: yang boleh dikirim hanya JPEG hasil kompresi yang tidak kosong.
  if (blob.size === 0 || blob.type !== 'image/jpeg') {
    throw new PreventiveUploadError('compress', 'Foto gagal dikompres. Coba ambil ulang.');
  }

  let ticket: UploadTicket;
  try {
    ticket = await deps.getTicket({ period, equipmentNumber });
  } catch (e) {
    throw new PreventiveUploadError('ticket', messageOf(e, 'Tidak dapat menyiapkan unggahan. Coba lagi.'));
  }

  const form = new FormData();
  form.append('file', blob, `${ticket.publicId.split('/').pop()}.jpg`);
  form.append('api_key', ticket.apiKey);
  form.append('timestamp', String(ticket.timestamp));
  form.append('signature', ticket.signature);
  form.append('public_id', ticket.publicId);
  form.append('asset_folder', ticket.assetFolder);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');

  let version: number;
  const timer = timeoutSignal(UPLOAD_TIMEOUT_MS);
  try {
    const res = await deps.fetch(ticket.uploadUrl, {
      method: 'POST',
      body: form,
      signal: timer.signal,
    });
    const body = (await res.json().catch(() => ({}))) as { version?: unknown; error?: { message?: string } };
    if (!res.ok) {
      throw new Error(body.error?.message || `Cloudinary menolak unggahan (HTTP ${res.status}).`);
    }
    if (typeof body.version !== 'number' || !Number.isSafeInteger(body.version) || body.version <= 0) {
      throw new Error('Balasan Cloudinary tidak lengkap.');
    }
    version = body.version;
  } catch (e) {
    const timedOut = e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError');
    const message = timedOut
      ? 'Waktu unggah habis. Periksa sinyal lalu coba lagi.'
      : e instanceof TypeError
        ? 'Koneksi terputus saat mengunggah. Periksa sinyal lalu coba lagi.'
        : messageOf(e, 'Unggahan ke Cloudinary gagal.');
    throw new PreventiveUploadError('upload', message);
  } finally {
    timer.clear();
  }

  try {
    return await deps.confirm({ period, equipmentNumber, version });
  } catch (e) {
    throw new PreventiveUploadError('confirm', messageOf(e, 'Foto terunggah tetapi gagal dicatat. Coba lagi.'));
  }
}
