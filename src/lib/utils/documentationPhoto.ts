// src/lib/utils/documentationPhoto.ts
// Penamaan folder & file foto dokumentasi (Kalibrasi/Storing/Perbaikan/Kegiatan) di Cloudinary.
// Fungsi murni: tidak menyentuh jaringan maupun DOM, jadi mudah diuji di Node.

export const DOCUMENTATION_ROOT_FOLDER = 'SSES_T2_Dokumentasi';

export const DOCUMENTATION_CATEGORIES = ['Kalibrasi', 'Storing', 'Perbaikan', 'Kegiatan'] as const;
export type DocumentationCategory = (typeof DOCUMENTATION_CATEGORIES)[number];

export const isDocumentationCategory = (value: unknown): value is DocumentationCategory =>
  typeof value === 'string' && (DOCUMENTATION_CATEGORIES as readonly string[]).includes(value);

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

/** Folder Cloudinary (asset_folder): SSES_T2_Dokumentasi/{Jenis}. */
export const buildDocumentationFolder = (category: DocumentationCategory): string => {
  if (!isDocumentationCategory(category)) throw new Error(`jenis dokumentasi tidak valid: ${String(category)}`);
  return `${DOCUMENTATION_ROOT_FOLDER}/${category}`;
};

/** Nama dasar tanpa ekstensi: {Jenis}_YYYY-MM-DD_HHmmss, memakai zona waktu lokal `date`. */
export const buildDocumentationBaseName = (category: DocumentationCategory, date: Date): string => {
  if (!isDocumentationCategory(category)) throw new Error(`jenis dokumentasi tidak valid: ${String(category)}`);
  if (Number.isNaN(date.getTime())) throw new Error('tanggal tidak valid');
  const ymd = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const hms = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${category}_${ymd}_${hms}`;
};

export interface DocumentationPhotoTarget {
  /** Nilai asset_folder. */
  folder: string;
  /** Nama file tanpa ekstensi. */
  fileName: string;
  /** public_id lengkap: akun memakai dynamic folder mode, jadi public_id memuat path folder agar tetap unik global. */
  publicId: string;
}

/** Akhiran urutan (_2, _3, ...) ditambahkan hanya bila public_id yang sama sudah ada di `used`. */
export const buildDocumentationPhotoTarget = (
  category: DocumentationCategory,
  date: Date,
  used: Set<string> = new Set(),
): DocumentationPhotoTarget => {
  const folder = buildDocumentationFolder(category);
  // `used` berisi public_id penuh agar jenis yang berbeda tidak saling memengaruhi.
  const base = buildDocumentationBaseName(category, date);
  let fileName = base;
  for (let n = 2; used.has(`${folder}/${fileName}`); n += 1) fileName = `${base}_${n}`;
  const publicId = `${folder}/${fileName}`;
  used.add(publicId);
  return { folder, fileName, publicId };
};

/** Pencatat nama yang sudah dipakai selama sesi browser (mencegah tabrakan pada detik yang sama). */
const sessionUsedPublicIds = new Set<string>();

export const nextDocumentationPhotoTarget = (
  category: DocumentationCategory,
  date: Date = new Date(),
): DocumentationPhotoTarget => buildDocumentationPhotoTarget(category, date, sessionUsedPublicIds);
