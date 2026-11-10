// src/lib/services/shareService.ts
import { isAbortError } from '../utils/errorUtils';
import { sayPet, useAppStore } from '../../store/useAppStore';
import { isAppleMobile, isVideo } from '../utils/shareBatches';
import type { ShareItem } from '../utils/shareBatches';
import { retrySeparately, shareNext, skipNext, startReportShare, videoLinkMessage } from '../utils/shareFlow';
import type { ShareFlowDeps, ShareFlowState, ShareMode, ShareSession, StartShareResult, VideoChoice } from '../utils/shareFlow';
import { getTabCheer, TabCheerKey } from '../data/petMessages';
import { getPreparedVideo, getVideoLink } from './whatsappVideoService';
import { logShare, logShareNote } from './shareLogService';

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
      // Tanpa title: WhatsApp iOS bisa gagal mengirim berkas yang dibagikan bersama title.
      await navigator.share({
        files: finalFiles,
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
 * Strategi share video per platform. 'gabung' = laporan + foto + video dalam satu share, seperti kode
 * awal yang berfungsi di iPhone dan Android. Ubah hanya berdasar tabel share_log / halaman Uji share
 * (tab Data), bukan dugaan: lihat docs/superpowers/plans/2026-11-10-video-whatsapp-share.md.
 */
export const SHARE_MODE_BY_PLATFORM: { apple: ShareMode; other: ShareMode } = { apple: 'gabung', other: 'gabung' };

const defaultShareMode = (): ShareMode =>
  typeof navigator !== 'undefined' && isAppleMobile(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)
    ? SHARE_MODE_BY_PLATFORM.apple
    : SHARE_MODE_BY_PLATFORM.other;

/** Sesi share yang sedang berjalan (id percobaan, tab, langkah) untuk pencatatan share_log. */
let currentSession: ShareSession | undefined;

const newAttemptId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const copyText = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(() => {});
};

/** Menyambungkan alur share (shareFlow.ts) ke peramban, store aplikasi, dan pencatatan. */
const flowDeps = (setIsCopied: (v: boolean) => void = () => {}): ShareFlowDeps => ({
  nav: {
    share: typeof navigator.share === 'function' ? (data) => navigator.share(data as ShareData) : undefined,
    canShare: typeof navigator.canShare === 'function' ? (data) => navigator.canShare(data as ShareData) : undefined,
  },
  getState: (): ShareFlowState => {
    const s = useAppStore.getState();
    return { queue: s.pendingShareBatches, retry: s.shareRetry, failure: s.shareFailure, attempted: s.shareAttempted, session: currentSession };
  },
  setState: (patch) => {
    if ('session' in patch) currentSession = patch.session;
    useAppStore.getState().setShareState({
      ...('queue' in patch ? { pendingShareBatches: patch.queue } : {}),
      ...('retry' in patch ? { shareRetry: patch.retry } : {}),
      ...('failure' in patch ? { shareFailure: patch.failure } : {}),
      ...('attempted' in patch ? { shareAttempted: patch.attempted } : {}),
    });
  },
  preparedVideo: getPreparedVideo,
  log: logShare,
  now: () => Date.now(),
  newId: newAttemptId,
  setTimer: (fn, ms) => setTimeout(fn, ms),
  onShared: (item) => {
    if (item.caption) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
    if (item.cheerTab) sayPet(getTabCheer(item.cheerTab), 'cheer');
  },
  fallback: (message, files) => fallbackShare(message, files, setIsCopied),
  download: triggerFileDownload,
  copyText,
});

/** Mengosongkan antrean kiriman dan tombol kirim ulang. */
export const clearPendingShare = () => {
  currentSession = undefined;
  useAppStore.getState().setShareState({ pendingShareBatches: [], shareRetry: null, shareFailure: null, shareAttempted: false });
};

/**
 * Membagikan laporan beserta lampiran per grup kolase. Menu share WhatsApp dibuka SEKETIKA saat Kirim
 * ditekan: laporan + media Grup Kolase 1 (foto dan video) dalam satu share; media grup lain lewat
 * tombol PendingShareBar. Video memakai salinan MP4 hasil konversi bila sudah siap, selain itu berkas
 * asli: share tidak pernah menunggu unggah atau konversi.
 */
export const shareReportWithMedia = async (
  message: string,
  groups: File[][],
  setIsCopied: (v: boolean) => void,
  cheerTab?: TabCheerKey
) => {
  const { result } = await startReportShare(flowDeps(setIsCopied), { message, groups, cheerTab, mode: defaultShareMode() });
  if (result === 'fallback' && cheerTab) sayPet(getTabCheer(cheerTab), 'cheer');
};

/** Halaman Uji share (tab Data): satu percobaan dengan mode dan pilihan video tertentu. */
export const shareTestReport = (options: {
  test: string;
  message: string;
  groups: File[][];
  mode: ShareMode;
  video: VideoChoice;
}): Promise<{ result: StartShareResult; attemptId: string }> => startReportShare(flowDeps(), { ...options, kind: 'uji' });

/** Mengirim kiriman berikutnya di antrean. Harus dipanggil dari ketukan pengguna. */
export const shareNextPendingBatch = () => shareNext(flowDeps());

/** Mengirim ulang kiriman berisi video secara terpisah: laporan + foto sekali, lalu tiap video sendiri. */
export const retryShareSeparately = () => retrySeparately(flowDeps());

const noteHead = (note: 'tautan' | 'disimpan' | 'dilewati') => {
  if (currentSession) logShareNote(currentSession.attemptId, note, currentSession.test);
};

/** Melewati kiriman terdepan: sudah terkirim tetapi peramban tidak melapor, atau memang tidak ingin dikirim. */
export const skipPendingShare = () => {
  noteHead('dilewati');
  skipNext(flowDeps());
};

/** Tautan Cloudinary untuk semua video pada kiriman; kosong bila ada video yang belum selesai diunggah. */
export const pendingVideoLinks = (item: ShareItem | undefined): string[] => {
  const videos = item?.files.filter(isVideo) ?? [];
  const links = videos.map(getVideoLink).filter((url): url is string => Boolean(url));
  return videos.length > 0 && links.length === videos.length ? links : [];
};

/**
 * Jalan cadangan bila berkas video tidak bisa dibagikan: buka WhatsApp dengan tautan videonya.
 * Laporan dan foto pada kiriman yang sama tetap di antrean untuk dikirim tanpa video.
 */
export const sendPendingVideoLinks = () => {
  const s = useAppStore.getState();
  const [head, ...rest] = s.pendingShareBatches;
  const links = pendingVideoLinks(head);
  if (!head || links.length === 0) return;
  window.open(`https://wa.me/?text=${encodeURIComponent(videoLinkMessage(links))}`, '_blank');
  noteHead('tautan');
  const others = head.files.filter((f) => !isVideo(f));
  const remainder: ShareItem[] = others.length > 0 || head.caption ? [{ ...head, files: others }] : [];
  s.setShareState({ pendingShareBatches: [...remainder, ...rest], shareFailure: null, shareAttempted: false });
};

/** Jalan cadangan: simpan berkas kiriman terdepan ke perangkat (teks laporannya disalin), lalu lanjut. */
export const savePendingFiles = () => {
  const [head] = useAppStore.getState().pendingShareBatches;
  if (!head) return;
  if (head.caption) copyText(head.caption);
  head.files.forEach(triggerFileDownload);
  noteHead('disimpan');
  skipNext(flowDeps());
};
