import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const GUEST_KEY = 'psuplus_wishlist_guest';
const userKey = (uid: string) => `psuplus_wishlist_${uid}`;

const wishlistDocRef = (uid: string) => doc(db, 'users', uid, 'meta', 'wishlist');

interface WishlistState {
  ids: Set<string>;
  isLoaded: boolean;

  load: () => Promise<void>;
  toggle: (id: string) => Promise<void>;
  isWishlisted: (id: string) => boolean;
  mergeGuestIntoUser: (uid: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),
  isLoaded: false,

  isWishlisted: (id) => get().ids.has(id),

  load: async () => {
    const uid = auth.currentUser?.uid;
    const key = uid ? userKey(uid) : GUEST_KEY;

    const raw = await AsyncStorage.getItem(key);
    const local: string[] = raw ? JSON.parse(raw) : [];
    const merged = new Set<string>(local);

    if (uid) {
      try {
        const snap = await getDoc(wishlistDocRef(uid));
        const cloudIds: string[] = snap.exists() ? (snap.data().ids ?? []) : [];
        cloudIds.forEach(id => merged.add(id));
        // write merged back
        const arr = Array.from(merged);
        await AsyncStorage.setItem(key, JSON.stringify(arr));
        await setDoc(wishlistDocRef(uid), { ids: arr }, { merge: true });
      } catch { /* non-fatal */ }
    }

    set({ ids: merged, isLoaded: true });
  },

  toggle: async (id) => {
    const { ids } = get();
    const next = new Set(ids);
    if (next.has(id)) next.delete(id);
    else next.add(id);

    set({ ids: next });

    const uid = auth.currentUser?.uid;
    const key = uid ? userKey(uid) : GUEST_KEY;
    const arr = Array.from(next);
    await AsyncStorage.setItem(key, JSON.stringify(arr));

    if (uid) {
      try {
        await setDoc(wishlistDocRef(uid), { ids: arr }, { merge: true });
      } catch { /* non-fatal */ }
    }
  },

  mergeGuestIntoUser: async (uid) => {
    const raw = await AsyncStorage.getItem(GUEST_KEY);
    if (!raw) return;
    const guestIds: string[] = JSON.parse(raw);
    if (guestIds.length === 0) return;

    const { ids } = get();
    const merged = new Set([...ids, ...guestIds]);
    const arr = Array.from(merged);

    set({ ids: merged });
    await AsyncStorage.setItem(userKey(uid), JSON.stringify(arr));
    await AsyncStorage.removeItem(GUEST_KEY);
    try {
      await setDoc(wishlistDocRef(uid), { ids: arr }, { merge: true });
    } catch { /* non-fatal */ }
  },
}));
