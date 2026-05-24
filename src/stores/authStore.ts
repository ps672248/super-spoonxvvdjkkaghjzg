import { create } from 'zustand';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useSettingsStore } from './settingsStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  initialize: () => void;
  signInWithGoogle: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  initialized: false,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  initialize: () => {
    onAuthStateChanged(auth, async (user) => {
      set({ user, isLoading: false, initialized: true });
      if (user) {
        // Fetch cloud settings upon successful login
        await useSettingsStore.getState().loadSettings();
      }
    });
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
