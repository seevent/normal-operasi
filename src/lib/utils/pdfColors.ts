// src/lib/utils/pdfColors.ts
// html2canvas 1.4.1 (dipakai html2pdf.js) gagal dengan "unsupported color function" saat bertemu warna
// CSS modern seperti oklch() milik Tailwind v4, sehingga PDF tidak terbuat sama sekali. Sebelum html2canvas
// membaca gaya, warna-warna itu di salinan dokumen diganti dengan rgb()/rgba() yang setara.

/** Fungsi warna yang tidak dikenali html2canvas 1.4.1. */
const MODERN_COLOR = /\b(?:oklch|oklab|lab|lch|color-mix|color)\(/gi;

/** Properti yang warnanya diurai html2canvas (lihat CSSParsedDeclaration). */
export const HTML2CANVAS_COLOR_PROPERTIES = [
  'background-color',
  'background-image',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'box-shadow',
  'color',
  'text-decoration-color',
  'text-shadow',
  'list-style-image',
  '-webkit-text-stroke-color',
] as const;

export const hasModernColor = (value: string): boolean => {
  MODERN_COLOR.lastIndex = 0;
  return MODERN_COLOR.test(value);
};

/**
 * Mengganti setiap fungsi warna modern di dalam nilai CSS (termasuk yang bersarang, mis. di dalam
 * box-shadow atau gradien) dengan hasil `toRgb`. Bagian lain nilai dibiarkan apa adanya.
 */
export const replaceModernColors = (value: string, toRgb: (color: string) => string): string => {
  let out = '';
  let i = 0;
  MODERN_COLOR.lastIndex = 0;
  for (let m = MODERN_COLOR.exec(value); m; m = MODERN_COLOR.exec(value)) {
    // Cari kurung tutup pasangannya
    let depth = 0;
    let end = m.index + m[0].length - 1;
    for (; end < value.length; end++) {
      if (value[end] === '(') depth++;
      else if (value[end] === ')' && --depth === 0) break;
    }
    if (end >= value.length) break; // kurung tidak lengkap: biarkan
    out += value.slice(i, m.index) + toRgb(value.slice(m.index, end + 1));
    i = end + 1;
    MODERN_COLOR.lastIndex = i;
  }
  return out + value.slice(i);
};

/** Pengubah warna CSS apa pun ke rgb()/rgba() lewat kanvas 1x1 (browser yang menghitung konversinya). */
const createCanvasColorConverter = (doc: Document): ((color: string) => string) => {
  const canvas = doc.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const cache = new Map<string, string>();
  return (color: string) => {
    const hit = cache.get(color);
    if (hit) return hit;
    let rgb = 'rgba(0, 0, 0, 0)';
    if (ctx) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      rgb = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
    }
    cache.set(color, rgb);
    return rgb;
  };
};

/**
 * Menulis ulang warna modern pada `root` (dan seluruh turunannya bila `deep`) sebagai gaya inline rgb().
 * Dipanggil pada salinan dokumen html2canvas (onclone), sehingga halaman asli tidak berubah.
 */
export const inlineLegacyColors = (root: Element, deep = true): void => {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  if (!view) return;
  const toRgb = createCanvasColorConverter(document);
  const elements = deep ? [root, ...Array.from(root.querySelectorAll('*'))] : [root];
  for (const el of elements) {
    // Jangan pakai instanceof: html2canvas memindahkan node dari dokumen asli ke iframe salinan,
    // sehingga prototipenya berasal dari jendela lain.
    const style = (el as HTMLElement).style;
    if (!style) continue;
    const cs = view.getComputedStyle(el);
    for (const prop of HTML2CANVAS_COLOR_PROPERTIES) {
      const value = cs.getPropertyValue(prop);
      if (value && hasModernColor(value)) {
        style.setProperty(prop, replaceModernColors(value, toRgb), 'important');
      }
    }
  }
};
