import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Cpu, Plus, Edit2, Trash2, Loader2, Save, X, ChevronRight } from 'lucide-react';

export const AssetMasterPeralatan: React.FC = () => {
  const [jenisList, setJenisList] = useState<any[]>([]);
  const [tipeList, setTipeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedJenisId, setSelectedJenisId] = useState<string | null>(null);

  // Form Jenis
  const [isAddingJenis, setIsAddingJenis] = useState(false);
  const [formJenisNama, setFormJenisNama] = useState('');
  const [editingJenisId, setEditingJenisId] = useState<string | null>(null);
  const [editJenisNama, setEditJenisNama] = useState('');

  // Form Tipe
  const [isAddingTipe, setIsAddingTipe] = useState(false);
  const [formTipeNama, setFormTipeNama] = useState('');
  const [editingTipeId, setEditingTipeId] = useState<string | null>(null);
  const [editTipeNama, setEditTipeNama] = useState('');

  useEffect(() => {
    loadJenis();
  }, []);

  useEffect(() => {
    if (selectedJenisId) {
      loadTipe(selectedJenisId);
    } else {
      setTipeList([]);
    }
  }, [selectedJenisId]);

  const loadJenis = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('jenis_peralatan').select('*').order('nama');
    if (!error && data) {
      setJenisList(data);
    }
    setLoading(false);
  };

  const loadTipe = async (idJenis: string) => {
    const { data, error } = await supabase.from('tipe_peralatan').select('*').eq('id_jenis', idJenis).order('nama');
    if (!error && data) {
      setTipeList(data);
    }
  };

  // --- CRUD Jenis ---
  const handleAddJenis = async () => {
    if (!formJenisNama.trim()) return alert('Nama Jenis harus diisi!');
    setLoading(true);
    const { error } = await supabase.from('jenis_peralatan').insert({ nama: formJenisNama.trim() });
    if (!error) {
      setFormJenisNama('');
      setIsAddingJenis(false);
      await loadJenis();
    } else alert('Gagal: ' + error.message);
    setLoading(false);
  };

  const handleUpdateJenis = async (id: string) => {
    if (!editJenisNama.trim()) return alert('Nama Jenis harus diisi!');
    setLoading(true);
    const { error } = await supabase.from('jenis_peralatan').update({ nama: editJenisNama.trim() }).eq('id', id);
    if (!error) {
      setEditingJenisId(null);
      await loadJenis();
    } else alert('Gagal: ' + error.message);
    setLoading(false);
  };

  const handleDeleteJenis = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus Jenis ini? Tipe dan Penempatan terkait mungkin akan terhapus atau error.')) return;
    setLoading(true);
    const { error } = await supabase.from('jenis_peralatan').delete().eq('id', id);
    if (!error) {
      if (selectedJenisId === id) setSelectedJenisId(null);
      await loadJenis();
    } else alert('Gagal: ' + error.message);
    setLoading(false);
  };

  // --- CRUD Tipe ---
  const handleAddTipe = async () => {
    if (!formTipeNama.trim() || !selectedJenisId) return alert('Nama Tipe harus diisi!');
    const { error } = await supabase.from('tipe_peralatan').insert({ id_jenis: selectedJenisId, nama: formTipeNama.trim() });
    if (!error) {
      setFormTipeNama('');
      setIsAddingTipe(false);
      await loadTipe(selectedJenisId);
    } else alert('Gagal: ' + error.message);
  };

  const handleUpdateTipe = async (id: string) => {
    if (!editTipeNama.trim() || !selectedJenisId) return alert('Nama Tipe harus diisi!');
    const { error } = await supabase.from('tipe_peralatan').update({ nama: editTipeNama.trim() }).eq('id', id);
    if (!error) {
      setEditingTipeId(null);
      await loadTipe(selectedJenisId);
    } else alert('Gagal: ' + error.message);
  };

  const handleDeleteTipe = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus Tipe ini? Penempatan terkait mungkin akan terhapus atau error.')) return;
    const { error } = await supabase.from('tipe_peralatan').delete().eq('id', id);
    if (!error && selectedJenisId) {
      await loadTipe(selectedJenisId);
    } else alert('Gagal: ' + (error?.message || 'Unknown error'));
  };

  if (loading && jenisList.length === 0) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* KIRI: JENIS PERALATAN */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" /> Jenis Peralatan
          </h3>
          {!isAddingJenis && (
            <button onClick={() => setIsAddingJenis(true)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Tambah Jenis
            </button>
          )}
        </div>

        {isAddingJenis && (
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex flex-col gap-3 mb-4">
            <label className="block text-xs font-semibold text-indigo-800">Nama Jenis Peralatan</label>
            <input type="text" value={formJenisNama} onChange={(e) => setFormJenisNama(e.target.value)} className="w-full p-2 border border-indigo-200 rounded-lg text-sm" placeholder="Contoh: X-Ray" />
            <div className="flex gap-2">
              <button onClick={handleAddJenis} className="flex-1 flex justify-center items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700"><Save className="w-4 h-4" /> Simpan</button>
              <button onClick={() => setIsAddingJenis(false)} className="flex-1 flex justify-center items-center gap-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300"><X className="w-4 h-4" /> Batal</button>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <ul className="divide-y divide-slate-200">
            {jenisList.map(jenis => (
              <li 
                key={jenis.id} 
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${selectedJenisId === jenis.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                onClick={(e) => {
                  // Prevent selection if clicking actions
                  if ((e.target as HTMLElement).closest('.actions')) return;
                  setSelectedJenisId(jenis.id);
                }}
              >
                {editingJenisId === jenis.id ? (
                  <input type="text" value={editJenisNama} onChange={e => setEditJenisNama(e.target.value)} className="w-full p-1.5 border rounded text-sm mr-2" />
                ) : (
                  <span className={`font-semibold ${selectedJenisId === jenis.id ? 'text-indigo-900' : 'text-slate-700'}`}>{jenis.nama}</span>
                )}
                
                <div className="actions flex justify-end gap-1 shrink-0">
                  {editingJenisId === jenis.id ? (
                    <>
                      <button onClick={() => handleUpdateJenis(jenis.id)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingJenisId(null)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingJenisId(jenis.id); setEditJenisNama(jenis.nama); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteJenis(jenis.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                      <ChevronRight className={`w-5 h-5 ml-2 ${selectedJenisId === jenis.id ? 'text-indigo-500' : 'text-slate-300'}`} />
                    </>
                  )}
                </div>
              </li>
            ))}
            {jenisList.length === 0 && <li className="p-4 text-center text-slate-500 text-sm">Belum ada data.</li>}
          </ul>
        </div>
      </div>

      {/* KANAN: TIPE PERALATAN */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Tipe / Model Mesin
          </h3>
          {selectedJenisId && !isAddingTipe && (
            <button onClick={() => setIsAddingTipe(true)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Tambah Tipe
            </button>
          )}
        </div>

        {!selectedJenisId ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm">
            Pilih Jenis Peralatan di sebelah kiri terlebih dahulu untuk melihat dan mengelola tipe mesinnya.
          </div>
        ) : (
          <>
            {isAddingTipe && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col gap-3 mb-4">
                <label className="block text-xs font-semibold text-blue-800">Nama Tipe / Model</label>
                <input type="text" value={formTipeNama} onChange={(e) => setFormTipeNama(e.target.value)} className="w-full p-2 border border-blue-200 rounded-lg text-sm" placeholder="Contoh: Rapiscan 620DV" />
                <div className="flex gap-2">
                  <button onClick={handleAddTipe} className="flex-1 flex justify-center items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"><Save className="w-4 h-4" /> Simpan</button>
                  <button onClick={() => setIsAddingTipe(false)} className="flex-1 flex justify-center items-center gap-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300"><X className="w-4 h-4" /> Batal</button>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <ul className="divide-y divide-slate-200">
                {tipeList.map(tipe => (
                  <li key={tipe.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    {editingTipeId === tipe.id ? (
                      <input type="text" value={editTipeNama} onChange={e => setEditTipeNama(e.target.value)} className="w-full p-1.5 border rounded text-sm mr-2" />
                    ) : (
                      <span className="font-medium text-slate-700 text-sm">{tipe.nama}</span>
                    )}
                    
                    <div className="flex justify-end gap-1 shrink-0">
                      {editingTipeId === tipe.id ? (
                        <>
                          <button onClick={() => handleUpdateTipe(tipe.id)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditingTipeId(null)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingTipeId(tipe.id); setEditTipeNama(tipe.nama); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteTipe(tipe.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
                {tipeList.length === 0 && <li className="p-4 text-center text-slate-500 text-sm">Belum ada data tipe untuk jenis ini.</li>}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
