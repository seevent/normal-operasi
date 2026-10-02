import { create } from 'zustand';

/**
 * Nada pesan yang ditampilkan maskot. Menentukan warna balon dialog dan
 * seberapa lama pesan bertahan sebelum hilang sendiri.
 */
export type PetTone = 'info' | 'success' | 'warning' | 'error' | 'cheer';

export interface PetMessage {
  /** Dipakai sebagai key React agar balon beranimasi ulang tiap pesan baru. */
  id: number;
  text: string;
  tone: PetTone;
  /** 0 berarti pesan bertahan sampai ditutup manual. */
  durationMs: number;
}

const DEFAULT_DURATION_MS: Record<PetTone, number> = {
  info: 4500,
  success: 4000,
  cheer: 7000,
  warning: 7000,
  // Kegagalan tidak boleh hilang diam-diam sebelum sempat dibaca.
  error: 0,
};

interface AppState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCopied: boolean;
  setIsCopied: (val: boolean) => void;

  /**
   * Kanal tunggal pesan maskot. Service dan tab memanggil `sayPet`, maskot
   * hanya membaca state ini — sehingga maskot tidak perlu mengenal satu per
   * satu modul yang melaporkan sesuatu.
   */
  petMessage: PetMessage | null;
  sayPet: (text: string, tone?: PetTone, durationMs?: number) => void;
  clearPetMessage: () => void;

  /**
   * Tinggi (px) area di dasar layar yang sedang dipakai elemen lain, misalnya bilah
   * simpan yang menempel. Maskot bergeser ke atasnya agar tidak menelan ketukan pada
   * tombol di bawahnya, lalu kembali ke posisi pilihan pengguna setelah area itu bebas.
   */
  bottomInset: number;
  setBottomInset: (px: number) => void;
}

let petMessageCounter = 0;

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'initial',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isCopied: false,
  setIsCopied: (val) => set({ isCopied: val }),

  petMessage: null,
  sayPet: (text, tone = 'info', durationMs) =>
    set((state) => {
      // Kabar sukses simpan di latar belakang tidak boleh menimpa penyemangat yang sedang tampil.
      if (tone === 'success' && state.petMessage?.tone === 'cheer') return state;
      return {
        petMessage: {
          id: ++petMessageCounter,
          text,
          tone,
          durationMs: durationMs ?? DEFAULT_DURATION_MS[tone],
        },
      };
    }),
  clearPetMessage: () => set({ petMessage: null }),

  bottomInset: 0,
  setBottomInset: (px) => set({ bottomInset: Math.max(0, Math.round(px)) }),
}));

/**
 * Pintasan untuk memanggil maskot dari luar komponen React (service layer,
 * callback asinkron latar belakang, dan sejenisnya).
 */
export const sayPet = (text: string, tone?: PetTone, durationMs?: number) =>
  useAppStore.getState().sayPet(text, tone, durationMs);
