import { supabase } from '../supabaseClient';
import { getErrorMessage } from '../utils/errorUtils';
import { sayPet } from '../../store/useAppStore';
import {
  DOCUMENTATION_ROOT_FOLDER,
  isDocumentationCategory,
  nextDocumentationPhotoTarget,
  type DocumentationCategory,
} from '../utils/documentationPhoto';
import { buildUncategorizedVideoPublicId, uploadChunkRanges } from '../utils/whatsappVideo';

export interface UploadResult {
  status: 'success' | 'error';
  url?: string;
  viewUrl?: string;
  fileId?: string;
  fileName?: string;
  message?: string;
}

export interface UploadPhotoOptions {
  /** Jenis dokumentasi: menentukan folder tujuan dan awalan nama file. */
  category?: DocumentationCategory;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

let cachedCloudinaryConfig: CloudinaryConfig | null = null;

/**
 * Mendapatkan konfigurasi Cloudinary dari Memori, LocalStorage, atau Environment variables
 */
export const getCloudinaryConfig = (): CloudinaryConfig => {
  if (cachedCloudinaryConfig?.cloudName && cachedCloudinaryConfig?.uploadPreset) {
    return cachedCloudinaryConfig;
  }

  let cloudName = '';
  let uploadPreset = '';

  if (typeof window !== 'undefined') {
    cloudName = localStorage.getItem('sses_cloudinary_cloud_name')?.trim() || '';
    uploadPreset = localStorage.getItem('sses_cloudinary_upload_preset')?.trim() || '';
  }

  if (!cloudName) {
    cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || '';
  }
  if (!uploadPreset) {
    uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() || '';
  }

  if (cloudName && uploadPreset) {
    cachedCloudinaryConfig = { cloudName, uploadPreset };
  }

  return { cloudName, uploadPreset };
};

/**
 * Mengambil konfigurasi Cloudinary dari Supabase master_configs (Global Single Source of Truth)
 * Dapat diakses oleh siapapun (login maupun guest/tamu).
 */
export const fetchCloudinaryConfig = async (): Promise<CloudinaryConfig> => {
  try {
    const { data, error } = await supabase
      .from('master_configs')
      .select('value')
      .eq('key', 'cloudinary_config')
      .maybeSingle();

    if (!error && data?.value?.cloudName && data?.value?.uploadPreset) {
      const cfg: CloudinaryConfig = {
        cloudName: String(data.value.cloudName).trim(),
        uploadPreset: String(data.value.uploadPreset).trim()
      };
      cachedCloudinaryConfig = cfg;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sses_cloudinary_cloud_name', cfg.cloudName);
        localStorage.setItem('sses_cloudinary_upload_preset', cfg.uploadPreset);
      }
      return cfg;
    }

    // Auto-migrate: Jika Supabase belum punya tapi lokal/env punya konfigurasi, simpan ke Supabase
    const localCfg = getCloudinaryConfig();
    if (localCfg.cloudName && localCfg.uploadPreset) {
      await setCloudinaryConfig(localCfg.cloudName, localCfg.uploadPreset, true);
      return localCfg;
    }
  } catch (err) {
    console.warn('Gagal memuat konfigurasi Cloudinary dari Supabase:', err);
  }

  return getCloudinaryConfig();
};

/**
 * Menyimpan konfigurasi Cloudinary ke LocalStorage dan Supabase master_configs
 */
export const setCloudinaryConfig = async (
  cloudName: string,
  uploadPreset: string,
  syncToSupabase = true
): Promise<void> => {
  const cleanCloud = cloudName.trim();
  const cleanPreset = uploadPreset.trim();

  cachedCloudinaryConfig = { cloudName: cleanCloud, uploadPreset: cleanPreset };

  if (typeof window !== 'undefined') {
    if (cleanCloud) {
      localStorage.setItem('sses_cloudinary_cloud_name', cleanCloud);
    } else {
      localStorage.removeItem('sses_cloudinary_cloud_name');
    }

    if (cleanPreset) {
      localStorage.setItem('sses_cloudinary_upload_preset', cleanPreset);
    } else {
      localStorage.removeItem('sses_cloudinary_upload_preset');
    }
  }

  if (syncToSupabase && (cleanCloud || cleanPreset)) {
    try {
      await supabase.from('master_configs').upsert({
        key: 'cloudinary_config',
        value: { cloudName: cleanCloud, uploadPreset: cleanPreset },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch (err) {
      console.warn('Gagal menyimpan konfigurasi Cloudinary ke Supabase:', err);
    }
  }
};

/**
 * Konversi File / Blob / string menjadi Base64 murni
 */
export async function toBase64Payload(input: File | Blob | string): Promise<{ base64: string; mimeType: string }> {
  if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      const parts = input.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      return { base64: parts[1], mimeType: mime };
    }
    return { base64: input, mimeType: 'image/jpeg' };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const parts = result.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || input.type || 'image/jpeg';
      resolve({ base64: parts[1], mimeType: mime });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(input);
  });
}

/**
 * Kompresi gambar sisi klien menggunakan Canvas native browser:
 * - Menjaga rasio aspek dengan dimensi maksimal 1280px
 * - Kompresi kualitas JPEG 80% (mengurangi ukuran dari ~4MB menjadi ~150-250KB)
 */
export async function compressImage(
  input: File | Blob | string,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<{ base64: string; mimeType: string }> {
  if (typeof window === 'undefined') {
    return toBase64Payload(input);
  }

  return new Promise((resolve, reject) => {
    let src = '';
    if (typeof input === 'string') {
      src = input;
    } else {
      src = URL.createObjectURL(input);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (typeof input !== 'string') {
        URL.revokeObjectURL(src);
      }

      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toBase64Payload(input).then(resolve).catch(reject);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const parts = dataUrl.split(',');
      resolve({ base64: parts[1] || '', mimeType });
    };

    img.onerror = () => {
      if (typeof input !== 'string') {
        URL.revokeObjectURL(src);
      }
      toBase64Payload(input).then(resolve).catch(reject);
    };

    img.src = src;
  });
}

/**
 * Menguji konektivitas dan validitas upload preset Cloudinary dengan 1x1 transparent PNG
 */
export const testCloudinaryConnection = async (
  testCloudName?: string,
  testUploadPreset?: string
): Promise<{ success: boolean; message: string }> => {
  const { cloudName: currentCloud, uploadPreset: currentPreset } = getCloudinaryConfig();
  const cloud = (testCloudName || currentCloud).trim();
  const preset = (testUploadPreset || currentPreset).trim();

  if (!cloud) {
    return { success: false, message: 'Cloud Name belum diisi.' };
  }
  if (!preset) {
    return { success: false, message: 'Upload Preset belum diisi.' };
  }

  try {
    const tiny1x1Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const formData = new FormData();
    formData.append('file', tiny1x1Png);
    formData.append('upload_preset', preset);
    formData.append('folder', 'SSES_T2_Dokumentasi/test');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok && data.secure_url) {
      return { success: true, message: 'Koneksi & Upload Preset Cloudinary Berhasil Aktif!' };
    }

    const errMsg = data?.error?.message || `HTTP ${res.status}`;
    return { success: false, message: `Cloudinary menolak: ${errMsg}` };
  } catch (err) {
    return { success: false, message: `Gagal menghubungi Cloudinary: ${getErrorMessage(err, 'CORS / Jaringan')}` };
  }
};

/**
 * Fallback penyimpanan foto ke bucket Supabase Storage 'dokumentasi'
 */
async function uploadToSupabaseStorageFallback(
  input: File | Blob | string,
  fileName?: string
): Promise<UploadResult> {
  try {
    const cleanName = (fileName || `foto_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `uploads/${Date.now()}_${cleanName}`;

    const { base64, mimeType } = await compressImage(input);
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const { data, error } = await supabase.storage
      .from('dokumentasi')
      .upload(storagePath, blob, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      sayPet('Foto gagal diunggah ke penyimpanan cadangan. Periksa koneksi, lalu kirim ulang laporannya.', 'error');
      return { status: 'error', message: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dokumentasi')
      .getPublicUrl(storagePath);

    return {
      status: 'success',
      url: publicUrl,
      viewUrl: publicUrl,
      fileId: data?.path || storagePath,
      fileName: cleanName
    };
  } catch (err) {
    console.error('Supabase Storage catch error:', err);
    sayPet('Foto gagal diunggah ke penyimpanan cadangan. Periksa koneksi, lalu kirim ulang laporannya.', 'error');
    return { status: 'error', message: getErrorMessage(err, 'Gagal upload foto ke Supabase Storage') };
  }
}

const isVideoInput = (input: File | Blob | string): input is Blob =>
  typeof input !== 'string' && input.type.startsWith('video/');

/** Unggahan video yang sedang/sudah berjalan per berkas, agar simpan dokumentasi dan share WhatsApp memakai satu unggahan. */
const videoUploads = new WeakMap<Blob, Promise<UploadResult>>();

interface CloudinaryVideoResponse {
  secure_url?: string;
  public_id?: string;
  format?: string;
  original_filename?: string;
  error?: { message?: string };
}

async function uploadVideoInChunks(file: Blob, options?: UploadPhotoOptions): Promise<UploadResult> {
  let { cloudName, uploadPreset } = getCloudinaryConfig();
  if (!cloudName || !uploadPreset) {
    ({ cloudName, uploadPreset } = await fetchCloudinaryConfig());
  }
  if (!cloudName || !uploadPreset) return { status: 'error', message: 'Cloudinary belum dikonfigurasi.' };

  const target = isDocumentationCategory(options?.category) ? nextDocumentationPhotoTarget(options.category) : null;
  const originalName = file instanceof File ? file.name : 'video.mp4';
  const ranges = uploadChunkRanges(file.size);
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const uncategorizedPublicId = buildUncategorizedVideoPublicId(DOCUMENTATION_ROOT_FOLDER, Date.now(), Math.random());

  try {
    let data: CloudinaryVideoResponse | null = null;
    for (const [start, end] of ranges) {
      const formData = new FormData();
      formData.append('file', file.slice(start, end), originalName);
      formData.append('upload_preset', uploadPreset);
      if (target) {
        formData.append('asset_folder', target.folder);
        formData.append('public_id', target.publicId);
      } else {
        formData.append('asset_folder', DOCUMENTATION_ROOT_FOLDER);
        formData.append('public_id', uncategorizedPublicId);
      }
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: 'POST',
        body: formData,
        // Berkas > 20 MB dikirim bertahap: tiap potongan membawa id unggahan dan rentang byte-nya.
        headers: ranges.length > 1
          ? { 'X-Unique-Upload-Id': uploadId, 'Content-Range': `bytes ${start}-${end - 1}/${file.size}` }
          : undefined,
      });
      data = await res.json().catch(() => null);
      if (!res.ok) return { status: 'error', message: data?.error?.message || `HTTP ${res.status}` };
    }

    if (!data?.secure_url) return { status: 'error', message: 'Cloudinary tidak mengembalikan URL video.' };
    return {
      status: 'success',
      url: data.secure_url,
      viewUrl: data.secure_url,
      fileId: data.public_id,
      fileName: target ? `${target.fileName}.${data.format || 'mp4'}` : data.original_filename || originalName,
    };
  } catch (err) {
    return { status: 'error', message: getErrorMessage(err, 'Gagal upload video ke Cloudinary') };
  }
}

/**
 * Upload video ke endpoint video Cloudinary. Berkas yang sama hanya diunggah sekali;
 * unggahan yang gagal boleh dicoba lagi pada pemanggilan berikutnya.
 */
export const uploadVideoToCloudinary = (file: Blob, options?: UploadPhotoOptions): Promise<UploadResult> => {
  let pending = videoUploads.get(file);
  if (!pending) {
    pending = uploadVideoInChunks(file, options);
    videoUploads.set(file, pending);
    pending.then((r) => {
      if (r.status !== 'success') videoUploads.delete(file);
    });
  }
  return pending;
};

/**
 * Upload Foto ke Cloudinary via Unsigned Upload Preset.
 * Jika Cloud Name belum dikonfigurasi atau gagal, otomatis fallback ke Supabase Storage.
 * Cepat (~300-600ms), CDN Global bawaan, tanpa cold start.
 */
export const uploadPhotoToCloudinary = async (
  input: File | Blob | string,
  fileNameArg?: string,
  options?: UploadPhotoOptions
): Promise<UploadResult> => {
  if (isVideoInput(input)) {
    const result = await uploadVideoToCloudinary(input, options);
    if (result.status === 'success') return result;
    console.warn('Upload video ke Cloudinary gagal, beralih ke Supabase Storage fallback:', result.message);
    sayPet('Video gagal diunggah ke Cloudinary — dialihkan ke penyimpanan cadangan.', 'warning');
    return uploadToSupabaseStorageFallback(input, fileNameArg || (input instanceof File ? input.name : undefined));
  }

  // Dengan `category`: foto masuk ke SSES_T2_Dokumentasi/{category} bernama {category}_YYYY-MM-DD_HHmmss
  // (waktu saat foto disimpan). Tanpa `category`: perilaku lama (folder SSES_T2_Dokumentasi, nama dari Cloudinary).
  const target = isDocumentationCategory(options?.category) ? nextDocumentationPhotoTarget(options.category) : null;
  const fileName = target ? `${target.fileName}.jpg` : fileNameArg;
  let { cloudName, uploadPreset } = getCloudinaryConfig();

  // Jika belum ada di memori/localStorage, coba muat dari cloud database Supabase
  if (!cloudName || !uploadPreset) {
    const fetched = await fetchCloudinaryConfig();
    cloudName = fetched.cloudName;
    uploadPreset = fetched.uploadPreset;
  }

  // Jika Cloudinary belum dikonfigurasi, gunakan Supabase Storage 'dokumentasi'
  if (!cloudName || !uploadPreset) {
    return uploadToSupabaseStorageFallback(input, fileName);
  }

  try {
    const { base64, mimeType } = await compressImage(input);
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('upload_preset', uploadPreset);
    if (target) {
      // Akun memakai dynamic folder mode (sama seperti Preventive): asset_folder menentukan folder tampilan,
      // public_id memuat path folder agar unik global.
      formData.append('asset_folder', target.folder);
      formData.append('public_id', target.publicId);
    } else {
      formData.append('folder', DOCUMENTATION_ROOT_FOLDER);
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (res.ok && data.secure_url) {
      return {
        status: 'success',
        url: data.secure_url,
        viewUrl: data.secure_url,
        fileId: data.public_id,
        fileName: target ? fileName : data.original_filename || fileName
      };
    }

    console.warn('Cloudinary upload gagal, beralih ke Supabase Storage fallback:', data);
    sayPet('Cloudinary menolak unggahan — foto dialihkan ke penyimpanan cadangan.', 'warning');
    return uploadToSupabaseStorageFallback(input, fileName);
  } catch (err) {
    console.warn('Cloudinary error, beralih ke Supabase Storage fallback:', err);
    sayPet('Cloudinary tidak merespons — foto dialihkan ke penyimpanan cadangan.', 'warning');
    return uploadToSupabaseStorageFallback(input, fileName);
  }
};

// Alias untuk menjaga kompatibilitas jika masih ada pemanggilan lama
export const uploadPhotoToGoogleDrive = uploadPhotoToCloudinary;
