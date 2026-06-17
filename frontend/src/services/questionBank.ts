import { db } from '@/config/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// ── Backend base URL (validated writes live server-side; reads are direct) ────
// Override via EXPO_PUBLIC_QUESTION_BANK_URL for staging/prod.
const BANK_BASE_URL =
  process.env.EXPO_PUBLIC_QUESTION_BANK_URL || 'https://aspirant-arcade-backend.onrender.com';

// Optional shared secret — must match the backend's SUBMIT_SECRET when set.
const BANK_SECRET = process.env.EXPO_PUBLIC_QUESTION_BANK_SECRET || '';
function bankHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (BANK_SECRET) h['x-bank-secret'] = BANK_SECRET;
  return h;
}

const COLLECTION = 'question_bank';

export type BankType = 'mcq' | 'tf' | 'match';

/** The 4 MCQ-shaped game modes share one bank type; tsunami=tf, match=match. */
export function gameModeToType(mode: string): BankType {
  if (mode === 'tsunami') return 'tf';
  if (mode === 'match') return 'match';
  return 'mcq'; // mcq, survival, slasher, mario
}

/** Composite key — deliberately excludes exam id and difficulty (see plan). */
export function buildBankKey(branchId: string, sectionId: string, topicId: string, type: BankType): string {
  return `${branchId}_${sectionId}_${topicId}_${type}`;
}

export type BankMeta = {
  branchId: string;
  sectionId: string;
  topicId: string;
  type: BankType;
  sourceExamId: string;
  difficultyRange: [number, number]; // [min, max] 1–10
};

/**
 * Fetch banked questions for a key using a random cursor — different questions
 * each session. Uses `rand` field (stored at insert time) with a wrap-around
 * second pass so the full bank is reachable regardless of cursor position.
 * Difficulty is filtered client-side; seen texts are excluded.
 */
export async function fetchFromBank(
  bankKey: string,
  range: [number, number],
  count: number,
  seenTexts: string[] = [],
): Promise<any[]> {
  const [minD, maxD] = range;
  const seen = new Set(seenTexts);
  const r = Math.random();

  // Overfetch slightly to absorb difficulty + seen filtering losses
  const fetchLimit = Math.ceil(count * 2);

  function extractPayloads(snap: any): any[] {
    return snap.docs
      .map((d: any) => d.data())
      .filter((d: any) => d && d.payload)
      .map((d: any) => d.payload as any)
      .filter((p: any) => {
        const text: string = p.question ?? p.statement ?? '';
        return !text || !seen.has(text);
      });
  }

  // Primary pass: rand >= r within difficulty range
  // orderBy('difficulty') required before orderBy('rand') when difficulty has inequality filter
  const primary = query(
    collection(db, COLLECTION),
    where('bankKey', '==', bankKey),
    where('hidden', '==', false),
    where('difficulty', '>=', minD),
    where('difficulty', '<=', maxD),
    where('rand', '>=', r),
    orderBy('difficulty'),
    orderBy('rand'),
    limit(fetchLimit),
  );
  const snap1 = await getDocs(primary);
  const items = extractPayloads(snap1);

  // Wrap-around: rand < r, same difficulty range
  if (items.length < count) {
    const wrap = query(
      collection(db, COLLECTION),
      where('bankKey', '==', bankKey),
      where('hidden', '==', false),
      where('difficulty', '>=', minD),
      where('difficulty', '<=', maxD),
      where('rand', '<', r),
      orderBy('difficulty'),
      orderBy('rand'),
      limit(fetchLimit - items.length),
    );
    const snap2 = await getDocs(wrap);
    items.push(...extractPayloads(snap2));
  }

  // Shuffle to mix primary + wrap results
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items.slice(0, count);
}

/** Fire-and-forget: persist a freshly generated batch. Never throws to callers. */
export async function submitToBank(meta: BankMeta, questions: any[]): Promise<void> {
  if (!questions || questions.length === 0) return;
  const bankKey = buildBankKey(meta.branchId, meta.sectionId, meta.topicId, meta.type);
  try {
    await fetch(`${BANK_BASE_URL}/submitQuestions`, {
      method: 'POST',
      headers: bankHeaders(),
      body: JSON.stringify({ bankKey, meta, questions }),
    });
  } catch (e) {
    console.warn('[questionBank] submit failed (ignored):', e);
  }
}

export type ReportResult = 'ok' | 'not_in_bank' | 'error';

/** Report a wrong/low-quality question. */
export async function reportToBank(questionId: string): Promise<ReportResult> {
  console.log('[questionBank] reportToBank →', questionId, 'url:', `${BANK_BASE_URL}/reportQuestion`);
  try {
    const res = await fetch(`${BANK_BASE_URL}/reportQuestion`, {
      method: 'POST',
      headers: bankHeaders(),
      body: JSON.stringify({ questionId }),
    });
    console.log('[questionBank] reportToBank status:', res.status);
    if (res.ok) return 'ok';
    if (res.status === 404) {
      console.warn('[questionBank] reportToBank 404 — question not yet in bank:', questionId);
      return 'not_in_bank';
    }
    const body = await res.text().catch(() => '(unreadable)');
    console.warn('[questionBank] reportToBank non-ok:', res.status, body);
    return 'error';
  } catch (e) {
    console.warn('[questionBank] reportToBank network error:', e);
    return 'error';
  }
}

/** Undo a report — decrements reportCount by 1. Returns true on 2xx. */
export async function unflagFromBank(questionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BANK_BASE_URL}/unflagQuestion`, {
      method: 'POST',
      headers: bankHeaders(),
      body: JSON.stringify({ questionId }),
    });
    return res.ok;
  } catch (e) {
    console.warn('[questionBank] unflag failed:', e);
    return false;
  }
}

/** Admin: update question payload + clear all flags. Omit payload to only clear flags. */
export async function editQuestionInBank(questionId: string, payload?: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch(`${BANK_BASE_URL}/editQuestion`, {
      method: 'POST',
      headers: bankHeaders(),
      body: JSON.stringify({ questionId, ...(payload ? { payload } : {}) }),
    });
    return res.ok;
  } catch (e) {
    console.warn('[questionBank] edit failed:', e);
    return false;
  }
}
