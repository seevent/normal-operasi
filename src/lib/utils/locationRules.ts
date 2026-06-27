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

export const getStoringValidLocations = (equipArray: string[], storingLocAc: string[], storingLocDefault: string[]) => {
  if (equipArray.length === 0) return [];
  if (equipArray.includes('Access Control')) return getGeneralLokasiOptions('Access Control');
  
  const intersected = getIntersectedLocations(equipArray);

  const hasHhmdOrWtmd = equipArray.some(e => ['HHMD', 'WTMD'].includes(e.trim().toUpperCase()));
  if (hasHhmdOrWtmd) {
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
