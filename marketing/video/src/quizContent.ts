/**
 * Small Gemini call that turns the day's quiz question into video content:
 * a hook line + platform upload copy grounded in the actual question and exam
 * (mirrors what scripts/blog_bot.ts's buildVideoContentPrompt does for news).
 * Best-effort — returns null on any failure and buildQuizMetadata's deterministic
 * copy takes over, so a Gemini outage never costs the day's render.
 *
 * Env: GEMINI_API_KEYS (comma-separated, rotated on quota errors — same secret
 * the blog bot uses), optional GEMINI_MODEL (default gemini-2.5-flash).
 */
import { examDisplayName, type Vertical } from './fetchContent';
import { hinglishEnabled } from './hinglish';

export type QuizVideoContent = {
  hookLine?: string;
  youtubeTitle?: string;
  youtubeDescription?: string;
  youtubeTags?: string[];
  instagramCaption?: string;
  instagramHashtags?: string[];
  /** Spoken-only Hinglish narration lines — requested in this same call (instead
   * of a separate toHinglish() call) when Sarvam TTS is active. See hinglish.ts. */
  hinglishNarration?: { hook?: string; question?: string; reveal?: string };
};

// hinglishNarration is in the schema unconditionally but only in `required`/the
// prompt when Sarvam is active — Gemini omits un-asked-for optional fields.
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    hookLine: { type: 'STRING' },
    youtubeTitle: { type: 'STRING' },
    youtubeDescription: { type: 'STRING' },
    youtubeTags: { type: 'ARRAY', items: { type: 'STRING' } },
    instagramCaption: { type: 'STRING' },
    instagramHashtags: { type: 'ARRAY', items: { type: 'STRING' } },
    hinglishNarration: {
      type: 'OBJECT',
      properties: { hook: { type: 'STRING' }, question: { type: 'STRING' }, reveal: { type: 'STRING' } },
      required: ['hook', 'question', 'reveal'],
    },
  },
  required: ['hookLine', 'youtubeTitle', 'youtubeDescription', 'youtubeTags', 'instagramCaption', 'instagramHashtags'],
};

function buildPrompt(args: {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  examId: string;
  vertical: Vertical;
}): string {
  const examLabel = args.examId ? examDisplayName(args.examId) : `${args.vertical} exams (India)`;
  const optionLines = args.options.map((o, i) => `${'ABCD'[i]}. ${o}`).join('\n');
  return `Aspirant Arcade (Indian gamified exam-prep app) is posting a ~20s quiz reel (YouTube Shorts + Instagram) built from this real ${examLabel} question:

QUESTION: ${args.question}
${optionLines}
CORRECT: ${'ABCD'[args.correctIndex]}
${args.explanation ? `EXPLANATION: ${args.explanation}` : ''}

The reel shows the question, a 3s countdown, a "pause and comment your answer" card, then the answer reveal. Produce:
- "hookLine": the on-screen opening line (max 45 chars). A pattern interrupt tailored to ${examLabel} aspirants — curiosity gap, challenge, or a stat ("Only 1% get this right"). No hashtags, no emoji.
- "youtubeTitle": max 90 chars, hook-first, mention the exam name, do NOT spoil the answer.
- "youtubeDescription": 2-3 plain-text lines — tease the question topic + 1 CTA to practice free on Aspirant Arcade. No markdown, never reveal the answer.
- "youtubeTags": 8-12 lowercase search tags, no # symbol, specific to this exam and the question's topic.
- "instagramCaption": max 150 chars, punchy, ends by asking viewers to comment their answer, at most 1 emoji.
- "instagramHashtags": exactly 5 hashtags, no spaces, mix broad + exam-specific.
${hinglishEnabled() ? `- "hinglishNarration": spoken voiceover versions of three lines in natural conversational Hinglish — Hindi words in Devanagari script; exam names, technical terms, formulas, option letters (A/B/C/D), numbers and units stay in English/Latin script exactly as written; energetic study-buddy tone; preserve every fact. { hook: Hinglish of the hookLine, question: Hinglish of the QUESTION, reveal: Hinglish stating the correct option letter + option text + a brief why (max 220 chars) }. These are spoken only — never shown on screen.` : ''}

Return valid JSON only.`;
}

/** Advances through the key ring on quota/availability errors — one pass, no model rotation. */
export async function generateQuizVideoContent(args: {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  examId: string;
  vertical: Vertical;
}): Promise<QuizVideoContent | null> {
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    console.log('[video] GEMINI_API_KEYS not set — using deterministic quiz metadata.');
    return null;
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = buildPrompt(args);

  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429) continue; // quota — next key
      const data = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      if (data.error) {
        if (/quota|exhausted|rate|RESOURCE_EXHAUSTED/i.test(data.error.message || '')) continue;
        throw new Error(data.error.message || `HTTP ${res.status}`);
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      return JSON.parse(text) as QuizVideoContent;
    } catch (e) {
      console.warn(`[video] Quiz Gemini call failed: ${(e as Error).message}`);
    }
  }
  console.warn('[video] All Gemini keys failed — using deterministic quiz metadata.');
  return null;
}
