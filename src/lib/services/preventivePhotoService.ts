// src/lib/services/preventivePhotoService.ts
// Alur unggah foto Preventive di browser. TANPA fallback: gagal di langkah mana pun -> galat dengan
// nama langkahnya; UI menampilkan "gagal" dan tombol Retry (memanggil fungsi yang sama lagi).
//
//   compress -> ticket (server tanda tangan) -> upload (browser -> Cloudinary langsung) -> confirm (server verifikasi + catat log)
// "Tersimpan" hanya bila confirm berhasil.

import type { ConfirmResult, UploadTicket } from '../data/preventiveTypes.ts';

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

const messageOf = (e: unknown, fallback: string): string => (e instanceof Error && e.message ? e.message : fallback);

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
};

/** Dependensi bawaan (dimuat saat dipakai agar modul ini tetap bisa diuji di Node tanpa React/TanStack). */
export const defaultUploadDeps = (): UploadDeps => ({
  compress: async (file) => {
    const { compressImage } = await import('./cloudinaryService.ts');
    const { base64, mimeType } = await compressImage(file);
    if (!base64) throw new Error('Foto tidak dapat diproses.');
    return base64ToBlob(base64, mimeType);
  },
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
  if (!file.type.startsWith('image/')) {
    throw new PreventiveUploadError('compress', 'Berkas yang dipilih bukan gambar.');
  }

  let blob: Blob;
  try {
    blob = await deps.compress(file);
  } catch (e) {
    throw new PreventiveUploadError('compress', messageOf(e, 'Foto tidak dapat diproses.'));
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
  try {
    const res = await deps.fetch(ticket.uploadUrl, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
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
  }

  try {
    return await deps.confirm({ period, equipmentNumber, version });
  } catch (e) {
    throw new PreventiveUploadError('confirm', messageOf(e, 'Foto terunggah tetapi gagal dicatat. Coba lagi.'));
  }
}
