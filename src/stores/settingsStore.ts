import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getUserConfig, saveUserConfig, updateSingleField } from '@/services/userService';
import { auth } from '@/config/firebase';

const KEYS = {
  API_KEY: 'psuplus_gemini_key',
  MODEL:   'psuplus_gemini_model',
  ONBOARDED: 'psuplus_onboarded',
  FULL_NAME: 'psuplus_full_name',
  PRIMARY_BRANCH: 'psuplus_primary_branch',
  TARGET_PSU: 'psuplus_target_psu',
};

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
  primaryBranchId: string;
  targetPsuId: string;
  isOnboarded: boolean;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setModel: (modelId: string) => Promise<void>;
  setFullName: (name: string) => Promise<void>;
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
  primaryBranchId: '',
  targetPsuId: '',
  isOnboarded: false,
  isLoaded: false,

  loadSettings: async () => {
    const [localApiKey, localModel, localOnboarded, localName, localBranch, localPsu] = await Promise.all([
      SecureStore.getItemAsync(KEYS.API_KEY),
      AsyncStorage.getItem(KEYS.MODEL),
      AsyncStorage.getItem(KEYS.ONBOARDED),
      AsyncStorage.getItem(KEYS.FULL_NAME),
      AsyncStorage.getItem(KEYS.PRIMARY_BRANCH),
      AsyncStorage.getItem(KEYS.TARGET_PSU),
    ]);

    const user = auth.currentUser;
    let finalApiKey = localApiKey ?? '';
    let finalModel = localModel ?? DEFAULT_MODEL;
    let finalName = localName ?? 'Future Officer';
    let finalOnboarded = localOnboarded === 'true';
    let finalBranch = localBranch ?? '';
    let finalPsu = localPsu ?? '';

    if (user) {
      const cloudConfig = await getUserConfig(user.uid);
      if (cloudConfig) {
        // IMPORTANT: Gemini API Key is NOT synced from cloud
        finalModel = cloudConfig.geminiModel ?? finalModel;
        finalName = cloudConfig.fullName ?? finalName;
        finalOnboarded = cloudConfig.isOnboarded ?? finalOnboarded;
        finalBranch = cloudConfig.primaryBranchId ?? finalBranch;
        finalPsu = cloudConfig.targetPsuId ?? finalPsu;

        // Sync back to local storage
        await AsyncStorage.setItem(KEYS.MODEL, finalModel);
        await AsyncStorage.setItem(KEYS.FULL_NAME, finalName);
        await AsyncStorage.setItem(KEYS.ONBOARDED, String(finalOnboarded));
        await AsyncStorage.setItem(KEYS.PRIMARY_BRANCH, finalBranch);
        await AsyncStorage.setItem(KEYS.TARGET_PSU, finalPsu);
      }
    }

    set({
      geminiApiKey: finalApiKey,
      geminiModel: finalModel,
      fullName: finalName,
      isOnboarded: finalOnboarded,
      primaryBranchId: finalBranch,
      targetPsuId: finalPsu,
      isLoaded: true,
    });
  },

  setApiKey: async (key) => {
    // Save ONLY to local SecureStore
    await SecureStore.setItemAsync(KEYS.API_KEY, key);
    set({ geminiApiKey: key });
  },

  setModel: async (modelId) => {
    await AsyncStorage.setItem(KEYS.MODEL, modelId);
    const user = auth.currentUser;
    if (user) await updateSingleField(user.uid, 'geminiModel', modelId);
    set({ geminiModel: modelId });
  },

  setFullName: async (name) => {
    await AsyncStorage.setItem(KEYS.FULL_NAME, name);
    const user = auth.currentUser;
    if (user) await updateSingleField(user.uid, 'fullName', name);
    set({ fullName: name });
  },

  setPrimaryBranch: async (branchId) => {
    await AsyncStorage.setItem(KEYS.PRIMARY_BRANCH, branchId);
    const user = auth.currentUser;
    if (user) await updateSingleField(user.uid, 'primaryBranchId', branchId);
    set({ primaryBranchId: branchId });
  },

  setTargetPsu: async (psuId) => {
    await AsyncStorage.setItem(KEYS.TARGET_PSU, psuId);
    const user = auth.currentUser;
    if (user) await updateSingleField(user.uid, 'targetPsuId', psuId);
    set({ targetPsuId: psuId });
  },

  setOnboarded: async () => {
    await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
    const user = auth.currentUser;
    if (user) await updateSingleField(user.uid, 'isOnboarded', true);
    set({ isOnboarded: true });
  },

  clearApiKey: async () => {
    await SecureStore.deleteItemAsync(KEYS.API_KEY);
    set({ geminiApiKey: '' });
  },

  syncWithFirebase: async (uid: string) => {
    const state = useSettingsStore.getState();
    await saveUserConfig(uid, {
      fullName: state.fullName,
      // geminiApiKey: state.geminiApiKey, // EXCLUDED for privacy
      geminiModel: state.geminiModel,
      isOnboarded: state.isOnboarded,
      primaryBranchId: state.primaryBranchId,
      targetPsuId: state.targetPsuId,
    });
  },
}));
