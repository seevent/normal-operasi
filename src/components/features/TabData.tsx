import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import { Lock, Mail, KeyRound, AlertCircle, Loader2, LogOut, Database, Trash2, RefreshCw } from 'lucide-react';
import { ScheduleUploader } from './ScheduleUploader';
import { ChecklistDataEditor } from './ChecklistDataEditor';
import { AssetManager } from './AssetManager';
import { PersonelManager } from './personel/PersonelManager';
import { SparepartManager } from './SparepartManager';
import { CloudinarySettingsPanel } from './CloudinarySettingsPanel';
import { useMasterDataStore } from '../../store/useMasterDataStore';

export const TabData: React.FC = () => {
  const { user, logout } = useAuthStore();
  
  return (
    <div className="p-2.5 sm:p-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-b border-slate-300 pb-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" /> Pengaturan Data
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola konfigurasi dan master data laporan.
          </p>
        </div>
        {user && (
          <button onClick={logout} className="flex items-center gap-2 px-3.5 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        )}
      </div>

      {!user ? (
        <AdminLogin />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-clip min-h-[400px]">
          <LocalDataEditor />
        </div>
      )}
    </div>
  );
};

// ==========================================
// 1. KOMPONEN LOGIN INLINE
// ==========================================
const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Email atau password salah.');
    }
    setLoading(false);
  };

  return (
    <div className="py-8 flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Area</h2>
          <p className="text-slate-500 text-center mt-2 text-sm">Masuk untuk mengelola master data dan database peralatan.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3 border border-rose-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Admin</label>
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden">
              <div className="pl-4 pr-3 text-slate-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 pr-4 bg-transparent outline-none font-medium text-slate-800"
                placeholder="admin@airport.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Kata Sandi</label>
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden">
              <div className="pl-4 pr-3 text-slate-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pr-4 bg-transparent outline-none font-medium text-slate-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 text-lg mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. EDITOR DATA LOKAL (SUB-TAB PENGATURAN DATA)
// ==========================================
const LocalDataEditor: React.FC = () => {
  const store = useMasterDataStore();
  const [activeSubTab, setActiveSubTab] = useState('upload_jadwal');
  const subTabNavRef = useRef<HTMLDivElement>(null);

  // Ada delapan sub-tab pada bilah yang bisa digeser; tanpa ini tab yang baru dipilih bisa tersembunyi.
  useEffect(() => {
    subTabNavRef.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeSubTab]);

  return (
    <div className="flex flex-col h-full">
      <div ref={subTabNavRef} className="bg-slate-800 text-white p-2 flex gap-1 overflow-x-auto hide-scrollbar">
        {[
          { id: 'upload_jadwal', label: 'Upload Jadwal Excel' },
          { id: 'sparepart_list', label: 'Sparepart List' },
          { id: 'manajemen_aset', label: 'Manajemen Aset (Lokasi & Mesin)' },
          { id: 'personel', label: 'Personel' },
          { id: 'checklist_config', label: 'Checklist Config' },
          { id: 'kalibrasi_equip', label: 'Config Peralatan Kalibrasi' },
          { id: 'tip_data_manager', label: 'Data TIP Tersimpan' },
          { id: 'cloudinary', label: 'Cloudinary CDN' }
        ].map(t => (
          <button key={t.id} aria-current={activeSubTab === t.id ? 'true' : undefined} onClick={() => setActiveSubTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeSubTab === t.id ? 'bg-blue-600' : 'hover:bg-slate-700 text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'upload_jadwal' ? (
        <div className="p-3 sm:p-5 md:p-6">
          <ScheduleUploader />
        </div>
      ) : activeSubTab === 'sparepart_list' ? (
        <div className="bg-slate-50 min-h-[500px]">
          <SparepartManager />
        </div>
      ) : activeSubTab === 'manajemen_aset' ? (
        <div className="p-2.5 sm:p-4 md:p-6 bg-slate-50 min-h-[500px]">
          <AssetManager />
        </div>
      ) : activeSubTab === 'checklist_config' ? (
        <div className="p-2 sm:p-5 md:p-6 bg-slate-50 min-h-[500px]">
          <ChecklistDataEditor />
        </div>
      ) : activeSubTab === 'kalibrasi_equip' ? (
        <div className="p-3 sm:p-5 md:p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Peralatan untuk Tab Kalibrasi</h3>
          <p className="text-sm text-slate-500 mb-6">Pilih jenis peralatan dari database yang akan dimunculkan sebagai opsi di halaman Kalibrasi.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {store.jenisPeralatanData.map((jenis) => {
              const isChecked = !!jenis.tampil_di_kalibrasi;
              return (
                <label key={jenis.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      store.toggleKalibrasiEquipmentDb(jenis.id, e.target.checked);
                    }}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 font-semibold text-slate-700">{jenis.nama}</span>
                </label>
              );
            })}
          </div>
          <div className="pt-6 mt-6 border-t border-slate-200 text-sm text-green-600 font-medium">
            * Perubahan otomatis disimpan ke database.
          </div>
        </div>
      ) : activeSubTab === 'tip_data_manager' ? (
        <div className="p-0 border border-slate-200 rounded-xl overflow-hidden m-6">
          <TipDataManager />
        </div>
      ) : (activeSubTab === 'cloudinary' || activeSubTab === 'google_drive') ? (
        <CloudinarySettingsPanel />
      ) : (
        <div className="p-2.5 sm:p-5 md:p-6 bg-slate-50 min-h-[500px]">
          <PersonelManager />
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. MANAJER DATA TIP TERSIMPAN
// ==========================================
const TipDataManager: React.FC = () => {
  const [tipList, setTipList] = useState<{ key: string; updated_at: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTipData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('master_configs')
      .select('key, updated_at')
      .like('key', 'tip_data_%')
      .order('updated_at', { ascending: false });
      
    if (!error && data) {
      setTipList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTipData();
  }, []);

  const handleDelete = async (key: string) => {
    if (!window.confirm(`Hapus data ${key.replace('tip_data_', '').replace('_', ' ')}?`)) return;
    await supabase.from('master_configs').delete().eq('key', key);
    fetchTipData();
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div>
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Daftar Data TIP Tersimpan</h3>
          <p className="text-sm text-slate-500">Data TIP bulanan yang telah disimpan ke cloud.</p>
        </div>
        <button onClick={fetchTipData} className="p-2.5 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm">
              <th className="p-4 font-bold border-b border-slate-200">Bulan & Tahun</th>
              <th className="p-4 font-bold border-b border-slate-200">Terakhir Diperbarui</th>
              <th className="p-4 font-bold border-b border-slate-200 w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tipList.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500 italic">Belum ada data TIP yang tersimpan.</td>
              </tr>
            ) : (
              tipList.map((row, i) => {
                const monthYear = row.key.replace('tip_data_', '').replace('_', ' ');
                const dateObj = new Date(row.updated_at ?? '');
                const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('id-ID') : '-';
                
                return (
                  <tr key={row.key} className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="p-4 font-medium text-slate-800 capitalize">{monthYear}</td>
                    <td className="p-4 text-slate-600 text-sm">{formattedDate}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDelete(row.key)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors" title="Hapus Data">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
