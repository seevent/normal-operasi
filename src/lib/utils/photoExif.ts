// src/lib/utils/photoExif.ts
// Tanggal pengambilan foto dari EXIF JPEG dan pemeriksaan terhadap jendela periode Preventive.
// Murni (tanpa DOM) agar bisa diuji di Node. Hasilnya hanya untuk PERINGATAN, tidak pernah memblokir unggahan.

import { WIB_OFFSET_HOURS } from './preventivePeriod.ts';

const HOUR_MS = 60 * 60 * 1000;
/** EXIF tersimpan di awal berkas; cukup baca bagian awal agar foto besar tidak dimuat penuh ke memori. */
export const EXIF_READ_BYTES = 256 * 1024;

const ASCII_DATE = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/;

/**
 * Tanggal pengambilan (DateTimeOriginal, cadangan DateTime) dari JPEG, dalam epoch ms.
 * EXIF tidak menyimpan zona waktu; ponsel di lokasi kerja dianggap WIB.
 * Mengembalikan null bila bukan JPEG, tidak ada EXIF (screenshot, HEIC, hasil kompresi), atau rusak.
 */
export const readExifTakenAt = (buffer: ArrayBuffer): number | null => {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) return null;
      const marker = view.getUint8(offset + 1);
      if (marker === 0xda || marker === 0xd9) return null; // mulai data gambar: tidak ada EXIF
      const size = view.getUint16(offset + 2);
      if (marker === 0xe1 && view.getUint32(offset + 4) === 0x45786966 /* "Exif" */) {
        return parseTiff(view, offset + 10, Math.min(view.byteLength, offset + 2 + size));
      }
      offset += 2 + size;
    }
  } catch {
    return null;
  }
  return null;
};

const parseTiff = (view: DataView, base: number, end: number): number | null => {
  const order = view.getUint16(base);
  if (order !== 0x4949 && order !== 0x4d4d) return null;
  const le = order === 0x4949;
  if (view.getUint16(base + 2, le) !== 42) return null;

  const readAscii = (entry: number): string => {
    const count = view.getUint32(entry + 4, le);
    const at = count > 4 ? base + view.getUint32(entry + 8, le) : entry + 8;
    if (at < base || at + count > end) return '';
    let s = '';
    for (let i = 0; i < count; i++) s += String.fromCharCode(view.getUint8(at + i));
    return s;
  };

  /** Telusuri satu IFD; kembalikan nilai tag ASCII yang dicari dan pointer ExifIFD. */
  const scan = (ifd: number, wanted: number[]): { values: Map<number, string>; exifIfd: number | null } => {
    const values = new Map<number, string>();
    let exifIfd: number | null = null;
    const start = base + ifd;
    if (start + 2 > end) return { values, exifIfd };
    const n = view.getUint16(start, le);
    for (let i = 0; i < n; i++) {
      const entry = start + 2 + i * 12;
      if (entry + 12 > end) break;
      const tag = view.getUint16(entry, le);
      if (tag === 0x8769) exifIfd = view.getUint32(entry + 8, le);
      else if (wanted.includes(tag)) values.set(tag, readAscii(entry));
    }
    return { values, exifIfd };
  };

  const ifd0 = scan(view.getUint32(base + 4, le), [0x0132]);
  const exif = ifd0.exifIfd === null ? null : scan(ifd0.exifIfd, [0x9003]);
  const raw = exif?.values.get(0x9003) || ifd0.values.get(0x0132) || '';
  const m = ASCII_DATE.exec(raw);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number);
  if (y < 1990 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return Date.UTC(y, mo - 1, d, h, mi, s) - WIB_OFFSET_HOURS * HOUR_MS;
};

const DAY_MS = 24 * HOUR_MS;
const WA_COMPACT = /(?:IMG|VID|PTT|AUD|DOC|STK)-(\d{4})(\d{2})(\d{2})-WA\d+/i;
const WA_LONG = /WhatsApp (?:Image|Video) (\d{4})-(\d{2})-(\d{2}) at (\d{2})\.(\d{2})\.(\d{2})/i;

/**
 * Rentang waktu dari nama berkas unduhan WhatsApp (foto WA tidak punya EXIF). Ini tanggal pesan DITERIMA, bukan foto diambil.
 * 'IMG-20261020-WA0001.jpg' hanya memuat tanggal -> seluruh hari itu (WIB); 'WhatsApp Image 2026-10-20 at 09.30.15.jpeg' memuat jam.
 */
export const whatsappNameRange = (name: string): [number, number] | null => {
  const valid = (y: number, mo: number, d: number) => y >= 2000 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31;
  const long = WA_LONG.exec(name);
  if (long) {
    const [y, mo, d, h, mi, sec] = long.slice(1).map(Number);
    if (!valid(y, mo, d)) return null;
    const at = Date.UTC(y, mo - 1, d, h, mi, sec) - WIB_OFFSET_HOURS * HOUR_MS;
    return [at, at];
  }
  const compact = WA_COMPACT.exec(name);
  if (compact) {
    const [y, mo, d] = compact.slice(1).map(Number);
    if (!valid(y, mo, d)) return null;
    const dayStart = Date.UTC(y, mo - 1, d) - WIB_OFFSET_HOURS * HOUR_MS;
    return [dayStart, dayStart + DAY_MS];
  }
  return null;
};

const fmtWib = (ms: number): string =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date(ms));

/**
 * Peringatan bila foto diambil di luar periode berjalan; null bila wajar.
 * Jendela: dari awal periode (kunci 'YYYY-MM-DD' pukul 07.00 WIB) sampai reset berikutnya, ditambah toleransi 1 jam.
 */
export const photoDateWarning = (takenAt: number | null, periodKey: string, nextResetMs: number, opts: { heic?: boolean; nameRange?: [number, number] | null } = {}): string | null => {
  const startMs = Date.parse(`${periodKey}T00:00:00Z`); // 07.00 WIB = 00.00 UTC
  const tolerance = HOUR_MS;
  // Foto WhatsApp tanpa EXIF: pakai tanggal pada nama berkas sebagai cadangan.
  if (takenAt === null && opts.nameRange) {
    const [from, to] = opts.nameRange;
    if (to < startMs - tolerance || from > nextResetMs + tolerance) {
      return `Nama berkas WhatsApp menunjukkan tanggal ${fmtWib(from)} WIB, di luar periode ini. Tetap tersimpan; pastikan bukan foto lama.`;
    }
    return null;
  }
  // HEIC tidak dibaca EXIF-nya di sini, jadi "tanpa tanggal" bukan tanda foto mencurigakan.
  if (takenAt === null && opts.heic) return null;
  if (takenAt === null) return 'Foto tidak memuat tanggal pengambilan (mis. screenshot). Pastikan ini foto terbaru dari peralatan.';
  if (takenAt < startMs - tolerance || takenAt > nextResetMs + tolerance) {
    return `Foto diambil ${fmtWib(takenAt)} WIB, di luar periode ini. Tetap tersimpan; pastikan bukan foto lama.`;
  }
  return null;
};
