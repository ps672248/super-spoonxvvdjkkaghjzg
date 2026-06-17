import { schoolingExams } from './exams/schooling';

export type ExamSection = {
  id: string;
  name: string;
  icon: string; // Ionicons name
  color: string;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  weightagePercent: number;
  /** Question difficulty band 1-10. Queries use this range against the shared bank. */
  difficultyRange: [number, number];
  branchSpecific: boolean;
  description: string;
  studyTip?: string; // section-specific exam strategy
};

export type ExamConfig = {
  id: string;
  name: string;
  fullName: string;
  color: string;
  bgColor: string;
  icon: string; // emoji
  ionicon?: string; // Ionicons name
  examType: 'CBT' | 'PSU' | 'Boards' | 'Entrance' | 'SSC';
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarking: number; // 0 = none, 0.25 = -1/4, 0.33 = -1/3
  branches: string[]; // branch/stream IDs ([] = no sub-track, e.g. Class 9/10)
  sections: ExamSection[];
  tipText: string; // exam-specific strategy tip
  prepTips: Record<string, string>; // branchId → branch-specific exam strategy
  hasInterview: boolean; // whether the exam conducts GD/PI rounds after the written test
  interviewStages: ('GD' | 'Technical PI' | 'HR PI')[]; // post-written selection stages
  interviewTip?: string; // overall GD/PI strategy
  gdTopics?: string[]; // real historical GD topics from past recruitment cycles — injected into Gemini prompt
};

/** @deprecated Use ExamConfig — kept as an alias for back-compat. */
export type PSUConfig = ExamConfig;

const CORE_EXAMS: ExamConfig[] = [
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
    branches: ['mechanical', 'electrical', 'civil', 'chemical', 'cs'],
    tipText: 'HPCL is one of the toughest PSU CBTs. Technical section is GATE-level. Accuracy > speed.',
    prepTips: {
      mechanical: 'Thermodynamics + Fluid Mechanics = ~40Q. Steam turbines and refrigeration cycles are HPCL favourites.',
      electrical: 'Electrical Machines + Power Systems = ~45Q. Transformer OC/SC tests and induction motor torque-speed are repeated.',
      civil:      'Structural Analysis + RCC Design = ~40Q. IS 456 limit state design questions are HPCL staples.',
      chemical:   'Mass Transfer + Heat Transfer = ~40Q. Process Control and Instrumentation carry significant marks in HPCL CH.',
      cs:         'DSA + DBMS + Networks = ~40Q. HPCL CS/IT Officer paper tests industrial automation, ERP systems and IT infrastructure in refinery context.',
    },
    hasInterview: true,
    interviewStages: ['GD', 'Technical PI', 'HR PI'],
    interviewTip: 'HPCL GD topics lean toward energy policy & sustainability. In PI connect fundamentals to refinery operations context. Panel tests clarity of thought, not jargon. Know HPCL\'s Visakh and Mumbai refineries.',
    gdTopics: [
      'India\'s energy transition: Should we accelerate EV adoption or focus on refinery capacity expansion?',
      'Carbon neutrality by 2070 — achievable for India\'s petroleum sector?',
      'Petrol and diesel price deregulation: Good or bad for common citizens?',
      'Renewable energy and petroleum — competitors or co-existing pillars of India\'s energy security?',
      'LPG subsidy reform: Targeted subsidies vs universal access',
      'India\'s dependence on crude oil imports — strategic risk and solutions',
      'Should PSU refineries diversify into petrochemicals to remain relevant?',
    ],
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 85, marksPerQuestion: 1, totalMarks: 85,
        weightagePercent: 50, difficultyRange: [5, 7], branchSpecific: true,
        description: 'Core engineering — GATE-aligned, application-heavy questions',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 30, marksPerQuestion: 1, totalMarks: 30,
        weightagePercent: 17.6, difficultyRange: [2, 5], branchSpecific: false,
        description: 'DI, arithmetic, algebra, geometry, probability',
        studyTip: '−0.25 negative. DI + Arithmetic = ~18 safe Qs. Skip tricky Geometry/Probability if unsure. Quant is not the differentiator here — accuracy matters more than coverage.',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 30, marksPerQuestion: 1, totalMarks: 30,
        weightagePercent: 17.6, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Puzzles, series, blood relations, coding-decoding',
        studyTip: '−0.25 negative. Puzzle sets = 5Q block — solve all or skip the whole set. Series + Analogy + Coding = fast individual marks. Do these first.',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 14.7, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Grammar, vocabulary, comprehension, sentence correction',
        studyTip: 'RC appears as 2 passages × 5Q. Grammar is safest — attempt Vocabulary only if confident in exact word meanings. −0.25 negative applies here too.',
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
    branches: ['mechanical', 'electrical', 'civil', 'metallurgy', 'mining', 'cs'],
    tipText: 'SAIL CBT is speed-based — 200 Qs in 120 min. Work on time management more than depth.',
    prepTips: {
      mechanical:  'Speed is critical — 100 tech Qs in 72 min. Thermodynamics, SOM, and Manufacturing carry most marks.',
      electrical:  'Machines + Circuits = ~40Q. SAIL EE is speed-based — reduce per-question solving time.',
      civil:       'Structural Analysis is highest yield. SAIL civil paper has a steel structures focus.',
      metallurgy:  'Iron-Carbon diagram + Phase Transformations = ~25Q. SAIL tests practical steel-making knowledge.',
      mining:      'Mining Methods + Ventilation = ~30Q. Mine Safety regulations carry memory-based marks.',
      cs:          'DSA + DBMS = ~35Q. SAIL CS paper is speed-based — practice quick code tracing.',
    },
    hasInterview: true,
    interviewStages: ['GD', 'Technical PI', 'HR PI'],
    interviewTip: 'SAIL GD topic is often around steel industry, manufacturing, or Make in India. PI panel weights CBT 75% + GD 10% + PI 15% in final merit. Show you know SAIL plants (Bhilai, Durgapur, Rourkela, Bokaro) and their specializations.',
    gdTopics: [
      'Make in India in the steel sector: Opportunities and challenges',
      'China\'s steel dumping: How should India protect its steel industry?',
      'Green steel manufacturing — is India ready to decarbonize steelmaking?',
      'Infrastructure development and steel demand: Impact of PM Gati Shakti',
      'Scrap-based steelmaking vs integrated steel plants: Which is the future for India?',
      'Should India increase steel export capacity or focus on domestic consumption?',
      'Automation in steel plants: Threat to employment or path to competitiveness?',
    ],
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 100, marksPerQuestion: 1, totalMarks: 100,
        weightagePercent: 50, difficultyRange: [4, 7], branchSpecific: true,
        description: 'Core engineering subjects with emphasis on steel/manufacturing context',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 35, marksPerQuestion: 1, totalMarks: 35,
        weightagePercent: 17.5, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Arithmetic, algebra, DI, number system',
        studyTip: 'Speed-based paper — 36 sec/Q overall. Arithmetic carries ~15Q. DI = 1 chart set (5Q). Skip long multi-step calculations. −0.25 negative applies.',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 35, marksPerQuestion: 1, totalMarks: 35,
        weightagePercent: 17.5, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Verbal and non-verbal reasoning, puzzles, series',
        studyTip: '35 Qs — Series + Analogy = quick ~10 marks in 5 min. Bank the time savings for puzzles. Para-based sets: solve all or skip to avoid partial −0.25 losses.',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 10, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Grammar, vocabulary, reading comprehension',
        studyTip: 'RC + Grammar = ~15 safe Qs. Para Jumbles are a SAIL staple — practice sequencing daily. −0.25 negative: avoid guessing synonyms.',
      },
      {
        id: 'gk', name: 'General Knowledge', icon: 'globe',
        color: '#8E24AA', questionCount: 10, marksPerQuestion: 1, totalMarks: 10,
        weightagePercent: 5, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Current affairs, steel industry, Indian economy',
        studyTip: 'Only 10 Qs — steel industry knowledge (SAIL plants, capacity, products) = ~3 bonus marks most candidates miss. Current Affairs = remaining 7Q.',
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
    branches: ['mechanical', 'electrical', 'civil', 'cs', 'hr_finance'],
    tipText: '⚠️ MSTC has 1/3 negative marking — the highest among CBT PSUs. Never guess blindly!',
    prepTips: {
      mechanical:  '1/3 negative marking — never guess. Only attempt questions you are 90%+ confident about.',
      electrical:  'Circuits + Machines = ~25Q. With 1/3 negative, skip any doubtful questions.',
      civil:       'Structural + Geotechnical = ~25Q. MSTC tests standard theory — accuracy over coverage.',
      cs:          'DSA + Networks = ~25Q. MSTC has 1/3 negative — precision beats speed here.',
      hr_finance:  'HRM + Finance = ~30Q. Avoid wild guesses — 1/3 negative marking applies to HR too.',
    },
    hasInterview: true,
    interviewStages: ['GD', 'Technical PI', 'HR PI'],
    interviewTip: 'MSTC interview is HR-focused with a short technical round. Know MSTC\'s core business (e-commerce auctions, scrap trading, recycling). GD topic is often on digital India, e-commerce or sustainability. Demonstrate commercial and technical aptitude.',
    gdTopics: [
      'GeM portal vs private e-commerce: Can government procurement go fully digital?',
      'Circular economy and scrap recycling: Opportunity for India\'s industrial sector',
      'Digital India initiative: Impact on public sector enterprises like MSTC',
      'E-auction vs traditional tendering: Transparency, efficiency and challenges',
      'Extended Producer Responsibility (EPR) in India: Challenges and opportunities',
      'Should India mandate scrap-based raw material usage in manufacturing?',
    ],
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 60, marksPerQuestion: 1, totalMarks: 60,
        weightagePercent: 50, difficultyRange: [4, 6], branchSpecific: true,
        description: 'Core engineering + e-commerce/trade context for technical roles',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 16.7, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Arithmetic, DI, percentages, ratios',
        studyTip: '⚠️ 1/3 negative marking. Only attempt if 90%+ confident. DI and Arithmetic are safer than Geometry or Probability. 4 wrong answers cancel 3 correct — be ruthless about skipping.',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 16.7, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Analytical reasoning, pattern recognition, puzzles',
        studyTip: '⚠️ 1/3 negative. Stick to Series, Analogy, Coding-Decoding — these have definitive answers. Skip puzzles unless the pattern is crystal clear.',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 16.7, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Reading comprehension, vocabulary, grammar',
        studyTip: '⚠️ 1/3 negative. Attempt Grammar + RC confidently — these have clear right answers. Skip Vocabulary (synonyms/antonyms) unless the meaning is certain.',
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
    branches: ['mining','cs', 'electrical', 'mechanical', 'civil', 'hr_finance'],
    tipText: '✅ CIL has NO negative marking — attempt all questions! Focus on mining engineering if applicable.',
    prepTips: {
      mining:      'No negative marking — attempt everything. Mine Safety, CIL regulations and Ventilation are highest yield.',
      cs:          'No negative marking — attempt all. DSA + OS + DBMS = ~50Q for CIL CS paper.',
      electrical:  'No negative marking. Machines + Power Systems + Circuits = ~50Q. CIL EE focuses on practical applications.',
      mechanical:  'No negative marking — attempt all. Thermodynamics + Manufacturing + SOM = ~50Q.',
      civil:       'No negative marking. Structural + Geotech + Water Resources = ~50Q.',
      hr_finance:  'No negative marking. Labour Laws (CIL-specific), HRM and OB = ~50Q. Attempt every question.',
    },
    hasInterview: false,
    interviewStages: [],
    sections: [
      {
        id: 'technical', name: 'Professional Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 100, marksPerQuestion: 1, totalMarks: 100,
        weightagePercent: 50, difficultyRange: [3, 6], branchSpecific: true,
        description: 'Discipline-specific engineering + Coal sector awareness',
      },
      {
        id: 'gk', name: 'General Awareness', icon: 'globe',
        color: '#8E24AA', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 12.5, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Indian GK, current affairs, Coal India sector, economy',
        studyTip: '✅ No negative marking — attempt all 25. Coal India sector GK (subsidiaries, production, safety regulations) = ~5 bonus marks others miss. Current Affairs = 12+ Qs.',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 12.5, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Syllogism, blood relations, series, seating arrangement',
        studyTip: '✅ No negative marking — attempt every question including puzzles (5Q sets are worth the time). Series + Analogy = ~10 fast Qs to open with.',
      },
      {
        id: 'quant', name: 'Numerical Ability', icon: 'calculator',
        color: '#F57C00', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 12.5, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Arithmetic, mensuration, simple/compound interest',
        studyTip: '✅ No negative marking — attempt all 25 Qs. CIL quant is simpler than HPCL/SAIL. Arithmetic dominates (SI, CI, percentages, ratios). Guess if needed.',
      },
      {
        id: 'english', name: 'General English', icon: 'text',
        color: '#43A047', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 12.5, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Comprehension, para jumbles, synonyms/antonyms',
        studyTip: '✅ No negative marking — attempt every question. RC + Grammar = 15 near-certain marks. Para Jumbles are easy in CIL. Full attempt is the right strategy.',
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
    branches: ['mechanical', 'electrical', 'electronics', 'civil', 'cs'],
    tipText: 'BHEL has the most questions (240) in 150 min — just 37 sec/question. Speed and accuracy are equally critical.',
    prepTips: {
      mechanical:  'Thermodynamics + Manufacturing = ~50Q of 120 tech Qs. Power plant engineering is uniquely important for BHEL ME.',
      electrical:  'Machines + Power Systems + Power Electronics = ~55Q. BHEL EE is power-sector heavy.',
      electronics: 'Analog + Digital + Microprocessors = ~55Q. BHEL EC tests embedded systems and industrial controls heavily.',
      civil:       'Structural + Geotech + RCC = ~55Q. BHEL civil focuses on heavy construction and power plant civil work.',
      cs:          'DSA + OS + Networks = ~55Q. BHEL CS is comprehensive — covers full GATE CS spectrum.',
    },
    hasInterview: true,
    interviewStages: ['Technical PI', 'HR PI'],
    interviewTip: 'BHEL has no GD — direct Tech PI + HR PI. Panelists are senior BHEL engineers from your discipline. Power plant engineering is asked regardless of branch. Know BHEL\'s manufacturing units and their products (transformers, turbines, boilers).',
    sections: [
      {
        id: 'technical', name: 'Technical Subjects', icon: 'book',
        color: '#3949AB', questionCount: 120, marksPerQuestion: 1, totalMarks: 120,
        weightagePercent: 50, difficultyRange: [5, 7], branchSpecific: true,
        description: 'Core engineering — power sector & heavy engineering emphasis',
      },
      {
        id: 'reasoning', name: 'Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 50, marksPerQuestion: 1, totalMarks: 50,
        weightagePercent: 20.8, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Logical, verbal, non-verbal reasoning, puzzles',
        studyTip: '50 Qs — highest reasoning count of all PSUs. Series + Analogy + Coding = ~20 fast Qs in 10 min. Save time for puzzles last. BHEL puzzles are medium difficulty.',
      },
      {
        id: 'english', name: 'General English', icon: 'text',
        color: '#43A047', questionCount: 50, marksPerQuestion: 1, totalMarks: 50,
        weightagePercent: 20.8, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Grammar, vocabulary, reading comprehension',
        studyTip: '50 Qs in BHEL English. Grammar (~12Q) + RC (~10Q) = 22 near-certain marks first. Para Jumbles + Vocabulary after. −0.25 applies — skip only ambiguous Vocabulary.',
      },
      {
        id: 'gk', name: 'General Knowledge', icon: 'globe',
        color: '#8E24AA', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 8.3, difficultyRange: [2, 4], branchSpecific: false,
        description: 'Current affairs, science & technology, energy sector',
        studyTip: 'BHEL GK is power-sector heavy. NTPC projects, POWERGRID expansion, nuclear energy, energy policy = ~5 bonus Qs. Current Affairs = ~10 Qs. Science & Tech = ~5 Qs.',
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
    branches: ['mechanical', 'chemical', 'electrical', 'civil', 'cs'],
    tipText: 'IOCL Technical section is 60% of the paper — domain mastery is the biggest differentiator.',
    prepTips: {
      mechanical: 'Thermodynamics + Fluid Mechanics + Heat Transfer = ~50Q. Refinery equipment context matters for IOCL ME.',
      chemical:   'Chemical Technology (refining processes) is uniquely important. Mass Transfer + CRE = ~40Q.',
      electrical: 'Machines + Power Systems = ~40Q. IOCL EE tests industrial electrical systems in refinery context.',
      civil:      'Structural + Fluid + Environmental = ~40Q. Pipeline engineering and refinery construction are tested.',
      cs:         'DSA + DBMS + Networks = ~45Q. IOCL CS focuses on industrial automation and IT systems.',
    },
    hasInterview: true,
    interviewStages: ['GD', 'Technical PI', 'HR PI'],
    interviewTip: 'IOCL GD is typically on energy, sustainability, or oil industry policy. PI panel asks refinery-context questions even for civil/electrical branches. Know IOC product portfolio and refinery locations (Panipat, Mathura, Barauni).',
    gdTopics: [
      'Natural gas as a bridge fuel in India\'s energy transition — viable or just a delay tactic?',
      'India\'s refinery capacity expansion: Strategic necessity or environmental risk?',
      'Electric vehicles and their impact on India\'s long-term oil demand',
      'One Nation One Gas Grid: Progress, challenges and impact',
      'Should India privatize downstream oil sector operations?',
      'E20 ethanol blending policy: Is India\'s fuel sector ready?',
      'Crude oil price volatility: How should India insulate its economy?',
    ],
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 90, marksPerQuestion: 1, totalMarks: 90,
        weightagePercent: 60, difficultyRange: [5, 7], branchSpecific: true,
        description: 'Oil & Gas context with core engineering principles',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 13.3, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Arithmetic, DI, algebra, geometry',
        studyTip: 'DI appears as case study in IOCL. Arithmetic + Algebra = ~14 safe Qs. −0.25 negative: skip Geometry if uncertain. Technical section is the differentiator — keep quant attempt time under 15 min.',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 13.3, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Pattern recognition, analogies, logical deductions',
        studyTip: 'Series + Coding-Decoding = fast ~8 Qs. IOCL puzzles are medium difficulty — attempt only if the logic pattern is clear within 30 sec. −0.25 negative applies.',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 13.3, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Vocabulary, sentence correction, comprehension',
        studyTip: 'RC passage is often on a technical/business topic. Grammar is formulaic and safest. Vocabulary: only attempt if word meaning is certain. −0.25 applies.',
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
    branches: ['petroleum', 'mechanical', 'electrical', 'electronics', 'geophysics'],
    tipText: 'ONGC has highest technical weightage (67%). Petroleum Engineering branch is uniquely tested here.',
    prepTips: {
      petroleum:  'Reservoir Engineering + Drilling = ~55Q. ONGC PE is the deepest petroleum exam — formation evaluation is key.',
      mechanical: 'Fluid Mechanics + Heat Transfer + Thermodynamics = ~50Q. ONGC ME tests production equipment in E&P context.',
      electrical: 'Machines + Power Systems + Control = ~50Q. ONGC EE tests offshore platform electrical systems.',
      electronics:'Instrumentation + Embedded Systems + Communication = ~50Q. ONGC EC tests industrial and offshore instruments.',
      geophysics: 'Seismic Methods = ~50Q. Well Logging + Gravity-Magnetic methods are tested in every ONGC GEO paper.',
    },
    hasInterview: true,
    interviewStages: ['GD', 'Technical PI', 'HR PI'],
    interviewTip: 'ONGC GT track (via GATE) includes GD + PI. GD topic leans toward energy security, E&P policy, or environment. Technical PI focuses on petroleum fundamentals regardless of branch. Know ONGC\'s major fields (Bombay High, KG Basin) and recent discoveries.',
    gdTopics: [
      'Deep sea oil exploration: Economic necessity vs environmental cost',
      'India\'s E&P policy — should we open upstream sector further to private players?',
      'ONGC\'s transition to renewable energy: Right strategy or distraction from core business?',
      'KG Basin gas production challenges: Lessons and the way forward',
      'Energy security vs climate commitments: India\'s dilemma',
      'Should India increase strategic petroleum reserves beyond current capacity?',
      'Conventional energy and renewables: Can they co-exist in India\'s energy mix?',
    ],
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 100, marksPerQuestion: 1, totalMarks: 100,
        weightagePercent: 66.7, difficultyRange: [5, 7], branchSpecific: true,
        description: 'Upstream oil & gas context, reservoir, drilling engineering',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 16.7, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Analytical, verbal, current affairs embedded',
        studyTip: 'Puzzles + Seating = ~10Q block in ONGC reasoning. Series + Analogy = fast 8 marks to open. −0.25 negative: skip incomplete puzzle sets rather than partial-attempt.',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 16.7, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Technical English, reading comprehension, vocabulary',
        studyTip: 'ONGC RC passages are often technical/scientific. Grammar + Error Spotting = safest 12 marks. Vocabulary: attempt only if meaning is 100% certain. −0.25 negative.',
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
    branches: ['mechanical', 'electrical', 'civil', 'chemical', 'cs'],
    tipText: 'BPCL is compact (100Q / 90 min) but high difficulty. Chemical engineers have a home-ground advantage.',
    prepTips: {
      mechanical: 'Compact paper — only ~25 tech Qs. Thermodynamics + Fluid = ~15Q. No room for weak topics.',
      electrical: 'Machines + Power Systems = ~15Q in ~25 tech Qs. High precision needed — 1/4 negative marking.',
      civil:      'Structural + RCC = ~15Q. BPCL civil focuses on refinery and petrochemical plant construction.',
      chemical:   'Petroleum refining knowledge is key differentiator. Mass Transfer + CRE = ~15Q.',
      cs:         'DSA + DBMS = ~15Q in ~25 tech Qs. No room for weak topics — only attempt confident answers.',
    },
    hasInterview: true,
    interviewStages: ['GD', 'Technical PI', 'HR PI'],
    interviewTip: 'BPCL has the most structured interview process: Case Discussion → GD → Tech PI → HR PI. GD uses data-driven scenarios (energy stats, market data). Know BPCL\'s Kochi and Mumbai refineries, Project Sankalp, and Nayara Energy stake.',
    gdTopics: [
      'Is India ready for energy transition? Balancing oil demand growth and renewable targets',
      'BPCL\'s privatization attempt: What went wrong and what are the lessons?',
      'Biofuels in India: E20 blending by 2025 — feasible or over-ambitious?',
      'LPG to PNG migration: Should India accelerate the shift in urban areas?',
      'EV charging infrastructure vs fuel retail: Where should oil PSUs invest?',
      'Oil marketing companies and their role in India\'s clean energy transition',
      'Should fuel retail be fully privatised in India?',
    ],
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 50, marksPerQuestion: 1, totalMarks: 50,
        weightagePercent: 50, difficultyRange: [4, 7], branchSpecific: true,
        description: 'Petroleum refining context with core engineering',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 20, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Arithmetic, DI, probability, algebra',
        studyTip: 'Compact 90-min paper — keep Quant under 18 min. Arithmetic + Algebra = ~14 reliable Qs. Skip probability unless intuition is clear. −0.25 negative applies.',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 20, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Coding-decoding, series, puzzles',
        studyTip: 'Series + Coding-Decoding = ~10 fast marks first. BPCL puzzles are medium — allocate max 2 min/puzzle; abandon if stuck. −0.25 negative: wrong puzzle set = costly.',
      },
      {
        id: 'english', name: 'English Language', icon: 'text',
        color: '#43A047', questionCount: 10, marksPerQuestion: 1, totalMarks: 10,
        weightagePercent: 10, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Grammar, vocabulary, sentence improvement',
        studyTip: 'Only 10 Qs — every point counts. Grammar = 4 safe marks. RC = 3-4 marks (1 passage). Skip ambiguous Vocabulary to protect against −0.25.',
      },
    ],
  },

  // ─── NTPC ───────────────────────────────────────────────────────────────────
  {
    id: 'ntpc',
    name: 'NTPC',
    fullName: 'National Thermal Power Corporation Ltd.',
    color: '#0D47A1',
    bgColor: '#E3F2FD',
    icon: '⚡',
    ionicon: 'thunderstorm',
    examType: 'CBT',
    totalQuestions: 150,
    totalMarks: 150,
    durationMinutes: 120,
    negativeMarking: 0,
    branches: ['mechanical', 'electrical', 'electronics', 'civil', 'cs'],
    tipText: 'No negative marking — attempt every question. Power sector GK is tested. NTPC favours depth over breadth in technical.',
    prepTips: {
      mechanical:  'Thermodynamics + Power Plant Engineering carry ~35Q. Steam cycles and turbine types are NTPC favourites. IC Engines rarely tested.',
      electrical:  'Machines + Power Systems = ~35Q. NTPC EE is power generation focused — generators and transformers tested deeply.',
      electronics: 'Analog + Microprocessors + Instrumentation = ~35Q. NTPC EC tests industrial control and DCS systems.',
      civil:       'Structural + Fluid Mechanics = ~35Q. NTPC civil focuses on power plant construction context.',
      cs:          'DSA + OS + DBMS = ~35Q. No negative marking — attempt all. NTPC CS covers full GATE CS spectrum.',
    },
    hasInterview: true,
    interviewStages: ['GD', 'Technical PI', 'HR PI'],
    interviewTip: 'NTPC GD is conditional but PI is confirmed. PI panel tests power plant knowledge depth — know thermal, hydro, and renewable context. Know NTPC capacity (70+ GW), RE targets, and recent NTPC Green Energy projects.',
    gdTopics: [
      'Coal power plants: Retire early for climate goals or continue for India\'s energy security?',
      'India\'s 500 GW renewable target by 2030: Achievable or aspirational?',
      'Nuclear energy — should India significantly expand its nuclear power capacity?',
      'Thermal power vs renewable energy for grid stability: The baseload problem',
      'Just transition: How to support coal-dependent communities moving to renewable economy?',
      'Pumped hydro storage — India\'s best bet for renewable energy storage?',
      'NTPC\'s transformation into a renewable energy company: Strategy or survival?',
    ],
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 75, marksPerQuestion: 1, totalMarks: 75,
        weightagePercent: 50, difficultyRange: [4, 6], branchSpecific: true,
        description: 'Core engineering — power sector context, GATE-level depth',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 16.7, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Puzzles, syllogism, blood relations, coding-decoding',
        studyTip: '✅ No negative marking — attempt all 25. Seating/Puzzles = 5Q sets: always worth attempting. Series + Analogy + Coding = ~12 fast Qs. Syllogism via Venn diagrams = guaranteed.',
      },
      {
        id: 'english', name: 'General English', icon: 'text',
        color: '#43A047', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 16.7, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Grammar, vocabulary, reading comprehension',
        studyTip: '✅ No negative marking — attempt every question. RC (1–2 passages) + Grammar = ~18 near-certain marks. Para Jumbles are standard — 30 sec approach: anchor on first/last sentence.',
      },
      {
        id: 'gk', name: 'General Knowledge', icon: 'globe',
        color: '#8E24AA', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 16.7, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Current affairs, power sector, Indian economy, NTPC projects',
        studyTip: '✅ No negative — attempt all 25. Power sector GK (NTPC capacity, thermal plants, green energy targets) = ~5 bonus marks. Current Affairs (last 6 months) = ~12Q. Economy = ~5Q.',
      },
    ],
  },

  // ─── POWERGRID ──────────────────────────────────────────────────────────────
  {
    id: 'powergrid',
    name: 'POWERGRID',
    fullName: 'Power Grid Corporation of India Ltd.',
    color: '#1565C0',
    bgColor: '#E3F2FD',
    icon: '🔌',
    ionicon: 'pulse',
    examType: 'CBT',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 120,
    negativeMarking: 0,
    branches: ['electrical', 'mechanical', 'civil', 'cs'],
    tipText: 'POWERGRID is 100% power transmission focused. EE branch has home-ground advantage — Machines, Power Systems, HVDC are the pillars.',
    prepTips: {
      electrical: 'Power Systems + Machines = ~50Q. Master HVDC, FACTS, protection schemes — these are POWERGRID-specific topics.',
      mechanical: 'Fluid Mechanics + Thermodynamics = ~50Q. POWERGRID ME tests cooling systems and mechanical equipment.',
      civil:      'Structural + Geotechnical = ~50Q. Tower foundations and substation construction are recurring contexts.',
      cs:         'DSA + Networks + OS = ~50Q. POWERGRID CS tests SCADA, utility software and grid IT systems.',
    },
    hasInterview: true,
    interviewStages: ['Technical PI', 'HR PI'],
    interviewTip: 'POWERGRID PI tests transmission engineering depth. Know HVDC projects (NER-Agra, Raipur-Dhule, Green Energy Corridors). EE candidates: master protection schemes and FACTS devices. Non-EE: connect your discipline to transmission infrastructure (tower foundations, cooling, IT/SCADA).',
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 100, marksPerQuestion: 1, totalMarks: 100,
        weightagePercent: 50, difficultyRange: [4, 6], branchSpecific: true,
        description: 'Core engineering — power transmission, HVDC, FACTS, protection emphasis',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 30, marksPerQuestion: 1, totalMarks: 30,
        weightagePercent: 15, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Analytical and verbal reasoning, puzzles, series',
        studyTip: '✅ No negative marking — attempt all 30. Seating Arrangement + Puzzles = ~12Q (high yield). Series + Coding + Blood Relations = 10 quick marks. Syllogism = 3–4 marks with Venn method.',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 30, marksPerQuestion: 1, totalMarks: 30,
        weightagePercent: 15, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Arithmetic, DI, algebra, number system',
        studyTip: '✅ No negative marking — attempt all 30. DI (bar/table/line) = ~10Q; work these methodically. Arithmetic + Algebra = ~15 marks. Guess Geometry/Probability confidently — no penalty.',
      },
      {
        id: 'english', name: 'General English', icon: 'text',
        color: '#43A047', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 10, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Grammar, vocabulary, reading comprehension',
        studyTip: '✅ No negative — attempt all. Grammar + RC = ~15 reliable marks. Fill-in-the-blank (Cloze Test type) appears in POWERGRID English. Para Jumbles: use first-sentence anchor strategy.',
      },
      {
        id: 'gk', name: 'General Knowledge', icon: 'globe',
        color: '#8E24AA', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 10, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Power sector, current affairs, Indian economy',
        studyTip: '✅ No negative — attempt all 20. Transmission sector facts (POWERGRID lines, HVDC projects, green corridor) = ~5 bonus marks. Current Affairs + Economy = ~12Q. Guess remaining.',
      },
    ],
  },

  // ─── GAIL ───────────────────────────────────────────────────────────────────
  {
    id: 'gail',
    name: 'GAIL',
    fullName: 'Gas Authority of India Limited',
    color: '#00695C',
    bgColor: '#E0F2F1',
    icon: '🔧',
    ionicon: 'flame',
    examType: 'CBT',
    totalQuestions: 160,
    totalMarks: 160,
    durationMinutes: 120,
    negativeMarking: 0.25,
    branches: ['mechanical', 'chemical', 'electrical', 'civil', 'cs'],
    tipText: 'GAIL is oil-and-gas oriented. Chemical and Mechanical branches are strongest fit. GK section includes energy sector questions.',
    prepTips: {
      mechanical: 'Fluid Mechanics + Thermodynamics = ~35Q. Pipeline hydraulics and compressor stations are GAIL-specific contexts.',
      chemical:   'Process Control + Mass Transfer + Chemical Technology (gas processing) = ~40Q. LNG and gas sweetening knowledge gives edge.',
      electrical: 'Machines + Power Systems = ~35Q. GAIL EE tests industrial electrical in gas plant and pipeline context.',
      civil:      'Structural + Fluid Mechanics = ~35Q. Cross-country pipeline construction and industrial civil work tested.',
      cs:         'DSA + DBMS + Networks = ~35Q. GAIL CS tests industrial automation, SCADA and pipeline IT systems.',
    },
    hasInterview: true,
    interviewStages: ['GD', 'Technical PI', 'HR PI'],
    interviewTip: 'GAIL GD topics lean toward energy transition, gas sector policy, and sustainability. PI connects your branch to pipeline/gas processing operations. Know GAIL\'s pipeline network (16,000+ km), CGD expansion, and LNG terminal at Dabhol.',
    gdTopics: [
      'Natural gas in India\'s energy transition: Role, challenges and long-term outlook',
      'City Gas Distribution expansion: Opportunity or challenge for urban India?',
      'Should India build more LNG import terminals to reduce gas supply risk?',
      'Gas pricing reform: Market-linked pricing vs administered pricing — pros and cons',
      'India\'s gas pipeline infrastructure: Where do we stand compared to global benchmarks?',
      'Hydrogen economy: Can GAIL lead India\'s transition to green hydrogen?',
      'Cross-border gas trade in South Asia: Potential and geopolitical challenges',
    ],
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 80, marksPerQuestion: 1, totalMarks: 80,
        weightagePercent: 50, difficultyRange: [4, 6], branchSpecific: true,
        description: 'Core engineering — oil & gas, pipeline, LNG context',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 15.6, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Arithmetic, DI, algebra, probability',
        studyTip: '−0.25 negative. DI + Arithmetic = ~16 safer Qs. GAIL quant is moderate — avoid multi-step probability guesses. Keep this section under 20 min; technical is the real differentiator.',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 25, marksPerQuestion: 1, totalMarks: 25,
        weightagePercent: 15.6, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Verbal and non-verbal reasoning, puzzles',
        studyTip: 'Series + Analogy + Coding = ~12 fast Qs first. Seating Arrangements = 5Q sets; only tackle if logic chain is clear in 90 sec. −0.25 negative: partial puzzle attempts are traps.',
      },
      {
        id: 'english', name: 'General English', icon: 'text',
        color: '#43A047', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 12.5, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Grammar, vocabulary, comprehension',
        studyTip: 'Grammar + RC (1 passage) = ~14 confident marks. GAIL English is standard — Para Jumbles appear frequently. −0.25 applies: skip Vocabulary synonyms if even slightly uncertain.',
      },
      {
        id: 'gk', name: 'General Knowledge', icon: 'globe',
        color: '#8E24AA', questionCount: 10, marksPerQuestion: 1, totalMarks: 10,
        weightagePercent: 6.3, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Energy sector, oil & gas industry, current affairs',
        studyTip: 'Only 10 Qs — oil & gas sector GK (GAIL pipeline network, CGD projects, LNG terminals) = ~3 bonus marks. Current Affairs = ~5Q. −0.25: skip if unsure; tech marks matter more.',
      },
    ],
  },

  // ─── NALCO ──────────────────────────────────────────────────────────────────
  {
    id: 'nalco',
    name: 'NALCO',
    fullName: 'National Aluminium Company Limited',
    color: '#5D4037',
    bgColor: '#EFEBE9',
    icon: '🏭',
    ionicon: 'business',
    examType: 'CBT',
    totalQuestions: 100,
    totalMarks: 100,
    durationMinutes: 90,
    negativeMarking: 0.25,
    branches: ['metallurgy', 'mechanical', 'electrical', 'civil', 'chemical'],
    tipText: 'NALCO is aluminium-sector focused. Metallurgy branch is uniquely advantaged. Extractive metallurgy and alumina refining are key.',
    prepTips: {
      metallurgy: 'Extractive Metallurgy (Al, Cu) + Physical Metallurgy = 70% of technical. Bayer Process and Hall-Héroult are must-know for NALCO.',
      mechanical: 'Fluid Mechanics + Thermodynamics + Manufacturing = ~25Q. NALCO ME tests aluminium casting and smelting equipment.',
      electrical: 'Machines + Power Systems + Power Electronics = ~25Q. NALCO EE focuses on smelter pot-line power control.',
      civil:      'Structural + Geotechnical = ~25Q. Standard questions — NALCO civil tests industrial construction context.',
      chemical:   'Extractive metallurgy process chemistry + Chemical Technology (Bayer process) = ~25Q.',
    },
    hasInterview: true,
    interviewStages: ['Technical PI', 'HR PI'],
    interviewTip: 'NALCO PI is straightforward — PI weightage is 10% of GATE+PI merit. Core branch fundamentals + aluminium sector knowledge. Know NALCO\'s Bayer process refinery at Damanjodi and smelter at Angul. Aluminium production capacity and recent capacity expansion is often asked.',
    sections: [
      {
        id: 'technical', name: 'Technical / Domain Knowledge', icon: 'book',
        color: '#3949AB', questionCount: 50, marksPerQuestion: 1, totalMarks: 50,
        weightagePercent: 50, difficultyRange: [3, 5], branchSpecific: true,
        description: 'Core engineering — aluminium sector, extractive processes, smelter context',
      },
      {
        id: 'reasoning', name: 'Logical Reasoning', icon: 'bulb',
        color: '#00ACC1', questionCount: 20, marksPerQuestion: 1, totalMarks: 20,
        weightagePercent: 20, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Verbal and non-verbal reasoning, puzzles, series',
        studyTip: '−0.25 negative. Series + Analogy = ~8 fast marks to start. Puzzles: only attempt if pattern is clear within 60 sec. Non-verbal (mirror images, cubes) = quick if practiced.',
      },
      {
        id: 'quant', name: 'Quantitative Aptitude', icon: 'calculator',
        color: '#F57C00', questionCount: 15, marksPerQuestion: 1, totalMarks: 15,
        weightagePercent: 15, difficultyRange: [2, 5], branchSpecific: false,
        description: 'Arithmetic, DI, algebra, number system',
        studyTip: 'Only 15 Qs — Arithmetic (SI, CI, Percentages, Ratios) = ~10 reliable marks. −0.25 negative: skip DI if data is complex. NALCO quant is moderate; speed over strategy here.',
      },
      {
        id: 'english', name: 'General English', icon: 'text',
        color: '#43A047', questionCount: 15, marksPerQuestion: 1, totalMarks: 15,
        weightagePercent: 15, difficultyRange: [1, 3], branchSpecific: false,
        description: 'Grammar, vocabulary, reading comprehension',
        studyTip: 'Grammar + RC = ~10 near-certain marks in 15 Qs. Error Spotting is NALCO English staple. −0.25 applies: skip Vocabulary unless 100% certain of meaning.',
      },
    ],
  },
];

// Schooling (Class 9–12) and other non-PSU exams live in their own files and are
// merged into the master exam list. ExamConfig is the shared shape.
export const PSUS: ExamConfig[] = [...CORE_EXAMS, ...schoolingExams];

export const getPSU = (id: string): ExamConfig | undefined =>
  PSUS.find(p => p.id === id);
