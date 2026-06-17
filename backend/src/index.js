import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

// ── Firebase Admin init ───────────────────────────────────────────────────────
// Credentials come from either an inline JSON env var (hosted envs) or a file
// pointed to by GOOGLE_APPLICATION_CREDENTIALS.
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';
  return JSON.parse(readFileSync(path, 'utf8'));
}

admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount()) });
const db = admin.firestore();

const BANK = 'question_bank';
const REPORT_HIDE_THRESHOLD = 3;

// Shared-secret gate. When SUBMIT_SECRET is set, write/report calls must carry a
// matching `x-bank-secret` header. (The app ships it via EXPO_PUBLIC_QUESTION_BANK_SECRET.)
// Note: an EXPO_PUBLIC value is extractable from the client bundle, so this only
// blocks casual/bot abuse — use Firebase App Check for strong protection.
const SUBMIT_SECRET = process.env.SUBMIT_SECRET || '';
function checkSecret(req, res) {
  if (SUBMIT_SECRET && req.get('x-bank-secret') !== SUBMIT_SECRET) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

// ── Deterministic content hash — MUST match frontend gemini.ts hashContent ────
// Same question text → same id → idempotent writes, no duplicates.
function hashContent(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (((h << 5) + h) ^ text.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

// ── Shape validation — ported from frontend gemini.ts (isValidMCQ / isValidTF) ─
function isValidMCQ(q) {
  if (!q || typeof q.question !== 'string' || !q.question.trim()) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (!q.options.every(o => typeof o === 'string' && o.trim().length > 0)) return false;
  const c = (q.correct || '').trim().toUpperCase()[0];
  return !!c && ['A', 'B', 'C', 'D'].includes(c);
}

function isValidTF(s) {
  return !!s && typeof s.statement === 'string' && s.statement.trim().length > 0
    && typeof s.isTrue === 'boolean';
}

function isValidMatch(c) {
  if (!c || !Array.isArray(c.pairs) || c.pairs.length < 2) return false;
  return c.pairs.every(p =>
    p && typeof p.left === 'string' && p.left.trim() && typeof p.right === 'string' && p.right.trim());
}

/** Returns the text used for the content hash, per question type. */
function questionText(type, q) {
  if (type === 'mcq') return q.question;
  if (type === 'tf') return q.statement;
  if (type === 'match') return Array.isArray(q.pairs) ? q.pairs.map(p => p.left + p.right).join('|') : '';
  return '';
}

function validateByType(type, q) {
  if (type === 'mcq') return isValidMCQ(q);
  if (type === 'tf') return isValidTF(q);
  if (type === 'match') return isValidMatch(q);
  return false;
}

function clampDifficulty(value, fallback = 5) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(10, Math.max(1, n));
}

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '1mb' }));

const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(allowed.length ? { origin: allowed } : {}));

app.get('/', (_req, res) => res.json({ ok: true, service: 'question-bank' }));

/**
 * POST /submitQuestions
 * body: { bankKey, meta: { branchId, sectionId, topicId, type, sourceExamId, difficulty? }, questions: [...] }
 * Validates each question server-side, writes idempotently (create-only) so re-submits
 * never clobber reportCount/hidden. type ∈ "mcq" | "tf" | "match".
 */
app.post('/submitQuestions', async (req, res) => {
  try {
    if (!checkSecret(req, res)) return;
    const { bankKey, meta, questions } = req.body || {};
    if (!bankKey || !meta || !meta.type || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'bankKey, meta.type and questions[] required' });
    }
    const { type, branchId, sectionId, topicId, sourceExamId } = meta;
    if (!['mcq', 'tf', 'match'].includes(type)) {
      return res.status(400).json({ error: `invalid type: ${type}` });
    }

    let written = 0, skipped = 0;
    await Promise.all(questions.map(async (q) => {
      if (!validateByType(type, q)) { skipped++; return; }
      const text = questionText(type, q);
      if (!text || !text.trim()) { skipped++; return; }
      const id = hashContent(text);
      const doc = {
        bankKey,
        branchId: branchId ?? null,
        sectionId: sectionId ?? null,
        topicId: topicId ?? null,
        type,
        difficulty: clampDifficulty(q.difficulty ?? meta.difficulty),
        payload: q,
        sourceExamId: sourceExamId ?? null,
        rand: Math.random(),
        reportCount: 0,
        hidden: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      try {
        await db.collection(BANK).doc(id).create(doc); // create-only → idempotent
        written++;
      } catch (e) {
        if (e.code === 6 /* ALREADY_EXISTS */) skipped++;
        else throw e;
      }
    }));

    return res.json({ written, skipped });
  } catch (e) {
    console.error('[submitQuestions]', e);
    return res.status(500).json({ error: 'internal error' });
  }
});

/**
 * POST /reportQuestion
 * body: { questionId }
 * Increments reportCount; hides the question once it crosses the threshold.
 */
app.post('/reportQuestion', async (req, res) => {
  try {
    if (!checkSecret(req, res)) return;
    const { questionId } = req.body || {};
    if (!questionId) return res.status(400).json({ error: 'questionId required' });

    const ref = db.collection(BANK).doc(questionId);
    const newCount = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw Object.assign(new Error('not found'), { http: 404 });
      const count = (snap.get('reportCount') || 0) + 1;
      tx.update(ref, { reportCount: count, hidden: count >= REPORT_HIDE_THRESHOLD });
      return count;
    });

    return res.json({ reportCount: newCount, hidden: newCount >= REPORT_HIDE_THRESHOLD });
  } catch (e) {
    if (e.http === 404) return res.status(404).json({ error: 'not found' });
    console.error('[reportQuestion]', e);
    return res.status(500).json({ error: 'internal error' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`[question-bank] listening on :${port}`));
