import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'psuplus_seen_qs';
const MAX_PER_PSU = 150;

interface SeenQuestionsStore {
  seen: Record<string, string[]>; // psuId → question texts
  isLoaded: boolean;
  load: () => Promise<void>;
  markSeen: (psuId: string, questions: string[]) => Promise<void>;
  getSeenForPsu: (psuId: string) => string[];
}

export const useSeenQuestionsStore = create<SeenQuestionsStore>((set, get) => ({
  seen: {},
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const seen: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      set({ seen, isLoaded: true });
    } catch {
      set({ seen: {}, isLoaded: true });
    }
  },

  markSeen: async (psuId, questions) => {
    if (!psuId || questions.length === 0) return;
    const current = get().seen;
    const existing = current[psuId] ?? [];

    // Combine, dedupe by text, keep most recent MAX_PER_PSU
    const combined = [...existing, ...questions];
    const deduped = Array.from(new Set(combined));
    const trimmed = deduped.slice(-MAX_PER_PSU);

    const updated = { ...current, [psuId]: trimmed };
    set({ seen: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch { /* ignore storage errors */ }
  },

  getSeenForPsu: (psuId) => {
    return get().seen[psuId] ?? [];
  },
}));
