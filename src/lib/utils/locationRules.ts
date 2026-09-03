// src/lib/utils/locationRules.ts
import { useMasterDataStore } from '../../store/useMasterDataStore';

export const getValidModels = (lokasi: string, jenisPeralatan: string, titik?: string) => {
  const defaultOption = `Semua ${jenisPeralatan}`;
  const models = [defaultOption];
  if (!lokasi) return models;

  try {
    const penempatanData = useMasterDataStore.getState().penempatanData || [];
    const extractedModels: Set<string> = new Set();

    penempatanData.forEach((p: any) => {
      if (
        p.lokasi?.nama?.toUpperCase() === lokasi.toUpperCase() &&
        p.tipe_peralatan?.jenis_peralatan?.nama?.toUpperCase() === jenisPeralatan.toUpperCase()
      ) {
        if (titik && titik !== '' && titik !== '-') {
          const pTitik = String(p.titik_lokasi?.nomor || '').trim().toUpperCase();
          const targetTitik = String(titik).trim().toUpperCase();
          if (pTitik !== targetTitik) return;
        }
        if (p.tipe_peralatan?.nama) {
          extractedModels.add(p.tipe_peralatan.nama);
        }
      }
    });

    if (extractedModels.size > 0) {
      return [defaultOption, ...Array.from(extractedModels)];
    }
  } catch (error) {
    console.warn(`Error reading dynamic ${jenisPeralatan} models from relational data`, error);
  }

  return models;
};

export const getValidXRayModels = (lokasi: string, titik?: string) => {
  return getValidModels(lokasi, 'X-Ray', titik);
};

export const getGeneralLokasiOptions = (peralatanType: string) => {
  if (!peralatanType) return [];
  const extractedLocs: Set<string> = new Set();

  try {
    const penempatanData = useMasterDataStore.getState().penempatanData || [];

    penempatanData.forEach((p: any) => {
      const jenisNama = p.tipe_peralatan?.jenis_peralatan?.nama?.toUpperCase() || '';
      const tipeNama = p.tipe_peralatan?.nama?.toUpperCase() || '';
      const target = peralatanType.toUpperCase();
      
      if (target === 'SEMUA X-RAY' || target === 'X-RAY') {
        if (jenisNama === 'X-RAY') {
          if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
        }
      } else if (tipeNama === target) {
        // Matched specific equipment model
        if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
      } else if (jenisNama === target) {
        // Matched equipment category
        if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
      }
    });

    if (extractedLocs.size === 0) {
      penempatanData.forEach((p: any) => {
        if (p.lokasi?.nama) extractedLocs.add(p.lokasi.nama);
      });
    }

  } catch (error) {
    console.warn('Error reading dynamic locations from relational data', error);
  }

  return Array.from(extractedLocs).sort();
};

export const getIntersectedLocations = (peralatanArray: string[], models: Record<string, string> = {}) => {
  if (!peralatanArray || peralatanArray.length === 0) return [];
  
  let validLocs: string[] | null = null;
  
  for (const equip of peralatanArray) {
    let currentEquipOpts: string[] = [];
    const selectedModel = models[equip];
    
    if (selectedModel && !selectedModel.startsWith('Semua ')) {
      currentEquipOpts = getGeneralLokasiOptions(selectedModel);
    } else {
      currentEquipOpts = getGeneralLokasiOptions(equip);
    }

    if (validLocs === null) {
      validLocs = [...currentEquipOpts];
    } else {
      validLocs = validLocs.filter(loc => currentEquipOpts.includes(loc));
    }
    
    if (validLocs.length === 0) break; 
  }
  
  return validLocs || [];
};

export const getLokasi2Options = (lokasi: string, peralatanArray: string[] = []) => {
  if (!lokasi) return [];
  const extractedNumbers: Set<string> = new Set();
  
  try {
    const penempatanData = useMasterDataStore.getState().penempatanData || [];

    if (peralatanArray.length > 1) {
      const equipMap: Record<string, Set<string>> = {};
      peralatanArray.forEach(eq => { equipMap[eq] = new Set(); });

      penempatanData.forEach((p: any) => {
        if (p.lokasi?.nama?.toUpperCase() === lokasi.toUpperCase()) {
          const jenisNama = p.tipe_peralatan?.jenis_peralatan?.nama;
          const tipeNama = p.tipe_peralatan?.nama;
          peralatanArray.forEach(eq => {
            if (jenisNama === eq || tipeNama === eq) {
              if (p.titik_lokasi?.nomor) equipMap[eq].add(p.titik_lokasi.nomor);
            }
          });
        }
      });

      const sets = Object.values(equipMap).filter(s => s.size > 0);
      if (sets.length > 1) {
        let common = Array.from(sets[0]);
        for (let i = 1; i < sets.length; i++) {
          common = common.filter(num => sets[i].has(num));
        }
        if (common.length > 0) {
          return common.sort((a, b) => {
            const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
            const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
          });
        }
      }
    }

    penempatanData.forEach((p: any) => {
      if (p.lokasi?.nama?.toUpperCase() === lokasi.toUpperCase()) {
        // Jika ada filter peralatanArray, pastikan titik lokasi ini memang untuk salah satu peralatan tersebut
        if (peralatanArray.length > 0) {
          const jenisNama = p.tipe_peralatan?.jenis_peralatan?.nama;
          const tipeNama = p.tipe_peralatan?.nama;
          if ((jenisNama && peralatanArray.includes(jenisNama)) || (tipeNama && peralatanArray.includes(tipeNama))) {
            if (p.titik_lokasi?.nomor) extractedNumbers.add(p.titik_lokasi.nomor);
          }
        } else {
          // Tanpa filter peralatan, ambil semua titik lokasi di area tersebut
          if (p.titik_lokasi?.nomor) extractedNumbers.add(p.titik_lokasi.nomor);
        }
      }
    });

    if (extractedNumbers.size === 0 && peralatanArray.length > 0) {
      penempatanData.forEach((p: any) => {
        if (p.lokasi?.nama?.toUpperCase() === lokasi.toUpperCase()) {
          if (p.titik_lokasi?.nomor) extractedNumbers.add(p.titik_lokasi.nomor);
        }
      });
    }

  } catch (error) {
    console.warn('Error reading dynamic numbers from relational data', error);
  }
  
  // Custom sort to handle numbers correctly (1, 2, 10, etc.)
  return Array.from(extractedNumbers).sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
    const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
};

export const getStoringValidLocations = (equipArray: string[], _storingLocAc?: string[], _storingLocDefault?: string[]) => {
  if (equipArray.length === 0) return [];
  if (equipArray.includes('Access Control')) return getGeneralLokasiOptions('Access Control');
  if (equipArray.some(e => e.trim().toLowerCase() === 'mirroring x-ray')) return getGeneralLokasiOptions('Mirroring X-Ray');
  
  // Peralatan yang membatalkan munculnya Transfer Desk D/E
  const NON_TRANSFER_EQUIP = ['BODY SCANNER', 'EXTENSION CONVEYOR', 'ATRS', 'MIRRORING X-RAY'];
  
  const intersected = getIntersectedLocations(equipArray);

  const hasHhmdOrWtmd = equipArray.some(e => ['HHMD', 'WTMD'].includes(e.trim().toUpperCase()));
  const hasNonTransferEquip = equipArray.some(e => NON_TRANSFER_EQUIP.includes(e.trim().toUpperCase()));

  // Transfer Desk hanya ditambahkan jika HHMD/WTMD dipilih DAN TIDAK ada peralatan non-transfer
  if (hasHhmdOrWtmd && !hasNonTransferEquip) {
    const transferLocs = new Set<string>();
    equipArray.forEach(e => {
      if (['HHMD', 'WTMD'].includes(e.trim().toUpperCase())) {
        getGeneralLokasiOptions(e).forEach(loc => {
          if (loc.trim().toUpperCase().includes('TRANSFER')) {
            transferLocs.add(loc);
          }
        });
      }
    });
    const combined = new Set([...intersected, ...transferLocs]);
    return Array.from(combined).sort();
  }

  return intersected;
};

export const getStoringValidNumbers = (lokasi: string) => {
  if (lokasi === 'HBSCP') return ['1.1-1.6', '2.1-2.6', '2.7-2.8'];
  if (!lokasi.includes('Avio') && !lokasi.includes('Rampout')) return [];
  if (lokasi === 'Rampout D' || lokasi === 'Rampout E') return ['2,4,6', '2', '4', '6'];
  if (lokasi === 'Rampout F') return ['1-7', '1', '2', '3', '4', '5', '6', '7'];
  if (lokasi === 'Avio & BL D' || lokasi === 'Avio & BL E' || lokasi === 'Avio & BL F') return ['1-7', '1', '2', '3', '4', '5', '6', '7'];
  return ['1', '2', '3', '4', '5', '6', '7'];
};

export const getStoringNomorOptions = (loc: string): string[] => {
  if (!loc) return [];
  const upper = loc.trim().toUpperCase();
  if (upper === 'HBSCP') return ['1.1-1.6', '2.1-2.6', '2.7-2.8'];
  
  if (upper.includes('MONITORING') || upper.includes('REDLINE') || upper.includes('UMRAH')) {
    return [];
  }

  if (upper.includes('BELT') || (upper.includes('BEA CUKAI') && upper.includes('X-RAY')) || (upper.includes('BEACUKAI') && upper.includes('X-RAY'))) {
    return ['11-14', '15-16'];
  }

  if (upper === 'ARRIVAL F') return ['1,6,7', '1', '6', '7'];
  if (['RAMPOUT D', 'RAMPOUT E'].includes(upper)) {
    return ['2,4,6', '2', '4', '6'];
  }
  if (upper.startsWith('AVIOBRIDGE') || upper.startsWith('BL') || upper === 'RAMPOUT F') {
    return ['1-7', '1', '2', '3', '4', '5', '6', '7'];
  }
  return [];
};
export const getAcNomorOptions = getStoringNomorOptions;

export const formatTanggalIndo = (dateStr: string) => {
  if (!dateStr) return '';
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const d = new Date(dateStr);
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const getStoringSupervisorLocations = (
  peralatan: string[],
  acLokasi: string[],
  acNomor: Record<string, string> = {}
): string[] => {
  if (!peralatan || !acLokasi || acLokasi.length === 0) return [];
  const isACChecked = peralatan.includes('Access Control');
  const isMirroringChecked = peralatan.some(e => e.toLowerCase() === 'mirroring x-ray');
  if (isMirroringChecked) return [];

  if (isACChecked) {
    const hasMonE1 = acLokasi.some(l => l.trim().toLowerCase() === 'ruang monitoring e1');
    return hasMonE1 ? ['Monitoring Access E1'] : [];
  }

  const keys: Set<string> = new Set();
  acLokasi.forEach(l => {
    const norm = l.trim().toUpperCase();
    if (norm === 'HBSCP' || (norm.includes('HBSCP') && !norm.includes('UMRAH') && !norm.includes('UMROH'))) {
      const selectedNomor = (acNomor || {})[l] || (getAcNomorOptions(l)[0] || '');
      const numTrim = selectedNomor.trim();
      if (numTrim === '2.7-2.8' || numTrim === '2.7 - 2.8') {
        // No supervisor for 2.7-2.8
      } else if (numTrim.includes('1.1') || numTrim.includes('1.6')) {
        keys.add('HBSCP 1.1 - 1.6');
      } else if (numTrim.includes('2.1') || numTrim.includes('2.6')) {
        keys.add('HBSCP 2.1 - 2.6');
      } else {
        keys.add('HBSCP 1.1 - 1.6');
        keys.add('HBSCP 2.1 - 2.6');
      }
    } else {
      const exactList = ['PSCP D', 'PSCP E', 'PSCP F', 'PSCP UMRAH', 'PSCP UMROH', 'SSCP E', 'SSCP F'];
      if (exactList.includes(norm) || (norm.includes('PSCP') && (norm.includes(' D') || norm.includes(' E') || norm.includes(' F') || norm.includes('UMRAH') || norm.includes('UMROH'))) || (norm.includes('SSCP') && (norm.includes(' E') || norm.includes(' F')))) {
        keys.add(l.trim());
      }
    }
  });

  return Array.from(keys);
};

export const checkNeedsStoringSupervisorAvsec = (peralatan: string[], acLokasi: string[], acNomor?: Record<string, string>) => {
  return getStoringSupervisorLocations(peralatan, acLokasi, acNomor || {}).length > 0;
};

export const getCurrentShiftKey = (now = new Date()): string => {
  const currentHour = now.getHours();
  const logicalDateObj = new Date(now.getTime());
  if (currentHour < 8) {
    logicalDateObj.setDate(logicalDateObj.getDate() - 1);
  }
  const tzOffset = logicalDateObj.getTimezoneOffset() * 60000;
  const dateStr = new Date(logicalDateObj.getTime() - tzOffset).toISOString().split('T')[0];
  const shiftName = (currentHour >= 8 && currentHour < 20) ? 'PAGI' : 'MALAM';
  return `${dateStr}_${shiftName}`;
};

export const mapStoringToChecklistSupervisorKeys = (acLokasi: string[], acNomor: Record<string, string> = {}): string[] => {
  if (!acLokasi || acLokasi.length === 0) return [];
  const keys: Set<string> = new Set();

  acLokasi.forEach(l => {
    const norm = l.trim().toUpperCase();
    if (norm === 'HBSCP' || (norm.includes('HBSCP') && !norm.includes('UMRAH') && !norm.includes('UMROH'))) {
      const selectedNomor = (acNomor || {})[l] || (getAcNomorOptions(l)[0] || '');
      const numTrim = selectedNomor.trim();
      if (numTrim.includes('1.1') || numTrim.includes('1.6')) {
        keys.add('HBSCP 1.1 - 1.6');
      } else if (numTrim.includes('2.1') || numTrim.includes('2.6')) {
        keys.add('HBSCP 2.1 - 2.6');
      } else if (!numTrim.includes('2.7')) {
        keys.add('HBSCP 1.1 - 1.6');
        keys.add('HBSCP 2.1 - 2.6');
      }
    } else if (l.trim().toLowerCase() === 'ruang monitoring e1' || norm.includes('ACCESS CONTROL')) {
      keys.add('Monitoring Access E1');
      keys.add('ACCESS CONTROL');
    } else {
      if (norm.includes('PSCP') && (norm.includes('UMRAH') || norm.includes('UMROH'))) {
        keys.add('PSCP UMROH');
        keys.add('PSCP UMRAH');
        keys.add('PSCP Umroh');
        keys.add('PSCP Umrah');
        keys.add(l.trim());
      } else {
        keys.add(l.trim());
      }
    }
  });

  return Array.from(keys);
};

