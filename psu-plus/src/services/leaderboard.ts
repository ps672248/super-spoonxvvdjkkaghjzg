/**
 * Leaderboard service — aggregates the per-user game data that activityStore
 * already writes (users/{uid}/sessions) into public, rankable boards.
 *
 * Boards are mode-agnostic and time-bucketed:
 *   leaderboards/{metric}_{window}/scores/{uid} = { uid, name, branchId, value, updatedAt }
 *     metric : "global_correct" | <GameMode>   (mario, slasher, … new modes plug in free)
 *     window : "W<epochWeek>"  (weekly, auto-resets) | "alltime"
 *
 * Weekly buckets reset automatically (new week = new collection, no cron) and keep
 * the board catchable — the whole point of the FOMO loop. value semantics:
 *   global_correct → SUM of correct answers
 *   <game mode>    → BEST (max) single-game score
 *
 * Writes are client-side, recomputed from local sessions (idempotent, self-healing),
 * and bounded by Firestore Security Rules (owner-only, value cap). No Cloud Functions.
 */

import {
  collection, doc, getDocs, writeBatch, query, orderBy, limit, where,
  getCountFromServer,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { isEmbed } from '../utils/embed';
import type { GameMode } from '../stores/examStore';
import type { StudySession } from '../stores/activityStore';

// ─── Config ──────────────────────────────────────────────────────────────────

export type BoardWindow = 'week' | 'alltime';
export type BoardMetric = 'global_correct' | GameMode;

/** Game modes that get their own best-score board. */
export const SCORE_BOARDS: GameMode[] = ['mario', 'slasher', 'tsunami'];

/** Must match the cap in firestore.rules. Clamp client-side too. */
const VALUE_CAP = 1_000_000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface BoardEntry {
  uid: string;
  name: string;
  branchId: string;
  value: number;
  updatedAt: number;
}

// ─── Week bucketing (UTC epoch-week → timezone-independent, all users agree) ──

export function currentWeek(): { id: string; startMs: number } {
  const idx = Math.floor(Date.now() / WEEK_MS);
  return { id: `W${idx}`, startMs: idx * WEEK_MS };
}

function windowToken(window: BoardWindow): string {
  return window === 'week' ? currentWeek().id : 'alltime';
}

function boardId(metric: BoardMetric, window: BoardWindow): string {
  return `${metric}_${windowToken(window)}`;
}

function scoresCol(metric: BoardMetric, window: BoardWindow) {
  return collection(db, 'leaderboards', boardId(metric, window), 'scores');
}

// ─── Compute values from local sessions ──────────────────────────────────────

function clamp(v: number): number {
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(Math.round(v), VALUE_CAP);
}

/** Total correct answers (all-time + this week). */
function correctTotals(sessions: StudySession[], weekStart: number) {
  let all = 0, week = 0;
  for (const s of sessions) {
    all += s.questionsCorrect;
    if (s.timestamp >= weekStart) week += s.questionsCorrect;
  }
  return { all: clamp(all), week: clamp(week) };
}

/** Best (max) single-game score for one mode (all-time + this week). */
function bestScore(sessions: StudySession[], mode: GameMode, weekStart: number) {
  let all = 0, week = 0;
  for (const s of sessions) {
    if (s.gameMode !== mode) continue;
    if (s.score > all) all = s.score;
    if (s.timestamp >= weekStart && s.score > week) week = s.score;
  }
  return { all: clamp(all), week: clamp(week) };
}

// ─── Write: upsert on game over ──────────────────────────────────────────────

/**
 * Recompute this user's board values from local sessions and write them.
 * Writes the global-correct board (always) + the board for the mode just played.
 * No-op for guests (no uid) and embed/iframe demo users.
 * Fire-and-forget from the caller — never block the results screen.
 */
export async function upsertLeaderboard(
  playedMode: GameMode,
  name: string,
  branchId: string,
  sessions: StudySession[],
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || isEmbed()) return;

  const { startMs } = currentWeek();
  const displayName = (name?.trim() || 'Aspirant').slice(0, 40);
  const meta = { uid, name: displayName, branchId: branchId || '', updatedAt: Date.now() };

  const correct = correctTotals(sessions, startMs);
  const batch = writeBatch(db);

  // Global correct-answers board (week + all-time)
  batch.set(doc(scoresCol('global_correct', 'week'), uid), { ...meta, value: correct.week });
  batch.set(doc(scoresCol('global_correct', 'alltime'), uid), { ...meta, value: correct.all });

  // Per-game best-score board for the mode just played (only if it's a score board)
  if (SCORE_BOARDS.includes(playedMode)) {
    const best = bestScore(sessions, playedMode, startMs);
    batch.set(doc(scoresCol(playedMode, 'week'), uid), { ...meta, value: best.week });
    batch.set(doc(scoresCol(playedMode, 'alltime'), uid), { ...meta, value: best.all });
  }

  try {
    await batch.commit();
  } catch (e) {
    // Offline / transient — local sessions stay correct, next game over re-syncs.
    console.warn('[Leaderboard] upsert failed:', e);
  }
}

/**
 * Write ALL boards from full history (global + every score board, week + all-time).
 * Used on sign-in so a guest's accumulated grind lands on the board at once.
 * No-op for guests/embed.
 */
export async function syncAllLeaderboards(
  name: string,
  branchId: string,
  sessions: StudySession[],
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || isEmbed()) return;

  const { startMs } = currentWeek();
  const displayName = (name?.trim() || 'Aspirant').slice(0, 40);
  const meta = { uid, name: displayName, branchId: branchId || '', updatedAt: Date.now() };

  const correct = correctTotals(sessions, startMs);
  const batch = writeBatch(db);
  batch.set(doc(scoresCol('global_correct', 'week'), uid), { ...meta, value: correct.week });
  batch.set(doc(scoresCol('global_correct', 'alltime'), uid), { ...meta, value: correct.all });

  for (const mode of SCORE_BOARDS) {
    const best = bestScore(sessions, mode, startMs);
    if (best.all <= 0) continue; // never played this mode → no entry
    batch.set(doc(scoresCol(mode, 'week'), uid), { ...meta, value: best.week });
    batch.set(doc(scoresCol(mode, 'alltime'), uid), { ...meta, value: best.all });
  }

  try {
    await batch.commit();
  } catch (e) {
    console.warn('[Leaderboard] full sync failed:', e);
  }
}

// ─── Read: board + my rank ───────────────────────────────────────────────────

/** Top N entries for a board, highest value first. */
export async function fetchBoard(
  metric: BoardMetric,
  window: BoardWindow,
  top = 100,
): Promise<BoardEntry[]> {
  const q = query(scoresCol(metric, window), orderBy('value', 'desc'), limit(top));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as BoardEntry);
}

/** This user's rank (1-based) = count of entries with a strictly higher value + 1. */
export async function fetchMyRank(
  metric: BoardMetric,
  window: BoardWindow,
  myValue: number,
): Promise<number> {
  if (myValue <= 0) return 0; // not on the board yet
  const q = query(scoresCol(metric, window), where('value', '>', myValue));
  const snap = await getCountFromServer(q);
  return snap.data().count + 1;
}

/** The single entry just above this user — the "X to overtake" target. */
export async function fetchOvertakeTarget(
  metric: BoardMetric,
  window: BoardWindow,
  myValue: number,
): Promise<BoardEntry | null> {
  const q = query(
    scoresCol(metric, window),
    where('value', '>', myValue),
    orderBy('value', 'asc'),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as BoardEntry);
}

// ─── Local helpers for the UI (compute my own values without a read) ─────────

export function myValueFor(
  sessions: StudySession[],
  metric: BoardMetric,
  window: BoardWindow,
): number {
  const { startMs } = currentWeek();
  if (metric === 'global_correct') {
    const t = correctTotals(sessions, startMs);
    return window === 'week' ? t.week : t.all;
  }
  const b = bestScore(sessions, metric as GameMode, startMs);
  return window === 'week' ? b.week : b.all;
}
