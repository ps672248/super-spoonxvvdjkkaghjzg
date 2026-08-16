import admin from 'firebase-admin';
import type { QuizCardProps } from './QuizCard';
import type { NewsRecapProps } from './NewsRecap';
import { getFirebaseApp } from './firebaseAdmin';

function db() {
  getFirebaseApp();
  return admin.firestore();
}

// ── Vertical rotation ──────────────────────────────────────────────────────────
// Matches marketing/PLAN.md §5 "Reel/Short vertical" column exactly. Sat/Sun have
// no scheduled reel — resolveVideoVertical returns '' and the caller should skip.
export type Vertical = 'engineering' | 'entrance' | 'govt' | 'college' | 'schooling';

export function resolveVideoVertical(): Vertical | '' {
  const forced = (process.env.VIDEO_VERTICAL || '').trim().toLowerCase();
  if (forced === 'engineering' || forced === 'entrance' || forced === 'govt' || forced === 'college' || forced === 'schooling') {
    return forced;
  }
  const istDay = new Date(Date.now() + 5.5 * 3600_000).getUTCDay(); // 0=Sun..6=Sat, IST calendar day
  switch (istDay) {
    case 1: return 'engineering'; // Monday
    case 2: return 'govt';        // Tuesday
    case 3: return 'college';     // Wednesday
    case 4: return 'entrance';    // Thursday
    case 5: return 'schooling';   // Friday
    default: return '';           // Sat/Sun — handled by resolveDayTarget
  }
}

// ── Sunday: the reel is pinned to the exam the rest of Sunday is about ────────

/** APP category id (what exam_cycles stores) → this pipeline's vertical. */
const APP_CATEGORY_TO_VERTICAL: Record<string, Vertical> = {
  psu: 'engineering', govt: 'govt', entrance: 'entrance', college: 'college', schooling: 'schooling',
};

export interface DayTarget {
  vertical: Vertical;
  /** Scopes the question draw to one exam. Absent = normal vertical rotation. */
  examId?: string;
  /** Exam display name, for the countdown header and the metadata. */
  examName?: string;
  /** Days until the exam's next calendar event, when known. */
  daysLeft?: number;
  eventType?: string;
}

/**
 * The pin `coverage/_sunday_target` is written by scripts/exam_events.ts's
 * pickTargetExam() when the blog bot runs its 8:30 AM strategy article. The
 * quiz reel at 6:30 PM only READS it — deliberately: re-running the
 * least-recently-covered selection here would risk picking a different exam
 * than the two articles already published that morning, and duplicating the
 * selection logic across packages is how the two drift apart.
 *
 * No pin (blog bot didn't run, or nothing was in the window) → fall back to
 * rotating verticals by week number so Sunday still gets a reel.
 */
async function readSundayTarget(): Promise<DayTarget | null> {
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  try {
    const snap = await db().collection('coverage').doc('_sunday_target').get();
    const data = snap.data();
    if (!snap.exists || data?.date !== today || !data?.target) {
      console.log('[video] No exam pinned for today — using the weekly vertical rotation.');
      return null;
    }
    const target = data.target as { examId: string; examName: string; category: string; eventType: string; daysLeft: number };
    const vertical = APP_CATEGORY_TO_VERTICAL[target.category];
    if (!vertical) {
      console.warn(`[video] Pinned target has an unknown category '${target.category}' — ignoring it.`);
      return null;
    }
    return { vertical, examId: target.examId, examName: target.examName, daysLeft: target.daysLeft, eventType: target.eventType };
  } catch (e) {
    console.warn(`[video] Could not read the Sunday target pin: ${(e as Error).message}`);
    return null;
  }
}

/** Rotates through the five verticals by ISO week so consecutive Sundays don't
 *  repeat when no exam is pinned. */
function weeklyRotationVertical(): Vertical {
  const order: Vertical[] = ['engineering', 'govt', 'college', 'entrance', 'schooling'];
  const week = Math.floor((Date.now() + 5.5 * 3600_000) / (7 * 86_400_000));
  return order[week % order.length];
}

/**
 * What today's quiz reel should be about. Weekdays keep the fixed rotation;
 * Sunday is exam-targeted and gated behind SUNDAY_QUIZ so a bad first run can
 * be switched off without a revert; Saturday still has no reel.
 */
export async function resolveDayTarget(): Promise<DayTarget | null> {
  const forced = resolveVideoVertical();
  if (forced) return { vertical: forced };

  const istDay = new Date(Date.now() + 5.5 * 3600_000).getUTCDay();
  if (istDay !== 0) return null; // Saturday
  if (process.env.SUNDAY_QUIZ !== 'true') {
    console.log('[video] Sunday quiz reel is off (set SUNDAY_QUIZ=true to enable).');
    return null;
  }
  return (await readSundayTarget()) || { vertical: weeklyRotationVertical() };
}

// ── Quiz question ───────────────────────────────────────────────────────────────
type QuestionPayload = {
  question: string;
  options: string[];
  correct: string; // 'A'|'B'|'C'|'D'
  explanation?: string;
  /** Human syllabus title, e.g. 'Matrices & Determinants' — written by
   * scripts/seed_questions.ts. Far better than title-casing topicId, which is a
   * coded slug ('entm_matrices', 'clgimaging_digital'). */
  topicTitle?: string;
};

export type FetchedQuestion = QuestionPayload & {
  /** Which exam the question was seeded for (question_bank.sourceExamId) — '' when the unfiltered fallback was used. */
  examId: string;
  /** Syllabus ids from the question_bank doc (set by scripts/seed_questions.ts).
   * Used by MemeCard to label the meme with its exam + topic — but prefer
   * payload.topicTitle, these are coded slugs. */
  topicId?: string;
  sectionId?: string;
};

// Mirrors frontend/src/config/categories.ts examIds (+ psus.ts CORE_EXAMS for the
// psu/engineering default bucket). question_bank.sourceExamId is set from the same
// config's exam.id by scripts/seed_questions.ts, so these ids match 1:1.
// Keep in sync when a new exam is added to the app config.
const VERTICAL_TO_EXAM_IDS: Record<Vertical, string[]> = {
  engineering: ['hpcl', 'sail', 'mstc', 'cil', 'bhel', 'iocl', 'ongc', 'bpcl', 'ntpc', 'powergrid', 'gail', 'nalco', 'gate', 'ies'],
  entrance: ['jee-main', 'jee-adv', 'neet', 'cuet', 'bitsat'],
  govt: [
    'ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-gd', 'ssc-cpo', 'up-police', 'delhi-police', 'ibps-po', 'ibps-clerk', 'sbi-po', 'sbi-clerk',
    // Teaching sub-track (see frontend/src/config/exams/teaching.ts)
    'ctet-p1', 'ctet-p2', 'uptet-p1', 'uptet-p2', 'reet-l1', 'reet-l2',
    'htet-l1', 'htet-l2', 'htet-l3', 'mptet-varg3', 'mptet-varg2',
    'kvs-nvs-tier1', 'kvs-nvs-prt-t2', 'kvs-nvs-tgt-t2', 'kvs-nvs-pgt-t2',
    'dsssb-tgt', 'dsssb-pgt',
  ],
  college: ['bca', 'mca', 'mbbs', 'bmlt', 'bmrit', 'bpt', 'bsc-nursing', 'bpharm'],
  schooling: ['class-9', 'class-10', 'class-11', 'class-12'],
};

/** Readable exam name for prompts/logging — good enough without importing app config. */
export function examDisplayName(examId: string): string {
  return examId ? examId.replace(/-/g, ' ').toUpperCase() : '';
}

/** Picks one exam id at random from the vertical's list — same "varies day to
 * day" property the old bank-draw had, just deciding what to GENERATE a
 * question about instead of what to fetch. */
export function pickExamIdForVertical(vertical: Vertical): string {
  const ids = VERTICAL_TO_EXAM_IDS[vertical] ?? [];
  return ids.length ? ids[Math.floor(Math.random() * ids.length)] : '';
}

// ── Generated question ────────────────────────────────────────────────────────

const GENERATED_QUESTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    question:    { type: 'STRING' },
    options:     { type: 'ARRAY', items: { type: 'STRING' } },
    correct:     { type: 'STRING' },
    explanation: { type: 'STRING' },
    topicTitle:  { type: 'STRING' },
  },
  required: ['question', 'options', 'correct', 'explanation', 'topicTitle'],
};

/**
 * Writes one MCQ for an exam the bank has never been seeded for, rather than
 * silently switching Sunday's reel to a different exam.
 *
 * Persisted with `hidden: false` — it serves in the app like any seeded
 * question, and review is reactive through the existing user-flag →
 * admin/flagged queue. `generated_by` tags it so a flagged one is traceable
 * to this path and the set can be audited later.
 */
export async function generateQuestionForExam(examId: string, examName: string): Promise<FetchedQuestion | null> {
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    console.warn('[video] No GEMINI_API_KEYS — cannot generate a question for an unseeded exam.');
    return null;
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = `Write ONE exam-realistic multiple-choice question for ${examName} (Indian competitive exam, id "${examId}").

Rules:
- Pitch it at the real difficulty of that exam's paper — not a trivia question, not a textbook definition.
- Exactly 4 options, only one unambiguously correct. No "all of the above".
- "correct" is the letter A, B, C or D.
- "explanation" is 1-2 sentences saying WHY, in plain English, max 220 characters.
- "topicTitle" is the syllabus topic in human words (e.g. "Thermodynamics", "Data Interpretation").
- Nothing that depends on a specific year's current affairs.

Return valid JSON only.`;

  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: GENERATED_QUESTION_SCHEMA },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429) continue;
      const data = (await res.json().catch(() => ({}))) as any;
      if (data?.error) {
        if (/quota|exhausted|rate|RESOURCE_EXHAUSTED/i.test(data.error.message || '')) continue;
        throw new Error(data.error.message);
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      const parsed = JSON.parse(text) as QuestionPayload & { topicTitle?: string };
      if (!parsed?.question || !Array.isArray(parsed.options) || parsed.options.length !== 4) continue;

      const payload: QuestionPayload = {
        question: parsed.question,
        options: parsed.options,
        correct: (parsed.correct || 'A').trim().toUpperCase()[0],
        explanation: parsed.explanation,
        topicTitle: parsed.topicTitle,
      };

      try {
        await db().collection('question_bank').add({
          payload,
          sourceExamId: examId,
          type: 'mcq',
          hidden: false,
          rand: Math.random(),
          generated_by: 'video-bot',
          createdAt: new Date().toISOString(),
        });
        console.log(`[video] Generated a question for ${examName} and added it to the bank.`);
      } catch (e) {
        // The reel still renders from the in-memory copy — persistence is a bonus.
        console.warn(`[video] Could not persist the generated question: ${(e as Error).message}`);
      }

      return { ...payload, examId };
    } catch (e) {
      console.warn(`[video] Question generation failed: ${(e as Error).message}`);
    }
  }
  return null;
}

export function letterToIndex(letter: string): number {
  const i = 'ABCD'.indexOf((letter || 'A').trim().toUpperCase()[0]);
  return i >= 0 ? i : 0;
}

/** Some payloads bake "A) " / "b. " prefixes into the option text — the composition
 * already renders its own letter chip, so strip them to avoid "A  A) Wheat". Gemini's
 * prompt doesn't ask for these, but this stays as cheap defensive cleanup in case it
 * ever does. */
export function stripOptionPrefix(text: string): string {
  return text.replace(/^\s*[A-Da-d][).:\-]\s+/, '').trim();
}

/** QuizCardProps shape for a generated question — mirrors what the old bank-draw
 * path returned, so render.ts's downstream code (gemini hook copy, narration,
 * QuizCard composition) didn't need to change at all. */
export function toQuizCardProps(
  vertical: Vertical,
  q: FetchedQuestion,
): QuizCardProps & { examId: string; topicTitle?: string } {
  return {
    vertical,
    question: q.question,
    options: q.options.map(stripOptionPrefix),
    correctIndex: letterToIndex(q.correct),
    explanation: q.explanation,
    examId: q.examId,
    topicTitle: q.topicTitle,
  };
}

/**
 * Label for the meme's topic chip.
 *
 * Prefers `payload.topicTitle`, which seed_questions.ts already writes as a real
 * human string ('Matrices & Determinants'). The `topicId` fallback is a coded
 * slug — 'entm_matrices', 'clgimaging_digital', 'bpharmpk_compartment' — so
 * title-casing it produces garbage like "ENTM MATRICES". When that's all we have,
 * drop the leading code segment and cap the length rather than show the raw slug.
 */
export function syllabusDisplayName(title?: string, fallbackId?: string): string {
  const clean = title?.trim();
  if (clean) return clean.length > 42 ? `${clean.slice(0, 41).trimEnd()}…` : clean;
  if (!fallbackId) return '';
  const parts = fallbackId.split('_');
  const words = (parts.length > 1 ? parts.slice(1) : parts).join(' ').replace(/[-]+/g, ' ').trim();
  return words.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── News recap (only when the blog bot published something today) ─────────────
// Populated by scripts/blog_bot.ts's VIDEO_META_INSTRUCTION when Gemini has
// news-specific upload copy to offer — buildNewsMetadata() falls back to fixed
// deterministic metadata when this is absent (e.g. older articles).
export type ArticleVideoMeta = {
  /** Pattern-interrupt line shown at frame 0 of the reel — see NewsRecap hookLine. */
  hookLine?: string;
  youtubeTitle?: string;
  youtubeDescription?: string;
  youtubeTags?: string[];
  instagramCaption?: string;
  instagramHashtags?: string[];
  /** Spoken-only Hinglish narration — piggybacked on blog_bot.ts's video-content
   * Gemini call when SARVAM_API_KEY is set, so renderNewsRecap.ts needs no
   * toHinglish() call of its own. Never shown on screen. */
  hinglishHeadline?: string;
  hinglishBeats?: string[];
};

type ArticleDoc = {
  title: string;
  description: string;
  publishDate: string;
  category?: string;
  videoBeats?: { label: string; text: string }[];
  videoMeta?: ArticleVideoMeta;
};

/** Returns the most recent article published today (server date), if any. */
const VERTICAL_TO_ARTICLE_CATEGORY: Record<Vertical, string> = {
  engineering: 'psu', // recruitment-news category — excludes weekly 'strategy' pieces on purpose
  schooling: 'boards',
  entrance: 'entrance',
  govt: 'govt',
  college: 'college',
};

export async function fetchTodaysArticle(vertical: Vertical): Promise<ArticleDoc | null> {
  const today = new Date().toISOString().slice(0, 10);
  const category = VERTICAL_TO_ARTICLE_CATEGORY[vertical];

  const snap = await db().collection('articles')
    .where('publishDate', '==', today)
    .where('category', '==', category)
    .limit(5)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0].data() as ArticleDoc;
  return doc;
}

export function buildNewsRecapProps(vertical: Vertical, article: ArticleDoc): NewsRecapProps {
  const beats = article.videoBeats && article.videoBeats.length > 0
    ? article.videoBeats.slice(0, 3)
    : [{ label: 'KEY POINT', text: article.description }];
  return {
    vertical,
    headline: article.title,
    beats,
  };
}
