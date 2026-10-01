// src/lib/utils/formValidation.ts
// Aturan isian wajib untuk setiap tab sebelum laporan dibagikan ke WhatsApp.
// Modul murni tanpa akses DOM/store supaya bisa diuji langsung. Setiap validator mengembalikan
// daftar isian kosong berurutan sesuai tampilan form: `key` dipakai menemukan isiannya di layar
// (atribut data-field atau name), `label` dipakai untuk kalimat maskot.

import { buildMissingFieldsMessage } from '../data/petMessages.ts';
import type {
  BAFormData, BriefingFormData, ChecklistFormData, IncidentFormData, KalibrasiEntry, KalibrasiGlobalData, KalibrasiParamKey,
  KegiatanFormData, KehadiranFormData, LokasiRow, StoringFormData,
} from '../types.ts';

export interface MissingField {
  key: string;
  label: string;
}

const blank = (v: unknown): boolean => String(v ?? '').trim() === '';

/** Isian bernomor/berpoin yang hanya berisi penanda ("•", "1.") dianggap kosong. */
const blankList = (v: unknown, marker: string): boolean => {
  const t = String(v ?? '').trim();
  return t === '' || t === marker;
};

const collect = (...rules: Array<[boolean, string, string]>): MissingField[] =>
  rules.filter(([missing]) => missing).map(([, key, label]) => ({ key, label }));

const MAX_LABELS_IN_PET = 5;

/** Kalimat maskot untuk isian kosong; daftar panjang diringkas agar tetap muat di gelembung. */
export const buildMissingPetMessage = (missing: MissingField[]): string | null => {
  const labels = Array.from(new Set(missing.map(m => m.label)));
  if (labels.length > MAX_LABELS_IN_PET) {
    const shown = labels.slice(0, MAX_LABELS_IN_PET - 1);
    return buildMissingFieldsMessage([...shown, `${labels.length - shown.length} isian lainnya`]);
  }
  return buildMissingFieldsMessage(labels);
};

const hasLokasi = (d: Pick<IncidentFormData, 'lokasiList' | 'lokasi1' | 'lokasi2'>): boolean => {
  const rows: LokasiRow[] = d.lokasiList || [{ lokasi1: d.lokasi1, lokasi2: d.lokasi2 }];
  return rows.some(l => l.lokasi1);
};

const noTeknisi = (d: Pick<IncidentFormData, 'teknisi'>): boolean => !d.teknisi || d.teknisi === '-';

export const validateKehadiran = (d: KehadiranFormData): MissingField[] =>
  collect(
    [blank(d.tanggal), 'tanggal', 'tanggal'],
    [!(d.apiList || []).some(r => !blank(r.name)), 'apiList', 'personel API T2'],
    [!(d.omList || []).some(r => !blank(r.name)), 'omList', 'personel OM IAS T2'],
    [blank(d.tlpRuangan), 'tlpRuangan', 'tlp ruangan'],
    [blank(d.rencanaKegiatan), 'rencanaKegiatan', 'rencana kegiatan'],
  );

export const validateBriefing = (d: BriefingFormData): MissingField[] =>
  collect(
    [blank(d.tanggal), 'tanggal', 'tanggal'],
    [blank(d.lokasi), 'lokasi', 'lokasi'],
  );

export const validateChecklist = (d: ChecklistFormData): MissingField[] =>
  collect(
    [blank(d.tanggal), 'tanggal', 'tanggal'],
    [blank(d.waktuMulai), 'waktuMulai', 'pukul mulai'],
    [blank(d.waktuSelesai), 'waktuSelesai', 'pukul selesai'],
  );

/** @param supervisorLocs lokasi yang mewajibkan Supervisor Avsec (getStoringSupervisorLocations). */
export const validateStoring = (d: StoringFormData, supervisorLocs: string[] = []): MissingField[] => {
  const noPeralatan = (d.peralatan || []).length === 0;
  const supMap = d.supervisorAvsecMap || {};
  const missingSupervisors: Array<[boolean, string, string]> = supervisorLocs
    .filter(loc => blank(supMap[loc] || (supervisorLocs.length === 1 ? d.supervisorAvsec : '')))
    .map(loc => [true, `supervisor-${loc}`, `Supervisor Avsec ${loc}`]);

  return collect(
    [blank(d.tanggal), 'tanggal', 'tanggal'],
    [blank(d.waktuMulai), 'waktuMulai', 'pukul mulai'],
    [blank(d.waktuSelesai), 'waktuSelesai', 'pukul selesai'],
    [noPeralatan, 'peralatan', 'peralatan'],
    [!noPeralatan && (d.acLokasi || []).length === 0, 'lokasi', 'lokasi'],
    [blank(d.hasil), 'hasil', 'hasil'],
    ...missingSupervisors,
  );
};

export const validateKegiatan = (d: KegiatanFormData): MissingField[] =>
  collect(
    [blank(d.tanggal), 'tanggal', 'tanggal'],
    [blank(d.waktuMulai), 'waktuMulai', 'pukul mulai'],
    [blank(d.lokasi), 'lokasi', 'lokasi'],
    [blank(d.kegiatan), 'kegiatan', 'kegiatan'],
  );

export const validateBASerahTerima = (d: BAFormData, items: Array<{ nama?: string }>): MissingField[] =>
  collect(
    [blank(d.tanggal), 'tanggal', 'tanggal'],
    [blank(d.waktu), 'waktu', 'pukul'],
    [blank(d.penyerahNama), 'penyerahNama', 'nama penyerah'],
    [blank(d.penerimaNama), 'penerimaNama', 'nama penerima'],
    [!items.some(it => !blank(it.nama)), 'items', 'minimal 1 barang'],
  );

export const validateInitialReport = (d: IncidentFormData): MissingField[] =>
  collect(
    [blank(d.peralatan), 'peralatan', 'peralatan'],
    [!hasLokasi(d), 'lokasi', 'lokasi'],
    [blank(d.tanggal), 'tanggal', 'tanggal'],
    [blank(d.waktuMulai), 'waktuMulai', 'waktu mulai'],
    [noTeknisi(d), 'teknisi', 'teknisi bertugas'],
    [blankList(d.permasalahan, '•'), 'permasalahan', 'permasalahan'],
    [blank(d.status), 'status', 'status'],
    [blankList(d.uraian, '•'), 'uraian', 'uraian'],
    [blankList(d.dampak, '1.'), 'dampak', 'dampak'],
    [blankList(d.tindakanMitigasi, '1.'), 'tindakanMitigasi', 'tindakan mitigasi'],
  );

export const validatePerbaikan = (d: IncidentFormData, isVerifikasiETD: boolean): MissingField[] =>
  collect(
    [blank(d.peralatan), 'peralatan', 'peralatan'],
    [!hasLokasi(d), 'lokasi', 'lokasi'],
    [blank(d.sumberLaporan), 'sumberLaporan', 'sumber laporan'],
    [!isVerifikasiETD && blank(d.indikasiAwal), 'indikasiAwal', 'indikasi awal'],
    [blank(d.tanggal), 'tanggal', 'tanggal'],
    [blank(d.waktuMulai), 'waktuMulai', 'waktu mulai'],
    [blank(d.waktuSelesai), 'waktuSelesai', 'waktu selesai'],
    [noTeknisi(d), 'teknisi', 'teknisi bertugas'],
    [blankList(d.permasalahan, '•'), 'permasalahan', 'permasalahan'],
    [blankList(d.tindakLanjut, '•'), 'tindakLanjut', 'tindak lanjut'],
  );

// Parameter kalibrasi per jenis peralatan: [nama field entri, label untuk maskot].
type ParamPairs = Array<[KalibrasiParamKey, string]>;
const XRAY_PARAMS: ParamPairs = [
  ['xrayKvV', 'kV Vertikal X-Ray'], ['xrayKvH', 'kV Horizontal X-Ray'],
  ['xrayMaV', 'mA Vertikal X-Ray'], ['xrayMaH', 'mA Horizontal X-Ray'],
  ['xrayOnV', 'Ontime Vertikal X-Ray'], ['xrayOnH', 'Ontime Horizontal X-Ray'],
  ['xrayArchive', 'Archive X-Ray'],
];
const WTMD_PARAMS: ParamPairs = [
  ['wtmdZ1', 'Z1 WTMD'], ['wtmdZ2', 'Z2 WTMD'], ['wtmdZ3', 'Z3 WTMD'], ['wtmdZ4', 'Z4 WTMD'],
  ['wtmdLc', 'LC WTMD'], ['wtmdLs', 'LS WTMD'], ['wtmdUc', 'UC WTMD'], ['wtmdSe', 'SE WTMD'], ['wtmdDs', 'DS WTMD'],
];
const BS_PARAMS: ParamPairs = [
  ['bsSuspect', 'Test Tampilan Suspect Item Body Scanner'], ['bsMonitor', 'Test Monitor Body Scanner'],
  ['bsScanning', 'Test Fungsi Scanning Body Scanner'], ['bsCalibration', 'Test Fungsi Kalibrasi Body Scanner'],
];
const ETD_PARAMS: ParamPairs = [['etdTnt', 'TNT ETD'], ['etdPetn', 'PETN ETD'], ['etdRdx', 'RDX ETD']];
const EC_PARAMS: ParamPairs = [
  ['ecGearbox', 'Gearbox Motor Extension Conveyor'], ['ecTension', 'Tension Roller Extension Conveyor'],
  ['ecBelt', 'Conveyor Belt Extension Conveyor'],
];
const AC_PARAMS: ParamPairs = [
  ['acEmlock', 'Fungsi Emlock'], ['acIntercom', 'Fungsi Intercom'], ['acFingerprint', 'Fungsi Fingerprint'],
  ['acCctv', 'Fungsi CCTV'], ['acPengontrolan', 'Fungsi Pengontrolan Kunci Pintu'], ['acRecordCctv', 'Record CCTV'],
];

export const validateKalibrasi = (global: KalibrasiGlobalData, entries: KalibrasiEntry[]): MissingField[] => {
  const missing = collect(
    [blank(global.tanggal), 'tanggal', 'tanggal'],
    [blank(global.waktuMulai), 'waktuMulai', 'pukul mulai'],
    [blank(global.waktuSelesai), 'waktuSelesai', 'pukul selesai'],
  );

  entries.forEach((entry, i) => {
    const suffix = entries.length > 1 ? ` (Lokasi #${i + 1})` : '';
    const add = (key: string, label: string) => missing.push({ key: `kal-${i}-${key}`, label: `${label}${suffix}` });
    const has = (name: string) => (entry.peralatan || []).includes(name);

    if ((entry.peralatan || []).length === 0) {
      add('peralatan', 'peralatan');
      return;
    }
    if (has('Access Control')) {
      if (!entry.acLokasi || entry.acLokasi.length === 0) add('lokasi', 'lokasi Access Control');
    } else if (!entry.lokasi1) {
      add('lokasi', 'lokasi');
    }

    const params: ParamPairs[] = [];
    if (has('Extension Conveyor')) params.push(EC_PARAMS);
    if (has('X-Ray')) params.push(XRAY_PARAMS);
    if (has('WTMD')) params.push(WTMD_PARAMS);
    if (has('Body Scanner')) params.push(BS_PARAMS);
    if (has('ETD')) params.push(ETD_PARAMS);
    if (has('Access Control')) params.push(AC_PARAMS);
    params.flat().forEach(([name, label]) => {
      if (blank(entry[name])) add(name, label);
    });
  });

  return missing;
};
