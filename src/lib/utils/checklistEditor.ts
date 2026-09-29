/**
 * Fungsi murni untuk Editor Konfigurasi Checklist: pengurutan, penghitungan,
 * pencarian, dan pemberian ID tampilan. Tidak menyentuh React maupun store,
 * sehingga bisa diuji langsung.
 */

export type ChecklistBlockType = 'location' | 'group' | 'access_control';

export interface ChecklistCategory {
  _id?: string;
  title?: string;
  summaryKey?: string;
  items?: string[];
}

/** Lokasi di dalam blok grup, atau terminal di dalam blok access control. */
export interface ChecklistSubGroup {
  _id?: string;
  title?: string;
  categories?: ChecklistCategory[];
}

export interface ChecklistBlock {
  _id?: string;
  type: ChecklistBlockType;
  title?: string;
  summary?: string;
  categories?: ChecklistCategory[];
  locations?: ChecklistSubGroup[];
  terminals?: ChecklistSubGroup[];
}

export interface ChecklistStats {
  subGroups: number;
  categories: number;
  items: number;
}

// ---------------------------------------------------------------------------
// ID tampilan
// ---------------------------------------------------------------------------
// `_id` hanya hidup di state editor: memberi React key yang stabil saat item
// diurutkan ulang, sehingga status buka/tutup tidak "loncat" ke item lain.
// Selalu dibuang lewat stripIds() sebelum disimpan atau dibandingkan.

let idSequence = 0;
export const newId = (): string => `cl${++idSequence}_${Math.random().toString(36).slice(2, 7)}`;

export const assignIds = (blocks: ChecklistBlock[] | null | undefined): ChecklistBlock[] => {
  const clone: ChecklistBlock[] = JSON.parse(JSON.stringify(blocks ?? []));
  for (const block of clone) {
    block._id = newId();
    (block.categories ?? []).forEach((c) => (c._id = newId()));
    for (const group of [...(block.locations ?? []), ...(block.terminals ?? [])]) {
      group._id = newId();
      (group.categories ?? []).forEach((c) => (c._id = newId()));
    }
  }
  return clone;
};

export const stripIds = (blocks: ChecklistBlock[]): ChecklistBlock[] =>
  JSON.parse(JSON.stringify(blocks, (key, value) => (key === '_id' ? undefined : value)));

/** Perubahan yang belum disimpan = isi editor (tanpa ID) berbeda dari yang tersimpan. */
export const isChecklistDirty = (current: ChecklistBlock[], saved: ChecklistBlock[]): boolean =>
  JSON.stringify(stripIds(current)) !== JSON.stringify(saved ?? []);

// ---------------------------------------------------------------------------
// Operasi larik (tidak mengubah larik asli)
// ---------------------------------------------------------------------------

export const moveItem = <T>(list: readonly T[], index: number, direction: 'up' | 'down'): T[] => {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export const removeAt = <T>(list: readonly T[], index: number): T[] => list.filter((_, i) => i !== index);

export const replaceAt = <T>(list: readonly T[], index: number, patch: Partial<T>): T[] =>
  list.map((item, i) => (i === index ? { ...item, ...patch } : item));

// ---------------------------------------------------------------------------
// Daftar alat (satu baris = satu alat)
// ---------------------------------------------------------------------------

/** Membuang baris kosong, tanpa memotong spasi agar caret tidak melompat saat mengetik. */
export const parseItems = (text: string): string[] => text.split('\n').filter((line) => line.trim() !== '');

/** Merapikan daftar saat kolom kehilangan fokus. */
export const normalizeItems = (items: readonly string[]): string[] =>
  items.map((item) => item.trim()).filter((item) => item !== '');

// ---------------------------------------------------------------------------
// Penghitungan
// ---------------------------------------------------------------------------

export const getSubGroups = (block: ChecklistBlock): ChecklistSubGroup[] =>
  block.type === 'group' ? block.locations ?? [] : block.type === 'access_control' ? block.terminals ?? [] : [];

export const getAllCategories = (block: ChecklistBlock): ChecklistCategory[] =>
  block.type === 'location' ? block.categories ?? [] : getSubGroups(block).flatMap((g) => g.categories ?? []);

export const countItems = (categories: readonly ChecklistCategory[]): number =>
  categories.reduce((total, c) => total + (c.items?.length ?? 0), 0);

export const countBlock = (block: ChecklistBlock): ChecklistStats => {
  const categories = getAllCategories(block);
  return { subGroups: getSubGroups(block).length, categories: categories.length, items: countItems(categories) };
};

export const sumStats = (blocks: readonly ChecklistBlock[]): ChecklistStats & { blocks: number } =>
  blocks.reduce(
    (acc, block) => {
      const s = countBlock(block);
      return {
        blocks: acc.blocks + 1,
        subGroups: acc.subGroups + s.subGroups,
        categories: acc.categories + s.categories,
        items: acc.items + s.items,
      };
    },
    { blocks: 0, subGroups: 0, categories: 0, items: 0 }
  );

/**
 * Jumlah kategori pada blok lokasi/grup yang Summary Key-nya kosong.
 * Generator WhatsApp memakai Summary Key sebagai label rekap; bila kosong,
 * barisnya tercetak sebagai "undefined". Blok access control tidak memakainya.
 */
export const countMissingSummaryKeys = (block: ChecklistBlock): number =>
  block.type === 'access_control' ? 0 : getAllCategories(block).filter((c) => !(c.summaryKey ?? '').trim()).length;

// ---------------------------------------------------------------------------
// Tampilan
// ---------------------------------------------------------------------------

export const BLOCK_TYPE_LABEL: Record<ChecklistBlockType, string> = {
  location: 'Lokasi',
  group: 'Grup',
  access_control: 'Access Control',
};

export const blockTitle = (block: ChecklistBlock): string =>
  (block.type === 'group' ? block.summary || block.title : block.title || block.summary) || 'Tanpa nama';

// ---------------------------------------------------------------------------
// Pencarian
// ---------------------------------------------------------------------------

const has = (value: unknown, q: string): boolean => typeof value === 'string' && value.toLowerCase().includes(q);

export const normalizeQuery = (query: string): string => query.trim().toLowerCase();

export const categoryMatches = (c: ChecklistCategory, q: string): boolean =>
  has(c.title, q) || has(c.summaryKey, q) || (c.items ?? []).some((item) => has(item, q));

export const subGroupMatches = (g: ChecklistSubGroup, q: string): boolean =>
  has(g.title, q) || (g.categories ?? []).some((c) => categoryMatches(c, q));

export const blockMatches = (block: ChecklistBlock, query: string): boolean => {
  const q = normalizeQuery(query);
  if (!q) return true;
  return (
    has(block.title, q) ||
    has(block.summary, q) ||
    (block.categories ?? []).some((c) => categoryMatches(c, q)) ||
    getSubGroups(block).some((g) => subGroupMatches(g, q))
  );
};

/** ID semua node yang cocok beserta induknya, untuk dibuka otomatis saat mencari. */
export const collectMatchIds = (blocks: readonly ChecklistBlock[], query: string): string[] => {
  const q = normalizeQuery(query);
  if (!q) return [];
  const ids: string[] = [];
  const push = (id?: string) => id && ids.push(id);

  for (const block of blocks) {
    if (!blockMatches(block, q)) continue;
    push(block._id);
    (block.categories ?? []).filter((c) => categoryMatches(c, q)).forEach((c) => push(c._id));
    for (const group of getSubGroups(block).filter((g) => subGroupMatches(g, q))) {
      push(group._id);
      (group.categories ?? []).filter((c) => categoryMatches(c, q)).forEach((c) => push(c._id));
    }
  }
  return ids;
};

export const collectAllIds = (blocks: readonly ChecklistBlock[]): string[] => {
  const ids: string[] = [];
  const push = (id?: string) => id && ids.push(id);
  for (const block of blocks) {
    push(block._id);
    (block.categories ?? []).forEach((c) => push(c._id));
    for (const group of getSubGroups(block)) {
      push(group._id);
      (group.categories ?? []).forEach((c) => push(c._id));
    }
  }
  return ids;
};

// ---------------------------------------------------------------------------
// Pabrik item baru (isi bawaan sama dengan editor sebelumnya)
// ---------------------------------------------------------------------------

export const newCategory = (): ChecklistCategory => ({ _id: newId(), title: '', summaryKey: '', items: [] });

export const newSubGroup = (kind: 'location' | 'terminal'): ChecklistSubGroup => ({
  _id: newId(),
  title: kind === 'location' ? 'Lokasi Baru' : 'Terminal Baru',
  categories: [],
});

export const newBlock = (type: ChecklistBlockType): ChecklistBlock => {
  if (type === 'location') return { _id: newId(), type, title: 'Lokasi Baru', summary: '', categories: [] };
  if (type === 'group') return { _id: newId(), type, summary: 'Grup Baru', locations: [] };
  return { _id: newId(), type, title: 'Access Control Baru', summary: '', terminals: [] };
};
