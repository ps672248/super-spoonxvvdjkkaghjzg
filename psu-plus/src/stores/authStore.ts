import { create } from 'zustand';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { auth } from '@/config/firebase';
import { useConfirmStore } from './confirmStore';
import { useSettingsStore } from './settingsStore';
import { useBookmarkStore } from './bookmarkStore';
import { useActivityStore } from './activityStore';
import { useSeenQuestionsStore } from './seenQuestionsStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  initialize: () => void;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  initialized: false,
  setUser:    (user)      => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  initialize: () => {
    // undefined = not yet observed; null = confirmed signed-out
    let prevUid: string | null | undefined = undefined;

    onAuthStateChanged(auth, async (user) => {
      const isNewLogin = prevUid === null && user !== null;
      prevUid = user ? user.uid : null;

      set({ user, isLoading: false, initialized: true });

      // ── Signed out ─────────────────────────────────────────────────────────
      if (!user) {
        useBookmarkStore.setState({ bookmarks: [], questionBookmarks: [], isLoaded: false });
        useActivityStore.setState({ sessions: [], interviewSessions: [], isLoaded: false });
        // Load guest-scoped local data so guest mode works
        await Promise.all([
          useBookmarkStore.getState().loadBookmarks(),
          useActivityStore.getState().loadSessions(),
        ]);
        return;
      }

      // ── Signed in ──────────────────────────────────────────────────────────
      await useSettingsStore.getState().loadSettings();
      const { fullName, setFullName } = useSettingsStore.getState();
      if (user.displayName && (!fullName || fullName === 'Future Officer')) {
        await setFullName(user.displayName);
      }

      // ── Guest migration (only on a genuine new login, not app restart) ─────
      if (isNewLogin) {
        const [guestBooks, guestActivity] = await Promise.all([
          useBookmarkStore.getState().hasGuestData(),
          useActivityStore.getState().hasGuestData(),
        ]);

        if (guestBooks || guestActivity) {
          const [cloudBooks, cloudActivity] = await Promise.all([
            useBookmarkStore.getState().hasCloudData(user.uid),
            useActivityStore.getState().hasCloudData(user.uid),
          ]);

          const hasConflict = cloudBooks || cloudActivity;

          // Only prompt when both sides have data; otherwise auto-merge
          const shouldMerge = hasConflict
            ? await useConfirmStore.getState().show({
                title: 'Merge Offline Progress?',
                message:
                  'You have offline data from before signing in. ' +
                  'Merge it into your account, or discard it and use your saved cloud data?',
                confirmText: 'Merge',
                cancelText:  'Discard (use cloud data)',
              })
            : true;

          if (shouldMerge) {
            await Promise.all([
              useBookmarkStore.getState().mergeGuestIntoUser(user.uid),
              useActivityStore.getState().mergeGuestIntoUser(user.uid),
            ]);
          } else {
            await Promise.all([
              useBookmarkStore.getState().discardGuestData(),
              useActivityStore.getState().discardGuestData(),
            ]);
          }
        }
      }

      // ── Load uid-scoped data (local cache + cloud merge) ───────────────────
      await Promise.all([
        useBookmarkStore.getState().loadBookmarks(),
        useActivityStore.getState().loadSessions(),
      ]);
    });
  },

  signOut: async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await Promise.all([
        AsyncStorage.multiRemove([
          // uid-scoped data
          `psuplus_bookmarks_${uid}`,
          `psuplus_bookmarks_q_${uid}`,
          `psuplus_activity_${uid}`,
          `psuplus_activity_interview_${uid}`,
          // global settings — clear all to prevent User A contaminating User B
          'psuplus_full_name',
          'psuplus_primary_branch',
          'psuplus_target_psu',
          'psuplus_user_intro',
          'psuplus_gemini_model',
          'psuplus_settings_version',
          'psuplus_onboarded',
          // seen questions
          'psuplus_seen_qs',
        ]),
        // API key — SecureStore on native, AsyncStorage on web
        (Platform.OS === 'web'
          ? AsyncStorage.removeItem('psuplus_gemini_key')
          : SecureStore.deleteItemAsync('psuplus_gemini_key')
        ).catch(() => {}),
      ]);
    }
    // Reset all in-memory state to defaults before Firebase signOut
    useSettingsStore.setState({
      geminiApiKey: '',
      fullName: 'Future Officer',
      primaryBranchId: '',
      targetPsuId: '',
      userIntroduction: '',
      geminiModel: 'gemini-2.5-flash',
      isOnboarded: false,
      isLoaded: false,
    });
    useSeenQuestionsStore.setState({ seen: {}, isLoaded: false });
    await firebaseSignOut(auth);
  },

  signInWithGoogle: async () => {
    throw new Error('Google Sign-In requires an EAS build. Use email/password login instead.');
  },
}));
