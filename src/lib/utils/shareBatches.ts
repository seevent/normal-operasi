// src/lib/utils/shareBatches.ts

type FileLike = { type: string };

/** Satu kiriman WhatsApp: berkas yang dibagikan bersama, dengan caption opsional. */
export interface ShareItem {
  files: File[];
  caption?: string;
}

const isVideo = (f: FileLike) => f.type.startsWith('video/');

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

/** Kiriman yang memuat video bersama berkas lain paling mungkin gagal di WhatsApp iOS. */
export const isRiskyBatch = (files: FileLike[]): boolean =>
  files.length > 1 && files.some(isVideo);

/**
 * Memecah berkas menjadi kiriman yang paling aman untuk WhatsApp iOS:
 * semua foto dalam satu kiriman, lalu tiap video sendiri-sendiri.
 */
export const splitMediaSafely = <T extends FileLike>(files: T[]): T[][] =>
  [files.filter((f) => !isVideo(f)), ...files.filter(isVideo).map((v) => [v])].filter((b) => b.length > 0);
