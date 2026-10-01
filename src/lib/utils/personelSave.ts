// src/lib/utils/personelSave.ts
// Rencana penyimpanan daftar personel satu unit ke tabel `personel`.
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.
//
// Penghapusan sengaja dibatasi: `jadwal_shift.personel_id` memakai ON DELETE CASCADE, jadi menghapus
// personel ikut menghapus seluruh riwayat jadwalnya. Yang dihapus hanya personel yang tadinya tampil
// di editor (`previous`) lalu dibuang admin — bukan semua yang tidak ada di daftar layar.

import type { Personel } from '../types.ts';

export interface PersonelPayload {
  nama: string;
  nik: string;
  no_hp: string | null;
  jabatan: string | null;
  urutan: number;
}

export interface PersonelSavePlan {
  updates: Array<{ id: string; payload: PersonelPayload }>;
  inserts: PersonelPayload[];
  deleteIds: string[];
  /** Bila tidak kosong, jangan menulis apa pun ke database. */
  errors: string[];
}

const text = (v: unknown): string => String(v ?? '').trim();

/**
 * @param rows      Daftar personel di editor yang akan disimpan (urutan = urutan tampil).
 * @param previous  Daftar personel unit ini yang tampil di editor sebelum disunting.
 * @param dbIds     ID personel unit ini yang saat ini ada di database.
 */
export const planPersonelSave = (rows: Personel[], previous: Personel[], dbIds: string[]): PersonelSavePlan => {
  const errors: string[] = [];
  const dbIdSet = new Set(dbIds);
  const named = rows.filter((p) => text(p.name));

  // Daftar yang belum termuat dari database (mis. masih data bawaan tanpa id) tidak boleh dianggap
  // sebagai "semua personel dihapus".
  const knownIds = named.filter((p) => p.id !== undefined && dbIdSet.has(String(p.id)));
  if (dbIds.length > 0 && knownIds.length === 0) {
    errors.push('Data personel belum termuat dari database. Muat ulang halaman lalu coba lagi.');
  }

  const missingNik = named.filter((p) => !text(p.nik)).map((p) => text(p.name));
  if (missingNik.length > 0) errors.push(`NIK wajib diisi untuk: ${missingNik.join(', ')}.`);

  const seen = new Map<string, string>();
  const duplicates = new Set<string>();
  named.forEach((p) => {
    const nik = text(p.nik);
    if (!nik) return;
    if (seen.has(nik)) duplicates.add(nik);
    else seen.set(nik, text(p.name));
  });
  if (duplicates.size > 0) errors.push(`NIK dobel: ${[...duplicates].join(', ')}.`);

  const updates: PersonelSavePlan['updates'] = [];
  const inserts: PersonelPayload[] = [];
  named.forEach((p, idx) => {
    const payload: PersonelPayload = {
      nama: text(p.name),
      nik: text(p.nik),
      no_hp: text(p.phone) || null,
      jabatan: text(p.jabatan) || null,
      urutan: idx + 1,
    };
    if (p.id !== undefined && dbIdSet.has(String(p.id))) updates.push({ id: String(p.id), payload });
    else inserts.push(payload);
  });

  // Baris yang namanya dikosongkan tidak dianggap dibuang.
  const keptIds = new Set(rows.filter((p) => p.id !== undefined).map((p) => String(p.id)));
  const deleteIds = previous
    .filter((p) => p.id !== undefined)
    .map((p) => String(p.id))
    .filter((id) => !keptIds.has(id) && dbIdSet.has(id));

  return { updates, inserts, deleteIds, errors };
};
