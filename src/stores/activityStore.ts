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
  collection, doc, setDoc, getDocs, writeBatch,
} from 'firebase/firestore';
import type { GameMode } from './examStore';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  isLoaded: boolean;

  /** Call after every game ends */
  logSession: (data: Omit<StudySession, 'id' | 'timestamp'>) => Promise<void>;

  /** Load local; merge with Firestore if logged in */
  loadSessions: () => Promise<void>;

  /** Compute PSU → Branch → Section → Topic graph from raw sessions */
  getGraph: () => ActivityGraph;
}

// ─── Firestore path ───────────────────────────────────────────────────────────

const sessionsCol = (uid: string) =>
  collection(db, 'users', uid, 'sessions');
const sessionDocRef = (uid: string, sessionId: string) =>
  doc(db, 'users', uid, 'sessions', sessionId);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'psuplus_activity';

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
  isLoaded: false,

  // ── Log one session ─────────────────────────────────────────────────────────
  logSession: async (data) => {
    const session: StudySession = {
      ...data,
      id: genId(),
      timestamp: Date.now(),
    };

    const updated = [...get().sessions, session];
    set({ sessions: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await setDoc(sessionDocRef(uid, session.id), session);
      } catch (e) {
        console.warn('[Activity] Firestore write failed:', e);
      }
    }
  },

  // ── Load + cloud merge ──────────────────────────────────────────────────────
  loadSessions: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: StudySession[] = raw ? JSON.parse(raw) : [];

    const uid = auth.currentUser?.uid;
    if (!uid) {
      set({ sessions: local, isLoaded: true });
      return;
    }

    try {
      const snap = await getDocs(sessionsCol(uid));
      const cloud = snap.docs.map(d => d.data()) as StudySession[];

      // Merge: deduplicate by id, keep all unique
      const idMap = new Map<string, StudySession>();
      for (const s of local) idMap.set(s.id, s);
      for (const s of cloud) {
        if (!idMap.has(s.id)) idMap.set(s.id, s);
      }
      const merged = Array.from(idMap.values())
        .sort((a, b) => b.timestamp - a.timestamp);

      // Batch-upload any local-only sessions to Firestore
      const cloudIds = new Set(cloud.map(s => s.id));
      const localOnly = local.filter(s => !cloudIds.has(s.id));
      if (localOnly.length > 0) {
        const batch = writeBatch(db);
        localOnly.forEach(s => batch.set(sessionDocRef(uid, s.id), s));
        await batch.commit();
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      set({ sessions: merged, isLoaded: true });
    } catch (e) {
      console.warn('[Activity] Cloud sync failed, using local:', e);
      set({ sessions: local, isLoaded: true });
    }
  },

  // ── Compute graph ───────────────────────────────────────────────────────────
  getGraph: () => buildGraph(get().sessions),
}));
