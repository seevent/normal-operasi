// src/lib/utils/waGenerator.ts

import { formatTanggalIndo, getStoringSupervisorLocations, getValidXRayModels, getValidModels, parseLokasiDanTitik } from './locationRules';
import { sortPersonelByJabatan } from '../data/masterData';
import { buildShiftReportMessage } from './shiftReportMessage';

export const generateWA_Perbaikan = (formData: any, isVerifikasiETD: boolean) => {
  if (!formData.peralatan) return "Silakan pilih peralatan terlebih dahulu untuk melihat preview laporan...";
  const dateParts = formData.tanggal ? formData.tanggal.split('-') : ['','',''];
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '';
  const locList = formData.lokasiList && Array.isArray(formData.lokasiList) && formData.lokasiList.length > 0
    ? formData.lokasiList.filter((l: any) => l.lokasi1)
    : [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
    
  const lokasiFinal = locList.map((loc: any) => {
    if (loc.isManual || (loc.lokasi2 === '-' && !loc.lokasi2)) return loc.lokasi1;
    return loc.lokasi1 + (loc.lokasi2 && loc.lokasi2 !== '-' ? ((formData.peralatan === 'Access Control' || loc.lokasi1 === 'HBSCP') ? ` ${loc.lokasi2}` : ` No.${loc.lokasi2}`) : '');
  }).join(', ');
  const judulLaporan = isVerifikasiETD ? `Laporan Verifikasi ${formData.peralatan}` : `Laporan Perbaikan ${formData.peralatan}`;

  const statusIcon = (formData.status === 'Pekerjaan Selesai' || formData.status === 'Normal Operasi') ? '✅' : '⚠️';

  return `${judulLaporan}

Lokasi : ${lokasiFinal}
Sumber laporan : ${formData.sumberLaporan}
${isVerifikasiETD ? '' : `Indikasi awal : ${formData.indikasiAwal}`}

🗓️ Tanggal :  ${formattedDate}
🕝 Pukul : ${formData.waktuMulai} - ${formData.waktuSelesai}
⏰ Lama waktu Pengerjaan : ${formData.lamaPengerjaan}
👨🏻‍🔧 Teknisi : ${formData.teknisi}

🪛 Permasalahan :
${formData.permasalahan}
🪛 Tindak lanjut  : 
${formData.tindakLanjut}

${statusIcon} Status : ${formData.status}

Demikian laporan tindak lanjut kami sampaikan.
Terimakasih atas perhatiannya`;
};

const formatPersonnelList = (list: any[]) => {
  const activeList = list.filter(item => item.name !== '');
  if (activeList.length === 0) return "- (Kosong)";
  return activeList.map(item => `- ${item.name} - ${item.status}\n     Tlp : ${item.phone}`).join('\n');
};

export const generateWA_Kehadiran = (attendanceData: any) => {
  const formattedDate = formatTanggalIndo(attendanceData.tanggal);
  const greeting = 'Semangat Pagii.....!!!';

  const sortedApiList = sortPersonelByJabatan(attendanceData.apiList || []);
  const sortedOmList = sortPersonelByJabatan(attendanceData.omList || []);

  return `${greeting}
T2 Safety & Security Electronic Services

Dinas     : ${attendanceData.shift}
Hari      : ${formattedDate}

Personel API T2 :
${formatPersonnelList(sortedApiList)}

Personel OM IAS T2 :
${formatPersonnelList(sortedOmList)}

Tlp Ruangan :
${attendanceData.tlpRuangan}

Rencana Kegiatan :
${attendanceData.rencanaKegiatan}`;
};

export const generateWA_Briefing = (briefingData: any, selectedSpareparts: any[] = []) => {
  const formattedDate = formatTanggalIndo(briefingData.tanggal);
  const judul = briefingData.jenis === 'Unit' ? '*Giat briefing unit SSES T2*' : '*Briefing MOT T2*';
  let text = `${judul}\nHari/Tanggal : ${formattedDate}\nShift : ${briefingData.shift}\nLokasi : ${briefingData.lokasi}`;

  if (briefingData.jenis === 'Unit' && selectedSpareparts && selectedSpareparts.length > 0) {
    const sparepartsText = selectedSpareparts
      .map(sp => `- ${sp.name} : ${sp.current_stock ?? 0} ${sp.unit || 'PCS'}`)
      .join('\n');
    text += `\n\n${sparepartsText}`;
  }

  return text;
};

export const formatACLokasiList = (locs: string[]): string => {
  if (!locs || locs.length === 0) return '-';
  if (locs.length === 1) return locs[0];

  interface FormattedChunk {
    text: string;
    minIndex: number;
  }

  const results: FormattedChunk[] = [];
  const normalLocsWithIndex: { loc: string; idx: number }[] = [];

  locs.forEach((loc, idx) => {
    if (loc.toUpperCase().includes('PSCP') || loc.toUpperCase().includes('BEA CUKAI') || loc.toUpperCase().includes('BELT')) {
      results.push({ text: loc.trim(), minIndex: idx });
    } else {
      normalLocsWithIndex.push({ loc: loc.trim(), idx });
    }
  });

  // Step 1: Group normalLocs by prefix
  const prefixGroups: Map<string, { suffix: string; idx: number }[]> = new Map();
  normalLocsWithIndex.forEach(({ loc, idx }) => {
    const parts = loc.split(' ');
    if (parts.length >= 2) {
      const prefix = parts.slice(0, -1).join(' ');
      const suffix = parts[parts.length - 1];
      if (!prefixGroups.has(prefix)) prefixGroups.set(prefix, []);
      prefixGroups.get(prefix)!.push({ suffix, idx });
    } else {
      results.push({ text: loc, minIndex: idx });
    }
  });

  const remainingForSuffixGroup: { prefix: string; suffix: string; idx: number }[] = [];

  prefixGroups.forEach((items, prefix) => {
    if (items.length === 1) {
      remainingForSuffixGroup.push({ prefix, suffix: items[0].suffix, idx: items[0].idx });
    } else {
      const minIndex = Math.min(...items.map(i => i.idx));
      const suffixes = items.map(i => i.suffix);
      const lastSuffix = suffixes[suffixes.length - 1];
      const otherSuffixes = suffixes.slice(0, -1).join(', ');
      results.push({ text: `${prefix} ${otherSuffixes} & ${lastSuffix}`, minIndex });
    }
  });

  // Step 2: Group remaining by suffix
  const suffixGroups: Map<string, { prefix: string; idx: number }[]> = new Map();
  remainingForSuffixGroup.forEach(({ prefix, suffix, idx }) => {
    if (!suffixGroups.has(suffix)) suffixGroups.set(suffix, []);
    suffixGroups.get(suffix)!.push({ prefix, idx });
  });

  suffixGroups.forEach((items, suffix) => {
    const minIndex = Math.min(...items.map(i => i.idx));
    if (items.length === 1) {
      results.push({ text: `${items[0].prefix} ${suffix}`, minIndex });
    } else {
      const prefixes = items.map(i => i.prefix);
      const lastPrefix = prefixes[prefixes.length - 1];
      const otherPrefixes = prefixes.slice(0, -1).join(', ');
      results.push({ text: `${otherPrefixes} & ${lastPrefix} ${suffix}`, minIndex });
    }
  });

  results.sort((a, b) => a.minIndex - b.minIndex);
  const formattedResults = results.map(r => r.text);

  if (formattedResults.length <= 1) {
    return formattedResults[0] || '-';
  }
  const last = formattedResults[formattedResults.length - 1];
  if (last.includes('&') || formattedResults.some(r => r.includes('&'))) {
    return formattedResults.join(', ');
  }
  const firstPart = formattedResults.slice(0, -1).join(', ');
  return `${firstPart} & ${last}`;
};

export const generateWA_Storing = (storingData: any) => {
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

  let locString = '-';
  const rawLocs = storingData.acLokasi || [];
  if (rawLocs.length > 0) {
    const nomors = storingData.acNomor || {};
    const mappedLocs = rawLocs.map((loc: string) => {
      const num = nomors[loc];
      if (!num) return loc;
      if (loc.trim().toUpperCase() === 'HBSCP' || loc.trim().toUpperCase().includes('BEA CUKAI') || loc.trim().toUpperCase().includes('BELT')) return `${loc} ${num}`;
      return `${loc}${num}`;
    });
    locString = formatACLokasiList(mappedLocs);
  } else if (storingData.lokasi) {
    if (storingData.nomor) {
      if (storingData.lokasi === 'Avio & BL D' || storingData.lokasi === 'Avio & BL E' || storingData.lokasi === 'Avio & BL F' || storingData.lokasi.includes('Rampout')) {
        locString = `${storingData.lokasi}${storingData.nomor}`;
      } else {
        locString = `${storingData.lokasi} ${storingData.nomor}`;
      }
    } else {
      locString = storingData.lokasi;
    }
  }
  
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

export const generateWA_Checklist = (checklistData: any, checklistDataMaster: any[], toggles: any) => {
  const formattedDate = formatTanggalIndo(checklistData.tanggal);
  const jamMulai = checklistData.waktuMulai || '...';
  const jamSelesai = checklistData.waktuSelesai || '...';
  
  let result = `KEGIATAN STORING PERALATAN SSES T2\n`;
  result += `Hari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}\n\n`;

  checklistDataMaster.forEach((block) => {
    if (block.type === 'location') {
      result += `${block.title}\n`;
      const summaryCounts: any = {};

      block.categories.forEach((cat: any) => {
        result += `${cat.title}\n`;
        if (!summaryCounts[cat.summaryKey]) summaryCounts[cat.summaryKey] = { total: 0, operasi: 0, off: 0 };

        cat.items.forEach((item: string, iIdx: number) => {
          const key = `${block.title}|${cat.title}|${iIdx}`;
          const isOperasi = toggles[key] !== false; // Default is true (Operasi)
          result += `* ${item} ${isOperasi ? '✅' : '❌'}\n`;
          
          summaryCounts[cat.summaryKey].total++;
          if (isOperasi) summaryCounts[cat.summaryKey].operasi++;
          else summaryCounts[cat.summaryKey].off++;
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
      
      if (block.title === 'HBSCP' || (block.title.includes('HBSCP') && !block.title.includes('UMROH'))) {
        const sup1 = checklistData.supervisorAvsec?.['HBSCP 1.1 - 1.6'] || '-';
        const sup2 = checklistData.supervisorAvsec?.['HBSCP 2.1 - 2.6'] || '-';
        result += `Supervisor Avsec HBSCP 1.1 - 1.6 : ${sup1}\n`;
        result += `Supervisor Avsec HBSCP 2.1 - 2.6 : ${sup2}\n\n`;
      } else if (block.title === 'ACCESS CONTROL' || block.title.includes('ACCESS CONTROL')) {
        const sup = checklistData.supervisorAvsec?.[block.title] || checklistData.supervisorAvsec?.['Monitoring Access E1'] || '-';
        result += `Supervisor Avsec Monitoring Access E1 : ${sup}\n\n`;
      } else {
        const supAvsec = checklistData.supervisorAvsec?.[block.title] || '-';
        result += `Supervisor Avsec ${block.title} : ${supAvsec}\n\n`;
      }

    } else if (block.type === 'group') {
      const summaryCounts: any = {};
      
      block.locations.forEach((loc: any) => {
        result += `${loc.title}\n`;
        loc.categories.forEach((cat: any) => {
          result += `${cat.title}\n`;
          if (!summaryCounts[cat.summaryKey]) summaryCounts[cat.summaryKey] = { total: 0, operasi: 0, off: 0 };

          cat.items.forEach((item: string, iIdx: number) => {
            const key = `${loc.title}|${cat.title}|${iIdx}`;
            const isOperasi = toggles[key] !== false;
            result += `* ${item} ${isOperasi ? '✅' : '❌'}\n`;
            
            summaryCounts[cat.summaryKey].total++;
            if (isOperasi) summaryCounts[cat.summaryKey].operasi++;
            else summaryCounts[cat.summaryKey].off++;
          });
          result += `\n`;
        });
        
        if (loc.title === 'HBSCP' || (loc.title.includes('HBSCP') && !loc.title.includes('UMROH'))) {
          const sup1 = checklistData.supervisorAvsec?.['HBSCP 1.1 - 1.6'] || '-';
          const sup2 = checklistData.supervisorAvsec?.['HBSCP 2.1 - 2.6'] || '-';
          result += `Supervisor Avsec HBSCP 1.1 - 1.6 : ${sup1}\n`;
          result += `Supervisor Avsec HBSCP 2.1 - 2.6 : ${sup2}\n\n`;
        } else if (loc.title === 'ACCESS CONTROL' || loc.title.includes('ACCESS CONTROL')) {
          const sup = checklistData.supervisorAvsec?.[loc.title] || checklistData.supervisorAvsec?.['Monitoring Access E1'] || '-';
          result += `Supervisor Avsec Monitoring Access E1 : ${sup}\n\n`;
        } else {
          const supAvsecLoc = checklistData.supervisorAvsec?.[loc.title] || '-';
          result += `Supervisor Avsec ${loc.title} : ${supAvsecLoc}\n\n`;
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
      result += `${block.title}\n`;
      let totalAc = 0, operasiAc = 0, offAc = 0;

      block.terminals.forEach((term: any) => {
        if (term.title) result += `${term.title}\n`;
        term.categories.forEach((cat: any) => {
          result += `${cat.title}\n`;
          cat.items.forEach((item: string, iIdx: number) => {
            const key = `${block.title}|${term.title}|${cat.title}|${iIdx}`;
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
      const supAvsec = checklistData.supervisorAvsec?.[block.title] || checklistData.supervisorAvsec?.['Monitoring Access E1'] || '-';
      result += `Supervisor Avsec Monitoring Access E1 : ${supAvsec}\n\n`;
    }
  });

  result += `TERIMA KASIH\nMELANGKAH BERSAMA UNTUK CGK HEBAT\nBERSAMA MELAYANI SEPENUH HATI`;
  return result.trim();
};

export const formatKalibrasiEntryKegiatanDanCatatan = (entry: any) => {
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

  const peralatanList = Array.isArray(entry.peralatan) 
    ? entry.peralatan 
    : (typeof entry.peralatan === 'string' ? entry.peralatan.split(/[,&]/).map((s: string) => s.trim()).filter(Boolean) : []);

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
  const hasHhmd = sortedEquips.some(eq => eq.toLowerCase().includes('hhmd'));
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
    const fmtUnit = (val: string, unit: string) => {
      if (!val) return '...';
      const trimmed = String(val).trim();
      return /[a-zA-Z]$/.test(trimmed) ? trimmed : `${trimmed} ${unit}`;
    };
    const kvStr = `${fmtUnit(entry.xrayKvV || '140', 'kV')} / ${fmtUnit(entry.xrayKvH || '140', 'kV')}`;
    const maStr = `${fmtUnit(entry.xrayMaV || '0.7', 'mA')} / ${fmtUnit(entry.xrayMaH || '0.7', 'mA')}`;
    const onStr = `${fmtUnit(entry.xrayOnV || 'Normal', 'h')} / ${fmtUnit(entry.xrayOnH || 'Normal', 'h')}`;
    catatanBlocks.push(`${xrayName}\n- kV Vertikal/Horizontal : ${kvStr}\n- mA Vertikal/Horizontal : ${maStr}\n- Ontime Vertikal/Horizontal : ${onStr}\n- Archive : ${entry.xrayArchive || '+- 1 bulan'}`);
  }
  
  if (hasWtmd) {
    const rawWtmd = sortedEquips.find(eq => eq.toLowerCase().includes('wtmd')) || 'WTMD';
    const wtmdName = rawWtmd.toUpperCase() === 'WTMD'
      ? getEquipDisplayName('WTMD')
      : rawWtmd;
    catatanBlocks.push(`${wtmdName}\n- Z1 : ${entry.wtmdZ1 || 'Normal'} - Z2 : ${entry.wtmdZ2 || 'Normal'} - Z3 : ${entry.wtmdZ3 || 'Normal'} - Z4 : ${entry.wtmdZ4 || 'Normal'}\n- LC : ${entry.wtmdLc || 'Normal'} - LS : ${entry.wtmdLs || 'Normal'} - UC : ${entry.wtmdUc || 'Normal'} - SE : ${entry.wtmdSe || 'Normal'} - DS : ${entry.wtmdDs || 'Normal'}`);
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
  const locString = (entry.lokasi1 || '') + (entry.lokasi2 && entry.lokasi2 !== '-' ? ` ${entry.lokasi2}` : '');
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
  const fakeEntry: any = {
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
    xrayKvV: '140',
    xrayKvH: '140',
    xrayMaV: '0.7',
    xrayMaH: '0.7',
    xrayOnV: 'Normal',
    xrayOnH: 'Normal',
    xrayArchive: '+- 1 bulan',
    wtmdZ1: 'Normal',
    wtmdZ2: 'Normal',
    wtmdZ3: 'Normal',
    wtmdZ4: 'Normal',
    wtmdLc: 'Normal',
    wtmdLs: 'Normal',
    wtmdUc: 'Normal',
    wtmdSe: 'Normal',
    wtmdDs: 'Normal'
  };
  return formatKalibrasiEntryKegiatanDanCatatan(fakeEntry).fullText;
};

export const generateWA_Kalibrasi = (kalibrasiGlobal: any, kalibrasiEntries: any[]) => {
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
    ? '*PREVENTIVE MAINTENANCE & KALIBRASI SSES T2*' 
    : '*PREVENTIVE MAINTENANCE SSES T2*';

  let msg = `${judul}\nHari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}`;

  kalibrasiEntries.forEach((entry) => {
    if (entry.peralatan.length === 0) return; 
    const { equipString, lokasiStr, fullText } = formatKalibrasiEntryKegiatanDanCatatan(entry);
    msg += `\n\nPeralatan : ${equipString}\nLokasi : ${lokasiStr}\n\n${fullText}`;
  });

  return msg;
};

export const generateWA_Kegiatan = (kegiatanData: any) => {
  const formattedDate = formatTanggalIndo(kegiatanData.tanggal);
  const waktuText = kegiatanData.waktuSelesai 
    ? `${kegiatanData.waktuMulai} - ${kegiatanData.waktuSelesai}`
    : kegiatanData.waktuMulai;
    
  return `*KEGIATAN SSES T2*\nHari/Tanggal/Jam : ${formattedDate}, ${waktuText}\nLokasi : ${kegiatanData.lokasi}\nKegiatan : ${kegiatanData.kegiatan}`;
};

export const generateWA_InitialReport = (formData: any) => {
  if (!formData.peralatan) return "Silakan pilih peralatan terlebih dahulu untuk melihat preview laporan...";

  const dateParts = formData.tanggal ? formData.tanggal.split('-') : ['','',''];
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '';

  const locList = formData.lokasiList && Array.isArray(formData.lokasiList) && formData.lokasiList.length > 0
    ? formData.lokasiList.filter((l: any) => l.lokasi1)
    : [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
    
  const lokasiFinal = locList.map((loc: any) => {
    if (loc.isManual || (loc.lokasi2 === '-' && !loc.lokasi2)) return loc.lokasi1;
    return loc.lokasi1 + (loc.lokasi2 && loc.lokasi2 !== '-' ? ((formData.peralatan === 'Access Control' || loc.lokasi1 === 'HBSCP') ? ` ${loc.lokasi2}` : ` No.${loc.lokasi2}`) : '');
  }).join(', ') || '-';

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

export const generateWA_BASerahTerima = (baData: any) => {
  const formattedDate = formatTanggalIndo(baData.tanggal);
  const waktuText = baData.waktu ? `${baData.waktu} WIB` : '...';
  const jenisText = baData.jenisTransaksi === 'masuk' ? 'PENERIMAAN BARANG' : 'PENYERAHAN BARANG';

  const barangListText = Array.isArray(baData.items) && baData.items.length > 0
    ? baData.items.map((it: any, idx: number) => {
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
  apiPersonil: any[],
  iasPersonil: any[],
  reports: any[]
): string => buildShiftReportMessage(date, shift, apiPersonil, iasPersonil, reports, getDefaultKalibrasiUraian);

