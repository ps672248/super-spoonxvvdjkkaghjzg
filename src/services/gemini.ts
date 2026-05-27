import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Session-only in-memory cache (dies on app close) ─────────────────────────
// Prevents double-fetching the same topic within a single app session.
// No persistence — every new launch gets fresh questions from Gemini.
const SESSION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const sessionCache = new Map<string, { data: MCQQuestion[]; timestamp: number }>();

// One-time cleanup of legacy 7-day AsyncStorage cache keys
AsyncStorage.getAllKeys().then(keys => {
  const old = keys.filter(k => k.startsWith('psuplus_qcache_'));
  if (old.length > 0) AsyncStorage.multiRemove(old).catch(() => {});
}).catch(() => {});

export type MCQQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: string; // e.g. "A"
  explanation: string;
  topicTitle?: string;
};

function buildCacheKey(psuId: string, branchId: string, sectionId: string, topicId: string, mode: string): string {
  return `${psuId}_${branchId}_${sectionId}_${topicId}_${mode}`;
}

function getCached(key: string, count: number): MCQQuestion[] | null {
  const entry = sessionCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SESSION_CACHE_TTL) {
    sessionCache.delete(key);
    return null;
  }
  if (entry.data.length < count) return null;
  return entry.data;
}

function setCache(key: string, data: MCQQuestion[]): void {
  sessionCache.set(key, { data, timestamp: Date.now() });
}

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
  seenQuestions?: string[]; // question texts already seen for this PSU — injected into prompt as AVOID list
};

export async function testApiKey(apiKey: string, modelId: string): Promise<boolean> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'hi' }] }]
      })
    });
    const data = await response.json();
    return !!data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (err) {
    console.error('Test API error:', err);
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

  // Build AVOID block from last 30 seen questions for this PSU
  const avoidBlock = seenQuestions.length > 0
    ? `\nIMPORTANT: Do NOT repeat or closely paraphrase these previously asked questions:\n${
        seenQuestions.slice(-30).map((q, i) => `${i + 1}. ${q.substring(0, 100)}`).join('\n')
      }\n`
    : '';

  const prompt = `You are an expert question setter for Indian PSU (Public Sector Undertaking) competitive exams.

Context:
- Exam: ${psuName}
- Branch: ${branchName}
- Section: ${sectionName}
- Topic: ${topicTitle}
- Section Difficulty: ${sectionDifficulty} (calibrated for real ${psuName} exam)
- Marking: ${nmText}
- Game Mode: ${gameMode}
${avoidBlock}
Generate exactly ${count} multiple-choice questions. Each question must:
1. Match the exact difficulty level of real ${psuName} CBT exam (not GATE level unless stated high)
2. Have exactly 4 options labeled A), B), C), D)
3. Have exactly ONE correct answer
4. Include a concise 1-2 line explanation for the correct answer
5. Be unambiguous and factually accurate

Return ONLY a valid JSON array. DO NOT include any internal thoughts, re-evaluations, or "Oops" comments in the explanation. The explanation must be a direct, 1-2 sentence justification.
Return format:
[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('No content generated from Gemini');

  // Basic cleanup of potential markdown blocks or leading/trailing chatter
  let cleanedJson = text.trim();
  if (cleanedJson.includes('```')) {
    const matches = cleanedJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (matches && matches[1]) {
      cleanedJson = matches[1].trim();
    }
  }
  
  // Remove any potential text before the first [ and after the last ]
  const firstBracket = cleanedJson.indexOf('[');
  const lastBracket = cleanedJson.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) {
    cleanedJson = cleanedJson.substring(firstBracket, lastBracket + 1);
  }
  try {
    const rawQuestions = JSON.parse(cleanedJson);
    const questions = rawQuestions.map((q: any) => ({
      ...q,
      id: q.id || Math.random().toString(36).substring(7),
      topicTitle: topicTitle
    }));
    if (!bypassCache) {
      setCache(cacheKey, questions);
    }
    return questions;
  } catch (err) {
    console.error('MCQ JSON Parse Error:', cleanedJson);
    throw new Error('AI returned invalid question format. Please try again.');
  }
}

export type MatchPair = { id: string; left: string; right: string };

export type MatchChallenge = {
  id: string;
  pairs: MatchPair[];
  explanation: string;
};

export async function generateMatchChallenges(params: GenerateParams): Promise<MatchChallenge[]> {
  const { apiKey, modelId, psuName, topicTitle, count = 3 } = params;

  const prompt = `You are an expert PSU exam setter. Generate ${count} "Match the Following" challenges for the topic: ${topicTitle}.
Each challenge must have 4 pairs.
The left items should be terms/concepts, and right items should be their definitions/examples/formulas.

Return ONLY a valid JSON array:
[
  {
    "id": "challenge_1",
    "pairs": [
      {"id": "1", "left": "...", "right": "..."},
      {"id": "2", "left": "...", "right": "..."},
      {"id": "3", "left": "...", "right": "..."},
      {"id": "4", "left": "...", "right": "..."}
    ],
    "explanation": "Briefly explain the relationships."
  }
]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('No content generated');

  const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const raw = JSON.parse(cleanedJson);
    return raw.map((c: any) => ({
      ...c,
      id: c.id || Math.random().toString(36).substring(7)
    }));
  } catch (err) {
    console.error('Match JSON Parse Error:', cleanedJson);
    throw new Error('AI returned invalid challenge format.');
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

  const prompt = `You are a technical subject matter expert. Create a concise, high-yield study guide for the topic "${topicTitle}" specifically tailored for the ${psuName} exam for ${branchName} engineering students.
  
  Focus on:
  1. Core concepts and definitions
  2. Frequently asked formulas or properties
  3. Key application areas or limitations
  4. Quick tips for solving questions related to this topic
  
  Format it using clear headings and bullet points. Avoid unnecessary fluff. Keep it within 500 words.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('No content generated');
  return text;
}
