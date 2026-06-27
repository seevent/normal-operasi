// src/lib/services/sheetsSyncService.ts
import { GOOGLE_SHEETS_WEBAPP_URL } from '../data/constants';

export interface SyncReportPayload {
  jenis: 'Perbaikan' | 'Kegiatan' | 'Storing';
  tanggal: string; // Format YYYY-MM-DD
  waktu: string;   // e.g. "08:30 - 09:00" atau "08:15"
  shift?: 'PS' | 'M';
  teknisi?: string;
  lokasi: string;
  peralatan: string;
  uraian: string;
  tindakLanjut?: string;
  status?: string;
  imageFile?: File | Blob | null;
}

export interface UpdateReportPayload extends SyncReportPayload {
  rowIndex: number;
}

/**
 * Menghitung kode shift operasional (PS = Pagi-Siang 08:00-19:59, M = Malam 20:00-07:59)
 */
export const determineShift = (waktuStr: string): 'PS' | 'M' => {
  if (!waktuStr) {
    const hour = new Date().getHours();
    return (hour >= 8 && hour < 20) ? 'PS' : 'M';
  }
  const match = waktuStr.match(/(\d{2}):(\d{2})/);
  if (!match) {
    const hour = new Date().getHours();
    return (hour >= 8 && hour < 20) ? 'PS' : 'M';
  }
  const hour = parseInt(match[1], 10);
  return (hour >= 8 && hour < 20) ? 'PS' : 'M';
};

/**
 * Mengubah file/blob menjadi base64 string
 */
const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String || "");
    };
    reader.onerror = () => {
      console.error("Gagal membaca file gambar untuk sync");
      resolve("");
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Mengirim laporan baru secara diam-diam (background sync) ke Google Sheets & Drive
 */
export const syncToGoogleSheets = async (payload: SyncReportPayload): Promise<boolean> => {
  try {
    let imageBase64 = "";
    if (payload.imageFile) {
      imageBase64 = await fileToBase64(payload.imageFile);
    }

    let shift = payload.shift || determineShift(payload.waktu);

    const postBody = {
      action: 'save_report',
      jenis: payload.jenis,
      tanggal: payload.tanggal,
      waktu: payload.waktu,
      shift: shift,
      teknisi: payload.teknisi || '-',
      lokasi: payload.lokasi || '-',
      peralatan: payload.peralatan || '-',
      uraian: payload.uraian || '-',
      tindakLanjut: payload.tindakLanjut || '-',
      status: payload.status || 'Normal',
      imageBase64: imageBase64
    };

    fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(postBody)
    }).catch(err => console.error(`[Background Sync] Gagal mengirim laporan:`, err));

    return true;
  } catch (e) {
    console.error("[Background Sync] Error memproses payload:", e);
    return false;
  }
};

/**
 * Memperbarui baris laporan existing di Google Sheets
 */
export const updateSheetReport = async (payload: UpdateReportPayload): Promise<boolean> => {
  try {
    let imageBase64 = "";
    if (payload.imageFile) {
      imageBase64 = await fileToBase64(payload.imageFile);
    }

    let shift = payload.shift || determineShift(payload.waktu);

    const postBody = {
      action: 'update_report',
      rowIndex: payload.rowIndex,
      jenis: payload.jenis,
      tanggal: payload.tanggal,
      waktu: payload.waktu,
      shift: shift,
      teknisi: payload.teknisi || '-',
      lokasi: payload.lokasi || '-',
      peralatan: payload.peralatan || '-',
      uraian: payload.uraian || '-',
      tindakLanjut: payload.tindakLanjut || '-',
      status: payload.status || 'Normal',
      imageBase64: imageBase64
    };

    const res = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(postBody)
    });
    const result = await res.json();
    return result.status === 'success';
  } catch (e) {
    console.error("[Update Report] Error:", e);
    return false;
  }
};

/**
 * Menghapus baris laporan di Google Sheets
 */
export const deleteSheetReport = async (rowIndex: number): Promise<boolean> => {
  try {
    const postBody = {
      action: 'delete_report',
      rowIndex: rowIndex
    };

    const res = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(postBody)
    });
    const result = await res.json();
    return result.status === 'success';
  } catch (e) {
    console.error("[Delete Report] Error:", e);
    return false;
  }
};
