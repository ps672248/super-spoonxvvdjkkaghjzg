import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  API_KEY: 'psuplus_gemini_key',
  MODEL:   'psuplus_gemini_model',
  ONBOARDED: 'psuplus_onboarded',
  FULL_NAME: 'psuplus_full_name',
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
  isOnboarded: boolean;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setModel: (modelId: string) => Promise<void>;
  setFullName: (name: string) => Promise<void>;
  setOnboarded: () => Promise<void>;
  clearApiKey: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  geminiApiKey: '',
  geminiModel: DEFAULT_MODEL,
  fullName: 'Future Officer',
  isOnboarded: false,
  isLoaded: false,

  loadSettings: async () => {
    const [apiKey, model, onboarded, name] = await Promise.all([
      SecureStore.getItemAsync(KEYS.API_KEY),
      AsyncStorage.getItem(KEYS.MODEL),
      AsyncStorage.getItem(KEYS.ONBOARDED),
      AsyncStorage.getItem(KEYS.FULL_NAME),
    ]);
    set({
      geminiApiKey: apiKey ?? '',
      geminiModel: model ?? DEFAULT_MODEL,
      fullName: name ?? 'Future Officer',
      isOnboarded: onboarded === 'true',
      isLoaded: true,
    });
  },

  setApiKey: async (key) => {
    await SecureStore.setItemAsync(KEYS.API_KEY, key);
    set({ geminiApiKey: key });
  },

  setModel: async (modelId) => {
    await AsyncStorage.setItem(KEYS.MODEL, modelId);
    set({ geminiModel: modelId });
  },

  setFullName: async (name) => {
    await AsyncStorage.setItem(KEYS.FULL_NAME, name);
    set({ fullName: name });
  },

  setOnboarded: async () => {
    await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
    set({ isOnboarded: true });
  },

  clearApiKey: async () => {
    await SecureStore.deleteItemAsync(KEYS.API_KEY);
    set({ geminiApiKey: '' });
  },
}));
