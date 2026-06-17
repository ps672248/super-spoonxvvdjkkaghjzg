/**
 * Seed fake leaderboard entries for FOMO — runs daily via GitHub Actions.
 *
 * 40 fake users: 20 PSU (varied branches) + 20 Schooling (no branch).
 *
 * global_correct:
 *   week    = correct answers THIS week (resets each new weekId)
 *   alltime = sum of all weekly contributions (+=dailyCorrect every day, never resets)
 *             always >= week (enforced via max)
 *   daily increment: rand(20, 100)
 *
 * Score boards (mario / slasher / tsunami) — both PSU and Schooling:
 *   week    = best score THIS week  → update only if today's rand > current week best
 *   alltime = best score EVER       → update only if today's rand > current alltime best
 *   daily value: mario → rand(2000, 30000) | slasher → rand(100, 400) | tsunami → rand(200, 700)
 *
 * Idempotency: each user entry stores `seededDate` (YYYY-MM-DD UTC).
 * If already seeded today the user is skipped, so reruns are safe.
 */

import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

// ── Firebase init ─────────────────────────────────────────────────────────────
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';
  return JSON.parse(readFileSync(p, 'utf8'));
}
admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount() as admin.ServiceAccount) });
const db = admin.firestore();

// ── Constants ─────────────────────────────────────────────────────────────────
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const VALUE_CAP = 1_000_000;
const SCORE_BOARDS = ['mario', 'slasher', 'tsunami'] as const;
const SCORE_RANGE: Record<string, [number, number]> = {
  mario:   [2000, 30000],
  slasher: [100,  400],
  tsunami: [200,  700],
};

function currentWeekId(): string {
  return `W${Math.floor(Date.now() / WEEK_MS)}`;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v: number): number {
  return Math.min(Math.max(Math.round(v), 0), VALUE_CAP);
}

// ── Fake users ────────────────────────────────────────────────────────────────
interface FakeUser {
  uid: string;
  name: string;
  branchId: string;
  branchName: string;
}

const PSU_USERS: FakeUser[] = [
  { uid: 'seed_psu_01', name: 'Arjun Sharma',     branchId: 'cs', branchName: 'Computer Science' },
  { uid: 'seed_psu_02', name: 'Priya Singh',      branchId: 'ee', branchName: 'Electrical Engineering' },
  { uid: 'seed_psu_03', name: 'Rohit Verma',      branchId: 'me', branchName: 'Mechanical Engineering' },
  { uid: 'seed_psu_04', name: 'Neha Gupta',       branchId: 'ec', branchName: 'Electronics & Communication' },
  { uid: 'seed_psu_05', name: 'Vikram Patel',     branchId: 'cs', branchName: 'Computer Science' },
  { uid: 'seed_psu_06', name: 'Anjali Rao',       branchId: 'ce', branchName: 'Civil Engineering' },
  { uid: 'seed_psu_07', name: 'Suresh Kumar',     branchId: 'me', branchName: 'Mechanical Engineering' },
  { uid: 'seed_psu_08', name: 'Meera Nair',       branchId: 'ee', branchName: 'Electrical Engineering' },
  { uid: 'seed_psu_09', name: 'Karan Mishra',     branchId: 'cs', branchName: 'Computer Science' },
  { uid: 'seed_psu_10', name: 'Divya Reddy',      branchId: 'ch', branchName: 'Chemical Engineering' },
  { uid: 'seed_psu_11', name: 'Amit Joshi',       branchId: 'ec', branchName: 'Electronics & Communication' },
  { uid: 'seed_psu_12', name: 'Pooja Agarwal',    branchId: 'me', branchName: 'Mechanical Engineering' },
  { uid: 'seed_psu_13', name: 'Rahul Tiwari',     branchId: 'cs', branchName: 'Computer Science' },
  { uid: 'seed_psu_14', name: 'Sneha Pillai',     branchId: 'ee', branchName: 'Electrical Engineering' },
  { uid: 'seed_psu_15', name: 'Deepak Yadav',     branchId: 'ce', branchName: 'Civil Engineering' },
  { uid: 'seed_psu_16', name: 'Kavita Bansal',    branchId: 'ec', branchName: 'Electronics & Communication' },
  { uid: 'seed_psu_17', name: 'Nitin Saxena',     branchId: 'me', branchName: 'Mechanical Engineering' },
  { uid: 'seed_psu_18', name: 'Rekha Iyer',       branchId: 'cs', branchName: 'Computer Science' },
  { uid: 'seed_psu_19', name: 'Sandeep Bose',     branchId: 'ee', branchName: 'Electrical Engineering' },
  { uid: 'seed_psu_20', name: 'Lakshmi Menon',    branchId: 'ch', branchName: 'Chemical Engineering' },
];

const SCHOOL_USERS: FakeUser[] = [
  { uid: 'seed_sch_01', name: 'Aarav Kapoor',     branchId: '', branchName: '' },
  { uid: 'seed_sch_02', name: 'Ishita Malhotra',  branchId: '', branchName: '' },
  { uid: 'seed_sch_03', name: 'Dev Chauhan',      branchId: '', branchName: '' },
  { uid: 'seed_sch_04', name: 'Riya Mehta',       branchId: '', branchName: '' },
  { uid: 'seed_sch_05', name: 'Aryan Srivastava', branchId: '', branchName: '' },
  { uid: 'seed_sch_06', name: 'Ananya Dubey',     branchId: '', branchName: '' },
  { uid: 'seed_sch_07', name: 'Rohan Pandey',     branchId: '', branchName: '' },
  { uid: 'seed_sch_08', name: 'Shruti Ghosh',     branchId: '', branchName: '' },
  { uid: 'seed_sch_09', name: 'Vivaan Shah',      branchId: '', branchName: '' },
  { uid: 'seed_sch_10', name: 'Tanya Chaudhary',  branchId: '', branchName: '' },
  { uid: 'seed_sch_11', name: 'Kabir Sethi',      branchId: '', branchName: '' },
  { uid: 'seed_sch_12', name: 'Nidhi Kulkarni',   branchId: '', branchName: '' },
  { uid: 'seed_sch_13', name: 'Parth Desai',      branchId: '', branchName: '' },
  { uid: 'seed_sch_14', name: 'Simran Kaur',      branchId: '', branchName: '' },
  { uid: 'seed_sch_15', name: 'Yash Tripathi',    branchId: '', branchName: '' },
  { uid: 'seed_sch_16', name: 'Diya Chatterjee',  branchId: '', branchName: '' },
  { uid: 'seed_sch_17', name: 'Ayaan Khan',       branchId: '', branchName: '' },
  { uid: 'seed_sch_18', name: 'Aditi Jain',       branchId: '', branchName: '' },
  { uid: 'seed_sch_19', name: 'Siddharth Nair',   branchId: '', branchName: '' },
  { uid: 'seed_sch_20', name: 'Prachi Sharma',    branchId: '', branchName: '' },
];

// ── Seed one user ─────────────────────────────────────────────────────────────
async function seedUser(user: FakeUser, category: string): Promise<void> {
  const { uid, name, branchId, branchName } = user;
  const weekId  = currentWeekId();
  const today   = todayUTC();
  const now     = Date.now();
  const meta    = { uid, name, branchId, branchName, updatedAt: now };

  const scoreRef = (boardId: string) =>
    db.collection('leaderboards').doc(boardId).collection('scores').doc(uid);

  // ── global_correct ──────────────────────────────────────────────────────────
  const weekRef = scoreRef(`${category}_global_correct_${weekId}`);
  const atRef   = scoreRef(`${category}_global_correct_alltime`);
  const [wSnap, aSnap] = await Promise.all([weekRef.get(), atRef.get()]);

  // Skip if already seeded today (idempotent reruns)
  if (wSnap.exists && wSnap.data()!.seededDate === today) {
    console.log(`  [${category}] ${name}: already seeded today — skip`);
    return;
  }

  const dailyCorrect = rand(20, 100);

  // Week: accumulate from 0 each new weekId
  const weekCur = wSnap.exists ? ((wSnap.data()!.value as number) || 0) : 0;
  const weekNew = clamp(weekCur + dailyCorrect);
  await weekRef.set({ ...meta, value: weekNew, seededDate: today });

  // Alltime = sum of all weeks. Always enforce alltime >= weekNew.
  const atCur = aSnap.exists ? ((aSnap.data()!.value as number) || 0) : 0;
  const atNew  = clamp(Math.max(atCur + dailyCorrect, weekNew));
  await atRef.set({ ...meta, value: atNew, seededDate: today });

  // ── Score boards (mario / slasher / tsunami) ────────────────────────────────
  const scoreLog: string[] = [];
  for (const mode of SCORE_BOARDS) {
    const wScoreRef = scoreRef(`${category}_${mode}_${weekId}`);
    const aScoreRef = scoreRef(`${category}_${mode}_alltime`);
    const [wsSnap, asSnap] = await Promise.all([wScoreRef.get(), aScoreRef.get()]);

    const [sMin, sMax] = SCORE_RANGE[mode];
    const todayScore = rand(sMin, sMax);

    const wCur = wsSnap.exists ? ((wsSnap.data()!.value as number) || 0) : 0;
    const wUpdated = todayScore > wCur;
    if (wUpdated) await wScoreRef.set({ ...meta, value: todayScore, seededDate: today });

    const aCur = asSnap.exists ? ((asSnap.data()!.value as number) || 0) : 0;
    const aUpdated = todayScore > aCur;
    if (aUpdated) await aScoreRef.set({ ...meta, value: todayScore, seededDate: today });

    scoreLog.push(`${mode}=${todayScore}(w:${wUpdated ? 'new' : 'keep'} a:${aUpdated ? 'new' : 'keep'})`);
  }

  console.log(`  [${category}] ${name}: +${dailyCorrect} correct → week=${weekNew} alltime=${atNew} | ${scoreLog.join(' ')}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding leaderboards — ${todayUTC()} week ${currentWeekId()}`);

  console.log('\nPSU users:');
  for (const u of PSU_USERS) await seedUser(u, 'psu');

  console.log('\nSchooling users:');
  for (const u of SCHOOL_USERS) await seedUser(u, 'schooling');

  console.log('\nDone.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
