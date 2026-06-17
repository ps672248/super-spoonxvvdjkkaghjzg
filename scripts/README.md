# Scripts

## `seed_questions.ts` — question-bank seeder

Generates MCQs and writes them to Firestore `question_bank` in the shape the app
reads — so users without a Gemini key get served real questions.

**What it does**
- Builds the seed catalogue from the app's own config (`frontend/src/config`): every
  unique `branch · section · topic` becomes a unit (deduped by `bankKey`).
- Per topic: generates **10 questions at each difficulty 1–10 → 100 per topic**, each
  tagged with its level. The app's difficulty-range query then serves the right subset
  per exam.
- Writes via Firebase Admin (`create()` → idempotent, never duplicates, never clobbers
  moderation flags). Skips a topic already at 100.
- Advances a persistent cursor `metadata/seed_progress`, so the hourly CI run fills the
  whole catalogue over time.
- **Key rotation:** `GEMINI_API_KEYS` is a comma-separated list; on a 429/quota error it
  rotates to the next key. When all are spent it stops without advancing the cursor, so
  the next run resumes the same topic.

**Run locally**
```bash
cd scripts
npm install
export GEMINI_API_KEYS="key1,key2,key3"
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'   # or GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
export SEED_TOPICS_PER_RUN=3        # optional, default 1
npm run seed
```

**Env**
| Var | Purpose |
|-----|---------|
| `GEMINI_API_KEYS` | Comma-separated Gemini keys, rotated on rate-limit |
| `FIREBASE_SERVICE_ACCOUNT` | Inline service-account JSON (project `alhansat-4edee`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | …or a path to the JSON file |
| `SEED_TOPICS_PER_RUN` | Topics per run (default 1) |
| `SEED_PER_DIFFICULTY` | Questions per difficulty level (default 10) |
| `SEED_MODEL` | Gemini model (default `gemini-3.1-flash-lite`) |

**CI:** `.github/workflows/seed-questions.yml` runs this hourly. Add repo secrets
`GEMINI_API_KEYS` and `FIREBASE_SERVICE_ACCOUNT`.

**Notes**
- Seeds the **MCQ** type only (covers MCQ / Survival / Slasher / Mario modes).
  True/False (Tsunami) and Match are not seeded.
- The catalogue is large (PSU sections are keyed per engineering branch). At 1 topic/hour
  it fills gradually; bump `SEED_TOPICS_PER_RUN` (with enough keys) to go faster.
