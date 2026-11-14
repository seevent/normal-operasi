// src/lib/utils/preventiveAssetAdmin.ts
// Aturan kelola peralatan Preventive (tab Data > Peralatan Preventive): validasi isian aset,
// nama berkas QR di Cloudinary, dan rekonsiliasi QR. Modul murni agar bisa diuji langsung
// dan dipakai bersama oleh browser dan server.

import { PREVENTIVE_ASSET_TYPES } from '../data/preventiveTypes.ts';
import { isValidEquipmentNumber } from './preventivePeriod.ts';

/** Kode jadwal PRIMA yang dipakai di prima_assets.periods, urut seperti kolom jadwal PRIMA. */
export const PERIOD_CODES = ['D', 'W', 'M', '3M', '4M', '6M', '1Y', '2Y'] as const;

export interface AssetDraft {
  equipmentNumber: string;
  name: string;
  assetType: string;
  locationGroup: string;
  locationOverride: string;
  periods: string[];
  active: boolean;
}

/** Baris siap tulis ke prima_assets, atau daftar kesalahan isian. */
export type AssetValidation =
  | {
      ok: true;
      row: {
        equipment_number: string;
        name: string;
        asset_type: string;
        location_group: string;
        location_override: string | null;
        periods: string[];
        active: boolean;
      };
    }
  | { ok: false; errors: Partial<Record<keyof AssetDraft, string>> };

const squash = (s: string): string => s.replace(/\s+/g, ' ').trim();

export const validateAssetDraft = (draft: AssetDraft): AssetValidation => {
  const equipmentNumber = draft.equipmentNumber.trim().toUpperCase();
  const name = squash(draft.name);
  const locationGroup = squash(draft.locationGroup);
  const errors: Partial<Record<keyof AssetDraft, string>> = {};
  if (!isValidEquipmentNumber(equipmentNumber)) errors.equipmentNumber = 'Format: ESE diikuti 12 angka, sama dengan PRIMA.';
  if (!name) errors.name = 'Nama peralatan wajib diisi.';
  if (!(PREVENTIVE_ASSET_TYPES as readonly string[]).includes(draft.assetType)) errors.assetType = 'Pilih tipe peralatan.';
  if (!locationGroup) errors.locationGroup = 'Lokasi wajib diisi.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    row: {
      equipment_number: equipmentNumber,
      name,
      asset_type: draft.assetType,
      location_group: locationGroup,
      location_override: squash(draft.locationOverride) || null,
      // Urutan tetap mengikuti PRIMA; kode lain yang sudah tersimpan (bila ada) dipertahankan di belakang.
      periods: [
        ...PERIOD_CODES.filter((c) => draft.periods.includes(c)),
        ...draft.periods.filter((c) => !(PERIOD_CODES as readonly string[]).includes(c)),
      ],
      active: draft.active,
    },
  };
};

/** Bagian nama berkas QR dari nama aset, gaya berkas yang sudah ada: "X-Ray Kabin SSCP E" -> "X_Ray_Kabin_SSCP_E". */
export const qrNameSlug = (name: string): string =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
    .replace(/_+$/, '');

/** public_id QR baru: PRIMA/QR CODE/{TIPE}/{NO}_{Nama}. Pencocokan QR ↔ aset hanya memakai {NO}. */
export const buildQrPublicId = (assetType: string, equipmentNumber: string, name: string): string => {
  const slug = qrNameSlug(name);
  return `PRIMA/QR CODE/${assetType}/${equipmentNumber}${slug ? `_${slug}` : ''}`;
};

export interface QrCheckRow {
  equipmentNumber: string;
  name: string;
  /** qr_target di database sebelum pemeriksaan. */
  stored: string | null;
  /** Isi QR hasil decode gambar; null bila gambar ada tetapi QR tidak terbaca. */
  decoded: string | null;
  hasImage: boolean;
}

export interface QrCheckReport {
  /** Gambar ada dan terbaca, isi sama dengan database. */
  match: number;
  /** Database perlu diisi/diperbarui dengan hasil decode. */
  toUpdate: { equipmentNumber: string; qrTarget: string }[];
  /** Aset tanpa gambar QR di Cloudinary. */
  noImage: string[];
  /** Gambar ada, QR tidak terbaca. */
  unreadable: string[];
  /** Isi QR yang sama dipakai lebih dari satu peralatan: tidak ditulis ke database. */
  duplicates: { qrTarget: string; equipmentNumbers: string[] }[];
}

/** Bandingkan isi QR hasil decode dengan qr_target tersimpan. QR ganda tidak pernah ditulis. */
export const reconcileQr = (rows: QrCheckRow[]): QrCheckReport => {
  const byTarget = new Map<string, string[]>();
  for (const r of rows) {
    if (r.decoded) byTarget.set(r.decoded, [...(byTarget.get(r.decoded) ?? []), r.equipmentNumber]);
  }
  const duplicates = [...byTarget]
    .filter(([, eqs]) => eqs.length > 1)
    .map(([qrTarget, equipmentNumbers]) => ({ qrTarget, equipmentNumbers }));
  const dupSet = new Set(duplicates.map((d) => d.qrTarget));

  const report: QrCheckReport = { match: 0, toUpdate: [], noImage: [], unreadable: [], duplicates };
  for (const r of rows) {
    if (!r.hasImage) report.noImage.push(r.equipmentNumber);
    else if (!r.decoded) report.unreadable.push(r.equipmentNumber);
    else if (dupSet.has(r.decoded)) continue;
    else if (r.decoded === r.stored) report.match++;
    else report.toUpdate.push({ equipmentNumber: r.equipmentNumber, qrTarget: r.decoded });
  }
  return report;
};
