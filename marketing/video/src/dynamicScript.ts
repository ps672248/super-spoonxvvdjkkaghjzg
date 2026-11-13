/**
 * Dynamic Video Script Engine — schema, cadence/lip-sync builder, presets
 * (news / experience / strategy / marketing), and optional Gemini script generator.
 */
import path from 'node:path';
import { readFileSync } from 'node:fs';
import type { Beat, NewsNarration, NewsRecapProps } from './NewsRecap';
import type { CharacterId } from './AnimatedCharacter';
import type { SceneTheme } from './SceneBackground';
import type { Vertical } from './fetchContent';
import type { NarrationClip } from './tts';

export type DynamicVideoMode = 'news' | 'experience' | 'strategy' | 'marketing';

export interface DynamicVideoScript {
  id?: string;
  mode: DynamicVideoMode;
  vertical: Vertical;
  format?: 'reel' | 'landscape';
  scene?: SceneTheme;
  character?: CharacterId | 'none';
  bgmMood?: 'breaking_news' | 'motivation' | 'corporate';
  hookLine: string;
  headline: string;
  /** Optional conversational Hinglish speech for hook + headline */
  spokenHeadline?: string;
  beats: Beat[];
  ctaSpeech?: string;
  fullStoryLabel?: string;
  telegram?: { handle: string; purpose?: string };
}

/**
 * Extracts real per-frame RMS amplitude envelope from a 16-bit PCM WAV file
 * (e.g. Sarvam AI output), normalized to [0, 1] for SVG lip-sync.
 */
export function extractWavCadence(wavPath: string, fps: number = 30): number[] | null {
  try {
    const buf = readFileSync(wavPath);
    if (buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF') return null;
    const sampleRate = buf.readUInt32LE(24);
    const channels = buf.readUInt16LE(22);
    const bitsPerSample = buf.readUInt16LE(34);
    if (bitsPerSample !== 16 || sampleRate <= 0) return null;

    // Locate 'data' subchunk safely
    let offset = 12;
    let dataStart = -1;
    let dataSize = 0;
    while (offset + 8 <= buf.length) {
      const id = buf.toString('ascii', offset, offset + 4);
      const size = buf.readUInt32LE(offset + 4);
      if (id === 'data') {
        dataStart = offset + 8;
        dataSize = Math.min(size, buf.length - dataStart);
        break;
      }
      offset += 8 + size + (size % 2);
    }
    if (dataStart < 0 || dataSize <= 0) return null;

    const bytesPerFrameSample = 2 * channels;
    const totalSamples = Math.floor(dataSize / bytesPerFrameSample);
    const samplesPerVideoFrame = Math.max(1, Math.floor(sampleRate / fps));
    const numFrames = Math.ceil(totalSamples / samplesPerVideoFrame);

    const raw: number[] = [];
    let peak = 0.001;
    for (let f = 0; f < numFrames; f++) {
      const startSample = f * samplesPerVideoFrame;
      const endSample = Math.min(totalSamples, startSample + samplesPerVideoFrame);
      let sumSq = 0;
      let count = 0;
      for (let s = startSample; s < endSample; s++) {
        const val = buf.readInt16LE(dataStart + s * bytesPerFrameSample) / 32768;
        sumSq += val * val;
        count++;
      }
      const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
      if (rms > peak) peak = rms;
      raw.push(rms);
    }

    return raw.map((r) => {
      const norm = r / peak;
      return norm < 0.08 ? 0 : Math.min(1, Number((norm * 1.15).toFixed(3)));
    });
  } catch {
    return null;
  }
}

/**
 * Deterministic syllable/punctuation speech cadence generator for any text +
 * duration (used when TTS outputs compressed .mp3 or in offline preview).
 * Spaces and punctuation produce realistic closed-mouth pauses between words.
 */
export function buildNarrationCadence(text: string, durationSec: number, fps: number = 30): number[] {
  const totalFrames = Math.max(1, Math.ceil(durationSec * fps));
  const chars = text.replace(/\s+/g, ' ').trim();
  if (!chars) return new Array(totalFrames).fill(0);

  const out: number[] = [];
  for (let f = 0; f < totalFrames; f++) {
    const progress = f / totalFrames;
    // Leave tiny natural inhale/pause at very beginning and very end
    if (progress < 0.03 || progress > 0.96) {
      out.push(0);
      continue;
    }
    const charIdx = Math.min(chars.length - 1, Math.floor(progress * chars.length));
    const ch = chars[charIdx];
    if (ch === ' ' || ch === ',' || ch === '.' || ch === '—' || ch === '!' || ch === '?') {
      out.push(0.05);
      continue;
    }
    const vowelBoost = /[aeiouAEIOU]/.test(ch) ? 0.88 : 0.56;
    const pulse = 0.5 + 0.5 * Math.sin(f * 0.72 + charIdx * 0.4);
    out.push(Number(Math.min(1, vowelBoost * (0.45 + 0.55 * pulse)).toFixed(3)));
  }
  return out;
}

/** Shared lip-sync cadence resolver: prefers real PCM WAV RMS, falls back to word cadence. */
export function cadenceForClip(
  clip: NarrationClip | null | undefined,
  text: string | null | undefined,
  publicDir: string = path.join(process.cwd(), 'public'),
  fps: number = 30,
): number[] | null {
  if (!clip || !text) return null;
  if (clip.src.endsWith('.wav')) {
    const wav = extractWavCadence(path.join(publicDir, clip.src), fps);
    if (wav) return wav;
  }
  return buildNarrationCadence(text, clip.durationSec, fps);
}

export function scriptToNewsRecapProps(
  script: DynamicVideoScript,
  narration: NewsNarration,
  flags: {
    hasNewsBgm: boolean;
    hasMotivationBgm?: boolean;
    hasCorporateBgm?: boolean;
    hasOutro: boolean;
    hasSfx: boolean;
  },
): NewsRecapProps {
  return {
    vertical: script.vertical,
    headline: script.headline,
    hookLine: script.hookLine,
    beats: script.beats,
    narration,
    format: script.format ?? 'reel',
    videoKind: script.mode,
    scene: script.scene,
    character: script.character ?? (script.mode === 'strategy' ? 'priya' : 'arjun'),
    bgmMood:
      script.bgmMood ??
      (script.mode === 'strategy' || script.mode === 'experience' ? 'motivation' : 'breaking_news'),
    hasBgm: flags.hasNewsBgm,
    hasMotivationBgm: flags.hasMotivationBgm,
    hasCorporateBgm: flags.hasCorporateBgm,
    hasOutro: flags.hasOutro,
    hasSfx: flags.hasSfx,
    fullStoryLabel: script.fullStoryLabel ?? 'aspirant-arcade.xyz',
    telegram: script.telegram,
    duckOutroSting: Boolean(narration.cta),
  };
}

export const DYNAMIC_SCRIPT_PRESETS: Record<DynamicVideoMode, DynamicVideoScript> = {
  news: {
    id: 'preset-news-ssc-cgl',
    mode: 'news',
    vertical: 'govt',
    format: 'reel',
    scene: 'breaking_news',
    character: 'arjun',
    hookLine: '17,727 vacancies — deadline is closer than you think!',
    headline: 'SSC CGL 2026 Tier-1 Exam Schedule & Vacancy Breakdown',
    spokenHeadline:
      'Alert aspirants! 17 thousand 727 vacancies ke saath SSC CGL 2026 ka official schedule aur vacancy breakdown release ho gaya hai.',
    beats: [
      {
        label: 'VACANCY SPLIT',
        emoji: '📊',
        mood: 'explaining',
        sfx: 'ding',
        text: '17,727 Posts Across Tax, Audit & Ministry Cadres',
        spokenText: 'Total 17 thousand 727 posts hain Income Tax, Audit aur Central Ministries mein.',
        mediaType: 'table',
        table: {
          headers: ['Post Cadre', 'Pay Level', 'Openings'],
          rows: [
            ['Income Tax Inspector', 'Level 7', '3,420'],
            ['ASO (CSS / MEA)', 'Level 7', '2,890'],
            ['Auditor & Accountant', 'Level 5', '6,150'],
          ],
        },
      },
      {
        label: 'SALARY PACKAGE',
        emoji: '💰',
        mood: 'celebrate',
        sfx: 'ding',
        text: 'Starting In-Hand Salary Reaches ₹78,000+ Per Month',
        spokenText: 'Selected candidates ki starting in-hand salary 78 thousand rupees per month se zyada hogi.',
        mediaType: 'stat_callout',
        stat: {
          value: '₹78,400/mo',
          subtext: 'Level-7 Gross Salary + Allowances',
          emoji: '💰',
        },
      },
      {
        label: 'ACTION PLAN',
        emoji: '🚨',
        mood: 'alert',
        sfx: 'pop',
        text: 'Lock Tier-1 Speed Drills Before Portal Closes',
        spokenText: 'Last minute server crash se bachne ke liye aaj hi form submit karein aur daily speed drills shuru karein.',
        mediaType: 'checklist',
        checklist: {
          items: [
            'Verify Aadhaar & Photo specs before upload',
            'Practice 60-min sectional speed mocks daily',
            'Review last 5 years PYQ Quant traps',
          ],
        },
      },
    ],
    ctaSpeech: 'Free mock tests aur PYQ battles ke liye Aspirant Arcade app download karein.',
    fullStoryLabel: 'aspirant-arcade.xyz/blog',
  },

  experience: {
    id: 'preset-experience-gate-air42',
    mode: 'experience',
    vertical: 'engineering',
    format: 'reel',
    scene: 'stage_spotlight',
    character: 'priya',
    hookLine: '42 marks in first mock → AIR 42 in final GATE!',
    headline: 'How Ankit Cracked GATE ME With a Full-Time Job',
    spokenHeadline:
      'First mock mein sirf 42 marks aaye the, phir bhi Ankit ne full-time job ke saath GATE mein All India Rank 42 kaise crack kiya? Yeh rahi unki real strategy.',
    beats: [
      {
        label: 'THE WAKE-UP CALL',
        emoji: '😰',
        mood: 'stressed',
        sfx: 'pop',
        text: 'Lost 14 Marks to Silly Negative Marking in First Attempt',
        spokenText: 'Pehle attempt mein syllabus poora tha, lekin silly mistakes aur negative marking ne 14 marks kha liye.',
        mediaType: 'stat_callout',
        stat: {
          value: '-14 Marks',
          subtext: 'Lost purely to calculation & reading errors',
          emoji: '⚠️',
        },
      },
      {
        label: 'THE TURNAROUND',
        emoji: '⚔️',
        mood: 'thinking',
        sfx: 'ding',
        text: 'Switched From Passive Notes to Timed Mistake Logs',
        spokenText: 'Unhone sirf notes padhna chhoda aur har test ke baad ek active mistake log aur virtual calculator drill shuru ki.',
        mediaType: 'comparison',
        comparison: {
          leftTitle: 'Old Habit',
          leftItems: ['Re-reading thick books', 'Zero timer pressure', 'Ignoring missed Qs'],
          rightTitle: 'Winning Shift',
          rightItems: ['30-min daily sprints', 'Virtual calc drills', 'Weekly error audit'],
        },
      },
      {
        label: 'FINAL ADVICE',
        emoji: '💡',
        mood: 'celebrate',
        sfx: 'pop',
        text: 'Accuracy Beats Blind Attempts Every Single Time',
        spokenText: 'Unka ek hi rule tha: kam questions karo, par 95 percent accuracy ke saath.',
        mediaType: 'quote',
        quote: {
          text: 'Your rank is decided by the traps you skip, not the hours you sit.',
          author: 'Ankit Verma · GATE AIR 42',
        },
      },
    ],
    ctaSpeech: 'Aise hi topper mock battles aur error analysis ke liye Aspirant Arcade join karein.',
    fullStoryLabel: 'aspirant-arcade.xyz/blog',
  },

  strategy: {
    id: 'preset-strategy-30day-rescue',
    mode: 'strategy',
    vertical: 'entrance',
    format: 'reel',
    scene: 'study_night',
    character: 'priya',
    hookLine: '30 days left? Stop reading new chapters!',
    headline: 'The 30-Day Cutoff Booster Blueprint for Top Percentile',
    spokenHeadline:
      'Agar exam mein sirf 30 days bache hain, toh naye chapters padhna band karo. Yeh 3-step blueprint aapka score 25 percent boost kar sakta hai.',
    beats: [
      {
        label: 'THE 80/20 RULE',
        emoji: '🎯',
        mood: 'thinking',
        sfx: 'ding',
        text: '68% of Questions Come From Just 12 Core Topics',
        spokenText: 'Last 10 years ke paper analysis ke hisaab se 68 percent questions sirf 12 high-weightage topics se aate hain.',
        mediaType: 'stat_callout',
        stat: {
          value: '68% Weightage',
          subtext: 'Concentrated in just 12 high-yield chapters',
          emoji: '🎯',
        },
      },
      {
        label: 'DAILY SPLIT',
        emoji: '📅',
        mood: 'explaining',
        sfx: 'ding',
        text: 'Follow This 3-Block High Retention Schedule',
        spokenText: 'Har roz subah 2 hours PYQ sprint, dopahar ko formula recall, aur raat ko 45 minute mistake revision karein.',
        mediaType: 'table',
        table: {
          headers: ['Slot', 'Focus Block', 'Target'],
          rows: [
            ['Morning', 'Timed PYQ Sprint', '45 Qs'],
            ['Afternoon', 'Formula Flashcards', '100% Recall'],
            ['Night', 'Error Notebook Audit', 'Zero Repeats'],
          ],
        },
      },
      {
        label: 'EXAM DAY HACK',
        emoji: '🔥',
        mood: 'excited',
        sfx: 'pop',
        text: 'Use the 2-Pass Scanning Method in the Hall',
        spokenText: 'Paper mein pehle round mein sirf 100 percent sure questions solve karein, phir second pass mein tricky ones uthayein.',
        mediaType: 'checklist',
        checklist: {
          items: [
            'Pass 1 (25 min): Grab every easy & direct question',
            'Pass 2 (25 min): Tackle moderate numericals',
            'Pass 3 (10 min): Verify units & negative marks',
          ],
        },
      },
    ],
    ctaSpeech: 'Free formula sprints aur PYQ challenges khelne ke liye Aspirant Arcade download karein.',
    fullStoryLabel: 'aspirant-arcade.xyz/notes',
    telegram: { handle: '@aspirantarcade', purpose: 'daily 30-day revision drops' },
  },

  marketing: {
    id: 'preset-marketing-arcade-modes',
    mode: 'marketing',
    vertical: 'engineering',
    format: 'reel',
    scene: 'engineering_tech',
    character: 'arjun',
    hookLine: 'Boring PDFs make you sleepy in 10 minutes?',
    headline: 'Turn Daily Exam Prep Into a 60-Second Arcade Battle',
    spokenHeadline:
      'Boring PDFs padh ke neend aati hai? Toh apni exam preparation ko ek 60-second arcade game mein badal do Aspirant Arcade ke saath!',
    beats: [
      {
        label: 'WHY GAMIFY?',
        emoji: '⚡',
        mood: 'excited',
        sfx: 'ding',
        text: '2.4x Faster Formula Retention With Active Speed Drills',
        spokenText: 'Timed active recall se formulas normal reading se 2.4 times faster yaad rehte hain.',
        mediaType: 'stat_callout',
        stat: {
          value: '2.4x Faster',
          subtext: 'Memory recall via timed arcade challenges',
          emoji: '⚡',
        },
      },
      {
        label: '6 GAME MODES',
        emoji: '🎮',
        mood: 'explaining',
        sfx: 'pop',
        text: 'Speed Arena, Formula Blitz & AI Mock Interviews',
        spokenText: 'Yahan aapko milte hain Speed Arena, Formula Blitz, Sudden Death aur AI Mock Interviews bilkul free.',
        mediaType: 'checklist',
        checklist: {
          items: [
            'Speed Arena: Beat the 60s countdown clock',
            'Sudden Death: Zero-mistake accuracy training',
            'AI Interview Coach: Real PSU panel practice',
          ],
        },
      },
      {
        label: 'ALL EXAMS COVERED',
        emoji: '🏆',
        mood: 'celebrate',
        sfx: 'ding',
        text: 'GATE, PSUs, SSC, JEE & NEET — Zero Login Required',
        spokenText: 'GATE, PSU, SSC, JEE ya NEET — bina kisi login jhanjhat ke abhi practice shuru karein.',
        mediaType: 'comparison',
        comparison: {
          leftTitle: 'Old Prep Apps',
          leftItems: ['Expensive paywalls', 'Cluttered PDF dumps', 'Zero instant feedback'],
          rightTitle: 'Aspirant Arcade',
          rightItems: ['Free & zero login', '6 gamified quiz modes', 'Live leaderboards'],
        },
      },
    ],
    ctaSpeech: 'Google Play Store se Aspirant Arcade download karein aur aaj ka challenge jeetein.',
    fullStoryLabel: 'aspirant-arcade.xyz',
  },
};

const DYNAMIC_SCRIPT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    hookLine: { type: 'STRING' },
    headline: { type: 'STRING' },
    spokenHeadline: { type: 'STRING' },
    ctaSpeech: { type: 'STRING' },
    beats: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          emoji: { type: 'STRING' },
          mood: { type: 'STRING', enum: ['explaining', 'alert', 'thinking', 'excited', 'stressed', 'celebrate'] },
          text: { type: 'STRING' },
          spokenText: { type: 'STRING' },
          mediaType: { type: 'STRING', enum: ['stat_callout', 'table', 'checklist', 'comparison', 'quote'] },
          stat: {
            type: 'OBJECT',
            properties: {
              value: { type: 'STRING' },
              subtext: { type: 'STRING' },
              emoji: { type: 'STRING' },
            },
          },
          table: {
            type: 'OBJECT',
            properties: {
              headers: { type: 'ARRAY', items: { type: 'STRING' } },
              rows: { type: 'ARRAY', items: { type: 'ARRAY', items: { type: 'STRING' } } },
            },
          },
          checklist: {
            type: 'OBJECT',
            properties: {
              items: { type: 'ARRAY', items: { type: 'STRING' } },
            },
          },
          comparison: {
            type: 'OBJECT',
            properties: {
              leftTitle: { type: 'STRING' },
              leftItems: { type: 'ARRAY', items: { type: 'STRING' } },
              rightTitle: { type: 'STRING' },
              rightItems: { type: 'ARRAY', items: { type: 'STRING' } },
            },
          },
          quote: {
            type: 'OBJECT',
            properties: {
              text: { type: 'STRING' },
              author: { type: 'STRING' },
            },
          },
        },
        required: ['label', 'emoji', 'mood', 'text', 'spokenText', 'mediaType'],
      },
    },
  },
  required: ['hookLine', 'headline', 'spokenHeadline', 'beats', 'ctaSpeech'],
};

/** Optional runtime dynamic script generator via Gemini when GEMINI_API_KEYS is present. */
export async function generateDynamicScriptWithGemini(
  topic: string,
  mode: DynamicVideoMode,
  vertical: Vertical,
  format: 'reel' | 'landscape' = 'reel',
): Promise<DynamicVideoScript> {
  const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEYS not configured — cannot generate script from --topic');
  }

  const prompt = `You are a viral Indian edutainment video scriptwriter for Aspirant Arcade.
Create a crisp ${format === 'landscape' ? '4-beat YouTube' : '3-beat Reels/Shorts'} dynamic video script about:
TOPIC: "${topic}"
MODE: ${mode} (news | experience | strategy | marketing)
EXAM VERTICAL: ${vertical}

Rules:
- hookLine: max 50 chars, punchy pattern-interrupt opening.
- headline: max 75 chars, clear English title.
- spokenHeadline: energetic conversational Roman-Hinglish voiceover line for the hook + headline.
- Each beat must have a rich visual card (stat_callout, table, checklist, comparison, or quote — never empty), a short English caption 'text' (max 60 chars), and a conversational Hinglish 'spokenText'.
- Match 'mood' per beat from ['explaining', 'alert', 'thinking', 'excited', 'stressed', 'celebrate'].
- ctaSpeech: one punchy Hinglish closing line directing viewers to Aspirant Arcade.`;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keys[0]}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: DYNAMIC_SCRIPT_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Gemini returned empty dynamic script');

  const parsed = JSON.parse(rawText) as Pick<
    DynamicVideoScript,
    'hookLine' | 'headline' | 'spokenHeadline' | 'beats' | 'ctaSpeech'
  >;

  return {
    mode,
    vertical,
    format,
    hookLine: parsed.hookLine,
    headline: parsed.headline,
    spokenHeadline: parsed.spokenHeadline,
    beats: parsed.beats,
    ctaSpeech: parsed.ctaSpeech,
    fullStoryLabel: 'aspirant-arcade.xyz',
  };
}
