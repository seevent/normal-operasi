import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

export interface JadwalPmRecord {
  tanggal: string; // YYYY-MM-DD
  bulan: number;
  tahun: number;
  lokasi: string;
  titik: string;
  jenis: string;
  tipe: string;
  kategori_pm: string;
  shift: string;
  id_lokasi?: string | null;
  id_titik?: string | null;
  id_tipe?: string | null;
}

export const MONTH_NAMES_ID = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

export const EQUIP_MAP: Record<string, { jenis: string; tipe: string }> = {
  'X-Ray Rapiscan 628 DV': { jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 628DV' },
  'X-Ray NUCTECH 100100 D': { jenis: 'X-Ray', tipe: 'X-Ray Nuctech CX100100D' },
  'X-Ray Smith Heiman HS 100100T-2IS': { jenis: 'X-Ray', tipe: 'X-Ray Smith Heimann HS 100100T-2is' },
  'X-Ray Smiths Heimann HS 100100T-2IS': { jenis: 'X-Ray', tipe: 'X-Ray Smith Heimann HS 100100T-2is' },
  'X-Ray Rapiscan 620 DV': { jenis: 'X-Ray', tipe: 'X-Ray Rapiscan 620DV' },
  'X-Ray Smiths Heimann HS 6040-2IS': { jenis: 'X-Ray', tipe: 'X-Ray Smith Heimann HS 6040T-2is' },
  'X-Ray Nuctech CX6040D': { jenis: 'X-Ray', tipe: 'X-Ray Nuctech CX6040D' },
  'WTMD CEIA': { jenis: 'WTMD', tipe: 'WTMD CEIA HI-PE/PZ Multizone' },
  'BS Leidos Prov 2': { jenis: 'Body Scanner', tipe: 'Body Scanner Leidos Provision 2' },
  'ETD QS B220': { jenis: 'ETD', tipe: 'ETD Leidos B220' },
  'Extension Conveyor X-Ray': { jenis: 'Extension Conveyor', tipe: 'Extension Conveyor' },
  'Access Control Honeywell': { jenis: 'Access Control', tipe: 'Access Control' }
};

// Pemetaan lokasi Excel ke penamaan standar Supabase
export function mapExcelLocationToSupabase(locRaw: string, merkRaw: string): Array<{ lokasi: string; titik: string }> {
  const lUpper = locRaw.trim().toUpperCase();
  const mUpper = merkRaw.trim().toUpperCase();

  // 1. HBSCP
  if (lUpper.includes('BREAKDOWN HBS')) {
    const digits = lUpper.replace('BREAKDOWN HBS', '').replace(/[^0-9]/g, '');
    const dotNum = digits.length === 2 ? `${digits[0]}.${digits[1]}` : digits;
    return [{ lokasi: 'HBSCP', titik: dotNum }];
  }
  if (lUpper.includes('HBS') && (lUpper.includes('27') || lUpper.includes('28'))) {
    const digits = lUpper.replace(/[^0-9]/g, '');
    const dotNum = digits.length >= 2 ? `${digits.slice(-2, -1)}.${digits.slice(-1)}` : digits;
    return [{ lokasi: 'HBSCP', titik: dotNum }];
  }

  // 2. X-Ray Conveyor Belt (Umroh bea cukai arrival 15, 16)
  if (lUpper.includes('BEA CUKAI') && (lUpper.includes('15') || lUpper.includes('16'))) {
    const digits = lUpper.replace(/[^0-9]/g, '');
    return [{ lokasi: 'X-Ray Conveyor Belt', titik: digits }];
  }
  if (lUpper.includes('CONVEYOR BELT')) {
    const digits = lUpper.replace(/[^0-9]/g, '');
    return [{ lokasi: 'X-Ray Conveyor Belt', titik: digits || '-' }];
  }

  // 3. Redline Arrival
  if (lUpper.includes('REDLINE') && lUpper.includes('ARRIVAL F')) {
    return [{ lokasi: 'Redline Arrival F', titik: '1' }];
  }
  if (lUpper.includes('REDLINE') && (lUpper.includes('UMROH') || lUpper.includes('UMRAH'))) {
    return [{ lokasi: 'Redline Arrival Umrah', titik: '2' }];
  }

  // 4. PSCP D, E, F
  for (const zone of ['D', 'E', 'F']) {
    if ((lUpper.includes(`PSCP ${zone}`) || lUpper.includes(`CORRIDOR ${zone}`)) && !lUpper.includes('TRANSFER')) {
      const partAfterZone = lUpper.split(zone)[1] || '';
      const digits = partAfterZone.replace(/[^0-9]/g, '');
      const suffix = lUpper.includes(' IN') ? ' Input' : (lUpper.includes(' OUT') ? ' Output' : '');
      return [{ lokasi: `PSCP ${zone}`, titik: digits ? `${digits}${suffix}` : '-' }];
    }
  }

  // 5. PSCP Umrah
  if (lUpper.includes('PSCP UMROH') || lUpper.includes('PSCP UMRAH') || lUpper.includes('LOUNGE UMROH')) {
    const digits = lUpper.replace(/[^0-9]/g, '');
    return [{ lokasi: 'PSCP Umrah', titik: digits || '-' }];
  }

  // 6. Transfer Desk
  if (lUpper.includes('TRANSFER DESK D')) return [{ lokasi: 'Transfer Desk D', titik: '-' }];
  if (lUpper.includes('TRANSFER DESK E')) return [{ lokasi: 'Transfer Desk E', titik: '-' }];

  // 7. SSCP (Meeting Point)
  if (lUpper.includes('SSCP E') || lUpper.includes('MEETING POINT E')) return [{ lokasi: 'SSCP E', titik: '-' }];
  if (lUpper.includes('SSCP F') || lUpper.includes('MEETING POINT F')) return [{ lokasi: 'SSCP F', titik: '-' }];
  if (lUpper.includes('SSCP UMROH') || lUpper.includes('SSCP UMRAH')) return [{ lokasi: 'SSCP Umrah', titik: '-' }];

  // 8. Arrival Hall
  if (lUpper.includes('ARRIVAL RAMPOUT F1') || lUpper.includes('ARRIVAL HALL F')) {
    return [{ lokasi: 'Arrival Hall F', titik: '-' }];
  }

  // 9. Access Control Honeywell
  if (mUpper.includes('HONEYWELL') || mUpper.includes('ACCESS CONTROL')) {
    if (lUpper.includes('BREAKDOWN') && lUpper.includes('LIFT')) {
      return [
        { lokasi: 'Breakdown E1', titik: '-' },
        { lokasi: 'Lift Difable E', titik: '-' },
        { lokasi: 'Mainframe E', titik: '-' }
      ];
    }
    if (lUpper.includes('RAMPOUT D')) {
      return [
        { lokasi: 'Rampout D', titik: '2' },
        { lokasi: 'Aviobridge D', titik: '1' },
        { lokasi: 'Server Access', titik: '-' }
      ];
    }
    if (lUpper.includes('RAMPOUT E')) {
      return [
        { lokasi: 'Rampout E', titik: '2' },
        { lokasi: 'Aviobridge E', titik: '1' },
        { lokasi: 'Ruang Monitoring E1', titik: 'PC Access D dan E' }
      ];
    }
    if (lUpper.includes('RAMPOUT F')) {
      return [
        { lokasi: 'Rampout F', titik: '1' },
        { lokasi: 'Aviobridge F', titik: '1' },
        { lokasi: 'Arrival F', titik: '1' }
      ];
    }
  }

  // Fallback
  return [{ lokasi: locRaw.trim(), titik: '-' }];
}

// Parsing single worksheet
export function parseSheetPm(ws: XLSX.WorkSheet, bulan: number, tahun: number): JadwalPmRecord[] {
  // Find header row with 'LOKASI'
  let headerRow = -1;
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AH80');

  for (let r = range.s.r; r <= Math.min(range.e.r, 15); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const val = String(ws[cellAddress]?.v || '').trim().toUpperCase();
      if (val === 'LOKASI') {
        headerRow = r;
        break;
      }
    }
    if (headerRow !== -1) break;
  }

  if (headerRow === -1) return [];

  // Find date columns in header row or headerRow + 1
  const dateCols: Array<{ col: number; dateNum: number }> = [];
  const candidateRows = [headerRow, headerRow + 1];

  for (const r of candidateRows) {
    for (let c = 3; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const val = ws[cellAddress]?.v;
      const num = Number(val);
      if (!isNaN(num) && num >= 1 && num <= 31) {
        if (!dateCols.some(dc => dc.col === c)) {
          dateCols.push({ col: c, dateNum: num });
        }
      }
    }
    if (dateCols.length >= 25) break;
  }

  if (dateCols.length === 0) return [];

  const startDataRow = Math.max(...candidateRows) + 1;
  const records: JadwalPmRecord[] = [];

  for (let r = startDataRow; r <= range.e.r; r++) {
    const locCell = ws[XLSX.utils.encode_cell({ r, c: 1 })]; // col B = 1
    const merkCell = ws[XLSX.utils.encode_cell({ r, c: 2 })]; // col C = 2

    const locVal = String(locCell?.v || '').trim();
    const merkVal = String(merkCell?.v || '').trim();

    if (!locVal || !merkVal) continue;
    const lUpper = locVal.toUpperCase();
    if (
      lUpper.startsWith('KALIBRASI') ||
      lUpper.startsWith('PM') ||
      lUpper.startsWith('TANGERANG') ||
      lUpper.startsWith('DINAS') ||
      lUpper.includes('DEPARTMENT HEAD')
    ) {
      continue;
    }

    // Split compound equipments, e.g. "X-Ray Rapiscan 620 DV & WTMD CEIA"
    const equipParts = merkVal.split('&').map(p => p.trim()).filter(Boolean);
    const mappedLocs = mapExcelLocationToSupabase(locVal, merkVal);

    for (const dc of dateCols) {
      const cellAddress = XLSX.utils.encode_cell({ r, c: dc.col });
      const cell = ws[cellAddress];

      let kategoriPm: string | null = null;
      let shift = 'ALL';

      // 1. Check style background/fgColor
      if (cell?.s?.fgColor) {
        const rgb = String(cell.s.fgColor.rgb || '').toUpperCase();
        const theme = cell.s.fgColor.theme;

        if (rgb === 'FFFF00' || rgb === 'FFFFFF00') {
          kategoriPm = 'PM Mingguan';
          shift = 'ALL';
        } else if (rgb === 'FF0000' || rgb === 'FFFF0000') {
          kategoriPm = 'Kalibrasi & PM Bulanan (PS)';
          shift = 'PS';
        } else if (rgb === '0070C0' || rgb === 'FF0070C0' || rgb === '4472C4' || theme === 4) {
          kategoriPm = 'Kalibrasi & PM Bulanan (M)';
          shift = 'M';
        }
      }

      // 2. Check text fallback if any
      if (!kategoriPm && cell?.v) {
        const textVal = String(cell.v).trim().toLowerCase();
        if (textVal.includes('mingguan')) {
          kategoriPm = 'PM Mingguan';
          shift = 'ALL';
        } else if (textVal.includes('ps') || textVal.includes('bulanan ps')) {
          kategoriPm = 'Kalibrasi & PM Bulanan (PS)';
          shift = 'PS';
        } else if (textVal.includes('m') || textVal.includes('bulanan m')) {
          kategoriPm = 'Kalibrasi & PM Bulanan (M)';
          shift = 'M';
        }
      }

      if (kategoriPm) {
        const monthStr = String(bulan).padStart(2, '0');
        const dayStr = String(dc.dateNum).padStart(2, '0');
        const tanggalStr = `${tahun}-${monthStr}-${dayStr}`;

        for (const locItem of mappedLocs) {
          for (const ep of equipParts) {
            const mappedEquip = EQUIP_MAP[ep] || { jenis: 'Peralatan', tipe: ep };
            records.push({
              tanggal: tanggalStr,
              bulan,
              tahun,
              lokasi: locItem.lokasi,
              titik: locItem.titik,
              jenis: mappedEquip.jenis,
              tipe: mappedEquip.tipe,
              kategori_pm: kategoriPm,
              shift
            });
          }
        }
      }
    }
  }

  return records;
}

// Menyisipkan foreign keys (id_lokasi, id_titik, id_tipe) dari Supabase
export async function enrichRecordsWithSupabaseIds(records: JadwalPmRecord[]): Promise<JadwalPmRecord[]> {
  try {
    const [lokasiRes, titikRes, tipeRes] = await Promise.all([
      supabase.from('lokasi').select('id, nama'),
      supabase.from('titik_lokasi').select('id, id_lokasi, nomor'),
      supabase.from('tipe_peralatan').select('id, nama')
    ]);

    const lokasiMap = new Map<string, string>();
    lokasiRes.data?.forEach(l => {
      lokasiMap.set(l.nama.trim().toUpperCase(), l.id);
    });

    const titikMap = new Map<string, string>(); // `${id_lokasi}_${nomor}` -> id
    titikRes.data?.forEach(t => {
      titikMap.set(`${t.id_lokasi}_${t.nomor.trim().toUpperCase()}`, t.id);
    });

    const tipeMap = new Map<string, string>();
    tipeRes.data?.forEach(t => {
      tipeMap.set(t.nama.trim().toUpperCase(), t.id);
    });

    return records.map(r => {
      const idLokasi = lokasiMap.get(r.lokasi.trim().toUpperCase()) || null;
      let idTitik: string | null = null;
      if (idLokasi && r.titik) {
        idTitik = titikMap.get(`${idLokasi}_${r.titik.trim().toUpperCase()}`) || null;
      }
      const idTipe = tipeMap.get(r.tipe.trim().toUpperCase()) || null;

      return {
        ...r,
        id_lokasi: idLokasi,
        id_titik: idTitik,
        id_tipe: idTipe
      };
    });
  } catch (err) {
    console.warn('Gagal menghubungkan ID relasi Supabase:', err);
    return records;
  }
}

// Format daftar PM ke bentuk teks rencana kegiatan harian
export function formatPmRencanaKegiatan(activePm: Array<{ lokasi: string; titik?: string; tipe: string }>): string {
  if (!activePm || activePm.length === 0) return '';

  const locMap = new Map<string, string[]>();
  activePm.forEach(item => {
    const locDisplay = item.titik && item.titik !== '-' 
      ? `${item.lokasi} ${item.titik}` 
      : item.lokasi;
    if (!locMap.has(locDisplay)) {
      locMap.set(locDisplay, []);
    }
    const list = locMap.get(locDisplay)!;
    if (!list.includes(item.tipe)) {
      list.push(item.tipe);
    }
  });

  const lines: string[] = [];
  locMap.forEach((types, locDisplay) => {
    let typesFormatted = '';
    if (types.length === 1) {
      typesFormatted = types[0];
    } else if (types.length === 2) {
      typesFormatted = `${types[0]} & ${types[1]}`;
    } else {
      typesFormatted = `${types.slice(0, -1).join(', ')}, & ${types[types.length - 1]}`;
    }
    lines.push(`${typesFormatted} di ${locDisplay}`);
  });

  return `Preventive Maintenance & Kalibrasi Peralatan :\n` + lines.join('\n');
}
