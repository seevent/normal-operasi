import React from 'react';
import { useMasterDataStore } from '../../../store/useMasterDataStore';
import { PersonelSection, type Accent, type PersonelRecord } from './PersonelSection';

interface UnitConfig {
  key: 'api' | 'ias';
  title: string;
  subtitle: string;
  accent: Accent;
  jabatan: string[];
  /** Nama unit di tabel `unit_kerja` Supabase — dipakai `savePersonelToSupabase`. */
  unitName: 'API T2' | 'OM/IAS T2';
}

const PERSONEL_UNITS: UnitConfig[] = [
  {
    key: 'api',
    title: 'Personel API T2',
    subtitle: 'Dipakai di laporan Kehadiran dan Initial Report.',
    accent: 'blue',
    jabatan: ['Supervisor', 'Engineer', 'Technician'],
    unitName: 'API T2',
  },
  {
    key: 'ias',
    title: 'Personel OM/IAS T2',
    subtitle: 'Dipakai di laporan Kehadiran dan Initial Report.',
    accent: 'teal',
    jabatan: ['Supervisor', 'Teknisi', 'Pembantu Teknisi'],
    unitName: 'OM/IAS T2',
  },
];

/**
 * Satu tab untuk kedua unit personel. Tiap unit tetap terpisah: daftar, urutan, dan tombol
 * simpannya sendiri-sendiri, karena masing-masing disimpan ke unit kerja yang berbeda.
 */
export const PersonelManager: React.FC = () => {
  const dataApiT2 = useMasterDataStore((s) => s.dataApiT2);
  const dataOmIasT2 = useMasterDataStore((s) => s.dataOmIasT2);
  const setDataApiT2 = useMasterDataStore((s) => s.setDataApiT2);
  const setDataOmIasT2 = useMasterDataStore((s) => s.setDataOmIasT2);
  const savePersonelToSupabase = useMasterDataStore((s) => s.savePersonelToSupabase);

  const sources: Record<UnitConfig['key'], PersonelRecord[]> = { api: dataApiT2, ias: dataOmIasT2 };
  const setters: Record<UnitConfig['key'], (d: PersonelRecord[]) => void> = { api: setDataApiT2, ias: setDataOmIasT2 };
  const latest = (key: UnitConfig['key']): PersonelRecord[] => {
    const s = useMasterDataStore.getState();
    return key === 'api' ? s.dataApiT2 : s.dataOmIasT2;
  };

  return (
    <div className="space-y-4">
      {PERSONEL_UNITS.map((unit) => (
        <PersonelSection
          key={unit.key}
          title={unit.title}
          subtitle={unit.subtitle}
          accent={unit.accent}
          jabatanOptions={unit.jabatan}
          source={sources[unit.key]}
          onSave={async (rows) => {
            setters[unit.key](rows);
            await savePersonelToSupabase(rows, unit.unitName);
            return latest(unit.key);
          }}
        />
      ))}
    </div>
  );
};
