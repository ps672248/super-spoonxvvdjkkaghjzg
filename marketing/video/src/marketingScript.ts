/**
 * Dynamic Daily Marketing Script Engine
 *
 * Covers the 10 core Aspirant Arcade features, rotates across 14 relatable
 * aspirant settings, keeps up to 10 history entries PER feature inside
 * marketing_history.json so stories never repeat, and uses Gemini to write
 * a fresh 5-scene character dialogue reel every day.
 */
import path from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { MarketingSceneBeat } from './MarketingReel';
import type { MarketingFeatureId, MarketingSettingId } from './MarketingScenes';

export interface MarketingFeatureSpec {
  id: MarketingFeatureId;
  tag: string;
  title: string;
  pitch: string;
  howItWorks: string;
  modesAndControls?: string;
  painPoint: string;
  defaultSfx: 'phone_buzz' | 'alert_blip' | 'ding' | 'pop';
}

export const MARKETING_FEATURES: MarketingFeatureSpec[] = [
  {
    id: 'focus_guard',
    tag: 'FOCUS GUARD',
    title: 'Focus Guard (App Timer & Reel Interceptor)',
    pitch:
      'Focus Guard intercepts distracting apps and reels, forcing you to solve exam MCQs before unlocking screen time.',
    howItWorks:
      'When active, the app monitors your phone usage. Once your set limit is reached, an exam question overlay takes over the screen. You must answer your required number of questions correctly to unlock and resume scrolling.',
    modesAndControls:
      'Has 2 distinct modes: (1) App Timer Mode (intervenes after every X minutes of app usage, set by user), and (2) Reel Count Mode (intervenes after every X reels scrolled, set by user). User configures: X threshold value + Y required correct answers to unlock.',
    painPoint:
      'Aspirants losing 2–3 hours every night doomscrolling Instagram Reels and YouTube Shorts without realizing how much time or how many reels vanished.',
    defaultSfx: 'phone_buzz',
  },
  {
    id: 'short_notes',
    tag: 'SHORT NOTES',
    title: 'Short Notes for Every Exam',
    pitch:
      'Crisp, high-yield Short Notes organized by exam and chapter so you can revise key formulas and concepts in 5 minutes without opening 500-page PDFs.',
    howItWorks:
      'Browse by your target exam and subject (e.g. GATE Mechanical, SSC CGL Polity, UPSC History). Each chapter is distilled into formulas, key rules, and high-frequency exam traps with clean bullet points and KaTeX math formatting.',
    modesAndControls:
      'Exam-wise filtering, chapter bookmarking, search by topic, and formula quick-cards.',
    painPoint:
      'Getting overwhelmed by massive textbooks and bulky coaching PDFs right before exam week.',
    defaultSfx: 'pop',
  },
  {
    id: 'ai_notes_quiz',
    tag: 'AI NOTES + QUIZ',
    title: 'AI Notes + Quiz Overview & Marks Breakdown',
    pitch:
      'Generate custom AI notes on any weak topic paired with an instant quiz overview and exact marks breakdown.',
    howItWorks:
      'Type any topic or syllabus doubt. AI generates structured short notes, immediately followed by an interactive diagnostic quiz. When finished, you see your exact score, accuracy percentage, time taken, and line-by-line answer explanations.',
    modesAndControls:
      'Topic prompt input, adjustable quiz difficulty (1-10), instant markscard overview with correct vs incorrect breakdowns and negative marking calculation.',
    painPoint:
      'Reading passive notes without knowing how much you actually remember or where you lose marks on tricky options.',
    defaultSfx: 'ding',
  },
  {
    id: 'arcade_games',
    tag: '14+ ARCADE GAMES',
    title: '14+ Arcade Games for Stress-Free Learning',
    pitch:
      'Turn boring exam prep into 14+ fast, stress-free arcade games so studying feels addictive.',
    howItWorks:
      'Choose your exam syllabus and jump into action games like Cave Runner, Tsunami, Slasher, Survival, Speed Match, and MCQ Blitz. Solve questions under time pressure, maintain combos, earn XP, and level up.',
    modesAndControls:
      '14+ game mechanics: runner, survival dodging, card matching, speed blitz, combo multipliers, and exam category topic selection.',
    painPoint:
      'Burning out, eye strain, and feeling sleepy after solving hundreds of static black-and-white MCQ sheets.',
    defaultSfx: 'alert_blip',
  },
  {
    id: 'challenge_mode',
    tag: 'CHALLENGE MODE',
    title: 'Group Challenge Mode',
    pitch:
      'Create live multiplayer quiz lobbies, invite friends with a code, and compete in real-time quiz battles.',
    howItWorks:
      'One player creates a room and gets a 6-digit lobby code. Friends enter the code to join the lobby. When the host starts, all players receive identical questions with synchronized countdown timers, and a live scoreboard updates after every question.',
    modesAndControls:
      'Host/Join with 6-digit lobby PIN, 1v1 duel or group battle (up to 10 players), custom subject selection, synchronized question timer.',
    painPoint:
      'Feeling isolated, demotivated, and procrastinating while preparing alone in a hostel or PG room.',
    defaultSfx: 'alert_blip',
  },
  {
    id: 'daily_notifications',
    tag: 'EXAM ALERTS',
    title: 'Daily Recruitment, Result & Exam News Alerts',
    pitch:
      'Get targeted daily push notifications for PSU recruitment, SSC/GATE/JEE results, admit cards, and official exam updates.',
    howItWorks:
      'Select your target exam categories. When an official notification drops (admit card, recruitment drive, answer key, cutoff, result), you get a direct alert with verified dates, eligibility criteria, and official link.',
    modesAndControls:
      'Category-specific subscriptions (e.g. PSU Engineers, Banking, SSC, State PSC), instant result pings, zero spam.',
    painPoint:
      'Missing application deadlines or result announcements because updates get buried in spammy Telegram and WhatsApp groups.',
    defaultSfx: 'phone_buzz',
  },
  {
    id: 'category_insights',
    tag: 'INSIGHTS',
    title: 'Overall Quiz Insights by Exam Category',
    pitch:
      'See overall insights across every quiz played in your exam category — tracking accuracy trends, speed per question, and weak chapters.',
    howItWorks:
      'The app aggregates every attempt across quizzes, games, and mocks. Visual analytics display your accuracy percentage trend line, average time spent per question, and a subject-wise strength/weakness breakdown.',
    modesAndControls:
      'Weekly/monthly accuracy progression graphs, speed vs accuracy quadrant, weak topic identification, percentile ranking.',
    painPoint:
      'Taking dozens of mock tests blindly without tracking whether your speed and accuracy are actually improving or stagnating.',
    defaultSfx: 'ding',
  },
  {
    id: 'leaderboard',
    tag: 'LEADERBOARD',
    title: 'Competitive Leaderboard',
    pitch:
      'Climb the live Competitive Leaderboard against thousands of aspirants in your exam category and turn daily revision into a real rank battle.',
    howItWorks:
      'Every quiz solved, arcade game won, and daily streak maintained awards XP. The leaderboard ranks all active aspirants in your exam category in real time, displaying podium positions (🥇, 🥈, 🥉) and rank changes (e.g. ↑ +3 ranks).',
    modesAndControls:
      'Category-filtered rankings (All-India, Weekly, All-Time), user profile avatar, rank change delta indicators, daily streak bonus.',
    painPoint:
      'Having zero clue where you stand compared to actual competitors before the real exam day.',
    defaultSfx: 'ding',
  },
  {
    id: 'ai_interview_gd',
    tag: 'AI INTERVIEW & GD',
    title: 'AI Interview & GD/GT Simulator',
    pitch:
      'Practice PSU technical interviews, Group Discussions (GD), and Group Tasks (GT) with an AI simulator that evaluates clarity, confidence, and structure.',
    howItWorks:
      'Select your job profile or exam (e.g. ONGC, IOCL, BARC, Banking PO). The AI interviewer asks technical, situational, and HR questions aloud. You speak your answer; AI analyzes your speech and gives structured feedback using the STAR framework.',
    modesAndControls:
      'Voice-based interaction, PSU technical role selector, GD debate simulation, STAR method scorecards (Clarity, Structure, Technical depth).',
    painPoint:
      'Clearing the written exam cutoff with good marks but freezing up, rambling, or getting nervous in front of the real interview or GD panel.',
    defaultSfx: 'pop',
  },
  {
    id: 'bookmarks',
    tag: 'BOOKMARKS',
    title: 'Bookmark Questions to Remember & Re-Practice',
    pitch:
      'Bookmark tricky questions and negative-marking traps with one tap so you can revisit and re-practice them anytime before the exam.',
    howItWorks:
      'While solving any quiz or arcade game, tap the bookmark icon on any tricky trap or calculation mistake. Questions are organized into your "Bookmarked Traps" vault, where you can filter by subject and launch dedicated re-practice sessions.',
    modesAndControls:
      'One-tap bookmark toggle, subject categorization, dedicated "Re-Practice Saved Traps" quiz mode, auto-unmark when mastered.',
    painPoint:
      'Solving a tough question once, forgetting the trick a week later, and making the exact same negative-marking mistake in the exam.',
    defaultSfx: 'pop',
  },
];

export interface MarketingSettingSpec {
  id: MarketingSettingId;
  label: string;
  promptContext: string;
}

export const MARKETING_SETTINGS: MarketingSettingSpec[] = [
  {
    id: 'hostel_bedroom_2am',
    label: '2:30 AM Hostel Room',
    promptContext: 'Late night at 2:30 AM in a boys/girls hostel room, scrolling phone in the dark while syllabus is pending.',
  },
  {
    id: 'college_canteen_chai',
    label: 'College Canteen Chai Break',
    promptContext: 'Over cutting chai at the college canteen between lectures, venting about exam prep stress.',
  },
  {
    id: 'library_silent_corner',
    label: 'Quiet Library Corner',
    promptContext: 'Sitting in a silent reading hall surrounded by intimidating 800-page reference books.',
  },
  {
    id: 'exam_center_gate',
    label: 'Outside Exam Center Gate',
    promptContext: 'Standing outside an exam center gate 30 minutes before entry with last-minute panic.',
  },
  {
    id: 'metro_bus_commute',
    label: 'Evening Metro / Bus Commute',
    promptContext: 'Traveling home in a crowded metro or bus, trying to revise or wasting travel time scrolling.',
  },
  {
    id: 'home_study_desk',
    label: 'Rainy Night Study Desk at Home',
    promptContext: 'At home late at night with rain outside the window, getting distracted or hitting study fatigue.',
  },
  {
    id: 'coaching_corridor',
    label: 'Coaching Corridor After Mock Test',
    promptContext: 'Standing in the corridor right after mock test scores come out and friends compare marks.',
  },
  {
    id: 'pg_room_roommate',
    label: 'Shared PG Room With Topper Roommate',
    promptContext: 'In a shared PG room where one roommate is relaxed & scoring well while the other is panicking.',
  },
  {
    id: 'rooftop_evening_walk',
    label: 'Hostel Rooftop Evening Walk',
    promptContext: 'Pacing on the hostel terrace at sunset stressed about upcoming cutoffs and competition.',
  },
  {
    id: 'coffee_shop_prep',
    label: 'Weekend Cafe Study Session',
    promptContext: 'Weekend study session at a neighborhood cafe trying to stay productive instead of scrolling.',
  },
  {
    id: 'morning_alarm_bed',
    label: '6:00 AM Morning Alarm Struggle',
    promptContext: 'Waking up at 6 AM to an alarm, tempted to scroll in bed for "just 5 minutes" before studying.',
  },
  {
    id: 'interview_waiting_lounge',
    label: 'Interview Panel Waiting Lounge',
    promptContext: 'Sitting nervously in formal attire outside a PSU or placement interview room waiting for your turn.',
  },
  {
    id: 'study_group_table',
    label: 'Hostel Group Study Table',
    promptContext: 'Friends gathered around a hostel table debating tough questions and challenging each other.',
  },
  {
    id: 'park_bench_evening',
    label: 'Evening Park Walk After Revision',
    promptContext: 'Taking a quick evening breather on a park bench talking about smart prep habits.',
  },
  {
    id: 'tea_stall_tapri',
    label: '1:00 AM Roadside Chai Tapri',
    promptContext: 'Standing by a roadside tea stall at 1:00 AM under a street lamp, sipping hot cutting chai while debating upcoming cutoffs.',
  },
  {
    id: 'railway_station_platform',
    label: 'Exam Special Train Platform',
    promptContext: 'Sitting on a station bench with a heavy backpack and revision notes waiting for the night train to the exam city.',
  },
  {
    id: 'hostel_mess_table',
    label: 'Hostel Mess Dining Table',
    promptContext: 'Over noisy hostel mess dinner with steel thali plates, arguing about tricky PYQs and negative marks.',
  },
  {
    id: 'cyber_cafe_portal',
    label: 'Cyber Cafe Admit Card Rush',
    promptContext: 'Packed inside an internet cafe with other aspirants trying to download admit cards before portal servers crash.',
  },
  {
    id: 'book_market_street',
    label: 'Competitive Exam Book Market Alley',
    promptContext: 'Walking through a famous student book market (like Mukherjee Nagar or Kalu Sarai) hunting for top-rank notes.',
  },
  {
    id: 'post_exam_auto_ride',
    label: 'Auto-Rickshaw Ride After Exam',
    promptContext: 'Riding an auto-rickshaw right after submitting the exam paper, frantically cross-checking doubtful questions.',
  },
  {
    id: 'terrace_night_study',
    label: 'Midnight Terrace Pacing With Headphones',
    promptContext: 'Pacing under open night stars on the hostel terrace with headphones on, trying to memorize stubborn formulas.',
  },
  {
    id: 'coaching_classroom_backbench',
    label: 'Coaching Lecture Hall Backbench',
    promptContext: 'Sitting on the backbench of a packed 300-student coaching classroom, struggling to see the blackboard.',
  },
  {
    id: 'bus_stop_rain_wait',
    label: 'Bus Stop Shelter in Heavy Rain',
    promptContext: 'Stuck under a leaking bus shelter in the rain after mock tests, clutching a damp syllabus sheet.',
  },
  {
    id: 'hostel_balcony_dawn',
    label: '5:30 AM Hostel Balcony Dawn',
    promptContext: 'Standing on the hostel balcony at 5:30 AM watching the orange sunrise before a 12-hour revision marathon.',
  },
  {
    id: 'university_auditorium',
    label: 'University Seminar Auditorium',
    promptContext: 'Sitting in a massive university auditorium attending an intimidating topper talk or placement orientation.',
  },
  {
    id: 'food_truck_snack',
    label: 'Evening Roll / Samosa Stall Break',
    promptContext: 'Quick 15-minute evening street snack break near coaching center, venting about mock test percentiles.',
  },
  {
    id: 'hostel_corridor_midnight',
    label: 'Dimly Lit Hostel Corridor Memorizing Walk',
    promptContext: 'Pacing up and down a quiet hostel corridor at midnight with a notebook, trying not to wake sleeping roommates.',
  },
  {
    id: 'xerox_photocopy_shop',
    label: 'Coaching Xerox Shop Notes Stacks',
    promptContext: 'Surrounded by towering reams of paper at the coaching photocopy shop, waiting for topper short notes.',
  },
  {
    id: 'temple_stairs_blessing',
    label: 'Temple Steps on Exam Morning',
    promptContext: 'Climbing temple steps on the morning of exam day with admit card in hand, hoping for no negative marking traps.',
  },
  {
    id: 'exam_result_cyber_screen',
    label: 'Computer Screen "Qualified" Moment',
    promptContext: 'Staring at a computer monitor screen refreshing the result PDF with trembling hands until finding your roll number.',
  },
];

export interface MarketingHistoryEntry {
  date: string;
  featureId: MarketingFeatureId;
  setting: MarketingSettingId;
  hookLine: string;
  title: string;
  storySummary: string;
  youtubeUrl?: string;
  instagramUrl?: string;
}

export interface MarketingHistoryStore {
  lastRunDate?: string;
  lastFeatureId?: MarketingFeatureId;
  totalRuns: number;
  /** Up to 10 most recent entries PER feature ID */
  byFeature: Partial<Record<MarketingFeatureId, MarketingHistoryEntry[]>>;
  recentSettings: MarketingSettingId[];
}

export interface GeneratedMarketingStory {
  featureId: MarketingFeatureId;
  setting: MarketingSettingId;
  hookLine: string;
  title: string;
  storySummary: string;
  commentPrompt: string;
  scenes: MarketingSceneBeat[];
  ctaSpeech: string;
  youtubeTitle: string;
  youtubeDescription: string;
  youtubeTags: string[];
  instagramCaption: string;
  instagramHashtags: string[];
}

const HISTORY_FILE = path.join(process.cwd(), 'marketing_history.json');
const MAX_PER_FEATURE_HISTORY = 10;

export function loadMarketingHistory(filePath: string = HISTORY_FILE): MarketingHistoryStore {
  if (!existsSync(filePath)) {
    return { totalRuns: 0, byFeature: {}, recentSettings: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<MarketingHistoryStore>;
    return {
      lastRunDate: parsed.lastRunDate,
      lastFeatureId: parsed.lastFeatureId,
      totalRuns: parsed.totalRuns ?? 0,
      byFeature: parsed.byFeature ?? {},
      recentSettings: Array.isArray(parsed.recentSettings) ? parsed.recentSettings : [],
    };
  } catch {
    return { totalRuns: 0, byFeature: {}, recentSettings: [] };
  }
}

export function saveMarketingHistory(
  store: MarketingHistoryStore,
  entry: MarketingHistoryEntry,
  filePath: string = HISTORY_FILE,
): MarketingHistoryStore {
  const prevFeatureList = store.byFeature[entry.featureId] ?? [];
  const nextFeatureList = [...prevFeatureList, entry].slice(-MAX_PER_FEATURE_HISTORY);
  const nextRecentSettings = [...store.recentSettings, entry.setting].slice(-10);

  const updated: MarketingHistoryStore = {
    lastRunDate: entry.date,
    lastFeatureId: entry.featureId,
    totalRuns: (store.totalRuns ?? 0) + 1,
    byFeature: {
      ...store.byFeature,
      [entry.featureId]: nextFeatureList,
    },
    recentSettings: nextRecentSettings,
  };
  writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n');
  return updated;
}

/** Picks 1 feature per day using least-used + oldest-run fairness across all 10 features. */
export function pickDailyFeature(
  store: MarketingHistoryStore,
  overrideId?: string,
): MarketingFeatureSpec {
  if (overrideId) {
    const found = MARKETING_FEATURES.find((f) => f.id === overrideId);
    if (!found) {
      throw new Error(
        `Unknown marketing feature "${overrideId}". Valid: ${MARKETING_FEATURES.map((f) => f.id).join(', ')}`,
      );
    }
    return found;
  }

  const candidates = MARKETING_FEATURES.filter((f) => f.id !== store.lastFeatureId);
  const scored = candidates.map((f, idx) => {
    const entries = store.byFeature[f.id] ?? [];
    const lastDate = entries[entries.length - 1]?.date ?? '0000-00-00';
    return { feature: f, count: entries.length, lastDate, idx };
  });

  scored.sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    if (a.lastDate !== b.lastDate) return a.lastDate.localeCompare(b.lastDate);
    return a.idx - b.idx;
  });

  return scored[0].feature;
}

/** Rotates across 30 settings, avoiding settings in this feature's last 10 entries & recent global runs. */
export function pickRotatedSetting(
  store: MarketingHistoryStore,
  featureId: MarketingFeatureId,
  overrideSetting?: string,
): MarketingSettingSpec {
  if (overrideSetting) {
    const found = MARKETING_SETTINGS.find((s) => s.id === overrideSetting);
    if (found) return found;
  }

  const featureHistory = store.byFeature[featureId] ?? [];
  const usedInFeatureLast10 = new Set(featureHistory.map((h) => h.setting));
  const usedRecentlyGlobal = new Set(store.recentSettings.slice(-5));

  // First preference: never used in this feature's last 10 runs AND not in last 5 global runs
  let pool = MARKETING_SETTINGS.filter(
    (s) => !usedInFeatureLast10.has(s.id) && !usedRecentlyGlobal.has(s.id),
  );
  // Second preference: never used in this feature's last 10 runs
  if (pool.length === 0) {
    pool = MARKETING_SETTINGS.filter((s) => !usedInFeatureLast10.has(s.id));
  }
  // Third preference: avoid immediate previous setting
  if (pool.length === 0) {
    const lastGlobal = store.recentSettings[store.recentSettings.length - 1];
    pool = MARKETING_SETTINGS.filter((s) => s.id !== lastGlobal);
  }
  if (pool.length === 0) pool = MARKETING_SETTINGS;

  const pickIdx = (store.totalRuns + featureHistory.length) % pool.length;
  return pool[pickIdx];
}

const ALL_CHARACTER_MOODS = [
  'explaining',
  'alert',
  'thinking',
  'excited',
  'stressed',
  'celebrate',
  'shocked',
  'sleepy',
  'confident',
  'frustrated',
  'whispering',
  'relieved',
  'panicked',
  'smug',
  'bored',
  'curious',
  'exhausted',
  'determined',
  'embarrassed',
  'teasing',
] as const;

const MARKETING_SCRIPT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    hookLine: { type: 'STRING' },
    title: { type: 'STRING' },
    storySummary: { type: 'STRING' },
    setting: { type: 'STRING', enum: MARKETING_SETTINGS.map((s) => s.id) },
    commentPrompt: { type: 'STRING' },
    ctaSpeech: { type: 'STRING' },
    youtubeTitle: { type: 'STRING' },
    youtubeDescription: { type: 'STRING' },
    youtubeTags: { type: 'ARRAY', items: { type: 'STRING' } },
    instagramCaption: { type: 'STRING' },
    instagramHashtags: { type: 'ARRAY', items: { type: 'STRING' } },
    scenes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          sceneLabel: { type: 'STRING' },
          speaker: { type: 'STRING', enum: ['arjun', 'priya'] },
          dualCharacters: { type: 'BOOLEAN' },
          mood: { type: 'STRING', enum: ALL_CHARACTER_MOODS },
          listenerMood: { type: 'STRING', enum: ALL_CHARACTER_MOODS },
          holdingPhone: { type: 'BOOLEAN' },
          showPhoneMockup: { type: 'BOOLEAN' },
          captionEn: { type: 'STRING' },
          spokenLine: { type: 'STRING' },
          setting: { type: 'STRING', enum: MARKETING_SETTINGS.map((s) => s.id) },
          sfx: { type: 'STRING', enum: ['phone_buzz', 'alert_blip', 'whoosh', 'ding', 'pop'] },
        },
        required: ['sceneLabel', 'speaker', 'mood', 'captionEn', 'spokenLine'],
      },
    },
  },
  required: [
    'hookLine',
    'title',
    'storySummary',
    'setting',
    'commentPrompt',
    'ctaSpeech',
    'scenes',
    'youtubeTitle',
    'youtubeDescription',
    'youtubeTags',
    'instagramCaption',
    'instagramHashtags',
  ],
};

/** Uses Gemini to dynamically author an original 5-scene skit for today's feature + setting. */
export async function generateMarketingStoryScript(
  feature: MarketingFeatureSpec,
  setting: MarketingSettingSpec,
  featureHistory: MarketingHistoryEntry[],
): Promise<GeneratedMarketingStory> {
  const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEYS is required to generate dynamic daily marketing stories.');
  }

  const avoidList =
    featureHistory.length > 0
      ? featureHistory
          .slice(-10)
          .map(
            (h, i) =>
              `  ${i + 1}. [${h.date}] Setting=${h.setting} | Hook="${h.hookLine}" | Story="${h.storySummary}"`,
          )
          .join('\n')
      : '  (No prior runs for this feature yet — make this first one iconic!)';

  const settingCatalogueList = MARKETING_SETTINGS.map(
    (s, idx) => `  ${idx + 1}. [${s.id}] "${s.label}": ${s.promptContext}`,
  ).join('\n');

  const moodList = [
    '- explaining (neutral/helpful hand gesture)',
    '- alert (wide eyes, urgent posture, warning badge)',
    '- thinking (chin in hand, looking upward)',
    '- excited (star eyes, wide open grin)',
    '- stressed (sweat drops, worried brows)',
    '- celebrate (hands raised, victory confetti)',
    '- shocked (hands clutching cheeks, jaw dropped, lightning bolt)',
    '- sleepy (droopy eyelids, yawning, Zzz drift)',
    '- confident (thumbs up, side smirk, glint sparkle)',
    '- frustrated (clenched fists, steam puffs from ears, teeth grimace)',
    '- whispering (cupped hand next to mouth, conspiratorial glance)',
    '- relieved (brow wipe, relaxed smile, phew breeze)',
    '- panicked (water spray sweat drops, shivering wavy mouth)',
    '- smug (folded arms, knowing cocky smirk)',
    '- bored (resting chin on flat palm, half-closed eyes, straight mouth)',
    '- curious (tilted head, raised brow, question mark bubble)',
    '- exhausted (slumped shoulders, hollow dark circles, tongue panting)',
    '- determined (double clenched fists, intense focused brows, fire aura)',
    '- embarrassed (hand scratching back of head, rosy blush cheeks)',
    '- teasing (playful wink, tongue poke, beckoning wave)',
  ].join('\n');

  const prompt = `You are a viral Indian edutainment Reels/Shorts scriptwriter for Aspirant Arcade ("Stop scrolling. Start scoring.").
Write a fresh, punchy, relatable 5-scene character dialogue skit (22–28 seconds total) starring two Indian exam aspirants:
- ARJUN (relatable aspirant struggling with the problem)
- PRIYA (smart mentor/friend who introduces the Aspirant Arcade feature)

TODAY'S FEATURE TO SPOTLIGHT:
- Feature Name: ${feature.title} [Tag: ${feature.tag}]
- What It Does: ${feature.pitch}
- How It Works In The App: ${feature.howItWorks}
${feature.modesAndControls ? `- Key Modes & User Controls: ${feature.modesAndControls}\n` : ''}- Relatable Student Pain Point: ${feature.painPoint}

RECOMMENDED DEFAULT OPENING SETTING:
- ${setting.id} (${setting.label}): ${setting.promptContext}

COMPLETE 30-SETTING CATALOGUE (Select the single best opening "setting" for this story from these 30 IDs, or keep the recommended default):
${settingCatalogueList}

20 CHARACTER EXPRESSIONS & MOODS (Use these exact keys for "mood" and "listenerMood" across scenes):
${moodList}

MULTI-SCENE LOCATION SHIFTS:
- You may keep the opening setting or shift scenes[].setting across 2-3 different locations when the story progresses (e.g. hostel_bedroom_2am -> morning_alarm_bed -> college_canteen_chai -> study_group_table -> exam_center_gate) so the video feels visually dynamic instead of stuck in one static room!

LAST 10 STORIES ALREADY USED FOR THIS FEATURE (DO NOT repeat these hooks, angles, or settings):
${avoidList}

SCENE STRUCTURE (exactly 5 scenes in "scenes"):
1. Scene 1 (Hook): Arjun in the problem moment (holdingPhone: true if phone distraction fits). Short punchy hook. Pick a dramatic mood (e.g. panicked, sleepy, frustrated, shocked, bored).
2. Scene 2 (Escalation): Arjun vents or realizes the painful cost (marks lost, wasted time, stress). Mood: stressed, exhausted, frustrated, or shocked.
3. Scene 3 (Intervention): dualCharacters: true, speaker: "priya" steps in and recommends Aspirant Arcade's "${feature.title}". Mood: confident, teasing, or whispering; Arjun listenerMood: curious or embarrassed.
4. Scene 4 (Feature Demo): showPhoneMockup: true, speaker: "priya" or "arjun" explains how this exact feature works in action using the specific mechanisms and modes described above (e.g. for Focus Guard mention App Timer vs Reel Mode and answering Y questions correctly; for Challenge Mode mention the 6-digit lobby code; for AI Interview mention STAR scoring; for Bookmarks mention re-practicing saved traps, etc.). Mood: explaining, confident, or thinking.
5. Scene 5 (Payoff): dualCharacters: true, speaker: "arjun" or "priya", mood: "celebrate" or "determined" or "relieved", Arjun gets relief/confidence + quick CTA lead-in.

RULES:
- setting: must be one of the 30 setting IDs from the catalogue above. Do NOT use any setting listed in the avoid list.
- sceneLabel per scene: 2-3 clean uppercase words with spaces (NO underscores, e.g. "CHAI BREAK", "THE FIX", "LIVE LOBBY").
- hookLine: max 48 chars, dramatic pattern interrupt matching the setting (NO hashtags/emojis).
- captionEn per scene: crisp English subtitle (max 58 chars) for kinetic captions.
- spokenLine per scene: natural conversational Roman-Hinglish or Indian English that sounds authentic spoken aloud (max 120 chars per scene). Note: write acronyms like "M. C. Q." or "P. S. U." spaced ONLY if needed, or natural words like "Reels", "mock test", "rank".
- commentPrompt: short interactive question to spark comments (max 55 chars, e.g. "What is your daily screen time? Comment below").
- ctaSpeech: 1 crisp closing line directing viewers to download Aspirant Arcade free on Google Play (no login needed).`;

  const model = process.env.VIDEO_MODEL || process.env.BLOG_MODEL || 'gemini-2.5-flash';

  let lastErr: unknown;
  for (const key of keys) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: 'application/json',
            responseSchema: MARKETING_SCRIPT_SCHEMA,
          },
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) {
        throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('Gemini returned empty response');

      const parsed = JSON.parse(raw) as Omit<GeneratedMarketingStory, 'featureId'>;
      if (!Array.isArray(parsed.scenes) || parsed.scenes.length < 3) {
        throw new Error('Gemini returned fewer than 3 scenes');
      }
      // Guarantee Scene 4 shows the animated phone mockup
      if (!parsed.scenes.some((s) => s.showPhoneMockup) && parsed.scenes[3]) {
        parsed.scenes[3].showPhoneMockup = true;
      }

      const validSettingIds = new Set<string>(MARKETING_SETTINGS.map((s) => s.id));
      const chosenSetting: MarketingSettingId =
        parsed.setting && validSettingIds.has(parsed.setting) ? (parsed.setting as MarketingSettingId) : setting.id;

      for (const sc of parsed.scenes) {
        if (sc.setting && !validSettingIds.has(sc.setting)) {
          delete sc.setting;
        }
      }

      return {
        ...parsed,
        featureId: feature.id,
        setting: chosenSetting,
      };
    } catch (e) {
      lastErr = e;
      console.warn(`[marketing-script] Gemini attempt failed: ${(e as Error).message}`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
