export type SectionDifficulty = 'low' | 'medium' | 'high';

export type ExamSection = {
  id: string;
  name: string;
  icon: string; // Ionicons name
  color: string;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  weightagePercent: number;
  difficulty: SectionDifficulty;
  branchSpecific: boolean;
  description: string;
};

export type PSUConfig = {
  id: string;
  name: string;
  fullName: string;
  color: string;
  bgColor: string;
  icon: string; // emoji
  ionicon?: string; // Ionicons name
  examType: 'CBT';
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarking: number; // 0 = none, 0.25 = -1/4, 0.33 = -1/3
  difficulty: 'medium' | 'high';
  branches: string[]; // branch IDs
  sections: ExamSection[];
  tipText: string; // exam-specific strategy tip
};

export const PSUS: PSUConfig[] = [
  // ─── HPCL ──────────────────────────────────────────────────────────────────
  {
    id: 'hpcl',
    name: 'HPCL',
    fullName: 'Hindustan Petroleum Corporation Ltd.',
    color: '#E65100',
    bgColor: '#FBE9E7',
    icon: '🔥',
    ionicon: 'flame',
    examType: 'CBT',
    totalQuestions: 170,
    totalMarks: 170,
    durationMinutes: 150,
    negativeMarking: 0.25,
    difficulty: 'high',
    branches: ['mechanical', 'electrical', 'civil', 'chemical'],
    tipText: 'HPCL is one of the toughest PSU CBTs. Technical section is GATE-level. Accuracy > speed.',
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 85, marksPerQuestion: 1, totalMarks: 85,
        weightagePercent: 50, difficulty: 'high', branchSpecific: true,
        description: 'Core engineering — GATE-aligned, application-heavy questions',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 30, marksPerQuestion: 1, totalMarks: 30,
        weightagePercent: 17.6, difficulty: 'medium', branchSpecific: false,
        description: 'DI, arithmetic, algebra, geometry, probability',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 30, marksPerQuestion: 1, totalMarks: 30,
        weightagePercent: 17.6, difficulty: 'medium', branchSpecific: false,
        description: 'Puzzles, series, blood relations, coding-decoding',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 14.7, difficulty: 'low', branchSpecific: false,
        description: 'Grammar, vocabulary, comprehension, sentence correction',
      },
    ],
  },

  // ─── SAIL ───────────────────────────────────────────────────────────────────
  {
    id: 'sail',
    name: 'SAIL',
    fullName: 'Steel Authority of India Ltd.',
    color: '#1565C0',
    bgColor: '#E3F2FD',
    icon: '🏗️',
    ionicon: 'business',
    examType: 'CBT',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 120,
    negativeMarking: 0.25,
    difficulty: 'high',
    branches: ['mechanical', 'electrical', 'civil', 'metallurgy', 'mining', 'cs'],
    tipText: 'SAIL CBT is speed-based — 200 Qs in 120 min. Work on time management more than depth.',
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 100, marksPerQuestion: 1, totalMarks: 100,
        weightagePercent: 50, difficulty: 'high', branchSpecific: true,
        description: 'Core engineering subjects with emphasis on steel/manufacturing context',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 35, marksPerQuestion: 1, totalMarks: 35,
        weightagePercent: 17.5, difficulty: 'medium', branchSpecific: false,
        description: 'Arithmetic, algebra, DI, number system',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 35, marksPerQuestion: 1, totalMarks: 35,
        weightagePercent: 17.5, difficulty: 'medium', branchSpecific: false,
        description: 'Verbal and non-verbal reasoning, puzzles, series',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 10, difficulty: 'low', branchSpecific: false,
        description: 'Grammar, vocabulary, reading comprehension',
      },
      {
        id: 'gk', name: 'General Knowledge', icon: 'globe',
        color: '#8E24AA', questionCount: 10, marksPerQuestion: 1, totalMarks: 10,
        weightagePercent: 5, difficulty: 'low', branchSpecific: false,
        description: 'Current affairs, steel industry, Indian economy',
      },
    ],
  },

  // ─── MSTC ───────────────────────────────────────────────────────────────────
  {
    id: 'mstc',
    name: 'MSTC',
    fullName: 'MSTC Limited',
    color: '#00695C',
    bgColor: '#E0F2F1',
    icon: '📦',
    ionicon: 'cube',
    examType: 'CBT',
    totalQuestions: 120,
    totalMarks: 120,
    durationMinutes: 90,
    negativeMarking: 0.33,
    difficulty: 'medium',
    branches: ['mechanical', 'electrical', 'civil', 'cs', 'hr_finance'],
    tipText: '⚠️ MSTC has 1/3 negative marking — the highest among CBT PSUs. Never guess blindly!',
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 60, marksPerQuestion: 1, totalMarks: 60,
        weightagePercent: 50, difficulty: 'medium', branchSpecific: true,
        description: 'Core engineering + e-commerce/trade context for technical roles',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 16.7, difficulty: 'medium', branchSpecific: false,
        description: 'Arithmetic, DI, percentages, ratios',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 16.7, difficulty: 'medium', branchSpecific: false,
        description: 'Analytical reasoning, pattern recognition, puzzles',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 16.7, difficulty: 'low', branchSpecific: false,
        description: 'Reading comprehension, vocabulary, grammar',
      },
    ],
  },

  // ─── CIL ────────────────────────────────────────────────────────────────────
  {
    id: 'cil',
    name: 'Coal India',
    fullName: 'Coal India Limited (CIL)',
    color: '#37474F',
    bgColor: '#ECEFF1',
    icon: '⛏️',
    ionicon: 'hammer',
    examType: 'CBT',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 180,
    negativeMarking: 0,
    difficulty: 'medium',
    branches: ['mining','cs', 'electrical', 'mechanical', 'civil', 'hr_finance'],
    tipText: '✅ CIL has NO negative marking — attempt all questions! Focus on mining engineering if applicable.',
    sections: [
      {
        id: 'technical', name: 'Professional Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 100, marksPerQuestion: 1, totalMarks: 100,
        weightagePercent: 50, difficulty: 'medium', branchSpecific: true,
        description: 'Discipline-specific engineering + Coal sector awareness',
      },
      {
        id: 'gk', name: 'General Awareness', icon: 'globe',
        color: '#8E24AA', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 12.5, difficulty: 'low', branchSpecific: false,
        description: 'Indian GK, current affairs, Coal India sector, economy',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 12.5, difficulty: 'medium', branchSpecific: false,
        description: 'Syllogism, blood relations, series, seating arrangement',
      },
      {
        id: 'quant', name: 'Numerical Ability', icon: 'calculator',
        color: '#F57C00', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 12.5, difficulty: 'medium', branchSpecific: false,
        description: 'Arithmetic, mensuration, simple/compound interest',
      },
      {
        id: 'english', name: 'General English', icon: 'text',
        color: '#43A047', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 12.5, difficulty: 'low', branchSpecific: false,
        description: 'Comprehension, para jumbles, synonyms/antonyms',
      },
    ],
  },

  // ─── BHEL ───────────────────────────────────────────────────────────────────
  {
    id: 'bhel',
    name: 'BHEL',
    fullName: 'Bharat Heavy Electricals Ltd.',
    color: '#6A1B9A',
    bgColor: '#F3E5F5',
    icon: '⚡',
    ionicon: 'flash',
    examType: 'CBT',
    totalQuestions: 240,
    totalMarks: 240,
    durationMinutes: 150,
    negativeMarking: 0.25,
    difficulty: 'high',
    branches: ['mechanical', 'electrical', 'electronics', 'civil', 'cs'],
    tipText: 'BHEL has the most questions (240) in 150 min — just 37 sec/question. Speed and accuracy are equally critical.',
    sections: [
      {
        id: 'technical', name: 'Technical Subjects', icon: 'book',
        color: '#3949AB', questionCount: 120, marksPerQuestion: 1, totalMarks: 120,
        weightagePercent: 50, difficulty: 'high', branchSpecific: true,
        description: 'Core engineering — power sector & heavy engineering emphasis',
      },
      {
        id: 'reasoning', name: 'Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 50, marksPerQuestion: 1, totalMarks: 50,
        weightagePercent: 20.8, difficulty: 'medium', branchSpecific: false,
        description: 'Logical, verbal, non-verbal reasoning, puzzles',
      },
      {
        id: 'english', name: 'General English', icon: 'text',
        color: '#43A047', questionCount: 50, marksPerQuestion: 1, totalMarks: 50,
        weightagePercent: 20.8, difficulty: 'low', branchSpecific: false,
        description: 'Grammar, vocabulary, reading comprehension',
      },
      {
        id: 'gk', name: 'General Knowledge', icon: 'globe',
        color: '#8E24AA', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 8.3, difficulty: 'medium', branchSpecific: false,
        description: 'Current affairs, science & technology, energy sector',
      },
    ],
  },

  // ─── IOCL ───────────────────────────────────────────────────────────────────
  {
    id: 'iocl',
    name: 'IOCL',
    fullName: 'Indian Oil Corporation Ltd.',
    color: '#C62828',
    bgColor: '#FFEBEE',
    icon: '🛢️',
    ionicon: 'water',
    examType: 'CBT',
    totalQuestions: 150,
    totalMarks: 150,
    durationMinutes: 120,
    negativeMarking: 0.25,
    difficulty: 'high',
    branches: ['mechanical', 'chemical', 'electrical', 'civil', 'cs'],
    tipText: 'IOCL Technical section is 60% of the paper — domain mastery is the biggest differentiator.',
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 90, marksPerQuestion: 1, totalMarks: 90,
        weightagePercent: 60, difficulty: 'high', branchSpecific: true,
        description: 'Oil & Gas context with core engineering principles',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 13.3, difficulty: 'medium', branchSpecific: false,
        description: 'Arithmetic, DI, algebra, geometry',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 13.3, difficulty: 'medium', branchSpecific: false,
        description: 'Pattern recognition, analogies, logical deductions',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 13.3, difficulty: 'low', branchSpecific: false,
        description: 'Vocabulary, sentence correction, comprehension',
      },
    ],
  },

  // ─── ONGC ───────────────────────────────────────────────────────────────────
  {
    id: 'ongc',
    name: 'ONGC',
    fullName: 'Oil and Natural Gas Corporation',
    color: '#E65100',
    bgColor: '#FFF3E0',
    icon: '🛠️',
    ionicon: 'construct',
    examType: 'CBT',
    totalQuestions: 150,
    totalMarks: 150,
    durationMinutes: 120,
    negativeMarking: 0.25,
    difficulty: 'high',
    branches: ['petroleum', 'mechanical', 'electrical', 'electronics', 'geophysics'],
    tipText: 'ONGC has highest technical weightage (67%). Petroleum Engineering branch is uniquely tested here.',
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 100, marksPerQuestion: 1, totalMarks: 100,
        weightagePercent: 66.7, difficulty: 'high', branchSpecific: true,
        description: 'Upstream oil & gas context, reservoir, drilling engineering',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 16.7, difficulty: 'medium', branchSpecific: false,
        description: 'Analytical, verbal, current affairs embedded',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 16.7, difficulty: 'low', branchSpecific: false,
        description: 'Technical English, reading comprehension, vocabulary',
      },
    ],
  },

  // ─── BPCL ───────────────────────────────────────────────────────────────────
  {
    id: 'bpcl',
    name: 'BPCL',
    fullName: 'Bharat Petroleum Corporation Ltd.',
    color: '#1B5E20',
    bgColor: '#E8F5E9',
    icon: '⛽',
    ionicon: 'flask',
    examType: 'CBT',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 90,
    negativeMarking: 0.25,
    difficulty: 'high',
    branches: ['mechanical', 'electrical', 'civil', 'chemical', 'cs'],
    tipText: 'BPCL is compact (100Q / 90 min) but high difficulty. Chemical engineers have a home-ground advantage.',
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 50, marksPerQuestion: 1, totalMarks: 50,
        weightagePercent: 50, difficulty: 'high', branchSpecific: true,
        description: 'Petroleum refining context with core engineering',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 20, difficulty: 'medium', branchSpecific: false,
        description: 'Arithmetic, DI, probability, algebra',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 20, difficulty: 'medium', branchSpecific: false,
        description: 'Coding-decoding, series, puzzles',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 10, marksPerQuestion: 1, totalMarks: 10,
        weightagePercent: 10, difficulty: 'low', branchSpecific: false,
        description: 'Grammar, vocabulary, sentence improvement',
      },
    ],
  },
];

export const getPSU = (id: string): PSUConfig | undefined =>
  PSUS.find(p => p.id === id);
