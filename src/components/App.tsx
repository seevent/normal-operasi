import { useState, useEffect } from 'react';
import { 
  Wrench, Users, Megaphone, CheckSquare, Settings, AlertTriangle, 
  RefreshCw, Check, Database, CheckCircle, FileText, MoreHorizontal, Briefcase, FileWarning
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


export default function App() {
  const { activeTab, setActiveTab } = useAppStore();
  const { initializeSupabaseData } = useMasterDataStore();
  const { initializeAuth } = useAuthStore();

  const [isResetting, setIsResetting] = useState(false);
  const [showGsheetNotif] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    initializeSupabaseData();
    initializeAuth();
  }, [initializeSupabaseData, initializeAuth]);

  // Expose this so child tabs can trigger notifications if needed
  // Alternatively, we could move showGsheetNotif into AppContext, but we'll leave it local to App if unused.

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    // We trigger a page reload since a hard reset was standard previously.
    // In a fully modular app, you could clear local state.
    setIsResetting(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
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

        {/* === TAB NAVIGATION === */}
        <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200">
          <button onClick={() => switchTab('kehadiran')} className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${activeTab === 'kehadiran' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
            <Users className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Kehadiran</span>
          </button>
          <button onClick={() => switchTab('briefing')} className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${activeTab === 'briefing' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Briefing</span>
          </button>
          <button onClick={() => switchTab('storing')} className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${activeTab === 'storing' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
            <MonitorSearchIcon className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Storing</span>
          </button>
          <button onClick={() => switchTab('checklist')} className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-b border-slate-200 ${activeTab === 'checklist' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
            <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Checklist</span>
          </button>
          
          <button onClick={() => switchTab('initial')} className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${activeTab === 'initial' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
            <FileWarning className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Initial Report</span>
          </button>
          <button onClick={() => switchTab('perbaikan')} className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${activeTab === 'perbaikan' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
            <Wrench className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Perbaikan</span>
          </button>
          <button onClick={() => switchTab('kalibrasi')} className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${activeTab === 'kalibrasi' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Kalibrasi</span>
          </button>
          <div className="relative flex">
            <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`w-full py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${(activeTab === 'kegiatan' || activeTab === 'tip' || activeTab === 'data' || activeTab === 'report' || showMoreMenu) ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
              <MoreHorizontal className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">More</span>
            </button>
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)}></div>
                <div className="absolute top-full right-0 mt-1 w-36 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <button onClick={() => switchTab('kegiatan')} className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${activeTab === 'kegiatan' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-700 font-medium'}`}>
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" /> Kegiatan
                  </button>
                  <button onClick={() => switchTab('report')} className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${activeTab === 'report' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-700 font-medium'}`}>
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> Report
                  </button>
                  <button onClick={() => switchTab('tip')} className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${activeTab === 'tip' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-700 font-medium'}`}>
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> TIP
                  </button>
                  <button onClick={() => switchTab('data')} className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${activeTab === 'data' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-700 font-medium'}`}>
                    <Database className="w-4 h-4 sm:w-5 sm:h-5" /> Data
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* ====================== TAB CONTENTS ==================== */}
        {/* ======================================================== */}
        {activeTab === 'initial' && <TabInitialReport />}
        {activeTab === 'perbaikan' && <TabPerbaikan />}
        {activeTab === 'kehadiran' && <TabKehadiran />}
        {activeTab === 'briefing' && <TabBriefing />}
        {activeTab === 'storing' && <TabStoring />}
        {activeTab === 'checklist' && <TabChecklist />}
        {activeTab === 'kalibrasi' && <TabKalibrasi />}
        {activeTab === 'report' && <TabShiftReport />}
        {activeTab === 'tip' && <TabTip />}
        {activeTab === 'data' && <TabData />}
        {activeTab === 'kegiatan' && <TabKegiatan />}

      </div>
    </div>
  );
}