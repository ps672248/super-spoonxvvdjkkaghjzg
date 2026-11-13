/**
 * Voiceover synthesizer with multi-tier free fallback chain:
 *   1. Primary:   Gemini AI TTS (`gemini-2.5-flash-preview-tts`) using
 *                 round-robin key rotation across GEMINI_API_KEYS. Outputs
 *                 24kHz 16-bit mono PCM wrapped as .wav (unlocking real audio
 *                 waveform lip-sync via extractWavCadence).
 *   2. Secondary: Microsoft Edge neural TTS (`node-edge-tts`), automatically
 *                 selecting hi-IN voices for Devanagari and en-IN for Latin.
 *   3. Tertiary:  Free Google `translate_tts` fallback if Edge returns 403.
 *
 * (Optional: set TTS_PRIMARY=sarvam with SARVAM_API_KEY to put Sarvam first.)
 *
 * Clips land in public/audio/narration/ BEFORE bundle() runs so Remotion's
 * staticFile() serves them cleanly.
 */
import path from 'node:path';
import crypto from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { EdgeTTS } from 'node-edge-tts';
import { parseFile } from 'music-metadata';

const NARRATION_SUBDIR = 'audio/narration';
const NARRATION_DIR = path.join(process.cwd(), 'public', NARRATION_SUBDIR);

const DEFAULT_VOICE = process.env.TTS_VOICE || 'en-IN-NeerjaNeural';
const EDGE_HINDI_VOICE = 'hi-IN-SwaraNeural';

const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const GEMINI_TTS_SAMPLE_RATE = 24000;
const GEMINI_MAX_CONCURRENT = 3;

const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';
const SARVAM_MAX_CHARS = 2400;

export type NarrationClip = { src: string; durationSec: number };
export type SpeakerRole = 'arjun' | 'priya' | 'narrator';

const PRONUNCIATION_FIXES: [RegExp, string][] = [
  [/\bJEE\b/g, 'J. E. E.'],
  [/\blive\b/gi, 'laiv'],
  [/\bIES\b/g, 'I. E. S.'],
  [/\bCIL\b/g, 'C. I. L.'],
];

function fixPronunciation(text: string): string {
  return PRONUNCIATION_FIXES.reduce((t, [re, sub]) => t.replace(re, sub), text);
}

function hasDevanagari(text: string): boolean {
  return /[ऀ-ॿ]/.test(text);
}

/* ── Gemini TTS Rotation & Concurrency State (CI-safe) ── */
let geminiKeyCursor = 0;
const exhaustedGeminiKeys = new Set<string>();
let activeGeminiCalls = 0;
const geminiWaitQueue: Array<() => void> = [];

async function withGeminiSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeGeminiCalls >= GEMINI_MAX_CONCURRENT) {
    await new Promise<void>((resolve) => geminiWaitQueue.push(resolve));
  }
  activeGeminiCalls++;
  try {
    return await fn();
  } finally {
    activeGeminiCalls--;
    const next = geminiWaitQueue.shift();
    if (next) next();
  }
}

function getGeminiKeys(): string[] {
  return (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

function geminiVoiceFor(speaker?: SpeakerRole): string {
  if (speaker === 'arjun') return process.env.GEMINI_TTS_VOICE_MALE || 'Puck';
  if (speaker === 'priya') return process.env.GEMINI_TTS_VOICE_FEMALE || 'Kore';
  return process.env.GEMINI_TTS_VOICE || 'Kore';
}

function geminiStylePrefix(speaker?: SpeakerRole): string {
  if (speaker === 'arjun') {
    return 'Speak briskly and naturally in an expressive Indian student voice (clear Indian English and Hinglish pronunciation): ';
  }
  if (speaker === 'priya') {
    return 'Speak warmly, briskly, and confidently like a friendly Indian exam mentor (clear Indian English and Hinglish pronunciation): ';
  }
  return 'Speak briskly and energetically at a YouTube Shorts pace with clear Indian English and Hinglish pronunciation: ';
}

/** Wraps raw 24kHz 16-bit mono PCM bytes with a standard 44-byte RIFF/WAVE header. */
function pcm24kMonoToWav(pcm: Buffer, sampleRate: number = GEMINI_TTS_SAMPLE_RATE): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20);  // Linear PCM
  header.writeUInt16LE(1, 22);  // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  header.writeUInt16LE(2, 32);  // Block align
  header.writeUInt16LE(16, 34); // Bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function synthesizeWithGemini(
  text: string,
  name: string,
  speaker?: SpeakerRole,
): Promise<NarrationClip> {
  const allKeys = getGeminiKeys();
  const available = allKeys.filter((k) => !exhaustedGeminiKeys.has(k));
  const pool = available.length > 0 ? available : allKeys;
  if (pool.length === 0) {
    throw new Error('GEMINI_API_KEYS not set');
  }

  // Round-robin start offset spreads Promise.all bursts across keys cleanly
  const startIdx = geminiKeyCursor++ % pool.length;
  const orderedKeys = [...pool.slice(startIdx), ...pool.slice(0, startIdx)];
  const voiceName = geminiVoiceFor(speaker);
  const promptText = `${geminiStylePrefix(speaker)}${text}`;

  let lastError = 'no keys succeeded';
  for (const key of orderedKeys) {
    try {
      const wavBuf = await withGeminiSlot(async () => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
            },
          }),
          signal: AbortSignal.timeout(25_000),
        });

        const data = (await res.json().catch(() => ({}))) as {
          error?: { code?: number; status?: string; message?: string };
          candidates?: Array<{
            content?: {
              parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
            };
          }>;
        };

        if (res.status === 429 || res.status === 403 || data.error?.status === 'RESOURCE_EXHAUSTED') {
          exhaustedGeminiKeys.add(key);
          throw new Error(`quota/rate (${res.status}): ${data.error?.message?.slice(0, 120) || 'exhausted'}`);
        }
        if (!res.ok || data.error) {
          const msg = data.error?.message || `HTTP ${res.status}`;
          if (/quota|exhausted|rate|RESOURCE_EXHAUSTED/i.test(msg)) {
            exhaustedGeminiKeys.add(key);
          }
          throw new Error(msg);
        }

        const inline = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!inline?.data) {
          throw new Error('Gemini TTS returned no inline audio data');
        }
        const rawBytes = Buffer.from(inline.data, 'base64');
        const mime = inline.mimeType || '';
        const rateMatch = mime.match(/rate=(\d+)/);
        const rate = rateMatch ? Number(rateMatch[1]) : GEMINI_TTS_SAMPLE_RATE;

        // If Gemini already returned WAV/RIFF bytes use directly, otherwise wrap PCM -> WAV
        return rawBytes.subarray(0, 4).toString('ascii') === 'RIFF'
          ? rawBytes
          : pcm24kMonoToWav(rawBytes, rate);
      });

      const file = path.join(NARRATION_DIR, `${name}.wav`);
      writeFileSync(file, wavBuf);
      const durationSec = (await parseFile(file)).format.duration ?? 0;
      if (durationSec <= 0) throw new Error('empty Gemini TTS WAV');
      return { src: `${NARRATION_SUBDIR}/${name}.wav`, durationSec };
    } catch (e) {
      lastError = (e as Error).message;
      // Continue rotating to next key in pool
    }
  }
  throw new Error(`all ${orderedKeys.length} Gemini key(s) failed (${lastError})`);
}

async function synthesizeWithSarvam(
  text: string,
  name: string,
  apiKey: string,
  speaker?: SpeakerRole,
): Promise<NarrationClip> {
  const body: Record<string, unknown> = {
    text: text.slice(0, SARVAM_MAX_CHARS),
    target_language_code: hasDevanagari(text) ? 'hi-IN' : 'en-IN',
    model: 'bulbul:v3',
    pace: 1.08,
    speech_sample_rate: 24000,
  };
  const envVoice =
    speaker === 'arjun'
      ? process.env.SARVAM_VOICE_MALE || process.env.SARVAM_VOICE
      : speaker === 'priya'
      ? process.env.SARVAM_VOICE_FEMALE || process.env.SARVAM_VOICE
      : process.env.SARVAM_VOICE;
  if (envVoice) body.speaker = envVoice;

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

function edgeVoiceFor(text: string, speaker?: SpeakerRole): string {
  const hindi = hasDevanagari(text);
  if (speaker === 'arjun') return hindi ? 'hi-IN-MadhurNeural' : 'en-IN-PrabhatNeural';
  if (speaker === 'priya') return hindi ? EDGE_HINDI_VOICE : 'en-IN-NeerjaNeural';
  return hindi ? EDGE_HINDI_VOICE : DEFAULT_VOICE;
}

async function synthesizeWithEdge(text: string, name: string, speaker?: SpeakerRole): Promise<NarrationClip> {
  const file = path.join(NARRATION_DIR, `${name}.mp3`);
  const tts = new EdgeTTS({
    voice: edgeVoiceFor(text, speaker),
    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
    rate: '+8%',
    timeout: 15_000,
  });
  await tts.ttsPromise(text, file);
  const durationSec = (await parseFile(file)).format.duration ?? 0;
  if (durationSec <= 0) throw new Error('empty narration file');
  return { src: `${NARRATION_SUBDIR}/${name}.mp3`, durationSec };
}

function splitTtsChunks(text: string, maxLen: number = 175): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur.length + w.length + 1 > maxLen && cur.length > 0) {
      chunks.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/** Free zero-key tertiary fallback when both Gemini TTS and Edge TTS fail. */
async function synthesizeWithGoogleTts(text: string, name: string): Promise<NarrationClip> {
  const chunks = splitTtsChunks(text, 175);
  const buffers: Buffer[] = [];
  const tl = hasDevanagari(text) ? 'hi' : 'en-IN';
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${tl}&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Google TTS HTTP ${res.status}`);
    }
    const arr = await res.arrayBuffer();
    buffers.push(Buffer.from(arr));
  }
  const file = path.join(NARRATION_DIR, `${name}.mp3`);
  writeFileSync(file, Buffer.concat(buffers));
  const durationSec = (await parseFile(file)).format.duration ?? 0;
  if (durationSec <= 0) throw new Error('empty Google TTS narration file');
  return { src: `${NARRATION_SUBDIR}/${name}.mp3`, durationSec };
}

async function readCachedClip(cachedName: string, ext: 'wav' | 'mp3'): Promise<NarrationClip | null> {
  const cachedFile = path.join(NARRATION_DIR, `${cachedName}.${ext}`);
  if (!existsSync(cachedFile)) return null;
  try {
    const durationSec = (await parseFile(cachedFile)).format.duration ?? 0;
    if (durationSec > 0) {
      return { src: `${NARRATION_SUBDIR}/${cachedName}.${ext}`, durationSec };
    }
  } catch {
    // Re-synthesize if corrupt
  }
  return null;
}

export async function synthesizeNarration(
  text: string,
  name: string,
  speaker?: SpeakerRole,
): Promise<NarrationClip | null> {
  const cleaned = fixPronunciation(text.replace(/\s+/g, ' ').trim());
  if (!cleaned) return null;
  mkdirSync(NARRATION_DIR, { recursive: true });

  const hasGemini = getGeminiKeys().length > 0;
  const sarvamKey = process.env.SARVAM_API_KEY;
  const sarvamFirst = process.env.TTS_PRIMARY === 'sarvam' && Boolean(sarvamKey);

  const geminiVoice = geminiVoiceFor(speaker);
  const geminiHash = crypto
    .createHash('sha256')
    .update(`gemini_${GEMINI_TTS_MODEL}_${geminiVoice}_${cleaned}`)
    .digest('hex')
    .slice(0, 16);
  const fallbackHash = crypto
    .createHash('sha256')
    .update(`${speaker || 'default'}_${DEFAULT_VOICE}_${cleaned}`)
    .digest('hex')
    .slice(0, 16);

  // 1. Optional Sarvam override (only if explicitly requested via TTS_PRIMARY=sarvam)
  if (sarvamFirst && sarvamKey) {
    const sarvamHash = crypto
      .createHash('sha256')
      .update(`sarvam_${speaker || 'default'}_${process.env.SARVAM_VOICE || 'default'}_${cleaned}`)
      .digest('hex')
      .slice(0, 16);
    const cachedSarvam = await readCachedClip(`${name}_${sarvamHash}`, 'wav');
    if (cachedSarvam) return cachedSarvam;
    try {
      return await synthesizeWithSarvam(cleaned, `${name}_${sarvamHash}`, sarvamKey, speaker);
    } catch (e) {
      console.warn(`[tts] Sarvam "${name}" failed — falling back to Gemini TTS: ${(e as Error).message}`);
    }
  }

  // 2. Primary: Gemini AI TTS (rotated GEMINI_API_KEYS -> .wav)
  if (hasGemini) {
    const cachedGemini = await readCachedClip(`${name}_${geminiHash}`, 'wav');
    if (cachedGemini) return cachedGemini;
    try {
      return await synthesizeWithGemini(cleaned, `${name}_${geminiHash}`, speaker);
    } catch (e) {
      console.warn(`[tts] Gemini TTS "${name}" failed — falling back to Edge TTS: ${(e as Error).message}`);
    }
  }

  // 3. Secondary: Microsoft Edge TTS (.mp3)
  const cachedFallback = await readCachedClip(`${name}_${fallbackHash}`, 'mp3');
  if (cachedFallback) return cachedFallback;
  try {
    return await synthesizeWithEdge(cleaned, `${name}_${fallbackHash}`, speaker);
  } catch (e) {
    console.warn(`[tts] Edge TTS "${name}" failed — falling back to Google TTS: ${(e as Error).message}`);
  }

  // 4. Tertiary: Google translate_tts (.mp3)
  try {
    return await synthesizeWithGoogleTts(cleaned, `${name}_${fallbackHash}`);
  } catch (e) {
    console.warn(`[tts] Narration "${name}" failed — continuing silent: ${(e as Error).message}`);
    return null;
  }
}
