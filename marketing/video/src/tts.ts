/**
 * Optional voiceover, two providers:
 *   - Sarvam AI (bulbul:v3) when SARVAM_API_KEY is set — natural Indian
 *     Hindi/Hinglish voices. Narration text is Hinglish-ified first via a small
 *     Gemini call (see hinglish.ts + the render entrypoints), so the spoken
 *     track is code-mixed Hindi while all on-screen text stays English.
 *   - Microsoft Edge's free TTS (node-edge-tts) otherwise, and as the fallback
 *     when a Sarvam call fails (Devanagari input then gets an hi-IN Edge voice
 *     so the fallback never reads Hindi script with an English voice).
 *
 * Same philosophy as audio.ts: narration is a nice-to-have — every caller gets
 * `null` back on any failure (offline, quota, bad text) and must render fine
 * without it. Clips land in public/audio/narration/ BEFORE bundle() runs,
 * so Remotion's staticFile() can serve them during the render.
 */
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { EdgeTTS } from 'node-edge-tts';
import { parseFile } from 'music-metadata';

const NARRATION_SUBDIR = 'audio/narration';
const NARRATION_DIR = path.join(process.cwd(), 'public', NARRATION_SUBDIR);

// en-IN neural voices sound natural for this audience; override via TTS_VOICE.
const DEFAULT_VOICE = process.env.TTS_VOICE || 'en-IN-NeerjaNeural';
// Edge fallback voice for Devanagari/Hinglish text (only reached if Sarvam failed).
const EDGE_HINDI_VOICE = 'hi-IN-SwaraNeural';

const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';
// bulbul:v3 caps input at 2500 chars — our longest line (question + explanation
// reveal) sits well under, but guard anyway.
const SARVAM_MAX_CHARS = 2400;

/** src is public/-relative so compositions can pass it straight to staticFile(). */
export type NarrationClip = { src: string; durationSec: number };

// Respellings for words the voice gets wrong — applied to the spoken text only,
// never to what's shown on screen. Add here whenever a render mispronounces
// something ("JEE" was read as one syllable, adjective "live" as the verb /lɪv/).
const PRONUNCIATION_FIXES: [RegExp, string][] = [
  [/\bJEE\b/g, 'J. E. E.'], // letter-by-letter, as aspirants say it
  [/\blive\b/gi, 'laiv'], // our copy only ever uses the adjective ("registration is live")
  [/\bIES\b/g, 'I. E. S.'],
  [/\bCIL\b/g, 'C. I. L.'],
];

function fixPronunciation(text: string): string {
  return PRONUNCIATION_FIXES.reduce((t, [re, sub]) => t.replace(re, sub), text);
}

function hasDevanagari(text: string): boolean {
  return /[ऀ-ॿ]/.test(text);
}

/** Sarvam bulbul:v3 — returns base64 WAV in JSON; we save it as .wav and let
 * music-metadata/Remotion handle the format. Throws on any failure so the
 * caller can fall back to Edge. */
async function synthesizeWithSarvam(text: string, name: string, apiKey: string): Promise<NarrationClip> {
  const body: Record<string, unknown> = {
    text: text.slice(0, SARVAM_MAX_CHARS),
    // hi-IN handles code-mixed Hinglish (Devanagari + Latin technical terms) —
    // exactly what hinglish.ts produces; pure-English lines read fine too.
    target_language_code: hasDevanagari(text) ? 'hi-IN' : 'en-IN',
    model: 'bulbul:v3',
    pace: 1.05, // slightly brisk — reads better at reel pacing
    speech_sample_rate: 24000,
  };
  if (process.env.SARVAM_VOICE) body.speaker = process.env.SARVAM_VOICE;

  const res = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const data = (await res.json().catch(() => ({}))) as { audios?: string[]; error?: { message?: string } };
  if (!res.ok || !data.audios?.[0]) {
    throw new Error(`Sarvam TTS HTTP ${res.status}: ${data.error?.message ?? JSON.stringify(data).slice(0, 200)}`);
  }
  const file = path.join(NARRATION_DIR, `${name}.wav`);
  writeFileSync(file, Buffer.from(data.audios[0], 'base64'));
  const durationSec = (await parseFile(file)).format.duration ?? 0;
  if (durationSec <= 0) throw new Error('empty Sarvam narration file');
  return { src: `${NARRATION_SUBDIR}/${name}.wav`, durationSec };
}

async function synthesizeWithEdge(text: string, name: string): Promise<NarrationClip> {
  const file = path.join(NARRATION_DIR, `${name}.mp3`);
  const tts = new EdgeTTS({
    voice: hasDevanagari(text) ? EDGE_HINDI_VOICE : DEFAULT_VOICE,
    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
    rate: '+8%', // slightly brisk — reads better at reel pacing than the default
    timeout: 15_000,
  });
  await tts.ttsPromise(text, file);
  const durationSec = (await parseFile(file)).format.duration ?? 0;
  if (durationSec <= 0) throw new Error('empty narration file');
  return { src: `${NARRATION_SUBDIR}/${name}.mp3`, durationSec };
}

export async function synthesizeNarration(text: string, name: string): Promise<NarrationClip | null> {
  const cleaned = fixPronunciation(text.replace(/\s+/g, ' ').trim());
  if (!cleaned) return null;
  mkdirSync(NARRATION_DIR, { recursive: true });

  const sarvamKey = process.env.SARVAM_API_KEY;
  if (sarvamKey) {
    try {
      return await synthesizeWithSarvam(cleaned, name, sarvamKey);
    } catch (e) {
      console.warn(`[tts] Sarvam narration "${name}" failed — falling back to Edge TTS: ${(e as Error).message}`);
    }
  }
  try {
    return await synthesizeWithEdge(cleaned, name);
  } catch (e) {
    console.warn(`[tts] Narration "${name}" failed — continuing silent: ${(e as Error).message}`);
    return null;
  }
}
