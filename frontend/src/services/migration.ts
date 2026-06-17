/**
 * Static config migration to Firestore.
 * Triggered from Admin Tools in Settings (admin email only).
 *
 * Versioning:
 *   - Bump CONFIG_VERSION whenever PSUs / Branches / Syllabus data changes.
 *   - Add a matching entry to CONFIG_CHANGELOG so the admin sees what changed.
 */

import Constants from 'expo-constants';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PSUS } from '../config/psus';
import { BRANCHES } from '../config/branches';
import { CATEGORIES } from '../config/categories';
import { domainTopicMap, quantTopics, reasoningTopics, englishTopics, gkTopics } from '../config/syllabus/index';
import { schoolingTopicMap } from '../config/syllabus/schooling';

// ─── Version registry ─────────────────────────────────────────────────────────

/** Bump this number whenever the static config data files change. */
export const CONFIG_VERSION = 5;

/**
 * Human-readable changelog per version.
 * Add an entry here BEFORE bumping CONFIG_VERSION.
 */
export const CONFIG_CHANGELOG: Record<number, string[]> = {
  1: [
    'Initial migration — PSUs, Branches, Aptitude & Domain Syllabus uploaded',
    'app_config docs seeded (maintenance, update, whats_new)',
  ],
  2: [
    'Added NTPC, POWERGRID, GAIL, NALCO PSUs (4 new)',
    'Added prepTips (per-branch strategy) to all 12 PSUs',
    'Added generalTip + coreSubjects + allCoreSubjects to all 11 branches',
    'Added importance field to all 110 syllabus topics',
    'Added 21 new domain topics from 2023–2025 PSU job notifications',
  ],
  3: [
    'Added hasInterview + interviewStages + interviewTip to all 12 PSUs',
    'Interview Preparation feature: AI-driven GD, Technical PI, HR PI simulations',
    'Career Profile (userIntroduction) added to settingsStore',
    'InterviewSession tracking added to activityStore (Firestore + AsyncStorage)',
    'Interview analytics section added to Insights tab',
  ],
  4: [
    'Generalized PSUConfig → ExamConfig; examType now PSU/Boards/Entrance/SSC',
    'Added Categories (PSU, Schooling) + categoryId to user profile',
    'Added Schooling exams — Class 9, 10, 11, 12 (CBSE/NCERT, Boards)',
    'Added numeric difficultyRange (1–10) to exams for cross-exam question pooling',
    'Added complete Schooling syllabus — all subjects, full NCERT chapters (Class 9–12)',
  ],
  5: [
    'Categories now synced from Firestore — new categories (Entrance, SSC, …) deploy without APK update',
    'Uploaded CATEGORIES to Firestore categories/ collection',
    'configStore now fetches categories alongside psus/branches and caches to AsyncStorage',
  ],
};

// ─── Status check ─────────────────────────────────────────────────────────────

export interface MigrationStatus {
  /** Version stored in Firestore, or null if never migrated. */
  firestoreConfigVersion: number | null;
  /** App version stored in Firestore during last migration, or null. */
  firestoreAppVersion: string | null;
  /** Current CONFIG_VERSION constant in app code. */
  localConfigVersion: number;
  /** Current app version from app.json / expo config. */
  localAppVersion: string;
  /** Config data is behind — PSU/branch/syllabus needs re-upload. */
  isConfigStale: boolean;
  /** App version recorded in Firestore doesn't match current build. */
  isAppVersionStale: boolean;
  /** List of changelog lines not yet in Firestore. */
  pendingChanges: string[];
  /** ISO timestamp of last migration, or null. */
  lastMigratedAt: string | null;
}

export async function checkMigrationStatus(): Promise<MigrationStatus> {
  const localAppVersion = Constants.expoConfig?.version ?? '1.0.0';

  const snap = await getDoc(doc(db, 'metadata', 'config_version'));

  if (!snap.exists()) {
    // Never migrated — all changes pending
    const pendingChanges: string[] = [];
    for (let v = 1; v <= CONFIG_VERSION; v++) {
      (CONFIG_CHANGELOG[v] ?? []).forEach(c => pendingChanges.push(`v${v}: ${c}`));
    }
    return {
      firestoreConfigVersion: null,
      firestoreAppVersion: null,
      localConfigVersion: CONFIG_VERSION,
      localAppVersion,
      isConfigStale: true,
      isAppVersionStale: true,
      pendingChanges,
      lastMigratedAt: null,
    };
  }

  const d = snap.data();
  const firestoreConfigVersion: number = typeof d.version === 'number' ? d.version : 0;
  const firestoreAppVersion: string | null = d.appVersion ?? null;
  const isConfigStale = CONFIG_VERSION > firestoreConfigVersion;
  const isAppVersionStale = firestoreAppVersion !== localAppVersion;

  // Collect changelog items for versions not yet in Firestore
  const pendingChanges: string[] = [];
  for (let v = firestoreConfigVersion + 1; v <= CONFIG_VERSION; v++) {
    (CONFIG_CHANGELOG[v] ?? []).forEach(c => pendingChanges.push(`v${v}: ${c}`));
  }

  return {
    firestoreConfigVersion,
    firestoreAppVersion,
    localConfigVersion: CONFIG_VERSION,
    localAppVersion,
    isConfigStale,
    isAppVersionStale,
    pendingChanges,
    lastMigratedAt: d.updatedAt ?? null,
  };
}

// ─── Migration runner ─────────────────────────────────────────────────────────

export const migrateStaticToFirebase = async () => {
  console.log('[Migration] Starting... CONFIG_VERSION =', CONFIG_VERSION);

  // 1. Upload Categories
  for (const cat of CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), cat);
  }
  console.log('[Migration] Categories done');

  // 2. Upload PSUs
  for (const psu of PSUS) {
    await setDoc(doc(db, 'psus', psu.id), psu);
  }
  console.log('[Migration] PSUs done');

  // 3. Upload Branches
  for (const branch of BRANCHES) {
    await setDoc(doc(db, 'branches', branch.id), branch);
  }
  console.log('[Migration] Branches done');

  // 4. Upload Aptitude Syllabus
  const aptitudeGroups = [
    { id: 'quant', topics: quantTopics },
    { id: 'reasoning', topics: reasoningTopics },
    { id: 'english', topics: englishTopics },
    { id: 'gk', topics: gkTopics },
  ];
  for (const group of aptitudeGroups) {
    for (const topic of group.topics) {
      await setDoc(doc(db, 'syllabus', `${group.id}_${topic.id}`), {
        ...topic,
        sectionId: group.id,
      });
    }
  }
  console.log('[Migration] Aptitude syllabus done');

  // 5. Upload Domain Syllabus
  for (const [branchId, topics] of Object.entries(domainTopicMap)) {
    for (const topic of topics) {
      await setDoc(doc(db, 'syllabus', `technical_${branchId}_${topic.id}`), {
        ...topic,
        sectionId: 'technical',
        branchId,
      });
    }
  }
  console.log('[Migration] Domain syllabus done');

  // 5b. Upload Schooling Syllabus (section id is the unique key, e.g. sci9, phy11)
  for (const [sectionId, topics] of Object.entries(schoolingTopicMap)) {
    for (const topic of topics) {
      await setDoc(doc(db, 'syllabus', `${sectionId}_${topic.id}`), {
        ...topic,
        sectionId,
      });
    }
  }
  console.log('[Migration] Schooling syllabus done');

  // 6. Write version metadata (includes app version for status tracking)
  await setDoc(doc(db, 'metadata', 'config_version'), {
    version: CONFIG_VERSION,
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
    updatedAt: new Date().toISOString(),
  });

  // 7. Seed app_config (merge — won't overwrite existing values)
  await setDoc(doc(db, 'app_config', 'maintenance'), {
    maintenance_mode: false,
    maintenance_message: 'We are making improvements. Please check back shortly.',
  }, { merge: true });

  await setDoc(doc(db, 'app_config', 'update'), {
    version: '',
    apk_url: '',
    force_update: false,
    release_notes: [],
  }, { merge: true });

  await setDoc(doc(db, 'app_config', 'whats_new'), {
    items: [],
  }, { merge: true });

  console.log('[Migration] app_config seeded');
  console.log('[Migration] Complete!');
};
