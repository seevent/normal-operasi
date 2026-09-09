import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { MapPin, Cpu, Hash, Trash2, Plus, Loader2, AlertCircle, LayoutGrid, Database, Layers, Edit2, Save, X } from 'lucide-react';
import { AssetMasterLokasi } from './AssetMasterLokasi';
import { AssetMasterPeralatan } from './AssetMasterPeralatan';
import { UnitPeralatanManager } from './UnitPeralatanManager';

const MILIK_OPTIONS = ['API', 'Bea Cukai', 'Sewa', 'Lainnya'];
const STATUS_OPTIONS = [
  { val: 'operasi', label: 'Beroperasi Normal' },
  { val: 'standby', label: 'Standby / Cadangan' },
  { val: 'backup', label: 'Unit Backup' },
  { val: 'rusak', label: 'Rusak / Perbaikan' },
  { val: 'rekondisi', label: 'Sedang Rekondisi' }
];

type TabType = 'penempatan' | 'lokasi' | 'peralatan' | 'unit';

export const AssetManager: React.FC = () => {
  const { initializeSupabaseData } = useMasterDataStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('penempatan');
  
  // Base Data for Penempatan Tab
  const [locations, setLocations] = useState<any[]>([]);
  const [jenisData, setJenisData] = useState<any[]>([]);
  const [tipeData, setTipeData] = useState<any[]>([]);
  const [unitsData, setUnitsData] = useState<any[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  
  const [loadingBase, setLoadingBase] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters for Asset List
  const [filterJenis, setFilterJenis] = useState<string>('');
  const [filterLokasi, setFilterLokasi] = useState<string>('');
  
  // Form State for Adding Asset
  const [formJenis, setFormJenis] = useState<string>('');
  const [formTipe, setFormTipe] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('');
  const [formLokasi, setFormLokasi] = useState<string>('');
  const [formTitik, setFormTitik] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Edit Placement State (ubah lokasi & nomor titik)
  const [editingPlacement, setEditingPlacement] = useState<any | null>(null);
  const [editPlacLokasi, setEditPlacLokasi] = useState<string>('');
  const [editPlacTitik, setEditPlacTitik] = useState<string>('');
  const [savingPlacement, setSavingPlacement] = useState<boolean>(false);
  const [editPlacementError, setEditPlacementError] = useState<string>('');

  // Edit Unit Fisik State
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [editUnitSn, setEditUnitSn] = useState<string>('');
  const [editUnitMilik, setEditUnitMilik] = useState<string>('API');
  const [editUnitCustomMilik, setEditUnitCustomMilik] = useState<string>('');
  const [editUnitStatus, setEditUnitStatus] = useState<string>('operasi');
  const [editUnitNoSertifikasi, setEditUnitNoSertifikasi] = useState<string>('');
  const [editUnitTahunInstalasi, setEditUnitTahunInstalasi] = useState<string>('');
  const [editUnitAmpere, setEditUnitAmpere] = useState<string>('');
  const [editUnitCatatan, setEditUnitCatatan] = useState<string>('');
  const [savingUnit, setSavingUnit] = useState<boolean>(false);
  const [editUnitError, setEditUnitError] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'penempatan') {
      loadBaseData();
    }
  }, [activeTab]);

  const loadBaseData = async () => {
    setLoadingBase(true);
    try {
      const [lokRes, jenisRes, tipeRes, unitRes, assetRes] = await Promise.all([
        supabase.from('lokasi').select('id, nama').order('nama'),
        supabase.from('jenis_peralatan').select('id, nama').order('nama'),
        supabase.from('tipe_peralatan').select('id, id_jenis, nama, varian').order('nama'),
        supabase.from('unit_peralatan').select('id, id_tipe, serial_number, milik, status').order('serial_number'),
        supabase.from('penempatan_peralatan').select(`
          id,
          is_active,
          id_lokasi,
          id_unit,
          tipe_peralatan ( id, id_jenis, nama, jenis_peralatan ( nama ) ),
          unit_peralatan ( id, serial_number, milik, status, no_sertifikasi, tahun_instalasi, ampere, catatan ),
          titik_lokasi ( id, nomor ),
          lokasi ( id, nama )
        `)
      ]);
      
      if (lokRes.data) setLocations(lokRes.data);
      if (jenisRes.data) setJenisData(jenisRes.data);
      if (tipeRes.data) setTipeData(tipeRes.data);
      if (unitRes.data) setUnitsData(unitRes.data);
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
    if (!formLokasi || !formTipe || !formUnit || !formTitik.trim()) {
      setErrorMsg('Mohon lengkapi semua field (Lokasi, Tipe, Unit S/N, Titik)!');
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

      if (titikArray.length > 1) {
        throw new Error('Satu unit spesifik hanya dapat ditempatkan pada satu nomor titik.');
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
            id_unit: formUnit || null,
            id_lokasi: formLokasi,
            id_titik: titikId,
            is_active: true
          });
          
        if (penempatanErr) throw penempatanErr;
      }

      // Reset form (keep jenis and lokasi for faster multi-adds, reset unit & titik)
      setFormUnit('');
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

  // --- Handler Edit Penempatan (hanya mengubah lokasi dan titik) ---
  const handleOpenEditPenempatan = (asset: any) => {
    setEditingPlacement(asset);
    setEditPlacLokasi(asset.id_lokasi || '');
    setEditPlacTitik(asset.titik_lokasi?.nomor || '');
    setEditPlacementError('');
  };

  const handleSaveEditPenempatan = async () => {
    if (!editingPlacement) return;
    if (!editPlacLokasi || !editPlacTitik.trim()) {
      setEditPlacementError('Mohon pilih Lokasi dan isi Nomor Titik.');
      return;
    }

    setSavingPlacement(true);
    setEditPlacementError('');
    try {
      const titikStr = editPlacTitik.trim();

      // 1. Cari atau buat Titik Lokasi
      let titikId = null;
      const { data: existingTitik, error: titikErr } = await supabase
        .from('titik_lokasi')
        .select('id')
        .eq('id_lokasi', editPlacLokasi)
        .eq('nomor', titikStr)
        .maybeSingle();

      if (titikErr) throw titikErr;

      if (existingTitik) {
        titikId = existingTitik.id;
      } else {
        const { data: newTitik, error: insertErr } = await supabase
          .from('titik_lokasi')
          .insert({ id_lokasi: editPlacLokasi, nomor: titikStr })
          .select('id')
          .single();

        if (insertErr) throw insertErr;
        titikId = newTitik.id;
      }

      // 2. Update penempatan_peralatan
      const { error: updateErr } = await supabase
        .from('penempatan_peralatan')
        .update({
          id_lokasi: editPlacLokasi,
          id_titik: titikId
        })
        .eq('id', editingPlacement.id);

      if (updateErr) throw updateErr;

      setEditingPlacement(null);
      await loadBaseData();
      initializeSupabaseData();
    } catch (err: any) {
      console.error('Gagal mengupdate penempatan', err);
      setEditPlacementError(err.message || 'Gagal menyimpan perubahan penempatan.');
    } finally {
      setSavingPlacement(false);
    }
  };

  // --- Handler Edit Unit Fisik ---
  const handleOpenEditUnit = (unit: any) => {
    setEditingUnit(unit);
    setEditUnitSn(unit.serial_number || '');
    if (MILIK_OPTIONS.includes(unit.milik || 'API')) {
      setEditUnitMilik(unit.milik || 'API');
      setEditUnitCustomMilik('');
    } else {
      setEditUnitMilik('Lainnya');
      setEditUnitCustomMilik(unit.milik || '');
    }
    setEditUnitStatus(unit.status || 'operasi');
    setEditUnitNoSertifikasi(unit.no_sertifikasi || '');
    setEditUnitTahunInstalasi(unit.tahun_instalasi ? String(unit.tahun_instalasi) : '');
    setEditUnitAmpere(unit.ampere || '');
    setEditUnitCatatan(unit.catatan || '');
    setEditUnitError('');
  };

  const handleSaveEditUnit = async () => {
    if (!editingUnit) return;
    setSavingUnit(true);
    setEditUnitError('');
    try {
      const finalMilik = editUnitMilik === 'Lainnya' 
        ? (editUnitCustomMilik.trim() || 'Lainnya') 
        : editUnitMilik;

      const { error: unitErr } = await supabase
        .from('unit_peralatan')
        .update({
          serial_number: editUnitSn.trim() || null,
          milik: finalMilik,
          status: editUnitStatus,
          no_sertifikasi: editUnitNoSertifikasi.trim() || null,
          tahun_instalasi: editUnitTahunInstalasi ? parseInt(editUnitTahunInstalasi, 10) : null,
          ampere: editUnitAmpere.trim() || null,
          catatan: editUnitCatatan.trim() || null
        })
        .eq('id', editingUnit.id);

      if (unitErr) throw unitErr;

      setEditingUnit(null);
      await loadBaseData();
      initializeSupabaseData();
    } catch (err: any) {
      console.error('Gagal mengupdate data unit', err);
      setEditUnitError(err.message || 'Gagal menyimpan perubahan unit.');
    } finally {
      setSavingUnit(false);
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
  const placedUnitIds = new Set(allAssets.map(a => a.id_unit).filter(Boolean));
  const filteredTipeForForm = tipeData.filter(t => t.id_jenis === formJenis);
  const filteredUnitsForForm = unitsData.filter(u => u.id_tipe === formTipe && !placedUnitIds.has(u.id));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('penempatan')}
          className={`flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-4 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${activeTab === 'penempatan' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" /> Penempatan Mesin
        </button>
        <button 
          onClick={() => setActiveTab('unit')}
          className={`flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-4 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${activeTab === 'unit' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <Layers className="w-4 h-4 shrink-0" /> Unit Peralatan
        </button>
        <button 
          onClick={() => setActiveTab('lokasi')}
          className={`flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-4 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${activeTab === 'lokasi' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <MapPin className="w-4 h-4 shrink-0" /> Master Lokasi
        </button>
        <button 
          onClick={() => setActiveTab('peralatan')}
          className={`flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-4 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${activeTab === 'peralatan' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <Database className="w-4 h-4 shrink-0" /> Master Peralatan
        </button>
      </div>

      <div className="p-3 sm:p-5 md:p-6">
        {activeTab === 'unit' && <UnitPeralatanManager />}
        {activeTab === 'lokasi' && <AssetMasterLokasi />}
        {activeTab === 'peralatan' && <AssetMasterPeralatan />}
        
        {activeTab === 'penempatan' && (
          loadingBase ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
              
              {/* ADD FORM SECTION */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-100 sticky top-4">
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
                          setFormUnit('');
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
                        onChange={(e) => {
                          setFormTipe(e.target.value);
                          setFormUnit('');
                        }}
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
                      <label className="block text-xs font-semibold text-blue-800 mb-1">Pilih Unit Spesifik (S/N)</label>
                      <select 
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        disabled={!formTipe || filteredUnitsForForm.length === 0}
                        className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-white disabled:opacity-50"
                      >
                        <option value="">-- Pilih Unit (S/N) --</option>
                        {filteredUnitsForForm.map(u => (
                          <option key={u.id} value={u.id}>
                            S/N: {u.serial_number || 'Tanpa S/N'} ({u.milik || 'API'})
                          </option>
                        ))}
                      </select>
                      {formTipe && filteredUnitsForForm.length === 0 && (
                        <p className="text-[11px] text-amber-700 mt-1">Tidak ada unit fisik yang tersedia untuk tipe ini.</p>
                      )}
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
                      disabled={saving || !formTipe || !formUnit || !formLokasi || !formTitik.trim()}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Simpan Penempatan
                    </button>
                  </div>
                </div>
              </div>
              
              {/* LIST SECTION */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-500" /> Daftar Mesin Terpasang
                  </h3>
                </div>

                {/* FILTERS */}
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
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
                      <div key={asset.id} className="flex flex-col md:flex-row md:items-center justify-between p-3.5 sm:p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-300 transition-colors shadow-sm gap-3 sm:gap-4">
                        
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="bg-slate-100 p-2 sm:p-2.5 rounded-lg shrink-0 mt-0.5">
                            <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" /> {asset.lokasi?.nama || 'Unknown'}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                                {asset.tipe_peralatan?.jenis_peralatan?.nama || 'Unknown'}
                              </span>
                              {!asset.is_active && (
                                <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded">Nonaktif</span>
                              )}
                            </div>
                            <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{asset.tipe_peralatan?.nama || 'Tipe Tidak Diketahui'}</p>
                            
                            {asset.unit_peralatan?.serial_number && (
                              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 w-fit flex-wrap">
                                <span>S/N: <strong className="font-mono">{asset.unit_peralatan.serial_number}</strong></span>
                                {asset.unit_peralatan.milik && <span className="text-blue-500">• {asset.unit_peralatan.milik}</span>}
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 mt-1">
                              <Hash className="w-3.5 h-3.5 shrink-0" /> Titik: <strong className="text-slate-700">{asset.titik_lokasi?.nomor || '-'}</strong>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0 w-full md:w-auto justify-start md:justify-end">
                          <button 
                            onClick={() => handleOpenEditPenempatan(asset)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors whitespace-nowrap"
                            title="Ubah lokasi dan titik unit"
                          >
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> Edit Penempatan
                          </button>

                          {asset.unit_peralatan && (
                            <button 
                              onClick={() => handleOpenEditUnit(asset.unit_peralatan)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors whitespace-nowrap"
                              title="Ubah rincian unit fisik (S/N, kepemilikan, status)"
                            >
                              <Edit2 className="w-3.5 h-3.5 shrink-0" /> Edit Unit
                            </button>
                          )}

                          <button 
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" /> Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          )
        )}
      </div>

      {/* MODAL EDIT PENEMPATAN (LOKASI & TITIK) */}
      {editingPlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-4 sm:p-6 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" /> Edit Penempatan Unit
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingPlacement.tipe_peralatan?.nama} {editingPlacement.unit_peralatan?.serial_number ? `(S/N: ${editingPlacement.unit_peralatan.serial_number})` : ''}
                </p>
              </div>
              <button 
                onClick={() => setEditingPlacement(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editPlacementError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editPlacementError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi</label>
                <select 
                  value={editPlacLokasi}
                  onChange={(e) => setEditPlacLokasi(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">- Pilih Lokasi -</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Titik</label>
                <input 
                  type="text"
                  value={editPlacTitik}
                  onChange={(e) => setEditPlacTitik(e.target.value)}
                  placeholder="Contoh: 1, Gate 2, Line 3"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingPlacement(null)}
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-sm transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={handleSaveEditPenempatan}
                  disabled={savingPlacement || !editPlacLokasi || !editPlacTitik.trim()}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPlacement ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT UNIT FISIK */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-4 sm:p-6 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-600" /> Edit Unit Fisik Peralatan
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  S/N: {editingUnit.serial_number || 'Tanpa S/N'}
                </p>
              </div>
              <button 
                onClick={() => setEditingUnit(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editUnitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editUnitError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number (S/N)</label>
                  <input 
                    type="text"
                    value={editUnitSn}
                    onChange={(e) => setEditUnitSn(e.target.value)}
                    placeholder="S/N unit"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kepemilikan</label>
                  <select 
                    value={editUnitMilik}
                    onChange={(e) => setEditUnitMilik(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {MILIK_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editUnitMilik === 'Lainnya' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kepemilikan Lainnya</label>
                  <input 
                    type="text"
                    value={editUnitCustomMilik}
                    onChange={(e) => setEditUnitCustomMilik(e.target.value)}
                    placeholder="Sebutkan instansi / vendor..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Operasional</label>
                  <select 
                    value={editUnitStatus}
                    onChange={(e) => setEditUnitStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.val} value={s.val}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Sertifikasi Kelaikan</label>
                  <input 
                    type="text"
                    value={editUnitNoSertifikasi}
                    onChange={(e) => setEditUnitNoSertifikasi(e.target.value)}
                    placeholder="No sertifikasi..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Instalasi</label>
                  <input 
                    type="number"
                    value={editUnitTahunInstalasi}
                    onChange={(e) => setEditUnitTahunInstalasi(e.target.value)}
                    placeholder="Contoh: 2021"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daya / Ampere</label>
                  <input 
                    type="text"
                    value={editUnitAmpere}
                    onChange={(e) => setEditUnitAmpere(e.target.value)}
                    placeholder="Contoh: 16A"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Khusus</label>
                <textarea 
                  value={editUnitCatatan}
                  onChange={(e) => setEditUnitCatatan(e.target.value)}
                  rows={2}
                  placeholder="Catatan kondisi mesin..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-sm transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={handleSaveEditUnit}
                  disabled={savingUnit}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingUnit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Unit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
