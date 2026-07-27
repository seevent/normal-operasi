import { useState, useEffect } from 'react';
import { 
  Wrench, Users, Megaphone, CheckSquare, Settings, AlertTriangle, 
  RefreshCw, Check, Database, CheckCircle, FileText, Briefcase, FileWarning,
  ChevronLeft, ChevronRight, Package, ExternalLink
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
import { useAppStore } from '../store/useAppStore';
import { useMasterDataStore } from '../store/useMasterDataStore';
import { useAuthStore } from '../store/useAuthStore';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const ALL_TABS: TabItem[] = [
  { id: 'kehadiran', label: 'Kehadiran', icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'briefing', label: 'Briefing', icon: <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'storing', label: 'Storing', icon: <MonitorSearchIcon className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'checklist', label: 'Checklist', icon: <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'initial', label: 'Initial Report', icon: <FileWarning className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'perbaikan', label: 'Perbaikan', icon: <Wrench className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'kalibrasi', label: 'Kalibrasi', icon: <Settings className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'kegiatan', label: 'Kegiatan', icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'report', label: 'Report', icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'tip', label: 'TIP', icon: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" /> },
  { id: 'data', label: 'Data', icon: <Database className="w-5 h-5 sm:w-6 sm:h-6" /> },
];

const ITEMS_PER_PAGE = 8;
const TOTAL_PAGES = Math.ceil(ALL_TABS.length / ITEMS_PER_PAGE);

export default function App() {
  const { activeTab, setActiveTab, setIsCopied } = useAppStore();
  const { initializeSupabaseData } = useMasterDataStore();
  const { initializeAuth } = useAuthStore();

  const [isResetting, setIsResetting] = useState(false);
  const [showGsheetNotif] = useState(false);
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

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 flex items-center justify-center font-sans relative">
      {/* Notifikasi Top Dropdown Google Sheets */}
      <div className={`fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none transition-all duration-500 ease-out ${showGsheetNotif ? 'translate-y-6 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3">
          <CheckCircle className="w-6 h-6 animate-pulse" /> 
          Laporan Terkirim ke Google Sheets
        </div>
      </div>

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* === HEADER BERSAMA === */}
        <div className="bg-blue-800 px-6 py-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeTab === 'initial' ? <FileWarning className="text-white w-7 h-7" /> :
               activeTab === 'perbaikan' ? <Wrench className="text-white w-7 h-7" /> : 
               activeTab === 'kehadiran' ? <Users className="text-white w-7 h-7" /> : 
               activeTab === 'briefing' ? <Megaphone className="text-white w-7 h-7" /> : 
               activeTab === 'storing' ? <MonitorSearchIcon className="text-white w-7 h-7" /> : 
               activeTab === 'checklist' ? <CheckSquare className="text-white w-7 h-7" /> : 
               activeTab === 'report' ? <FileText className="text-white w-7 h-7" /> : 
               activeTab === 'tip' ? <AlertTriangle className="text-white w-7 h-7" /> : 
               activeTab === 'data' ? <Database className="text-white w-7 h-7" /> : 
               activeTab === 'kegiatan' ? <Briefcase className="text-white w-7 h-7" /> : 
               <Settings className="text-white w-7 h-7" />}
              <div>
                <h1 className="text-xl font-bold text-white">Laporan SSES T2</h1>
                <p className="text-blue-200 text-sm">Otomatisasi Kirim ke WhatsApp</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  isResetting ? 'bg-emerald-500 text-white shadow-md' : 'bg-blue-700 text-blue-100 hover:bg-blue-600 hover:text-white'
                }`}
              >
                {isResetting ? <><Check className="w-4 h-4 animate-pulse" /> Di-reset!</> : <><RefreshCw className="w-4 h-4" /> Reset</>}
              </button>
            </div>
          </div>
        </div>

        {/* === TAB NAVIGATION (SLIDABLE 8-TAB PAGES) === */}
        <div className="relative bg-slate-50 border-b border-slate-200 overflow-hidden select-none">
          
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
              {ALL_TABS.slice(0, 8).map((tab, idx) => {
                const isActive = activeTab === tab.id;
                const isRightBorder = (idx + 1) % 4 !== 0;
                const isBottomBorder = idx < 4;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchTab(tab.id)}
                    className={`min-h-[68px] sm:min-h-[76px] py-2 px-1 text-[10px] sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isRightBorder ? 'border-r border-slate-200' : ''
                    } ${
                      isBottomBorder ? 'border-b border-slate-200' : ''
                    } ${
                      isActive
                        ? 'bg-blue-700 text-white font-extrabold shadow-inner shadow-blue-950/30 border-b-4 border-amber-400 relative z-10'
                        : 'bg-slate-100 text-slate-500 font-semibold hover:bg-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {tab.icon}
                    <span className="truncate w-full text-center">{tab.label}</span>
                  </button>
                );
              })}
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
                      className={`min-h-[68px] sm:min-h-[76px] py-2 px-1 flex flex-col items-center justify-center gap-1.5 bg-slate-100/60 select-none ${
                        isRightBorder ? 'border-r border-slate-200' : ''
                      } ${isBottomBorder ? 'border-b border-slate-200' : ''}`}
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6 opacity-0" aria-hidden="true" />
                      <span className="invisible text-[10px] sm:text-sm font-bold">Empty</span>
                    </div>
                  );
                }

                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchTab(tab.id)}
                    className={`min-h-[68px] sm:min-h-[76px] py-2 px-1 text-[10px] sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isRightBorder ? 'border-r border-slate-200' : ''
                    } ${
                      isBottomBorder ? 'border-b border-slate-200' : ''
                    } ${
                      isActive
                        ? 'bg-blue-700 text-white font-extrabold shadow-inner shadow-blue-950/30 border-b-4 border-amber-400 relative z-10'
                        : 'bg-slate-100 text-slate-500 font-semibold hover:bg-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {tab.icon}
                    <span className="truncate w-full text-center">{tab.label}</span>
                  </button>
                );
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

      </div>
    </div>
  );
}