// src/lib/utils/shareBatches.ts
import type { TabCheerKey } from '../data/petMessages';

type FileLike = { type: string };

/** Satu kiriman WhatsApp: berkas yang dibagikan bersama, dengan caption opsional. */
export interface ShareItem {
  files: File[];
  caption?: string;
  /** Tab asal laporan; maskot memberi penyemangat setelah kiriman ini dibagikan. */
  cheerTab?: TabCheerKey;
}

export const isVideo = (f: FileLike) => f.type.startsWith('video/');

/**
 * Membagi lampiran per grup kolase menjadi paling banyak dua kiriman WhatsApp.
 *
 * - Kiriman pertama membawa laporan sebagai caption: seluruh media Grup Kolase 1
 *   (foto dan video boleh campur).
 * - Kiriman kedua tanpa caption: seluruh media grup lainnya.
 */
export const buildShareBatches = <T extends FileLike>(groups: T[][]): T[][] => {
  const [first = [], ...others] = groups;
  return [first, others.flat()].filter((b) => b.length > 0);
};

/** Kiriman yang memuat video bersama berkas lain atau caption paling mungkin gagal di WhatsApp iOS. */
export const isRiskyBatch = (files: FileLike[], caption?: string): boolean =>
  files.some(isVideo) && (files.length > 1 || Boolean(caption));

/**
 * Memecah kiriman menjadi kiriman yang paling aman untuk WhatsApp iOS: caption bersama
 * semua foto (atau caption saja bila tidak ada foto), lalu tiap video sendiri tanpa caption.
 */
export const splitMediaSafely = <T extends FileLike>(item: { files: T[]; caption?: string }): { files: T[]; caption?: string }[] => {
  const photos = item.files.filter((f) => !isVideo(f));
  const head = photos.length > 0 || item.caption ? [{ files: photos, caption: item.caption }] : [];
  return [...head, ...item.files.filter(isVideo).map((v) => ({ files: [v] }))];
};

/**
 * Urutan kiriman WhatsApp untuk satu laporan. Kiriman pertama membawa caption laporan.
 * Dengan `separateVideos` (iPhone/iPad), video tidak pernah digabung dengan caption atau berkas lain:
 * WhatsApp iOS menampilkan video itu tetapi gagal mengirim ("Tidak dapat mengirim pesan").
 */
export const planShareItems = <T extends FileLike>(
  batches: T[][],
  caption: string,
  separateVideos: boolean
): { files: T[]; caption?: string }[] => {
  const [first = [], ...rest] = batches;
  if (!separateVideos) return [{ files: first, caption }, ...rest.map((files) => ({ files }))];
  return [...splitMediaSafely({ files: first, caption }), ...rest.flatMap((files) => splitMediaSafely({ files }))];
};

/** iPhone/iPad, termasuk Chrome/Firefox iOS (semuanya WebKit) dan iPadOS yang mengaku Mac. */
export const isAppleMobile = (userAgent: string, platform = '', maxTouchPoints = 0): boolean =>
  /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
