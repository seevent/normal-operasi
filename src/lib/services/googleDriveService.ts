import { supabase } from '../supabaseClient';

export interface UploadResult {
  status: 'success' | 'error';
  url?: string;
  viewUrl?: string;
  driveUrl?: string;
  fileId?: string;
  fileName?: string;
  message?: string;
}

/**
 * Mendapatkan URL Google Apps Script Web App dari Environment atau LocalStorage
 */
export const getGoogleScriptUrl = (): string => {
  const envUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (envUrl && envUrl.trim() !== '') return envUrl.trim();
  const localUrl = localStorage.getItem('sses_gdrive_script_url');
  return localUrl ? localUrl.trim() : '';
};

/**
 * Menyimpan URL Google Apps Script Web App ke LocalStorage
 */
export const setGoogleScriptUrl = (url: string): void => {
  if (url && url.trim() !== '') {
    localStorage.setItem('sses_gdrive_script_url', url.trim());
  } else {
    localStorage.removeItem('sses_gdrive_script_url');
  }
};

/**
 * Konversi File / Blob / string menjadi Base64 murni (tanpa header data URL)
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
 * - Mempercepat pengiriman ke Google Apps Script dan menghemat kuota Google Drive
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
 * Menguji konektivitas endpoint Google Apps Script
 */
export const testGoogleScriptConnection = async (testUrl?: string): Promise<{ success: boolean; message: string }> => {
  const url = testUrl || getGoogleScriptUrl();
  if (!url) {
    return { success: false, message: 'URL Google Apps Script belum diisi.' };
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return { success: false, message: `Server merespon dengan status HTTP ${response.status}.` };
    }

    const data = await response.json();
    if (data.status === 'success') {
      return { success: true, message: data.message || 'Koneksi ke Google Apps Script berhasil!' };
    }

    return { success: false, message: data.message || 'Respon Google Apps Script tidak valid.' };
  } catch (error: any) {
    return { success: false, message: `Gagal menghubungi endpoint: ${error?.message || 'CORS / Jaringan'}` };
  }
};

/**
 * Fallback penyimpanan otomatis ke Supabase Storage (bucket: 'dokumentasi')
 * Jika Google Apps Script mengalami kendala jaringan atau hak akses
 */
async function uploadToSupabaseFallback(
  input: File | Blob | string,
  fileName?: string
): Promise<UploadResult> {
  try {
    const { base64, mimeType } = await compressImage(input);
    const cleanFileName = (fileName || `DOK_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Konversi base64 ke Uint8Array blob
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });

    const filePath = `uploads/${Date.now()}_${cleanFileName}`;
    const { error } = await supabase.storage
      .from('dokumentasi')
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error('Supabase storage fallback error:', error);
      return { status: 'error', message: error.message };
    }

    const { data: pubData } = supabase.storage
      .from('dokumentasi')
      .getPublicUrl(filePath);

    if (pubData && pubData.publicUrl) {
      return {
        status: 'success',
        url: pubData.publicUrl,
        viewUrl: pubData.publicUrl,
        fileName: cleanFileName
      };
    }

    return { status: 'error', message: 'Gagal mengambil URL publik Supabase' };
  } catch (err: any) {
    console.error('Supabase storage fallback error:', err);
    return { status: 'error', message: err?.message };
  }
}

/**
 * Upload Foto ke Google Drive via Google Apps Script Web App Endpoint.
 * Jika endpoint script gagal atau belum diisi, otomatis beralih ke Supabase Storage (bucket: 'dokumentasi')
 * agar foto 100% selalu tersimpan dan muncul di Tab Report tanpa error.
 */
export const uploadPhotoToGoogleDrive = async (
  input: File | Blob | string,
  fileName?: string
): Promise<UploadResult> => {
  const scriptUrl = getGoogleScriptUrl();

  // 1. Coba upload ke Google Drive via Google Apps Script jika URL tersedia
  if (scriptUrl) {
    try {
      const { base64, mimeType } = await compressImage(input);
      const payload = {
        base64,
        mimeType,
        fileName: fileName || `DOK_${Date.now()}.jpg`
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success' && data.url) {
          return {
            status: 'success',
            url: data.url,
            viewUrl: data.viewUrl || data.url,
            driveUrl: data.driveUrl,
            fileId: data.fileId,
            fileName: data.fileName
          };
        }
        console.warn('Google Apps Script menolak atau error:', data?.message);
      }
    } catch (gdriveErr) {
      console.warn('Gagal koneksi ke Google Apps Script, mengalihkan ke Supabase Storage:', gdriveErr);
    }
  }

  // 2. Fallback otomatis ke Supabase Storage agar foto SELALU tersimpan dan tampil di Tab Report
  return uploadToSupabaseFallback(input, fileName);
};
