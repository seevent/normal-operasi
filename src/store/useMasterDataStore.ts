import { create } from 'zustand';
import { 
  DEFAULT_DATA_API_T2, DEFAULT_DATA_OM_IAS_T2, DEFAULT_STORING_EQUIPMENTS, 
  DEFAULT_STORING_LOC_AC, DEFAULT_STORING_LOC_DEFAULT, DEFAULT_CHECKLIST_DATA,
  DEFAULT_TIP_LEFT_COL, DEFAULT_TIP_RIGHT_COL, toTitleCase, sortPersonelByJabatan
} from '../lib/data/masterData';
import { supabase } from '../lib/supabaseClient';

const loadMasterData = (key: string, defaultData: any) => {
  return defaultData;
};

const saveMasterDataToLocal = (key: string, data: any) => {
  // Disabled by user request
};

const saveConfigToSupabase = async (key: string, data: any) => {
  try {
    const { error } = await supabase
      .from('master_configs')
      .upsert({ key, value: data, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) console.error(`Error saving ${key} to Supabase:`, error);
  } catch (err) {
    console.error(`Error saving ${key} to Supabase:`, err);
  }
};

interface MasterDataState {
  dataApiT2: any[];
  setDataApiT2: (data: any[]) => void;
  dataOmIasT2: any[];
  setDataOmIasT2: (data: any[]) => void;
  savePersonelToSupabase: (data: any[], unitName: string) => Promise<void>;
  storingEquipments: string[];
  setStoringEquipments: (data: string[]) => void;
  storingLocAc: string[];
  setStoringLocAc: (data: string[]) => void;
  storingLocDefault: string[];
  setStoringLocDefault: (data: string[]) => void;
  checklistDataMaster: any[];
  setChecklistDataMaster: (data: any[]) => void;
  tipLeftCol: any[];
  setTipLeftCol: (data: any[]) => void;
  tipRightCol: any[];
  setTipRightCol: (data: any[]) => void;
  
  masterModalOpen: string | null;
  setMasterModalOpen: (type: string | null) => void;
  masterModalData: any[];
  setMasterModalData: (data: any[]) => void;
  
  openMasterModal: (type: string, currentData: any[]) => void;
  closeMasterModal: () => void;
  saveCurrentMasterModal: () => void;
  resetCurrentMasterModal: () => void;
  handleModalDataChange: (index: number, field: string | undefined, value: any) => void;
  addModalDataRow: () => void;
  removeModalDataRow: (index: number) => void;
  
  penempatanData: any[];
  setPenempatanData: (data: any[]) => void;
  unitPeralatanData: any[];
  setUnitPeralatanData: (data: any[]) => void;
  jenisPeralatanData: any[];
  setJenisPeralatanData: (data: any[]) => void;
  toggleKalibrasiEquipmentDb: (id: string, tampil: boolean) => Promise<void>;
  
  initializeSupabaseData: () => Promise<void>;
}

export const useMasterDataStore = create<MasterDataState>((set, get) => ({
  dataApiT2: loadMasterData('master_api_t2', sortPersonelByJabatan(DEFAULT_DATA_API_T2)),
  setDataApiT2: (data) => {
    const sorted = sortPersonelByJabatan(data);
    saveMasterDataToLocal('master_api_t2', sorted);
    set({ dataApiT2: sorted });
  },
  dataOmIasT2: loadMasterData('master_om_ias_t2', sortPersonelByJabatan(DEFAULT_DATA_OM_IAS_T2)),
  setDataOmIasT2: (data) => {
    const sorted = sortPersonelByJabatan(data);
    saveMasterDataToLocal('master_om_ias_t2', sorted);
    set({ dataOmIasT2: sorted });
  },
  savePersonelToSupabase: async (data, unitName) => {
    try {
      let unitId: number | null = null;
      const { data: uData } = await supabase.from('unit_kerja').select('id').ilike('nama', `%${unitName === 'API T2' ? 'API' : 'OM'}%`).limit(1);
      if (uData && uData.length > 0) unitId = uData[0].id;

      for (let idx = 0; idx < data.length; idx++) {
        const p = data[idx];
        if (!p.name) continue;
        const urutanVal = idx + 1;
        if (p.id) {
          const payload: any = { nama: p.name, no_hp: p.phone, urutan: urutanVal };
          if (p.jabatan !== undefined) payload.jabatan = p.jabatan || null;
          const { error } = await supabase.from('personel').update(payload).eq('id', p.id);
          if (error && (error.message?.includes('urutan') || error.message?.includes('jabatan'))) {
            const fallback: any = { nama: p.name, no_hp: p.phone };
            if (p.jabatan !== undefined && !error.message?.includes('jabatan')) fallback.jabatan = p.jabatan || null;
            await supabase.from('personel').update(fallback).eq('id', p.id);
          }
        } else if (unitId) {
          const payload: any = { nama: p.name, no_hp: p.phone, unit_kerja_id: unitId, urutan: urutanVal };
          if (p.jabatan !== undefined) payload.jabatan = p.jabatan || null;
          const { error } = await supabase.from('personel').insert(payload);
          if (error && (error.message?.includes('urutan') || error.message?.includes('jabatan'))) {
            const fallback: any = { nama: p.name, no_hp: p.phone, unit_kerja_id: unitId };
            if (p.jabatan !== undefined && !error.message?.includes('jabatan')) fallback.jabatan = p.jabatan || null;
            await supabase.from('personel').insert(fallback);
          }
        }
      }
      await get().initializeSupabaseData();
    } catch (err) {
      console.error('Failed savePersonelToSupabase:', err);
    }
  },
  storingEquipments: loadMasterData('master_storing_equip', DEFAULT_STORING_EQUIPMENTS),
  setStoringEquipments: (data) => {
    saveMasterDataToLocal('master_storing_equip', data);
    saveConfigToSupabase('master_storing_equip', data);
    set({ storingEquipments: data });
  },
  storingLocAc: loadMasterData('master_storing_loc_ac', DEFAULT_STORING_LOC_AC),
  setStoringLocAc: (data) => {
    saveMasterDataToLocal('master_storing_loc_ac', data);
    saveConfigToSupabase('master_storing_loc_ac', data);
    set({ storingLocAc: data });
  },
  storingLocDefault: loadMasterData('master_storing_loc_default', DEFAULT_STORING_LOC_DEFAULT),
  setStoringLocDefault: (data) => {
    saveMasterDataToLocal('master_storing_loc_default', data);
    saveConfigToSupabase('master_storing_loc_default', data);
    set({ storingLocDefault: data });
  },
  checklistDataMaster: loadMasterData('master_checklist', DEFAULT_CHECKLIST_DATA),
  setChecklistDataMaster: (data) => {
    saveMasterDataToLocal('master_checklist', data);
    saveConfigToSupabase('master_checklist', data);
    set({ checklistDataMaster: data });
  },
  tipLeftCol: loadMasterData('master_tip_left', DEFAULT_TIP_LEFT_COL),
  setTipLeftCol: (data) => {
    saveMasterDataToLocal('master_tip_left', data);
    saveConfigToSupabase('master_tip_left', data);
    set({ tipLeftCol: data });
  },
  tipRightCol: loadMasterData('master_tip_right', DEFAULT_TIP_RIGHT_COL),
  setTipRightCol: (data) => {
    saveMasterDataToLocal('master_tip_right', data);
    saveConfigToSupabase('master_tip_right', data);
    set({ tipRightCol: data });
  },

  penempatanData: [],
  setPenempatanData: (data) => set({ penempatanData: data }),
  unitPeralatanData: [],
  setUnitPeralatanData: (data) => set({ unitPeralatanData: data }),
  jenisPeralatanData: [],
  setJenisPeralatanData: (data) => set({ jenisPeralatanData: data }),
  toggleKalibrasiEquipmentDb: async (id: string, tampil: boolean) => {
    try {
      const { error } = await supabase.from('jenis_peralatan').update({ tampil_di_kalibrasi: tampil }).eq('id', id);
      if (!error) {
        set((state) => ({
          jenisPeralatanData: state.jenisPeralatanData.map((j) => j.id === id ? { ...j, tampil_di_kalibrasi: tampil } : j)
        }));
      } else {
        console.error('Gagal memperbarui config kalibrasi', error);
      }
    } catch (err) {
      console.error(err);
    }
  },

  masterModalOpen: null,
  setMasterModalOpen: (type) => set({ masterModalOpen: type }),
  masterModalData: [],
  setMasterModalData: (data) => set({ masterModalData: data }),

  openMasterModal: (type, currentData) => {
    set({
      masterModalOpen: type,
      masterModalData: JSON.parse(JSON.stringify(currentData)),
    });
  },

  closeMasterModal: () => {
    set({
      masterModalOpen: null,
      masterModalData: [],
    });
  },

  saveCurrentMasterModal: () => {
    const { masterModalOpen, masterModalData, closeMasterModal } = get();
    switch (masterModalOpen) {
      case 'api_t2': get().setDataApiT2(masterModalData); break;
      case 'om_ias_t2': get().setDataOmIasT2(masterModalData); break;
      case 'storing_equip': get().setStoringEquipments(masterModalData); break;
      case 'storing_loc_ac': get().setStoringLocAc(masterModalData); break;
      case 'storing_loc_default': get().setStoringLocDefault(masterModalData); break;
      case 'tip_left': get().setTipLeftCol(masterModalData); break;
      case 'tip_right': get().setTipRightCol(masterModalData); break;
    }
    closeMasterModal();
  },

  resetCurrentMasterModal: () => {
    if (!window.confirm('Anda yakin ingin mereset data ini ke default bawaan sistem? Data kustom akan hilang.')) return;
    const { masterModalOpen } = get();
    switch (masterModalOpen) {
      case 'api_t2': set({ masterModalData: DEFAULT_DATA_API_T2 }); break;
      case 'om_ias_t2': set({ masterModalData: DEFAULT_DATA_OM_IAS_T2 }); break;
      case 'storing_equip': set({ masterModalData: DEFAULT_STORING_EQUIPMENTS }); break;
      case 'storing_loc_ac': set({ masterModalData: DEFAULT_STORING_LOC_AC }); break;
      case 'storing_loc_default': set({ masterModalData: DEFAULT_STORING_LOC_DEFAULT }); break;
      case 'tip_left': set({ masterModalData: DEFAULT_TIP_LEFT_COL }); break;
      case 'tip_right': set({ masterModalData: DEFAULT_TIP_RIGHT_COL }); break;
    }
  },

  handleModalDataChange: (index, field, value) => {
    const { masterModalData, masterModalOpen } = get();
    const newData = [...masterModalData];
    if (field) {
      // Auto-format name field to Title Case for API T2 and OM IAS T2
      if (field === 'name' && (masterModalOpen === 'api_t2' || masterModalOpen === 'om_ias_t2')) {
        newData[index][field] = toTitleCase(value);
      } else {
        newData[index][field] = value;
      }
    } else {
      newData[index] = value;
    }
    set({ masterModalData: newData });
  },

  addModalDataRow: () => {
    const { masterModalOpen, masterModalData } = get();
    let newItem: any;
    if (masterModalOpen === 'api_t2' || masterModalOpen === 'om_ias_t2') newItem = { name: '', phone: '', jabatan: '' };
    else if (masterModalOpen === 'storing_equip' || masterModalOpen === 'storing_loc_ac' || masterModalOpen === 'storing_loc_default' || masterModalOpen === 'kalibrasi_equip') newItem = '';
    else if (masterModalOpen === 'tip_left' || masterModalOpen === 'tip_right') newItem = { id: `new_${Date.now()}`, name: '', items: [] };
    set({ masterModalData: [...masterModalData, newItem] });
  },

  removeModalDataRow: (index) => {
    const { masterModalData } = get();
    const newData = [...masterModalData];
    newData.splice(index, 1);
    set({ masterModalData: newData });
  },

  initializeSupabaseData: async () => {
    try {
      // 1. Fetch Relasional Data dari Supabase (Penempatan Peralatan)
      const { data, error } = await supabase
        .from('penempatan_peralatan')
        .select(`
          id,
          id_unit,
          tipe_peralatan ( nama, varian, jenis_peralatan ( nama ) ),
          unit_peralatan ( id, serial_number, milik, status, no_sertifikasi, tahun_instalasi, ampere ),
          lokasi ( nama ),
          titik_lokasi ( nomor )
        `);
        
      if (error) {
        console.warn('Gagal memuat data Supabase penempatan.', error.message);
      } else if (data && data.length > 0) {
        console.log('✅ Berhasil terhubung ke Supabase! Menemukan', data.length, 'data penempatan.');
        set({ penempatanData: data });
      }

      // 1.2 Fetch Unit Peralatan
      const { data: unitData, error: unitError } = await supabase
        .from('unit_peralatan')
        .select(`
          *,
          tipe_peralatan ( id, nama, varian, jenis_peralatan ( id, nama ) )
        `)
        .order('created_at', { ascending: false });
      if (!unitError && unitData) {
        set({ unitPeralatanData: unitData });
      }

      // 1.5 Fetch Jenis Peralatan
      const { data: jenisData, error: jenisError } = await supabase
        .from('jenis_peralatan')
        .select('id, nama, tampil_di_kalibrasi')
        .order('nama');
      if (!jenisError && jenisData) {
        set({ jenisPeralatanData: jenisData });
      }

      // 2. Fetch Data Personel & NIK dari Supabase
      let { data: personelData, error: personelError } = await supabase
        .from('personel')
        .select(`id, nik, nama, no_hp, jabatan, urutan, unit_kerja(nama)`)
        .order('urutan', { ascending: true })
        .order('id', { ascending: true });

      if (personelError) {
        console.warn('Kolom urutan/jabatan mungkin belum ada di tabel personel Supabase, mencoba fallback query...', personelError.message);
        const resFallback = await supabase
          .from('personel')
          .select(`id, nik, nama, no_hp, jabatan, unit_kerja(nama)`)
          .order('id', { ascending: true });
        personelData = resFallback.data;
        personelError = resFallback.error;

        if (personelError) {
          const resFallback2 = await supabase
            .from('personel')
            .select(`id, nik, nama, no_hp, unit_kerja(nama)`)
            .order('id', { ascending: true });
          personelData = resFallback2.data;
          personelError = resFallback2.error;
        }
      }

      if (!personelError && personelData) {
        console.log('✅ Berhasil mengambil data personel dari Supabase:', personelData.length);
        
        // Memisahkan berdasarkan unit kerja dan format ke struktur state
        const apiT2Raw = personelData
          .filter((p: any) => p.unit_kerja?.nama === 'API T2')
          .map((p: any, idx: number) => ({ id: p.id, nik: p.nik, name: toTitleCase(p.nama), phone: p.no_hp || '', jabatan: p.jabatan || '', dbOrder: (p.urutan !== undefined && p.urutan !== null) ? Number(p.urutan) : idx }));
          
        const omIasT2Raw = personelData
          .filter((p: any) => p.unit_kerja?.nama === 'OM/IAS T2')
          .map((p: any, idx: number) => ({ id: p.id, nik: p.nik, name: toTitleCase(p.nama), phone: p.no_hp || '', jabatan: p.jabatan || '', dbOrder: (p.urutan !== undefined && p.urutan !== null) ? Number(p.urutan) : idx }));
        
        // Timpa state lokal dengan data dari Supabase yang diurutkan berdasarkan jabatan
        if (apiT2Raw.length > 0) get().setDataApiT2(sortPersonelByJabatan(apiT2Raw));
        if (omIasT2Raw.length > 0) get().setDataOmIasT2(sortPersonelByJabatan(omIasT2Raw));
      }

      // 3. Fetch Master Configs dari Supabase (JSONB)
      const { data: configsData, error: configsError } = await supabase
        .from('master_configs')
        .select('key, value');

      if (!configsError && configsData) {
        console.log('✅ Berhasil memuat master configs dari Supabase:', configsData.length);
        configsData.forEach(config => {
          saveMasterDataToLocal(config.key, config.value);
          switch(config.key) {
            case 'master_checklist': set({ checklistDataMaster: config.value }); break;
            case 'master_storing_equip': set({ storingEquipments: config.value }); break;
            case 'master_storing_loc_ac': set({ storingLocAc: config.value }); break;
            case 'master_storing_loc_default': set({ storingLocDefault: config.value }); break;
            case 'master_tip_left': set({ tipLeftCol: config.value }); break;
            case 'master_tip_right': set({ tipRightCol: config.value }); break;
          }
        });
      }

    } catch (err) {
      console.warn('Koneksi Supabase belum terkonfigurasi dengan benar.', err);
    }
  }
}));
