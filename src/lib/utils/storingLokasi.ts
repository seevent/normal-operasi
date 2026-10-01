// src/lib/utils/storingLokasi.ts
// Storing berbasis lokasi: memilih lokasi otomatis mencentang peralatan yang terpasang di sana.
// Access Control dan Mirroring X-Ray tetap alur tersendiri (peralatannya tunggal).
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

export const STORING_SPECIAL_EQUIPMENT = ['Access Control', 'Mirroring X-Ray'];

// Urutan tampil peralatan: X-Ray, WTMD, HHMD, Body Scanner, ETD, Extension Conveyor, lainnya.
const EQUIP_ORDER = ['x-ray', 'wtmd', 'hhmd', 'body scanner', 'etd', 'extension conveyor'];

export const sortStoringEquipment = (equipment: string[]): string[] =>
  [...equipment].sort((a, b) => {
    const ra = EQUIP_ORDER.indexOf(a.trim().toLowerCase());
    const rb = EQUIP_ORDER.indexOf(b.trim().toLowerCase());
    return (ra === -1 ? EQUIP_ORDER.length : ra) - (rb === -1 ? EQUIP_ORDER.length : rb) || a.localeCompare(b);
  });

/**
 * Peta lokasi -> daftar jenis peralatan di lokasi itu, dari data penempatan.
 * Baris Access Control dan Mirroring X-Ray diabaikan (alur tersendiri).
 */
export const buildLocationEquipmentMap = (penempatanData: any[]): Map<string, string[]> => {
  const map = new Map<string, Set<string>>();
  (penempatanData || []).forEach(p => {
    const lokasi = p?.lokasi?.nama;
    const jenis = p?.tipe_peralatan?.jenis_peralatan?.nama;
    if (!lokasi || !jenis) return;
    if (STORING_SPECIAL_EQUIPMENT.some(s => s.toLowerCase() === String(jenis).trim().toLowerCase())) return;
    if (!map.has(lokasi)) map.set(lokasi, new Set());
    map.get(lokasi)!.add(jenis);
  });
  const result = new Map<string, string[]>();
  Array.from(map.keys())
    .sort((a, b) => a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' }))
    .forEach(loc => result.set(loc, sortStoringEquipment(Array.from(map.get(loc)!))));
  return result;
};

/** Gabungan peralatan dari lokasi terpilih, dikurangi peralatan yang dikecualikan pengguna. */
export const deriveStoringEquipment = (
  selectedLocations: string[],
  locationMap: Map<string, string[]>,
  excluded: string[] = []
): string[] => {
  const union = new Set<string>();
  selectedLocations.forEach(loc => (locationMap.get(loc) || []).forEach(e => union.add(e)));
  return sortStoringEquipment(Array.from(union)).filter(e => !excluded.includes(e));
};
