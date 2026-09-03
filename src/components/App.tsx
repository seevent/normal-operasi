import React, { useState, useEffect, cloneElement } from 'react';
import { 
  Wrench, Users, Megaphone, CheckSquare, Settings, AlertTriangle, 
  RefreshCw, Check, Database, CheckCircle, FileText, Briefcase, FileWarning,
  ChevronLeft, ChevronRight, Package, ExternalLink, FileCheck
} from 'lucide-react';
import { MonitorSearchIcon } from './shared/MonitorSearchIcon';

import { TabInitialReport } from './features/TabInitialReport';
import { TabKehadiran } from './features/TabKehadiran';
import { TabPerbaikan } from './features/TabPerbaikan';
import { TabStoring } from './features/TabStoring';
import { TabKalibrasi } from './features/TabKalibrasi';
import { TabTip } from './features/TabTip';
import { TabChecklist } from './features/TabChecklist';
import { TabBriefing } from './features/TabBriefing';
import { TabData } from './features/TabData';
import { TabKegiatan } from './features/TabKegiatan';
import { TabShiftReport } from './features/TabShiftReport';
import { TabBASerahTerima } from './features/TabBASerahTerima';
import { useAppStore } from '../store/useAppStore';
import { useMasterDataStore } from '../store/useMasterDataStore';
import { useAuthStore } from '../store/useAuthStore';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
}

const ALL_TABS: TabItem[] = [
  { 
    id: 'kehadiran', 
    label: 'Kehadiran', 
    icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    shadowColor: '#1d4ed8'
  },
  { 
    id: 'briefing', 
    label: 'Briefing', 
    icon: <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-violet-400 via-purple-500 to-purple-600',
    shadowColor: '#6b21a8'
  },
  { 
    id: 'storing', 
    label: 'Storing', 
    icon: <MonitorSearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-cyan-400 via-sky-500 to-blue-500',
    shadowColor: '#0284c7'
  },
  { 
    id: 'checklist', 
    label: 'Checklist', 
    icon: <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-emerald-400 via-emerald-500 to-teal-600',
    shadowColor: '#047857'
  },
  { 
    id: 'initial', 
    label: 'Initial Report', 
    icon: <FileWarning className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-amber-400 via-orange-500 to-orange-600',
    shadowColor: '#c2410c'
  },
  { 
    id: 'perbaikan', 
    label: 'Perbaikan', 
    icon: <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-rose-400 via-rose-500 to-red-600',
    shadowColor: '#be123c'
  },
  { 
    id: 'kalibrasi', 
    label: 'Kalibrasi', 
    icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-slate-400 via-slate-500 to-slate-600',
    shadowColor: '#334155'
  },
  { 
    id: 'kegiatan', 
    label: 'Kegiatan', 
    icon: <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-indigo-400 via-indigo-500 to-indigo-600',
    shadowColor: '#4338ca'
  },
  { 
    id: 'ba_serah_terima', 
    label: 'BA Serah Terima', 
    icon: <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-teal-400 via-teal-500 to-emerald-600',
    shadowColor: '#0f766e'
  },
  { 
    id: 'report', 
    label: 'Report', 
    icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-blue-500 via-blue-600 to-indigo-700',
    shadowColor: '#1e3a8a'
  },
  { 
    id: 'tip', 
    label: 'TIP', 
    icon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    shadowColor: '#b45309'
  },
  { 
    id: 'data', 
    label: 'Data', 
    icon: <Database className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />,
    gradient: 'from-fuchsia-400 via-purple-500 to-indigo-600',
    shadowColor: '#7e22ce'
  },
];

const ITEMS_PER_PAGE = 8;
const TOTAL_PAGES = Math.ceil(ALL_TABS.length / ITEMS_PER_PAGE);

export default function App() {
  const { activeTab, setActiveTab, setIsCopied } = useAppStore();
  const { initializeSupabaseData } = useMasterDataStore();
  const { initializeAuth } = useAuthStore();

  const [isResetting, setIsResetting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [tabResetKeys, setTabResetKeys] = useState<Record<string, number>>({});

  // Touch & Mouse swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  useEffect(() => {
    initializeSupabaseData();
    initializeAuth();
  }, [initializeSupabaseData, initializeAuth]);

  // Sync currentPage with activeTab
  useEffect(() => {
    const idx = ALL_TABS.findIndex((t) => t.id === activeTab);
    if (idx !== -1) {
      const pageOfActive = Math.floor(idx / ITEMS_PER_PAGE);
      if (pageOfActive !== currentPage) {
        setCurrentPage(pageOfActive);
      }
    }
  }, [activeTab]);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setIsResetting(true);
    if (setIsCopied) setIsCopied(false);
    
    // Remount active tab to restore original initial state
    setTabResetKeys((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || 0) + 1,
    }));

    setTimeout(() => {
      setIsResetting(false);
    }, 500);
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 35;
    if (distance > minSwipeDistance) {
      // Swiped left -> next page
      if (currentPage < TOTAL_PAGES - 1) {
        setCurrentPage((prev) => prev + 1);
      }
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev page
      if (currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      }
    }
  };

  const renderTabButton = (tab: TabItem, idx: number) => {
    const isActive = activeTab === tab.id;
    const isRightBorder = (idx + 1) % 4 !== 0;
    const isBottomBorder = idx < 4;
    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => switchTab(tab.id)}
        className={`group min-h-[70px] sm:min-h-[78px] py-2 px-1 text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
          isRightBorder ? 'border-r border-slate-200' : ''
        } ${
          isBottomBorder ? 'border-b border-slate-200' : ''
        } ${
          isActive
            ? 'bg-blue-700 text-white font-extrabold shadow-inner shadow-blue-950/30 border-b-4 border-amber-400 relative z-10'
            : 'bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 hover:text-slate-900'
        }`}
      >
        <div
          style={{
            boxShadow: isActive
              ? `0 3px 0 0 ${tab.shadowColor}, 0 6px 10px rgba(0,0,0,0.3)`
              : `0 2.5px 0 0 ${tab.shadowColor}, 0 3px 5px rgba(0,0,0,0.12)`
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-b ${tab.gradient} border-t border-white/50 transition-all duration-200 ${
            isActive
              ? 'scale-110 -translate-y-0.5 ring-2 ring-amber-300'
              : 'group-hover:scale-105 group-hover:-translate-y-0.5 opacity-90 group-hover:opacity-100'
          }`}
        >
          <span className="filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.35)] flex items-center justify-center">
            {tab.icon}
          </span>
        </div>
        <span className="truncate w-full text-center leading-tight">{tab.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 flex items-center justify-center font-sans relative print:min-h-0 print:bg-white print:p-0 print:m-0 print:block">

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 print:max-w-none print:w-full print:border-none print:shadow-none print:rounded-none print:overflow-visible">
        
        {/* === HEADER BERSAMA === */}
        {(() => {
          const currentTab = ALL_TABS.find((t) => t.id === activeTab) || ALL_TABS[0];
          return (
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-4 sm:px-6 py-4 sm:py-5 border-b border-blue-700/50 print:hidden">
              {/* Ambient Glows */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 left-1/4 w-40 h-40 bg-indigo-400/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                {/* Brand, Subtitle & Active Tab Indicator */}
                <div className="flex items-center gap-3">
                  <div 
                    style={{
                      boxShadow: `0 4px 10px rgba(0,0,0,0.3), 0 2px 0 0 ${currentTab.shadowColor || '#1e3a8a'}`
                    }}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-b ${currentTab.gradient} border-t border-white/40 ring-2 ring-white/20 shrink-0 shadow-lg`}
                  >
                    <span className="filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] flex items-center justify-center">
                      {cloneElement(currentTab.icon as React.ReactElement<{ className?: string }>, {
                        className: "w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.2]"
                      })}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">SSES T2</h1>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {currentTab.label}
                      </span>
                    </div>
                    <p className="text-blue-200 text-xs sm:text-sm font-medium">WhatsApp Report Generator</p>
                  </div>
                </div>

                {/* Actions: Sparepart & Reset */}
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <a
                    href="https://masih-berapa.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka Inventaris & Manajemen Sparepart SSES T2"
                    className="group relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-300/80 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-400/40 active:scale-95"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-600 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-700"></span>
                    </span>
                    <Package className="w-4 h-4 text-slate-900 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Sparepart</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-900/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </a>

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isResetting}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 border ${
                      isResetting 
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-md' 
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm hover:shadow-sm active:scale-95'
                    }`}
                  >
                    {isResetting ? (
                      <><Check className="w-4 h-4 animate-pulse" /> Di-reset!</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 text-blue-200" /> Reset</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* === TAB NAVIGATION (SLIDABLE 8-TAB PAGES) === */}
        <div className="relative bg-slate-50 border-b border-slate-200 overflow-hidden select-none print:hidden">
          
          {/* Side Arrow Navigation Buttons */}
          {currentPage > 0 && (
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => prev - 1)}
              aria-label="Halaman Sebelumnya"
              className="absolute left-1 top-[42%] -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-blue-700 p-2 rounded-full shadow-lg border border-slate-300 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>
          )}

          {currentPage < TOTAL_PAGES - 1 && (
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              aria-label="Halaman Selanjutnya"
              className="absolute right-1 top-[42%] -translate-y-1/2 z-20 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center animate-pulse"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>
          )}

          {/* Swipe Container */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex w-[200%] transition-transform duration-300 ease-in-out cursor-grab active:cursor-grabbing"
            style={{ transform: `translateX(-${currentPage * 50}%)` }}
          >
            {/* Page 1 (First 8 Tabs) */}
            <div className="w-1/2 grid grid-cols-4">
              {ALL_TABS.slice(0, 8).map((tab, idx) => renderTabButton(tab, idx))}
            </div>

            {/* Page 2 (Remaining Tabs + Empty Padding Cells with Identical Dimensions) */}
            <div className="w-1/2 grid grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => {
                const tab = ALL_TABS[8 + idx];
                const isRightBorder = (idx + 1) % 4 !== 0;
                const isBottomBorder = idx < 4;

                if (!tab) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className={`min-h-[70px] sm:min-h-[78px] py-2 px-1 flex flex-col items-center justify-center gap-1.5 bg-slate-100/60 select-none ${
                        isRightBorder ? 'border-r border-slate-200' : ''
                      } ${isBottomBorder ? 'border-b border-slate-200' : ''}`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 opacity-0" aria-hidden="true" />
                      <span className="invisible text-[10px] sm:text-xs font-bold">Empty</span>
                    </div>
                  );
                }

                return renderTabButton(tab, idx);
              })}
            </div>
          </div>

          {/* Footer Page Indicators & Swipe Guidance */}
          <div className="bg-slate-100 px-3 py-1.5 flex items-center justify-between border-t border-slate-200 text-xs font-medium">
            <div className="flex items-center gap-1">
              {currentPage === 0 ? (
                <button 
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="text-[11px] text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Geser / Klik Halaman 2</span>
                  <ChevronRight className="w-3.5 h-3.5 inline animate-pulse" />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => setCurrentPage(0)}
                  className="text-[11px] text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 inline" />
                  <span>Kembali ke Halaman 1</span>
                </button>
              )}
            </div>

            {/* Dots indicator */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(0)}
                aria-label="Ke Halaman 1"
                className={`h-2.5 rounded-full transition-all ${
                  currentPage === 0 ? 'w-6 bg-blue-600 shadow-sm' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                aria-label="Ke Halaman 2"
                className={`h-2.5 rounded-full transition-all ${
                  currentPage === 1 ? 'w-6 bg-blue-600 shadow-sm' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
              <span className="text-[10px] text-slate-500 font-bold ml-1">
                {currentPage + 1}/2
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ====================== TAB CONTENTS ==================== */}
        {/* ======================================================== */}
        {activeTab === 'initial' && <TabInitialReport key={`initial-${tabResetKeys['initial'] || 0}`} />}
        {activeTab === 'perbaikan' && <TabPerbaikan key={`perbaikan-${tabResetKeys['perbaikan'] || 0}`} />}
        {activeTab === 'kehadiran' && <TabKehadiran key={`kehadiran-${tabResetKeys['kehadiran'] || 0}`} />}
        {activeTab === 'briefing' && <TabBriefing key={`briefing-${tabResetKeys['briefing'] || 0}`} />}
        {activeTab === 'storing' && <TabStoring key={`storing-${tabResetKeys['storing'] || 0}`} />}
        {activeTab === 'checklist' && <TabChecklist key={`checklist-${tabResetKeys['checklist'] || 0}`} />}
        {activeTab === 'kalibrasi' && <TabKalibrasi key={`kalibrasi-${tabResetKeys['kalibrasi'] || 0}`} />}
        {activeTab === 'report' && <TabShiftReport key={`report-${tabResetKeys['report'] || 0}`} />}
        {activeTab === 'tip' && <TabTip key={`tip-${tabResetKeys['tip'] || 0}`} />}
        {activeTab === 'data' && <TabData key={`data-${tabResetKeys['data'] || 0}`} />}
        {activeTab === 'kegiatan' && <TabKegiatan key={`kegiatan-${tabResetKeys['kegiatan'] || 0}`} />}
        {activeTab === 'ba_serah_terima' && <TabBASerahTerima key={`ba_serah_terima-${tabResetKeys['ba_serah_terima'] || 0}`} />}

      </div>
    </div>
  );
}