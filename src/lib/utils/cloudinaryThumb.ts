// src/lib/utils/cloudinaryThumb.ts
// URL thumbnail kecil untuk foto Cloudinary: Cloudinary memotong & memperkecil gambar di CDN,
// sehingga daftar Preventive tidak mengunduh foto 1280 px penuh untuk setiap baris.
// Fungsi murni: tanpa jaringan/DOM, jadi mudah diuji di Node.

const MARKER = '/image/upload/';

/**
 * Sisipkan transformasi persegi (crop fill) setelah `/image/upload/`.
 * URL selain Cloudinary image (Supabase, Drive, video, tidak valid) dikembalikan apa adanya.
 */
export const cloudinaryThumbUrl = (url: string, size: number): string => {
  const px = Math.round(size);
  if (!Number.isFinite(px) || px <= 0) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.hostname !== 'res.cloudinary.com') return url;
  const at = url.indexOf(MARKER);
  if (at < 0) return url;
  const head = url.slice(0, at + MARKER.length);
  return `${head}c_fill,w_${px},h_${px},q_auto,f_auto/${url.slice(at + MARKER.length)}`;
};
