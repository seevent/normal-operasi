// src/components/shared/BottomNav.tsx
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Wrench, Users, Megaphone, Box, 
  CheckSquare, Settings, AlertTriangle, Camera as CameraIcon 
} from 'lucide-react';

type BottomNavProps = {
  switchTab: (tab: string) => void;
};

export const BottomNav: React.FC<BottomNavProps> = ({ switchTab }) => {
  const { activeTab } = useAppStore();

  return (
    <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200">
      <button 
        onClick={() => switchTab('perbaikan')} 
        className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${
          activeTab === 'perbaikan' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <Wrench className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Perbaikan</span>
      </button>
      <button 
        onClick={() => switchTab('kehadiran')} 
        className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${
          activeTab === 'kehadiran' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <Users className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Kehadiran</span>
      </button>
      <button 
        onClick={() => switchTab('briefing')} 
        className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-b border-slate-200 ${
          activeTab === 'briefing' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Briefing</span>
      </button>
      <button 
        onClick={() => switchTab('storing')} 
        className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-b border-slate-200 ${
          activeTab === 'storing' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <Box className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Storing</span>
      </button>
      
      <button 
        onClick={() => switchTab('checklist')} 
        className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${
          activeTab === 'checklist' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Checklist</span>
      </button>
      <button 
        onClick={() => switchTab('kalibrasi')} 
        className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${
          activeTab === 'kalibrasi' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <Settings className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Kalibrasi</span>
      </button>
      <button 
        onClick={() => switchTab('tip')} 
        className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all border-r border-slate-200 ${
          activeTab === 'tip' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">TIP</span>
      </button>
      <button 
        onClick={() => switchTab('cam')} 
        className={`py-3 px-1 text-[10px] sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
          activeTab === 'cam' ? 'shadow-[inset_0_-3px_0_0_#2563eb] text-blue-700 bg-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate w-full text-center">Cam</span>
      </button>
    </div>
  );
};
