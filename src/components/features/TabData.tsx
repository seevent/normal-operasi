import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import { Lock, Mail, KeyRound, AlertCircle, Loader2, LogOut, Database, Plus, Trash2, RefreshCw } from 'lucide-react';
import { ScheduleUploader } from './ScheduleUploader';
import { ChecklistDataEditor } from './ChecklistDataEditor';
import { AssetManager } from './AssetManager';

export const TabData: React.FC = () => {
  const { user, logout } = useAuthStore();
  
  if (!user) {
    return <AdminLogin />;
  }

  return <AdminDashboard logout={logout} />;
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
    <div className="p-6 md:p-12 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
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
// 2. KOMPONEN DASHBOARD CRUD
// ==========================================
const AdminDashboard: React.FC<{ logout: () => void }> = ({ logout }) => {
  return (
    <div className="p-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Database className="w-7 h-7 text-blue-600" /> Pengaturan Data
          </h2>
          <p className="text-slate-500 mt-1 font-medium">Kelola konfigurasi dan master data laporan.</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold rounded-xl transition-colors">
          <LogOut className="w-5 h-5" /> Keluar
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <LocalDataEditor />
      </div>
    </div>
  );
};

// ==========================================
// 3. KOMPONEN GENERIC CRUD TABLE
// ==========================================
const GenericCrudTable: React.FC<{ tableName: string }> = ({ tableName }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');

  // Sederhanakan render: saat ini kita support 2 tabel sederhana (jenis & lokasi) untuk demo CRUD 1 kolom.
  // Tabel relasional (Tipe, Titik, Penempatan) butuh UI Select Box yang lebih kompleks, kita batasi dulu di sini.
  const isSimpleTable = tableName === 'jenis_peralatan' || tableName === 'lokasi';

  const fetchData = async () => {
    setLoading(true);
    const { data: result, error } = await supabase.from(tableName).select('*').order('id', { ascending: true });
    if (!error && result) {
      setData(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data ini? Data yang terhubung juga mungkin terhapus!')) return;
    await supabase.from(tableName).delete().eq('id', id);
    fetchData();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await supabase.from(tableName).insert([{ nama: newItemName }]);
    setNewItemName('');
    fetchData();
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!isSimpleTable) {
    return (
      <div className="p-12 text-center">
        <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Tabel Relasional Kompleks</h3>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          Tabel <b>{tableName}</b> membutuhkan formulir khusus dengan *dropdown* relasi antar tabel (Foreign Keys). 
          Untuk saat ini, silakan kelola tabel ini langsung melalui <b>Dashboard Supabase</b> Anda.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleAdd} className="flex w-full sm:w-auto gap-2">
          <input 
            type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Tambah nama baru..." 
            className="flex-1 sm:w-64 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          />
          <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Tambah</span>
          </button>
        </form>
        <button onClick={fetchData} className="p-2.5 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm">
              <th className="p-4 font-bold border-b border-slate-200">Nama / Nilai</th>
              <th className="p-4 font-bold border-b border-slate-200 w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-8 text-center text-slate-500 italic">Belum ada data.</td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id} className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="p-4 font-medium text-slate-800">{row.nama}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(row.id)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 4. EDITOR DATA LOKAL (PERSONEL, TIP, STORING)
// ==========================================
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { toTitleCase } from '../../lib/data/masterData';

const LocalDataEditor: React.FC = () => {
  const store = useMasterDataStore();
  const [activeSubTab, setActiveSubTab] = useState('upload_jadwal');
  const [localData, setLocalData] = useState<any[]>([]);

  // Load data based on sub tab
  useEffect(() => {
    switch (activeSubTab) {
      case 'api_t2': setLocalData([...store.dataApiT2]); break;
      case 'om_ias_t2': setLocalData([...store.dataOmIasT2]); break;
      case 'storing_equip': setLocalData([...store.storingEquipments]); break;
      case 'tip_left': setLocalData([...store.tipLeftCol]); break;
    }
  }, [activeSubTab, store]);

  const handleSave = () => {
    switch (activeSubTab) {
      case 'api_t2': store.setDataApiT2(localData); break;
      case 'om_ias_t2': store.setDataOmIasT2(localData); break;
      case 'storing_equip': store.setStoringEquipments(localData); break;
      case 'tip_left': store.setTipLeftCol(localData); break;
    }
    if (activeSubTab !== 'kalibrasi_equip') {
      alert('Data Lokal berhasil disimpan!');
    }
  };

  const handleTextChange = (index: number, field: string | undefined, value: string) => {
    const newData = [...localData];
    if (field) {
      if (field === 'name') {
        newData[index][field] = toTitleCase(value);
      } else {
        newData[index][field] = value;
      }
    } else {
      newData[index] = value;
    }
    setLocalData(newData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-slate-800 text-white p-2 flex gap-1 overflow-x-auto hide-scrollbar">
        {[
          { id: 'upload_jadwal', label: 'Upload Jadwal Excel' },
          { id: 'manajemen_aset', label: 'Manajemen Aset (Lokasi & Mesin)' },
          { id: 'api_t2', label: 'Personel API T2' },
          { id: 'om_ias_t2', label: 'Personel OM/IAS' },
          { id: 'checklist_config', label: 'Checklist Config' },
          { id: 'kalibrasi_equip', label: 'Config Peralatan Kalibrasi' },
          { id: 'tip_data_manager', label: 'Data TIP Tersimpan' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeSubTab === t.id ? 'bg-blue-600' : 'hover:bg-slate-700 text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'upload_jadwal' ? (
        <div className="p-6">
          <ScheduleUploader />
        </div>
      ) : activeSubTab === 'manajemen_aset' ? (
        <div className="p-6 bg-slate-50 min-h-[500px]">
          <AssetManager />
        </div>
      ) : activeSubTab === 'checklist_config' ? (
        <div className="p-6">
          <ChecklistDataEditor />
        </div>
      ) : activeSubTab === 'kalibrasi_equip' ? (
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Peralatan untuk Tab Kalibrasi</h3>
          <p className="text-sm text-slate-500 mb-6">Pilih jenis peralatan dari database yang akan dimunculkan sebagai opsi di halaman Kalibrasi.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {store.jenisPeralatanData.map((jenis: any) => {
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
      ) : (
        <div className="p-6 flex-1 space-y-4">
          {localData.map((item, index) => (
            <div key={index} className="flex gap-2 sm:gap-3 items-start sm:items-center">
              <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                {(activeSubTab === 'api_t2' || activeSubTab === 'om_ias_t2') ? (
                  <>
                    <input className="flex-1 w-full p-2 border rounded-lg" placeholder="Nama Personel" value={item.name || ''} onChange={e => handleTextChange(index, 'name', e.target.value)} />
                    <input className="sm:w-1/3 w-full p-2 border rounded-lg" placeholder="No. WA" value={item.phone || ''} onChange={e => handleTextChange(index, 'phone', e.target.value)} />
                  </>
                ) : (
                  <input className="flex-1 w-full p-2 border rounded-lg" value={item} onChange={e => handleTextChange(index, undefined, e.target.value)} />
                )}
              </div>
              <button onClick={() => { const d = [...localData]; d.splice(index, 1); setLocalData(d); }} className="p-2 mt-1 sm:mt-0 text-rose-500 bg-rose-50 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
        ))}
        
        <button onClick={() => {
          const d = [...localData];
          if (activeSubTab === 'api_t2' || activeSubTab === 'om_ias_t2') d.push({ name: '', phone: '' });
          else d.push('');
          setLocalData(d);
        }} className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-lg hover:bg-blue-50">
          + Tambah Baris
        </button>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
            Simpan Perubahan
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

// ==========================================
// 5. MANAJER DATA TIP TERSIMPAN
// ==========================================
const TipDataManager: React.FC = () => {
  const [tipList, setTipList] = useState<any[]>([]);
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
                const dateObj = new Date(row.updated_at);
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

