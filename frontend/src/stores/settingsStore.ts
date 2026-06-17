import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getUserConfig, saveUserConfig, updateSingleField } from '@/services/userService';
import { auth } from '@/config/firebase';
import { DEFAULT_CATEGORY_ID } from '@/config/categories';

// SecureStore not available on web — fall back to AsyncStorage (localStorage on web)
const secureGet = (key: string) =>
  Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
const secureSet = (key: string, value: string) =>
  Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
const secureDelete = (key: string) =>
  Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);

const KEYS = {
  API_KEY:          'psuplus_gemini_key',
  MODEL:            'psuplus_gemini_model',
  ONBOARDED:        'psuplus_onboarded',
  FULL_NAME:        'psuplus_full_name',
  CATEGORY:         'psuplus_category',
  PRIMARY_BRANCH:   'psuplus_primary_branch',
  TARGET_PSU:       'psuplus_target_psu',
  USER_INTRO:       'psuplus_user_intro',
  /** Monotonically incrementing integer. Bumped on every synced write. */
  SETTINGS_VERSION: 'psuplus_settings_version',
};

/** Read local version (0 if never set). */
async function getLocalVersion(): Promise<number> {
  const v = await AsyncStorage.getItem(KEYS.SETTINGS_VERSION);
  return v ? parseInt(v, 10) : 0;
}

/** Increment and persist local version; return new value. */
async function bumpLocalVersion(): Promise<number> {
  const next = (await getLocalVersion()) + 1;
  await AsyncStorage.setItem(KEYS.SETTINGS_VERSION, String(next));
  return next;
}

export const GEMINI_MODELS = [
  // ── Gemini 3.x (latest generation) ───────────────────────────────────────
  { id: 'gemini-3.5-flash',                 label: '🚀 Gemini 3.5 Flash',       tier: 'stable',  desc: 'Latest frontier model — highest capability' },
  { id: 'gemini-3.1-flash-lite',            label: '🪶 Gemini 3.1 Flash Lite',  tier: 'stable',  desc: 'Latest lightweight — lowest quota usage', maxUsage: true },
  { id: 'gemini-3.1-pro-preview',           label: '💎 Gemini 3.1 Pro',         tier: 'preview', desc: 'Advanced reasoning — preview', requiresPaid: true },
  // ── Gemini 2.5 (previous stable generation) ──────────────────────────────
  { id: 'gemini-2.5-pro',                   label: '💎 Gemini 2.5 Pro',         tier: 'stable',  desc: 'Deep reasoning — proven stability', requiresPaid: true },
  { id: 'gemini-2.5-flash',                 label: '⚡ Gemini 2.5 Flash',       tier: 'stable',  desc: 'Balanced speed and quality (Recommended)' },
  { id: 'gemini-2.5-flash-lite',            label: '⚡ Gemini 2.5 Flash Lite',  tier: 'stable',  desc: 'Budget-friendly, fast generation' },
  // ── Gemma 4 open-source (via Gemini API) ─────────────────────────────────
  { id: 'gemma-4-31b-it',                   label: '🟢 Gemma 4 31B',            tier: 'open',    desc: 'Open source — large, highly capable',          comingSoon: true },
  { id: 'gemma-4-26b-a4b-it',               label: '🟢 Gemma 4 26B (MoE)',      tier: 'open',    desc: 'Open source — mixture of experts, efficient',  comingSoon: true },
];

const DEFAULT_MODEL = 'gemini-2.5-flash';

interface SettingsState {
  geminiApiKey: string;
  geminiModel: string;
  fullName: string;
  userIntroduction: string;
  categoryId: string;
  primaryBranchId: string;
  targetPsuId: string;
  isOnboarded: boolean;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setModel: (modelId: string) => Promise<void>;
  setFullName: (name: string) => Promise<void>;
  setUserIntroduction: (intro: string) => Promise<void>;
  setCategory: (categoryId: string) => Promise<void>;
  setPrimaryBranch: (branchId: string) => Promise<void>;
  setTargetPsu: (psuId: string) => Promise<void>;
  setOnboarded: () => Promise<void>;
  clearApiKey: () => Promise<void>;
  syncWithFirebase: (uid: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  geminiApiKey: '',
  geminiModel: DEFAULT_MODEL,
  fullName: 'Future Officer',
  userIntroduction: '',
  categoryId: DEFAULT_CATEGORY_ID,
  primaryBranchId: '',
  targetPsuId: '',
  isOnboarded: false,
  isLoaded: false,

  loadSettings: async () => {
    const [localApiKey, localModel, localOnboarded, localName, localBranch, localPsu, localIntro, localCategory, localVer] = await Promise.all([
      secureGet(KEYS.API_KEY),
      AsyncStorage.getItem(KEYS.MODEL),
      AsyncStorage.getItem(KEYS.ONBOARDED),
      AsyncStorage.getItem(KEYS.FULL_NAME),
      AsyncStorage.getItem(KEYS.PRIMARY_BRANCH),
      AsyncStorage.getItem(KEYS.TARGET_PSU),
      AsyncStorage.getItem(KEYS.USER_INTRO),
      AsyncStorage.getItem(KEYS.CATEGORY),
      getLocalVersion(),
    ]);

    let finalApiKey    = localApiKey ?? '';
    let finalModel     = localModel ?? DEFAULT_MODEL;
    let finalName      = localName ?? 'Future Officer';
    let finalOnboarded = localOnboarded === 'true';
    let finalBranch    = localBranch ?? '';
    let finalPsu       = localPsu ?? '';
    let finalIntro     = localIntro ?? '';
    let finalCategory  = localCategory ?? DEFAULT_CATEGORY_ID;

    const user = auth.currentUser;
    if (user) {
      try {
        const cloudConfig = await getUserConfig(user.uid);
        if (cloudConfig) {
          const cloudVer = cloudConfig.settingsVersion ?? 0;

          if (cloudVer > localVer) {
            // ── Cloud is newer → trust cloud, overwrite local ──
            finalModel     = cloudConfig.geminiModel     ?? finalModel;
            finalName      = cloudConfig.fullName        ?? finalName;
            finalOnboarded = cloudConfig.isOnboarded     ?? finalOnboarded;
            finalBranch    = cloudConfig.primaryBranchId ?? finalBranch;
            finalPsu       = cloudConfig.targetPsuId     ?? finalPsu;
            finalIntro     = cloudConfig.userIntroduction ?? finalIntro;
            finalCategory  = cloudConfig.categoryId      ?? finalCategory;

            await Promise.all([
              AsyncStorage.setItem(KEYS.MODEL,            finalModel),
              AsyncStorage.setItem(KEYS.FULL_NAME,        finalName),
              AsyncStorage.setItem(KEYS.ONBOARDED,        String(finalOnboarded)),
              AsyncStorage.setItem(KEYS.PRIMARY_BRANCH,   finalBranch),
              AsyncStorage.setItem(KEYS.TARGET_PSU,       finalPsu),
              AsyncStorage.setItem(KEYS.USER_INTRO,       finalIntro),
              AsyncStorage.setItem(KEYS.CATEGORY,         finalCategory),
              AsyncStorage.setItem(KEYS.SETTINGS_VERSION, String(cloudVer)),
            ]);
          } else if (localVer > cloudVer) {
            // ── Local is newer (offline edits) → push local up to cloud ──
            await saveUserConfig(user.uid, {
              geminiModel:      finalModel,
              fullName:         finalName,
              isOnboarded:      finalOnboarded,
              categoryId:       finalCategory,
              primaryBranchId:  finalBranch,
              targetPsuId:      finalPsu,
              userIntroduction: finalIntro,
              settingsVersion:  localVer,
            });
          }
          // equal version → no conflict, nothing to do
        }
      } catch (e) {
        // Cloud unreachable — continue with local values
        console.warn('[Settings] Cloud sync skipped:', e);
      }
    }

    set({
      geminiApiKey:     finalApiKey,
      geminiModel:      finalModel,
      fullName:         finalName,
      userIntroduction: finalIntro,
      categoryId:       finalCategory,
      isOnboarded:      finalOnboarded,
      primaryBranchId:  finalBranch,
      targetPsuId:      finalPsu,
      isLoaded:         true,
    });
  },

  setApiKey: async (key) => {
    // Save ONLY to local SecureStore
    await secureSet(KEYS.API_KEY, key);
    set({ geminiApiKey: key });
  },

  setModel: async (modelId) => {
    const v = await bumpLocalVersion();
    await AsyncStorage.setItem(KEYS.MODEL, modelId);
    const user = auth.currentUser;
    if (user) {
      await updateSingleField(user.uid, 'geminiModel', modelId);
      await updateSingleField(user.uid, 'settingsVersion', v);
    }
    set({ geminiModel: modelId });
  },

  setFullName: async (name) => {
    const v = await bumpLocalVersion();
    await AsyncStorage.setItem(KEYS.FULL_NAME, name);
    const user = auth.currentUser;
    if (user) {
      await updateSingleField(user.uid, 'fullName', name);
      await updateSingleField(user.uid, 'settingsVersion', v);
    }
    set({ fullName: name });
  },

  setUserIntroduction: async (intro) => {
    const v = await bumpLocalVersion();
    await AsyncStorage.setItem(KEYS.USER_INTRO, intro);
    const user = auth.currentUser;
    if (user) {
      await updateSingleField(user.uid, 'userIntroduction', intro);
      await updateSingleField(user.uid, 'settingsVersion', v);
    }
    set({ userIntroduction: intro });
  },

  setCategory: async (categoryId) => {
    const v = await bumpLocalVersion();
    await AsyncStorage.setItem(KEYS.CATEGORY, categoryId);
    const user = auth.currentUser;
    if (user) {
      await updateSingleField(user.uid, 'categoryId', categoryId);
      await updateSingleField(user.uid, 'settingsVersion', v);
    }
    set({ categoryId });
  },

  setPrimaryBranch: async (branchId) => {
    const v = await bumpLocalVersion();
    await AsyncStorage.setItem(KEYS.PRIMARY_BRANCH, branchId);
    const user = auth.currentUser;
    if (user) {
      await updateSingleField(user.uid, 'primaryBranchId', branchId);
      await updateSingleField(user.uid, 'settingsVersion', v);
    }
    set({ primaryBranchId: branchId });
  },

  setTargetPsu: async (psuId) => {
    const v = await bumpLocalVersion();
    await AsyncStorage.setItem(KEYS.TARGET_PSU, psuId);
    const user = auth.currentUser;
    if (user) {
      await updateSingleField(user.uid, 'targetPsuId', psuId);
      await updateSingleField(user.uid, 'settingsVersion', v);
    }
    set({ targetPsuId: psuId });
  },

  setOnboarded: async () => {
    const v = await bumpLocalVersion();
    await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
    const user = auth.currentUser;
    if (user) {
      await updateSingleField(user.uid, 'isOnboarded', true);
      await updateSingleField(user.uid, 'settingsVersion', v);
    }
    set({ isOnboarded: true });
  },

  clearApiKey: async () => {
    await secureDelete(KEYS.API_KEY);
    set({ geminiApiKey: '' });
  },

  syncWithFirebase: async (uid: string) => {
    const state = useSettingsStore.getState();
    const localVer = await getLocalVersion();
    await saveUserConfig(uid, {
      fullName:         state.fullName,
      userIntroduction: state.userIntroduction,
      // geminiApiKey: state.geminiApiKey, // EXCLUDED for privacy
      geminiModel:      state.geminiModel,
      isOnboarded:      state.isOnboarded,
      categoryId:       state.categoryId,
      primaryBranchId:  state.primaryBranchId,
      targetPsuId:      state.targetPsuId,
      settingsVersion:  localVer,
    });
  },
}));
