// src/lib/utils/kalibrasiLocations.ts
// Lokasi baris Kalibrasi pada tabel cetak (PDF) dan Excel tab Report. Modul murni agar bisa diuji langsung.

/** Pecah lokasi kalibrasi ("PSCP D, PSCP E" atau "PSCP D No.1 & 2") menjadi tempat-tempatnya. */
export const splitKalibrasiLocations = (lokasiStr: string): string[] => {
  if (!lokasiStr || lokasiStr === '-') return ['-'];
  if (lokasiStr.includes(',')) {
    return lokasiStr.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (lokasiStr.includes(' & ') && !lokasiStr.toUpperCase().includes('AVIO & BL')) {
    const parts = lokasiStr.split(' & ').map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      const matchPrefix = parts[0].match(/^(.*?)(\s+\bNo\.?\s*\d+|\s+\d+)/i);
      const prefix = matchPrefix ? matchPrefix[1].trim() : '';
      return parts.map((p, idx) => {
        if (idx > 0 && prefix && !p.toLowerCase().includes(prefix.toLowerCase())) {
          return `${prefix} ${p}`.trim();
        }
        return p;
      });
    }
  }
  return [lokasiStr.trim()];
};

/** "[tempat 1], [tempat 2] & [tempat terakhir]". */
export const joinLokasiList = (locations: string[]): string =>
  locations.length <= 1 ? (locations[0] ?? '') : `${locations.slice(0, -1).join(', ')} & ${locations[locations.length - 1]}`;

/** Termasuk ejaan "Acces Control" yang pernah dipakai pada data. */
const isAccessControl = (peralatan: unknown): boolean => /\bacc?ess?\s+control\b/i.test(String(peralatan ?? ''));

/**
 * Lokasi tiap baris cetak untuk satu laporan Kalibrasi. Peralatan pemeriksaan dipecah satu baris per tempat;
 * Access Control di beberapa tempat tetap satu baris dengan lokasi digabung.
 */
export const kalibrasiPrintLocations = (peralatan: unknown, lokasiStr: string): string[] => {
  const locations = splitKalibrasiLocations(lokasiStr);
  return isAccessControl(peralatan) && locations.length > 1 ? [joinLokasiList(locations)] : locations;
};
