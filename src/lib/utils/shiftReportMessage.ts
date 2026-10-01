// src/lib/utils/shiftReportMessage.ts
// Pesan WhatsApp laporan harian (Closing briefing) dan klasifikasi baris laporan.
// Modul murni tanpa akses store/jaringan supaya bisa diuji langsung.

import { toTitleCase, sortPersonelByJabatan } from '../data/masterData.ts';

/** Membuat teks "Kegiatan/Catatan" bawaan untuk preventive maintenance (getDefaultKalibrasiUraian). */
export type DefaultUraianFn = (peralatan: string, lokasi?: string) => string;

// ---------------------------------------------------------------------------
// Klasifikasi baris laporan operasional (dipakai tab Report dan pesan WhatsApp)
// ---------------------------------------------------------------------------
export const isPreventiveReport = (r: any): boolean =>
  r.Jenis === 'Kalibrasi' || r.kategori_maintenance === 'PREVENTIVE' || r.Jenis === 'Preventive';

export const isStoringReport = (r: any): boolean =>
  r.Jenis === 'Storing' || r.kategori_maintenance === 'STORING' || !!r.Uraian?.toLowerCase().includes('storing peralatan');

export const isCorrectiveReport = (r: any): boolean => {
  if (isPreventiveReport(r) || isStoringReport(r)) return false;
  if (r.kategori_maintenance) return r.kategori_maintenance === 'CORRECTIVE';
  if (r.Uraian?.toLowerCase().includes('permasalahan') || r.TindakLanjut?.toLowerCase().includes('perbaikan')) return true;
  if (r.Peralatan?.toLowerCase().includes('kegiatan') || r.Uraian?.toLowerCase().includes('storing') || r.Uraian?.toLowerCase().includes('running test')) return false;
  return true;
};

// ---------------------------------------------------------------------------
// Pesan WhatsApp laporan harian (Closing briefing)
// ---------------------------------------------------------------------------
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const STORING_ITEM_TEXT =
  'Storing Peralatan : Semua Peralatan Faskampen (X-Ray, WTMD, HHMD, BodyScanner, ETD, Dan Access Control) Dalam Keadaan Normal Operasi';

/** Hari/tanggal dari "YYYY-MM-DD" tanpa pergeseran zona waktu (new Date('YYYY-MM-DD') dibaca sebagai UTC). */
const formatHariTanggalIndo = (isoDate: string): string => {
  const [y, m, d] = (isoDate || '').split('-').map(Number);
  if (!y || !m || !d) return isoDate || '-';
  const dt = new Date(y, m - 1, d);
  return `${DAYS_ID[dt.getDay()]}, ${d} ${MONTHS_ID[m - 1]} ${y}`;
};

const cleanField = (v: unknown): string => {
  const t = String(v ?? '').replace(/\s*\n\s*/g, ' ').trim();
  return t === '-' ? '' : t;
};

const joinParts = (parts: string[]): string => parts.filter(Boolean).join(', ');

const tindakLanjutSteps = (text: unknown): string[] =>
  String(text ?? '')
    .split(/•|\n/)
    .map(step => step.trim().replace(/[.,;]+$/, ''))
    .filter(step => step && step !== '-');

const formatPreventiveBody = (r: any, getDefaultUraian: DefaultUraianFn): string => {
  const defaultUraian = getDefaultUraian(r.Peralatan, r.Lokasi);
  let raw: string = r.Uraian && r.Uraian.includes('Kegiatan :') ? r.Uraian : defaultUraian;
  if (!raw.includes('Catatan :')) {
    const idx = defaultUraian.indexOf('Catatan :');
    if (idx !== -1) raw = `${raw.trim()}\n   \n${defaultUraian.slice(idx)}`;
  }
  const start = raw.indexOf('Kegiatan :');
  return (start !== -1 ? raw.slice(start) : raw).trim();
};

const formatReportItem = (r: any, getDefaultUraian: DefaultUraianFn): string => {
  const status = cleanField(r.Status) || 'Normal Operasi';
  const peralatan = cleanField(r.Peralatan);
  const lokasi = cleanField(r.Lokasi);
  const lokasiPart = lokasi ? `Lokasi ${lokasi}` : '';

  if (isPreventiveReport(r)) {
    const onlyConveyor = peralatan.toLowerCase() === 'extension conveyor';
    const judul = onlyConveyor ? 'Preventive Maintenance' : 'Preventive Maintenance & Kalibrasi';
    const header = joinParts([`${judul} ${peralatan}`.trim(), lokasiPart, status]);
    return `${header}\n${formatPreventiveBody(r, getDefaultUraian)}`;
  }

  if (isCorrectiveReport(r)) {
    const steps = tindakLanjutSteps(r.TindakLanjut).filter(step => step.toLowerCase() !== status.toLowerCase());
    // Permasalahan diisi per butir berawalan "•"; tanda itu tidak ikut ke pesan.
    const permasalahan = tindakLanjutSteps(r.Uraian).join(', ');
    return joinParts([`Perbaikan ${peralatan}`.trim(), lokasiPart, permasalahan, steps.join(', '), status]);
  }

  const judul = peralatan || cleanField(r.Jenis) || 'Kegiatan';
  const steps = tindakLanjutSteps(r.TindakLanjut).filter(step => step.toLowerCase() !== status.toLowerCase());
  return joinParts([judul, lokasiPart, cleanField(r.Uraian), steps.join(', '), status]);
};

const buildKegiatanItems = (reports: any[], getDefaultUraian: DefaultUraianFn): string[] => {
  const items: string[] = [];
  let storingAdded = false;
  reports.forEach(r => {
    if (isStoringReport(r)) {
      if (!storingAdded) {
        items.push(STORING_ITEM_TEXT);
        storingAdded = true;
      }
      return;
    }
    items.push(formatReportItem(r, getDefaultUraian));
  });
  return items;
};

/**
 * Urutkan baris jadwal_shift seperti di tab Kehadiran dan Data: jabatan lebih dulu,
 * lalu `urutan` personel. Baris tanpa jabatan/urutan tetap pada urutan semula (sort stabil).
 */
export const sortPersonelRows = <T extends { personel?: any }>(rows: T[]): T[] =>
  sortPersonelByJabatan(rows.map(row => ({ row, jabatan: row.personel?.jabatan, urutan: row.personel?.urutan }))).map(x => x.row);

const personelNames = (rows: any[], shiftCode: string): string[] =>
  sortPersonelRows(rows)
    .filter(d => String(d.shift || '').toUpperCase() === shiftCode)
    .map(d => toTitleCase(String(d.personel?.nama || '').trim()))
    .filter(Boolean);

const formatNameList = (names: string[]): string => (names.length ? names.map(n => `- ${n}`).join('\n') : '- -');

/**
 * Pesan WhatsApp laporan harian format "Closing briefing". Satu blok per shift
 * (PS lalu M) berisi daftar personel per unit dan kegiatan shift tersebut.
 */
export const buildShiftReportMessage = (
  date: string,
  shift: string,
  apiPersonil: any[],
  iasPersonil: any[],
  reports: any[],
  getDefaultUraian: DefaultUraianFn
): string => {
  const shiftCodes = shift === 'PS' || shift === 'M' ? [shift] : ['PS', 'M'];
  const reportShift = (r: any): string => {
    const code = String(r.shift || '').toUpperCase();
    return code === 'M' ? 'M' : 'PS';
  };

  const blocks: string[] = [];
  shiftCodes.forEach(code => {
    const api = personelNames(apiPersonil, code);
    const ias = personelNames(iasPersonil, code);
    const shiftReports = shiftCodes.length === 1 ? reports : reports.filter(r => reportShift(r) === code);
    if (shiftCodes.length > 1 && api.length === 0 && ias.length === 0 && shiftReports.length === 0) return;

    let block = `Daftar Personil :\nHari/Tanggal/Dinas : ${formatHariTanggalIndo(date)}/${code}\n\n`;
    block += `Personel API T2 :\n${formatNameList(api)}\n\n`;
    block += `Personel OM IASS T2 :\n${formatNameList(ias)}`;

    const items = buildKegiatanItems(shiftReports, getDefaultUraian);
    if (items.length > 0) {
      block += `\n\nKegiatan :\n\n${items.map((item, i) => `${i + 1}. ${item}`).join('\n\n')}`;
    }
    blocks.push(block);
  });

  return [
    'Assalamualaikum Warahmatullahi Wabarakatuh\nIzin menyampaikan Closing briefing tim T2 SSES',
    ...blocks,
    'Demikian disampaikan laporan kegiatan unit T2 SSES.\nTerima Kasih\n\nWassalamualaikum Warahmatullahi Wabarakatuh\n#salam sehat, salam sejahtera 🤲🤲🤲',
  ].join('\n\n');
};
