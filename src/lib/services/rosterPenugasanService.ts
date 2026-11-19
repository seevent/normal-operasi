// src/lib/services/rosterPenugasanService.ts
// Membaca file roster penugasan (PDF/Excel) dan menerapkannya ke jadwal_shift.
// Setiap penerapan dicatat di master_configs (RIWAYAT_ROSTER_KEY) agar bisa dibatalkan persis.

import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import {
  rosterFromGrid,
  rosterFromPdfItems,
  rencanaKePerubahan,
  RIWAYAT_ROSTER_KEY,
  type JadwalRef,
  type PersonelRef,
  type RencanaItem,
  type RiwayatRoster,
  type Roster,
} from '../utils/rosterPenugasan';
import { extractPdfTextItems } from '../utils/rosterPdfText';

export const bacaFileRoster = async (file: File, tahunAcuan: number): Promise<Roster> => {
  const buf = await file.arrayBuffer();

  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    // pdf.js (~1 MB) hanya dimuat saat PDF roster diunggah; legacy build agar jalan di Safari iOS lama.
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { default: workerUrl } = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const items = await extractPdfTextItems(pdfjs as never, new Uint8Array(buf));
    if (items.length === 0) {
      throw new Error('PDF tidak memuat teks (kemungkinan hasil scan/foto). Minta file roster asli (Excel/PDF hasil ekspor).');
    }
    return rosterFromPdfItems(items, tahunAcuan);
  }

  const workbook = XLSX.read(buf);
  let best: Roster | null = null;
  let lastError: unknown = null;
  for (const name of workbook.SheetNames) {
    try {
      const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, raw: true, defval: null });
      const roster = rosterFromGrid(grid, tahunAcuan);
      if (!best || roster.rows.length > best.rows.length) best = roster;
    } catch (err) {
      lastError = err;
    }
  }
  if (!best) throw lastError instanceof Error ? lastError : new Error('Tabel roster tidak ditemukan di Excel.');
  return best;
};

export const muatPersonel = async (): Promise<PersonelRef[]> => {
  const { data, error } = await supabase.from('personel').select('id, nama');
  if (error) throw new Error('Gagal memuat master personel: ' + error.message);
  return (data || []).map(p => ({ id: String(p.id), nama: p.nama || '' }));
};

export const muatJadwal = async (personelIds: string[], dari: string, sampai: string): Promise<JadwalRef[]> => {
  if (personelIds.length === 0) return [];
  const { data, error } = await supabase
    .from('jadwal_shift')
    .select('id, personel_id, tanggal, shift, status_kehadiran')
    .in('personel_id', personelIds)
    .gte('tanggal', dari)
    .lte('tanggal', sampai);
  if (error) throw new Error('Gagal memuat jadwal shift: ' + error.message);
  return (data || []).map(j => ({ ...j, id: String(j.id), personel_id: String(j.personel_id) }));
};

export const muatRiwayatRoster = async (): Promise<RiwayatRoster[]> => {
  const { data, error } = await supabase.from('master_configs').select('value').eq('key', RIWAYAT_ROSTER_KEY).maybeSingle();
  if (error) throw new Error('Gagal memuat riwayat roster: ' + error.message);
  const items = (data?.value as { items?: RiwayatRoster[] } | null)?.items;
  return Array.isArray(items) ? items : [];
};

const simpanRiwayatRoster = async (items: RiwayatRoster[]) => {
  const { error } = await supabase
    .from('master_configs')
    .upsert({ key: RIWAYAT_ROSTER_KEY, value: { items }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw new Error('Gagal menyimpan riwayat roster: ' + error.message);
};

export interface HasilTerapkan { ditandai: number; ditambah: number; riwayatGagal: string | null }

export const terapkanRoster = async (
  rencana: RencanaItem[],
  dipilih: Set<string>,
  label: string,
  judul: string,
): Promise<HasilTerapkan> => {
  const terpilih = rencana.filter(r => dipilih.has(r.key));
  const tandai = terpilih.filter(r => r.aksi === 'tandai' && r.jadwalId);
  const tambah = terpilih.filter(r => r.aksi === 'tambah' && r.personelId);

  let idTertandai = new Set<string>();
  if (tandai.length > 0) {
    // Hanya baris yang statusnya masih Hadir (atau kosong) yang diubah.
    const { data, error } = await supabase
      .from('jadwal_shift')
      .update({ status_kehadiran: label })
      .in('id', tandai.map(r => r.jadwalId!))
      .or('status_kehadiran.is.null,status_kehadiran.eq.Hadir')
      .select('id');
    if (error) throw new Error('Gagal menandai jadwal shift: ' + error.message);
    idTertandai = new Set((data || []).map(d => String(d.id)));
  }

  if (tambah.length > 0) {
    const { error } = await supabase.from('jadwal_shift').insert(
      tambah.map(r => ({ personel_id: r.personelId, tanggal: r.tanggal, shift: r.shift, status_kehadiran: label })),
    );
    if (error) {
      throw new Error(
        `Gagal menambah jadwal penugasan: ${error.message}` +
        (idTertandai.size > 0 ? ` (${idTertandai.size} penandaan sudah tersimpan; muat ulang file untuk melihat keadaan terbaru).` : ''),
      );
    }
  }

  const benarBerubah = new Set([
    ...tandai.filter(r => idTertandai.has(r.jadwalId!)).map(r => r.key),
    ...tambah.map(r => r.key),
  ]);
  const perubahan = rencanaKePerubahan(rencana, benarBerubah);

  let riwayatGagal: string | null = null;
  if (perubahan.length > 0) {
    const tanggal = perubahan.map(p => p.tanggal).sort();
    const entri: RiwayatRoster = {
      id: `${Date.now()}`,
      judul: judul || 'Roster penugasan',
      label,
      dari: tanggal[0],
      sampai: tanggal[tanggal.length - 1],
      diunggah: new Date().toISOString(),
      perubahan,
    };
    try {
      const lama = await muatRiwayatRoster();
      await simpanRiwayatRoster([entri, ...lama]);
    } catch (err) {
      riwayatGagal = err instanceof Error ? err.message : String(err);
    }
  }

  return { ditandai: idTertandai.size, ditambah: tambah.length, riwayatGagal };
};

/**
 * Membatalkan satu upload roster: status dikembalikan ke nilai sebelumnya dan baris yang
 * ditambahkan roster dihapus. Baris yang statusnya sudah diubah manual (bukan label lagi) dibiarkan.
 */
export const batalkanRoster = async (entri: RiwayatRoster): Promise<{ dikembalikan: number; dilewati: number }> => {
  let dikembalikan = 0;
  for (const p of entri.perubahan) {
    const base = p.aksi === 'tandai'
      ? supabase.from('jadwal_shift').update({ status_kehadiran: p.statusLama || 'Hadir' })
      : supabase.from('jadwal_shift').delete();
    let q = base.eq('personel_id', p.personelId).eq('tanggal', p.tanggal).eq('status_kehadiran', entri.label);
    if (p.aksi === 'tambah') q = q.eq('shift', p.shift);
    const { data, error } = await q.select('id');
    if (error) throw new Error(`Gagal membatalkan penugasan ${p.nama} (${p.tanggal}): ${error.message}`);
    dikembalikan += (data || []).length;
  }

  const lama = await muatRiwayatRoster();
  await simpanRiwayatRoster(lama.filter(e => e.id !== entri.id));
  return { dikembalikan, dilewati: entri.perubahan.length - dikembalikan };
};
