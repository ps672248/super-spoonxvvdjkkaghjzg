import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Topic } from '../config/syllabus';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYLLABUS_COLLECTION = 'syllabus';

export const fetchSyllabusTopics = async (sectionId: string, branchId?: string): Promise<Topic[]> => {
  const cacheKey = `psuplus_syllabus_${sectionId}_${branchId || 'general'}`;
  
  try {
    // 1. Try local cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Fetch from Firestore
    // We assume topics are stored with sectionId and optional branchId
    let q = query(collection(db, SYLLABUS_COLLECTION), where('sectionId', '==', sectionId));
    if (branchId) {
      q = query(q, where('branchId', '==', branchId));
    }

    const snap = await getDocs(q);
    const topics = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Topic[];

    // 3. Cache locally
    await AsyncStorage.setItem(cacheKey, JSON.stringify(topics));
    
    return topics;
  } catch (error) {
    console.error('Failed to fetch syllabus topics:', error);
    return [];
  }
};
