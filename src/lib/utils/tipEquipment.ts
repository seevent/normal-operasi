// src/lib/utils/tipEquipment.ts
// Daftar unit X-Ray untuk tab TIP, diturunkan dari master Checklist, dan penyaringannya dengan
// pengaturan Config TIP (kunci unit yang disembunyikan). Fungsi murni agar bisa diuji di Node.

export interface TipUnit {
  /** `<id lokasi>-<label>`, sama dengan kunci centang TIP bulanan. */
  key: string;
  /** Teks dalam kurung pada nama item (mis. "1.1"); tanpa kurung = "No1". */
  label: string;
  /** Nama item lengkap dari master Checklist. */
  name: string;
}

export interface TipLocation {
  id: string;
  name: string;
  units: TipUnit[];
}

export interface TipCategory {
  id: string;
  name: string;
  items: string[];
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const locationId = (title: string): string => title.toLowerCase().replace(/\s+/g, '_');
const unitLabel = (item: string): string => item.match(/\(([^)]+)\)/)?.[1] ?? 'No1';

const toLocation = (title: unknown, categories: unknown): TipLocation | null => {
  if (typeof title !== 'string' || !title) return null;
  const xray = arr(categories).find(
    (c) => isObj(c) && typeof c.summaryKey === 'string' && c.summaryKey.toUpperCase().includes('X-RAY'),
  ) as Obj | undefined;
  const id = locationId(title);
  const seen = new Set<string>();
  const units: TipUnit[] = [];
  for (const item of arr(xray?.items)) {
    if (typeof item !== 'string') continue;
    const label = unitLabel(item);
    const key = `${id}-${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    units.push({ key, label, name: item });
  }
  return units.length > 0 ? { id, name: title, units } : null;
};

/** Semua lokasi yang punya kategori X-RAY berisi item, dalam urutan master Checklist. */
export const buildTipLocations = (checklistMaster: unknown): TipLocation[] => {
  const out: TipLocation[] = [];
  for (const block of arr(checklistMaster)) {
    if (!isObj(block)) continue;
    if (block.type === 'location') {
      const loc = toLocation(block.title, block.categories);
      if (loc) out.push(loc);
    } else if (block.type === 'group') {
      for (const sub of arr(block.locations)) {
        if (!isObj(sub)) continue;
        const loc = toLocation(sub.title, sub.categories);
        if (loc) out.push(loc);
      }
    }
  }
  return out;
};

/** Bentuk yang dipakai tab TIP; unit tersembunyi dibuang, lokasi tanpa unit tampil tidak ikut. */
export const visibleTipCategories = (locations: TipLocation[], hiddenKeys: readonly string[]): TipCategory[] => {
  const hidden = new Set(hiddenKeys);
  return locations
    .map((loc) => ({ id: loc.id, name: loc.name, items: loc.units.filter((u) => !hidden.has(u.key)).map((u) => u.label) }))
    .filter((cat) => cat.items.length > 0);
};

/** Jumlah unit tampil yang sudah dicentang (unit tersembunyi tidak dihitung). */
export const countCheckedVisible = (
  tipData: Record<string, { checked?: boolean } | undefined>,
  categories: Pick<TipCategory, 'id' | 'items'>[],
): number =>
  categories.reduce((sum, cat) => sum + cat.items.filter((label) => tipData[`${cat.id}-${label}`]?.checked).length, 0);

export const tipProgressPercent = (checked: number, total: number): number =>
  total > 0 ? Math.round((checked / total) * 100) : 0;
