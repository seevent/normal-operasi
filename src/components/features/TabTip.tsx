import React, { useState, useEffect } from 'react';
import { CheckSquare, Save, Share2, RefreshCw, Square, Check, Lock, Loader2 } from 'lucide-react';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { supabase } from '../../lib/supabaseClient';

export const TIP_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const getDefaultTipPeriod = () => {
  const now = new Date();
  let monthIdx = now.getMonth();
  let year = now.getFullYear();
  if (now.getDate() < 20) {
    monthIdx -= 1;
    if (monthIdx < 0) {
      monthIdx = 11;
      year -= 1;
    }
  }
  return {
    month: TIP_MONTHS[monthIdx],
    year: year.toString()
  };
};

export const TabTip: React.FC = () => {
  const { checklistDataMaster } = useMasterDataStore();

  const tipCategories = React.useMemo(() => {
    const cats: any[] = [];
    (checklistDataMaster || []).forEach(block => {
      if (block.type === 'location') {
        const xrayCat = block.categories?.find((c: any) => c.summaryKey && c.summaryKey.toUpperCase().includes('X-RAY'));
        if (xrayCat && xrayCat.items && xrayCat.items.length > 0) {
          cats.push({
            id: block.title.toLowerCase().replace(/\s+/g, '_'),
            name: block.title,
            items: xrayCat.items.map((item: string) => {
              const match = item.match(/\(([^)]+)\)/);
              return match ? match[1] : 'No1';
            })
          });
        }
      } else if (block.type === 'group') {
        (block.locations || []).forEach((loc: any) => {
          const xrayCat = loc.categories?.find((c: any) => c.summaryKey && c.summaryKey.toUpperCase().includes('X-RAY'));
          if (xrayCat && xrayCat.items && xrayCat.items.length > 0) {
            cats.push({
              id: loc.title.toLowerCase().replace(/\s+/g, '_'),
              name: loc.title,
              items: xrayCat.items.map((item: string) => {
                const match = item.match(/\(([^)]+)\)/);
                return match ? match[1] : 'No1';
              })
            });
          }
        });
      }
    });
    return cats;
  }, [checklistDataMaster]);

  const tipLeftCol = tipCategories.slice(0, Math.ceil(tipCategories.length / 2));
  const tipRightCol = tipCategories.slice(Math.ceil(tipCategories.length / 2));
  const TIP_TOTAL_ITEMS = tipCategories.reduce((acc, cat) => acc + cat.items.length, 0);

  const [tipMonth, setTipMonth] = useState(() => getDefaultTipPeriod().month);
  const [tipYear, setTipYear] = useState(() => getDefaultTipPeriod().year);
  const [tipDataState, setTipDataState] = useState<any>({});
  const [tipLastSaved, setTipLastSaved] = useState<string | null>(null);
  const [tipUnsavedChanges, setTipUnsavedChanges] = useState(false);
  const [isGeneratingTipImage, setIsGeneratingTipImage] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load saved data when month/year changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      const storageKey = `tip_data_${tipMonth}_${tipYear}`;
      
      // 1. Coba baca dari Supabase (Cloud) sebagai Single Source of Truth
      try {
        const { data, error } = await supabase.from('master_configs').select('value').eq('key', storageKey).maybeSingle();
        if (!error && data && data.value) {
          setTipDataState(data.value.items || {});
          setTipLastSaved(data.value.lastSaved || null);
          setIsLoadingData(false);
          setTipUnsavedChanges(false);
          return;
        }
      } catch (err) {
        console.error('Gagal fetch dari supabase:', err);
      }

      setTipDataState({}); 
      setTipLastSaved(null);
      setIsLoadingData(false);
      setTipUnsavedChanges(false);
    };

    loadData();
  }, [tipMonth, tipYear]);

  // Hapus sisa data lokal lama di perangkat pengguna
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('tip_data_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const getTipCheckedCount = () => {
    return Object.values(tipDataState).filter((d: any) => d.checked).length;
  };

  const handleTipToggle = (catId: string, item: string) => {
    const key = `${catId}-${item}`;
    const current = tipDataState[key] || { checked: false, locked: false };
    if (current.locked) return;
    
    setTipDataState((prev: any) => ({
      ...prev,
      [key]: { ...current, checked: !current.checked }
    }));
    setTipUnsavedChanges(true);
  };

  const handleTipCategoryToggle = (catId: string, items: string[]) => {
    const allChecked = items.every(i => {
      const d = tipDataState[`${catId}-${i}`];
      return d && d.checked;
    });
    
    const newData = { ...tipDataState };
    let changed = false;
    items.forEach(i => {
      const key = `${catId}-${i}`;
      const d = newData[key] || { checked: false, locked: false };
      if (!d.locked) {
        newData[key] = { ...d, checked: !allChecked };
        changed = true;
      }
    });
    
    if (changed) {
      setTipDataState(newData);
      setTipUnsavedChanges(true);
    }
  };

  const handleTipToggleAll = () => {
    const allItems = [...tipLeftCol, ...tipRightCol].flatMap(cat => cat.items.map((i: string) => ({ catId: cat.id, item: i })));
    const allChecked = allItems.every(({ catId, item }) => {
      const d = tipDataState[`${catId}-${item}`];
      return d && d.checked;
    });
    
    const newData = { ...tipDataState };
    let changed = false;
    allItems.forEach(({ catId, item }) => {
      const key = `${catId}-${item}`;
      const d = newData[key] || { checked: false, locked: false };
      if (!d.locked) {
        newData[key] = { ...d, checked: !allChecked };
        changed = true;
      }
    });
    
    if (changed) {
      setTipDataState(newData);
      setTipUnsavedChanges(true);
    }
  };

  const handleTipSave = async () => {
    const now = new Date();
    const timeString = `${now.getDate()} ${TIP_MONTHS[now.getMonth()]} ${now.getFullYear()} pukul ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newData = { ...tipDataState };
    Object.keys(newData).forEach(k => {
      if (newData[k].checked) {
        newData[k].locked = true;
      }
    });
    
    setTipDataState(newData);
    setTipLastSaved(timeString);
    setTipUnsavedChanges(false);
    
    const storageKey = `tip_data_${tipMonth}_${tipYear}`;
    const payload = { lastSaved: timeString, items: newData };
    
    // Simpan ke Supabase
    try {
      await supabase.from('master_configs').upsert(
        { key: storageKey, value: payload, updated_at: new Date().toISOString() }, 
        { onConflict: 'key' }
      );
    } catch (err) {
      console.error('Gagal menyimpan progress ke server', err);
    }
  };

  const loadHtmlToImage = () => {
    return new Promise<any>((resolve, reject) => {
      if ((window as any).htmlToImage) return resolve((window as any).htmlToImage);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
      script.onload = () => resolve((window as any).htmlToImage);
      script.onerror = () => reject(new Error('Gagal memuat script gambar'));
      document.head.appendChild(script);
    });
  };

  const handleTipShare = async () => {
    const element = document.getElementById('tip-export-area');
    const grid = document.getElementById('tip-export-grid');
    if (!element) return;
    setIsGeneratingTipImage(true);

    const originalGridClass = grid ? grid.className : '';
    const originalGridStyle = grid ? grid.style.cssText : '';
    const originalElementStyle = element.style.cssText;

    try {
      if (grid) {
        grid.className = 'grid grid-cols-2 gap-6 w-full';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        grid.style.gap = '2rem';
      }
      
      element.style.width = '1000px';
      element.style.maxWidth = '1000px';
      element.style.margin = '0 auto';
      element.style.padding = '40px';

      const htmlToImage = await loadHtmlToImage();
      await new Promise(r => setTimeout(r, 100)); // biarkan browser me-render UI sesaat

      const blob = await htmlToImage.toBlob(element, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });

      if (!blob) throw new Error('Blob image is empty');

      const file = new File([blob], `TIP_Performance_${tipMonth}_${tipYear}.jpg`, { type: 'image/jpeg' });
      const now = new Date();
      const fallbackTimeStr = `${now.getDate()} ${TIP_MONTHS[now.getMonth()]} ${now.getFullYear()} pukul ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
      const savedTimeStr = tipLastSaved || fallbackTimeStr;
      const shareText = `Laporan T2 TIP Performance ${tipMonth} ${tipYear}\nDisimpan Pada ${savedTimeStr}`;
      
      let canShare = false; 
      try { 
        canShare = navigator.canShare && navigator.canShare({ files: [file] }); 
      } catch(e) {} 
      
      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: 'Laporan TIP T2',
            text: shareText
          });
          return;
        } catch (err) {
          console.error('Share dibatalkan/gagal', err);
        }
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TIP_Performance_${tipMonth}_${tipYear}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      
      const text = encodeURIComponent(shareText);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');

    } catch (error) {
      console.error('Error generating image:', error);
      alert('Gagal membuat gambar laporan. Browser mungkin tidak mendukung.');
    } finally {
      if (grid) {
        grid.className = originalGridClass;
        grid.style.cssText = originalGridStyle;
      }
      element.style.cssText = originalElementStyle;
      setIsGeneratingTipImage(false);
    }
  };

  const renderTipTable = (columnData: any[]) => (
    <table className="w-full border-collapse border-[3px] border-slate-800 bg-white shadow-sm">
      <tbody>
        {columnData.map((cat) => {
          return cat.items.map((item: string, itemIdx: number) => {
            const key = `${cat.id}-${item}`;
            const data = tipDataState[key] || { checked: false, locked: false };
            const isLocked = data.locked;
            const isChecked = data.checked;
            
            const catItems = cat.items.map((i: string) => tipDataState[`${cat.id}-${i}`] || { checked: false, locked: false });
            const isAllCatChecked = catItems.every((i: any) => i.checked);
            
            return (
              <tr key={key}>
                {itemIdx === 0 && (
                  <td 
                    rowSpan={cat.items.length} 
                    className="border-r-[3px] border-b-[3px] border-slate-800 p-3 text-center align-middle w-[35%]"
                  >
                    <div className="font-bold text-slate-800 mb-1">{cat.name}</div>
                    <button 
                      type="button" 
                      onClick={() => handleTipCategoryToggle(cat.id, cat.items)}
                      className="text-slate-500 hover:text-emerald-600 transition-colors"
                      title="Check/Uncheck kategori ini"
                    >
                      {isAllCatChecked ? <CheckSquare className="w-5 h-5 mx-auto text-emerald-600" /> : <Square className="w-5 h-5 mx-auto" />}
                    </button>
                  </td>
                )}
                <td className="border-r-[3px] border-b-[2px] border-slate-800 p-2 text-center align-middle font-semibold text-slate-800 w-[30%] bg-white">
                  {item}
                </td>
                <td 
                  onClick={() => handleTipToggle(cat.id, item)}
                  className={`border-b-[2px] border-slate-800 p-1 text-center align-middle transition-colors w-[35%] ${isLocked ? 'bg-slate-100 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer bg-white'}`}
                >
                  <div className="flex items-center justify-center gap-1.5 min-h-[32px]">
                    {isChecked && <Check className="w-6 h-6 text-emerald-600 font-bold" strokeWidth={3} />}
                    {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </td>
              </tr>
            );
          });
        })}
      </tbody>
    </table>
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50/50">
      
      {/* Filter Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bulan</label>
            <select 
              value={tipMonth} 
              onChange={(e) => setTipMonth(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-semibold text-slate-700"
            >
              {TIP_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun</label>
            <input 
              type="number" 
              value={tipYear} 
              onChange={(e) => setTipYear(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700"
            />
          </div>
        </div>
        
        <div className="w-full md:w-64 bg-slate-100 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
            <span>Progress Selesai</span>
            <span className="text-blue-700">{getTipCheckedCount()} / {TIP_TOTAL_ITEMS}</span>
          </div>
          <div className="w-full bg-slate-300 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.round((getTipCheckedCount() / TIP_TOTAL_ITEMS) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button 
          type="button"
          onClick={handleTipToggleAll}
          className="w-full lg:w-auto lg:mr-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors border border-slate-300 text-sm whitespace-nowrap"
        >
          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
          Checklist / Uncheck Semua
        </button>
        
        <div className="flex gap-3 w-full lg:w-auto flex-col sm:flex-row items-stretch">
          <button 
            type="button"
            onClick={handleTipSave}
            disabled={!tipUnsavedChanges}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all text-sm whitespace-nowrap ${
              tipUnsavedChanges 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4 shrink-0" /> Simpan Progres
          </button>
          
          <button 
            type="button"
            onClick={handleTipShare}
            disabled={tipUnsavedChanges || isGeneratingTipImage}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all text-sm whitespace-nowrap ${
              !tipUnsavedChanges && !isGeneratingTipImage
                ? 'bg-[#25D366] hover:bg-[#20b858] text-white shadow-md' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isGeneratingTipImage ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Share2 className="w-4 h-4 shrink-0" />} 
            Share TIP ke WA
          </button>
        </div>
      </div>

      {/* Export Area (Tabel Utama) */}
      <div className="overflow-x-hidden bg-slate-100 rounded-xl p-2 sm:p-4 pb-8">
        <div id="tip-export-area" className="w-full mx-auto bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header Export */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 uppercase tracking-wide">
              T2 TIP PERFORMANCE {tipMonth} {tipYear}
            </h1>
            <p className="text-slate-500 italic mt-2 text-sm sm:text-base">
              {tipLastSaved ? `Terakhir disimpan: ${tipLastSaved}` : 'Belum ada data yang disimpan pada periode ini.'}
            </p>
          </div>

          {/* Tabel Layout: Vertikal di Aplikasi, Bersebelahan saat di-Export */}
          <div id="tip-export-grid" className="flex flex-col gap-6 relative">
            {isLoadingData && (
              <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center rounded-xl">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
            )}
            <div>
              {renderTipTable(tipLeftCol)}
            </div>
            <div>
              {renderTipTable(tipRightCol)}
            </div>
          </div>

        </div>
      </div>

      <p className="text-xs text-slate-500 text-center italic mt-2">
        * Tombol Bagikan (WA) hanya akan aktif jika Anda sudah menyimpan (klik tombol Simpan) perubahan terbaru.
      </p>

    </div>
  );
};
