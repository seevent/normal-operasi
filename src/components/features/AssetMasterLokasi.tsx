import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MapPin, Plus, Edit2, Trash2, Loader2, Save, X } from 'lucide-react';

export const AssetMasterLokasi: React.FC = () => {
  const [lokasiList, setLokasiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [formNama, setFormNama] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  
  useEffect(() => {
    loadLokasi();
  }, []);

  const loadLokasi = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('lokasi').select('id, nama').order('nama');
    if (!error && data) {
      setLokasiList(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formNama.trim()) return alert('Nama lokasi harus diisi!');
    setLoading(true);
    const { error } = await supabase.from('lokasi').insert({
      nama: formNama.trim()
    });
    if (!error) {
      setFormNama('');
      setIsAdding(false);
      await loadLokasi();
    } else {
      alert('Gagal menambah: ' + error.message);
    }
    setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editNama.trim()) return alert('Nama lokasi harus diisi!');
    setLoading(true);
    const { error } = await supabase.from('lokasi').update({
      nama: editNama.trim()
    }).eq('id', id);
    if (!error) {
      setEditingId(null);
      await loadLokasi();
    } else {
      alert('Gagal menyimpan: ' + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus lokasi ini? Data penempatan yang terkait mungkin akan ikut terhapus atau error.')) return;
    setLoading(true);
    const { error } = await supabase.from('lokasi').delete().eq('id', id);
    if (!error) {
      await loadLokasi();
    } else {
      alert('Gagal menghapus: ' + error.message);
    }
    setLoading(false);
  };

  if (loading && lokasiList.length === 0) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" /> Data Master Lokasi
        </h3>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Tambah Lokasi
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row gap-3 items-end mb-4">
          <div className="w-full sm:flex-1">
            <label className="block text-xs font-semibold text-blue-800 mb-1">Nama Lokasi</label>
            <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)} className="w-full p-2 border border-blue-200 rounded-lg text-sm" placeholder="Contoh: SSCP D" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleAdd} className="flex-1 sm:flex-none flex justify-center items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
              <Save className="w-4 h-4" /> Simpan
            </button>
            <button onClick={() => setIsAdding(false)} className="flex-1 sm:flex-none flex justify-center items-center gap-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300">
              <X className="w-4 h-4" /> Batal
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="p-3 font-semibold">Nama Lokasi</th>
              <th className="p-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lokasiList.map(loc => (
              <tr key={loc.id} className="hover:bg-slate-50">
                <td className="p-3">
                  {editingId === loc.id ? (
                    <input type="text" value={editNama} onChange={e => setEditNama(e.target.value)} className="w-full p-1.5 border rounded" />
                  ) : (
                    <span className="font-medium text-slate-800">{loc.nama}</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {editingId === loc.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleUpdate(loc.id)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingId(loc.id); setEditNama(loc.nama); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(loc.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {lokasiList.length === 0 && (
              <tr>
                <td colSpan={2} className="p-4 text-center text-slate-500">Belum ada data lokasi.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
