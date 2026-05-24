import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface UserConfig {
  fullName?: string;
  geminiModel?: string;
  isOnboarded?: boolean;
  primaryBranchId?: string;
  targetPsuId?: string;
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

export const updateSingleField = async (uid: string, field: keyof UserConfig, value: any) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    [field]: value,
    updatedAt: serverTimestamp(),
  });
};
