/**
 * Where a meme's subject comes from: a SYLLABUS TOPIC, not a specific question.
 *
 * The bucket used to pull one random MCQ out of question_bank and make the writer
 * build a joke around that exact question. That was the ceiling on quality. Most
 * questions are not memeable — "Which of these is Nijvachak Sarvanam?" is pure
 * classification recall, carries no shared failure and no emotional charge, and
 * there is simply no joke in it. The writer would produce the best meme available
 * from an unmemeable input, which is still a bad meme.
 *
 * Handing over a topic instead ("Electricity", "Arithmetic", "Thermodynamics")
 * lets the model choose the funniest teachable trap *within* that topic — current
 * being "used up" round a circuit, markup and discount not cancelling, Kelvin vs
 * Celsius. It already knows which ones people get wrong; the old design forbade it
 * from picking.
 *
 * Topics come from the app's own syllabus config rather than being invented, so
 * the on-screen topic chip stays truthful and coverage rotates across the syllabus
 * instead of drifting to whatever the model finds easy. That config is plain data
 * — types and arrays, no React, no Firebase — so importing it across the package
 * boundary costs nothing at runtime.
 *
 * Node-only, like memeHistory.ts. Never import from a composition.
 *
 * These used to come straight from `frontend/src/config/syllabus/*` — that
 * only worked in the old monorepo layout. Now sourced from a manually
 * populated local mirror; see syllabusTopics.local.ts for the one-time setup
 * this needs before meme generation will produce anything.
 */
import type { Vertical } from './fetchContent';
import {
  collegeTopicMap,
  domainTopicMap,
  entranceTopicMap,
  genericEngMathsTopics,
  govtTopicMap,
  teachingTopicMap,
  schoolingTopicMap,
  englishTopics,
  gkTopics,
  quantTopics,
  reasoningTopics,
} from './syllabusTopics.local';

export type MemeTopic = {
  /** Syllabus section the topic sits under, e.g. 'ssc-quant', 'phy12'. Drives the exam chip. */
  sectionId: string;
  /** Stable syllabus topic id, e.g. 'sscq_arith'. Logged so the same topic isn't reused for weeks. */
  topicId: string;
  /** Human title shown on the topic chip and handed to the writer, e.g. 'Arithmetic'. */
  title: string;
  /** The syllabus' own breakdown — this is what gives the model somewhere specific to aim. */
  subtopics: string[];
  importance: 'high' | 'medium' | 'low';
};

type RawTopic = {
  id: string;
  title: string;
  importance?: string;
  subtopics?: string[];
};

function flatten(map: Record<string, RawTopic[]>): MemeTopic[] {
  return Object.entries(map).flatMap(([sectionId, topics]) =>
    topics.map((t) => ({
      sectionId,
      topicId: t.id,
      title: t.title,
      subtopics: t.subtopics ?? [],
      importance: (t.importance === 'high' || t.importance === 'low' ? t.importance : 'medium') as MemeTopic['importance'],
    })),
  );
}

/**
 * Engineering has no single section map — GATE/PSU papers are the shared aptitude
 * pools plus a branch-specific technical paper. All branches are folded in
 * together: the reel doesn't target one branch, and a Mechanical joke lands with
 * a CS aspirant scrolling past anyway.
 */
function engineeringTopics(): MemeTopic[] {
  return [
    ...flatten({ quant: quantTopics, reasoning: reasoningTopics, english: englishTopics, gk: gkTopics }),
    ...flatten({ 'eng-maths': genericEngMathsTopics }),
    ...flatten(Object.fromEntries(Object.entries(domainTopicMap).map(([branch, topics]) => [`technical-${branch}`, topics]))),
  ];
}

// syllabusTopics.local.ts ships empty on purpose (see its header comment) —
// catch a forgotten setup step here, loudly, instead of every vertical
// silently returning zero topics and meme generation failing unhelpfully
// several calls downstream.
function assertSyllabusTopicsPopulated(): void {
  const allEmpty =
    Object.keys(collegeTopicMap).length === 0 &&
    Object.keys(domainTopicMap).length === 0 &&
    Object.keys(entranceTopicMap).length === 0 &&
    Object.keys(govtTopicMap).length === 0 &&
    Object.keys(teachingTopicMap).length === 0 &&
    Object.keys(schoolingTopicMap).length === 0 &&
    genericEngMathsTopics.length === 0 &&
    englishTopics.length === 0 &&
    gkTopics.length === 0 &&
    quantTopics.length === 0 &&
    reasoningTopics.length === 0;
  if (allEmpty) {
    throw new Error(
      'memeTopics.ts: syllabusTopics.local.ts is still empty — meme generation needs it ' +
        'populated by hand from frontend/src/config/syllabus/*. See that file\'s header comment.',
    );
  }
}

export function topicsForVertical(vertical: Vertical): MemeTopic[] {
  assertSyllabusTopicsPopulated();
  switch (vertical) {
    case 'engineering': return engineeringTopics();
    case 'govt': return [...flatten(govtTopicMap), ...flatten(teachingTopicMap)];
    case 'entrance': return flatten(entranceTopicMap);
    case 'college': return flatten(collegeTopicMap);
    case 'schooling': return flatten(schoolingTopicMap);
  }
}

/**
 * Exam name for the gold chip. Derived from the section id prefix rather than a
 * per-exam lookup, because a syllabus section is shared by several exams
 * ('ssc-quant' serves CGL, CHSL, MTS, GD and CPO) — the family name is the only
 * honest label. Anything unmatched falls back to the vertical's own label rather
 * than showing a raw id.
 */
const SECTION_PREFIX_TO_EXAM: [RegExp, string][] = [
  [/^ssc-/, 'SSC'],
  [/^bank-/, 'BANKING'],
  [/^up-police-/, 'UP POLICE'],
  [/^delhi-police-/, 'DELHI POLICE'],
  [/^htet-/, 'HTET'],
  [/^teach-/, 'TEACHING'],
  [/^jeem_/, 'JEE MAIN'],
  [/^jeea_/, 'JEE ADVANCED'],
  [/^neet_/, 'NEET'],
  [/^bitsat_/, 'BITSAT'],
  [/^cuet_/, 'CUET'],
  [/9$/, 'CLASS 9'],
  [/10$/, 'CLASS 10'],
  [/11$/, 'CLASS 11'],
  [/12$/, 'CLASS 12'],
  [/^quant$|^reasoning$|^english$|^gk$|^eng-maths$|^technical-/, 'GATE / PSU'],
];

const VERTICAL_FALLBACK: Record<Vertical, string> = {
  engineering: 'GATE / PSU',
  govt: 'SSC / BANKING',
  entrance: 'JEE / NEET',
  college: 'COLLEGE',
  schooling: 'CBSE',
};

export function examLabelForTopic(topic: MemeTopic, vertical: Vertical): string {
  return SECTION_PREFIX_TO_EXAM.find(([re]) => re.test(topic.sectionId))?.[1] ?? VERTICAL_FALLBACK[vertical];
}

/**
 * The day's topic, best first. Least-recently-used wins, ties broken by syllabus
 * importance — high-importance topics are the ones every aspirant in that exam has
 * actually sat with, which is the same thing that makes a joke land.
 *
 * `usedAt` comes from meme_history.json. Returning the full ranked list (rather
 * than one pick) mirrors rankTemplates() and leaves room for the caller to skip a
 * topic the writer can't find an angle in.
 */
const IMPORTANCE_RANK: Record<MemeTopic['importance'], number> = { high: 0, medium: 1, low: 2 };

export function rankTopics(vertical: Vertical, usedAt: Record<string, string> = {}): MemeTopic[] {
  return [...topicsForVertical(vertical)].sort((a, b) => {
    const la = usedAt[a.topicId] ?? '';
    const lb = usedAt[b.topicId] ?? '';
    if (la !== lb) return la < lb ? -1 : 1; // never-used ('') first
    return IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance];
  });
}
