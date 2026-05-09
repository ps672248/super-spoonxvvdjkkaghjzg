import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = 'psuplus_bookmarks';

export type BookmarkedTopic = {
  topicId: string;
  topicTitle: string;
  sectionId: string;
  sectionName: string;
  branchId: string;
  branchName: string;
  psuId: string;
  psuName: string;
  savedAt: number; // timestamp
};

export type BookmarkedQuestion = {
  id: string;
  type?: 'mcq' | 'match';
  question?: string;
  options?: string[];
  correct?: string;
  explanation: string;
  pairs?: { id: string; left: string; right: string }[];
  yourAnswer?: any;
  psuName: string;
  branchName: string;
  topicTitle: string;
  note?: string;
  savedAt: number;
};

interface BookmarkState {
  bookmarks: BookmarkedTopic[];
  questionBookmarks: BookmarkedQuestion[];
  isLoaded: boolean;

  loadBookmarks: () => Promise<void>;
  addBookmark: (item: Omit<BookmarkedTopic, 'savedAt'>) => Promise<void>;
  removeBookmark: (topicId: string) => Promise<void>;
  isBookmarked: (topicId: string) => boolean;
  
  addQuestionBookmark: (item: Omit<BookmarkedQuestion, 'savedAt'>) => Promise<void>;
  removeQuestionBookmark: (id: string) => Promise<void>;
  isQuestionBookmarked: (id: string) => boolean;
  updateQuestionNote: (id: string, note: string) => Promise<void>;
  toggleBookmark: (item: Omit<BookmarkedTopic, 'savedAt'>) => Promise<void>;
  toggleQuestionBookmark: (item: Omit<BookmarkedQuestion, 'savedAt'>) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  questionBookmarks: [],
  isLoaded: false,

  loadBookmarks: async () => {
    const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
    const rawQ = await AsyncStorage.getItem(BOOKMARKS_KEY + '_q');
    const parsed: BookmarkedTopic[] = raw ? JSON.parse(raw) : [];
    const parsedQ: BookmarkedQuestion[] = rawQ ? JSON.parse(rawQ) : [];
    set({ bookmarks: parsed, questionBookmarks: parsedQ, isLoaded: true });
  },

  addBookmark: async (item) => {
    const newBookmark: BookmarkedTopic = { ...item, savedAt: Date.now() };
    const updated = [...get().bookmarks, newBookmark];
    set({ bookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  },

  removeBookmark: async (topicId) => {
    const updated = get().bookmarks.filter(b => b.topicId !== topicId);
    set({ bookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  },

  isBookmarked: (topicId) => get().bookmarks.some(b => b.topicId === topicId),

  addQuestionBookmark: async (item) => {
    const newBookmark: BookmarkedQuestion = { ...item, savedAt: Date.now() };
    const updated = [...get().questionBookmarks, newBookmark];
    set({ questionBookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY + '_q', JSON.stringify(updated));
  },

  removeQuestionBookmark: async (id) => {
    const updated = get().questionBookmarks.filter(b => b.id !== id);
    set({ questionBookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY + '_q', JSON.stringify(updated));
  },

  isQuestionBookmarked: (id) => get().questionBookmarks.some(b => b.id === id),

  updateQuestionNote: async (id, note) => {
    const updated = get().questionBookmarks.map(b => b.id === id ? { ...b, note } : b);
    set({ questionBookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY + '_q', JSON.stringify(updated));
  },

  toggleBookmark: async (item) => {
    const { isBookmarked, addBookmark, removeBookmark } = get();
    if (isBookmarked(item.topicId)) {
      await removeBookmark(item.topicId);
    } else {
      await addBookmark(item);
    }
  },

  toggleQuestionBookmark: async (item) => {
    const { isQuestionBookmarked, addQuestionBookmark, removeQuestionBookmark } = get();
    if (isQuestionBookmarked(item.id)) {
      await removeQuestionBookmark(item.id);
    } else {
      await addQuestionBookmark(item);
    }
  },
}));
