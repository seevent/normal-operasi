// src/lib/services/excelExportService.ts
// Ekspor laporan shift ke .xlsx dengan foto tertanam. Foto diambil di browser, diperkecil, lalu
// ditanam sebagai gambar (bukan tautan). ExcelJS dimuat saat dibutuhkan agar tidak membebani halaman awal.

import { createLimiter, fitWithin } from '../utils/preventiveImage';
import {
  buildServiceabilityChartSpec,
  buildShiftReportWorkbook,
  type LoadedPhoto,
  type ShiftReportWorkbookInput,
} from '../utils/shiftReportWorkbook';
import { embedServiceabilityChart } from '../utils/serviceabilityChart';
// `?inline` menanam logo sebagai data URI; Excel tidak mendukung webp, jadi dipakai salinan PNG.
import logoPng from '../../assets/logo-injourney-airports-excel.png?inline';

const LOGO: LoadedPhoto = { dataUrl: logoPng, width: 360, height: 114, extension: 'png' };

const MAX_EDGE = 480;
const JPEG_QUALITY = 0.8;
const FETCH_TIMEOUT_MS = 8000;
const CONCURRENCY = 4;

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Alamat alternatif untuk tautan Google Drive (sama seperti cadangan thumbnail pada dokumen cetak). */
const candidateUrls = (url: string): string[] => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? [url, `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${MAX_EDGE}`] : [url];
};

const fetchBlob = async (url: string): Promise<Blob> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, { mode: 'cors', signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.blob();
  } finally {
    clearTimeout(timer);
  }
};

const blobToJpeg = async (blob: Blob): Promise<LoadedPhoto> => {
  const bitmap = await createImageBitmap(blob);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas tidak tersedia');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), width, height, extension: 'jpeg' };
  } finally {
    bitmap.close();
  }
};

const loadPhoto = async (url: string): Promise<LoadedPhoto | null> => {
  for (const candidate of candidateUrls(url)) {
    try {
      return await blobToJpeg(await fetchBlob(candidate));
    } catch (err) {
      console.warn('Foto tidak dapat dimuat untuk Excel:', candidate, err);
    }
  }
  return null;
};

export interface ShiftReportXlsxInput {
  filename: string;
  laporanRows: string[][];
  /** URL foto per baris data (tanpa header). */
  photoUrls: string[][];
  kesiapanRows: ShiftReportWorkbookInput['kesiapanRows'];
  kop: ShiftReportWorkbookInput['kop'];
}

export const createShiftReportXlsx = async (
  input: ShiftReportXlsxInput
): Promise<{ file: File; failedPhotos: number }> => {
  const limit = createLimiter(CONCURRENCY);
  const cache = new Map<string, Promise<LoadedPhoto | null>>();
  const load = (url: string) => {
    if (!cache.has(url)) cache.set(url, limit(() => loadPhoto(url)));
    return cache.get(url)!;
  };

  const photos = await Promise.all(input.photoUrls.map(urls => Promise.all(urls.map(load))));
  const failedPhotos = photos.flat().filter(p => !p).length;

  const mod = await import('exceljs');
  const ExcelJS = (mod as any).default ?? mod;
  const workbookInput: ShiftReportWorkbookInput = {
    laporanRows: input.laporanRows,
    photos,
    kesiapanRows: input.kesiapanRows,
    kop: input.kop,
    logo: LOGO,
  };
  const wb = buildShiftReportWorkbook(ExcelJS, workbookInput);
  const buffer = await wb.xlsx.writeBuffer();
  // ExcelJS tidak bisa membuat grafik: grafik batang Serviceability disisipkan langsung ke paket xlsx.
  const chart = buildServiceabilityChartSpec(workbookInput);
  const bytes = chart
    ? await embedServiceabilityChart(((await import('jszip')) as any).default, buffer as ArrayBuffer, chart)
    : buffer;
  return { file: new File([bytes], input.filename, { type: XLSX_MIME }), failedPhotos };
};
