/**
 * Converts English narration lines into natural spoken Hinglish (code-mixed
 * Hindi in Devanagari + English technical terms kept in Latin script) via one
 * small batched Gemini call per video. Only used when Sarvam TTS is active
 * (SARVAM_API_KEY set) — its bulbul voices are built for exactly this
 * code-mixed input, whereas the Edge en-IN fallback voice is not.
 *
 * On-screen text is NEVER touched — this only rewrites what gets spoken.
 * Best-effort like everything else in this pipeline: any failure returns nulls
 * and the caller narrates the original English lines instead.
 *
 * Env: GEMINI_API_KEYS (same rotated ring as quizContent.ts), optional
 * GEMINI_MODEL (default gemini-2.5-flash), TTS_HINGLISH='false' to disable
 * conversion while keeping Sarvam voices.
 */

export function hinglishEnabled(): boolean {
  return Boolean(process.env.SARVAM_API_KEY) && process.env.TTS_HINGLISH !== 'false';
}

const SCHEMA = {
  type: 'OBJECT',
  properties: { lines: { type: 'ARRAY', items: { type: 'STRING' } } },
  required: ['lines'],
};

function buildPrompt(lines: string[]): string {
  return `Convert each English voiceover line below into natural, conversational spoken Hinglish for an Indian exam-prep reel narration (the audience: GATE/PSU/JEE/NEET/SSC aspirants).

Rules:
- Hindi words in Devanagari script; keep exam names, abbreviations, technical terms, formulas, option letters (A/B/C/D), numbers and units in English/Latin script exactly as written.
- Preserve the exact meaning and every fact — never add, drop, or reorder information.
- Keep each line about the same length as the original (it is timed narration).
- Tone: energetic study-buddy, not formal newsreader.

LINES (JSON array, convert each, same order, same count):
${JSON.stringify(lines)}

Return valid JSON only: {"lines": [...]}`;
}

/** Returns one entry per input line — the Hinglish rewrite, or null for that
 * line (and every line, on total failure) so callers fall back per-line. */
export async function toHinglish(lines: string[]): Promise<(string | null)[]> {
  const nulls = lines.map(() => null);
  if (lines.length === 0) return nulls;
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    console.log('[hinglish] GEMINI_API_KEYS not set — narrating original English lines.');
    return nulls;
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = buildPrompt(lines);

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
      const parsed = JSON.parse(text) as { lines?: unknown[] };
      if (!Array.isArray(parsed.lines) || parsed.lines.length !== lines.length) {
        throw new Error(`expected ${lines.length} lines back, got ${parsed.lines?.length ?? 'none'}`);
      }
      return parsed.lines.map((l) => (typeof l === 'string' && l.trim() ? l.trim() : null));
    } catch (e) {
      console.warn(`[hinglish] Gemini call failed: ${(e as Error).message}`);
    }
  }
  console.warn('[hinglish] All Gemini keys failed — narrating original English lines.');
  return nulls;
}
