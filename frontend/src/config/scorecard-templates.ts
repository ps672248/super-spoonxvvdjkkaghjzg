import type { ExamConfig } from './psus';
import { getBranch } from './branches';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameMode =
  | 'mcq'
  | 'survival'
  | 'match'
  | 'mario'
  | 'slasher'
  | 'tsunami'
  | 'pi'
  | 'gd';

export interface CardVars {
  exam: ExamConfig;
  branchId: string;
  score: number;
  percentile?: number;
  rank?: number;
  totalPlayers?: number;
  round?: number;
  combo?: number;
  bestCombo?: number;
  level?: number;
  totalAsked?: number;
  sessionsThisWeek: number;
  streak: number;
  interviewType?: 'technical' | 'hr' | 'gd';
  gdTopic?: string;
  variant?: 0 | 1 | 2;
}

type ContextKey = 'psu_with_interview' | 'psu_no_interview' | 'boards';

type TemplatePool = Record<ContextKey, string[]>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function contextKey(exam: ExamConfig): ContextKey {
  if (exam.examType === 'Boards') return 'boards';
  if (exam.hasInterview) return 'psu_with_interview';
  return 'psu_no_interview';
}

// ─── Template pools ───────────────────────────────────────────────────────────

const TEMPLATES: Record<GameMode, TemplatePool> = {
  mcq: {
    psu_with_interview: [
      'Top {{percentile}}% on {{examName}} questions today.\nThe other {{remaining}}% are still guessing.',
      '{{score}}% accuracy on {{examName}} · {{branchShort}}.\nRank #{{rank}} of {{totalPlayers}}.',
      '{{score}}% accuracy.\n{{examName}} doesn\'t shortlist people who freeze on MCQs.',
      'Rank #{{rank}} of {{totalPlayers}}.\nSame syllabus. Different effort.',
    ],
    psu_no_interview: [
      '{{score}}% accuracy.\n{{examName}} CBT cutoff is a number, not a mystery.',
      'Top {{percentile}}% today.\n{{examName}} MCQs aren\'t hard — they\'re unfamiliar. Not anymore.',
      'Rank #{{rank}} of {{totalPlayers}} preparing for {{examName}}.\nCutoff won\'t be a surprise.',
    ],
    boards: [
      '{{score}}% on {{examName}} MCQs.\nMarks don\'t lie about preparation.',
      'Top {{percentile}}% in {{examName}} today.\nCompounding starts now.',
      'Rank #{{rank}} of {{totalPlayers}} students.\nSubjects won\'t be the bottleneck.',
    ],
  },

  survival: {
    psu_with_interview: [
      'Most {{examName}} aspirants quit at Round 5.\nI reached Round {{round}}.',
      '91% of players didn\'t make it this far.\nI did.',
      '{{sessionsThisWeek}} Survival sessions this week.\n{{examName}} won\'t catch me off guard.',
      'Round {{round}} survived.\n{{examName}} {{branchShort}} — pressure-tested, not just revised.',
    ],
    psu_no_interview: [
      'Round {{round}} survived.\n{{examName}} cutoff doesn\'t forgive weak prep.',
      '{{sessionsThisWeek}} sessions this week.\n{{examName}} eliminates people who practiced less than this.',
      'Round {{round}}. No GD, no PI — just marks.\nI\'m making sure those marks are mine.',
    ],
    boards: [
      'Round {{round}} in {{examName}}.\nMost students re-read notes. I test myself.',
      '{{sessionsThisWeek}} sessions this week.\n{{examName}} rewards practice, not revision plans.',
      'Passive reading doesn\'t build exam recall.\nThis does. Round {{round}}.',
    ],
  },

  match: {
    psu_with_interview: [
      '{{score}}/{{totalAsked}} pairs matched.\n{{examName}} {{branchShort}} — depth, not just memory.',
      'Match Mode done. {{examName}} · {{branchShort}}.\nI know concepts, not just answers.',
      '{{score}} correct. {{remaining}} wrong.\nAt least I know exactly where I stand.',
    ],
    psu_no_interview: [
      '{{score}}/{{totalAsked}} correct.\n{{examName}} CBT tests concepts. I\'m testing mine daily.',
      '{{score}} matched. {{examName}} written test will test the same depth.',
    ],
    boards: [
      '{{score}}/{{totalAsked}} in {{examName}} Match Mode.\nUnderstanding concepts, not memorising.',
      '{{score}} correct pairs.\n{{examName}} exams test relationships between ideas. Practicing that.',
    ],
  },

  mario: {
    psu_with_interview: [
      'Level {{level}} cleared.\n{{examName}} prep that plays like a game but hits like real practice.',
      '{{streak}} correct in a row. Reached Level {{level}}.\n{{examName}} written test will feel easier.',
      'Level {{level}}. {{sessionsThisWeek}} sessions this week.\nMost {{examName}} aspirants study. I play and learn.',
    ],
    psu_no_interview: [
      'Level {{level}}. {{examName}} CBT prep that doesn\'t feel like grinding.',
      'Reached Level {{level}} on {{examName}} questions.\nSame topics — more fun than flashcards.',
    ],
    boards: [
      'Level {{level}} in {{examName}} Mario Mode.\nLearning that doesn\'t feel like studying.',
      '{{streak}} correct in a row. Level {{level}}.\n{{examName}} just got interesting.',
    ],
  },

  slasher: {
    psu_with_interview: [
      '{{score}} topics slashed.\n{{examName}} {{branchShort}} syllabus won\'t be unfamiliar territory.',
      '{{accuracy}}% accuracy. {{score}} slashed.\n{{examName}} technical round tests the same topics.',
      '{{score}} correct. {{remaining}} wrong.\nAt least I know exactly where I stand on {{examName}}.',
    ],
    psu_no_interview: [
      '{{score}} topics slashed.\n{{examName}} CBT has {{totalAsked}} questions. I\'m covering the syllabus.',
      '{{accuracy}}% accuracy on {{examName}} topics.\nCutoff doesn\'t care about intent — only results.',
    ],
    boards: [
      '{{score}} topics in {{examName}} slashed.\nChapter by chapter, not in one panic session.',
      '{{accuracy}}% accuracy. {{score}} correct.\n{{examName}} topics — covered, not just read.',
    ],
  },

  tsunami: {
    psu_with_interview: [
      '{{bestCombo}}x best combo.\n{{examName}} {{branchShort}} — judgment calls, not just recall.',
      '{{score}} statements judged. {{bestCombo}}x streak.\n{{examName}} panel tests judgment too.',
      '{{bestCombo}} in a row without a mistake.\nTrue/False on {{examName}} content. Reflexes, not guesses.',
    ],
    psu_no_interview: [
      '{{bestCombo}}x combo. {{examName}} CBT has True/False judgment too.\nPracticing mine.',
      '{{score}} correct. {{bestCombo}}x best streak.\nFast judgment. {{examName}} clock doesn\'t wait.',
    ],
    boards: [
      '{{bestCombo}}x combo in {{examName}} Tsunami.\nFast recall — not just understanding.',
      '{{score}} correct swipes. {{examName}} exams test speed too.\nBuilding both.',
    ],
  },

  pi: {
    psu_with_interview: [
      'AI panel gave me {{score}}/10.\nHave you done even one mock PI?',
      'Mock PI score: {{score}}/10.\n{{examName}} · {{branchShort}}. Prepared, not hoping.',
      '{{sessionsThisWeek}} mock PIs this week.\n{{examName}} interview won\'t be my first pressure situation.',
    ],
    psu_no_interview: [],
    boards: [],
  },

  gd: {
    psu_with_interview: [
      'Mock GD: {{score}}/10.\nMost {{examName}} aspirants skip GD prep entirely.',
      '{{sessionsThisWeek}} GD sessions this week.\n{{examName}} eliminates confident-but-unprepared speakers.',
      'GD score {{score}}/10.\n{{examName}} shortlists people who think out loud.\nI\'m practicing that.',
    ],
    psu_no_interview: [],
    boards: [],
  },
};

const EVERGREEN: string[] = [
  'Same exam. Same syllabus.\nDifferent preparation.',
  'Consistent beats talented.\n{{streak}} day streak.',
  'Most people plan to prepare.\nI\'m already preparing.',
  '{{sessionsThisWeek}} sessions this week.\nEffort compounds.',
  'While others scroll, I practice.\n(Yes, I see the irony.)',
  'The result isn\'t in my control.\nThe preparation is.',
];

// ─── Engine ───────────────────────────────────────────────────────────────────

function getPool(mode: GameMode, exam: ExamConfig): string[] {
  const modePool = TEMPLATES[mode];

  if (mode === 'pi' && !exam.interviewStages.includes('Technical PI')) return EVERGREEN;
  if (mode === 'gd' && !exam.interviewStages.includes('GD')) return EVERGREEN;

  const pool = modePool[contextKey(exam)];
  return pool.length > 0 ? pool : EVERGREEN;
}

export function pickFOMOLine(mode: GameMode, vars: CardVars): string {
  const pool = getPool(mode, vars.exam);
  const template = pool[Math.floor(Math.random() * pool.length)];

  const branch = getBranch(vars.branchId);
  const branchShort = branch?.shortName ?? '';
  const accuracy = vars.totalAsked && vars.totalAsked > 0
    ? Math.round((vars.score / vars.totalAsked) * 100)
    : vars.score;
  const remaining = vars.totalAsked
    ? vars.totalAsked - vars.score
    : 100 - vars.score;

  return template
    .replace(/\{\{examName\}\}/g, vars.exam.name)
    .replace(/\{\{branchShort\}\}/g, branchShort)
    .replace(/\{\{score\}\}/g, String(vars.score))
    .replace(/\{\{percentile\}\}/g, String(vars.percentile ?? 0))
    .replace(/\{\{remaining\}\}/g, String(remaining))
    .replace(/\{\{rank\}\}/g, String(vars.rank ?? '—'))
    .replace(/\{\{totalPlayers\}\}/g, String(vars.totalPlayers ?? '—'))
    .replace(/\{\{round\}\}/g, String(vars.round ?? vars.score))
    .replace(/\{\{combo\}\}/g, String(vars.combo ?? 0))
    .replace(/\{\{bestCombo\}\}/g, String(vars.bestCombo ?? 0))
    .replace(/\{\{level\}\}/g, String(vars.level ?? 1))
    .replace(/\{\{totalAsked\}\}/g, String(vars.totalAsked ?? 0))
    .replace(/\{\{accuracy\}\}/g, String(accuracy))
    .replace(/\{\{streak\}\}/g, String(vars.streak))
    .replace(/\{\{sessionsThisWeek\}\}/g, String(vars.sessionsThisWeek));
}

// ─── Mode display metadata ────────────────────────────────────────────────────

export const MODE_META: Record<GameMode, { label: string; icon: string; color: string }> = {
  mcq:      { label: 'MCQ BLITZ',        icon: '⚡', color: '#1976D2' },
  survival: { label: 'SURVIVAL MODE',    icon: '💀', color: '#C62828' },
  match:    { label: 'MATCH MODE',       icon: '🔗', color: '#2E7D32' },
  mario:    { label: 'MARIO MODE',       icon: '🍄', color: '#F9A825' },
  slasher:  { label: 'SYLLABUS SLASHER', icon: '⚔️', color: '#F9A825' },
  tsunami:  { label: 'TSUNAMI',          icon: '🌊', color: '#0277BD' },
  pi:       { label: 'MOCK PI',          icon: '🎤', color: '#000666' },
  gd:       { label: 'MOCK GD',          icon: '🗣️', color: '#000666' },
};
