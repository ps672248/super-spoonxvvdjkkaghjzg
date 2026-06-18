/**
 * Activity Store — tracks every game session for analytics.
 * Local-first (AsyncStorage). Syncs to Firestore when user is logged in.
 *
 * Graph shape:  PSU → Branch → Section → Topic
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import {
  collection, doc, setDoc, getDocs, writeBatch, query, limit,
} from 'firebase/firestore';
import type { GameMode } from './examStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InterviewSession {
  id: string;
  psuId: string;
  psuName: string;
  branchId: string;
  branchName: string;
  type: 'gd' | 'technical' | 'hr';
  timestamp: number;
  /** 1–10 overall rating parsed from Gemini SUMMARY_JSON */
  overallRating: number;
  /** Top 2–3 strengths from Gemini summary */
  strengths: string[];
  /** Top 2–3 improvement areas from Gemini summary */
  improvements: string[];
  /** Full Gemini summary narrative (for display in insights) */
  summaryText: string;
  /** GD discussion topic (only set for type === 'gd') */
  topic?: string;
}

export interface StudySession {
  id: string;               // timestamp36 + random
  psuId: string;
  psuName: string;
  branchId: string;
  branchName: string;
  sections: string[];       // section IDs e.g. ['quant', 'technical']
  topics: string[];         // topic IDs
  gameMode: GameMode;
  questionsTotal: number;
  questionsCorrect: number;
  score: number;
  timestamp: number;        // Date.now()
}

// ── Graph nodes ───────────────────────────────────────────────────────────────

export interface TopicStat {
  topicId: string;
  sessions: number;
  questionsTotal: number;
  questionsCorrect: number;
  accuracy: number;         // 0–100
  lastPlayed: number;
}

export interface SectionStat {
  sectionId: string;
  sessions: number;
  questionsTotal: number;
  questionsCorrect: number;
  accuracy: number;
  lastPlayed: number;
  topics: TopicStat[];
}

export interface BranchStat {
  branchId: string;
  branchName: string;
  sessions: number;
  questionsTotal: number;
  questionsCorrect: number;
  accuracy: number;
  lastPlayed: number;
  sections: SectionStat[];
}

export interface PSUStat {
  psuId: string;
  psuName: string;
  sessions: number;
  questionsTotal: number;
  questionsCorrect: number;
  accuracy: number;
  lastPlayed: number;
  branches: BranchStat[];
}

export type ActivityGraph = PSUStat[];

// ─── Store ────────────────────────────────────────────────────────────────────

interface ActivityState {
  sessions: StudySession[];
  interviewSessions: InterviewSession[];
  isLoaded: boolean;
  isSyncing: boolean;

  /** Call after every game ends */
  logSession: (data: Omit<StudySession, 'id' | 'timestamp'>) => Promise<void>;

  /** Call after every interview session ends */
  logInterviewSession: (data: Omit<InterviewSession, 'id' | 'timestamp'>) => Promise<void>;

  /** Load local; merge with Firestore if logged in */
  loadSessions: () => Promise<void>;

  /** Compute PSU → Branch → Section → Topic graph from raw sessions */
  getGraph: () => ActivityGraph;

  hasGuestData: () => Promise<boolean>;
  hasCloudData: (uid: string) => Promise<boolean>;
  mergeGuestIntoUser: (uid: string) => Promise<void>;
  discardGuestData: () => Promise<void>;
}

// ─── Firestore paths ──────────────────────────────────────────────────────────

const sessionsCol = (uid: string) =>
  collection(db, 'users', uid, 'sessions');
const sessionDocRef = (uid: string, sessionId: string) =>
  doc(db, 'users', uid, 'sessions', sessionId);

const interviewSessionsCol = (uid: string) =>
  collection(db, 'users', uid, 'interviewSessions');
const interviewSessionDocRef = (uid: string, sessionId: string) =>
  doc(db, 'users', uid, 'interviewSessions', sessionId);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GUEST_STUDY_KEY     = 'psuplus_activity_guest';
const GUEST_INTERVIEW_KEY = 'psuplus_activity_interview_guest';
const userStudyKey     = (uid: string) => `psuplus_activity_${uid}`;
const userInterviewKey = (uid: string) => `psuplus_activity_interview_${uid}`;

const getKeys = () => {
  const uid = auth.currentUser?.uid;
  return uid
    ? { studyKey: userStudyKey(uid), interviewKey: userInterviewKey(uid) }
    : { studyKey: GUEST_STUDY_KEY, interviewKey: GUEST_INTERVIEW_KEY };
};

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function pct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// ─── Graph builder ────────────────────────────────────────────────────────────

function buildGraph(sessions: StudySession[]): ActivityGraph {
  // psuId → BranchId → SectionId → TopicId accumulators
  const psuMap = new Map<string, {
    psuName: string;
    branchMap: Map<string, {
      branchName: string;
      sectionMap: Map<string, {
        topicMap: Map<string, { qT: number; qC: number; sessions: number; last: number }>;
        qT: number; qC: number; sessions: number; last: number;
      }>;
      qT: number; qC: number; sessions: number; last: number;
    }>;
    qT: number; qC: number; sessions: number; last: number;
  }>();

  for (const s of sessions) {
    // ── PSU ──
    if (!psuMap.has(s.psuId)) {
      psuMap.set(s.psuId, {
        psuName: s.psuName,
        branchMap: new Map(),
        qT: 0, qC: 0, sessions: 0, last: 0,
      });
    }
    const psuNode = psuMap.get(s.psuId)!;
    psuNode.qT += s.questionsTotal;
    psuNode.qC += s.questionsCorrect;
    psuNode.sessions += 1;
    if (s.timestamp > psuNode.last) psuNode.last = s.timestamp;

    // ── Branch ──
    if (!psuNode.branchMap.has(s.branchId)) {
      psuNode.branchMap.set(s.branchId, {
        branchName: s.branchName,
        sectionMap: new Map(),
        qT: 0, qC: 0, sessions: 0, last: 0,
      });
    }
    const branchNode = psuNode.branchMap.get(s.branchId)!;
    branchNode.qT += s.questionsTotal;
    branchNode.qC += s.questionsCorrect;
    branchNode.sessions += 1;
    if (s.timestamp > branchNode.last) branchNode.last = s.timestamp;

    // ── Sections → Topics ──
    for (const sectionId of s.sections) {
      if (!branchNode.sectionMap.has(sectionId)) {
        branchNode.sectionMap.set(sectionId, {
          topicMap: new Map(),
          qT: 0, qC: 0, sessions: 0, last: 0,
        });
      }
      const sectionNode = branchNode.sectionMap.get(sectionId)!;
      // Distribute questions evenly across sections (approximation)
      const secShare = Math.round(s.questionsTotal / s.sections.length);
      const secCorrectShare = Math.round(s.questionsCorrect / s.sections.length);
      sectionNode.qT += secShare;
      sectionNode.qC += secCorrectShare;
      sectionNode.sessions += 1;
      if (s.timestamp > sectionNode.last) sectionNode.last = s.timestamp;

      for (const topicId of s.topics) {
        if (!sectionNode.topicMap.has(topicId)) {
          sectionNode.topicMap.set(topicId, { qT: 0, qC: 0, sessions: 0, last: 0 });
        }
        const topicNode = sectionNode.topicMap.get(topicId)!;
        const topicShare = s.topics.length > 0
          ? Math.round(secShare / s.topics.length)
          : secShare;
        const topicCorrectShare = s.topics.length > 0
          ? Math.round(secCorrectShare / s.topics.length)
          : secCorrectShare;
        topicNode.qT += topicShare;
        topicNode.qC += topicCorrectShare;
        topicNode.sessions += 1;
        if (s.timestamp > topicNode.last) topicNode.last = s.timestamp;
      }
    }
  }

  // ── Flatten map → typed array ──
  const graph: ActivityGraph = [];

  for (const [psuId, p] of psuMap) {
    const branches: BranchStat[] = [];

    for (const [branchId, b] of p.branchMap) {
      const sections: SectionStat[] = [];

      for (const [sectionId, sec] of b.sectionMap) {
        const topics: TopicStat[] = [];

        for (const [topicId, t] of sec.topicMap) {
          topics.push({
            topicId,
            sessions: t.sessions,
            questionsTotal: t.qT,
            questionsCorrect: t.qC,
            accuracy: pct(t.qC, t.qT),
            lastPlayed: t.last,
          });
        }

        topics.sort((a, b) => b.lastPlayed - a.lastPlayed);

        sections.push({
          sectionId,
          sessions: sec.sessions,
          questionsTotal: sec.qT,
          questionsCorrect: sec.qC,
          accuracy: pct(sec.qC, sec.qT),
          lastPlayed: sec.last,
          topics,
        });
      }

      sections.sort((a, b) => b.lastPlayed - a.lastPlayed);

      branches.push({
        branchId,
        branchName: b.branchName,
        sessions: b.sessions,
        questionsTotal: b.qT,
        questionsCorrect: b.qC,
        accuracy: pct(b.qC, b.qT),
        lastPlayed: b.last,
        sections,
      });
    }

    branches.sort((a, b) => b.lastPlayed - a.lastPlayed);

    graph.push({
      psuId,
      psuName: p.psuName,
      sessions: p.sessions,
      questionsTotal: p.qT,
      questionsCorrect: p.qC,
      accuracy: pct(p.qC, p.qT),
      lastPlayed: p.last,
      branches,
    });
  }

  graph.sort((a, b) => b.lastPlayed - a.lastPlayed);
  return graph;
}

// ─── Zustand store ────────────────────────────────────────────────────────────

export const useActivityStore = create<ActivityState>((set, get) => ({
  sessions: [],
  interviewSessions: [],
  isLoaded: false,
  isSyncing: false,

  // ── Log one session ─────────────────────────────────────────────────────────
  logSession: async (data) => {
    const session: StudySession = { ...data, id: genId(), timestamp: Date.now() };
    const updated = [...get().sessions, session];
    set({ sessions: updated });
    const { studyKey } = getKeys();
    await AsyncStorage.setItem(studyKey, JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await setDoc(sessionDocRef(uid, session.id), session); }
      catch (e) { console.warn('[Activity] Firestore write failed:', e); }
    }
  },

  // ── Log one interview session ────────────────────────────────────────────────
  logInterviewSession: async (data) => {
    const session: InterviewSession = { ...data, id: genId(), timestamp: Date.now() };
    const updated = [...get().interviewSessions, session];
    set({ interviewSessions: updated });
    const { interviewKey } = getKeys();
    await AsyncStorage.setItem(interviewKey, JSON.stringify(updated));
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await setDoc(interviewSessionDocRef(uid, session.id), session); }
      catch (e) { console.warn('[Activity] Firestore interview write failed:', e); }
    }
  },

  // ── Load + cloud merge ──────────────────────────────────────────────────────
  loadSessions: async () => {
    const uid = auth.currentUser?.uid;
    const { studyKey, interviewKey } = getKeys();

    const [rawStudy, rawInterview] = await Promise.all([
      AsyncStorage.getItem(studyKey),
      AsyncStorage.getItem(interviewKey),
    ]);
    const local: StudySession[] = rawStudy ? JSON.parse(rawStudy) : [];
    const localInterview: InterviewSession[] = rawInterview ? JSON.parse(rawInterview) : [];

    // Show local immediately; flag a background sync when signed in.
    set({ sessions: local, interviewSessions: localInterview, isLoaded: true, isSyncing: !!uid });

    if (!uid) return;

    try {
      const [studySnap, interviewSnap] = await Promise.all([
        getDocs(sessionsCol(uid)),
        getDocs(interviewSessionsCol(uid)),
      ]);
      const cloud = studySnap.docs.map(d => d.data()) as StudySession[];
      const cloudInterview = interviewSnap.docs.map(d => d.data()) as InterviewSession[];

      const idMap = new Map<string, StudySession>();
      for (const s of local) idMap.set(s.id, s);
      for (const s of cloud) { if (!idMap.has(s.id)) idMap.set(s.id, s); }
      const merged = Array.from(idMap.values()).sort((a, b) => b.timestamp - a.timestamp);

      const cloudIds = new Set(cloud.map(s => s.id));
      const localOnly = local.filter(s => !cloudIds.has(s.id));
      if (localOnly.length > 0) {
        const batch = writeBatch(db);
        localOnly.forEach(s => batch.set(sessionDocRef(uid, s.id), s));
        await batch.commit();
      }

      const interviewIdMap = new Map<string, InterviewSession>();
      for (const s of localInterview) interviewIdMap.set(s.id, s);
      for (const s of cloudInterview) { if (!interviewIdMap.has(s.id)) interviewIdMap.set(s.id, s); }
      const mergedInterview = Array.from(interviewIdMap.values()).sort((a, b) => b.timestamp - a.timestamp);

      const cloudInterviewIds = new Set(cloudInterview.map(s => s.id));
      const localInterviewOnly = localInterview.filter(s => !cloudInterviewIds.has(s.id));
      if (localInterviewOnly.length > 0) {
        const batch = writeBatch(db);
        localInterviewOnly.forEach(s => batch.set(interviewSessionDocRef(uid, s.id), s));
        await batch.commit();
      }

      await Promise.all([
        AsyncStorage.setItem(studyKey, JSON.stringify(merged)),
        AsyncStorage.setItem(interviewKey, JSON.stringify(mergedInterview)),
      ]);
      set({ sessions: merged, interviewSessions: mergedInterview, isLoaded: true, isSyncing: false });
    } catch (e) {
      console.warn('[Activity] Cloud sync failed, using local:', e);
      set({ sessions: local, interviewSessions: localInterview, isLoaded: true, isSyncing: false });
    }
  },

  // ── Guest migration helpers ────────────────────────────────────────────────
  hasGuestData: async () => {
    const [rawStudy, rawInterview] = await Promise.all([
      AsyncStorage.getItem(GUEST_STUDY_KEY),
      AsyncStorage.getItem(GUEST_INTERVIEW_KEY),
    ]);
    const study: StudySession[] = rawStudy ? JSON.parse(rawStudy) : [];
    const interview: InterviewSession[] = rawInterview ? JSON.parse(rawInterview) : [];
    return study.length > 0 || interview.length > 0;
  },

  hasCloudData: async (uid) => {
    try {
      const [studySnap, interviewSnap] = await Promise.all([
        getDocs(query(sessionsCol(uid), limit(1))),
        getDocs(query(interviewSessionsCol(uid), limit(1))),
      ]);
      return studySnap.size > 0 || interviewSnap.size > 0;
    } catch {
      return false;
    }
  },

  mergeGuestIntoUser: async (uid) => {
    const [rawStudy, rawInterview] = await Promise.all([
      AsyncStorage.getItem(GUEST_STUDY_KEY),
      AsyncStorage.getItem(GUEST_INTERVIEW_KEY),
    ]);
    const guestStudy: StudySession[] = rawStudy ? JSON.parse(rawStudy) : [];
    const guestInterview: InterviewSession[] = rawInterview ? JSON.parse(rawInterview) : [];
    if (guestStudy.length === 0 && guestInterview.length === 0) return;

    const [studySnap, interviewSnap] = await Promise.all([
      getDocs(sessionsCol(uid)),
      getDocs(interviewSessionsCol(uid)),
    ]);
    const cloudStudy = studySnap.docs.map(d => d.data()) as StudySession[];
    const cloudInterview = interviewSnap.docs.map(d => d.data()) as InterviewSession[];

    const studyMap = new Map<string, StudySession>();
    for (const s of cloudStudy) studyMap.set(s.id, s);
    for (const s of guestStudy) { if (!studyMap.has(s.id)) studyMap.set(s.id, s); }
    const mergedStudy = Array.from(studyMap.values()).sort((a, b) => b.timestamp - a.timestamp);

    const interviewMap = new Map<string, InterviewSession>();
    for (const s of cloudInterview) interviewMap.set(s.id, s);
    for (const s of guestInterview) { if (!interviewMap.has(s.id)) interviewMap.set(s.id, s); }
    const mergedInterview = Array.from(interviewMap.values()).sort((a, b) => b.timestamp - a.timestamp);

    const batch = writeBatch(db);
    guestStudy.forEach(s => batch.set(sessionDocRef(uid, s.id), s));
    guestInterview.forEach(s => batch.set(interviewSessionDocRef(uid, s.id), s));
    await batch.commit();

    await Promise.all([
      AsyncStorage.setItem(userStudyKey(uid), JSON.stringify(mergedStudy)),
      AsyncStorage.setItem(userInterviewKey(uid), JSON.stringify(mergedInterview)),
      AsyncStorage.multiRemove([GUEST_STUDY_KEY, GUEST_INTERVIEW_KEY]),
    ]);
  },

  discardGuestData: async () => {
    await AsyncStorage.multiRemove([GUEST_STUDY_KEY, GUEST_INTERVIEW_KEY]);
  },

  // ── Compute graph ───────────────────────────────────────────────────────────
  getGraph: () => buildGraph(get().sessions),
}));
