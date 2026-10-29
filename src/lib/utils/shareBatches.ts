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
