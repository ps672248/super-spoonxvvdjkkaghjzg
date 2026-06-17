# Difficulty Levels

Aspirant Arcade uses a **1–10 numeric difficulty scale** for every question in the shared bank. This document explains what each level means, how sections are assigned ranges, and how the seeder and runtime use them.

---

## Scale reference

| Level | Label | Benchmark |
|-------|-------|-----------|
| 1 | Very Basic | Class 6–8 / direct recall |
| 2 | Easy | Class 9–10 / basic definitions |
| 3 | Easy–Moderate | SSC / NCERT Class 9–10 standard |
| 4 | Moderate | Class 11–12 / introductory engineering |
| 5 | Moderate | 2nd-year engineering fundamentals |
| 6 | Moderate–Hard | 3rd-year engineering / applied concepts |
| 7 | Hard | Final-year engineering / PSU CBT upper end |
| 8 | Hard | JEE Advanced / GATE preparation level |
| 9 | Very Hard | GATE / competitive post-grad entrance |
| 10 | Expert | Research / olympiad / highest GATE difficulty |

---

## Section-level ranges (source of truth)

Every `ExamSection` in [`psus.ts`](../frontend/src/config/psus.ts) carries a `difficultyRange: [min, max]` tuple. This is the **only** place difficulty is defined — all other consumers derive from it.

### PSU exams

| Exam | Section | Range | Rationale |
|------|---------|-------|-----------|
| HPCL | Technical | 5–7 | PSU CBT upper tier; harder than most PSUs but not GATE |
| HPCL | Quant/Reasoning | 2–5 | Standard aptitude; moderate under negative marking |
| HPCL | English | 1–3 | Standard grammar/RC; low inherent difficulty |
| SAIL | Technical | 4–7 | Speed-based; technically moderate |
| SAIL | Quant/Reasoning | 2–5 | Standard aptitude |
| SAIL | English/GK | 1–3 | Standard |
| MSTC | Technical | 4–6 | Moderate; note 1/3 negative marking |
| MSTC | Quant/Reasoning | 2–5 | Standard aptitude |
| MSTC | English | 1–3 | Standard |
| CIL | Technical | 3–6 | No negative marking; moderate depth |
| CIL | GK/English | 1–3 | Standard |
| CIL | Quant/Reasoning | 2–5 | Standard aptitude |
| BHEL | Technical | 5–7 | Power sector depth; high count (120Q) |
| BHEL | Reasoning | 2–5 | High count (50Q) but moderate difficulty |
| BHEL | English | 1–3 | Standard |
| BHEL | GK | 2–4 | Includes S&T/energy; slightly harder than basic GK |
| IOCL | Technical | 5–7 | Oil & gas context; 60% weightage |
| IOCL | Quant/Reasoning | 2–5 | Standard aptitude |
| IOCL | English | 1–3 | Standard |
| ONGC | Technical | 5–7 | Upstream E&P; deep petroleum knowledge |
| ONGC | Reasoning | 2–5 | Standard aptitude |
| ONGC | English | 1–3 | Technical English but still low difficulty |
| BPCL | Technical | 4–7 | Compact paper; refining context |
| BPCL | Quant/Reasoning | 2–5 | Standard aptitude |
| BPCL | English | 1–3 | Only 10 questions; standard |
| NTPC | Technical | 4–6 | Power sector; moderate GATE-adjacent |
| NTPC | Reasoning | 2–5 | Standard aptitude |
| NTPC | English/GK | 1–3 | Standard; no negative marking |
| POWERGRID | Technical | 4–6 | Transmission focus; moderate depth |
| POWERGRID | Reasoning/Quant | 2–5 | Standard aptitude |
| POWERGRID | English/GK | 1–3 | Standard; no negative marking |
| GAIL | Technical | 4–6 | Pipeline/gas context; moderate depth |
| GAIL | Quant/Reasoning | 2–5 | Standard aptitude |
| GAIL | English/GK | 1–3 | Standard |
| NALCO | Technical | 3–5 | Entry-level PSU; aluminium sector context |
| NALCO | Reasoning/Quant | 2–5 | Standard aptitude |
| NALCO | English | 1–3 | Standard |

### Schooling (CBSE/NCERT)

| Class | Subject | Range | Rationale |
|-------|---------|-------|-----------|
| 9 | Science, Maths | 1–4 | NCERT introductory concepts |
| 9 | SST, English | 1–3 | Mostly recall; reading/grammar |
| 10 | Science, Maths | 2–5 | Board-level application |
| 10 | SST, English | 1–4 | Slightly harder than Class 9 |
| 11 | Physics, Maths | 4–7 | Significant difficulty jump |
| 11 | Chemistry | 3–6 | Applied chemistry concepts |
| 11 | Biology | 3–5 | Conceptual; less calculation |
| 11 | English | 1–4 | Literature + grammar |
| 12 | Physics, Maths | 5–8 | Board + JEE-adjacent level |
| 12 | Chemistry | 4–7 | Synthesis/application heavy |
| 12 | Biology | 4–6 | NEET-adjacent upper end |
| 12 | English | 2–5 | Long readings, writing |

---

## How the derived file works

[`frontend/src/config/difficulty.ts`](../frontend/src/config/difficulty.ts) is **auto-computed** at module load from `PSUS`. Never edit it directly.

```typescript
// Look up range for one exam+section
rangeFor('hpcl', 'technical') // → [5, 7]

// All sections whose range includes level 6
examsAtLevel(6)
// → [{examId:'hpcl', sectionId:'technical', range:[5,7]}, {examId:'bhel', ...}, ...]

// Union of ranges across every exam sharing the same sectionId
// Used by the seeder to decide which difficulty levels to generate
unionRangeForSection('technical')
// → [3, 7]  (NALCO[3,5] ∪ CIL[3,6] ∪ SAIL[4,7] ∪ HPCL[5,7] ∪ ...)

// Test whether two sections can share questions
rangesOverlap('hpcl', 'technical', 'sail', 'technical') // → true  ([5,7] ∩ [4,7])
rangesOverlap('hpcl', 'technical', 'nalco', 'technical') // → false ([5,7] ∩ [3,5] → overlap at 5)
// Wait — they DO overlap at 5. Only truly non-overlapping pairs return false:
rangesOverlap('hpcl', 'english', 'nalco', 'technical')  // → false ([1,3] ∩ [3,5] → overlap at 3)
```

---

## Seeder behaviour

The seeder ([`scripts/seed_questions.ts`](../scripts/seed_questions.ts)) generates questions **only within each section's difficulty range**, not blindly across all 10 levels.

**Example — `mechanical_technical_thermo_mcq`**

| Exam | Technical range |
|------|----------------|
| HPCL | 5–7 |
| SAIL | 4–7 |
| BHEL | 5–7 |
| CIL  | 3–6 |
| NALCO | 3–5 |

Union range = **3–7** (5 levels). Seeder generates `5 × 10 = 50 questions` instead of `10 × 10 = 100`.

A question generated at level 6 for HPCL is automatically eligible for SAIL (range 4–7) and CIL (range 3–6), but **not** for a future GATE question bank whose range is 8–10.

---

## Runtime query

When a user starts a game without a Gemini key, the app queries:

```
question_bank
  WHERE bankKey == "mechanical_technical_thermo_mcq"
  AND   hidden  == false
  AND   difficulty >= 5   ← section.difficultyRange[0]
  AND   difficulty <= 7   ← section.difficultyRange[1]
  ORDER BY difficulty
  LIMIT count × 4
```

Then client-side shuffles and returns up to `count` unique unseen questions.

---

## Adding a new exam

1. Add sections to `CORE_EXAMS` in `psus.ts` with a `difficultyRange` based on the table above.
2. `difficulty.ts` updates automatically — no changes needed there.
3. The seeder picks up new bankKeys on the next run.

**Range assignment heuristics:**

- Technical sections of mainstream PSUs (HPCL, BHEL, IOCL, ONGC): **5–7**
- Technical sections of moderate PSUs (SAIL, NTPC, POWERGRID, GAIL): **4–6/4–7**
- Technical sections of entry-level PSUs (CIL, NALCO, MSTC): **3–5/3–6**
- Aptitude (quant/reasoning): **2–5**
- English/GK: **1–3** (GK with science/tech flavour: 2–4)
- Future GATE/JEE: **7–9**
- Future SSC CGL technical: **3–5**
