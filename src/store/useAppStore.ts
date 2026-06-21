import { create } from 'zustand';

interface AppState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCopied: boolean;
  setIsCopied: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'perbaikan',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isCopied: false,
  setIsCopied: (val) => set({ isCopied: val }),
}));
