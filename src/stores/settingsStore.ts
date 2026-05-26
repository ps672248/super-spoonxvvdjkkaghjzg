import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getUserConfig, saveUserConfig, updateSingleField } from '@/services/userService';
import { auth } from '@/config/firebase';

const KEYS = {
  API_KEY:          'psuplus_gemini_key',
  MODEL:            'psuplus_gemini_model',
  ONBOARDED:        'psuplus_onboarded',
  FULL_NAME:        'psuplus_full_name',
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
  { id: 'gemini-3.1-pro-preview',       label: '💎 Gemini 3.1 Pro',       tier: 'stable',  desc: 'Highest accuracy for complex technical topics' },
  { id: 'gemini-3.1-flash-lite-preview',label: '✨ Gemini 3.1 Flash Lite', tier: 'stable',  desc: 'Ultra-fast and efficient generation' },
  { id: 'gemini-3-flash-preview',      label: '🚀 Gemini 3 Flash',        tier: 'preview', desc: 'Latest flagship preview performance' },
  { id: 'gemini-2.5-pro',              label: '💎 Gemini 2.5 Pro',       tier: 'stable',  desc: 'Proven technical intelligence' },
  { id: 'gemini-2.5-flash',            label: '⚡ Gemini 2.5 Flash',     tier: 'stable',  desc: 'Balanced speed and logic (Default)' },
  { id: 'gemini-2.5-flash-lite',       label: '⚡ Gemini 2.5 Flash Lite',tier: 'stable',  desc: 'Lightweight performance' },
  { id: 'gemini-2-flash-preview',      label: '🔥 Gemini 2 Flash',       tier: 'preview', desc: 'Experimental low-latency model' },
  { id: 'gemini-2-flash-lite-preview', label: '🔥 Gemini 2 Flash Lite',  tier: 'preview', desc: 'Experimental efficiency' },
];

const DEFAULT_MODEL = 'gemini-2.5-flash';

interface SettingsState {
  geminiApiKey: string;
  geminiModel: string;
  fullName: string;
  userIntroduction: string;
  primaryBranchId: string;
  targetPsuId: string;
  isOnboarded: boolean;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setModel: (modelId: string) => Promise<void>;
  setFullName: (name: string) => Promise<void>;
  setUserIntroduction: (intro: string) => Promise<void>;
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
  primaryBranchId: '',
  targetPsuId: '',
  isOnboarded: false,
  isLoaded: false,

  loadSettings: async () => {
    const [localApiKey, localModel, localOnboarded, localName, localBranch, localPsu, localIntro, localVer] = await Promise.all([
      SecureStore.getItemAsync(KEYS.API_KEY),
      AsyncStorage.getItem(KEYS.MODEL),
      AsyncStorage.getItem(KEYS.ONBOARDED),
      AsyncStorage.getItem(KEYS.FULL_NAME),
      AsyncStorage.getItem(KEYS.PRIMARY_BRANCH),
      AsyncStorage.getItem(KEYS.TARGET_PSU),
      AsyncStorage.getItem(KEYS.USER_INTRO),
      getLocalVersion(),
    ]);

    let finalApiKey    = localApiKey ?? '';
    let finalModel     = localModel ?? DEFAULT_MODEL;
    let finalName      = localName ?? 'Future Officer';
    let finalOnboarded = localOnboarded === 'true';
    let finalBranch    = localBranch ?? '';
    let finalPsu       = localPsu ?? '';
    let finalIntro     = localIntro ?? '';

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

            await Promise.all([
              AsyncStorage.setItem(KEYS.MODEL,            finalModel),
              AsyncStorage.setItem(KEYS.FULL_NAME,        finalName),
              AsyncStorage.setItem(KEYS.ONBOARDED,        String(finalOnboarded)),
              AsyncStorage.setItem(KEYS.PRIMARY_BRANCH,   finalBranch),
              AsyncStorage.setItem(KEYS.TARGET_PSU,       finalPsu),
              AsyncStorage.setItem(KEYS.USER_INTRO,       finalIntro),
              AsyncStorage.setItem(KEYS.SETTINGS_VERSION, String(cloudVer)),
            ]);
          } else if (localVer > cloudVer) {
            // ── Local is newer (offline edits) → push local up to cloud ──
            await saveUserConfig(user.uid, {
              geminiModel:      finalModel,
              fullName:         finalName,
              isOnboarded:      finalOnboarded,
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
      isOnboarded:      finalOnboarded,
      primaryBranchId:  finalBranch,
      targetPsuId:      finalPsu,
      isLoaded:         true,
    });
  },

  setApiKey: async (key) => {
    // Save ONLY to local SecureStore
    await SecureStore.setItemAsync(KEYS.API_KEY, key);
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
    await SecureStore.deleteItemAsync(KEYS.API_KEY);
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
      primaryBranchId:  state.primaryBranchId,
      targetPsuId:      state.targetPsuId,
      settingsVersion:  localVer,
    });
  },
}));
