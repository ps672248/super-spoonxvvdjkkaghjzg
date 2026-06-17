# Prompts

All AI prompts in Aspirant Arcade live in two files:

| File | Context | Model |
|------|---------|-------|
| [`frontend/src/services/gemini.ts`](../frontend/src/services/gemini.ts) | Runtime — user plays a game | User's Gemini key (or embed proxy) |
| [`scripts/seed_questions.ts`](../scripts/seed_questions.ts) | CI seeder — pre-fills the question bank | `GEMINI_API_KEYS` pool |

---

## 1. MCQ prompt — `generateQuestions()`

**Used by:** MCQ, Survival, Slasher, Mario game modes (all share the MCQ shape).

**Inputs consumed:**

| Variable | Source |
|----------|--------|
| `framing` | `examFraming` param → defaults to `"Indian PSU competitive exams"` |
| `psuName` | selected exam name |
| `branchName` | selected engineering branch |
| `sectionName` | selected section (e.g. "Technical / Domain Knowledge") |
| `topicTitle` | selected topic(s), joined by `, ` when multiple |
| `difficultyMin/Max` | `section.difficultyRange` from psus.ts |
| `nmText` | computed from `negativeMarking` (0 → "no negative marking", else fraction) |
| `count` | number of questions requested |
| `avoidBlock` | last 30 seen question texts → injected to prevent repeats |

**Standard prompt (all non-Gemma models):**

```
You are an expert question setter for {framing}.
{avoidBlock}
Context:
- Exam: {psuName}
- Branch: {branchName}
- Section: {sectionName}
- Topic: {topicTitle}
- Difficulty: {difficultyMin}–{difficultyMax}/10 (calibrated for the real {psuName} exam)
- Marking: {nmText}
- Mode: {gameMode}

Generate exactly {count} MCQs. Each question:
1. Matches the real {psuName} exam difficulty for this topic
2. Has exactly 4 options: A), B), C), D)
3. Has exactly ONE correct answer
4. Has a concise 1–2 sentence explanation
5. Has a "topic" field naming the SINGLE specific topic it tests — pick exactly one from: {topicTitle}
6. Tag each question with a "difficulty" integer from 1-10, within the band {difficultyMin}-{difficultyMax} for this exam/topic.

NO PREAMBLE. NO THINKING. NO CHATTER. OUTPUT ONLY RAW JSON ARRAY.
Format: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"...","topic":"...","difficulty":5}]
```

**Gemma-specific compact prompt** (used when `modelId.startsWith('gemma')`):

```
Generate {count} multiple-choice questions for {psuName} {branchName} exam, topic: {topicTitle}. Difficulty: {difficultyMin}–{difficultyMax}/10. Marking: {nmText}.
{avoidBlock}
Return a JSON array. Each item: {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}
Exactly 4 options, one correct answer, 1-2 sentence explanation.
```

Gemma gets a shorter prompt because it echoes back bullet-point context as prose, polluting the JSON output. Schema-enforced JSON (`responseMimeType: application/json`) is still enabled; if the model rejects it, the caller auto-falls back to `gemini-2.5-flash`.

**Output schema enforced via API:**

```json
{
  "type": "ARRAY",
  "items": {
    "type": "OBJECT",
    "properties": {
      "question":    { "type": "STRING" },
      "options":     { "type": "ARRAY", "items": { "type": "STRING" } },
      "correct":     { "type": "STRING" },
      "explanation": { "type": "STRING" },
      "topic":       { "type": "STRING" },
      "difficulty":  { "type": "INTEGER" }
    },
    "required": ["question", "options", "correct", "explanation"]
  }
}
```

**Retry policy:** up to 3 regenerations; switches to `gemini-2.5-flash` fallback after first failure. Embed mode = single call, no retry.

---

## 2. Match prompt — `generateMatchChallenges()`

**Used by:** Match game mode only.

**Inputs consumed:** `topicTitle`, `count` (default 3).

**Prompt:**

```
You are an expert PSU exam setter. Generate {count} "Match the Following" challenges for the topic: {topicTitle}.
Each challenge has exactly 4 pairs. Left items are terms/concepts, right items are definitions/formulas/examples.

NO PREAMBLE. NO THINKING. NO CHATTER. OUTPUT ONLY RAW JSON ARRAY.
Format: [{"id":"challenge_1","pairs":[{"id":"1","left":"...","right":"..."},{"id":"2","left":"...","right":"..."},{"id":"3","left":"...","right":"..."},{"id":"4","left":"...","right":"..."}],"explanation":"..."}]
```

No framing, no difficulty, no seen-questions block — match challenges are topic-pure.

> **Known gap:** persona is hardcoded to `"PSU exam setter"` regardless of category. Schooling users get the same prompt. Does not affect question quality in practice (topic anchors the content), but should be fixed when schooling Match mode ships — pass `examFraming` into `generateMatchChallenges()` and use it in the persona line.

**Output schema enforced:**

```json
{
  "type": "ARRAY",
  "items": {
    "type": "OBJECT",
    "properties": {
      "id":          { "type": "STRING" },
      "pairs":       { "type": "ARRAY", "items": { "id": "STRING", "left": "STRING", "right": "STRING" } },
      "explanation": { "type": "STRING" }
    },
    "required": ["id", "pairs", "explanation"]
  }
}
```

**Retry policy:** one attempt on the user's model; one fallback to `gemini-2.5-flash` on failure. No regen loop (no `isValidMatch` check beyond schema).

---

## 3. True/False prompt — `generateTrueFalse()`

**Used by:** Tsunami game mode.

**Inputs consumed:**

| Variable | Source |
|----------|--------|
| `psuName`, `branchName`, `sectionName` | selected exam/branch/section |
| `topicTitle` | selected topic(s) |
| `framing` | `examFraming` → defaults to PSU framing |
| `difficultyMin/Max` | `section.difficultyRange` |
| `count` | default 15 |
| `avoidBlock` | last 30 seen statement texts |

**Prompt:**

```
You are an expert question setter for {psuName} ({branchName}) — {framing}.
{avoidBlock}
Generate exactly {count} TRUE/FALSE statements on: {topicTitle} (section: {sectionName}, difficulty: {difficultyMin}–{difficultyMax}/10).
Rules:
1. Roughly half TRUE and half FALSE — shuffle them, do not group.
2. Each item is a single clear factual claim (a statement, NOT a question).
3. Calibrated to the real {psuName} exam difficulty.
4. "isTrue" is a boolean (true/false) — the actual truth of the statement.
5. Include a concise 1-sentence "explanation" of why it is true or false.
6. "topic" names the single specific topic it tests — pick one from: {topicTitle}.
7. Tag each statement with a "difficulty" integer from 1-10, within the band {difficultyMin}-{difficultyMax}.

NO PREAMBLE. NO THINKING. NO CHATTER. OUTPUT ONLY RAW JSON ARRAY.
Format: [{"statement":"...","isTrue":true,"explanation":"...","topic":"...","difficulty":5}]
```

Key differences from MCQ: no options/correct field; `isTrue` boolean; explicit rule to shuffle true/false mix.

**Output schema enforced:**

```json
{
  "type": "ARRAY",
  "items": {
    "type": "OBJECT",
    "properties": {
      "statement":   { "type": "STRING" },
      "isTrue":      { "type": "BOOLEAN" },
      "explanation": { "type": "STRING" },
      "topic":       { "type": "STRING" },
      "difficulty":  { "type": "INTEGER" }
    },
    "required": ["statement", "isTrue", "explanation"]
  }
}
```

**Retry policy:** same as MCQ — up to 3 regenerations, fallback to `gemini-2.5-flash`.

---

## 4. Study sheet prompt — `generateStudySheet()`

**Used by:** Syllabus screen → "Generate Study Sheet" button.

**Inputs consumed:** `topicTitle`, `psuName`, `branchName`.

**Prompt:**

```
You are a technical subject matter expert. Create a concise, high-yield study guide for the topic "{topicTitle}" for the {psuName} exam ({branchName} branch).

Focus on:
1. Core concepts and definitions
2. Frequently asked formulas or properties
3. Key application areas or limitations
4. Quick exam tips

Use clear headings and bullet points. Under 500 words.
```

Returns **plain text** (Markdown), not JSON. Schema enforcement is off (`useSchema: false`). No retry — one call.

---

## 5. Seeder prompt — `buildPrompt()` in `seed_questions.ts`

**Used by:** CI seeder (`scripts/seed_questions.ts`), not the app at runtime.

**Inputs consumed:** `Unit` (bankKey metadata) + `d` (exact difficulty level) + `n` (questions per level).

**Prompt:**

```
You are an expert question setter for {unit.framing}.
Generate exactly {n} multiple-choice questions.
Context — Branch/Stream: {unit.branchName}; Section/Subject: {unit.sectionName}; Topic: {unit.topicTitle}.
Difficulty: EXACTLY {d} on a 1-10 scale (1 = very easy recall, 5 = moderate application, 10 = very hard / olympiad-competitive). This topic's valid range is {lo}–{hi}. Calibrate precisely to level {d}.
Rules: exactly 4 options each, labelled "A) ", "B) ", "C) ", "D) "; exactly ONE correct answer; a concise 1-2 sentence explanation.
Return ONLY a JSON array: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}]
```

Key differences from the runtime MCQ prompt:
- **Exact difficulty level** (`d`) instead of a range — seeder generates one level at a time to fill the bank precisely.
- **No seen-questions block** — seeder deduplicates by `hashContent(question)` at write time (`doc.create()` fails on duplicate ID).
- **No topic/difficulty fields in output** — seeder hardcodes `difficulty: d` on the Firestore document itself; the model doesn't need to tag it.
- **Framing** comes from `unit.framing` (either PSU or `"CBSE / NCERT {class} examination"`).

**PSU rendered example** — `mechanical_technical_thermo_mcq`, difficulty 6, 10 questions:

```
You are an expert question setter for Indian PSU (Public Sector Undertaking) competitive exam.
Generate exactly 10 multiple-choice questions.
Context — Branch/Stream: Mechanical; Section/Subject: Technical / Domain Knowledge; Topic: Thermodynamics.
Difficulty: EXACTLY 6 on a 1-10 scale (1 = very easy recall, 5 = moderate application, 10 = very hard / olympiad-competitive). This topic's valid range is 3–7. Calibrate precisely to level 6.
Rules: exactly 4 options each, labelled "A) ", "B) ", "C) ", "D) "; exactly ONE correct answer; a concise 1-2 sentence explanation.
Return ONLY a JSON array: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}]
```

**Schooling rendered example** — `all_phy12_waves_mcq`, difficulty 6, 10 questions:

```
You are an expert question setter for CBSE / NCERT Class 12 examination.
Generate exactly 10 multiple-choice questions.
Context — Branch/Stream: General; Section/Subject: Physics; Topic: Waves.
Difficulty: EXACTLY 6 on a 1-10 scale (1 = very easy recall, 5 = moderate application, 10 = very hard / olympiad-competitive). This topic's valid range is 5–8. Calibrate precisely to level 6.
Rules: exactly 4 options each, labelled "A) ", "B) ", "C) ", "D) "; exactly ONE correct answer; a concise 1-2 sentence explanation.
Return ONLY a JSON array: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}]
```

The only difference between the two is `framing` (line 1) and `difficultyRange` (valid range). The seeder uses **no branch** (`branchId: 'all'`, `branchName: 'General'`) for Schooling because `class-9/10/11/12` declare `branches: []`.

---

## 6. Schooling runtime prompts

Schooling (Class 9–12) uses the **same `generateQuestions()` and `generateTrueFalse()` functions** as PSU. No separate code path. Two things change:

| Param | PSU value | Schooling value | Set in |
|-------|-----------|-----------------|--------|
| `examFraming` | `undefined` (defaults to PSU) | `'Indian school board (CBSE/NCERT) examinations'` | `useGameQuestions.ts` when `examType === 'Boards'` |
| `difficultyMin/Max` | e.g. `[5, 7]` for HPCL technical | e.g. `[5, 8]` for Class 12 Physics | `section.difficultyRange` in `schooling.ts` |

**Rendered MCQ prompt — Class 12 Physics, Waves, difficulty 5–8:**

```
You are an expert question setter for Indian school board (CBSE/NCERT) examinations.

Context:
- Exam: Class 12
- Branch: General
- Section: Physics
- Topic: Waves
- Difficulty: 5–8/10 (calibrated for the real Class 12 exam)
- Marking: no negative marking
- Mode: mcq

Generate exactly 10 MCQs. Each question:
1. Matches the real Class 12 exam difficulty for this topic
2. Has exactly 4 options: A), B), C), D)
3. Has exactly ONE correct answer
4. Has a concise 1–2 sentence explanation
5. Has a "topic" field naming the SINGLE specific topic it tests — pick exactly one from: Waves
6. Tag each question with a "difficulty" integer from 1-10, within the band 5-8 for this exam/topic.

NO PREAMBLE. NO THINKING. NO CHATTER. OUTPUT ONLY RAW JSON ARRAY.
Format: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"...","topic":"...","difficulty":6}]
```

**Rendered TF prompt — Class 9 Science, Force and Motion:**

```
You are an expert question setter for Class 9 (General) — Indian school board (CBSE/NCERT) examinations.

Generate exactly 15 TRUE/FALSE statements on: Force and Motion (section: Science, difficulty: 1–4/10).
Rules:
1. Roughly half TRUE and half FALSE — shuffle them, do not group.
2. Each item is a single clear factual claim (a statement, NOT a question).
3. Calibrated to the real Class 9 exam difficulty.
4. "isTrue" is a boolean (true/false) — the actual truth of the statement.
5. Include a concise 1-sentence "explanation" of why it is true or false.
6. "topic" names the single specific topic it tests — pick one from: Force and Motion.
7. Tag each statement with a "difficulty" integer from 1-10, within the band 1-4.

NO PREAMBLE. NO THINKING. NO CHATTER. OUTPUT ONLY RAW JSON ARRAY.
Format: [{"statement":"...","isTrue":true,"explanation":"...","topic":"...","difficulty":2}]
```

**What changes vs PSU prompts:**

| Element | PSU | Schooling |
|---------|-----|-----------|
| System persona | `"expert question setter for Indian PSU..."` | `"expert question setter for Indian school board (CBSE/NCERT)..."` |
| Branch | Engineering discipline (Mechanical, EE…) | `"General"` (no branch) |
| Difficulty band | 5–7 typical for technical | 1–4 (Class 9) to 5–8 (Class 12) |
| Negative marking | 0.25 or 0.33 for most PSUs | Always `0` — "no negative marking" |
| `avoidBlock` | Same mechanism | Same mechanism |

The model picks up `"CBSE/NCERT"` framing and generates NCERT-syllabus-aligned questions automatically — no additional instruction needed.

---

## Shared design rules

### 1. `NO PREAMBLE. NO THINKING. NO CHATTER.`
Appended to every structured prompt. Prevents models from wrapping JSON in prose. Especially important for reasoning models (o-series, Gemini 2.5) that default to a thinking preamble.

### 2. Schema enforcement (`responseMimeType: application/json`)
All structured prompts pass a `responseSchema` to the API. This constrains the model's token space to valid JSON matching the schema. Reduces parse failures by ~80% vs free-form text.

### 3. `avoidBlock` (dedup layer)
Runtime MCQ and TF prompts inject the last 30 seen question/statement texts. Truncated to 100 chars each to stay within token budget. The seeder skips this — it deduplicates server-side by document ID.

### 4. `framing` (category-aware context)
`examFraming` in `GenerateParams` lets the prompt adapt to non-PSU categories:
- PSU → `"Indian PSU (Public Sector Undertaking) competitive exams"`
- Schooling → `"Indian school board (CBSE/NCERT) examinations"`

Injected via `useGameQuestions.ts` based on `selectedPSU.examType === 'Boards'`.

### 5. Fallback model
All runtime prompts auto-fall back to `gemini-2.5-flash` (`FALLBACK_MODEL`) on JSON parse failure or schema rejection. The seeder uses a single configurable model (`SEED_MODEL` env var) with key rotation instead.

---

## Adding a new prompt

1. Add a new `generate*()` function in `gemini.ts` following the existing pattern.
2. Define a schema constant (`*_SCHEMA`) if the output is structured.
3. Add needed params to `GenerateParams` or create a separate params type (like `StudySheetParams`).
4. Wire it through `useGameQuestions.ts` if it's game-mode-driven.
5. Document it here.
