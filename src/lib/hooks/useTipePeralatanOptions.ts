import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useMasterDataStore } from '../../store/useMasterDataStore';

const namaDariPenempatan = (): string[] => {
  const penempatan = useMasterDataStore.getState().penempatanData || [];
  return Array.from(new Set(penempatan.map((p: any) => p.tipe_peralatan?.nama).filter(Boolean))) as string[];
};

/**
 * Daftar nama tipe peralatan untuk dropdown Peralatan (urut abjad).
 * Diambil dari tabel tipe_peralatan; bila kosong atau gagal, memakai data penempatan di store.
 */
export const useTipePeralatanOptions = (): string[] => {
  const penempatanData = useMasterDataStore(state => state.penempatanData);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let result: string[] = [];
      try {
        const { data } = await supabase.from('tipe_peralatan').select('nama').order('nama', { ascending: true });
        if (data && data.length > 0) result = data.map((d: any) => d.nama);
      } catch (err) {
        console.error('Gagal memuat tipe peralatan:', err);
      }
      if (result.length === 0) result = namaDariPenempatan();
      if (!cancelled && result.length > 0) setOptions(result);
    };
    load();
    return () => { cancelled = true; };
  }, [penempatanData]);

  return options;
};
