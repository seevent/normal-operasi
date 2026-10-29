// src/lib/utils/mediaRefs.ts
// Mengurai URL foto/video laporan menjadi rujukan berkas di penyimpanannya, untuk penghapusan permanen.
// Fungsi murni: tanpa jaringan/DOM, jadi mudah diuji di Node.

export type MediaRef =
  | { provider: 'cloudinary'; cloudName: string; resourceType: 'image' | 'video' | 'raw'; publicId: string }
  | { provider: 'supabase'; origin: string; bucket: string; path: string }
  | { provider: 'lain' };

const decode = (s: string): string => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// Segmen transformasi Cloudinary, mis. "c_limit,w_1280,h_1280" atau "vc_h264:main:3.1,ac_aac,q_auto".
// Tiap bagian dipisah koma berbentuk "<kunci pendek huruf kecil>_<nilai>".
const isTransformation = (segment: string): boolean =>
  segment.split(',').every((part) => /^[a-z]{1,3}_[^/]+$/.test(part));

/**
 * https://res.cloudinary.com/<cloud>/<image|video|raw>/upload/[transformasi/]*[v123/]<public_id>.<ext>
 * https://<proyek>.supabase.co/storage/v1/object/public/<bucket>/<path>
 */
export const mediaRefFromUrl = (url: string): MediaRef => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { provider: 'lain' };
  }

  if (parsed.hostname === 'res.cloudinary.com') {
    const [cloudName, resourceType, deliveryType, ...rest] = parsed.pathname.split('/').filter(Boolean);
    if (!cloudName || deliveryType !== 'upload' || !['image', 'video', 'raw'].includes(resourceType) || rest.length === 0) {
      return { provider: 'lain' };
    }
    const versionAt = rest.findIndex((s) => /^v\d+$/.test(s));
    let segments: string[];
    if (versionAt >= 0) {
      segments = rest.slice(versionAt + 1);
    } else {
      let i = 0;
      while (i < rest.length - 1 && isTransformation(rest[i])) i += 1;
      segments = rest.slice(i);
    }
    if (segments.length === 0) return { provider: 'lain' };
    const joined = decode(segments.join('/'));
    // Ekstensi bukan bagian public_id untuk image/video; untuk raw, ekstensi termasuk public_id.
    const publicId = resourceType === 'raw' ? joined : joined.replace(/\.[^./]+$/, '');
    return { provider: 'cloudinary', cloudName, resourceType: resourceType as 'image' | 'video' | 'raw', publicId };
  }

  const storage = parsed.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (storage && parsed.hostname.endsWith('.supabase.co')) {
    return { provider: 'supabase', origin: parsed.origin, bucket: decode(storage[1]), path: decode(storage[2]) };
  }

  return { provider: 'lain' };
};
