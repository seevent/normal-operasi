// src/lib/utils/preventiveImage.ts
// Hitung ukuran foto setelah kompresi. Murni agar bisa diuji tanpa browser.

/** Perkecil agar sisi terpanjang <= maxEdge dengan rasio tetap; tidak pernah memperbesar. */
export const fitWithin = (width: number, height: number, maxEdge: number): { width: number; height: number } => {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`dimensi gambar tidak valid: ${width}x${height}`);
  }
  const ratio = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
};

interface FileLike {
  type: string;
  name: string;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;

/**
 * Pemilih foto sebagian Android memberi type kosong; dekode yang kelak menentukan sah/tidaknya.
 * Yang ditolak di awal hanya yang jelas bukan gambar.
 */
export const isAcceptableImage = (f: FileLike): boolean =>
  f.type.startsWith('image/') || (f.type === '' && IMAGE_EXT.test(f.name));

export const isHeicLike = (f: FileLike): boolean => /^image\/hei[cf]$/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

/**
 * Waktu server dari Postgres berformat mikrodetik ('...53.426441+00:00'); sebagian versi Safari menolaknya.
 * Pecahan detik dipotong ke milidetik. Mengembalikan null (bukan NaN) bila tidak terbaca.
 */
export const parseServerTime = (value: string): number | null => {
  const normalized = value.replace(/(\.\d{3})\d+/, '$1').replace(/\.(\d{1,2})(?=[Z+-])/, (_, d: string) => `.${d.padEnd(3, '0')}`);
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : null;
};

/** Batasi jumlah tugas asinkron yang berjalan bersamaan (kompresi foto berat di memori ponsel). */
export const createLimiter = (max: number) => {
  let active = 0;
  const waiting: Array<() => void> = [];
  const release = () => {
    active -= 1;
    waiting.shift()?.();
  };
  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active >= max) await new Promise<void>((resolve) => waiting.push(resolve));
    active += 1;
    try {
      return await task();
    } finally {
      release();
    }
  };
};
