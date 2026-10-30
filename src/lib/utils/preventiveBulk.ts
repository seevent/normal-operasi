// src/lib/utils/preventiveBulk.ts
// Unggah banyak foto Preventive sekaligus: urutan foto dan pasangan foto -> peralatan.
// Modul murni agar bisa diuji langsung.

export interface PhotoOrderInfo {
  /** Urutan saat dipilih. */
  index: number;
  /** Waktu pengambilan dari EXIF (epoch ms) bila terbaca. */
  takenAt: number | null;
  /** Rentang waktu dari nama berkas WhatsApp bila foto tanpa EXIF. */
  nameRange: [number, number] | null;
}

const timeOf = (p: PhotoOrderInfo): number | null => p.takenAt ?? p.nameRange?.[0] ?? null;

/** Foto diurutkan menurut waktu diambil (EXIF, lalu nama WhatsApp); foto tanpa waktu menyusul sesuai urutan dipilih. */
export const orderPhotos = <T extends PhotoOrderInfo>(photos: T[]): T[] =>
  [...photos].sort((a, b) => {
    const ta = timeOf(a);
    const tb = timeOf(b);
    if (ta !== null && tb !== null && ta !== tb) return ta - tb;
    if (ta !== null && tb === null) return -1;
    if (ta === null && tb !== null) return 1;
    return a.index - b.index;
  });

/** Alat awal bawaan: alat pertama yang belum tersimpan, atau alat pertama bila semua sudah tersimpan. */
export const defaultStartKey = (assets: Array<{ key: string; saved: boolean }>): string | null =>
  (assets.find((a) => !a.saved) ?? assets[0])?.key ?? null;

/**
 * Pasangan bawaan: foto ke-i untuk alat berikutnya dalam urutan tampilan, mulai dari `startKey` (bawaan: alat
 * pertama yang belum tersimpan). Alat tersimpan yang terlewati dalam urutan ikut terisi (fotonya ditimpa).
 * Foto berlebih = null.
 */
export const defaultAssignment = (
  photoCount: number,
  assets: Array<{ key: string; saved: boolean }>,
  startKey: string | null = defaultStartKey(assets),
): Array<string | null> => {
  const found = startKey === null ? -1 : assets.findIndex((a) => a.key === startKey);
  const start = found === -1 ? 0 : found;
  return Array.from({ length: photoCount }, (_, i) => assets[start + i]?.key ?? null);
};

/** Ganti alat untuk satu foto; bila alat itu sudah dipakai foto lain, pasangan keduanya ditukar. */
export const reassign = (assignment: Array<string | null>, photoIndex: number, assetKey: string | null): Array<string | null> => {
  const next = [...assignment];
  const other = assetKey === null ? -1 : next.indexOf(assetKey);
  if (other !== -1 && other !== photoIndex) next[other] = next[photoIndex];
  next[photoIndex] = assetKey;
  return next;
};
