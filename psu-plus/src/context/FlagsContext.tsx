import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { db } from '@/config/firebase';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { useActivityStore } from '@/stores/activityStore';

// ── Semver comparison — returns true only if `latest` is strictly newer ───────
function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
  const [lMaj = 0, lMin = 0, lPat = 0] = parse(latest);
  const [cMaj = 0, cMin = 0, cPat = 0] = parse(current);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlagsContextType {
  // Maintenance
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  retryMaintenance: () => Promise<void>;

  // Permission explainer
  showPermissionExplainer: boolean;
  dismissPermissionExplainer: () => Promise<void>;
  handlePermissionAllow: (userId: string) => Promise<void>;

  // What's New
  showWhatsNew: boolean;
  whatsNewItems: string[];
  dismissWhatsNew: () => Promise<void>;

  // App Rate
  showAppRate: boolean;
  markRated: (rating?: number, review?: string, userId?: string | null) => Promise<void>;
  scheduleRateReminder: (days?: number) => Promise<void>;
  checkAndShowRate: (userId?: string) => Promise<void>;

  // App Update
  showAppUpdate: boolean;
  updateVersion: string;
  updateApkUrl: string;
  updateReleaseNotes: string[];
  forceUpdate: boolean;
  dismissUpdate: () => void;
}

const FlagsContext = createContext<FlagsContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const FlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const lastInitializedUid = useRef<string | null>(null);

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

  // ── App Update ────────────────────────────────────────────────────────────
  const [showAppUpdate, setShowAppUpdate] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateApkUrl, setUpdateApkUrl] = useState('');
  const [updateReleaseNotes, setUpdateReleaseNotes] = useState<string[]>([]);
  const [forceUpdate, setForceUpdate] = useState(false);

  // ── Init on mount — runs for all users (guest + logged-in) ─────────────────
  useEffect(() => {
    initGlobalFlags();
  }, []);

  // ── Init on login — user-specific flags ───────────────────────────────────
  useEffect(() => {
    if (!user?.uid || lastInitializedUid.current === user.uid) return;
    lastInitializedUid.current = user.uid;
    checkPermission(user.uid);
  }, [user?.uid]);

  // ── Global checks (no auth required) ─────────────────────────────────────

  async function initGlobalFlags() {
    const inMaintenance = await checkMaintenance();
    if (inMaintenance) return;
    await Promise.all([checkUpdate(), checkWhatsNew()]);
  }

  /** Returns true if app is in maintenance mode */
  async function checkMaintenance(): Promise<boolean> {
    try {
      const snap = await getDoc(doc(db, 'app_config', 'maintenance'));
      if (snap.exists()) {
        const d = snap.data();
        if (d.maintenance_message) setMaintenanceMessage(d.maintenance_message);
        if (d.maintenance_mode === true || d.maintenance_mode === 'true') {
          setIsMaintenanceMode(true);
          return true;
        } else {
          setIsMaintenanceMode(false);
        }
      }
    } catch { /* offline — skip */ }
    return false;
  }

  /**
   * Firestore schema: app_config/update
   * { version: "1.1.0", apk_url: "https://...", force_update: false, release_notes: ["Fix 1", "Fix 2"] }
   * release_notes accepts string[] or JSON string array.
   */
  async function checkUpdate() {
    try {
      const currentVersion = Constants.expoConfig?.version ?? '1.0.0';
      const snap = await getDoc(doc(db, 'app_config', 'update'));
      if (!snap.exists()) return;
      const d = snap.data();
      const latest: string = d.version ?? '';
      const apkUrl: string = d.apk_url ?? '';
      if (!latest || !apkUrl || !isNewerVersion(latest, currentVersion)) return;
      setUpdateVersion(latest);
      setUpdateApkUrl(apkUrl);
      let notes = d.release_notes ?? [];
      if (typeof notes === 'string') {
        try { notes = JSON.parse(notes); } catch { notes = notes ? [notes] : []; }
      }
      setUpdateReleaseNotes(Array.isArray(notes) ? notes : []);
      setForceUpdate(d.force_update === true);
      setShowAppUpdate(true);
    } catch { /* offline — skip */ }
  }

  async function checkWhatsNew() {
    try {
      const currentVersion = Constants.expoConfig?.version ?? '1.0.0';
      const lastSeen = await AsyncStorage.getItem('@last_seen_version');
      if (lastSeen === currentVersion) return;

      const snap = await getDoc(doc(db, 'app_config', 'whats_new'));
      if (!snap.exists()) return;
      const d = snap.data();
      let items = d.items ?? d.value;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch { return; }
      }
      if (Array.isArray(items) && items.length > 0) {
        setWhatsNewItems(items);
        setShowWhatsNew(true);
      }
    } catch (e: any) {
      console.warn('[Flags] whats_new check failed:', e.message);
    }
  }

  // ── User-specific checks ──────────────────────────────────────────────────

  async function checkPermission(_userId: string) {
    try {
      const remindAt = await AsyncStorage.getItem('@permission_remind_at');
      if (!remindAt || Date.now() >= parseInt(remindAt, 10)) {
        setShowPermissionExplainer(true);
      }
    } catch { /* skip */ }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  const dismissPermissionExplainer = useCallback(async () => {
    setShowPermissionExplainer(false);
    try {
      await AsyncStorage.setItem('@permission_remind_at', String(Date.now() + 7 * 86_400_000));
    } catch (e: any) {
      console.warn('[Flags] save permission_remind_at failed:', e.message);
    }
  }, []);

  const handlePermissionAllow = useCallback(async (_userId: string) => {
    setShowPermissionExplainer(false);
    try {
      await AsyncStorage.setItem('@permission_remind_at', String(Date.now() + 365 * 86_400_000));
    } catch (e: any) {
      console.warn('[Flags] handlePermissionAllow failed:', e.message);
    }
  }, []);

  const dismissWhatsNew = useCallback(async () => {
    setShowWhatsNew(false);
    try {
      const v = Constants.expoConfig?.version ?? '1.0.0';
      await AsyncStorage.setItem('@last_seen_version', v);
    } catch (e: any) {
      console.warn('[Flags] save last_seen_version failed:', e.message);
    }
  }, []);

  /** Save rating to Firestore `ratings/{ts}_{userId}` + mark locally */
  const markRated = useCallback(async (rating = 0, review = '', userId: string | null = null) => {
    setShowAppRate(false);
    try {
      await AsyncStorage.setItem('@app_rated', 'true');
      if (rating > 0) {
        const ratingId = `${Date.now()}_${userId ?? 'guest'}`;
        await setDoc(doc(db, 'ratings', ratingId), {
          rating,
          review: review ?? '',
          userId: userId ?? 'guest',
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      console.warn('[Flags] markRated failed:', e.message);
    }
  }, []);

  const scheduleRateReminder = useCallback(async (days = 7) => {
    setShowAppRate(false);
    try {
      await AsyncStorage.setItem('@app_rate_remind_at', String(Date.now() + days * 86_400_000));
    } catch (e: any) {
      console.warn('[Flags] scheduleRateReminder failed:', e.message);
    }
  }, []);

  /**
   * Call after a game ends. Shows rate modal when:
   *   - Not already rated
   *   - Not within remind window
   *   - User has ≥3 sessions (local activityStore — works for guests too)
   */
  const checkAndShowRate = useCallback(async (_userId?: string) => {
    try {
      const rated = await AsyncStorage.getItem('@app_rated');
      if (rated === 'true') return;

      const remindAt = await AsyncStorage.getItem('@app_rate_remind_at');
      if (remindAt && Date.now() < parseInt(remindAt, 10)) return;

      const { sessions } = useActivityStore.getState();
      if (sessions.length >= 3) {
        setShowAppRate(true);
      }
    } catch (e: any) {
      console.warn('[Flags] checkAndShowRate failed:', e.message);
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    if (!forceUpdate) setShowAppUpdate(false);
  }, [forceUpdate]);

  /** Re-check maintenance status — used by "Check Again" button in modal */
  const retryMaintenance = useCallback(async () => {
    const inMaint = await checkMaintenance();
    if (!inMaint) {
      // App back online — load the rest of global flags
      await Promise.all([checkUpdate(), checkWhatsNew()]);
    }
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = useMemo<FlagsContextType>(() => ({
    isMaintenanceMode,
    maintenanceMessage,
    retryMaintenance,
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
    showAppUpdate,
    updateVersion,
    updateApkUrl,
    updateReleaseNotes,
    forceUpdate,
    dismissUpdate,
  }), [
    isMaintenanceMode, maintenanceMessage, retryMaintenance,
    showPermissionExplainer, dismissPermissionExplainer, handlePermissionAllow,
    showWhatsNew, whatsNewItems, dismissWhatsNew,
    showAppRate, markRated, scheduleRateReminder, checkAndShowRate,
    showAppUpdate, updateVersion, updateApkUrl, updateReleaseNotes, forceUpdate, dismissUpdate,
  ]);

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFlagsContext() {
  const ctx = useContext(FlagsContext);
  if (!ctx) throw new Error('useFlagsContext must be used within FlagsProvider');
  return ctx;
}

export const useAppFlagsContext = useFlagsContext;
