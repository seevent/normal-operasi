import React, { useState, useEffect } from 'react';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { Trash2, Plus, Save, ChevronDown, ChevronRight, Settings, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { DEFAULT_CHECKLIST_DATA } from '../../lib/data/masterData';

export const ChecklistDataEditor: React.FC = () => {
  const store = useMasterDataStore();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Clone the data to avoid direct mutation
    setData(JSON.parse(JSON.stringify(store.checklistDataMaster)));
  }, [store.checklistDataMaster]);

  const handleSave = () => {
    store.setChecklistDataMaster(data);
    alert('Konfigurasi Checklist berhasil disimpan ke Supabase!');
  };

  const handleAddBlock = (type: string) => {
    const newData = [...data];
    if (type === 'location') {
      newData.push({ type: 'location', title: 'Lokasi Baru', summary: '', categories: [] });
    } else if (type === 'group') {
      newData.push({ type: 'group', summary: 'Grup Baru', locations: [] });
    } else if (type === 'access_control') {
      newData.push({ type: 'access_control', title: 'Access Control Baru', summary: '', terminals: [] });
    }
    setData(newData);
  };

  const handleDeleteBlock = (idx: number) => {
    if (window.confirm('Hapus blok ini?')) {
      const newData = [...data];
      newData.splice(idx, 1);
      setData(newData);
    }
  };

  const handleMoveBlock = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx > 0) {
      const newData = [...data];
      [newData[idx - 1], newData[idx]] = [newData[idx], newData[idx - 1]];
      setData(newData);
    } else if (direction === 'down' && idx < data.length - 1) {
      const newData = [...data];
      [newData[idx], newData[idx + 1]] = [newData[idx + 1], newData[idx]];
      setData(newData);
    }
  };

  const updateBlock = (idx: number, field: string, value: any) => {
    const newData = [...data];
    newData[idx][field] = value;
    setData(newData);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 pb-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600 shrink-0" /> Editor Konfigurasi Checklist
          </h2>
          <p className="text-slate-500 text-sm mt-1">Edit struktur checklist untuk WhatsApp. Perubahan akan langsung disimpan ke Supabase.</p>
        </div>
        <div className="flex flex-wrap w-full sm:w-auto gap-2">
          <button onClick={() => {
            if (window.confirm('Reset checklist ke default bawaan sistem? Data saat ini di cloud akan tertimpa setelah Anda menekan Simpan ke Cloud.')) {
              setData(JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_DATA)));
            }
          }} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-sm sm:text-base font-bold rounded-xl transition-all shadow-sm border border-rose-200">
            <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5 shrink-0" /> Reset
          </button>
          <button onClick={handleSave} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold rounded-xl transition-all shadow-md">
            <Save className="w-4 sm:w-5 h-4 sm:h-5 shrink-0" /> Simpan
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {data.map((block, bIdx) => (
          <BlockEditor 
            key={bIdx} 
            block={block} 
            onUpdate={(field, val) => updateBlock(bIdx, field, val)} 
            onDelete={() => handleDeleteBlock(bIdx)} 
            onMoveUp={() => handleMoveBlock(bIdx, 'up')}
            onMoveDown={() => handleMoveBlock(bIdx, 'down')}
            isFirst={bIdx === 0}
            isLast={bIdx === data.length - 1}
          />
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-4">
        <button type="button" onClick={() => handleAddBlock('location')} className="flex-1 min-w-[200px] py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Tambah Blok Lokasi
        </button>
        <button type="button" onClick={() => handleAddBlock('group')} className="flex-1 min-w-[200px] py-3 border-2 border-dashed border-purple-300 text-purple-600 font-bold rounded-xl hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Tambah Blok Grup
        </button>
        <button type="button" onClick={() => handleAddBlock('access_control')} className="flex-1 min-w-[200px] py-3 border-2 border-dashed border-emerald-300 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Tambah Blok Access Control
        </button>
      </div>
    </div>
  );
};

// ==========================================
// SUB COMPONENTS
// ==========================================

const BlockEditor = ({ block, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: { 
  block: any, onUpdate: (f: string, v: any) => void, onDelete: () => void, 
  onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden shadow-sm transition-all ${isOpen ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-300'}`}>
      <div className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${isOpen ? 'bg-blue-50' : 'bg-slate-100 hover:bg-slate-200'}`} onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
          <span className="font-bold text-slate-800">
            {block.type.toUpperCase()}: {block.title || block.summary || 'Baru'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} className={`p-2 rounded-lg transition-colors ${isFirst ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200'}`}>
            <ArrowUp className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} className={`p-2 rounded-lg transition-colors ${isLast ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200'}`}>
            <ArrowDown className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-300 mx-1"></div>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 bg-white space-y-5 border-t border-slate-200">
          {block.type !== 'group' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nama/Judul Utama</label>
              <input className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={block.title || ''} onChange={e => onUpdate('title', e.target.value)} />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Teks Summary (WA)</label>
            <input className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={block.summary || ''} onChange={e => onUpdate('summary', e.target.value)} />
          </div>

          {/* Categories for Location */}
          {block.type === 'location' && (
            <CategoryList 
              categories={block.categories || []} 
              onChange={cats => onUpdate('categories', cats)} 
            />
          )}

          {/* Locations for Group */}
          {block.type === 'group' && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Daftar Lokasi di Grup Ini</label>
              {(block.locations || []).map((loc: any, lIdx: number) => (
                <div key={lIdx} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <input placeholder="Nama Lokasi (ex: SSCP E)" className="flex-1 p-2 border border-slate-300 rounded-lg font-bold" value={loc.title || ''} onChange={e => {
                      const newLocs = [...(block.locations || [])];
                      newLocs[lIdx].title = e.target.value;
                      onUpdate('locations', newLocs);
                    }} />
                    <button onClick={() => {
                      if (lIdx > 0) {
                        const newLocs = [...(block.locations || [])];
                        [newLocs[lIdx - 1], newLocs[lIdx]] = [newLocs[lIdx], newLocs[lIdx - 1]];
                        onUpdate('locations', newLocs);
                      }
                    }} disabled={lIdx === 0} className={`p-2 rounded-lg transition-colors ${lIdx === 0 ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200'}`}>
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <button onClick={() => {
                      if (lIdx < (block.locations?.length || 0) - 1) {
                        const newLocs = [...(block.locations || [])];
                        [newLocs[lIdx], newLocs[lIdx + 1]] = [newLocs[lIdx + 1], newLocs[lIdx]];
                        onUpdate('locations', newLocs);
                      }
                    }} disabled={lIdx === (block.locations?.length || 0) - 1} className={`p-2 rounded-lg transition-colors ${lIdx === (block.locations?.length || 0) - 1 ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200'}`}>
                      <ArrowDown className="w-5 h-5" />
                    </button>
                    <button onClick={() => {
                      const newLocs = [...(block.locations || [])];
                      newLocs.splice(lIdx, 1);
                      onUpdate('locations', newLocs);
                    }} className="p-2 text-rose-500 bg-rose-100 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <CategoryList categories={loc.categories || []} onChange={cats => {
                    const newLocs = [...(block.locations || [])];
                    newLocs[lIdx].categories = cats;
                    onUpdate('locations', newLocs);
                  }} />
                </div>
              ))}
              <button onClick={() => onUpdate('locations', [...(block.locations || []), { title: 'Lokasi Baru', categories: [] }])} className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100">
                + Tambah Lokasi
              </button>
            </div>
          )}

          {/* Terminals for Access Control */}
          {block.type === 'access_control' && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Daftar Terminal</label>
              {(block.terminals || []).map((term: any, tIdx: number) => (
                <div key={tIdx} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <input placeholder="Nama Terminal (Opsional, ex: TERMINAL D)" className="flex-1 p-2 border border-slate-300 rounded-lg font-bold" value={term.title || ''} onChange={e => {
                      const newTerms = [...(block.terminals || [])];
                      newTerms[tIdx].title = e.target.value;
                      onUpdate('terminals', newTerms);
                    }} />
                    <button onClick={() => {
                      if (tIdx > 0) {
                        const newTerms = [...(block.terminals || [])];
                        [newTerms[tIdx - 1], newTerms[tIdx]] = [newTerms[tIdx], newTerms[tIdx - 1]];
                        onUpdate('terminals', newTerms);
                      }
                    }} disabled={tIdx === 0} className={`p-2 rounded-lg transition-colors ${tIdx === 0 ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200'}`}>
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <button onClick={() => {
                      if (tIdx < (block.terminals?.length || 0) - 1) {
                        const newTerms = [...(block.terminals || [])];
                        [newTerms[tIdx], newTerms[tIdx + 1]] = [newTerms[tIdx + 1], newTerms[tIdx]];
                        onUpdate('terminals', newTerms);
                      }
                    }} disabled={tIdx === (block.terminals?.length || 0) - 1} className={`p-2 rounded-lg transition-colors ${tIdx === (block.terminals?.length || 0) - 1 ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200'}`}>
                      <ArrowDown className="w-5 h-5" />
                    </button>
                    <button onClick={() => {
                      const newTerms = [...(block.terminals || [])];
                      newTerms.splice(tIdx, 1);
                      onUpdate('terminals', newTerms);
                    }} className="p-2 text-rose-500 bg-rose-100 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <CategoryList categories={term.categories || []} onChange={cats => {
                    const newTerms = [...(block.terminals || [])];
                    newTerms[tIdx].categories = cats;
                    onUpdate('terminals', newTerms);
                  }} />
                </div>
              ))}
              <button onClick={() => onUpdate('terminals', [...(block.terminals || []), { title: 'Terminal Baru', categories: [] }])} className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100">
                + Tambah Terminal
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

const CategoryList = ({ categories, onChange }: { categories: any[], onChange: (c: any[]) => void }) => {
  const updateCat = (idx: number, field: string, val: any) => {
    const newCats = [...categories];
    newCats[idx][field] = val;
    onChange(newCats);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-slate-700">Daftar Kategori & Peralatan</label>
      {categories.map((cat, cIdx) => (
        <div key={cIdx} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/30 flex gap-4 items-start">
          <div className="flex-1 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <input placeholder="Nama Kategori (ex: A. X-RAY)" className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold" value={cat.title || ''} onChange={e => updateCat(cIdx, 'title', e.target.value)} />
              </div>
              <div className="flex-1">
                <input placeholder="Summary Key (opsional, ex: X-RAY)" className="w-full p-2 border border-slate-300 rounded-lg text-sm" value={cat.summaryKey || ''} onChange={e => updateCat(cIdx, 'summaryKey', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Daftar Alat (1 Baris = 1 Alat)</label>
              <textarea 
                className="w-full p-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none whitespace-pre" 
                rows={4}
                value={(cat.items || []).join('\n')}
                onChange={e => {
                  const items = e.target.value.split('\n').filter(s => s.trim() !== '');
                  updateCat(cIdx, 'items', items);
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={() => {
              if (cIdx > 0) {
                const newCats = [...categories];
                [newCats[cIdx - 1], newCats[cIdx]] = [newCats[cIdx], newCats[cIdx - 1]];
                onChange(newCats);
              }
            }} disabled={cIdx === 0} className={`p-2 rounded-lg transition-colors ${cIdx === 0 ? 'text-indigo-200' : 'text-indigo-500 hover:bg-indigo-100'}`}>
              <ArrowUp className="w-5 h-5" />
            </button>
            <button onClick={() => {
              if (cIdx < categories.length - 1) {
                const newCats = [...categories];
                [newCats[cIdx], newCats[cIdx + 1]] = [newCats[cIdx + 1], newCats[cIdx]];
                onChange(newCats);
              }
            }} disabled={cIdx === categories.length - 1} className={`p-2 rounded-lg transition-colors ${cIdx === categories.length - 1 ? 'text-indigo-200' : 'text-indigo-500 hover:bg-indigo-100'}`}>
              <ArrowDown className="w-5 h-5" />
            </button>
            <button onClick={() => {
              const newCats = [...categories];
              newCats.splice(cIdx, 1);
              onChange(newCats);
            }} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg mt-1 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...categories, { title: '', items: [] }])} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
        + Tambah Kategori
      </button>
    </div>
  );
};

