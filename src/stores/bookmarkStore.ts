import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import {
  collection, doc, setDoc, deleteDoc, getDocs, writeBatch, updateDoc,
} from 'firebase/firestore';

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
  savedAt: number;
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

// ── Firestore paths ──────────────────────────────────────────────────────────
const topicCol = (uid: string) => collection(db, 'users', uid, 'topic_bookmarks');
const topicDocRef = (uid: string, topicId: string) =>
  doc(db, 'users', uid, 'topic_bookmarks', topicId);
const questionCol = (uid: string) => collection(db, 'users', uid, 'question_bookmarks');
const questionDocRef = (uid: string, id: string) =>
  doc(db, 'users', uid, 'question_bookmarks', id);

// ── Merge helper — union of local + cloud, newer savedAt wins ────────────────
function mergeById<T extends { savedAt: number }>(
  local: T[],
  cloud: T[],
  idKey: keyof T,
): T[] {
  const map = new Map<any, T>();
  for (const item of local) map.set(item[idKey], item);
  for (const item of cloud) {
    const existing = map.get(item[idKey]);
    if (!existing || item.savedAt > existing.savedAt) {
      map.set(item[idKey], item);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.savedAt - a.savedAt);
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  questionBookmarks: [],
  isLoaded: false,

  // ── Load (AsyncStorage first → merge with Firestore if logged in) ──────────
  loadBookmarks: async () => {
    const [raw, rawQ] = await Promise.all([
      AsyncStorage.getItem(BOOKMARKS_KEY),
      AsyncStorage.getItem(BOOKMARKS_KEY + '_q'),
    ]);
    const local: BookmarkedTopic[] = raw ? JSON.parse(raw) : [];
    const localQ: BookmarkedQuestion[] = rawQ ? JSON.parse(rawQ) : [];

    const uid = auth.currentUser?.uid;

    if (!uid) {
      set({ bookmarks: local, questionBookmarks: localQ, isLoaded: true });
      return;
    }

    try {
      // Fetch cloud bookmarks
      const [topicSnap, questionSnap] = await Promise.all([
        getDocs(topicCol(uid)),
        getDocs(questionCol(uid)),
      ]);
      const cloudTopics = topicSnap.docs.map(d => d.data()) as BookmarkedTopic[];
      const cloudQuestions = questionSnap.docs.map(d => d.data()) as BookmarkedQuestion[];

      // Merge
      const mergedTopics = mergeById(local, cloudTopics, 'topicId');
      const mergedQuestions = mergeById(localQ, cloudQuestions, 'id');

      // Upload any local-only items to Firestore (batch)
      const batch = writeBatch(db);
      mergedTopics.forEach(b => batch.set(topicDocRef(uid, b.topicId), b));
      mergedQuestions.forEach(b => batch.set(questionDocRef(uid, b.id), b));
      await batch.commit();

      // Persist merged back to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(mergedTopics)),
        AsyncStorage.setItem(BOOKMARKS_KEY + '_q', JSON.stringify(mergedQuestions)),
      ]);

      set({ bookmarks: mergedTopics, questionBookmarks: mergedQuestions, isLoaded: true });
    } catch (e) {
      // Firestore unreachable — fall back to local data
      console.warn('[Bookmarks] Cloud sync failed, using local:', e);
      set({ bookmarks: local, questionBookmarks: localQ, isLoaded: true });
    }
  },

  // ── Topic bookmarks ──────────────────────────────────────────────────────
  addBookmark: async (item) => {
    const newBookmark: BookmarkedTopic = { ...item, savedAt: Date.now() };
    const updated = [...get().bookmarks, newBookmark];
    set({ bookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await setDoc(topicDocRef(uid, item.topicId), newBookmark); } catch {}
    }
  },

  removeBookmark: async (topicId) => {
    const updated = get().bookmarks.filter(b => b.topicId !== topicId);
    set({ bookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await deleteDoc(topicDocRef(uid, topicId)); } catch {}
    }
  },

  isBookmarked: (topicId) => get().bookmarks.some(b => b.topicId === topicId),

  // ── Question bookmarks ────────────────────────────────────────────────────
  addQuestionBookmark: async (item) => {
    const newBookmark: BookmarkedQuestion = { ...item, savedAt: Date.now() };
    const updated = [...get().questionBookmarks, newBookmark];
    set({ questionBookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY + '_q', JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await setDoc(questionDocRef(uid, item.id), newBookmark); } catch {}
    }
  },

  removeQuestionBookmark: async (id) => {
    const updated = get().questionBookmarks.filter(b => b.id !== id);
    set({ questionBookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY + '_q', JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await deleteDoc(questionDocRef(uid, id)); } catch {}
    }
  },

  isQuestionBookmarked: (id) => get().questionBookmarks.some(b => b.id === id),

  updateQuestionNote: async (id, note) => {
    const updated = get().questionBookmarks.map(b => b.id === id ? { ...b, note } : b);
    set({ questionBookmarks: updated });
    await AsyncStorage.setItem(BOOKMARKS_KEY + '_q', JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await updateDoc(questionDocRef(uid, id), { note }); } catch {}
    }
  },

  // ── Toggles ───────────────────────────────────────────────────────────────
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
