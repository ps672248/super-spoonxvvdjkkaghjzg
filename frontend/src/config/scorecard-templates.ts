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
      '{{score}}% accuracy.\n{{examName}} doesn\'t shortlist people who freeze on MCQs.',
      '{{score}}/{{totalAsked}} correct.\n{{examName}} written clears thousands. I intend to be one of them.',
      '{{accuracy}}% accuracy on {{examName}}.\nThe selection ratio is brutal. My prep isn\'t.',
      '{{streak}} day streak.\nConsistency is the only skill that never stops compounding.',
      '{{sessionsThisWeek}} MCQ sessions this week.\nMost {{examName}} aspirants study once a week. I study differently.',
      '{{score}} correct, {{remaining}} wrong.\nThat\'s {{remaining}} questions that won\'t surprise me on exam day.',
      '{{accuracy}}% on {{examName}} MCQs.\nShortlist goes to those who got the basics right, every day.',
    ],
    psu_no_interview: [
      '{{score}}% accuracy.\n{{examName}} CBT cutoff is a number, not a mystery.',
      '{{score}}/{{totalAsked}} correct.\nOne shot at {{examName}} written. Not leaving it to chance.',
      '{{accuracy}}% today on {{examName}}.\nCutoff is a number. I\'m going higher.',
      '{{streak}} day streak.\nExam date doesn\'t move. I do.',
      '{{sessionsThisWeek}} sessions this week.\nWhile others scroll, I answer MCQs.',
      '{{score}} correct, {{remaining}} wrong.\n{{examName}} CBT doesn\'t grade effort. Only answers.',
      '{{accuracy}}% accuracy.\nThe gap between clearing and missing cutoff is smaller than people think.',
    ],
    boards: [
      '{{score}}% on {{examName}} MCQs.\nMarks don\'t lie about preparation.',
      '{{score}}/{{totalAsked}} on {{examName}}.\n90+ doesn\'t happen by accident.',
      '{{accuracy}}% accuracy.\nBoards gap: students who practice vs. students who plan to.',
      '{{streak}} day streak.\nEvery subject paper has 80 marks. Earning them daily.',
      '{{sessionsThisWeek}} sessions on {{examName}} this week.\nThe boards don\'t curve for effort — just for results.',
      '{{score}} correct, {{remaining}} wrong.\nKnowing what I don\'t know is half the prep.',
      '{{accuracy}}% on {{examName}} today.\nBoards reward the ones who practice, not the ones who plan to.',
    ],
  },

  survival: {
    psu_with_interview: [
      'Most {{examName}} aspirants quit at Round 5.\nI reached Round {{round}}.',
      '91% of players didn\'t make it this far.\nI did.',
      '{{sessionsThisWeek}} Survival sessions this week.\n{{examName}} won\'t catch me off guard.',
      'Round {{round}} survived.\n{{examName}} {{branchShort}} — pressure-tested, not just revised.',
      'Round {{round}} survived.\nElimination on every wrong answer. Exactly like real selection.',
      '{{score}} correct before out.\n{{examName}} shortlist won\'t include people who crumble under pressure.',
      '{{sessionsThisWeek}} survival rounds this week.\nPressure is just practice in disguise.',
      '{{streak}} day streak. Round {{round}} today.\nWho\'s still reading notes and calling it prep?',
    ],
    psu_no_interview: [
      'Round {{round}} survived.\n{{examName}} cutoff doesn\'t forgive weak prep.',
      '{{sessionsThisWeek}} sessions this week.\n{{examName}} eliminates people who practiced less than this.',
      'Round {{round}}. No GD, no PI — just marks.\nI\'m making sure those marks are mine.',
      'Survived {{round}} rounds.\n{{examName}} doesn\'t ask if you had a bad day.',
      '{{score}} correct before elimination.\nWritten test is the only filter. Training for it.',
      '{{sessionsThisWeek}} sessions this week.\nOne shot at written. I\'m not winging it.',
    ],
    boards: [
      'Round {{round}} in {{examName}}.\nMost students re-read notes. I test myself.',
      '{{sessionsThisWeek}} sessions this week.\n{{examName}} rewards practice, not revision plans.',
      'Passive reading doesn\'t build exam recall.\nThis does. Round {{round}}.',
      'Round {{round}} in {{examName}}.\nBoard exams have one date. I have {{streak}} days of prep.',
      '{{score}} correct before out.\nBoards test under time pressure. Training for that.',
      '{{sessionsThisWeek}} survival rounds this week.\nNot everyone who sits the boards has done this.',
    ],
  },

  match: {
    psu_with_interview: [
      '{{score}}/{{totalAsked}} pairs matched.\n{{examName}} {{branchShort}} — depth, not just memory.',
      'Match Mode done. {{examName}} · {{branchShort}}.\nI know concepts, not just answers.',
      '{{score}} correct. {{remaining}} wrong.\nAt least I know exactly where I stand.',
      '{{score}}/{{totalAsked}} pairs matched.\nRelationships between concepts — that\'s what {{examName}} technical round actually tests.',
      '{{accuracy}}% in Match Mode.\nKnowing facts is table stakes. Understanding connections is the edge.',
      '{{sessionsThisWeek}} match sessions this week.\nSyllabus depth, not just surface coverage.',
      '{{score}} correct pairs on {{examName}}.\nThe technical round doesn\'t ask definitions. It asks connections.',
    ],
    psu_no_interview: [
      '{{score}}/{{totalAsked}} correct.\n{{examName}} CBT tests concepts. I\'m testing mine daily.',
      '{{score}} matched. {{examName}} written test will test the same depth.',
      '{{score}}/{{totalAsked}} matched.\nMCQs test recall. Match Mode tests understanding. Both count.',
      '{{accuracy}}% accuracy.\nShallow prep fails when options look similar.',
      '{{sessionsThisWeek}} match sessions this week.\n{{examName}} questions come dressed up. I\'m ready.',
    ],
    boards: [
      '{{score}}/{{totalAsked}} in {{examName}} Match Mode.\nUnderstanding concepts, not memorising.',
      '{{score}} correct pairs.\n{{examName}} exams test relationships between ideas. Practicing that.',
      '{{score}}/{{totalAsked}} pairs correct.\nRelationships between ideas — boards test this more than facts.',
      '{{accuracy}}% in Match Mode on {{examName}}.\nKnowing concepts ≠ knowing how they connect.',
      '{{sessionsThisWeek}} sessions this week.\nBoards papers ask questions that connect chapters.',
    ],
  },

  mario: {
    psu_with_interview: [
      'Level {{level}} cleared.\n{{examName}} prep that plays like a game but hits like real practice.',
      '{{streak}} correct in a row. Reached Level {{level}}.\n{{examName}} written test will feel easier.',
      'Level {{level}}. {{sessionsThisWeek}} sessions this week.\nMost {{examName}} aspirants study. I play and learn.',
      'Level {{level}} done.\nSame {{examName}} questions. Better engagement than staring at a PDF.',
      '{{streak}} day streak. Level {{level}}.\nHabit beats motivation. Showing up when it doesn\'t feel fun.',
      '{{sessionsThisWeek}} Mario sessions this week.\nIf it feels like a game, you do it more. I do it more.',
      '{{score}} correct in a row.\nSpeed + accuracy. {{examName}} written tests both.',
    ],
    psu_no_interview: [
      'Level {{level}}. {{examName}} CBT prep that doesn\'t feel like grinding.',
      'Reached Level {{level}} on {{examName}} questions.\nSame topics — more fun than flashcards.',
      'Level {{level}} cleared.\nCBT prep doesn\'t have to feel like punishment.',
      '{{streak}} correct in a row. Level {{level}}.\nSpeed + accuracy. Both matter on {{examName}} CBT.',
      '{{sessionsThisWeek}} sessions this week.\nConsistency over intensity. Showing up daily.',
      '{{score}} correct this run.\nSame syllabus as everyone else. Different engagement.',
    ],
    boards: [
      'Level {{level}} in {{examName}} Mario Mode.\nLearning that doesn\'t feel like studying.',
      '{{streak}} correct in a row. Level {{level}}.\n{{examName}} just got interesting.',
      'Level {{level}} in {{examName}}.\n{{sessionsThisWeek}} sessions this week. Boards prep that doesn\'t need willpower.',
      '{{score}} correct in Mario Mode.\nSame syllabus. Way more engaging than reading.',
      '{{streak}} day streak on {{examName}}.\nCompounding isn\'t just for finance.',
      '{{sessionsThisWeek}} sessions this week.\nWho studies boards like this? Apparently I do.',
    ],
  },

  slasher: {
    psu_with_interview: [
      '{{score}} topics slashed.\n{{examName}} {{branchShort}} syllabus won\'t be unfamiliar territory.',
      '{{accuracy}}% accuracy. {{score}} slashed.\n{{examName}} technical round tests the same topics.',
      '{{score}} correct. {{remaining}} wrong.\nAt least I know exactly where I stand on {{examName}}.',
      '{{score}} correct.\nSlasher Mode: same {{examName}} technical content, tighter time window.',
      '{{accuracy}}% accuracy.\nSpeed under pressure is the only kind that counts.',
      '{{sessionsThisWeek}} slasher sessions this week.\n{{examName}} {{branchShort}} — no topic left uncut.',
      '{{score}}/{{totalAsked}} at speed.\nExam clock runs for everyone. I\'m used to it.',
    ],
    psu_no_interview: [
      '{{score}} topics slashed.\n{{examName}} CBT has {{totalAsked}} questions. I\'m covering the syllabus.',
      '{{accuracy}}% accuracy on {{examName}} topics.\nCutoff doesn\'t care about intent — only results.',
      '{{score}} correct on {{examName}} topics.\nFast + accurate. CBT rewards both.',
      '{{accuracy}}% accuracy, speed included.\nSlowing down for safety doesn\'t work when the clock runs.',
      '{{sessionsThisWeek}} sessions this week.\n{{examName}} written is timed. So is my prep.',
      '{{score}}/{{totalAsked}} slashed.\nSyllabus coverage + speed. Both columns filled.',
    ],
    boards: [
      '{{score}} topics in {{examName}} slashed.\nChapter by chapter, not in one panic session.',
      '{{accuracy}}% accuracy. {{score}} correct.\n{{examName}} topics — covered, not just read.',
      '{{score}} topics cut.\nBoards questions come from everywhere. Covering everywhere.',
      '{{accuracy}}% accuracy at speed.\nBoard exams don\'t give extra time for hesitation.',
      '{{sessionsThisWeek}} sessions this week.\n{{score}} topics down. The rest are next.',
      '{{score}}/{{totalAsked}} correct.\nBoards syllabus is wide. Going through it anyway.',
    ],
  },

  tsunami: {
    psu_with_interview: [
      '{{bestCombo}}x best combo.\n{{examName}} {{branchShort}} — judgment calls, not just recall.',
      '{{score}} statements judged. {{bestCombo}}x streak.\n{{examName}} panel tests judgment too.',
      '{{bestCombo}} in a row without a mistake.\nTrue/False on {{examName}} content. Reflexes, not guesses.',
      '{{score}} correct, {{bestCombo}}x best combo.\nTrue or False looks simple until the streak breaks.',
      '{{sessionsThisWeek}} tsunami sessions this week.\nFact verification at speed — underrated {{examName}} skill.',
      '{{score}} correct swipes.\nKnow what\'s true. Know it fast. {{examName}} clock doesn\'t pause.',
      '{{bestCombo}}x streak today.\nOne wrong answer resets everything. Training for that.',
    ],
    psu_no_interview: [
      '{{bestCombo}}x combo. {{examName}} CBT has True/False judgment too.\nPracticing mine.',
      '{{score}} correct. {{bestCombo}}x best streak.\nFast judgment. {{examName}} clock doesn\'t wait.',
      '{{score}} correct swipes.\n{{examName}} CBT tests facts. I test myself first.',
      '{{bestCombo}}x streak. {{score}} total correct.\nSlip once and the combo resets. Sound familiar?',
      '{{sessionsThisWeek}} sessions this week.\nKnowing things is different from knowing them fast.',
      '{{score}} correct.\nFact fluency isn\'t the same as fact familiarity.',
    ],
    boards: [
      '{{bestCombo}}x combo in {{examName}} Tsunami.\nFast recall — not just understanding.',
      '{{score}} correct swipes. {{examName}} exams test speed too.\nBuilding both.',
      '{{score}} correct in Tsunami.\n{{bestCombo}}x best combo on {{examName}} content.\nFact fluency, not just familiarity.',
      '{{sessionsThisWeek}} sessions this week.\nBoards rewards accurate and fast. Training both.',
      '{{score}} correct, {{bestCombo}}x combo.\n{{examName}} papers are timed. My answers aren\'t slow.',
      '{{bestCombo}} in a row.\nMistakes reset the streak. So I stop making them.',
    ],
  },

  pi: {
    psu_with_interview: [
      'AI panel gave me {{score}}/10.\nHave you done even one mock PI?',
      'Mock PI score: {{score}}/10.\n{{examName}} · {{branchShort}}. Prepared, not hoping.',
      '{{sessionsThisWeek}} mock PIs this week.\n{{examName}} interview won\'t be my first pressure situation.',
      '{{score}}/10 on mock PI.\nMost {{examName}} candidates walk in without a single practice run.',
      '{{sessionsThisWeek}} mock PI sessions this week.\nPanel pressure isn\'t something you prepare for in theory.',
      '{{score}}/10 today.\nInterview round eliminates people who only prepared the written part.',
      'PI score: {{score}}/10.\n{{examName}} shortlist is 10x narrower by the final round. I\'m ready for it.',
      '{{sessionsThisWeek}} PIs this week.\nWalking into a panel cold is a choice. Not mine.',
    ],
    psu_no_interview: [],
    boards: [],
  },

  gd: {
    psu_with_interview: [
      'Mock GD: {{score}}/10.\nMost {{examName}} aspirants skip GD prep entirely.',
      '{{sessionsThisWeek}} GD sessions this week.\n{{examName}} eliminates confident-but-unprepared speakers.',
      'GD score {{score}}/10.\n{{examName}} shortlists people who think out loud.\nI\'m practicing that.',
      'GD score: {{score}}/10.\nStructured argument beats confident rambling. Practicing the difference.',
      '{{sessionsThisWeek}} GD sessions this week.\n{{examName}} panel remembers who spoke clearly. Not who spoke most.',
      '{{score}}/10 mock GD.\nMost aspirants skip GD prep. That\'s the opportunity.',
      '{{score}}/10 today.\nGD isn\'t about knowing more — it\'s about communicating clearly under pressure.',
      '{{sessionsThisWeek}} sessions this week.\nGroup discussion is a skill. Skills are trained, not wished for.',
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
  '{{streak}} day streak.\nShowing up is the rarest competitive advantage.',
  '{{sessionsThisWeek}} sessions this week.\nSame syllabus, different preparation levels. Simple.',
  'The gap isn\'t intelligence.\nIt\'s who practiced more questions.',
  '{{streak}} days straight.\nNot every session is perfect. That\'s not the point.',
  'Nobody feels ready before a hard exam.\nThe ones who practice feel less unprepared.',
  'Preparation doesn\'t guarantee the result.\nBut it changes the probability.',
  '{{sessionsThisWeek}} sessions this week.\nCompetition is also preparing. Probably less than this.',
  'Exam date is fixed.\nOnly variable is how much got done before it.',
];

// ─── Engine ───────────────────────────────────────────────────────────────────

function getPool(mode: GameMode, exam: ExamConfig): string[] {
  const modePool = TEMPLATES[mode];

  if (mode === 'pi' && !exam.interviewStages.includes('Technical PI')) return EVERGREEN;
  if (mode === 'gd' && !exam.interviewStages.includes('GD')) return EVERGREEN;

  const pool = modePool[contextKey(exam)];
  return pool.length > 0 ? [...pool, ...EVERGREEN] : EVERGREEN;
}

export function pickFOMOLine(mode: GameMode, vars: CardVars): string {
  let pool = getPool(mode, vars.exam);

  // Drop templates that reference data we don't have — prevents "Rank #— of —" placeholders.
  const hasRank = vars.rank != null;
  const hasPercentile = vars.percentile != null;
  if (!hasRank || !hasPercentile) {
    const filtered = pool.filter(t =>
      (hasRank       || !t.includes('{{rank}}')) &&
      (hasPercentile || !t.includes('{{percentile}}')) &&
      (hasRank       || !t.includes('{{totalPlayers}}'))
    );
    if (filtered.length > 0) pool = filtered;
  }

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
