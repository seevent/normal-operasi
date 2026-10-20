// src/lib/data/preventiveTypes.ts
// Konstanta tab Preventive. Nama tipe aset HARUS sama persis dengan nama folder di Cloudinary
// (PRIMA/PREVENTIVE/MAINTENANCE/{PERIODE}/{TIPE}) dan dengan constraint tabel prima_assets.

export const PREVENTIVE_PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export type PreventivePeriod = (typeof PREVENTIVE_PERIODS)[number];

/** Kode periode seperti kolom jadwal di PRIMA (D = Daily, W = Weekly, M = Monthly). */
export const PERIOD_CODE: Record<PreventivePeriod, string> = {
  DAILY: 'D',
  WEEKLY: 'W',
  MONTHLY: 'M',
};

export const PERIOD_LABEL: Record<PreventivePeriod, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

export const PERIOD_RESET_TEXT: Record<PreventivePeriod, string> = {
  DAILY: 'Reset setiap hari pukul 07.00',
  WEEKLY: 'Reset setiap hari Minggu pukul 07.00',
  MONTHLY: 'Reset setiap tanggal 1 pukul 07.00',
};

/** Urutan tetap sesuai permintaan, bukan urutan abjad data, agar posisi grup tidak berpindah antar hari. */
export const PREVENTIVE_ASSET_TYPES = [
  'ACCESS CONTROL SYSTEM',
  'BODY SCANNER',
  'ETD DESKTOP',
  'HANDHELD METAL DETECTOR',
  'WALK THROUGH METAL DETECTOR',
  'X-RAY BAGASI',
  'X-RAY KABIN',
] as const;
export type PreventiveAssetType = (typeof PREVENTIVE_ASSET_TYPES)[number];

export const ASSET_TYPE_LABEL: Record<PreventiveAssetType, string> = {
  'ACCESS CONTROL SYSTEM': 'Access Control System',
  'BODY SCANNER': 'Body Scanner',
  'ETD DESKTOP': 'ETD Desktop',
  'HANDHELD METAL DETECTOR': 'Handheld Metal Detector',
  'WALK THROUGH METAL DETECTOR': 'Walk Through Metal Detector',
  'X-RAY BAGASI': 'X-Ray Bagasi',
  'X-RAY KABIN': 'X-Ray Kabin',
};

// ---- Aturan kompresi foto: WAJIB sebelum dikirim, diverifikasi lagi di server ----

/** Sisi terpanjang foto setelah kompresi (px). */
export const MAX_PHOTO_EDGE = 1280;
export const PHOTO_JPEG_QUALITY = 0.8;
/** Batas atas ukuran berkas hasil kompresi yang diterima server (byte). Foto 1280 px kualitas 0.8 biasanya 150-500 KB. */
export const MAX_PHOTO_BYTES = 2_000_000;

// ---- Kontrak server function (dipakai bersama oleh klien dan server; tanpa rahasia) ----

export interface UploadTicket {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  assetFolder: string;
  periodKey: string;
  overwrite: true;
  invalidate: true;
}

export interface ConfirmResult {
  ok: true;
  periodKey: string;
  version: number;
  secureUrl: string;
}
