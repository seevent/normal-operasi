import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isInitialized: boolean;
  isLoginModalOpen: boolean;
  setUser: (user: User | null) => void;
  setLoginModalOpen: (isOpen: boolean) => void;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,
  isLoginModalOpen: false,

  setUser: (user) => set({ user }),
  setLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }),

  initializeAuth: async () => {
    // Ambil sesi user saat ini saat pertama kali aplikasi dimuat
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user || null, isInitialized: true });

    // Dengarkan perubahan status login (jika user login/logout di tab lain)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user || null });
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));
