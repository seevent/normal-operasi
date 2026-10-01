// src/lib/types.ts
// Bentuk data yang dipakai bersama oleh store, service, dan tab. Diturunkan dari skema Supabase
// (lihat database.md); hanya kolom yang benar-benar dipakai aplikasi yang dicantumkan.

/** Personel di state aplikasi (store & form kehadiran). */
export interface Personel {
  id?: string | number;
  nik?: string;
  name: string;
  phone?: string;
  jabatan?: string;
  /** Urutan manual dari kolom `personel.urutan`. */
  dbOrder?: number;
}

/** Baris kehadiran pada tab Kehadiran: personel + rujukan ke jadwal_shift. */
export interface AttendanceRow extends Personel {
  phone: string;
  jadwal_id: string | number | null;
  personel_id?: string | null;
  status: string;
}

/** Kolom lokasi pada tracker TIP: nama lokasi + nomor unit X-Ray. */
export interface TipColumnItem {
  id: string;
  name: string;
  items: string[];
}

export interface JenisPeralatan {
  id: string;
  nama: string;
  tampil_di_kalibrasi?: boolean | null;
}

export interface TipePeralatanRef {
  id?: string;
  nama: string;
  varian?: string | null;
  jenis_peralatan?: { id?: string; nama: string } | null;
}

export interface UnitPeralatan {
  id: string;
  id_tipe?: string;
  serial_number?: string | null;
  no_sertifikasi?: string | null;
  tahun_instalasi?: number | null;
  ampere?: string | null;
  milik?: string | null;
  status: string;
  catatan?: string | null;
  foto_url?: string | null;
  created_at?: string | null;
  tipe_peralatan?: TipePeralatanRef | null;
}

/** Baris `penempatan_peralatan` beserta relasi yang di-embed oleh query store. */
export interface Penempatan {
  id: string;
  id_unit?: string | null;
  tipe_peralatan?: TipePeralatanRef | null;
  unit_peralatan?: UnitPeralatan | null;
  lokasi?: { nama: string } | null;
  titik_lokasi?: { nomor: string } | null;
}

export interface Sparepart {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  id_tipe?: string | null;
  unit?: string | null;
  minimum_stok: number;
  lokasi?: string | null;
  rack?: string | null;
  mtbf_days?: number | null;
  tipe_nama: string;
  current_stock: number;
}

/** Hasil query `personel` beserta `unit_kerja(nama)` yang di-embed. */
export interface PersonelDbRow {
  id: string;
  nik?: string | null;
  nama: string;
  no_hp?: string | null;
  jabatan?: string | null;
  urutan?: number | null;
  unit_kerja?: { nama: string } | null;
}

// ---------------------------------------------------------------------------
// Data form per tab (dipakai generator pesan WhatsApp dan validator)
// ---------------------------------------------------------------------------

/** Satu baris lokasi pada form (lokasi utama + nomor/titik); `isManual` bila diketik bebas. */
export interface LokasiRow {
  lokasi1: string;
  lokasi2: string;
  isManual?: boolean;
}

export interface KehadiranFormData {
  tanggal: string;
  shift: string;
  apiList: AttendanceRow[];
  omList: AttendanceRow[];
  tlpRuangan: string;
  rencanaKegiatan: string;
}

export interface BriefingFormData {
  jenis: string;
  tanggal: string;
  shift: string;
  lokasi: string;
}

export interface StoringFormData {
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  peralatan: string[];
  lokasi: string;
  acLokasi: string[];
  acNomor: Record<string, string>;
  nomor: string;
  hasil: string;
  supervisorAvsec: string;
  supervisorAvsecMap: Record<string, string>;
}

export interface ChecklistFormData {
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  supervisorAvsec: Record<string, string>;
}

export interface KegiatanFormData {
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  peralatan: string;
  lokasi: string;
  kegiatan: string;
}

export interface BarangItem {
  id: string;
  nama: string;
  qty: number;
  satuan: string;
  kondisi: 'Baik / Baru' | 'Bekas / Normal' | 'Rusak / Perlu Perbaikan';
  /** Serial number tiap unit barang. */
  snList: string[];
}

export interface BAFormData {
  jenisTransaksi: 'masuk' | 'keluar';
  tanggal: string;
  waktu: string;
  penyerahNama: string;
  penyerahJabatan: string;
  penyerahInstansi: string;
  penerimaNama: string;
  penerimaJabatan: string;
  penerimaInstansi: string;
  /** Hanya ada saat data digabung untuk pesan WA. */
  items?: Array<Partial<BarangItem> & { sn?: string }>;
}

/** Isian yang sama dipakai Initial Report dan Perbaikan; kolom khusus masing-masing opsional. */
export interface IncidentFormData {
  peralatan: string;
  lokasi1: string;
  lokasi2: string;
  lokasiList?: LokasiRow[];
  tanggal: string;
  waktuMulai: string;
  waktuSelesai?: string;
  lamaPengerjaan: string;
  teknisi: string;
  permasalahan: string;
  status: string;
  // Initial Report
  jamPengerjaan?: string;
  menitPengerjaan?: string;
  uraian?: string;
  dampak?: string;
  tindakanMitigasi?: string;
  tindakan?: string;
  hasilTindakan?: string;
  // Perbaikan
  sumberLaporan?: string;
  indikasiAwal?: string;
  tindakLanjut?: string;
}

export interface KalibrasiGlobalData {
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
}

/** Parameter uji kalibrasi: `xray*`, `wtmd*`, `bs*` (Body Scanner), `etd*`, `ec*` (Extension Conveyor), `ac*` (Access Control). */
export interface KalibrasiParams {
  xrayKvV: string; xrayKvH: string; xrayMaV: string; xrayMaH: string; xrayOnV: string; xrayOnH: string; xrayArchive: string;
  wtmdZ1: string; wtmdZ2: string; wtmdZ3: string; wtmdZ4: string;
  wtmdLc: string; wtmdLs: string; wtmdUc: string; wtmdSe: string; wtmdDs: string;
  bsSuspect: string; bsMonitor: string; bsScanning: string; bsCalibration: string;
  etdTnt: string; etdPetn: string; etdRdx: string;
  ecGearbox: string; ecTension: string; ecBelt: string;
  acEmlock: string; acIntercom: string; acFingerprint: string; acCctv: string; acPengontrolan: string; acRecordCctv: string;
}

export type KalibrasiParamKey = keyof KalibrasiParams;

/** Satu lokasi kalibrasi: peralatan terpilih + lokasi + parameter uji. */
export interface KalibrasiEntry extends KalibrasiParams {
  id?: number;
  peralatan: string[];
  lokasi1: string;
  lokasi2: string;
  acLokasi: string[];
  xrayModel?: string;
  wtmdModel?: string;
  hhmdModel?: string;
  bsModel?: string;
  etdModel?: string;
}

// ---------------------------------------------------------------------------
// Report (laporan harian)
// ---------------------------------------------------------------------------

/** Baris kegiatan pada tab Report (hasil pemetaan `laporan_operasional`). */
export interface ShiftReportRow {
  rowIndex?: string | number;
  id?: string;
  shift?: string;
  Jenis?: string;
  Waktu?: string;
  Peralatan?: string;
  Lokasi?: string;
  kategori_maintenance?: string;
  Uraian?: string;
  TindakLanjut?: string;
  Status?: string;
  imageUrl?: string | null;
  fotoUrls?: string[];
}

/** Baris `jadwal_shift` beserta personelnya, dipakai untuk daftar personel di pesan laporan. */
export interface JadwalShiftRow {
  shift?: string;
  status_kehadiran?: string | null;
  personel?: {
    nama?: string;
    jabatan?: string | null;
    urutan?: number | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Foto
// ---------------------------------------------------------------------------

export type PhotoAnnotation = {
  text: string;
  position: 'top' | 'bottom' | 'center';
  style: 'black' | 'red' | 'green' | 'yellow' | 'clear';
  size: 'small' | 'medium' | 'large' | number;
  align?: 'left' | 'center' | 'right';
};

export type Photo = {
  id: number | string;
  file: File;
  preview: string;
  zoom?: number;
  originalFile?: File;
  originalPreview?: string;
  annotation?: PhotoAnnotation;
};
