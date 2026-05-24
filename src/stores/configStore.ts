import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, firebaseConfig } from '../config/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { PSUConfig, PSUS } from '../config/psus';
import { BranchConfig, BRANCHES } from '../config/branches';

interface ConfigState {
  psus: PSUConfig[];
  branches: BranchConfig[];
  isLoading: boolean;
  isLoaded: boolean;
  
  loadConfig: () => Promise<void>;
  getPSU: (id: string) => PSUConfig | undefined;
  getBranch: (id: string) => BranchConfig | undefined;
}

const STORAGE_KEYS = {
  PSUS: 'psuplus_master_psus',
  BRANCHES: 'psuplus_master_branches',
  VERSION: 'psuplus_master_version',
};

export const useConfigStore = create<ConfigState>((set, get) => ({
  psus: PSUS,
  branches: BRANCHES,
  isLoading: false,
  isLoaded: false,

  loadConfig: async () => {
    set({ isLoading: true });

    try {
      // 1. Try to load from local storage first for instant UI
      const [localPsus, localBranches, localVersion] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PSUS),
        AsyncStorage.getItem(STORAGE_KEYS.BRANCHES),
        AsyncStorage.getItem(STORAGE_KEYS.VERSION),
      ]);

      if (localPsus && localBranches) {
        set({
          psus: JSON.parse(localPsus),
          branches: JSON.parse(localBranches),
          isLoaded: true,
          isLoading: false,
        });
      } else {
        set({
          psus: PSUS,
          branches: BRANCHES,
          isLoaded: true,
          isLoading: false,
        });
      }

      // If dummy firebase config is used, skip remote fetch to prevent hanging!
      if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        return;
      }

      // 2. Check remote version to see if we need an update
      const versionDoc = await getDoc(doc(db, 'metadata', 'config_version'));
      const remoteVersion = versionDoc.exists() ? versionDoc.data().version : 0;

      if (!localVersion || remoteVersion > parseInt(localVersion)) {
        // 3. Fetch fresh data from Firestore
        const [psuSnap, branchSnap] = await Promise.all([
          getDocs(collection(db, 'psus')),
          getDocs(collection(db, 'branches')),
        ]);

        const freshPsus = psuSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PSUConfig[];
        const freshBranches = branchSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BranchConfig[];

        // 4. Update local storage and state — only if Firestore returned real data
        if (freshPsus.length > 0 && freshBranches.length > 0) {
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.PSUS, JSON.stringify(freshPsus)),
            AsyncStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(freshBranches)),
            AsyncStorage.setItem(STORAGE_KEYS.VERSION, remoteVersion.toString()),
          ]);

          set({
            psus: freshPsus,
            branches: freshBranches,
            isLoaded: true,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load remote config:', error);
      // Fallback is already handled by loading local data first
    } finally {
      set({ isLoading: false });
    }
  },

  getPSU: (id) => get().psus.find(p => p.id === id),
  getBranch: (id) => get().branches.find(b => b.id === id),
}));
