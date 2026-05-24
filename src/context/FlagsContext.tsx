import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { db } from '@/config/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';

interface FlagsContextType {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  showPermissionExplainer: boolean;
  dismissPermissionExplainer: () => Promise<void>;
  handlePermissionAllow: (userId: string) => Promise<void>;
  showWhatsNew: boolean;
  whatsNewItems: string[];
  dismissWhatsNew: () => Promise<void>;
  showAppRate: boolean;
  markRated: (rating?: number, review?: string, userId?: string | null) => Promise<void>;
  scheduleRateReminder: (days?: number) => Promise<void>;
  checkAndShowRate: (userId: string) => Promise<void>;
}

const FlagsContext = createContext<FlagsContextType | undefined>(undefined);

export const FlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const lastInitializedId = useRef<string | null>(null);

  // ── Maintenance ────────────────────────────────────────────────────────────
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'We are making improvements. Please check back shortly.'
  );

  // ── Permission explainer ───────────────────────────────────────────────────
  const [showPermissionExplainer, setShowPermissionExplainer] = useState(false);

  // ── What's New ────────────────────────────────────────────────────────────
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [whatsNewItems, setWhatsNewItems] = useState<string[]>([]);

  // ── App Rate ──────────────────────────────────────────────────────────────
  const [showAppRate, setShowAppRate] = useState(false);

  // ── Init — runs once when profile is loaded ────────────────────────────────
  useEffect(() => {
    if (!user?.uid || lastInitializedId.current === user.uid) return;
    lastInitializedId.current = user.uid;
    initFlags(user.uid);
  }, [user?.uid]);

  async function initFlags(userId: string) {
    const inMaintenance = await checkMaintenance();
    if (inMaintenance) return; // skip rest while under maintenance
    await Promise.all([checkPermission(userId), checkWhatsNew()]);
  }

  // 1. Maintenance mode — returns true if app is in maintenance
  async function checkMaintenance() {
    try {
      const docRef = doc(db, 'app_config', 'maintenance');
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data.maintenance_message) setMaintenanceMessage(data.maintenance_message);
        if (data.maintenance_mode === true || data.maintenance_mode === 'true') {
          setIsMaintenanceMode(true);
          return true;
        }
      }
    } catch (e) {
      // silent fail
    }
    return false;
  }

  // 2. Notification permission
  async function checkPermission(userId: string) {
    try {
      const remindAt = await AsyncStorage.getItem('@permission_remind_at');
      if (!remindAt || Date.now() >= parseInt(remindAt, 10)) {
        setShowPermissionExplainer(true);
      }
    } catch (e) {
      // silent fail
    }
  }

  // 3. What's New
  async function checkWhatsNew() {
    try {
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      const lastSeen = await AsyncStorage.getItem('@last_seen_version');
      if (lastSeen === currentVersion) return;

      const docRef = doc(db, 'app_config', 'whats_new');
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        let items = data.items || data.value;

        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            console.error('FlagsContext: Failed to parse whats_new JSON:', e);
            return;
          }
        }

        if (Array.isArray(items) && items.length > 0) {
          setWhatsNewItems(items);
          setShowWhatsNew(true);
        }
      }
    } catch (e: any) {
      console.warn('FlagsContext: whats_new check failed:', e.message);
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  const dismissPermissionExplainer = useCallback(async () => {
    setShowPermissionExplainer(false);
    try {
      const remindAt = (Date.now() + 7 * 86400000).toString();
      await AsyncStorage.setItem('@permission_remind_at', remindAt);
    } catch (e: any) {
      console.warn('FlagsContext: save permission_remind_at failed:', e.message);
    }
  }, []);

  const handlePermissionAllow = useCallback(async (userId: string) => {
    setShowPermissionExplainer(false);
    try {
      const remindAt = (Date.now() + 365 * 86400000).toString();
      await AsyncStorage.setItem('@permission_remind_at', remindAt);
    } catch (e: any) {
      console.warn('FlagsContext: handlePermissionAllow failed:', e.message);
    }
  }, []);

  const dismissWhatsNew = useCallback(async () => {
    setShowWhatsNew(false);
    try {
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      await AsyncStorage.setItem('@last_seen_version', currentVersion);
    } catch (e: any) {
      console.warn('FlagsContext: save last_seen_version failed:', e.message);
    }
  }, []);

  const markRated = useCallback(async (rating = 0, review = '', userId: string | null = null) => {
    setShowAppRate(false);
    try {
      await AsyncStorage.setItem('@app_rated', 'true');
      // In a real app, save rating to Firestore if needed
    } catch (e: any) {
      console.warn('FlagsContext: markRated failed:', e.message);
    }
  }, []);

  const scheduleRateReminder = useCallback(async (days = 7) => {
    setShowAppRate(false);
    try {
      const remindAt = (Date.now() + days * 86400000).toString();
      await AsyncStorage.setItem('@app_rate_remind_at', remindAt);
    } catch (e: any) {
      console.warn('FlagsContext: scheduleRateReminder failed:', e.message);
    }
  }, []);

  /**
   * Call after a mock attempt is saved. Checks if AppRate modal should appear.
   * Skips if: already rated, within remind window, or mock count < 3.
   */
  const checkAndShowRate = useCallback(async (userId: string) => {
    try {
      const rated = await AsyncStorage.getItem('@app_rated');
      if (rated === 'true') return;

      const remindAt = await AsyncStorage.getItem('@app_rate_remind_at');
      if (remindAt && Date.now() < parseInt(remindAt, 10)) return;

      const q = query(collection(db, 'mock_attempts'), where('userId', '==', userId));
      const snap = await getDocs(q);

      if (snap.size >= 3) {
        setShowAppRate(true);
      }
    } catch (e: any) {
      console.warn('FlagsContext: checkAndShowRate failed:', e.message);
    }
  }, []);

  const value = useMemo(() => ({
    isMaintenanceMode,
    maintenanceMessage,
    showPermissionExplainer,
    dismissPermissionExplainer,
    handlePermissionAllow,
    showWhatsNew,
    whatsNewItems,
    dismissWhatsNew,
    showAppRate,
    markRated,
    scheduleRateReminder,
    checkAndShowRate,
  }), [
    isMaintenanceMode,
    maintenanceMessage,
    showPermissionExplainer,
    dismissPermissionExplainer,
    handlePermissionAllow,
    showWhatsNew,
    whatsNewItems,
    dismissWhatsNew,
    showAppRate,
    markRated,
    scheduleRateReminder,
    checkAndShowRate,
  ]);

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
};

export function useFlagsContext() {
  const ctx = useContext(FlagsContext);
  if (!ctx) throw new Error('useFlagsContext must be used within FlagsProvider');
  return ctx;
}

export const useAppFlagsContext = useFlagsContext;
