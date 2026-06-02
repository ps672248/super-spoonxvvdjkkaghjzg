import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Session-only in-memory cache ──────────────────────────────────────────────
const SESSION_CACHE_TTL = 10 * 60 * 1000;
const sessionCache = new Map<string, { data: MCQQuestion[]; timestamp: number }>();

// ── In-flight dedup — prevents identical concurrent API calls ─────────────────
const inFlight = new Map<string, Promise<MCQQuestion[]>>();

// One-time cleanup of legacy 7-day AsyncStorage cache keys
AsyncStorage.getAllKeys().then(keys => {
  const old = keys.filter(k => k.startsWith('psuplus_qcache_'));
  if (old.length > 0) AsyncStorage.multiRemove(old).catch(() => {});
}).catch(() => {});

// ── Fallback model when selected model fails JSON parse ───────────────────────
const FALLBACK_MODEL = 'gemini-2.5-flash';

// ── JSON repair helpers (Gemma / open-source models produce malformed JSON) ───

function repairJson(raw: string): string {
  return raw
    .replace(/```json|```/g, '')               // strip markdown fences
    .replace(/,\s*([}\]])/g, '$1')             // trailing commas
    .replace(/'/g, '"')                         // single → double quotes
    .replace(/(\w[\w\s]*?)\s*:/g, (m, k) => `"${k.trim()}":`) // unquoted keys
    .trim();
}

function extractJson(text: string): any {
  // Stage 1: direct parse
  try { return JSON.parse(text.trim()); } catch (_) {}
  console.log('[JSON] Stage 1 (direct) failed');

  // Stage 2: markdown-fenced json block
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch?.[1]) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_) {}
    try { return JSON.parse(repairJson(fenceMatch[1])); } catch (_) {}
    console.log('[JSON] Stage 2 (fence) failed');
  }

  // Stage 3: extract outermost array [...]
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    const slice = text.substring(arrStart, arrEnd + 1);
    try { return JSON.parse(slice); } catch (_) {}
    try { return JSON.parse(repairJson(slice)); } catch (_) {}
    // Stage 4: truncated array — append closing bracket and try
    try { return JSON.parse(slice + ']'); } catch (_) {}
    console.log('[JSON] Stage 3-4 (array slice) failed');
  }

  // Stage 5: extract outermost object {...}
  const objStart = text.indexOf('{');
  const objEnd = text.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    const slice = text.substring(objStart, objEnd + 1);
    try { return JSON.parse(slice); } catch (_) {}
    try { return JSON.parse(repairJson(slice)); } catch (_) {}
    console.log('[JSON] Stage 5 (object slice) failed');
  }

  // Stage 6: repair full text
  try { return JSON.parse(repairJson(text)); } catch (_) {}
  console.log('[JSON] Stage 6 (full repair) failed');

  throw new Error('Could not extract valid JSON from AI response.');
}

// ── Retry with exponential backoff for rate-limit errors ─────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRateLimit = /high demand|quota|429|resource.exhausted/i.test(err.message || '');
      if (isRateLimit && i < retries) {
        const delay = 1500 * (i + 1);
        console.warn(`[Gemini] Rate limit hit — retry ${i + 1}/${retries} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('unreachable');
}

// ── Gemini API caller ─────────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  modelId: string,
  prompt: string,
  useSchema: boolean,
  schema?: object,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const isGemmaCall = modelId.startsWith('gemma');
  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  // Gemma models: enforce JSON-only output via system_instruction (stronger than in-prompt instruction)
  if (isGemmaCall) {
    body.system_instruction = {
      parts: [{ text: 'You are a JSON-only API. Your ENTIRE response must be valid JSON. No thinking, no markdown, no bullet points, no preamble. For arrays start immediately with [. For objects start with {.' }],
    };
  }

  if (useSchema && schema) {
    body.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema: schema,
    };
  }

  console.log(`[Gemini] → ${modelId} | schema=${useSchema} | sysInstruction=${isGemmaCall} | prompt_len=${prompt.length}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.error) {
    console.error(`[Gemini] API error from ${modelId}:`, data.error);
    throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const finishReason = data.candidates?.[0]?.finishReason;

  console.log(`[Gemini] ← ${modelId} | finish=${finishReason} | response_len=${text?.length ?? 0}`);
  if (text) console.log(`[Gemini] RAW:\n${text.substring(0, 500)}${text.length > 500 ? '…(truncated)' : ''}`);

  if (!text) throw new Error(`No content returned from model ${modelId}`);
  return text;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const MCQ_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      question:    { type: 'STRING' },
      options:     { type: 'ARRAY', items: { type: 'STRING' } },
      correct:     { type: 'STRING' },
      explanation: { type: 'STRING' },
    },
    required: ['question', 'options', 'correct', 'explanation'],
  },
};

const MATCH_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      id:          { type: 'STRING' },
      pairs: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id:    { type: 'STRING' },
            left:  { type: 'STRING' },
            right: { type: 'STRING' },
          },
          required: ['id', 'left', 'right'],
        },
      },
      explanation: { type: 'STRING' },
    },
    required: ['id', 'pairs', 'explanation'],
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type MCQQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  topicTitle?: string;
};

export type GenerateParams = {
  apiKey: string;
  modelId: string;
  psuName: string;
  psuDifficulty: string;
  branchName: string;
  sectionName: string;
  sectionDifficulty: string;
  negativeMarking: number;
  topicTitle: string;
  topicId: string;
  psuId: string;
  branchId: string;
  sectionId: string;
  gameMode: string;
  count?: number;
  bypassCache?: boolean;
  seenQuestions?: string[];
};

// ── Cache helpers ─────────────────────────────────────────────────────────────

function buildCacheKey(psuId: string, branchId: string, sectionId: string, topicId: string, mode: string): string {
  return `${psuId}_${branchId}_${sectionId}_${topicId}_${mode}`;
}

function getCached(key: string, count: number): MCQQuestion[] | null {
  const entry = sessionCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SESSION_CACHE_TTL) { sessionCache.delete(key); return null; }
  if (entry.data.length < count) return null;
  return entry.data;
}

function setCache(key: string, data: MCQQuestion[]): void {
  sessionCache.set(key, { data, timestamp: Date.now() });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function testApiKey(apiKey: string, modelId: string): Promise<boolean> {
  try {
    const text = await callGemini(apiKey, modelId, 'hi', false);
    return !!text;
  } catch {
    return false;
  }
}

export async function generateQuestions(params: GenerateParams): Promise<MCQQuestion[]> {
  const {
    apiKey, modelId, psuName, branchName, sectionName, sectionDifficulty,
    negativeMarking, topicTitle, topicId, psuId, branchId, sectionId, gameMode,
    count = 10, bypassCache = false, seenQuestions = [],
  } = params;

  const cacheKey = buildCacheKey(psuId, branchId, sectionId, topicId, gameMode);

  if (!bypassCache) {
    const cached = getCached(cacheKey, count);
    if (cached) return cached.slice(0, count);
  }

  const nmText = negativeMarking === 0
    ? 'no negative marking'
    : `negative marking of ${negativeMarking} marks per wrong answer`;

  const avoidBlock = seenQuestions.length > 0
    ? `\nDo NOT repeat or closely paraphrase these previously asked questions:\n${
        seenQuestions.slice(-30).map((q, i) => `${i + 1}. ${q.substring(0, 100)}`).join('\n')
      }\n`
    : '';

  // Standard prompt (Gemini models)
  const prompt = `You are an expert question setter for Indian PSU (Public Sector Undertaking) competitive exams.
${avoidBlock}
Context:
- Exam: ${psuName}
- Branch: ${branchName}
- Section: ${sectionName}
- Topic: ${topicTitle}
- Difficulty: ${sectionDifficulty} (calibrated for real ${psuName} CBT exam)
- Marking: ${nmText}
- Mode: ${gameMode}

Generate exactly ${count} MCQs. Each question:
1. Matches real ${psuName} CBT difficulty (not GATE level unless stated high)
2. Has exactly 4 options: A), B), C), D)
3. Has exactly ONE correct answer
4. Has a concise 1–2 sentence explanation

NO PREAMBLE. NO THINKING. NO CHATTER. OUTPUT ONLY RAW JSON ARRAY.
Format: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}]`;

  // Gemma-specific compact prompt — avoids bullet-point context that Gemma echoes back
  const gemmaPrompt = `Generate ${count} multiple-choice questions for ${psuName} ${branchName} exam, topic: ${topicTitle}. Difficulty: ${sectionDifficulty}. Marking: ${nmText}.${avoidBlock ? '\n' + avoidBlock : ''}
Return a JSON array. Each item: {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}
Exactly 4 options, one correct answer, 1-2 sentence explanation.`;

  const isGemma = modelId.startsWith('gemma');

  async function attemptGenerate(model: string): Promise<MCQQuestion[]> {
    const gemmaModel   = model.startsWith('gemma');
    // Schema enabled for ALL models — if Gemma doesn't support it, API returns error
    // which triggers fast fallback to gemini-2.5-flash (better than 200 + planning text)
    const useSchema    = true;
    const activePrompt = gemmaModel ? gemmaPrompt : prompt;
    const text = await withRetry(() => callGemini(apiKey, model, activePrompt, useSchema, MCQ_SCHEMA));
    const raw: any[] = extractJson(text);
    return raw.map((q: any) => ({
      question:    q.question    || '',
      options:     Array.isArray(q.options) ? q.options : [],
      correct:     q.correct     || 'A',
      explanation: q.explanation || '',
      id:          q.id          || Math.random().toString(36).substring(7),
      topicTitle,
    }));
  }

  // Dedup: if same request already in-flight, share that promise
  if (inFlight.has(cacheKey)) {
    console.log(`[Gemini] Deduping in-flight request: ${cacheKey}`);
    return inFlight.get(cacheKey)!;
  }

  const doGenerate = async (): Promise<MCQQuestion[]> => {
    let questions: MCQQuestion[];
    try {
      questions = await attemptGenerate(modelId);
      console.log(`[Gemini] MCQ parse OK — ${questions.length} questions from ${modelId}`);
    } catch (err) {
      console.error(`[Gemini] MCQ parse FAILED for ${modelId}:`, err);
      if (isGemma || modelId !== FALLBACK_MODEL) {
        console.warn(`[Gemini] Falling back to ${FALLBACK_MODEL}`);
        questions = await attemptGenerate(FALLBACK_MODEL);
        console.log(`[Gemini] Fallback OK — ${questions.length} questions from ${FALLBACK_MODEL}`);
      } else {
        throw new Error('AI returned invalid question format. Please try again.');
      }
    }
    if (!bypassCache) setCache(cacheKey, questions);
    return questions;
  };

  const promise = doGenerate();
  inFlight.set(cacheKey, promise);
  promise.finally(() => inFlight.delete(cacheKey));
  return promise;
}

export type MatchPair = { id: string; left: string; right: string };
export type MatchChallenge = { id: string; pairs: MatchPair[]; explanation: string };

export async function generateMatchChallenges(params: GenerateParams): Promise<MatchChallenge[]> {
  const { apiKey, modelId, topicTitle, count = 3 } = params;

  const prompt = `You are an expert PSU exam setter. Generate ${count} "Match the Following" challenges for the topic: ${topicTitle}.
Each challenge has exactly 4 pairs. Left items are terms/concepts, right items are definitions/formulas/examples.

NO PREAMBLE. NO THINKING. NO CHATTER. OUTPUT ONLY RAW JSON ARRAY.
Format: [{"id":"challenge_1","pairs":[{"id":"1","left":"...","right":"..."},{"id":"2","left":"...","right":"..."},{"id":"3","left":"...","right":"..."},{"id":"4","left":"...","right":"..."}],"explanation":"..."}]`;

  const isGemma = modelId.startsWith('gemma');

  async function attemptMatch(model: string): Promise<MatchChallenge[]> {
    const text = await withRetry(() => callGemini(apiKey, model, prompt, true, MATCH_SCHEMA));
    const raw: any[] = extractJson(text);
    return raw.map((c: any) => ({
      id:          c.id          || Math.random().toString(36).substring(7),
      pairs:       Array.isArray(c.pairs) ? c.pairs : [],
      explanation: c.explanation || '',
    }));
  }

  try {
    const result = await attemptMatch(modelId);
    console.log(`[Gemini] Match parse OK — ${result.length} challenges from ${modelId}`);
    return result;
  } catch (err) {
    console.error(`[Gemini] Match parse FAILED for ${modelId}:`, err);
    if (isGemma || modelId !== FALLBACK_MODEL) {
      console.warn(`[Gemini] Falling back to ${FALLBACK_MODEL}`);
      const result = await attemptMatch(FALLBACK_MODEL);
      console.log(`[Gemini] Fallback OK — ${result.length} challenges from ${FALLBACK_MODEL}`);
      return result;
    }
    throw new Error('AI returned invalid challenge format. Please try again.');
  }
}

export type StudySheetParams = {
  apiKey: string;
  modelId: string;
  topicTitle: string;
  psuName: string;
  branchName: string;
};

export async function generateStudySheet(params: StudySheetParams): Promise<string> {
  const { apiKey, modelId, topicTitle, psuName, branchName } = params;

  const prompt = `You are a technical subject matter expert. Create a concise, high-yield study guide for the topic "${topicTitle}" for the ${psuName} exam (${branchName} branch).

Focus on:
1. Core concepts and definitions
2. Frequently asked formulas or properties
3. Key application areas or limitations
4. Quick exam tips

Use clear headings and bullet points. Under 500 words.`;

  return callGemini(apiKey, modelId, prompt, false);
}
