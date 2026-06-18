import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import {
  collection, doc, setDoc, deleteDoc, getDocs, writeBatch, updateDoc, query, limit,
} from 'firebase/firestore';

const GUEST_KEY   = 'psuplus_bookmarks_guest';
const GUEST_Q_KEY = 'psuplus_bookmarks_guest_q';
const userKey  = (uid: string) => `psuplus_bookmarks_${uid}`;
const userQKey = (uid: string) => `psuplus_bookmarks_q_${uid}`;

const getKeys = () => {
  const uid = auth.currentUser?.uid;
  return uid
    ? { key: userKey(uid), qKey: userQKey(uid) }
    : { key: GUEST_KEY, qKey: GUEST_Q_KEY };
};

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
  psuId?: string;
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
  isSyncing: boolean;

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

  hasGuestData: () => Promise<boolean>;
  hasCloudData: (uid: string) => Promise<boolean>;
  mergeGuestIntoUser: (uid: string) => Promise<void>;
  discardGuestData: () => Promise<void>;
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
  isSyncing: false,

  // ── Load (uid-scoped AsyncStorage first → merge with Firestore if logged in) ─
  loadBookmarks: async () => {
    const uid = auth.currentUser?.uid;
    const { key, qKey } = getKeys();

    const [raw, rawQ] = await Promise.all([
      AsyncStorage.getItem(key),
      AsyncStorage.getItem(qKey),
    ]);
    const local: BookmarkedTopic[] = raw ? JSON.parse(raw) : [];
    const localQ: BookmarkedQuestion[] = rawQ ? JSON.parse(rawQ) : [];

    // Show local immediately; flag a background sync when signed in.
    set({ bookmarks: local, questionBookmarks: localQ, isLoaded: true, isSyncing: !!uid });

    if (!uid) return;

    try {
      const [topicSnap, questionSnap] = await Promise.all([
        getDocs(topicCol(uid)),
        getDocs(questionCol(uid)),
      ]);
      const cloudTopics = topicSnap.docs.map(d => d.data()) as BookmarkedTopic[];
      const cloudQuestions = questionSnap.docs.map(d => d.data()) as BookmarkedQuestion[];

      const mergedTopics = mergeById(local, cloudTopics, 'topicId');
      const mergedQuestions = mergeById(localQ, cloudQuestions, 'id');

      const batch = writeBatch(db);
      mergedTopics.forEach(b => batch.set(topicDocRef(uid, b.topicId), b));
      mergedQuestions.forEach(b => batch.set(questionDocRef(uid, b.id), b));
      await batch.commit();

      await Promise.all([
        AsyncStorage.setItem(key, JSON.stringify(mergedTopics)),
        AsyncStorage.setItem(qKey, JSON.stringify(mergedQuestions)),
      ]);

      set({ bookmarks: mergedTopics, questionBookmarks: mergedQuestions, isLoaded: true, isSyncing: false });
    } catch (e) {
      console.warn('[Bookmarks] Cloud sync failed, using local:', e);
      set({ bookmarks: local, questionBookmarks: localQ, isLoaded: true, isSyncing: false });
    }
  },

  // ── Guest migration helpers ────────────────────────────────────────────────
  hasGuestData: async () => {
    const [raw, rawQ] = await Promise.all([
      AsyncStorage.getItem(GUEST_KEY),
      AsyncStorage.getItem(GUEST_Q_KEY),
    ]);
    const topics: BookmarkedTopic[] = raw ? JSON.parse(raw) : [];
    const questions: BookmarkedQuestion[] = rawQ ? JSON.parse(rawQ) : [];
    return topics.length > 0 || questions.length > 0;
  },

  hasCloudData: async (uid) => {
    try {
      const [topicSnap, questionSnap] = await Promise.all([
        getDocs(query(topicCol(uid), limit(1))),
        getDocs(query(questionCol(uid), limit(1))),
      ]);
      return topicSnap.size > 0 || questionSnap.size > 0;
    } catch {
      return false;
    }
  },

  mergeGuestIntoUser: async (uid) => {
    const [raw, rawQ] = await Promise.all([
      AsyncStorage.getItem(GUEST_KEY),
      AsyncStorage.getItem(GUEST_Q_KEY),
    ]);
    const guestTopics: BookmarkedTopic[] = raw ? JSON.parse(raw) : [];
    const guestQuestions: BookmarkedQuestion[] = rawQ ? JSON.parse(rawQ) : [];
    if (guestTopics.length === 0 && guestQuestions.length === 0) return;

    const [topicSnap, questionSnap] = await Promise.all([
      getDocs(topicCol(uid)),
      getDocs(questionCol(uid)),
    ]);
    const cloudTopics = topicSnap.docs.map(d => d.data()) as BookmarkedTopic[];
    const cloudQuestions = questionSnap.docs.map(d => d.data()) as BookmarkedQuestion[];

    const mergedTopics = mergeById(guestTopics, cloudTopics, 'topicId');
    const mergedQuestions = mergeById(guestQuestions, cloudQuestions, 'id');

    const batch = writeBatch(db);
    mergedTopics.forEach(b => batch.set(topicDocRef(uid, b.topicId), b));
    mergedQuestions.forEach(b => batch.set(questionDocRef(uid, b.id), b));
    await batch.commit();

    await Promise.all([
      AsyncStorage.setItem(userKey(uid), JSON.stringify(mergedTopics)),
      AsyncStorage.setItem(userQKey(uid), JSON.stringify(mergedQuestions)),
      AsyncStorage.multiRemove([GUEST_KEY, GUEST_Q_KEY]),
    ]);
  },

  discardGuestData: async () => {
    await AsyncStorage.multiRemove([GUEST_KEY, GUEST_Q_KEY]);
  },

  // ── Topic bookmarks ──────────────────────────────────────────────────────
  addBookmark: async (item) => {
    const newBookmark: BookmarkedTopic = { ...item, savedAt: Date.now() };
    const updated = [...get().bookmarks, newBookmark];
    set({ bookmarks: updated });
    const { key } = getKeys();
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await setDoc(topicDocRef(uid, item.topicId), newBookmark); } catch {}
    }
  },

  removeBookmark: async (topicId) => {
    const updated = get().bookmarks.filter(b => b.topicId !== topicId);
    set({ bookmarks: updated });
    const { key } = getKeys();
    await AsyncStorage.setItem(key, JSON.stringify(updated));
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
    const { qKey } = getKeys();
    await AsyncStorage.setItem(qKey, JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await setDoc(questionDocRef(uid, item.id), newBookmark); } catch {}
    }
  },

  removeQuestionBookmark: async (id) => {
    const updated = get().questionBookmarks.filter(b => b.id !== id);
    set({ questionBookmarks: updated });
    const { qKey } = getKeys();
    await AsyncStorage.setItem(qKey, JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await deleteDoc(questionDocRef(uid, id)); } catch {}
    }
  },

  isQuestionBookmarked: (id) => get().questionBookmarks.some(b => b.id === id),

  updateQuestionNote: async (id, note) => {
    const updated = get().questionBookmarks.map(b => b.id === id ? { ...b, note } : b);
    set({ questionBookmarks: updated });
    const { qKey } = getKeys();
    await AsyncStorage.setItem(qKey, JSON.stringify(updated));
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
