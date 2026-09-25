export interface UploadResult {
  status: 'success' | 'error';
  url?: string;
  viewUrl?: string;
  fileId?: string;
  fileName?: string;
  message?: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/**
 * Mendapatkan konfigurasi Cloudinary dari LocalStorage atau Environment variables
 */
export const getCloudinaryConfig = (): CloudinaryConfig => {
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

  return { cloudName, uploadPreset };
};

/**
 * Menyimpan konfigurasi Cloudinary ke LocalStorage
 */
export const setCloudinaryConfig = (cloudName: string, uploadPreset: string): void => {
  if (typeof window === 'undefined') return;

  if (cloudName.trim()) {
    localStorage.setItem('sses_cloudinary_cloud_name', cloudName.trim());
  } else {
    localStorage.removeItem('sses_cloudinary_cloud_name');
  }

  if (uploadPreset.trim()) {
    localStorage.setItem('sses_cloudinary_upload_preset', uploadPreset.trim());
  } else {
    localStorage.removeItem('sses_cloudinary_upload_preset');
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
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungi Cloudinary: ${err?.message || 'CORS / Jaringan'}` };
  }
};

/**
 * Upload Foto ke Cloudinary via Unsigned Upload Preset.
 * Cepat (~300-600ms), CDN Global bawaan, tanpa cold start.
 */
export const uploadPhotoToCloudinary = async (
  input: File | Blob | string,
  fileName?: string
): Promise<UploadResult> => {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  if (!cloudName || !uploadPreset) {
    return {
      status: 'error',
      message: 'Cloud Name atau Upload Preset Cloudinary belum diisi. Buka Tab Data → Cloudinary untuk menyimpannya.'
    };
  }

  try {
    const { base64, mimeType } = await compressImage(input);
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'SSES_T2_Dokumentasi');

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
        fileName: data.original_filename || fileName
      };
    }

    const errorMsg = data?.error?.message || `Gagal mengunggah foto (HTTP ${res.status})`;
    return { status: 'error', message: errorMsg };
  } catch (err: any) {
    return { status: 'error', message: `Kesalahan jaringan Cloudinary: ${err?.message || 'CORS / Jaringan'}` };
  }
};

// Alias untuk menjaga kompatibilitas jika masih ada pemanggilan lama
export const uploadPhotoToGoogleDrive = uploadPhotoToCloudinary;
