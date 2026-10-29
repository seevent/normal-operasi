// src/lib/services/shareService.ts
import { isAbortError } from '../utils/errorUtils';
import { sayPet, useAppStore } from '../../store/useAppStore';
import { buildShareBatches, isRiskyBatch, isVideo, splitMediaSafely } from '../utils/shareBatches';
import { getTabCheer, TabCheerKey } from '../data/petMessages';
import type { DocumentationCategory } from '../utils/documentationPhoto';
import { getPreparedVideo, prepareVideoForWhatsApp } from './whatsappVideoService';

export const triggerFileDownload = (file: File) => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const fallbackShare = async (message: string, files: File[], setIsCopied: (v: boolean) => void) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  } catch (err) {
    console.error('Gagal menyalin teks', err);
  }

  // Buka WhatsApp terlebih dahulu secara langsung agar tidak terblokir oleh popup blocker browser
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');

  if (files.length > 0) {
    // Unduh otomatis berkas (PDF / Foto) agar pengguna di PC / Web dapat langsung melampirkannya
    files.forEach((f) => triggerFileDownload(f));
  }
};

export type ShareResult = 'shared' | 'fallback' | 'aborted';

export const shareToWhatsApp = async (
  message: string,
  filesArray: File[] | File | null,
  setIsCopied: (v: boolean) => void,
  cheerTab?: TabCheerKey
): Promise<ShareResult> => {
  let finalFiles: File[] = [];
  if (filesArray) {
    if (Array.isArray(filesArray)) finalFiles = filesArray;
    else finalFiles = [filesArray];
  }

  // Salin teks ke clipboard secara asinkron tanpa menahan (await) agar hak user gesture pada browser tidak kedaluwarsa
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(message).catch(() => {});
  }

  try {
    if (finalFiles.length > 0 && navigator.canShare && navigator.canShare({ files: finalFiles })) {
      await navigator.share({
        files: finalFiles,
        title: 'Laporan SSES T2',
        text: message
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (cheerTab) sayPet(getTabCheer(cheerTab), 'cheer');
      return 'shared';
    } else if (finalFiles.length === 0 && navigator.share) {
      await navigator.share({
        title: 'Laporan SSES T2',
        text: message
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (cheerTab) sayPet(getTabCheer(cheerTab), 'cheer');
      return 'shared';
    }
  } catch (err) {
    console.error('Share dibatalkan atau gagal', err);
    if (isAbortError(err)) return 'aborted';
  }

  await fallbackShare(message, finalFiles, setIsCopied);
  if (cheerTab) sayPet(getTabCheer(cheerTab), 'cheer');
  return 'fallback';
};

/** Folder Cloudinary untuk video per tab; tab lain memakai folder induk dokumentasi. */
const VIDEO_CATEGORY_BY_TAB: Partial<Record<TabCheerKey, DocumentationCategory>> = {
  kegiatan: 'Kegiatan',
  storing: 'Storing',
  perbaikan: 'Perbaikan',
  kalibrasi: 'Kalibrasi',
};

/** Naik setiap kali share baru dimulai atau dibatalkan, agar konversi video lama tidak mengisi antrean. */
let shareSession = 0;

/** Mengosongkan antrean kiriman, tombol kirim ulang, dan konversi video yang sedang berjalan. */
export const clearPendingShare = () => {
  shareSession += 1;
  const { setPendingShareBatches, setShareRetry, setVideoPrep } = useAppStore.getState();
  setPendingShareBatches([]);
  setShareRetry(null);
  setVideoPrep(null);
};

/**
 * Menunggu semua video selesai diubah ke MP4 ramah WhatsApp (umumnya sudah berjalan sejak video
 * dipilih), lalu mengantrekan laporan + media sebagai satu kiriman yang dibagikan lewat tombol
 * PendingShareBar (ketukan baru, karena menunggu membuat izin ketukan Kirim kedaluwarsa).
 */
const queueReportWithConvertedVideos = async (
  message: string,
  groups: File[][],
  videos: File[],
  cheerTab?: TabCheerKey
) => {
  const session = shareSession;
  const { setPendingShareBatches, setVideoPrep } = useAppStore.getState();
  const category = cheerTab ? VIDEO_CATEGORY_BY_TAB[cheerTab] : undefined;
  const converted = new Map<File, File>();
  let failed = 0;

  setVideoPrep({ done: 0, total: videos.length });
  for (const [i, video] of videos.entries()) {
    try {
      converted.set(video, await prepareVideoForWhatsApp(video, category));
    } catch (err) {
      console.error('Konversi video untuk WhatsApp gagal', err);
      failed += 1;
    }
    if (session !== shareSession) return;
    setVideoPrep({ done: i + 1, total: videos.length });
  }
  setVideoPrep(null);
  if (failed > 0) {
    sayPet(`${failed} video gagal diubah ke format WhatsApp (cek koneksi). Video dikirim apa adanya; bila WhatsApp gagal, ketuk "Kirim ulang terpisah".`, 'warning');
  }

  const [first, ...rest] = buildShareBatches(groups.map((g) => g.map((f) => converted.get(f) ?? f)));
  setPendingShareBatches([{ files: first, caption: message, cheerTab }, ...rest.map((files) => ({ files }))]);
};

/**
 * Membagikan laporan beserta lampiran per grup kolase.
 * Laporan hanya menjadi caption kiriman pertama (Grup Kolase 1); media grup lain dikirim
 * tanpa caption lewat PendingShareBar. Video diubah ke MP4 H.264 lewat Cloudinary (rekaman asli
 * iPhone ditolak WhatsApp iOS). Bila konversi sudah selesai, laporan + foto + video langsung
 * dibagikan; bila belum, dibagikan dari tombol PendingShareBar setelah konversi selesai.
 */
export const shareReportWithMedia = async (
  message: string,
  groups: File[][],
  setIsCopied: (v: boolean) => void,
  cheerTab?: TabCheerKey
) => {
  clearPendingShare();
  const { setPendingShareBatches, setShareRetry } = useAppStore.getState();

  const videos = groups.flat().filter(isVideo);
  if (videos.length > 0 && typeof navigator.canShare === 'function') {
    // Video dikonversi di latar belakang sejak dipilih. Bila semuanya sudah siap, langsung bagikan
    // (masih dalam ketukan Kirim); bila belum, tunggu dulu lewat PendingShareBar.
    if (!videos.every((v) => getPreparedVideo(v))) {
      await queueReportWithConvertedVideos(message, groups, videos, cheerTab);
      return;
    }
    groups = groups.map((g) => g.map((f) => getPreparedVideo(f) ?? f));
  }

  const [first, ...rest] = buildShareBatches(groups);
  const result = await shareToWhatsApp(message, first ?? null, setIsCopied, cheerTab);
  if (result === 'aborted') return;

  if (result === 'fallback') {
    // Tanpa Web Share API tidak ada kotak share: unduh semua sisa berkas agar bisa dilampirkan manual.
    rest.flat().forEach(triggerFileDownload);
    return;
  }
  setPendingShareBatches(rest.map((files) => ({ files })));
  if (first && isRiskyBatch(first, message)) setShareRetry({ files: first, caption: message });
};

/** Mengirim kiriman berikutnya di antrean. Harus dipanggil dari ketukan pengguna. */
export const shareNextPendingBatch = async () => {
  const { pendingShareBatches, setPendingShareBatches, setShareRetry } = useAppStore.getState();
  const [next, ...rest] = pendingShareBatches;
  if (!next) return;

  if (next.caption && navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(next.caption).catch(() => {});
  }

  try {
    const hasFiles = next.files.length > 0;
    if (!hasFiles || (navigator.canShare && navigator.canShare({ files: next.files }))) {
      await navigator.share({
        ...(hasFiles ? { files: next.files } : {}),
        title: 'Laporan SSES T2',
        ...(next.caption ? { text: next.caption } : {}),
      });
      if (next.cheerTab) sayPet(getTabCheer(next.cheerTab), 'cheer');
    } else {
      next.files.forEach(triggerFileDownload);
    }
  } catch (err) {
    console.error('Share media lanjutan dibatalkan atau gagal', err);
    if (isAbortError(err)) return;
    next.files.forEach(triggerFileDownload);
  }
  setPendingShareBatches(rest);
  setShareRetry(isRiskyBatch(next.files, next.caption) ? next : null);
};

/** Mengirim ulang kiriman berisi video secara terpisah: caption + foto sekali, lalu tiap video sendiri. */
export const retryShareSeparately = async () => {
  const { shareRetry, pendingShareBatches, setPendingShareBatches, setShareRetry } = useAppStore.getState();
  if (!shareRetry) return;

  setShareRetry(null);
  setPendingShareBatches([...splitMediaSafely(shareRetry), ...pendingShareBatches]);
  await shareNextPendingBatch();
};
