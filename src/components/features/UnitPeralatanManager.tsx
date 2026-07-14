import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { 
  Plus, Edit2, Trash2, Loader2, Save, X, Search, Filter, 
  Cpu, Tag, ShieldCheck, Calendar, Building2, AlertCircle, 
  CheckCircle2, Clock, Box, AlertTriangle, Layers, Zap
} from 'lucide-react';

export const UnitPeralatanManager: React.FC = () => {
  const { initializeSupabaseData } = useMasterDataStore();
  
  const [unitList, setUnitList] = useState<any[]>([]);
  const [jenisList, setJenisList] = useState<any[]>([]);
  const [tipeList, setTipeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [filterJenis, setFilterJenis] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [formJenis, setFormJenis] = useState<string>('');
  const [formTipe, setFormTipe] = useState<string>('');
  const [formSn, setFormSn] = useState<string>('');
  const [formNoSertifikasi, setFormNoSertifikasi] = useState<string>('');
  const [formTahunInstalasi, setFormTahunInstalasi] = useState<string>('');
  const [formAmpere, setFormAmpere] = useState<string>('');
  const [formMilik, setFormMilik] = useState<string>('API');
  const [formCustomMilik, setFormCustomMilik] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('operasi');
  const [formCatatan, setFormCatatan] = useState<string>('');

  const MILIK_OPTIONS = [
    'API',
    'Bea Cukai',
    'Sewa',
    'Lainnya'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jenisRes, tipeRes, unitRes] = await Promise.all([
        supabase.from('jenis_peralatan').select('id, nama').order('nama'),
        supabase.from('tipe_peralatan').select('id, id_jenis, nama, varian').order('nama'),
        supabase.from('unit_peralatan').select(`
          *,
          tipe_peralatan ( id, id_jenis, nama, varian, jenis_peralatan ( id, nama ) )
        `).order('created_at', { ascending: false })
      ]);

      if (jenisRes.data) setJenisList(jenisRes.data);
      if (tipeRes.data) setTipeList(tipeRes.data);
      if (unitRes.data) setUnitList(unitRes.data);
    } catch (err) {
      console.error('Failed to load unit equipment data', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormJenis('');
    setFormTipe('');
    setFormSn('');
    setFormNoSertifikasi('');
    setFormTahunInstalasi('');
    setFormAmpere('');
    setFormMilik('API');
    setFormCustomMilik('');
    setFormStatus('operasi');
    setFormCatatan('');
    setErrorMsg('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (unit: any) => {
    setEditingId(unit.id);
    const idJenis = unit.tipe_peralatan?.id_jenis || '';
    setFormJenis(idJenis);
    setFormTipe(unit.id_tipe || '');
    setFormSn(unit.serial_number || '');
    setFormNoSertifikasi(unit.no_sertifikasi || '');
    setFormTahunInstalasi(unit.tahun_instalasi ? String(unit.tahun_instalasi) : '');
    setFormAmpere(unit.ampere ? String(unit.ampere) : '');
    
    // Check if milik is in standard options
    const milikVal = unit.milik || 'API';
    if (MILIK_OPTIONS.includes(milikVal)) {
      setFormMilik(milikVal);
      setFormCustomMilik('');
    } else {
      setFormMilik('Lainnya');
      setFormCustomMilik(milikVal);
    }

    setFormStatus(unit.status || 'operasi');
    setFormCatatan(unit.catatan || '');
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formTipe) {
      setErrorMsg('Mohon pilih Jenis dan Tipe Mesin terlebih dahulu!');
      return;
    }

    const finalMilik = formMilik === 'Lainnya' 
      ? (formCustomMilik.trim() || 'Lainnya') 
      : formMilik;

    const payload: any = {
      id_tipe: formTipe,
      serial_number: formSn.trim() || null,
      no_sertifikasi: formNoSertifikasi.trim() || null,
      tahun_instalasi: formTahunInstalasi ? parseInt(formTahunInstalasi, 10) : null,
      ampere: formAmpere.trim() || null,
      milik: finalMilik,
      status: formStatus,
      catatan: formCatatan.trim() || null
    };

    setSaving(true);
    setErrorMsg('');

    try {
      if (editingId) {
        const { error } = await supabase
          .from('unit_peralatan')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('unit_peralatan')
          .insert(payload);
        if (error) throw error;
      }

      await loadData();
      initializeSupabaseData();
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Error saving unit:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data unit.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus unit fisik peralatan ini? Jika unit ini sedang terpasang di lokasi penempatan, mohon lepas atau hapus penempatannya terlebih dahulu.')) return;

    try {
      const { error } = await supabase.from('unit_peralatan').delete().eq('id', id);
      if (error) {
        if (error.message?.includes('foreign key constraint')) {
          alert('Gagal menghapus: Unit ini masih terhubung dengan data penempatan mesin aktif. Hapus dari tabel penempatan terlebih dahulu.');
        } else {
          throw error;
        }
      } else {
        await loadData();
        initializeSupabaseData();
      }
    } catch (err: any) {
      console.error('Failed delete unit:', err);
      alert('Gagal menghapus unit: ' + (err.message || 'Unknown error'));
    }
  };

  // Filtered Tipe for Form Select
  const filteredTipeForForm = tipeList.filter(t => t.id_jenis === formJenis);

  // Filter & Search List
  const displayUnits = unitList.filter(u => {
    if (filterJenis && u.tipe_peralatan?.id_jenis !== filterJenis) return false;
    if (filterStatus && u.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const snMatch = u.serial_number?.toLowerCase().includes(q);
      const tipeMatch = u.tipe_peralatan?.nama?.toLowerCase().includes(q);
      const milikMatch = u.milik?.toLowerCase().includes(q);
      const sertMatch = u.no_sertifikasi?.toLowerCase().includes(q);
      if (!snMatch && !tipeMatch && !milikMatch && !sertMatch) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operasi':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Operasi
          </span>
        );
      case 'standby':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Standby
          </span>
        );
      case 'gudang':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Box className="w-3.5 h-3.5 text-slate-500" /> Gudang
          </span>
        );
      case 'rusak':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Rusak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> Manajemen Unit Fisik Peralatan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data fisik setiap unit mesin (S/N, sertifikasi, status operasional & kepemilikan).
          </p>
        </div>
        
        {!isFormOpen && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Unit Fisik
          </button>
        )}
      </div>

      {/* FORM MODAL / COLLAPSIBLE PANEL */}
      {isFormOpen && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-sm relative transition-all">
          <div className="flex items-center justify-between border-b border-blue-200/80 pb-3 mb-4">
            <h4 className="font-bold text-blue-950 flex items-center gap-2 text-base">
              {editingId ? <Edit2 className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-blue-600" />}
              {editingId ? 'Edit Data Unit Fisik' : 'Tambah Unit Fisik Baru'}
            </h4>
            <button
              onClick={() => { setIsFormOpen(false); resetForm(); }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-xl flex items-start gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. JENIS PERALATAN */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">Jenis Peralatan <span className="text-red-500">*</span></label>
              <select
                value={formJenis}
                onChange={(e) => {
                  setFormJenis(e.target.value);
                  setFormTipe('');
                }}
                className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Pilih Jenis --</option>
                {jenisList.map(j => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </select>
            </div>

            {/* 2. TIPE / MODEL */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">Tipe / Model Mesin <span className="text-red-500">*</span></label>
              <select
                value={formTipe}
                onChange={(e) => setFormTipe(e.target.value)}
                disabled={!formJenis}
                className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">-- Pilih Tipe --</option>
                {filteredTipeForForm.map(t => (
                  <option key={t.id} value={t.id}>{t.nama}</option>
                ))}
              </select>
            </div>

            {/* 3. SERIAL NUMBER */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-blue-600" /> Serial Number (S/N)
              </label>
              <input
                type="text"
                value={formSn}
                onChange={(e) => setFormSn(e.target.value)}
                placeholder="Contoh: SN-90210-B"
                className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* 4. KEPEMILIKAN */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Kepemilikan Mesin
              </label>
              <div className="space-y-2">
                <select
                  value={formMilik}
                  onChange={(e) => setFormMilik(e.target.value)}
                  className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {MILIK_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {formMilik === 'Lainnya' && (
                  <input
                    type="text"
                    value={formCustomMilik}
                    onChange={(e) => setFormCustomMilik(e.target.value)}
                    placeholder="Tulis nama instansi kepemilikan..."
                    className="w-full p-2 border border-blue-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* 5. STATUS OPERASIONAL */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">Status Operasional <span className="text-red-500">*</span></label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="operasi">🟢 Operasi</option>
                <option value="standby">🟡 Standby</option>
                <option value="gudang">⚪ Gudang</option>
                <option value="rusak">🔴 Rusak</option>
              </select>
            </div>

            {/* 6. NO SERTIFIKASI */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Nomor Sertifikasi
              </label>
              <input
                type="text"
                value={formNoSertifikasi}
                onChange={(e) => setFormNoSertifikasi(e.target.value)}
                placeholder="Contoh: SERT/DGCA/2026/019"
                className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* 7. TAHUN INSTALASI */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Tahun Instalasi
              </label>
              <input
                type="number"
                value={formTahunInstalasi}
                onChange={(e) => setFormTahunInstalasi(e.target.value)}
                placeholder="Contoh: 2021"
                min="1990"
                max="2100"
                className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* 8. AMPERE */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Ampere (Arus Listrik)
              </label>
              <input
                type="text"
                value={formAmpere}
                onChange={(e) => setFormAmpere(e.target.value)}
                placeholder="Contoh: 16A atau 32 Ampere"
                className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* 9. CATATAN */}
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-xs font-bold text-blue-900 mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                placeholder="Contoh: Kondisi fisik baik, cadangan dari Terminal 2F..."
                className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-blue-200/80">
            <button
              onClick={() => { setIsFormOpen(false); resetForm(); }}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formTipe}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Simpan Perubahan' : 'Simpan Unit'}
            </button>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Serial Number, Tipe Mesin, Sertifikat, atau Kepemilikan..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="w-44 sm:w-48">
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Semua Jenis</option>
              {jenisList.map(j => (
                <option key={j.id} value={j.id}>{j.nama}</option>
              ))}
            </select>
          </div>

          <div className="w-36 sm:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="operasi">Operasi</option>
              <option value="standby">Standby</option>
              <option value="gudang">Gudang</option>
              <option value="rusak">Rusak</option>
            </select>
          </div>
        </div>
      </div>

      {/* UNIT CARDS / TABLE LIST */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : displayUnits.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-base">Belum ada unit peralatan yang sesuai.</p>
          <p className="text-xs text-slate-500 mt-1">
            Tekan tombol "Tambah Unit Fisik" di atas untuk menambahkan data baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayUnits.map(unit => {
            const jenisNama = unit.tipe_peralatan?.jenis_peralatan?.nama || 'Unknown Jenis';
            const tipeNama = unit.tipe_peralatan?.nama || 'Unknown Tipe';
            const sn = unit.serial_number || 'Tanpa S/N';

            return (
              <div
                key={unit.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* TOP ROW: Badge Jenis & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1.5 border border-slate-200/80">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" /> {jenisNama}
                    </span>
                    {getStatusBadge(unit.status)}
                  </div>

                  {/* TITLE & S/N */}
                  <h4 className="font-bold text-slate-900 text-base leading-snug">{tipeNama}</h4>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 mt-1">
                    <Tag className="w-4 h-4" />
                    <span>S/N: <strong className="font-mono text-slate-800">{sn}</strong></span>
                  </div>

                  {/* DETAILS LIST */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Kepemilikan:</span>
                      <span className="font-bold text-slate-700">{unit.milik || 'API'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">No. Sertifikasi:</span>
                      <span className="font-semibold text-slate-700">{unit.no_sertifikasi || '-'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Tahun Instalasi:</span>
                      <span className="font-semibold text-slate-700">{unit.tahun_instalasi || '-'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Ampere:</span>
                      <span className="font-semibold text-slate-700">{unit.ampere || '-'}</span>
                    </div>

                    {unit.catatan && (
                      <div className="pt-1.5 mt-1.5 border-t border-slate-200/60 text-slate-500 italic line-clamp-2">
                        "{unit.catatan}"
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM ACTIONS */}
                <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(unit)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
