import { create } from 'zustand';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useSettingsStore } from './settingsStore';
import { useBookmarkStore } from './bookmarkStore';
import { useActivityStore } from './activityStore';

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
        // Load cloud settings
        await useSettingsStore.getState().loadSettings();

        // Seed fullName from Firebase Auth displayName if not set in cloud
        const { fullName, setFullName } = useSettingsStore.getState();
        if (user.displayName && (!fullName || fullName === 'Future Officer')) {
          await setFullName(user.displayName);
        }

        // Merge local + Firestore bookmarks
        await useBookmarkStore.getState().loadBookmarks();

        // Merge local + Firestore activity sessions
        await useActivityStore.getState().loadSessions();
      }
    });
  },

  signInWithGoogle: async () => {
    // Google Sign-In requires an EAS dev client or production build (native module).
    // Not available in Expo Go — caller should show an alert.
    throw new Error('Google Sign-In requires an EAS build. Use email/password login instead.');
  },
}));
