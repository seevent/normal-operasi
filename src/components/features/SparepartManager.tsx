import React, { useState } from 'react';
import { Search, RefreshCw, Box, PackageCheck, Layers, MapPin } from 'lucide-react';
import { useMasterDataStore } from '../../store/useMasterDataStore';

export const SparepartManager: React.FC = () => {
  const { 
    sparepartsData = [], 
    briefingSparepartIds = [], 
    fetchSparepartsData, 
    toggleBriefingSparepart 
  } = useMasterDataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    if (fetchSparepartsData) await fetchSparepartsData();
    setLoading(false);
  };

  // Filter based on search query: nama sparepart / SKU / nama tipe kompatibel
  const filteredSpareparts = (sparepartsData || []).filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = (item.name || '').toLowerCase().includes(query);
    const skuMatch = (item.sku || '').toLowerCase().includes(query);
    const tipeMatch = (item.tipe_nama || '').toLowerCase().includes(query);
    return nameMatch || skuMatch || tipeMatch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-200">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Box className="w-6 h-6 text-blue-600" /> Sparepart List & Briefing Config
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Kelola daftar sparepart dan tentukan item yang ditampilkan di <b>Tab Briefing (Briefing Unit)</b>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Input Pencarian */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan Nama Sparepart, SKU, atau Nama Tipe yang kompatibel..."
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Info Status Checklist */}
      <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-sm">
        <div className="flex items-center gap-2.5">
          <PackageCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <b>{briefingSparepartIds.length}</b> sparepart dichecklist untuk muncul pada <b>Tab Briefing (Briefing Unit)</b>.
          </span>
        </div>
      </div>

      {/* Tabel Data Sparepart */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 w-44 text-center">Checklist Briefing Unit</th>
                <th className="p-4">SKU / Kode</th>
                <th className="p-4">Nama Sparepart</th>
                <th className="p-4">Tipe Kompatibel</th>
                <th className="p-4 text-center">Jumlah Stok</th>
                <th className="p-4">Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSpareparts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    {searchQuery ? 'Tidak ada sparepart yang sesuai pencarian.' : 'Belum ada data sparepart.'}
                  </td>
                </tr>
              ) : (
                filteredSpareparts.map((item: any) => {
                  const isChecked = briefingSparepartIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/40 transition-colors ${isChecked ? 'bg-blue-50/20' : ''}`}
                    >
                      {/* Checkbox Tampil di Briefing Unit */}
                      <td className="p-4 text-center">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => toggleBriefingSparepart(item.id, e.target.checked)}
                            className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={`text-xs font-bold ${isChecked ? 'text-blue-700' : 'text-slate-400'}`}>
                            {isChecked ? 'Tampil' : 'Sembunyi'}
                          </span>
                        </label>
                      </td>

                      {/* SKU */}
                      <td className="p-4 font-mono font-bold text-slate-700">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                          {item.sku || '-'}
                        </span>
                      </td>

                      {/* Nama Sparepart */}
                      <td className="p-4 font-bold text-slate-800">
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-xs font-normal text-slate-500 mt-0.5">{item.description}</div>
                        )}
                      </td>

                      {/* Tipe Kompatibel */}
                      <td className="p-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{item.tipe_nama}</span>
                        </div>
                      </td>

                      {/* Jumlah Stok */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                            item.current_stock > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {item.current_stock} {item.unit || 'PCS'}
                        </span>
                      </td>

                      {/* Lokasi */}
                      <td className="p-4 text-slate-500 font-medium">
                        {item.lokasi ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.lokasi}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
