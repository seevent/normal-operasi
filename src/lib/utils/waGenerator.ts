// src/lib/utils/waGenerator.ts

import { formatTanggalIndo, getStoringSupervisorLocations, getValidXRayModels, getValidModels, parseLokasiDanTitik } from './locationRules';
import { buildShiftReportMessage } from './shiftReportMessage';
import { formatLokasi, formatLokasiRows, formatStoringLokasi } from './lokasiFormat.ts';
import type {
  BAFormData, ChecklistFormData, IncidentFormData, JadwalShiftRow, KalibrasiEntry, KalibrasiGlobalData,
  ShiftReportRow, StoringFormData,
} from '../types.ts';
import type { ChecklistBlock } from './checklistEditor.ts';
import { formatXRayParams, formatWtmdParams, XRAY_ARCHIVE_DEFAULT } from './kalibrasiParams.ts';

export { formatACLokasiList } from './lokasiFormat.ts';
export { generateWA_Perbaikan } from './perbaikanMessage.ts';

export { generateWA_Kehadiran } from './kehadiranMessage.ts';

export { generateWA_Briefing } from './briefingMessage.ts';

export const generateWA_Storing = (storingData: StoringFormData) => {
  const formattedDate = formatTanggalIndo(storingData.tanggal);
  const jamMulai = storingData.waktuMulai || '...';
  const jamSelesai = storingData.waktuSelesai || '...';
  
  let equipString = '-';
  if (storingData.peralatan.length === 1) {
    equipString = storingData.peralatan[0];
  } else if (storingData.peralatan.length > 1) {
    const lastEquip = storingData.peralatan[storingData.peralatan.length - 1];
    const otherEquips = storingData.peralatan.slice(0, -1).join(', ');
    equipString = `${otherEquips} & ${lastEquip}`;
  }

  const locString = formatStoringLokasi(storingData.acLokasi, storingData.acNomor, storingData.lokasi, storingData.nomor);
  
  const supervisorLocs = getStoringSupervisorLocations(storingData.peralatan || [], storingData.acLokasi || [], storingData.acNomor || {});
  const supMap = storingData.supervisorAvsecMap || {};
  let supervisorAvsecLine = '';

  if (supervisorLocs.length > 0) {
    const lines = supervisorLocs
      .map(locKey => {
        const val = supMap[locKey] || (supervisorLocs.length === 1 ? storingData.supervisorAvsec : '');
        return `Supervisor Avsec ${locKey} : ${val || '-'}`;
      });
    supervisorAvsecLine = '\n' + lines.join('\n');
  }
  
  return `*KEGIATAN STORING PERALATAN SSES T2*
Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}
Peralatan : ${equipString}
Lokasi : ${locString}
Hasil : ${storingData.hasil}${supervisorAvsecLine}`;
};

type SummaryCounts = Record<string, { total: number; operasi: number; off: number }>;

export const generateWA_Checklist = (checklistData: ChecklistFormData, checklistDataMaster: ChecklistBlock[], toggles: Record<string, boolean>) => {
  const formattedDate = formatTanggalIndo(checklistData.tanggal);
  const jamMulai = checklistData.waktuMulai || '...';
  const jamSelesai = checklistData.waktuSelesai || '...';
  
  let result = `*KEGIATAN STORING PERALATAN SSES T2*\n`;
  result += `Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}\n\n`;

  checklistDataMaster.forEach((block) => {
    const blockTitle = block.title ?? '';
    if (block.type === 'location') {
      result += `${blockTitle}\n`;
      const summaryCounts: SummaryCounts = {};

      (block.categories ?? []).forEach((cat) => {
        result += `${cat.title}\n`;
        if (!summaryCounts[String(cat.summaryKey)]) summaryCounts[String(cat.summaryKey)] = { total: 0, operasi: 0, off: 0 };

        (cat.items ?? []).forEach((item, iIdx) => {
          const key = `${blockTitle}|${cat.title}|${iIdx}`;
          const isOperasi = toggles[key] !== false; // Default is true (Operasi)
          result += `* ${item} ${isOperasi ? '✅' : '❌'}\n`;
          
          summaryCounts[String(cat.summaryKey)].total++;
          if (isOperasi) summaryCounts[String(cat.summaryKey)].operasi++;
          else summaryCounts[String(cat.summaryKey)].off++;
        });
        result += `\n`; 
      });

      result += `${block.summary}\n`;
      Object.keys(summaryCounts).forEach((sKey) => {
          result += `${sKey}  : ${summaryCounts[sKey].total}\n`;
          result += `* Operasi : ${summaryCounts[sKey].operasi}\n`;
          result += `* Off : ${summaryCounts[sKey].off}\n`;
      });
      result += `\n`;
      
      if (blockTitle === 'HBSCP' || (blockTitle.includes('HBSCP') && !blockTitle.includes('UMROH'))) {
        const sup1 = checklistData.supervisorAvsec?.['HBSCP 1.1 - 1.6'] || '-';
        const sup2 = checklistData.supervisorAvsec?.['HBSCP 2.1 - 2.6'] || '-';
        result += `Supervisor Avsec HBSCP 1.1 - 1.6 : ${sup1}\n`;
        result += `Supervisor Avsec HBSCP 2.1 - 2.6 : ${sup2}\n\n`;
      } else if (blockTitle === 'ACCESS CONTROL' || blockTitle.includes('ACCESS CONTROL')) {
        const sup = checklistData.supervisorAvsec?.[blockTitle] || checklistData.supervisorAvsec?.['Monitoring Access E1'] || '-';
        result += `Supervisor Avsec Monitoring Access E1 : ${sup}\n\n`;
      } else {
        const supAvsec = checklistData.supervisorAvsec?.[blockTitle] || '-';
        result += `Supervisor Avsec ${blockTitle} : ${supAvsec}\n\n`;
      }

    } else if (block.type === 'group') {
      const summaryCounts: SummaryCounts = {};
      
      (block.locations ?? []).forEach((loc) => {
        const locTitle = loc.title ?? '';
        result += `${locTitle}\n`;
        (loc.categories ?? []).forEach((cat) => {
          result += `${cat.title}\n`;
          if (!summaryCounts[String(cat.summaryKey)]) summaryCounts[String(cat.summaryKey)] = { total: 0, operasi: 0, off: 0 };

          (cat.items ?? []).forEach((item, iIdx) => {
            const key = `${locTitle}|${cat.title}|${iIdx}`;
            const isOperasi = toggles[key] !== false;
            result += `* ${item} ${isOperasi ? '✅' : '❌'}\n`;
            
            summaryCounts[String(cat.summaryKey)].total++;
            if (isOperasi) summaryCounts[String(cat.summaryKey)].operasi++;
            else summaryCounts[String(cat.summaryKey)].off++;
          });
          result += `\n`;
        });
        
        if (locTitle === 'HBSCP' || (locTitle.includes('HBSCP') && !locTitle.includes('UMROH'))) {
          const sup1 = checklistData.supervisorAvsec?.['HBSCP 1.1 - 1.6'] || '-';
          const sup2 = checklistData.supervisorAvsec?.['HBSCP 2.1 - 2.6'] || '-';
          result += `Supervisor Avsec HBSCP 1.1 - 1.6 : ${sup1}\n`;
          result += `Supervisor Avsec HBSCP 2.1 - 2.6 : ${sup2}\n\n`;
        } else if (locTitle === 'ACCESS CONTROL' || locTitle.includes('ACCESS CONTROL')) {
          const sup = checklistData.supervisorAvsec?.[locTitle] || checklistData.supervisorAvsec?.['Monitoring Access E1'] || '-';
          result += `Supervisor Avsec Monitoring Access E1 : ${sup}\n\n`;
        } else {
          const supAvsecLoc = checklistData.supervisorAvsec?.[locTitle] || '-';
          result += `Supervisor Avsec ${locTitle} : ${supAvsecLoc}\n\n`;
        }
      });

      result += `${block.summary}\n`;
      Object.keys(summaryCounts).forEach((sKey) => {
          result += `${sKey}  : ${summaryCounts[sKey].total}\n`;
          result += `* Operasi : ${summaryCounts[sKey].operasi}\n`;
          result += `* Off : ${summaryCounts[sKey].off}\n`;
      });
      result += `\n`;

    } else if (block.type === 'access_control') {
      result += `${blockTitle}\n`;
      let totalAc = 0, operasiAc = 0, offAc = 0;

      (block.terminals ?? []).forEach((term) => {
        const termTitle = term.title ?? '';
        if (termTitle) result += `${termTitle}\n`;
        (term.categories ?? []).forEach((cat) => {
          result += `${cat.title}\n`;
          (cat.items ?? []).forEach((item, iIdx) => {
            const key = `${blockTitle}|${termTitle}|${cat.title}|${iIdx}`;
            const isOperasi = toggles[key] !== false;
            result += `* ${item} ${isOperasi ? '✅' : '❌'}\n`;
            
            totalAc++;
            if (isOperasi) operasiAc++;
            else offAc++;
          });
          result += `\n`;
        });
      });

      result += `${block.summary} : ${totalAc}\n`;
      result += `OPERASI : ${operasiAc}\n`;
      result += `OFF : ${offAc}\n`;
      result += `\n`;
      const supAvsec = checklistData.supervisorAvsec?.[blockTitle] || checklistData.supervisorAvsec?.['Monitoring Access E1'] || '-';
      result += `Supervisor Avsec Monitoring Access E1 : ${supAvsec}\n\n`;
    }
  });

  result += `TERIMA KASIH\nMELANGKAH BERSAMA UNTUK CGK HEBAT\nBERSAMA MELAYANI SEPENUH HATI`;
  return result.trim();
};

export const formatKalibrasiEntryKegiatanDanCatatan = (entry: KalibrasiEntry) => {
  const hasAccessControl = Array.isArray(entry.peralatan)
    ? entry.peralatan.some((p: string) => String(p).toLowerCase().includes('access control'))
    : String(entry.peralatan || '').toLowerCase().includes('access control');

  if (hasAccessControl) {
    const locs = entry.acLokasi || (entry.lokasi1 ? [entry.lokasi1] : []);
    let lokasiAC = '...';
    if (locs.length === 1) {
      lokasiAC = locs[0];
    } else if (locs.length > 1) {
      const lastLoc = locs[locs.length - 1];
      const otherLocs = locs.slice(0, -1).join(', ');
      lokasiAC = `${otherLocs} & ${lastLoc}`;
    }

    const kegiatan = `- Pembersihan Emlock, Switch, Intercom, Fingerprint & CCTV\n- Pengecekan Fungsi Emlock, Intercom, Fingerprint, CCTV, Pengontrolan Kunci Pintu, Record CCTV`;
    const catatan = `- Fungsi Emlock : ${entry.acEmlock || 'Berfungsi'}\n- Fungsi Intercom : ${entry.acIntercom || 'Berfungsi'}\n- Fungsi Fingerprint: ${entry.acFingerprint || 'Berfungsi'}\n- Fungsi CCTV : ${entry.acCctv || 'Berfungsi'}\n- Fungsi Pengontrolan Kunci Pintu : ${entry.acPengontrolan || 'Berfungsi'}\n- Record CCTV : ${entry.acRecordCctv || '+- 1 bulan'}`;

    return {
      lokasiStr: lokasiAC,
      equipString: 'Access Control',
      kegiatan,
      catatan,
      fullText: `Kegiatan :\n${kegiatan}\n   \nCatatan :\n${catatan}`
    };
  }

  // Data lama bisa berupa string "A, B & C"; tipe resminya string[].
  const rawPeralatan = entry.peralatan as string[] | string;
  const peralatanList = Array.isArray(rawPeralatan)
    ? rawPeralatan
    : (typeof rawPeralatan === 'string' ? rawPeralatan.split(/[,&]/).map((s) => s.trim()).filter(Boolean) : []);

  // Sort equipments so 'Extension Conveyor' appears first if present
  const sortedEquips = [...peralatanList].sort((a, b) => {
    if (a.toLowerCase().includes('extension conveyor')) return -1;
    if (b.toLowerCase().includes('extension conveyor')) return 1;
    return 0;
  });

  const getEquipDisplayName = (eq: string) => {
    const trimmed = eq.trim();
    const upper = trimmed.toUpperCase();
    if (upper === 'X-RAY' || upper === 'XRAY') {
      if (entry.xrayModel && entry.xrayModel !== 'Semua X-Ray') return entry.xrayModel;
      const validModels = getValidXRayModels(entry.lokasi1 || '', entry.lokasi2).filter((m: string) => !m.startsWith('Semua '));
      if (validModels.length > 0) return validModels[0];
      return 'X-Ray';
    }
    if (upper === 'WTMD') {
      if (entry.wtmdModel && entry.wtmdModel !== 'Semua WTMD') return entry.wtmdModel;
      const validModels = getValidModels(entry.lokasi1 || '', 'WTMD', entry.lokasi2).filter((m: string) => !m.startsWith('Semua '));
      if (validModels.length > 0) return validModels[0];
      return 'WTMD';
    }
    if (upper === 'HHMD') {
      if (entry.hhmdModel && entry.hhmdModel !== 'Semua HHMD') return entry.hhmdModel;
      const validModels = getValidModels(entry.lokasi1 || '', 'HHMD', entry.lokasi2).filter((m: string) => !m.startsWith('Semua '));
      if (validModels.length > 0) return validModels[0];
      return 'HHMD';
    }
    if (upper === 'BODY SCANNER') {
      if (entry.bsModel && entry.bsModel !== 'Semua Body Scanner') return entry.bsModel;
      const validModels = getValidModels(entry.lokasi1 || '', 'Body Scanner', entry.lokasi2).filter((m: string) => !m.startsWith('Semua '));
      if (validModels.length > 0) return validModels[0];
      return 'Body Scanner';
    }
    if (upper === 'ETD') {
      if (entry.etdModel && entry.etdModel !== 'Semua ETD') return entry.etdModel;
      const validModels = getValidModels(entry.lokasi1 || '', 'ETD', entry.lokasi2).filter((m: string) => !m.startsWith('Semua '));
      if (validModels.length > 0) return validModels[0];
      return 'ETD';
    }
    return eq;
  };

  const equipListFormatted = sortedEquips.map(getEquipDisplayName);

  const formatItemsString = (items: string[]) => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;
  };

  const equipString = formatItemsString(equipListFormatted) || '-';

  // Helper detections using substring/includes
  const hasExtensionConveyor = sortedEquips.some(eq => eq.toLowerCase().includes('extension conveyor'));
  const hasXRay = sortedEquips.some(eq => eq.toLowerCase().includes('x-ray') || eq.toLowerCase().includes('xray'));
  const hasWtmd = sortedEquips.some(eq => eq.toLowerCase().includes('wtmd'));
  const hasBs = sortedEquips.some(eq => eq.toLowerCase().includes('body scanner'));
  const hasEtd = sortedEquips.some(eq => eq.toLowerCase().includes('etd'));

  const calibratedEquipNames = sortedEquips
    .filter(eq => !eq.toLowerCase().includes('extension conveyor'))
    .map(getEquipDisplayName);

  const kegiatanLines: string[] = [];
  kegiatanLines.push(`- Pembersihan ${equipString}`);
  if (hasExtensionConveyor) {
    kegiatanLines.push('- Pemberian Pelumas pada Extension Conveyor');
  }
  if (calibratedEquipNames.length > 0) {
    kegiatanLines.push(`- Kalibrasi ${formatItemsString(calibratedEquipNames)}`);
  }

  const catatanBlocks: string[] = [];

  if (hasExtensionConveyor) {
    catatanBlocks.push(`Extension Conveyor\n- Gearbox Motor : ${entry.ecGearbox || 'Normal'}\n- Tension Roller : ${entry.ecTension || 'Normal'}\n- Conveyor Belt : ${entry.ecBelt || 'Normal'}`);
  }

  if (hasXRay) {
    const rawXRay = sortedEquips.find(eq => eq.toLowerCase().includes('x-ray') || eq.toLowerCase().includes('xray')) || 'X-Ray';
    const xrayName = (rawXRay.toLowerCase() === 'x-ray' || rawXRay.toLowerCase() === 'xray')
      ? getEquipDisplayName('X-Ray')
      : rawXRay;
    catatanBlocks.push(`${xrayName}\n${formatXRayParams(entry)}`);
  }
  
  if (hasWtmd) {
    const rawWtmd = sortedEquips.find(eq => eq.toLowerCase().includes('wtmd')) || 'WTMD';
    const wtmdName = rawWtmd.toUpperCase() === 'WTMD'
      ? getEquipDisplayName('WTMD')
      : rawWtmd;
    catatanBlocks.push(`${wtmdName}\n${formatWtmdParams(entry)}`);
  }

  if (hasBs) {
    const rawBs = sortedEquips.find(eq => eq.toLowerCase().includes('body scanner')) || 'Body Scanner';
    const bsName = rawBs.toLowerCase() === 'body scanner'
      ? getEquipDisplayName('Body Scanner')
      : rawBs;
    catatanBlocks.push(`${bsName}\n- Test Tampilan Suspect Item : ${entry.bsSuspect || 'Normal'}\n- Test Monitor : ${entry.bsMonitor || 'Normal'}\n- Test Fungsi Scanning : ${entry.bsScanning || 'Normal'}\n- Test Fungsi Kalibrasi : ${entry.bsCalibration || 'Normal'}`);
  }

  if (hasEtd) {
    const rawEtd = sortedEquips.find(eq => eq.toLowerCase().includes('etd')) || 'ETD';
    const etdName = rawEtd.toUpperCase() === 'ETD'
      ? getEquipDisplayName('ETD')
      : rawEtd;
    catatanBlocks.push(`${etdName}\n- Sampling Test TNT : ${entry.etdTnt || 'Alarm'}\n- Sampling Test PETN : ${entry.etdPetn || 'Alarm'}\n- Sampling Test RDX : ${entry.etdRdx || 'Alarm'}`);
  }

  const kegiatan = kegiatanLines.join('\n');
  const catatan = catatanBlocks.join('\n\n');
  const locString = formatLokasi(entry.lokasi1, entry.lokasi2);
  const lokasiStr = locString.trim() || '...';

  return {
    lokasiStr,
    equipString,
    kegiatan,
    catatan,
    fullText: `Kegiatan :\n${kegiatan}${catatan ? `\n   \nCatatan :\n${catatan}` : ''}`
  };
};

export const getDefaultKalibrasiUraian = (peralatan: string, lokasi?: string): string => {
  const equips = peralatan ? peralatan.split(/[,&]/).map(s => s.trim()).filter(Boolean) : [];
  const { lokasi1, lokasi2 } = parseLokasiDanTitik(lokasi || '');
  const fakeEntry: KalibrasiEntry = {
    peralatan: equips.length > 0 ? equips : ['Peralatan'],
    lokasi1,
    lokasi2,
    acLokasi: [lokasi || 'Access Control'],
    acEmlock: 'Berfungsi',
    acIntercom: 'Berfungsi',
    acFingerprint: 'Berfungsi',
    acCctv: 'Berfungsi',
    acPengontrolan: 'Berfungsi',
    acRecordCctv: '+- 1 bulan',
    ecGearbox: 'Normal',
    ecTension: 'Normal',
    ecBelt: 'Normal',
    bsSuspect: 'Normal',
    bsMonitor: 'Normal',
    bsScanning: 'Normal',
    bsCalibration: 'Normal',
    etdTnt: 'Alarm',
    etdPetn: 'Alarm',
    etdRdx: 'Alarm',
    xrayKvV: '',
    xrayKvH: '',
    xrayMaV: '',
    xrayMaH: '',
    xrayOnV: '',
    xrayOnH: '',
    xrayArchive: XRAY_ARCHIVE_DEFAULT,
    wtmdZ1: '',
    wtmdZ2: '',
    wtmdZ3: '',
    wtmdZ4: '',
    wtmdLc: '',
    wtmdLs: '',
    wtmdUc: '',
    wtmdSe: '',
    wtmdDs: ''
  };
  return formatKalibrasiEntryKegiatanDanCatatan(fakeEntry).fullText;
};

export const generateWA_Kalibrasi = (kalibrasiGlobal: KalibrasiGlobalData, kalibrasiEntries: KalibrasiEntry[]) => {
  if (kalibrasiEntries.length === 0 || kalibrasiEntries.every(e => e.peralatan.length === 0)) {
    return "Silakan tambah peralatan pada lokasi untuk melihat preview laporan...";
  }

  const formattedDate = formatTanggalIndo(kalibrasiGlobal.tanggal);
  const jamMulai = kalibrasiGlobal.waktuMulai || '...';
  const jamSelesai = kalibrasiGlobal.waktuSelesai || '...';

  // Check if any equipment requires calibration (Extension Conveyor is preventive maintenance only)
  const hasKalibrasi = kalibrasiEntries.some(e =>
    e.peralatan.some((eq: string) => eq !== 'Extension Conveyor')
  );
  const judul = hasKalibrasi 
    ? '*LAPORAN PREVENTIVE MAINTENANCE & KALIBRASI SSES T2*' 
    : '*PREVENTIVE MAINTENANCE SSES T2*';

  let msg = `${judul}\nHari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}`;

  kalibrasiEntries.forEach((entry) => {
    if (entry.peralatan.length === 0) return; 
    const { equipString, lokasiStr, fullText } = formatKalibrasiEntryKegiatanDanCatatan(entry);
    msg += `\n\nPeralatan : ${equipString}\nLokasi : ${lokasiStr}\n\n${fullText}`;
  });

  return msg;
};

export { generateWA_Kegiatan } from './kegiatanMessage.ts';

export const generateWA_InitialReport = (formData: IncidentFormData) => {
  if (!formData.peralatan) return "Silakan pilih peralatan terlebih dahulu untuk melihat preview laporan...";

  const dateParts = formData.tanggal ? formData.tanggal.split('-') : ['','',''];
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '';

  const locList = formData.lokasiList && Array.isArray(formData.lokasiList) && formData.lokasiList.length > 0
    ? formData.lokasiList.filter((l) => l.lokasi1)
    : [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
    
  const lokasiFinal = formatLokasiRows(locList) || '-';

  const pukulStr = formData.waktuMulai ? `${formData.waktuMulai} WIB` : ' WIB';
  const teknisiStr = formData.teknisi || '-';
  const permasalahanStr = formData.permasalahan || '';
  const statusStr = formData.status || '-';
  const uraianStr = (formData.uraian && formData.uraian !== '• ') ? formData.uraian : '(Uraian kronologis kerusakan s.d saat dilaporkan)';
  const dampakStr = (formData.dampak && formData.dampak !== '1. ') ? formData.dampak : (formData.dampak || '1. ...');
  const mitigasiStr = (formData.tindakanMitigasi && formData.tindakanMitigasi !== '1. ') ? formData.tindakanMitigasi : (formData.tindakanMitigasi || '1. ...');

  return `*INITIAL REPORT*

Nama Peralatan : ${formData.peralatan}
Lokasi : ${lokasiFinal}

🗓️ Tanggal : ${formattedDate}
🕝 Pukul : ${pukulStr}
👨🏻‍🔧 Teknisi : ${teknisiStr}

🪛 Permasalahan : 
${permasalahanStr}

Status : ${statusStr}

*URAIAN*
${uraianStr}

*DAMPAK*
${dampakStr}

*MITIGASI*
${mitigasiStr}


Demikian laporan kronologis dan tindak lanjut kami sampaikan
Terimakasih atas perhatiannya.`;
};

export const generateWA_BASerahTerima = (baData: BAFormData) => {
  const formattedDate = formatTanggalIndo(baData.tanggal);
  const waktuText = baData.waktu ? `${baData.waktu} WIB` : '...';
  const jenisText = baData.jenisTransaksi === 'masuk' ? 'PENERIMAAN BARANG' : 'PENYERAHAN BARANG';

  const barangListText = Array.isArray(baData.items) && baData.items.length > 0
    ? baData.items.map((it, idx) => {
        const snJoined = Array.isArray(it.snList)
          ? it.snList.filter((s: string) => s && s.trim() !== '').join(', ')
          : (it.sn || '');
        return `${idx + 1}. *${it.nama || '-'}* - ${it.qty || '1'} ${it.satuan || 'Pcs'} (${it.kondisi || 'Baik'}) ${snJoined ? `[SN: ${snJoined}]` : ''}`;
      }).join('\n')
    : '- (Belum ada barang)';

  return `*BERITA ACARA SERAH TERIMA BARANG*
*Tipe:* ${jenisText}

🗓️ Hari/Tanggal : ${formattedDate}
🕝 Pukul : ${waktuText}

👤 *PIHAK KESATU (YANG MENYERAHKAN)*
- Nama : ${baData.penyerahNama || '-'}
- Jabatan : ${baData.penyerahJabatan || '-'}
- Unit : ${baData.penyerahInstansi || '-'}

👤 *PIHAK KEDUA (YANG MENERIMA)*
- Nama : ${baData.penerimaNama || '-'}
- Jabatan : ${baData.penerimaJabatan || '-'}
- Unit : ${baData.penerimaInstansi || '-'}

📦 *DAFTAR BARANG:*
${barangListText}

Demikian Berita Acara ini dibuat dengan sebenar-benarnya untuk dapat digunakan sebagaimana mestinya.
Terimakasih atas perhatiannya.`;
};

export const generateWA_ShiftReport = (
  date: string,
  shift: string,
  apiPersonil: JadwalShiftRow[],
  iasPersonil: JadwalShiftRow[],
  reports: ShiftReportRow[]
): string => buildShiftReportMessage(date, shift, apiPersonil, iasPersonil, reports, getDefaultKalibrasiUraian);

