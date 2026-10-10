// src/lib/services/shareService.ts
import { isAbortError } from '../utils/errorUtils';
import { sayPet, useAppStore } from '../../store/useAppStore';
import { buildShareBatches, isRiskyBatch, splitMediaSafely } from '../utils/shareBatches';
import { getTabCheer, TabCheerKey } from '../data/petMessages';

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

/**
 * Membagikan laporan beserta lampiran per grup kolase.
 * Laporan hanya menjadi caption kiriman pertama (Grup Kolase 1); media grup lain dikirim
 * tanpa caption lewat PendingShareBar. Foto dan video boleh campur dalam satu kiriman;
 * bila WhatsApp iOS menolaknya, PendingShareBar menawarkan kirim ulang terpisah.
 */
export const shareReportWithMedia = async (
  message: string,
  groups: File[][],
  setIsCopied: (v: boolean) => void,
  cheerTab?: TabCheerKey
) => {
  const { setPendingShareBatches, setShareRetry } = useAppStore.getState();
  setPendingShareBatches([]);
  setShareRetry(null);

  const [first, ...rest] = buildShareBatches(groups);
  const result = await shareToWhatsApp(message, first ?? null, setIsCopied, cheerTab);
  if (result === 'aborted') return;

  if (result === 'fallback') {
    // Tanpa Web Share API tidak ada kotak share: unduh semua sisa berkas agar bisa dilampirkan manual.
    rest.flat().forEach(triggerFileDownload);
    return;
  }
  setPendingShareBatches(rest.map((files) => ({ files })));
  if (first && isRiskyBatch(first)) setShareRetry({ files: first, caption: message });
};

/** Mengirim kiriman berikutnya di antrean. Harus dipanggil dari ketukan pengguna. */
export const shareNextPendingBatch = async () => {
  const { pendingShareBatches, setPendingShareBatches, setShareRetry } = useAppStore.getState();
  const [next, ...rest] = pendingShareBatches;
  if (!next) return;

  try {
    if (navigator.canShare && navigator.canShare({ files: next.files })) {
      await navigator.share({
        files: next.files,
        title: 'Laporan SSES T2',
        ...(next.caption ? { text: next.caption } : {}),
      });
    } else {
      next.files.forEach(triggerFileDownload);
    }
  } catch (err) {
    console.error('Share media lanjutan dibatalkan atau gagal', err);
    if (isAbortError(err)) return;
    next.files.forEach(triggerFileDownload);
  }
  setPendingShareBatches(rest);
  setShareRetry(isRiskyBatch(next.files) ? next : null);
};

/** Mengirim ulang kiriman campur foto + video secara terpisah (foto sekali, tiap video sendiri). */
export const retryShareSeparately = async () => {
  const { shareRetry, pendingShareBatches, setPendingShareBatches, setShareRetry } = useAppStore.getState();
  if (!shareRetry) return;

  const [first, ...more] = splitMediaSafely(shareRetry.files);
  setShareRetry(null);
  setPendingShareBatches([
    { files: first, caption: shareRetry.caption },
    ...more.map((files) => ({ files })),
    ...pendingShareBatches,
  ]);
  await shareNextPendingBatch();
};
