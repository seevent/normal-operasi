// src/components/shared/Header.tsx
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Wrench, ClipboardList, Megaphone, Box, 
  CheckSquare, AlertTriangle, Settings, RefreshCw, Check 
} from 'lucide-react';

type HeaderProps = {
  isResetting: boolean;
  handleReset: () => void;
};

export const Header: React.FC<HeaderProps> = ({ isResetting, handleReset }) => {
  const { activeTab } = useAppStore();

  return (
    <div className="bg-blue-800 px-6 py-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeTab === 'perbaikan' ? <Wrench className="text-white w-7 h-7" /> : 
           activeTab === 'kehadiran' ? <ClipboardList className="text-white w-7 h-7" /> : 
           activeTab === 'briefing' ? <Megaphone className="text-white w-7 h-7" /> : 
           activeTab === 'storing' ? <Box className="text-white w-7 h-7" /> : 
           activeTab === 'checklist' ? <CheckSquare className="text-white w-7 h-7" /> : 
           activeTab === 'tip' ? <AlertTriangle className="text-white w-7 h-7" /> : 
           <Settings className="text-white w-7 h-7" />}
          <div>
            <h1 className="text-xl font-bold text-white">Laporan SSES T2</h1>
            <p className="text-blue-200 text-sm">Otomatisasi Kirim ke WhatsApp</p>
          </div>
        </div>
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
  );
};
