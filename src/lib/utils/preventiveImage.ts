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
