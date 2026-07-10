// src/lib/utils/waGenerator.ts

import { formatTanggalIndo } from './locationRules';
import { sortPersonelByJabatan } from '../data/masterData';

export const generateWA_Perbaikan = (formData: any, isVerifikasiETD: boolean) => {
  if (!formData.peralatan) return "Silakan pilih peralatan terlebih dahulu untuk melihat preview laporan...";
  const dateParts = formData.tanggal ? formData.tanggal.split('-') : ['','',''];
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '';
  const locList = formData.lokasiList && Array.isArray(formData.lokasiList) && formData.lokasiList.length > 0
    ? formData.lokasiList.filter((l: any) => l.lokasi1)
    : [{ lokasi1: formData.lokasi1, lokasi2: formData.lokasi2 }];
    
  const lokasiFinal = locList.map((loc: any) => {
    return loc.lokasi1 + (loc.lokasi2 && loc.lokasi2 !== '-' ? ((formData.peralatan === 'Access Control' || loc.lokasi1 === 'HBSCP') ? ` ${loc.lokasi2}` : ` No.${loc.lokasi2}`) : '');
  }).join(', ');
  const judulLaporan = isVerifikasiETD ? `Laporan Verifikasi ${formData.peralatan}` : `Laporan Perbaikan ${formData.peralatan}`;

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

✅ Status : ${formData.status}

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

export const generateWA_Briefing = (briefingData: any) => {
  const formattedDate = formatTanggalIndo(briefingData.tanggal);
  const judul = briefingData.jenis === 'Unit' ? '*Giat briefing unit SSES T2*' : '*Briefing MOT T2*';
  return `${judul}\nHari/Tanggal : ${formattedDate}\nShift : ${briefingData.shift}\nLokasi : ${briefingData.lokasi}`;
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
  
  const isACChecked = (storingData.peralatan || []).includes('Access Control');
  const isMirroringChecked = (storingData.peralatan || []).some((e: string) => e.toLowerCase() === 'mirroring x-ray');
  const hasRuangMonitoringE1 = (storingData.acLokasi || []).some(
    (loc: string) => loc.trim().toLowerCase() === 'ruang monitoring e1'
  );
  const showSupervisorAvsec = isMirroringChecked
    ? false
    : isACChecked
    ? hasRuangMonitoringE1
    : true;

  const supervisorAvsecLine = showSupervisorAvsec
    ? `\nSupervisor Avsec : ${storingData.supervisorAvsec || '-'}`
    : '';
  
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
      let summaryCounts: any = {};

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
      let summaryCounts: any = {};
      
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

export const generateWA_Kalibrasi = (kalibrasiGlobal: any, kalibrasiEntries: any[]) => {
  if (kalibrasiEntries.length === 0 || kalibrasiEntries.every(e => e.peralatan.length === 0)) {
    return "Silakan tambah peralatan pada lokasi untuk melihat preview laporan...";
  }

  const formattedDate = formatTanggalIndo(kalibrasiGlobal.tanggal);
  const jamMulai = kalibrasiGlobal.waktuMulai || '...';
  const jamSelesai = kalibrasiGlobal.waktuSelesai || '...';

  let msg = `*PREVENTIVE MAINTENANCE & KALIBRASI SSES T2*\nHari/Tanggal/Jam : ${formattedDate}, ${jamMulai} - ${jamSelesai}`;

  kalibrasiEntries.forEach((entry) => {
    if (entry.peralatan.length === 0) return; 

    if (entry.peralatan.includes('Access Control')) {
      const locs = entry.acLokasi || [];
      let lokasiAC = '...';
      if (locs.length === 1) {
        lokasiAC = locs[0];
      } else if (locs.length > 1) {
        const lastLoc = locs[locs.length - 1];
        const otherLocs = locs.slice(0, -1).join(', ');
        lokasiAC = `${otherLocs} & ${lastLoc}`;
      }

      msg += `\n\nPeralatan : Access Control\nLokasi : ${lokasiAC}\n\nKegiatan :\n- Pembersihan Emlock, Switch, Intercom, Fingerprint & CCTV\n- Pengecekan Fungsi Emlock, Intercom, Fingerprint, CCTV, Pengontrolan Kunci Pintu, Record CCTV\n   \nCatatan :\n- Fungsi Emlock : ${entry.acEmlock || '...'}\n- Fungsi Intercom : ${entry.acIntercom || '...'}\n- Fungsi Fingerprint: ${entry.acFingerprint || '...'}\n- Fungsi CCTV : ${entry.acCctv || '...'}\n- Fungsi Pengontrolan Kunci Pintu : ${entry.acPengontrolan || '...'}\n- Record CCTV : ${entry.acRecordCctv || '...'}`;
      return;
    }

    const equipListFormatted = entry.peralatan.map((eq: string) => {
      if (eq === 'X-Ray') return entry.xrayModel === 'Semua X-Ray' ? 'X-Ray' : entry.xrayModel;
      if (eq === 'WTMD') return entry.wtmdModel === 'Semua WTMD' ? 'WTMD' : entry.wtmdModel;
      if (eq === 'HHMD') return entry.hhmdModel === 'Semua HHMD' ? 'HHMD' : entry.hhmdModel;
      if (eq === 'Body Scanner') return entry.bsModel === 'Semua Body Scanner' ? 'Body Scanner' : entry.bsModel;
      if (eq === 'ETD') return entry.etdModel === 'Semua ETD' ? 'ETD' : entry.etdModel;
      return eq;
    });

    const locString = entry.lokasi1 + (entry.lokasi2 && entry.lokasi2 !== '-' ? ` ${entry.lokasi2}` : '');
    const lokasiStr = locString || '...';
    
    const equipString = equipListFormatted.length === 1 
      ? equipListFormatted[0] 
      : equipListFormatted.length > 1 
        ? `${equipListFormatted.slice(0, -1).join(', ')} & ${equipListFormatted[equipListFormatted.length - 1]}`
        : '-';

    msg += `\n\nPeralatan : ${equipString}\nLokasi : ${lokasiStr}\n\nKegiatan :\n- Pembersihan ${equipString}\n- Kalibrasi ${equipString}\n   \nCatatan :`;

    if (entry.peralatan.includes('X-Ray')) {
      const xrayName = entry.xrayModel === 'Semua X-Ray' ? 'X-Ray' : entry.xrayModel;
      const fmtUnit = (val: string, unit: string) => {
        if (!val) return '...';
        const trimmed = String(val).trim();
        return /[a-zA-Z]$/.test(trimmed) ? trimmed : `${trimmed} ${unit}`;
      };
      const kvStr = `${fmtUnit(entry.xrayKvV, 'kV')} / ${fmtUnit(entry.xrayKvH, 'kV')}`;
      const maStr = `${fmtUnit(entry.xrayMaV, 'mA')} / ${fmtUnit(entry.xrayMaH, 'mA')}`;
      const onStr = `${fmtUnit(entry.xrayOnV, 'h')} / ${fmtUnit(entry.xrayOnH, 'h')}`;
      msg += `\n${xrayName}\n- kV Vertikal/Horizontal : ${kvStr}\n- mA Vertikal/Horizontal : ${maStr}\n- Ontime Vertikal/Horizontal : ${onStr}\n- Archive : ${entry.xrayArchive || '+- 1 bulan'}\n`;
    }
    
    if (entry.peralatan.includes('WTMD')) {
      const wtmdName = entry.wtmdModel === 'Semua WTMD' ? 'WTMD' : entry.wtmdModel;
      msg += `\n${wtmdName}\n- Z1 : ${entry.wtmdZ1 || '...'} - Z2 : ${entry.wtmdZ2 || '...'} - Z3 : ${entry.wtmdZ3 || '...'} - Z4 : ${entry.wtmdZ4 || '...'}\n- LC : ${entry.wtmdLc || '...'} - LS : ${entry.wtmdLs || '...'} - UC : ${entry.wtmdUc || '...'} - SE : ${entry.wtmdSe || '...'} - DS : ${entry.wtmdDs || '...'}\n`;
    }

    if (entry.peralatan.includes('Body Scanner')) {
      const bsName = entry.bsModel === 'Semua Body Scanner' ? 'Body Scanner' : entry.bsModel;
      msg += `\n${bsName}\n- Test Tampilan Suspect Item : ${entry.bsSuspect || 'Normal'}\n- Test Monitor : ${entry.bsMonitor || 'Normal'}\n- Test Fungsi Scanning : ${entry.bsScanning || 'Normal'}\n- Test Fungsi Kalibrasi : ${entry.bsCalibration || 'Normal'}\n`;
    }

    if (entry.peralatan.includes('ETD')) {
      const etdName = entry.etdModel === 'Semua ETD' ? 'ETD' : entry.etdModel;
      msg += `\n${etdName}\n- Sampling Test TNT : ${entry.etdTnt || 'Alarm'}\n- Sampling Test PETN : ${entry.etdPetn || 'Alarm'}\n- Sampling Test RDX : ${entry.etdRdx || 'Alarm'}\n`;
    }
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
    return loc.lokasi1 + (loc.lokasi2 && loc.lokasi2 !== '-' ? ((formData.peralatan === 'Access Control' || loc.lokasi1 === 'HBSCP') ? ` ${loc.lokasi2}` : ` No.${loc.lokasi2}`) : '');
  }).join(', ') || '-';

  const pukulStr = formData.waktuMulai ? `${formData.waktuMulai} WIB` : '- WIB';
  const lamaStr = formData.lamaPengerjaan || '-';
  const teknisiStr = formData.teknisi || '-';
  const permasalahanStr = formData.permasalahan || '';
  const statusStr = formData.status || '-';
  const uraianStr = (formData.uraian && formData.uraian !== '• ') ? formData.uraian : '(Uraian kronologis kerusakan s.d saat dilaporkan)';
  const dampakStr = formData.dampak || '1. ';
  const mitigasiStr = formData.tindakanMitigasi || '1. ';
  const tindakanStr = formData.tindakan || '1. ';
  const hasilStr = formData.hasilTindakan || '1. ';

  return `*INITIAL REPORT*

Nama Peralatan : ${formData.peralatan}
Lokasi : ${lokasiFinal}

🗓️ Tanggal : ${formattedDate}
🕝 Pukul : ${pukulStr}
⏰ Lama waktu Pengerjaan : ${lamaStr}
👨🏻‍🔧 Teknisi : ${teknisiStr}

🪛 Permasalahan : 
${permasalahanStr}

Status : ${statusStr}

*URAIAN*
${uraianStr}

*DAMPAK*
${dampakStr}

*TINDAKAN MITIGASI*
${mitigasiStr}

*TINDAKAN*
${tindakanStr}

*HASIL TINDAKAN*
${hasilStr}

Demikian laporan kronologis dan tindak lanjut kami sampaikan
Terimakasih atas perhatiannya.`;
};

