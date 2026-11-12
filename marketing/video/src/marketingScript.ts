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
  painPoint: string;
  defaultSfx: 'phone_buzz' | 'alert_blip' | 'ding' | 'pop';
}

export const MARKETING_FEATURES: MarketingFeatureSpec[] = [
  {
    id: 'focus_guard',
    tag: 'FOCUS GUARD',
    title: 'Focus Guard (Reels & Shorts Blocker)',
    pitch:
      'Focus Guard intercepts Instagram Reels, YouTube Shorts, and any addictive app — forcing you to solve 1 quick exam MCQ before unlocking screen time.',
    painPoint: 'Aspirants losing 2–3 hours every night doomscrolling Instagram Reels and YouTube Shorts instead of revising.',
    defaultSfx: 'phone_buzz',
  },
  {
    id: 'short_notes',
    tag: 'SHORT NOTES',
    title: 'Short Notes for Every Exam',
    pitch:
      'Crisp, high-yield Short Notes organized by exam and chapter so you can revise key formulas and concepts in 5 minutes without opening 500-page PDFs.',
    painPoint: 'Getting overwhelmed by massive textbooks and bulky coaching PDFs right before exam week.',
    defaultSfx: 'pop',
  },
  {
    id: 'ai_notes_quiz',
    tag: 'AI NOTES + QUIZ',
    title: 'AI Notes + Quiz Overview & Marks Breakdown',
    pitch:
      'Generate custom AI notes on any weak topic paired with a full quiz overview showing exact aspirant marks, correct vs incorrect answers, and explanations.',
    painPoint: 'Reading passive notes without knowing how much you actually remember or where you lose marks.',
    defaultSfx: 'ding',
  },
  {
    id: 'arcade_games',
    tag: '14+ ARCADE GAMES',
    title: '14+ Arcade Games for Stress-Free Learning',
    pitch:
      'Turn boring exam prep into 14+ fast, stress-free arcade games (Cave Runner, Tsunami, Slasher, Survival, Match, Speed MCQ) so studying feels addictive.',
    painPoint: 'Burning out and feeling sleepy after solving static black-and-white MCQ sheets.',
    defaultSfx: 'alert_blip',
  },
  {
    id: 'challenge_mode',
    tag: 'CHALLENGE MODE',
    title: 'Group Challenge Mode',
    pitch:
      'Create a live multiplayer Challenge Mode lobby, invite friends with a code, and compete in real-time quiz battles to learn faster together.',
    painPoint: 'Feeling isolated and unmotivated while preparing alone in a hostel or PG room.',
    defaultSfx: 'alert_blip',
  },
  {
    id: 'daily_notifications',
    tag: 'EXAM ALERTS',
    title: 'Daily Recruitment, Result & Exam News Alerts',
    pitch:
      'Get targeted daily push notifications for PSU recruitment, SSC/GATE/JEE results, admit cards, and official exam updates filtered to your exact category.',
    painPoint: 'Missing application deadlines or result announcements because updates get buried in spammy Telegram groups.',
    defaultSfx: 'phone_buzz',
  },
  {
    id: 'category_insights',
    tag: 'INSIGHTS',
    title: 'Overall Quiz Insights by Exam Category',
    pitch:
      'See overall insights across every quiz played in your exam category — tracking accuracy trends, speed per question, and weak chapters in one dashboard.',
    painPoint: 'Taking dozens of mock tests without tracking whether your accuracy and speed are actually improving.',
    defaultSfx: 'ding',
  },
  {
    id: 'leaderboard',
    tag: 'LEADERBOARD',
    title: 'Competitive Leaderboard',
    pitch:
      'Climb the live Competitive Leaderboard against thousands of aspirants in your exam category and turn daily revision into a real rank battle.',
    painPoint: 'Having zero clue where you stand compared to actual competitors before the real exam day.',
    defaultSfx: 'ding',
  },
  {
    id: 'ai_interview_gd',
    tag: 'AI INTERVIEW & GD',
    title: 'AI Interview & GD/GT Simulator',
    pitch:
      'Practice PSU technical interviews, Group Discussions (GD), and Group Tasks (GT) with an AI simulator that evaluates clarity, confidence, and structure.',
    painPoint: 'Clearing the written exam cutoff but freezing up in front of the real PSU interview or GD panel.',
    defaultSfx: 'pop',
  },
  {
    id: 'bookmarks',
    tag: 'BOOKMARKS',
    title: 'Bookmark Questions to Remember & Re-Practice',
    pitch:
      'Bookmark tricky questions and negative-marking traps with one tap so you can revisit and re-practice them anytime before the exam.',
    painPoint: 'Solving a tough question once, forgetting the trick a week later, and making the exact same mistake in the exam.',
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

/** Rotates across 14 settings, avoiding settings in this feature's last 10 entries & recent global runs. */
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

const MARKETING_SCRIPT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    hookLine: { type: 'STRING' },
    title: { type: 'STRING' },
    storySummary: { type: 'STRING' },
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
          mood: { type: 'STRING', enum: ['explaining', 'alert', 'thinking', 'excited', 'stressed', 'celebrate'] },
          listenerMood: { type: 'STRING', enum: ['explaining', 'alert', 'thinking', 'excited', 'stressed', 'celebrate'] },
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

  const prompt = `You are a viral Indian edutainment Reels/Shorts scriptwriter for Aspirant Arcade ("Stop scrolling. Start scoring.").
Write a fresh, punchy, relatable 5-scene character dialogue skit (22–28 seconds total) starring two Indian exam aspirants:
- ARJUN (relatable aspirant struggling with the problem)
- PRIYA (smart mentor/friend who introduces the Aspirant Arcade feature)

TODAY'S FEATURE TO SPOTLIGHT:
- Feature: ${feature.title}
- What it does: ${feature.pitch}
- Relatable pain point: ${feature.painPoint}

TODAY'S OPENING SETTING (build the dialogue naturally around this place & moment):
- ${setting.id} (${setting.label}): ${setting.promptContext}

MULTI-SCENE LOCATION SHIFTS:
- You may keep the opening setting or shift scenes[].setting across 2-3 different locations when the story progresses (e.g. hostel_bedroom_2am -> morning_alarm_bed -> college_canteen_chai -> study_group_table -> exam_center_gate) so the video feels visually dynamic instead of stuck in one static room!

LAST 10 STORIES ALREADY USED FOR THIS FEATURE (DO NOT repeat these hooks, angles, or settings):
${avoidList}

SCENE STRUCTURE (exactly 5 scenes in "scenes"):
1. Scene 1 (Hook): Arjun in the problem moment (holdingPhone: true if phone distraction fits). Short punchy hook.
2. Scene 2 (Escalation): Arjun vents or realizes the painful cost (marks lost, wasted time, stress).
3. Scene 3 (Intervention): dualCharacters: true, speaker: "priya" steps in and recommends Aspirant Arcade's "${feature.title}".
4. Scene 4 (Feature Demo): showPhoneMockup: true, speaker: "priya" or "arjun" explains how this exact feature works in action.
5. Scene 5 (Payoff): dualCharacters: true, mood: "celebrate", Arjun gets relief/confidence + quick CTA lead-in.

RULES:
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

      const parsed = JSON.parse(raw) as Omit<GeneratedMarketingStory, 'featureId' | 'setting'>;
      if (!Array.isArray(parsed.scenes) || parsed.scenes.length < 3) {
        throw new Error('Gemini returned fewer than 3 scenes');
      }
      // Guarantee Scene 4 shows the animated phone mockup
      if (!parsed.scenes.some((s) => s.showPhoneMockup) && parsed.scenes[3]) {
        parsed.scenes[3].showPhoneMockup = true;
      }

      return {
        featureId: feature.id,
        setting: setting.id,
        ...parsed,
      };
    } catch (e) {
      lastErr = e;
      console.warn(`[marketing-script] Gemini attempt failed: ${(e as Error).message}`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
