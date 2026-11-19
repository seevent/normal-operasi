// src/lib/utils/rosterPenugasan.ts
// Roster penugasan bantuan dari unit lain, mis. "Roster Bantuan Penanganan Bagasi Umrah Saudia (SV) – AFETS CGK".
// Modul murni (tanpa store/jaringan) supaya bisa diuji langsung:
//   1. membaca tabel roster dari teks PDF berkoordinat atau dari grid Excel,
//   2. menyaring personel unit "T2 Safety & Security Electronic Services",
//   3. menyusun rencana perubahan jadwal_shift (status kehadiran = label penugasan).
// Roster boleh diunggah apa adanya; penyaringan unit dilakukan di sini.

export type ShiftKode = 'PS' | 'M';

/** Potongan teks PDF dengan posisi kiri-bawah (satuan point) seperti dari pdf.js getTextContent. */
export interface PdfTextItem { str: string; x: number; y: number; width: number; page: number }
export interface RosterCell { tanggal: string; kode: string; shift: ShiftKode; terminal: string }
export interface RosterRow { no: number | null; nama: string; unit: string; cells: RosterCell[] }
export interface Roster { judul: string; tanggal: string[]; rows: RosterRow[]; peringatan: string[] }

export const UNIT_SSES_T2 = 'T2 Safety & Security Electronic Services';
export const STATUS_PENUGASAN_DEFAULT = 'Bantuan Umrah SV';
export const RIWAYAT_ROSTER_KEY = 'roster_penugasan_history';

const pad2 = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;
const isValidDate = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};
const dayOfWeek = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

// ---------------------------------------------------------------------------
// Kode sel roster
// ---------------------------------------------------------------------------

/** "SP-T2" → shift M (Sore–Pagi 20:00–08:00 H+1); "PS-T3" → shift PS (Pagi–Sore 08:00–20:00). */
export const parseRosterCode = (raw: unknown): { kode: string; shift: ShiftKode; terminal: string } | null => {
  const s = String(raw ?? '').toUpperCase().replace(/\s+/g, '').replace(/[–—]/g, '-');
  const m = s.match(/^(PS|SP)(?:-?(T\d))?$/);
  if (!m) return null;
  const terminal = m[2] || '';
  return { kode: terminal ? `${m[1]}-${terminal}` : m[1], shift: m[1] === 'PS' ? 'PS' : 'M', terminal };
};

/** Kode shift jadwal_shift ("PS", "Pagi", "M", "Malam", …) → PS / M; lainnya null. */
export const normalizeShiftKode = (raw: unknown): ShiftKode | null => {
  const s = String(raw ?? '').trim().toUpperCase();
  if (['PS', 'P', 'PAGI', 'SIANG'].includes(s)) return 'PS';
  if (['M', 'MALAM', 'SP'].includes(s)) return 'M';
  return null;
};

// ---------------------------------------------------------------------------
// Tanggal
// ---------------------------------------------------------------------------

export interface DateLabel { dow: number | null; d: number; m: number; y: number | null }

const DOW: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
  MIN: 0, SEN: 1, SEL: 2, RAB: 3, KAM: 4, JUM: 5, SAB: 6,
};

/** "Wed 18/11", "Kam, 19/11", "18/11/2026", "18-11" → komponen tanggal; selain itu null. */
export const parseDateLabel = (raw: unknown): DateLabel | null => {
  const s = String(raw ?? '').trim();
  const m = s.match(/^(?:([A-Za-z]{3})[A-Za-z]*\.?,?\s+)?(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/);
  if (!m) return null;
  const dowKey = m[1]?.toUpperCase();
  if (dowKey && DOW[dowKey] === undefined) return null;
  const d = Number(m[2]);
  const mo = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const y = m[4] ? (m[4].length === 2 ? 2000 + Number(m[4]) : Number(m[4])) : null;
  return { dow: dowKey ? DOW[dowKey] : null, d, m: mo, y };
};

/** Serial tanggal Excel (1900 date system) → komponen tanggal. */
export const dateLabelFromExcelSerial = (serial: number): DateLabel | null => {
  if (!Number.isFinite(serial) || serial < 30000 || serial > 80000) return null;
  const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000);
  return { dow: dt.getUTCDay(), d: dt.getUTCDate(), m: dt.getUTCMonth() + 1, y: dt.getUTCFullYear() };
};

/**
 * Melengkapi tahun. Roster biasanya hanya menulis "Wed 18/11"; tahun dipilih dari
 * tahunAcuan−1 … tahunAcuan+1 yang paling cocok dengan nama harinya (seri tetap naik
 * melewati pergantian tahun Desember → Januari).
 */
export const resolveTanggal = (labels: DateLabel[], tahunAcuan: number): { tanggal: string[]; peringatan: string[] } => {
  const buildFor = (base: number) => {
    let year = base;
    let prevMonth = 0;
    let score = 0;
    const out: string[] = [];
    for (const l of labels) {
      if (l.y !== null) {
        year = l.y;
      } else if (prevMonth && l.m < prevMonth) {
        year += 1;
      }
      prevMonth = l.m;
      if (!isValidDate(year, l.m, l.d)) return null;
      if (l.dow !== null && dayOfWeek(year, l.m, l.d) === l.dow) score += 1;
      out.push(toIso(year, l.m, l.d));
    }
    return { out, score };
  };

  const withDow = labels.filter(l => l.dow !== null).length;
  let best: { out: string[]; score: number } | null = null;
  for (const base of [tahunAcuan, tahunAcuan - 1, tahunAcuan + 1]) {
    const r = buildFor(base);
    if (r && (!best || r.score > best.score)) best = r;
  }
  if (!best) return { tanggal: [], peringatan: ['Tanggal pada roster tidak valid.'] };
  const peringatan = withDow > 0 && best.score < withDow
    ? [`Nama hari pada kolom tanggal tidak cocok dengan kalender (${best.score}/${withDow} cocok). Periksa tahun roster.`]
    : [];
  return { tanggal: best.out, peringatan };
};

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

const isRowNumber = (s: string) => /^\d{1,4}$/.test(s.trim());

/** Kelompokkan potongan teks per baris visual (halaman + posisi y yang sama, toleransi 2pt). */
const groupLines = (items: PdfTextItem[]) => {
  const sorted = [...items].filter(i => i.str.trim()).sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: { page: number; y: number; items: PdfTextItem[] }[] = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && last.page === it.page && Math.abs(last.y - it.y) <= 2) last.items.push(it);
    else lines.push({ page: it.page, y: it.y, items: [it] });
  }
  lines.forEach(l => l.items.sort((a, b) => a.x - b.x));
  return lines;
};

/**
 * Membaca roster dari teks PDF berkoordinat. Kolom tanggal ditentukan dari baris judul
 * kolom ("Wed 18/11", …); setiap kode PS/SP dipasangkan ke kolom tanggal terdekat.
 * Kolom Nama dan Unit ditentukan dari posisi x kiri yang berulang di banyak baris.
 */
export const rosterFromPdfItems = (items: PdfTextItem[], tahunAcuan: number): Roster => {
  const lines = groupLines(items);
  const peringatan: string[] = [];

  // Baris judul tanggal per halaman
  const anchorsByPage = new Map<number, { center: number; left: number; label: DateLabel }[]>();
  for (const line of lines) {
    if (anchorsByPage.has(line.page)) continue;
    const anchors = line.items
      .map(it => ({ it, label: parseDateLabel(it.str) }))
      .filter((a): a is { it: PdfTextItem; label: DateLabel } => a.label !== null);
    if (anchors.length >= 2) {
      anchorsByPage.set(line.page, anchors.map(a => ({ center: a.it.x + a.it.width / 2, left: a.it.x, label: a.label })));
    }
  }
  const pages = [...new Set(lines.map(l => l.page))].sort((a, b) => a - b);
  const firstPageWithDates = pages.find(p => anchorsByPage.has(p));
  if (firstPageWithDates === undefined) {
    throw new Error('Baris tanggal roster (mis. "Wed 18/11") tidak ditemukan di PDF.');
  }

  const firstAnchors = anchorsByPage.get(firstPageWithDates)!;
  const resolved = resolveTanggal(firstAnchors.map(a => a.label), tahunAcuan);
  peringatan.push(...resolved.peringatan);
  const tanggal = resolved.tanggal;

  // Halaman tanpa judul tanggal memakai susunan kolom halaman sebelumnya
  let current = firstAnchors;
  const anchorsFor = new Map<number, typeof firstAnchors>();
  for (const p of pages) {
    const own = anchorsByPage.get(p);
    if (own && own.length === firstAnchors.length) current = own;
    anchorsFor.set(p, current);
  }

  // Baris data: diawali nomor urut di sisi kiri tabel
  type DataLine = { no: number; page: number; text: PdfTextItem[]; codes: PdfTextItem[] };
  const dataLines: DataLine[] = [];
  for (const line of lines) {
    const anchors = anchorsFor.get(line.page);
    if (!anchors) continue;
    const tableLeft = anchors[0].left;
    const [first, ...rest] = line.items;
    if (!first || !isRowNumber(first.str) || first.x >= tableLeft) continue;
    const text = rest.filter(it => it.x < tableLeft - 2 && !parseRosterCode(it.str));
    if (text.length === 0) continue;
    const codes = rest.filter(it => parseRosterCode(it.str));
    dataLines.push({ no: Number(first.str.trim()), page: line.page, text, codes });
  }

  // Tepi kiri kolom teks = posisi x yang muncul di ≥2 baris
  const xCount = new Map<number, number>();
  dataLines.forEach(l => l.text.forEach(it => {
    const x = Math.round(it.x);
    xCount.set(x, (xCount.get(x) || 0) + 1);
  }));
  const edges = [...xCount.entries()].filter(([, c]) => c >= 2).map(([x]) => x).sort((a, b) => a - b);

  const splitColumns = (text: PdfTextItem[]): string[] => {
    if (edges.length < 2) return text.map(t => t.str.trim());
    const cols: string[][] = edges.map(() => []);
    for (const it of text) {
      let idx = 0;
      edges.forEach((e, i) => { if (e <= it.x + 1.5) idx = i; });
      cols[idx].push(it.str.trim());
    }
    return cols.map(c => c.join(' ').replace(/\s+/g, ' ').trim());
  };

  const rows: RosterRow[] = dataLines.map(l => {
    const [nama = '', unit = ''] = splitColumns(l.text);
    const anchors = anchorsFor.get(l.page)!;
    const spacing = anchors.length > 1 ? (anchors[anchors.length - 1].center - anchors[0].center) / (anchors.length - 1) : 40;
    const cells: RosterCell[] = [];
    for (const it of l.codes) {
      const center = it.x + it.width / 2;
      let bestIdx = -1;
      let bestDist = Infinity;
      anchors.forEach((a, i) => {
        const dist = Math.abs(a.center - center);
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      });
      const code = parseRosterCode(it.str)!;
      if (bestIdx < 0 || bestDist > spacing * 0.6 || !tanggal[bestIdx]) {
        peringatan.push(`Kode "${it.str}" milik ${nama || `baris ${l.no}`} tidak dapat dipasangkan ke kolom tanggal.`);
        continue;
      }
      cells.push({ tanggal: tanggal[bestIdx], ...code });
    }
    cells.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    return { no: l.no, nama, unit, cells };
  });

  // pdf.js kadang menggabungkan nama dan unit yang berdempetan menjadi satu potongan teks,
  // mis. "MARKOPOLO YOHANNES MASYLINO T3 General Electronic Services". Pisahkan memakai
  // nama unit yang terbaca di baris lain.
  const knownUnits = [...new Set(rows.map(r => r.unit).filter(Boolean))].sort((a, b) => b.length - a.length);
  for (const r of rows) {
    if (r.unit) continue;
    const u = knownUnits.find(k => r.nama.toUpperCase().endsWith(` ${k.toUpperCase()}`));
    if (u) {
      r.nama = r.nama.slice(0, r.nama.length - u.length).trim();
      r.unit = u;
    } else {
      peringatan.push(`Unit untuk baris ${r.no} (${r.nama}) tidak terbaca.`);
    }
  }

  const judul = items.find(i => /ROSTER/i.test(i.str))?.str.trim() || '';
  return { judul, tanggal, rows, peringatan };
};

// ---------------------------------------------------------------------------
// Excel
// ---------------------------------------------------------------------------

const cellText = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

const cellDate = (v: unknown): DateLabel | null => {
  if (typeof v === 'number') return dateLabelFromExcelSerial(v);
  if (v instanceof Date) return { dow: v.getDay(), d: v.getDate(), m: v.getMonth() + 1, y: v.getFullYear() };
  return parseDateLabel(v);
};

/** Membaca roster dari grid Excel (sheet_to_json header:1, raw). Kolom "Nama" dan "Unit" wajib ada. */
export const rosterFromGrid = (grid: unknown[][], tahunAcuan: number): Roster => {
  const headerIdx = grid.findIndex(r => {
    const cells = (r || []).map(c => cellText(c).toUpperCase());
    return cells.some(c => c.startsWith('NAMA')) && cells.some(c => c.startsWith('UNIT'));
  });
  if (headerIdx < 0) throw new Error('Kolom "Nama Personil" dan "Unit Department" tidak ditemukan di Excel roster.');

  const header = (grid[headerIdx] || []).map(c => cellText(c).toUpperCase());
  const namaCol = header.findIndex(c => c.startsWith('NAMA'));
  const unitCol = header.findIndex(c => c.startsWith('UNIT'));
  const noCol = header.findIndex(c => c === 'NO' || c === 'NO.');
  const minDateCol = Math.max(namaCol, unitCol) + 1;

  let dateRowIdx = -1;
  let dateCols: { col: number; label: DateLabel }[] = [];
  for (let i = headerIdx; i <= Math.min(headerIdx + 3, grid.length - 1); i++) {
    const found = (grid[i] || [])
      .map((c, col) => ({ col, label: col >= minDateCol ? cellDate(c) : null }))
      .filter((x): x is { col: number; label: DateLabel } => x.label !== null);
    if (found.length > dateCols.length) { dateCols = found; dateRowIdx = i; }
  }
  if (dateCols.length === 0) throw new Error('Baris tanggal roster (mis. "Wed 18/11") tidak ditemukan di Excel.');

  const { tanggal, peringatan } = resolveTanggal(dateCols.map(d => d.label), tahunAcuan);

  const rows: RosterRow[] = [];
  for (let i = Math.max(headerIdx, dateRowIdx) + 1; i < grid.length; i++) {
    const r = grid[i] || [];
    const nama = cellText(r[namaCol]).replace(/\s+/g, ' ');
    if (!nama || /^KETERANGAN/i.test(nama)) continue;
    const cells: RosterCell[] = [];
    dateCols.forEach((dc, idx) => {
      const code = parseRosterCode(r[dc.col]);
      if (code && tanggal[idx]) cells.push({ tanggal: tanggal[idx], ...code });
    });
    const noVal = noCol >= 0 ? Number(cellText(r[noCol])) : NaN;
    rows.push({ no: Number.isFinite(noVal) && cellText(r[noCol]) !== '' ? noVal : null, nama, unit: cellText(r[unitCol]).replace(/\s+/g, ' '), cells });
  }

  let judul = '';
  for (let i = 0; i < headerIdx && !judul; i++) {
    judul = (grid[i] || []).map(cellText).find(c => /ROSTER/i.test(c)) || '';
  }
  return { judul, tanggal, rows, peringatan };
};

// ---------------------------------------------------------------------------
// Penyaringan & pencocokan
// ---------------------------------------------------------------------------

const unitKey = (s: string) => s.toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9]/g, '');
const UNIT_SSES_T2_KEYS = new Set([unitKey(UNIT_SSES_T2), 'SSEST2', 'T2SSES']);

export const isUnitSsesT2 = (unit: string) => UNIT_SSES_T2_KEYS.has(unitKey(unit || ''));

export const filterRosterSsesT2 = (rows: RosterRow[]) => rows.filter(r => isUnitSsesT2(r.unit));

export const normalizeNama = (s: string) => (s || '').toUpperCase().replace(/[.,']/g, ' ').replace(/\s+/g, ' ').trim();

export interface PersonelRef { id: string; nama: string }

/** Token pendek (mis. inisial "M") cocok dengan token panjang yang berawalan sama. */
const tokensCovered = (shortTokens: string[], longTokens: string[]) => {
  const pool = [...longTokens];
  return shortTokens.every(t => {
    const idx = pool.findIndex(p => p === t || (t.length === 1 && p.startsWith(t)) || (p.length === 1 && t.startsWith(p)));
    if (idx < 0) return false;
    pool.splice(idx, 1);
    return true;
  });
};

/**
 * Nama roster → personel master. Utamakan nama persis (tanpa beda huruf besar, titik, spasi);
 * selain itu terima hanya bila tepat satu personel memuat semua kata nama roster (minimal 2 kata).
 */
export const matchPersonel = <T extends PersonelRef>(nama: string, personel: T[]): T | null => {
  const key = normalizeNama(nama);
  if (!key) return null;
  const exact = personel.filter(p => normalizeNama(p.nama) === key);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;
  const tokens = key.split(' ');
  if (tokens.length < 2) return null;
  const partial = personel.filter(p => {
    const pt = normalizeNama(p.nama).split(' ');
    return tokens.length <= pt.length ? tokensCovered(tokens, pt) : tokensCovered(pt, tokens) && pt.length >= 2;
  });
  return partial.length === 1 ? partial[0] : null;
};

// ---------------------------------------------------------------------------
// Rencana perubahan jadwal_shift
// ---------------------------------------------------------------------------

export interface JadwalRef { id: string; personel_id: string; tanggal: string; shift: string | null; status_kehadiran: string | null }

/**
 * tandai          — jadwal shift sama, status Hadir → status diganti label penugasan
 * tambah          — tidak ada jadwal pada tanggal itu → baris baru dengan label penugasan (tidak dipilih otomatis)
 * sudah           — status sudah berlabel penugasan
 * bentrok_shift   — jadwal reguler di shift lain; tidak diubah
 * bentrok_status  — status lain (Sakit/Izin/…); tidak diubah
 * tidak_dikenal   — nama tidak ditemukan di master personel
 */
export type AksiRoster = 'tandai' | 'tambah' | 'sudah' | 'bentrok_shift' | 'bentrok_status' | 'tidak_dikenal';

export interface RencanaItem {
  key: string;
  nama: string;
  namaMaster: string | null;
  personelId: string | null;
  tanggal: string;
  kode: string;
  shift: ShiftKode;
  terminal: string;
  aksi: AksiRoster;
  jadwalId: string | null;
  shiftLama: string | null;
  statusLama: string | null;
}

export const isAksiDapatDiterapkan = (aksi: AksiRoster) => aksi === 'tandai' || aksi === 'tambah';
export const isAksiDipilihOtomatis = (aksi: AksiRoster) => aksi === 'tandai';

const isStatusHadir = (s: string | null) => !s || s.trim().toLowerCase() === 'hadir';

export const susunRencanaRoster = (
  rows: RosterRow[],
  personel: PersonelRef[],
  jadwal: JadwalRef[],
  label: string,
): RencanaItem[] => {
  const jadwalByKey = new Map(jadwal.map(j => [`${j.personel_id}|${j.tanggal}`, j]));
  const labelKey = label.trim().toLowerCase();
  const out: RencanaItem[] = [];

  for (const row of rows) {
    const p = matchPersonel(row.nama, personel);
    for (const cell of row.cells) {
      const base = {
        key: `${p?.id ?? normalizeNama(row.nama)}|${cell.tanggal}|${cell.shift}`,
        nama: row.nama,
        namaMaster: p?.nama ?? null,
        personelId: p?.id ?? null,
        tanggal: cell.tanggal,
        kode: cell.kode,
        shift: cell.shift,
        terminal: cell.terminal,
      };
      if (!p) {
        out.push({ ...base, aksi: 'tidak_dikenal', jadwalId: null, shiftLama: null, statusLama: null });
        continue;
      }
      const j = jadwalByKey.get(`${p.id}|${cell.tanggal}`);
      if (!j) {
        out.push({ ...base, aksi: 'tambah', jadwalId: null, shiftLama: null, statusLama: null });
        continue;
      }
      const shiftLama = normalizeShiftKode(j.shift);
      let aksi: AksiRoster;
      if (shiftLama !== cell.shift) aksi = 'bentrok_shift';
      else if ((j.status_kehadiran || '').trim().toLowerCase() === labelKey) aksi = 'sudah';
      else if (isStatusHadir(j.status_kehadiran)) aksi = 'tandai';
      else aksi = 'bentrok_status';
      out.push({ ...base, aksi, jadwalId: j.id, shiftLama: j.shift, statusLama: j.status_kehadiran });
    }
  }

  return out.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.nama.localeCompare(b.nama));
};

// ---------------------------------------------------------------------------
// Riwayat (untuk membatalkan upload)
// ---------------------------------------------------------------------------

export interface PerubahanRoster {
  personelId: string;
  nama: string;
  tanggal: string;
  shift: ShiftKode;
  aksi: 'tandai' | 'tambah';
  statusLama: string | null;
}

export interface RiwayatRoster {
  id: string;
  judul: string;
  label: string;
  dari: string;
  sampai: string;
  diunggah: string;
  perubahan: PerubahanRoster[];
}

export const rencanaKePerubahan = (rencana: RencanaItem[], dipilih: Set<string>): PerubahanRoster[] =>
  rencana
    .filter(r => dipilih.has(r.key) && isAksiDapatDiterapkan(r.aksi) && r.personelId)
    .map(r => ({
      personelId: r.personelId!,
      nama: r.namaMaster || r.nama,
      tanggal: r.tanggal,
      shift: r.shift,
      aksi: r.aksi as 'tandai' | 'tambah',
      statusLama: r.statusLama,
    }));
