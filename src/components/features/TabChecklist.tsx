import React, { useState } from 'react';
import { Clock, Calendar, CheckSquare, MapPin, Check, X, ChevronUp, ChevronDown, Cpu, Share2, CheckCircle, FileText, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useMasterDataStore } from '../../store/useMasterDataStore';
import { generateWA_Checklist } from '../../lib/utils/waGenerator';
import { shareToWhatsApp } from '../../lib/services/shareService';

export const TabChecklist: React.FC = () => {
  const { isCopied, setIsCopied } = useAppStore();
  const { checklistDataMaster } = useMasterDataStore();

  const [checklistData, setChecklistData] = useState({
    tanggal: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
    waktuMulai: '',
    waktuSelesai: '',
    supervisorAvsec: {} as Record<string, string>,
  });

  const handleSupervisorChange = (locTitle: string, value: string) => {
    setChecklistData(prev => ({
      ...prev,
      supervisorAvsec: {
        ...(prev.supervisorAvsec || {}),
        [locTitle]: value
      }
    }));
  };

  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});

  const handleChecklistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'waktuSelesai' && value) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (checklistData.tanggal === todayStr && value > currentTimeStr) {
        alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
        return;
      }
    }
    if (name === 'tanggal' && value) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (value === todayStr && checklistData.waktuSelesai && checklistData.waktuSelesai > currentTimeStr) {
        alert(`Pukul Selesai direset karena melebihi waktu saat ini (${currentTimeStr})`);
        setChecklistData(prev => ({ ...prev, tanggal: value, waktuSelesai: '' }));
        return;
      }
    }
    setChecklistData(prev => ({ ...prev, [name]: value }));
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  const toggleChecklistItem = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChecklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (checklistData.tanggal === todayStr && checklistData.waktuSelesai && checklistData.waktuSelesai > currentTimeStr) {
      alert(`Pukul Selesai tidak boleh melebihi waktu saat ini (${currentTimeStr})`);
      return;
    }
    const message = generateWA_Checklist(checklistData, checklistDataMaster, toggles);
    await shareToWhatsApp(message, null, () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  return (
    <form onSubmit={handleChecklistSubmit} className="p-4 sm:p-8 space-y-8 bg-slate-50/50">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-4">
          <Clock className="w-5 h-5 text-blue-600" /> Waktu Pelaksanaan Checklist
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="date" name="tanggal" required value={checklistData.tanggal} onChange={handleChecklistChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Mulai</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="time" name="waktuMulai" required value={checklistData.waktuMulai} onChange={handleChecklistChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pukul Selesai</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input type="time" name="waktuSelesai" required max={checklistData.tanggal === new Date().toISOString().split('T')[0] ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined} value={checklistData.waktuSelesai} onChange={handleChecklistChange} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <button type="submit" className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-0.5 text-white'}`}>
          {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Checklist Berhasil Disalin!</> : <><Share2 className="w-6 h-6" /> Share Checklist ke WA</>}
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
            <CheckSquare className="w-5 h-5 text-blue-600" /> Daftar Peralatan & Status
          </h2>
          <div className="flex gap-4 text-xs font-medium">
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded"><Check className="w-3 h-3"/> Operasi</span>
            <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded"><X className="w-3 h-3"/> Off</span>
          </div>
        </div>
        
        <div className="space-y-6">
          {checklistDataMaster.map((block: any, bIdx: number) => {
            if (block.type === 'location') {
              return (
                <div key={`loc-${bIdx}`} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div 
                    onClick={() => toggleArea(block.title)}
                    className="bg-slate-100 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-slate-500" /> {block.title}
                    </div>
                    {expandedAreas[block.title] ? <ChevronUp className="w-5 h-5 text-slate-500"/> : <ChevronDown className="w-5 h-5 text-slate-500"/>}
                  </div>
                  {expandedAreas[block.title] && (
                    <div className="p-4 space-y-6">
                      {block.categories.map((cat: any, cIdx: number) => (
                        <div key={`cat-${cIdx}`}>
                          <h3 className="text-sm font-bold text-blue-900 mb-3 bg-blue-50 px-3 py-1.5 rounded inline-block">{cat.title}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cat.items.map((item: any, iIdx: number) => {
                              const key = `${block.title}|${cat.title}|${iIdx}`;
                              const isOperasi = toggles[key] !== false;
                              return (
                                <div key={`item-${iIdx}`} onClick={() => toggleChecklistItem(key)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400' : 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400'}`}>
                                  <span className={`text-sm font-semibold ${isOperasi ? 'text-emerald-900' : 'text-red-900'}`}>{item}</span>
                                  <button type="button" className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {isOperasi ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {block.title === 'HBSCP' || (block.title.includes('HBSCP') && !block.title.includes('UMROH')) ? (
                        <div className="pt-4 border-t border-slate-200 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Supervisor Avsec HBSCP 1.1 - 1.6
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                              <input
                                type="text"
                                value={(checklistData.supervisorAvsec || {})['HBSCP 1.1 - 1.6'] || ''}
                                onChange={(e) => handleSupervisorChange('HBSCP 1.1 - 1.6', e.target.value)}
                                placeholder="Nama Supervisor Avsec HBSCP 1.1 - 1.6"
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Supervisor Avsec HBSCP 2.1 - 2.6
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                              <input
                                type="text"
                                value={(checklistData.supervisorAvsec || {})['HBSCP 2.1 - 2.6'] || ''}
                                onChange={(e) => handleSupervisorChange('HBSCP 2.1 - 2.6', e.target.value)}
                                placeholder="Nama Supervisor Avsec HBSCP 2.1 - 2.6"
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      ) : block.title === 'ACCESS CONTROL' || block.title.includes('ACCESS CONTROL') ? (
                        <div className="pt-4 border-t border-slate-200">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Supervisor Avsec Monitoring Access E1
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <input
                              type="text"
                              value={(checklistData.supervisorAvsec || {})[block.title] || (checklistData.supervisorAvsec || {})['Monitoring Access E1'] || ''}
                              onChange={(e) => {
                                handleSupervisorChange(block.title, e.target.value);
                                handleSupervisorChange('Monitoring Access E1', e.target.value);
                              }}
                              placeholder="Nama Supervisor Avsec Monitoring Access E1"
                              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-slate-200">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Supervisor Avsec {block.title}
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <input
                              type="text"
                              value={(checklistData.supervisorAvsec || {})[block.title] || ''}
                              onChange={(e) => handleSupervisorChange(block.title, e.target.value)}
                              placeholder={`Nama Supervisor Avsec ${block.title}`}
                              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            } else if (block.type === 'group') {
              return (
                <div key={`grp-${bIdx}`} className="space-y-6">
                  {block.locations.map((loc: any, lIdx: number) => (
                    <div key={`gloc-${lIdx}`} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div 
                        onClick={() => toggleArea(loc.title)}
                        className="bg-slate-100 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-slate-500" /> {loc.title}
                        </div>
                        {expandedAreas[loc.title] ? <ChevronUp className="w-5 h-5 text-slate-500"/> : <ChevronDown className="w-5 h-5 text-slate-500"/>}
                      </div>
                      {expandedAreas[loc.title] && (
                        <div className="p-4 space-y-6">
                          {loc.categories.map((cat: any, cIdx: number) => (
                            <div key={`gcat-${cIdx}`}>
                              <h3 className="text-sm font-bold text-blue-900 mb-3 bg-blue-50 px-3 py-1.5 rounded inline-block">{cat.title}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {cat.items.map((item: any, iIdx: number) => {
                                  const key = `${loc.title}|${cat.title}|${iIdx}`;
                                  const isOperasi = toggles[key] !== false;
                                  return (
                                    <div key={`gitem-${iIdx}`} onClick={() => toggleChecklistItem(key)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100' : 'bg-red-50 border-red-300 hover:bg-red-100'}`}>
                                      <span className={`text-sm font-semibold ${isOperasi ? 'text-emerald-900' : 'text-red-900'}`}>{item}</span>
                                      <button type="button" className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {isOperasi ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {loc.title === 'HBSCP' || (loc.title.includes('HBSCP') && !loc.title.includes('UMROH')) ? (
                            <div className="pt-4 border-t border-slate-200 space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Supervisor Avsec HBSCP 1.1 - 1.6
                                </label>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                  <input
                                    type="text"
                                    value={(checklistData.supervisorAvsec || {})['HBSCP 1.1 - 1.6'] || ''}
                                    onChange={(e) => handleSupervisorChange('HBSCP 1.1 - 1.6', e.target.value)}
                                    placeholder="Nama Supervisor Avsec HBSCP 1.1 - 1.6"
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Supervisor Avsec HBSCP 2.1 - 2.6
                                </label>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                  <input
                                    type="text"
                                    value={(checklistData.supervisorAvsec || {})['HBSCP 2.1 - 2.6'] || ''}
                                    onChange={(e) => handleSupervisorChange('HBSCP 2.1 - 2.6', e.target.value)}
                                    placeholder="Nama Supervisor Avsec HBSCP 2.1 - 2.6"
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : loc.title === 'ACCESS CONTROL' || loc.title.includes('ACCESS CONTROL') ? (
                            <div className="pt-4 border-t border-slate-200">
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Supervisor Avsec Monitoring Access E1
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                  type="text"
                                  value={(checklistData.supervisorAvsec || {})[loc.title] || (checklistData.supervisorAvsec || {})['Monitoring Access E1'] || ''}
                                  onChange={(e) => {
                                    handleSupervisorChange(loc.title, e.target.value);
                                    handleSupervisorChange('Monitoring Access E1', e.target.value);
                                  }}
                                  placeholder="Nama Supervisor Avsec Monitoring Access E1"
                                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="pt-4 border-t border-slate-200">
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Supervisor Avsec {loc.title}
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                  type="text"
                                  value={(checklistData.supervisorAvsec || {})[loc.title] || ''}
                                  onChange={(e) => handleSupervisorChange(loc.title, e.target.value)}
                                  placeholder={`Nama Supervisor Avsec ${loc.title}`}
                                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            } else if (block.type === 'access_control') {
              return (
                <div key={`ac-${bIdx}`} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div 
                    onClick={() => toggleArea(block.title)}
                    className="bg-slate-800 p-4 border-b border-slate-700 font-bold text-white flex items-center justify-between cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-slate-300" /> {block.title}
                    </div>
                    {expandedAreas[block.title] ? <ChevronUp className="w-5 h-5 text-slate-300"/> : <ChevronDown className="w-5 h-5 text-slate-300"/>}
                  </div>
                  {expandedAreas[block.title] && (
                    <div className="p-4 space-y-8">
                      {block.terminals.map((term: any, tIdx: number) => (
                        <div key={`term-${tIdx}`} className="space-y-4">
                          {term.title && <h3 className="text-base font-bold text-slate-800 border-b pb-2">{term.title}</h3>}
                          <div className="space-y-6 pl-0 md:pl-4">
                            {term.categories.map((cat: any, cIdx: number) => (
                              <div key={`tcat-${cIdx}`}>
                                <h4 className="text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 px-3 py-1.5 rounded inline-block">{cat.title}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {cat.items.map((item: any, iIdx: number) => {
                                    const key = `${block.title}|${term.title}|${cat.title}|${iIdx}`;
                                    const isOperasi = toggles[key] !== false;
                                    return (
                                      <div key={`titem-${iIdx}`} onClick={() => toggleChecklistItem(key)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none shadow-sm hover:-translate-y-0.5 ${isOperasi ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100' : 'bg-red-50 border-red-300 hover:bg-red-100'}`}>
                                        <span className={`text-sm font-semibold ${isOperasi ? 'text-emerald-900' : 'text-red-900'}`}>{item}</span>
                                        <button type="button" className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${isOperasi ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                          {isOperasi ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Supervisor Avsec Monitoring Access E1
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            value={(checklistData.supervisorAvsec || {})[block.title] || (checklistData.supervisorAvsec || {})['Monitoring Access E1'] || ''}
                            onChange={(e) => {
                              handleSupervisorChange(block.title, e.target.value);
                              handleSupervisorChange('Monitoring Access E1', e.target.value);
                            }}
                            placeholder="Nama Supervisor Avsec Monitoring Access E1"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8 sticky bottom-6 z-10">
        <button type="submit" className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-2xl transition-all duration-300 transform ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-[1.02]' : 'bg-[#25D366] hover:bg-[#20b858] hover:-translate-y-1 text-white border-4 border-white'}`}>
          {isCopied ? <><CheckCircle className="w-6 h-6 animate-pulse" /> Checklist Berhasil Disalin!</> : <><Share2 className="w-6 h-6" /> Share Checklist ke WA</>}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Preview Laporan Checklist (Real-time)
        </h3>
        <div className="bg-[#e5ddd5] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
          <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-800 font-mono whitespace-pre-wrap break-words inline-block min-w-full lg:min-w-[80%] max-h-[500px] overflow-y-auto">
            {generateWA_Checklist(checklistData, checklistDataMaster, toggles)}
          </div>
        </div>
      </div>
    </form>
  );
};
