// src/lib/services/googleDriveService.ts

export interface UploadResult {
  status: 'success' | 'error';
  url?: string;
  fileId?: string;
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
  if (url) {
    localStorage.setItem('sses_gdrive_script_url', url.trim());
  } else {
    localStorage.removeItem('sses_gdrive_script_url');
  }
};

/**
 * Mengubah File / Blob / dataURL menjadi payload base64 murni
 */
async function toBase64Payload(input: File | Blob | string): Promise<{ base64: string; mimeType: string }> {
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
 * Upload Foto ke Google Drive via Google Apps Script Web App Endpoint.
 * Jika URL Google Apps Script belum diisi, akan otomatis fallback ke data URL/base64 lokal.
 */
export const uploadPhotoToGoogleDrive = async (
  input: File | Blob | string,
  fileName?: string
): Promise<UploadResult> => {
  const scriptUrl = getGoogleScriptUrl();

  try {
    const { base64, mimeType } = await toBase64Payload(input);

    // Fallback jika belum setting script URL: kembalikan data URL langsung agar flow tidak terputus
    if (!scriptUrl) {
      const fallbackUrl = typeof input === 'string' && input.startsWith('data:') 
        ? input 
        : `data:${mimeType};base64,${base64}`;
      return {
        status: 'success',
        url: fallbackUrl,
        message: 'Google Apps Script URL belum diatur, menggunakan penyimpanan lokal sementara.'
      };
    }

    const payload = {
      base64,
      mimeType,
      fileName: fileName || `DOK_${Date.now()}.jpg`
    };

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Mode text/plain mencegah CORS preflight OPTIONS failure pada Google Script
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.status === 'success') {
      return {
        status: 'success',
        url: data.url || data.viewUrl,
        fileId: data.fileId
      };
    } else {
      console.warn('Gagal upload ke Google Drive, fallback ke base64:', data.message);
      return {
        status: 'error',
        message: data.message || 'Gagal mengunggah ke Google Drive',
        url: `data:${mimeType};base64,${base64}`
      };
    }
  } catch (error: any) {
    console.error('Error saat upload ke Google Drive:', error);
    // Graceful fallback
    const fallbackUrl = typeof input === 'string' && input.startsWith('data:') ? input : undefined;
    return {
      status: 'error',
      message: error.message || 'Kesalahan jaringan saat mengunggah foto',
      url: fallbackUrl
    };
  }
};
