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
const OVERFETCH = 4; // pull more than needed, then shuffle + dedup client-side

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
 * Fetch banked questions for a key, within a difficulty range, excluding texts
 * the user has already seen. Returns the stored `payload` objects (already in the
 * app's MCQQuestion / TFStatement / MatchChallenge shape). `[]` if too sparse.
 */
export async function fetchFromBank(
  bankKey: string,
  range: [number, number],
  count: number,
  seenTexts: string[] = [],
): Promise<any[]> {
  const [minD, maxD] = range;
  const q = query(
    collection(db, COLLECTION),
    where('bankKey', '==', bankKey),
    where('hidden', '==', false),
    where('difficulty', '>=', minD),
    where('difficulty', '<=', maxD),
    orderBy('difficulty'),
    limit(count * OVERFETCH),
  );

  const snap = await getDocs(q);
  const seen = new Set(seenTexts);
  const items = snap.docs
    .map(d => d.data())
    .filter(d => d && d.payload)
    .map(d => d.payload as any)
    .filter(p => {
      const text: string = p.question ?? p.statement ?? '';
      return !text || !seen.has(text);
    });

  // Fisher–Yates shuffle so repeated keyless sessions vary their ordering.
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

/** Report a wrong/low-quality question. Returns true on a 2xx response. */
export async function reportToBank(questionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BANK_BASE_URL}/reportQuestion`, {
      method: 'POST',
      headers: bankHeaders(),
      body: JSON.stringify({ questionId }),
    });
    return res.ok;
  } catch (e) {
    console.warn('[questionBank] report failed:', e);
    return false;
  }
}
