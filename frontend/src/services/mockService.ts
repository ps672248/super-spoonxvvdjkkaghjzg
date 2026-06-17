import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';

export interface MockAttempt {
  id?: string;
  userId: string;
  psuId: string;
  branchId: string;
  mode: string;
  score: number;
  totalQuestions: number;
  duration: number; // in seconds
  timestamp: Timestamp | any;
}

const ATTEMPTS_COLLECTION = 'mock_attempts';

/**
 * Saves a new mock test attempt to Firestore.
 */
export const saveMockAttempt = async (attempt: Omit<MockAttempt, 'timestamp' | 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, ATTEMPTS_COLLECTION), {
      ...attempt,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving mock attempt:', error);
    throw error;
  }
};

/**
 * Retrieves the history of mock attempts for a specific user.
 */
export const getUserMockHistory = async (userId: string): Promise<MockAttempt[]> => {
  try {
    const q = query(
      collection(db, ATTEMPTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MockAttempt[];
  } catch (error) {
    console.error('Error fetching mock history:', error);
    return [];
  }
};

/**
 * Retrieves attempts for a specific PSU and Branch combination.
 */
export const getFilteredMockHistory = async (
  userId: string, 
  psuId: string, 
  branchId: string
): Promise<MockAttempt[]> => {
  try {
    const q = query(
      collection(db, ATTEMPTS_COLLECTION),
      where('userId', '==', userId),
      where('psuId', '==', psuId),
      where('branchId', '==', branchId),
      orderBy('timestamp', 'desc')
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MockAttempt[];
  } catch (error) {
    console.error('Error fetching filtered mock history:', error);
    return [];
  }
};
