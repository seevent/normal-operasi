// src/lib/utils/preventiveGrouping.ts
// Pengelompokan, pencarian, dan filter daftar aset tab Preventive:
//   - Access Control System: tipe aset -> lokasi -> aset (groupAssets).
//   - Peralatan pemeriksaan (X-Ray, WTMD, ETD, HHMD, Body Scanner): tempat -> tipe aset -> aset (groupAssetsByPlace).
// Modul murni agar bisa diuji langsung.

import { PERIOD_CODE, PREVENTIVE_ASSET_TYPES } from '../data/preventiveTypes.ts';
import type { PreventiveAssetType, PreventivePeriod } from '../data/preventiveTypes.ts';

export const UNMAPPED_LOCATION = 'Lokasi belum terpetakan';

export type RowStatus = 'idle' | 'uploading' | 'saved' | 'failed';
export type StatusFilter = 'all' | 'belum' | 'gagal' | 'tersimpan';

export interface PreventiveAsset {
  equipmentNumber: string;
  name: string;
  assetType: string;
  locationGroup: string;
  locationOverride?: string | null;
  /** Kode periode terjadwal di PRIMA, misal ['D','W','M','3M']. */
  periods: string[];
  active: boolean;
}

export interface LocationGroup {
  location: string;
  /** Jumlah aset lokasi ini pada periode terpilih (tidak terpengaruh pencarian/filter). */
  total: number;
  saved: number;
  /** Aset yang lolos pencarian dan filter. */
  assets: PreventiveAsset[];
}

export interface TypeGroup {
  assetType: string;
  total: number;
  saved: number;
  locations: LocationGroup[];
}

export interface GroupOptions {
  query: string;
  filter: StatusFilter;
}

const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });

export const effectiveLocation = (asset: Pick<PreventiveAsset, 'locationGroup' | 'locationOverride'>): string =>
  asset.locationOverride?.trim() || asset.locationGroup;

/** Aset aktif yang terjadwal pada periode ini di PRIMA. */
export const assetsForPeriod = (assets: PreventiveAsset[], period: PreventivePeriod): PreventiveAsset[] =>
  assets.filter((a) => a.active && a.periods.includes(PERIOD_CODE[period]));

const matchesQuery = (asset: PreventiveAsset, q: string): boolean =>
  asset.equipmentNumber.toLowerCase().includes(q) ||
  asset.name.toLowerCase().includes(q) ||
  effectiveLocation(asset).toLowerCase().includes(q);

const matchesFilter = (status: RowStatus, filter: StatusFilter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'belum') return status !== 'saved';
  if (filter === 'gagal') return status === 'failed';
  return status === 'saved';
};

const compareLocation = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a === UNMAPPED_LOCATION) return 1;
  if (b === UNMAPPED_LOCATION) return -1;
  return collator.compare(a, b);
};

const typeRank = (assetType: string): number => {
  const i = (PREVENTIVE_ASSET_TYPES as readonly string[]).indexOf(assetType);
  return i === -1 ? PREVENTIVE_ASSET_TYPES.length : i;
};

export const groupAssets = (
  assets: PreventiveAsset[],
  period: PreventivePeriod,
  statusOf: (asset: PreventiveAsset) => RowStatus,
  options: GroupOptions,
): TypeGroup[] => {
  const q = options.query.trim().toLowerCase();
  const byType = new Map<string, Map<string, { all: PreventiveAsset[]; visible: PreventiveAsset[] }>>();

  for (const asset of assetsForPeriod(assets, period)) {
    const loc = effectiveLocation(asset);
    let locMap = byType.get(asset.assetType);
    if (!locMap) byType.set(asset.assetType, (locMap = new Map()));
    let bucket = locMap.get(loc);
    if (!bucket) locMap.set(loc, (bucket = { all: [], visible: [] }));
    bucket.all.push(asset);
    if ((q === '' || matchesQuery(asset, q)) && matchesFilter(statusOf(asset), options.filter)) {
      bucket.visible.push(asset);
    }
  }

  const groups: TypeGroup[] = [];
  for (const [assetType, locMap] of byType) {
    const locations: LocationGroup[] = [];
    let total = 0;
    let saved = 0;
    for (const [location, bucket] of locMap) {
      const locSaved = bucket.all.filter((a) => statusOf(a) === 'saved').length;
      total += bucket.all.length;
      saved += locSaved;
      if (bucket.visible.length === 0) continue;
      locations.push({
        location,
        total: bucket.all.length,
        saved: locSaved,
        assets: [...bucket.visible].sort((x, y) => collator.compare(x.name, y.name) || x.equipmentNumber.localeCompare(y.equipmentNumber)),
      });
    }
    if (locations.length === 0) continue;
    locations.sort((x, y) => compareLocation(x.location, y.location));
    groups.push({ assetType, total, saved, locations });
  }

  return groups.sort((x, y) => typeRank(x.assetType) - typeRank(y.assetType) || x.assetType.localeCompare(y.assetType));
};

/** Peralatan pemeriksaan yang disusun per tempat, dalam urutan tampil di dalam tempat. */
export const PLACE_ASSET_TYPES = [
  'X-RAY KABIN',
  'X-RAY BAGASI',
  'WALK THROUGH METAL DETECTOR',
  'ETD DESKTOP',
  'HANDHELD METAL DETECTOR',
  'BODY SCANNER',
] as const;

export const isPlaceAssetType = (assetType: string): boolean => (PLACE_ASSET_TYPES as readonly string[]).includes(assetType);

/** Urutan tempat mengikuti alur di lapangan; tempat lain menyusul menurut abjad. */
export const PLACE_ORDER = [
  'PSCP D', 'PSCP E', 'PSCP F', 'PSCP Umrah',
  'SSCP E', 'SSCP F',
  'Transfer Desk D', 'Transfer Desk E',
  'HBSCP', 'HBSCP Umrah',
  'Breakdown Umrah', 'Red Lane', 'Arrival F',
] as const;

const PLACE_PREFIX: Record<string, string> = { pscp: 'PSCP', sscp: 'SSCP', 'transfer desk': 'Transfer Desk' };

/** "PSCP 2D" dan "PSCP D" adalah tempat yang sama; begitu juga 2E/2F, SSCP 2E/2F, Transfer Desk 2D/2E. */
export const canonicalPlace = (location: string): string => {
  const m = location.trim().match(/^(PSCP|SSCP|Transfer\s+Desk)\s+2?\s*([DEF])$/i);
  return m ? `${PLACE_PREFIX[m[1].toLowerCase().replace(/\s+/g, ' ')]} ${m[2].toUpperCase()}` : location.trim();
};

const placeRank = (location: string): number => {
  const i = (PLACE_ORDER as readonly string[]).indexOf(location);
  return i === -1 ? PLACE_ORDER.length : i;
};

const comparePlace = (a: string, b: string): number => {
  if (a === UNMAPPED_LOCATION || b === UNMAPPED_LOCATION) return compareLocation(a, b);
  return placeRank(a) - placeRank(b) || collator.compare(a, b);
};

export interface PlaceTypeSection {
  assetType: string;
  /** Jumlah aset jenis ini di tempat ini pada periode terpilih (tidak terpengaruh pencarian/filter). */
  total: number;
  saved: number;
  /** Aset yang lolos pencarian dan filter. */
  assets: PreventiveAsset[];
}

export interface PlaceGroup {
  location: string;
  total: number;
  saved: number;
  types: PlaceTypeSection[];
}

/** Peralatan pemeriksaan per tempat: tempat -> tipe aset -> aset. Access Control System tidak termasuk. */
export const groupAssetsByPlace = (
  assets: PreventiveAsset[],
  period: PreventivePeriod,
  statusOf: (asset: PreventiveAsset) => RowStatus,
  options: GroupOptions,
): PlaceGroup[] => {
  const q = options.query.trim().toLowerCase();
  const byPlace = new Map<string, Map<string, { all: PreventiveAsset[]; visible: PreventiveAsset[] }>>();

  for (const asset of assetsForPeriod(assets, period)) {
    if (!isPlaceAssetType(asset.assetType)) continue;
    const place = canonicalPlace(effectiveLocation(asset));
    let typeMap = byPlace.get(place);
    if (!typeMap) byPlace.set(place, (typeMap = new Map()));
    let bucket = typeMap.get(asset.assetType);
    if (!bucket) typeMap.set(asset.assetType, (bucket = { all: [], visible: [] }));
    bucket.all.push(asset);
    if ((q === '' || matchesQuery(asset, q)) && matchesFilter(statusOf(asset), options.filter)) {
      bucket.visible.push(asset);
    }
  }

  const places: PlaceGroup[] = [];
  for (const [location, typeMap] of byPlace) {
    const types: PlaceTypeSection[] = [];
    let total = 0;
    let saved = 0;
    for (const [assetType, bucket] of typeMap) {
      const typeSaved = bucket.all.filter((a) => statusOf(a) === 'saved').length;
      total += bucket.all.length;
      saved += typeSaved;
      if (bucket.visible.length === 0) continue;
      types.push({
        assetType,
        total: bucket.all.length,
        saved: typeSaved,
        assets: [...bucket.visible].sort((x, y) => collator.compare(x.name, y.name) || x.equipmentNumber.localeCompare(y.equipmentNumber)),
      });
    }
    if (types.length === 0) continue;
    const order = PLACE_ASSET_TYPES as readonly string[];
    types.sort((x, y) => order.indexOf(x.assetType) - order.indexOf(y.assetType));
    places.push({ location, total, saved, types });
  }

  return places.sort((x, y) => comparePlace(x.location, y.location));
};

export interface Summary {
  total: number;
  saved: number;
  failed: number;
  uploading: number;
  pending: number;
}

export const summarize = (
  assets: PreventiveAsset[],
  period: PreventivePeriod,
  statusOf: (asset: PreventiveAsset) => RowStatus,
): Summary => {
  const s: Summary = { total: 0, saved: 0, failed: 0, uploading: 0, pending: 0 };
  for (const asset of assetsForPeriod(assets, period)) {
    s.total += 1;
    const st = statusOf(asset);
    if (st === 'saved') s.saved += 1;
    else if (st === 'failed') s.failed += 1;
    else if (st === 'uploading') s.uploading += 1;
    else s.pending += 1;
  }
  return s;
};

export type { PreventiveAssetType };
