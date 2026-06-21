import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { MapPin, Cpu, Hash, Trash2, Plus, Loader2, AlertCircle, LayoutGrid, Database, Layers } from 'lucide-react';
import { AssetMasterLokasi } from './AssetMasterLokasi';
import { AssetMasterPeralatan } from './AssetMasterPeralatan';

type TabType = 'penempatan' | 'lokasi' | 'peralatan';

export const AssetManager: React.FC = () => {
  const { initializeSupabaseData } = useMasterDataStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('penempatan');
  
  // Base Data for Penempatan Tab
  const [locations, setLocations] = useState<any[]>([]);
  const [jenisData, setJenisData] = useState<any[]>([]);
  const [tipeData, setTipeData] = useState<any[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  
  const [loadingBase, setLoadingBase] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters for Asset List
  const [filterJenis, setFilterJenis] = useState<string>('');
  const [filterLokasi, setFilterLokasi] = useState<string>('');
  
  // Form State for Adding Asset
  const [formJenis, setFormJenis] = useState<string>('');
  const [formTipe, setFormTipe] = useState<string>('');
  const [formLokasi, setFormLokasi] = useState<string>('');
  const [formTitik, setFormTitik] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'penempatan') {
      loadBaseData();
    }
  }, [activeTab]);

  const loadBaseData = async () => {
    setLoadingBase(true);
    try {
      const [lokRes, jenisRes, tipeRes, assetRes] = await Promise.all([
        supabase.from('lokasi').select('id, nama').order('nama'),
        supabase.from('jenis_peralatan').select('id, nama').order('nama'),
        supabase.from('tipe_peralatan').select('id, id_jenis, nama, varian').order('nama'),
        supabase.from('penempatan_peralatan').select(`
          id,
          is_active,
          id_lokasi,
          tipe_peralatan ( id, id_jenis, nama, jenis_peralatan ( nama ) ),
          titik_lokasi ( id, nomor ),
          lokasi ( id, nama )
        `)
      ]);
      
      if (lokRes.data) setLocations(lokRes.data);
      if (jenisRes.data) setJenisData(jenisRes.data);
      if (tipeRes.data) setTipeData(tipeRes.data);
      if (assetRes.data) {
        // Sort
        const sorted = assetRes.data.sort((a: any, b: any) => {
          const numA = parseInt(a.titik_lokasi?.nomor?.replace(/[^0-9]/g, '') || '0', 10);
          const numB = parseInt(b.titik_lokasi?.nomor?.replace(/[^0-9]/g, '') || '0', 10);
          return numA - numB;
        });
        setAllAssets(sorted);
      }
    } catch (err) {
      console.error('Failed to load base data', err);
    } finally {
      setLoadingBase(false);
    }
  };

  const handleAddAsset = async () => {
    if (!formLokasi || !formTipe || !formTitik.trim()) {
      setErrorMsg('Mohon lengkapi semua field (Lokasi, Tipe, Titik)!');
      return;
    }
    
    setSaving(true);
    setErrorMsg('');
    try {
      // Split titik by comma
      const titikArray = formTitik.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      if (titikArray.length === 0) {
        throw new Error('Format titik tidak valid.');
      }

      // Loop for each titik
      for (const titikStr of titikArray) {
        // 1. Cari atau buat Titik Lokasi
        let titikId = null;
        const { data: existingTitik, error: titikErr } = await supabase
          .from('titik_lokasi')
          .select('id')
          .eq('id_lokasi', formLokasi)
          .eq('nomor', titikStr)
          .maybeSingle();
          
        if (existingTitik) {
          titikId = existingTitik.id;
        } else {
          const { data: newTitik, error: insertErr } = await supabase
            .from('titik_lokasi')
            .insert({ id_lokasi: formLokasi, nomor: titikStr })
            .select('id')
            .single();
            
          if (insertErr) throw insertErr;
          titikId = newTitik.id;
        }

        // 2. Insert ke penempatan_peralatan
        const { error: penempatanErr } = await supabase
          .from('penempatan_peralatan')
          .insert({
            id_tipe: formTipe,
            id_lokasi: formLokasi,
            id_titik: titikId,
            is_active: true
          });
          
        if (penempatanErr) throw penempatanErr;
      }

      // Reset form (keep jenis and lokasi for faster multi-adds, just reset titik)
      setFormTitik('');
      // Reload lists
      await loadBaseData();
      initializeSupabaseData(); // Sinkronisasi global
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus mesin ini dari area ini secara permanen?')) return;
    
    try {
      const { error } = await supabase.from('penempatan_peralatan').delete().eq('id', id);
      if (error) throw error;
      
      await loadBaseData();
      initializeSupabaseData(); // Sinkronisasi global
    } catch (err) {
      console.error('Gagal menghapus aset', err);
      alert('Gagal menghapus aset.');
    }
  };

  // --- Filtering Logic for Display List ---
  
  // Calculate which locations actually contain the currently filtered Jenis
  const locationsWithFilteredJenis = locations.filter(loc => {
    if (!filterJenis) return true; // If no jenis filter, all locations valid
    // Check if there is any asset in allAssets that has this loc.id AND this filterJenis
    return allAssets.some(a => a.id_lokasi === loc.id && a.tipe_peralatan?.id_jenis === filterJenis);
  });

  // Automatically reset filterLokasi if it's no longer valid under the new filterJenis
  useEffect(() => {
    if (filterJenis && filterLokasi) {
      const isValid = locationsWithFilteredJenis.some(l => l.id === filterLokasi);
      if (!isValid) setFilterLokasi('');
    }
  }, [filterJenis]);

  const displayAssets = allAssets.filter(a => {
    if (filterJenis && a.tipe_peralatan?.id_jenis !== filterJenis) return false;
    if (filterLokasi && a.id_lokasi !== filterLokasi) return false;
    return true;
  });

  // --- Form Select Options ---
  const filteredTipeForForm = tipeData.filter(t => t.id_jenis === formJenis);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('penempatan')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'penempatan' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <LayoutGrid className="w-4 h-4" /> Penempatan Mesin
        </button>
        <button 
          onClick={() => setActiveTab('lokasi')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'lokasi' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <MapPin className="w-4 h-4" /> Master Lokasi
        </button>
        <button 
          onClick={() => setActiveTab('peralatan')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'peralatan' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <Database className="w-4 h-4" /> Master Peralatan
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'lokasi' && <AssetMasterLokasi />}
        {activeTab === 'peralatan' && <AssetMasterPeralatan />}
        
        {activeTab === 'penempatan' && (
          loadingBase ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* ADD FORM SECTION */}
              <div className="lg:col-span-1">
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 sticky top-4">
                  <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Tambah Penempatan
                  </h3>
                  
                  {errorMsg && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>{errorMsg}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-blue-800 mb-1">Jenis Peralatan</label>
                      <select 
                        value={formJenis}
                        onChange={(e) => {
                          setFormJenis(e.target.value);
                          setFormTipe(''); // Reset tipe if jenis changes
                        }}
                        className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">-- Pilih Jenis --</option>
                        {jenisData.map(j => (
                          <option key={j.id} value={j.id}>{j.nama}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-blue-800 mb-1">Tipe / Model Mesin</label>
                      <select 
                        value={formTipe}
                        onChange={(e) => setFormTipe(e.target.value)}
                        disabled={!formJenis}
                        className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white disabled:opacity-50"
                      >
                        <option value="">-- Pilih Tipe --</option>
                        {filteredTipeForForm.map(t => (
                          <option key={t.id} value={t.id}>{t.nama}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-800 mb-1">Lokasi</label>
                      <select 
                        value={formLokasi}
                        onChange={(e) => setFormLokasi(e.target.value)}
                        className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">- Pilih Lokasi -</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.nama}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-blue-800 mb-1">Nomor Titik <span className="font-normal text-blue-600">(Bisa multi, pisah dengan koma)</span></label>
                      <input 
                        type="text"
                        value={formTitik}
                        onChange={(e) => setFormTitik(e.target.value)}
                        placeholder="Contoh: 1, 2, 3"
                        className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white"
                      />
                    </div>
                    
                    <button 
                      onClick={handleAddAsset}
                      disabled={saving || !formTipe || !formLokasi || !formTitik.trim()}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Simpan Penempatan
                    </button>
                  </div>
                </div>
              </div>
              
              {/* LIST SECTION */}
              <div className="lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-500" /> Daftar Mesin Terpasang
                  </h3>
                </div>

                {/* FILTERS */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Filter Jenis Peralatan</label>
                    <select 
                      value={filterJenis}
                      onChange={(e) => setFilterJenis(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                    >
                      <option value="">Semua Jenis Peralatan</option>
                      {jenisData.map(j => (
                        <option key={j.id} value={j.id}>{j.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Filter Lokasi</label>
                    <select 
                      value={filterLokasi}
                      onChange={(e) => setFilterLokasi(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                    >
                      <option value="">- Pilih Lokasi -</option>
                      {locationsWithFilteredJenis.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {displayAssets.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <p className="text-slate-500">Tidak ada data penempatan sesuai filter.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayAssets.map((asset) => (
                      <div key={asset.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-300 transition-colors shadow-sm gap-4">
                        
                        <div className="flex items-start gap-4">
                          <div className="bg-slate-100 p-2.5 rounded-lg shrink-0">
                            <Cpu className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {asset.lokasi?.nama || 'Unknown'}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                                {asset.tipe_peralatan?.jenis_peralatan?.nama || 'Unknown'}
                              </span>
                              {!asset.is_active && (
                                <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded">Nonaktif</span>
                              )}
                            </div>
                            <p className="font-bold text-slate-800">{asset.tipe_peralatan?.nama || 'Tipe Tidak Diketahui'}</p>
                            <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                              <Hash className="w-3.5 h-3.5" /> Titik: <strong className="text-slate-700">{asset.titik_lokasi?.nomor || '-'}</strong>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors sm:w-auto w-full shrink-0"
                        >
                          <Trash2 className="w-4 h-4" /> Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          )
        )}
      </div>
    </div>
  );
};
