import { create } from 'zustand';
import { 
  DEFAULT_DATA_API_T2, DEFAULT_DATA_OM_IAS_T2, DEFAULT_STORING_EQUIPMENTS, 
  DEFAULT_STORING_LOC_AC, DEFAULT_STORING_LOC_DEFAULT, DEFAULT_CHECKLIST_DATA,
  DEFAULT_TIP_LEFT_COL, DEFAULT_TIP_RIGHT_COL, toTitleCase, sortPersonelByJabatan
} from '../lib/data/masterData';
import { supabase } from '../lib/supabaseClient';
import { setCloudinaryConfig, getCloudinaryConfig } from '../lib/services/cloudinaryService';
import { PmDisplaySettings } from '../lib/utils/pmScheduleParser';
import { planPersonelSave } from '../lib/utils/personelSave';
import type { ChecklistBlock } from '../lib/utils/checklistEditor';
import type { JenisPeralatan, Penempatan, Personel, PersonelDbRow, Sparepart, TipColumnItem, UnitPeralatan } from '../lib/types';

export const DEFAULT_PM_DISPLAY_SETTINGS: PmDisplaySettings = {
  categories: {
    'PM Mingguan': true,
    'PM Bulanan': true,
  },
  types: {
    'X-Ray': true,
    'WTMD': true,
    'Body Scanner': true,
    'ETD': true,
    'Extension Conveyor': true,
    'Access Control': true,
  }
};

/** Mengembalikan `true` bila tulis ke Supabase berhasil. Pemanggil yang tidak peduli boleh mengabaikannya. */
const saveConfigToSupabase = async (key: string, data: unknown): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('master_configs')
      .upsert({ key, value: data, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) {
      console.error(`Error saving ${key} to Supabase:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error saving ${key} to Supabase:`, err);
    return false;
  }
};

interface MasterDataState {
  dataApiT2: Personel[];
  setDataApiT2: (data: Personel[]) => void;
  dataOmIasT2: Personel[];
  setDataOmIasT2: (data: Personel[]) => void;
  /**
   * Menyimpan daftar personel satu unit. `previous` = daftar yang tampil di editor sebelum disunting;
   * hanya personel dari daftar itu yang dibuang admin yang dihapus. Melempar galat bila gagal.
   */
  savePersonelToSupabase: (
    data: Personel[],
    unitName: string,
    previous: Personel[],
    confirmDelete: (names: string[], jadwalCount: number) => boolean,
  ) => Promise<void>;
  storingEquipments: string[];
  setStoringEquipments: (data: string[]) => void;
  storingLocAc: string[];
  setStoringLocAc: (data: string[]) => void;
  storingLocDefault: string[];
  setStoringLocDefault: (data: string[]) => void;
  checklistDataMaster: ChecklistBlock[];
  /** Menyimpan lokal lebih dulu, lalu ke cloud. Hasilnya `false` bila penyimpanan cloud gagal. */
  setChecklistDataMaster: (data: ChecklistBlock[]) => Promise<boolean>;
  tipLeftCol: TipColumnItem[];
  setTipLeftCol: (data: TipColumnItem[]) => void;
  tipRightCol: TipColumnItem[];
  setTipRightCol: (data: TipColumnItem[]) => void;
  
  penempatanData: Penempatan[];
  setPenempatanData: (data: Penempatan[]) => void;
  unitPeralatanData: UnitPeralatan[];
  setUnitPeralatanData: (data: UnitPeralatan[]) => void;
  jenisPeralatanData: JenisPeralatan[];
  setJenisPeralatanData: (data: JenisPeralatan[]) => void;
  toggleKalibrasiEquipmentDb: (id: string, tampil: boolean) => Promise<void>;
  
  sparepartsData: Sparepart[];
  briefingSparepartIds: string[];
  fetchSparepartsData: () => Promise<void>;
  toggleBriefingSparepart: (id: string, checked: boolean) => Promise<void>;

  pmDisplaySettings: PmDisplaySettings;
  setPmDisplaySettings: (data: PmDisplaySettings) => void;
  togglePmCategorySetting: (cat: string, enabled: boolean) => Promise<void>;
  togglePmTypeSetting: (type: string, enabled: boolean) => Promise<void>;

  initializeSupabaseData: () => Promise<void>;
}

export const useMasterDataStore = create<MasterDataState>((set, get) => ({
  dataApiT2: sortPersonelByJabatan(DEFAULT_DATA_API_T2),
  setDataApiT2: (data) => {
    const sorted = sortPersonelByJabatan(data);
    set({ dataApiT2: sorted });
  },
  dataOmIasT2: sortPersonelByJabatan(DEFAULT_DATA_OM_IAS_T2),
  setDataOmIasT2: (data) => {
    const sorted = sortPersonelByJabatan(data);
    set({ dataOmIasT2: sorted });
  },
  savePersonelToSupabase: async (data, unitName, previous, confirmDelete) => {
    // Galat dilempar (bukan hanya dicatat) agar tab Data menampilkan "Gagal menyimpan".
    const fail = (what: string, error: { message?: string } | null) => {
      if (error) throw new Error(`${what}: ${error.message ?? 'galat tidak dikenal'}`);
    };

    const searchPattern = unitName === 'API T2' ? '%API%' : '%OM%';
    const { data: uData, error: unitErr } = await supabase
      .from('unit_kerja')
      .select('id')
      .ilike('nama', searchPattern)
      .limit(1);
    fail('Gagal membaca unit kerja', unitErr);
    let unitId: string | undefined = uData?.[0]?.id;
    if (!unitId) {
      const { data: newUnit, error } = await supabase
        .from('unit_kerja')
        .insert({ nama: unitName })
        .select('id')
        .single();
      fail('Gagal membuat unit kerja', error);
      unitId = newUnit?.id;
    }
    if (!unitId) throw new Error(`Unit kerja ${unitName} tidak ditemukan.`);

    const { data: existing, error: readErr } = await supabase
      .from('personel')
      .select('id')
      .eq('unit_id', unitId);
    fail('Gagal membaca personel', readErr);

    const plan = planPersonelSave(data, previous, (existing ?? []).map((p) => String(p.id)));
    if (plan.errors.length > 0) throw new Error(plan.errors.join(' '));

    // Menghapus personel ikut menghapus riwayat jadwal_shift-nya (ON DELETE CASCADE): minta konfirmasi dulu.
    if (plan.deleteIds.length > 0) {
      const { count, error } = await supabase
        .from('jadwal_shift')
        .select('id', { count: 'exact', head: true })
        .in('personel_id', plan.deleteIds);
      fail('Gagal memeriksa riwayat jadwal', error);
      const names = previous.filter((p) => plan.deleteIds.includes(String(p.id))).map((p) => p.name);
      if (!confirmDelete(names, count ?? 0)) throw new Error('Penyimpanan dibatalkan.');
    }

    for (const { id, payload } of plan.updates) {
      const { error } = await supabase.from('personel').update(payload).eq('id', id);
      fail(`Gagal memperbarui ${payload.nama}`, error);
    }
    if (plan.inserts.length > 0) {
      const { error } = await supabase
        .from('personel')
        .insert(plan.inserts.map((payload) => ({ ...payload, unit_id: unitId })));
      fail('Gagal menambah personel baru', error);
    }
    // Hapus paling akhir: bila langkah sebelumnya gagal, tidak ada yang terlanjur terhapus.
    if (plan.deleteIds.length > 0) {
      const { error } = await supabase.from('personel').delete().in('id', plan.deleteIds);
      fail('Gagal menghapus personel', error);
    }

    await get().initializeSupabaseData();
  },
  storingEquipments: DEFAULT_STORING_EQUIPMENTS,
  setStoringEquipments: (data) => {
    saveConfigToSupabase('master_storing_equip', data);
    set({ storingEquipments: data });
  },
  storingLocAc: DEFAULT_STORING_LOC_AC,
  setStoringLocAc: (data) => {
    saveConfigToSupabase('master_storing_loc_ac', data);
    set({ storingLocAc: data });
  },
  storingLocDefault: DEFAULT_STORING_LOC_DEFAULT,
  setStoringLocDefault: (data) => {
    saveConfigToSupabase('master_storing_loc_default', data);
    set({ storingLocDefault: data });
  },
  checklistDataMaster: DEFAULT_CHECKLIST_DATA,
  setChecklistDataMaster: async (data) => {
    set({ checklistDataMaster: data });
    return saveConfigToSupabase('master_checklist', data);
  },
  tipLeftCol: DEFAULT_TIP_LEFT_COL,
  setTipLeftCol: (data) => {
    saveConfigToSupabase('master_tip_left', data);
    set({ tipLeftCol: data });
  },
  tipRightCol: DEFAULT_TIP_RIGHT_COL,
  setTipRightCol: (data) => {
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

  sparepartsData: [],
  briefingSparepartIds: [],

  fetchSparepartsData: async () => {
    try {
      const { data: spData, error } = await supabase
        .from('spareparts')
        .select(`
          *,
          tipe_peralatan ( id, nama ),
          stock_mutations ( qty, mutation_type )
        `)
        .order('name', { ascending: true });

      if (!error && spData) {
        const formatted = spData.map((item) => {
          const mutations = item.stock_mutations || [];
          const stock = mutations.reduce((acc: number, m: { qty?: number; mutation_type?: string }) => {
            const mType = (m.mutation_type || '').toLowerCase();
            if (mType === 'masuk' || mType === 'in') return acc + (m.qty || 0);
            if (mType === 'keluar' || mType === 'out') return acc - (m.qty || 0);
            return acc;
          }, 0);

          return {
            ...item,
            tipe_nama: item.tipe_peralatan?.nama || '-',
            current_stock: stock
          };
        });
        set({ sparepartsData: formatted });
      }

      const { data: cfgData } = await supabase
        .from('master_configs')
        .select('value')
        .eq('key', 'briefing_spareparts')
        .maybeSingle();

      if (cfgData && cfgData.value && Array.isArray(cfgData.value)) {
        set({ briefingSparepartIds: cfgData.value });
      }
    } catch (err) {
      console.error('Error fetching spareparts:', err);
    }
  },

  toggleBriefingSparepart: async (id: string, checked: boolean) => {
    const current = get().briefingSparepartIds || [];
    let next: string[];
    if (checked) {
      next = current.includes(id) ? current : [...current, id];
    } else {
      next = current.filter(i => i !== id);
    }
    set({ briefingSparepartIds: next });
    await saveConfigToSupabase('briefing_spareparts', next);
  },

  pmDisplaySettings: DEFAULT_PM_DISPLAY_SETTINGS,
  setPmDisplaySettings: (data) => {
    set({ pmDisplaySettings: data });
    saveConfigToSupabase('pm_display_settings', data);
  },
  togglePmCategorySetting: async (cat, enabled) => {
    const current = get().pmDisplaySettings;
    const next: PmDisplaySettings = {
      ...current,
      categories: { ...(current.categories || {}), [cat]: enabled }
    };
    set({ pmDisplaySettings: next });
    await saveConfigToSupabase('pm_display_settings', next);
  },
  togglePmTypeSetting: async (type, enabled) => {
    const current = get().pmDisplaySettings;
    const next: PmDisplaySettings = {
      ...current,
      types: { ...(current.types || {}), [type]: enabled }
    };
    set({ pmDisplaySettings: next });
    await saveConfigToSupabase('pm_display_settings', next);
  },

  initializeSupabaseData: async () => {
    try {
      if (get().fetchSparepartsData) {
        await get().fetchSparepartsData();
      }
      // Catatan: klien Supabase belum bertipe sehingga relasi to-one di-embed terbaca sebagai array;
      // bentuk runtime-nya objek tunggal, maka hasil query di-cast ke tipe domain di bawah.
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
        set({ penempatanData: data as unknown as Penempatan[] });
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
      let finalPersonelData: PersonelDbRow[] = [];
      const resMain = await supabase
        .from('personel')
        .select(`id, nik, nama, no_hp, jabatan, urutan, unit_kerja(nama)`)
        .order('urutan', { ascending: true })
        .order('id', { ascending: true });

      if (!resMain.error && resMain.data) {
        finalPersonelData = resMain.data as unknown as PersonelDbRow[];
      } else {
        console.warn('Kolom urutan/jabatan mungkin belum ada di tabel personel Supabase, mencoba fallback query...', resMain.error?.message);
        const resFallback = await supabase
          .from('personel')
          .select(`id, nik, nama, no_hp, jabatan, unit_kerja(nama)`)
          .order('id', { ascending: true });
        if (!resFallback.error && resFallback.data) {
          finalPersonelData = resFallback.data as unknown as PersonelDbRow[];
        } else {
          const resFallback2 = await supabase
            .from('personel')
            .select(`id, nik, nama, no_hp, unit_kerja(nama)`)
            .order('id', { ascending: true });
          if (resFallback2.data) finalPersonelData = resFallback2.data as unknown as PersonelDbRow[];
        }
      }

      if (finalPersonelData.length > 0) {
        // Memisahkan berdasarkan unit kerja dan format ke struktur state
        const apiT2Raw = finalPersonelData
          .filter((p) => p.unit_kerja?.nama === 'API T2')
          .map((p, idx: number) => ({ id: p.id, nik: p.nik || '', name: toTitleCase(p.nama), phone: p.no_hp || '', jabatan: p.jabatan || '', dbOrder: (p.urutan !== undefined && p.urutan !== null) ? Number(p.urutan) : idx }));
          
        const omIasT2Raw = finalPersonelData
          .filter((p) => p.unit_kerja?.nama === 'OM/IAS T2')
          .map((p, idx: number) => ({ id: p.id, nik: p.nik || '', name: toTitleCase(p.nama), phone: p.no_hp || '', jabatan: p.jabatan || '', dbOrder: (p.urutan !== undefined && p.urutan !== null) ? Number(p.urutan) : idx }));
        
        // Timpa state lokal dengan data dari Supabase yang diurutkan berdasarkan jabatan
        if (apiT2Raw.length > 0) get().setDataApiT2(sortPersonelByJabatan(apiT2Raw));
        if (omIasT2Raw.length > 0) get().setDataOmIasT2(sortPersonelByJabatan(omIasT2Raw));
      }

      // 3. Fetch Master Configs dari Supabase (JSONB)
      const { data: configsData, error: configsError } = await supabase
        .from('master_configs')
        .select('key, value');

      if (!configsError && configsData) {
        configsData.forEach(config => {
          switch(config.key) {
            case 'cloudinary_config':
              if (config.value?.cloudName && config.value?.uploadPreset) {
                setCloudinaryConfig(config.value.cloudName, config.value.uploadPreset, false);
              }
              break;
            case 'master_checklist': set({ checklistDataMaster: config.value }); break;
            case 'master_storing_equip': set({ storingEquipments: config.value }); break;
            case 'master_storing_loc_ac': set({ storingLocAc: config.value }); break;
            case 'master_storing_loc_default': set({ storingLocDefault: config.value }); break;
            case 'master_tip_left': set({ tipLeftCol: config.value }); break;
            case 'master_tip_right': set({ tipRightCol: config.value }); break;
            case 'briefing_spareparts': set({ briefingSparepartIds: config.value }); break;
            case 'pm_display_settings':
              if (config.value) {
                set({
                  pmDisplaySettings: {
                    categories: { ...DEFAULT_PM_DISPLAY_SETTINGS.categories, ...(config.value.categories || {}) },
                    types: { ...DEFAULT_PM_DISPLAY_SETTINGS.types, ...(config.value.types || {}) }
                  }
                });
              }
              break;
          }
        });

        // Auto-seed ke Supabase jika database belum memiliki key cloudinary_config tapi lokal memiliki
        const hasCloudinary = configsData.some(c => c.key === 'cloudinary_config');
        if (!hasCloudinary) {
          const local = getCloudinaryConfig();
          if (local.cloudName && local.uploadPreset) {
            saveConfigToSupabase('cloudinary_config', local);
          }
        }
      }

    } catch (err) {
      console.warn('Koneksi Supabase belum terkonfigurasi dengan benar.', err);
    }
  }
}));
