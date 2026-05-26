import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface UserConfig {
  fullName?: string;
  userIntroduction?: string;
  geminiModel?: string;
  isOnboarded?: boolean;
  primaryBranchId?: string;
  targetPsuId?: string;
  /** Incremented on every settings write. Higher version = source of truth. */
  settingsVersion?: number;
}

const USERS_COLLECTION = 'users';

export const saveUserConfig = async (uid: string, config: UserConfig) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(userRef, {
    ...config,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getUserConfig = async (uid: string): Promise<UserConfig | null> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserConfig;
  }
  return null;
};

/**
 * Update a single field on the user document.
 * Uses setDoc + merge so the document is created if it doesn't exist yet —
 * avoids updateDoc throwing "No document to update" for brand-new users.
 */
export const updateSingleField = async (uid: string, field: keyof UserConfig, value: any) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(userRef, {
    [field]: value,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
