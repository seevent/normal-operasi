import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench, Users, Megaphone, CheckSquare, Settings, AlertTriangle,
  RefreshCw, Check, Database, FileText, Briefcase, FileWarning,
  Package, FileCheck, ShieldCheck
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
import { AntigravityPet } from './features/AntigravityPet';
import { useAppStore } from '../store/useAppStore';
import { useMasterDataStore } from '../store/useMasterDataStore';
import { useAuthStore } from '../store/useAuthStore';

interface TabItem {
  id: string;
  label: string;
  Icon: React.ElementType<{ className?: string }>;
}

const ALL_TABS: TabItem[] = [
  { id: 'kehadiran', label: 'Kehadiran', Icon: Users },
  { id: 'briefing', label: 'Briefing', Icon: Megaphone },
  { id: 'storing', label: 'Storing', Icon: MonitorSearchIcon },
  { id: 'checklist', label: 'Checklist', Icon: CheckSquare },
  { id: 'initial', label: 'Initial Report', Icon: FileWarning },
  { id: 'perbaikan', label: 'Perbaikan', Icon: Wrench },
  { id: 'kalibrasi', label: 'Kalibrasi', Icon: Settings },
  { id: 'kegiatan', label: 'Kegiatan', Icon: Briefcase },
  { id: 'ba_serah_terima', label: 'BA Serah Terima', Icon: FileCheck },
  { id: 'report', label: 'Report', Icon: FileText },
  { id: 'tip', label: 'TIP', Icon: AlertTriangle },
  { id: 'data', label: 'Data', Icon: Database },
];

const HEADER_BUTTON =
  'inline-flex items-center justify-center gap-2 h-11 min-w-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100';

export default function App() {
  const { activeTab, setActiveTab, setIsCopied } = useAppStore();
  const { initializeSupabaseData } = useMasterDataStore();
  const { initializeAuth } = useAuthStore();

  const [isResetting, setIsResetting] = useState(false);
  const [tabResetKeys, setTabResetKeys] = useState<Record<string, number>>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSupabaseData();
    initializeAuth();
  }, [initializeSupabaseData, initializeAuth]);

  // Jaga tab aktif tetap terlihat di bilah yang bisa digeser
  useEffect(() => {
    const bar = tabBarRef.current;
    const tab = tabRefs.current[activeTab];
    if (!bar || !tab) return;
    bar.scrollTo({ left: tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
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

  return (
    <div className="min-h-screen bg-canvas py-0 sm:py-6 sm:px-4 lg:py-8 lg:px-6 flex items-start justify-center font-sans relative print:min-h-0 print:bg-white print:p-0 print:m-0 print:block">

      <div className={`w-full bg-white sm:rounded-2xl sm:shadow-sm overflow-clip sm:border border-line print:max-w-none print:w-full print:border-none print:shadow-none print:rounded-none print:overflow-visible transition-all duration-300 ${activeTab === 'data' || activeTab === 'ba_serah_terima' ? 'max-w-6xl xl:max-w-7xl' : 'max-w-2xl'}`}>

        {/* === HEADER === */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-line print:hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">SSES T2</h1>
            <p className="text-xs sm:text-sm text-slate-500 truncate">Generator Laporan Operasional</p>
          </div>

          <a
            href="https://masih-berapa.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Inventaris & Manajemen Sparepart SSES T2"
            aria-label="Sparepart"
            className={HEADER_BUTTON}
          >
            <Package className="w-[18px] h-[18px] text-slate-500 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Sparepart</span>
          </a>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            aria-label="Reset form"
            className={`${HEADER_BUTTON} ${isResetting ? '!bg-emerald-50 !border-emerald-200 !text-emerald-700' : ''}`}
          >
            {isResetting ? (
              <><Check className="w-[18px] h-[18px] shrink-0" aria-hidden="true" /><span className="hidden sm:inline">Di-reset</span></>
            ) : (
              <><RefreshCw className="w-[18px] h-[18px] text-slate-500 shrink-0" aria-hidden="true" /><span className="hidden sm:inline">Reset</span></>
            )}
          </button>
        </header>

        {/* === NAVIGASI TAB === */}
        <nav aria-label="Menu laporan" className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-line print:hidden">
          <div ref={tabBarRef} className="tab-scroll relative flex gap-1 overflow-x-auto px-3 sm:px-4 py-2">
            {ALL_TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  ref={(el) => { tabRefs.current[id] = el; }}
                  type="button"
                  onClick={() => switchTab(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`shrink-0 inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

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

      {/* Floating Antigravity Pet (maskot mesin X-Ray) */}
      <AntigravityPet />
    </div>
  );
}