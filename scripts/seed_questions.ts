/* eslint-disable no-console */
/**
 * Seed the shared question bank.
 *
 * For every (branch · section · topic) in the app's config it generates MCQs at
 * each difficulty level and writes them to Firestore `question_bank`.
 * Progress is tracked in `seed_catalog/{bankKey}` — each doc stores the target
 * question count and how many have been seeded so far. Each run picks the most
 * behind incomplete topics first.
 *
 * Commands:
 *   npm run seed          — seed SEED_TOPICS_PER_RUN topics this run
 *   npm run catalog:init  — one-time: create seed_catalog docs for all units
 *
 * Env:
 *   GEMINI_API_KEYS          comma-separated list; rotated on rate-limit/quota.
 *   FIREBASE_SERVICE_ACCOUNT inline service-account JSON (or GOOGLE_APPLICATION_CREDENTIALS).
 *   SEED_TOPICS_PER_RUN      topics to seed this run (default 1).
 *   SEED_PER_DIFFICULTY      questions per difficulty level (default 10).
 *   SEED_MODEL               Gemini model (default gemini-3.1-flash-lite).
 */

import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import { PSUS } from '../frontend/src/config/psus';
import { BRANCHES } from '../frontend/src/config/branches';
import { getSyllabusTopics } from '../frontend/src/config/syllabus';

// ── Config ────────────────────────────────────────────────────────────────────
const MODEL = process.env.SEED_MODEL || 'gemini-3.1-flash-lite';
const PER_DIFFICULTY = Number(process.env.SEED_PER_DIFFICULTY || 10);
const TOPICS_PER_RUN = Number(process.env.SEED_TOPICS_PER_RUN || 1);
const BANK = 'question_bank';
const CATALOG = 'seed_catalog';

// ── API key pool (rotate on rate-limit / quota) ───────────────────────────────
const KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',').map(s => s.trim()).filter(Boolean);
if (KEYS.length === 0) { console.error('FATAL: set GEMINI_API_KEYS (comma-separated).'); process.exit(1); }

let keyIdx = 0;
const exhausted = new Set<number>();
const currentKey = () => KEYS[keyIdx];
function rotateKey(): boolean {
  exhausted.add(keyIdx);
  if (exhausted.size >= KEYS.length) return false;
  do { keyIdx = (keyIdx + 1) % KEYS.length; } while (exhausted.has(keyIdx));
  return true;
}

class KeysExhausted extends Error { constructor() { super('All API keys exhausted'); } }

// ── Firebase Admin ────────────────────────────────────────────────────────────
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';
  return JSON.parse(readFileSync(p, 'utf8'));
}
admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount()) });
const db = admin.firestore();

// ── Helpers ───────────────────────────────────────────────────────────────────
function hashContent(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (((h << 5) + h) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function isValidMCQ(q: any): boolean {
  if (!q || typeof q.question !== 'string' || !q.question.trim()) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (!q.options.every((o: any) => typeof o === 'string' && o.trim())) return false;
  const c = (q.correct || '').trim().toUpperCase()[0];
  return !!c && ['A', 'B', 'C', 'D'].includes(c);
}

const MCQ_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      question: { type: 'STRING' },
      options: { type: 'ARRAY', items: { type: 'STRING' } },
      correct: { type: 'STRING' },
      explanation: { type: 'STRING' },
    },
    required: ['question', 'options', 'correct', 'explanation'],
  },
};

async function callGemini(prompt: string): Promise<any[]> {
  for (let attempt = 0; attempt <= KEYS.length; attempt++) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${currentKey()}`;
    let res: any;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: MCQ_SCHEMA },
        }),
      });
    } catch (e) {
      if (!rotateKey()) throw new KeysExhausted();
      continue;
    }

    if (res.status === 429) {
      console.warn(`  [key#${keyIdx}] 429 rate-limited → rotating`);
      if (!rotateKey()) throw new KeysExhausted();
      continue;
    }

    const data: any = await res.json().catch(() => ({}));
    if (data.error) {
      const msg = data.error.message || '';
      if (/quota|exhausted|rate|RESOURCE_EXHAUSTED/i.test(msg)) {
        console.warn(`  [key#${keyIdx}] quota error → rotating: ${msg}`);
        if (!rotateKey()) throw new KeysExhausted();
        continue;
      }
      throw new Error(`Gemini error: ${msg}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) { if (!rotateKey()) throw new KeysExhausted(); continue; }
    try { return JSON.parse(text); } catch { /* fall through */ }
    const s = text.indexOf('['), e = text.lastIndexOf(']');
    if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch { /* noop */ } }
    throw new Error('Could not parse JSON from model response');
  }
  throw new KeysExhausted();
}

// ── Build the deduped seed catalogue from app config ─────────────────────────
type Unit = {
  bankKey: string; branchId: string; sectionId: string; topicId: string;
  branchName: string; sectionName: string; topicTitle: string; framing: string; sourceExamId: string;
  difficultyRange: [number, number];
};

function buildUnits(): Unit[] {
  const byKey = new Map<string, Unit>();
  for (const exam of PSUS) {
    const isBoards = exam.examType === 'Boards';
    const framing = isBoards
      ? `CBSE / NCERT ${exam.name} examination`
      : 'Indian PSU (Public Sector Undertaking) competitive exam';
    const branchIds = exam.branches.length ? exam.branches : ['all'];
    for (const branchId of branchIds) {
      const branchName = BRANCHES.find(b => b.id === branchId)?.name || branchId;
      for (const section of exam.sections) {
        // Non-branch-specific sections (aptitude, GK, English) share one bank key
        // regardless of which PSU exam defines them — avoids seeding identical
        // content N times, once per branch.
        const keyBranch = section.branchSpecific ? branchId : 'all';
        const keyBranchName = keyBranch === 'all' ? 'General' : branchName;
        const [lo, hi] = section.difficultyRange;
        const topics = getSyllabusTopics(section.id, keyBranch === 'all' ? undefined : branchId);
        for (const t of topics) {
          const bankKey = `${keyBranch}_${section.id}_${t.id}_mcq`;
          if (byKey.has(bankKey)) {
            const u = byKey.get(bankKey)!;
            u.difficultyRange = [Math.min(u.difficultyRange[0], lo), Math.max(u.difficultyRange[1], hi)];
          } else {
            byKey.set(bankKey, {
              bankKey, branchId: keyBranch, sectionId: section.id, topicId: t.id,
              branchName: keyBranchName, sectionName: section.name, topicTitle: t.title,
              framing, sourceExamId: exam.id,
              difficultyRange: [lo, hi],
            });
          }
        }
      }
    }
  }
  return [...byKey.values()];
}

// ── Seed one topic across its difficulty levels ───────────────────────────────
type SeedResult = { written: number; skipped: number; invalid: number; actualCount: number };

async function seedUnit(u: Unit): Promise<SeedResult> {
  const [lo, hi] = u.difficultyRange;
  const LEVELS = Array.from({ length: hi - lo + 1 }, (_, i) => i + lo);
  const TARGET = LEVELS.length * PER_DIFFICULTY;

  const countSnap = await db.collection(BANK).where('bankKey', '==', u.bankKey).count().get();
  const have = countSnap.data().count;

  let written = 0, skipped = 0, invalid = 0;
  for (const d of LEVELS) {
    let raw: any[];
    try { raw = await callGemini(buildPrompt(u, d, PER_DIFFICULTY)); }
    catch (e: any) {
      if (e instanceof KeysExhausted) throw e;
      console.warn(`  d${d}: generation failed — ${e.message}`);
      continue;
    }
    const valid = (Array.isArray(raw) ? raw : []).filter(isValidMCQ).slice(0, PER_DIFFICULTY);
    invalid += (Array.isArray(raw) ? raw.length : 0) - valid.length;

    await Promise.all(valid.map(async (q: any) => {
      const id = hashContent(q.question);
      const payload = {
        id, question: q.question, options: q.options,
        correct: (q.correct || 'A').trim().toUpperCase()[0],
        explanation: q.explanation || '',
        topicTitle: u.topicTitle, difficulty: d,
      };
      const docData = {
        bankKey: u.bankKey, branchId: u.branchId, sectionId: u.sectionId, topicId: u.topicId,
        type: 'mcq', difficulty: d, payload, sourceExamId: u.sourceExamId,
        rand: Math.random(), reportCount: 0, hidden: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      try { await db.collection(BANK).doc(id).create(docData); written++; }
      catch (e: any) { if (e.code === 6 /* ALREADY_EXISTS */) skipped++; else throw e; }
    }));
    console.log(`  d${d}: +${valid.length}`);
  }
  console.log(`  done — written=${written} dupes=${skipped} invalid=${invalid}`);
  return { written, skipped, invalid, actualCount: have + written };
}

function buildPrompt(u: Unit, d: number, n: number): string {
  const [lo, hi] = u.difficultyRange;
  return `You are an expert question setter for ${u.framing}.
Generate exactly ${n} multiple-choice questions.
Context — Branch/Stream: ${u.branchName}; Section/Subject: ${u.sectionName}; Topic: ${u.topicTitle}.
Difficulty: EXACTLY ${d} on a 1-10 scale (1 = very easy recall, 5 = moderate application, 10 = very hard / olympiad-competitive). This topic's valid range is ${lo}–${hi}. Calibrate precisely to level ${d}.
Rules: exactly 4 options each, labelled "A) ", "B) ", "C) ", "D) "; exactly ONE correct answer; a concise 1-2 sentence explanation.
Return ONLY a JSON array: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}]`;
}

// ── seed_catalog: one doc per bankKey tracking seeded vs target ───────────────
interface CatalogEntry {
  bankKey: string;
  target: number;
  seeded: number;
  lastSeededAt: string | null;
  difficultyRange: [number, number];
}

async function initCatalog(): Promise<void> {
  const units = buildUnits();
  console.log(`\nInitialising seed_catalog — ${units.length} units (model=${MODEL}, per-level=${PER_DIFFICULTY})\n`);

  const existing = new Set<string>();
  (await db.collection(CATALOG).select().get()).forEach(d => existing.add(d.id));
  const toCreate = units.filter(u => !existing.has(u.bankKey));
  console.log(`  existing=${existing.size}  to create=${toCreate.length}`);

  for (let i = 0; i < toCreate.length; i += 500) {
    const batch = db.batch();
    for (const u of toCreate.slice(i, i + 500)) {
      const target = (u.difficultyRange[1] - u.difficultyRange[0] + 1) * PER_DIFFICULTY;
      batch.set(db.collection(CATALOG).doc(u.bankKey), {
        bankKey: u.bankKey,
        target,
        seeded: 0,
        lastSeededAt: null,
        difficultyRange: u.difficultyRange,
      } satisfies CatalogEntry);
    }
    await batch.commit();
    console.log(`  committed ${Math.min(i + 500, toCreate.length)}/${toCreate.length}`);
  }
  console.log(`\nDone. Run 'npm run seed' to start seeding.`);
}

// ── Main: pick most-behind incomplete topics, seed them ──────────────────────
async function main(): Promise<void> {
  const units = buildUnits();
  const unitByKey = new Map(units.map(u => [u.bankKey, u]));

  console.log(`Catalogue: ${units.length} units | model=${MODEL} | keys=${KEYS.length} | per-level=${PER_DIFFICULTY}`);

  const catalogSnap = await db.collection(CATALOG).get();
  if (catalogSnap.empty) {
    console.error('seed_catalog is empty — run: npm run catalog:init');
    process.exit(1);
  }

  const all = catalogSnap.docs.map(d => d.data() as CatalogEntry);

  function printCatalogStats(entries: CatalogEntry[], label: string) {
    const nothing  = entries.filter(e => e.seeded === 0).length;
    const partial  = entries.filter(e => e.seeded > 0 && e.seeded < e.target).length;
    const complete = entries.filter(e => e.seeded >= e.target).length;
    console.log(`${label}: ${nothing} not started | ${partial} partial | ${complete} complete (total ${entries.length})`);
  }

  printCatalogStats(all, 'Start');

  const queue = all
    .filter(e => e.seeded < e.target)
    .sort((a, b) => a.seeded - b.seeded)
    .slice(0, TOPICS_PER_RUN);

  console.log(`Seeding ${queue.length} topic${queue.length === 1 ? '' : 's'} this run\n`);

  if (queue.length === 0) {
    console.log('All topics fully seeded!');
    process.exit(0);
  }

  for (const entry of queue) {
    const u = unitByKey.get(entry.bankKey);
    if (!u) { console.warn(`Catalog entry not in config — skipping: ${entry.bankKey}`); continue; }

    console.log(`[${entry.seeded}/${entry.target}] ${u.bankKey}  (${u.topicTitle})`);

    let result: SeedResult = { written: 0, skipped: 0, invalid: 0, actualCount: entry.seeded };
    try {
      result = await seedUnit(u);
    } catch (e: any) {
      if (e instanceof KeysExhausted) {
        console.error('All API keys exhausted — stopping.');
        break;
      }
      console.error(`Unit failed: ${e.message}`);
    }

    await db.collection(CATALOG).doc(u.bankKey).update({
      seeded: result.actualCount,
      lastSeededAt: new Date().toISOString(),
    });
  }

  // Re-read catalog to show accurate end stats
  const endSnap = await db.collection(CATALOG).get();
  const allEnd = endSnap.docs.map(d => d.data() as CatalogEntry);
  console.log('');
  printCatalogStats(allEnd, 'End');
  console.log('Run complete.');
  process.exit(0);
}

// ── catalog:bump — raise targets so more questions get seeded ─────────────────
async function bumpCatalog(): Promise<void> {
  const units = buildUnits();
  const unitByKey = new Map(units.map(u => [u.bankKey, u]));

  console.log(`\nBumping seed_catalog targets — per-level=${PER_DIFFICULTY} (model=${MODEL})\n`);

  const snap = await db.collection(CATALOG).get();
  if (snap.empty) {
    console.error('seed_catalog is empty — run: npm run catalog:init');
    process.exit(1);
  }

  let bumped = 0, skipped = 0;
  for (let i = 0; i < snap.docs.length; i += 500) {
    const batch = db.batch();
    for (const doc of snap.docs.slice(i, i + 500)) {
      const entry = doc.data() as CatalogEntry;
      const u = unitByKey.get(entry.bankKey);
      if (!u) { skipped++; continue; }
      const newTarget = (u.difficultyRange[1] - u.difficultyRange[0] + 1) * PER_DIFFICULTY;
      if (newTarget <= entry.target) { skipped++; continue; } // never lower the target
      batch.update(db.collection(CATALOG).doc(entry.bankKey), { target: newTarget });
      bumped++;
    }
    await batch.commit();
  }

  console.log(`Done — bumped=${bumped} skipped/unchanged=${skipped}`);
  console.log(`Run 'npm run seed' to fill the gap.`);
  process.exit(0);
}

// ── Entry point ───────────────────────────────────────────────────────────────
const CMD = process.argv[2];
if (CMD === 'init') {
  initCatalog().catch(e => { console.error(e); process.exit(1); });
} else if (CMD === 'bump') {
  bumpCatalog().catch(e => { console.error(e); process.exit(1); });
} else {
  main().catch(e => { console.error(e); process.exit(1); });
}
