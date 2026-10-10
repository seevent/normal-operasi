// src/lib/utils/shareBatches.ts

type FileLike = { type: string };

const isVideo = (f: FileLike) => f.type.startsWith('video/');

/**
 * Membagi lampiran per grup kolase menjadi gelombang share WhatsApp.
 *
 * - Gelombang pertama membawa laporan sebagai caption: gambar Grup Kolase 1,
 *   atau video pertama Grup 1 bila grup itu tidak punya gambar.
 * - Gelombang berikutnya dikirim tanpa caption: gambar grup lain digabung,
 *   lalu tiap video sendiri-sendiri.
 *
 * Satu gelombang hanya berisi gambar atau satu video, sebab WhatsApp iOS gagal
 * ("Tidak dapat mengirim 2 pesan") bila satu share memuat lebih dari satu video
 * atau campuran video dan foto.
 */
export const buildShareBatches = <T extends FileLike>(groups: T[][]): T[][] => {
  const firstGroup = groups[0] ?? [];
  const firstImages = firstGroup.filter((f) => !isVideo(f));
  const otherImages = groups.slice(1).flat().filter((f) => !isVideo(f));
  const videoBatches = groups.flat().filter(isVideo).map((v) => [v]);

  let batches: T[][];
  if (firstImages.length > 0) {
    batches = [firstImages, otherImages, ...videoBatches];
  } else if (firstGroup.some(isVideo)) {
    batches = [videoBatches[0], otherImages, ...videoBatches.slice(1)];
  } else {
    batches = [otherImages, ...videoBatches];
  }
  return batches.filter((b) => b.length > 0);
};
