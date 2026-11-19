// src/lib/services/rosterPenugasanService.ts
// Membaca file roster penugasan (PDF/Excel) dan menyimpan penugasan terpilih di master_configs
// (RIWAYAT_ROSTER_KEY). jadwal_shift hanya dibaca untuk pencocokan, tidak pernah diubah.
// Tab Kehadiran membaca penugasan ini untuk bagian "*Bantuan Umroh SV :*".

import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import {
  rosterFromGrid,
  rosterFromPdfItems,
  penugasanUntukShift,
  rencanaKePenugasan,
  RIWAYAT_ROSTER_KEY,
  type JadwalRef,
  type PersonelRef,
  type RencanaItem,
  type RiwayatRoster,
  type Roster,
  type ShiftKode,
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
  return Array.isArray(items) ? items.filter(e => Array.isArray(e?.penugasan)) : [];
};

const simpanRiwayatRoster = async (items: RiwayatRoster[]) => {
  const { error } = await supabase
    .from('master_configs')
    .upsert({ key: RIWAYAT_ROSTER_KEY, value: { items }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw new Error('Gagal menyimpan riwayat roster: ' + error.message);
};

/** Simpan penugasan terpilih sebagai satu entri riwayat. Mengembalikan jumlah penugasan tersimpan. */
export const simpanPenugasanRoster = async (
  rencana: RencanaItem[],
  dipilih: Set<string>,
  label: string,
  judul: string,
): Promise<number> => {
  const penugasan = rencanaKePenugasan(rencana, dipilih);
  if (penugasan.length === 0) return 0;
  const tanggal = penugasan.map(p => p.tanggal).sort();
  const entri: RiwayatRoster = {
    id: `${Date.now()}`,
    judul: judul || 'Roster penugasan',
    label,
    dari: tanggal[0],
    sampai: tanggal[tanggal.length - 1],
    diunggah: new Date().toISOString(),
    penugasan,
  };
  const lama = await muatRiwayatRoster();
  await simpanRiwayatRoster([entri, ...lama]);
  return penugasan.length;
};

/** Hapus satu upload roster; bagiannya hilang dari pesan Kehadiran. */
export const hapusRiwayatRoster = async (id: string) => {
  const lama = await muatRiwayatRoster();
  await simpanRiwayatRoster(lama.filter(e => e.id !== id));
};

/** Penugasan untuk Tab Kehadiran. Gagal memuat tidak boleh menghentikan laporan dinas. */
export const muatPenugasanShift = async (tanggal: string, shift: ShiftKode) => {
  try {
    return penugasanUntukShift(await muatRiwayatRoster(), tanggal, shift);
  } catch (err) {
    console.warn('Gagal memuat penugasan roster:', err);
    return [];
  }
};
