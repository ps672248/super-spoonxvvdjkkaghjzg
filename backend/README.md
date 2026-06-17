# Aspirant Arcade — Backend

Minimal service for the **shared question bank**. The frontend never writes the bank
directly (prevents poisoning); all writes go through here, validated with the Firebase
Admin SDK. Reads are public and happen straight from Firestore on the client.

## Endpoints

| Method | Path | Body | Purpose |
|--------|------|------|---------|
| `GET`  | `/` | — | Health check |
| `POST` | `/submitQuestions` | `{ bankKey, meta:{ branchId, sectionId, topicId, type, sourceExamId, difficulty? }, questions:[…] }` | Validate + idempotently store generated questions. `type ∈ mcq\|tf\|match`. |
| `POST` | `/reportQuestion` | `{ questionId }` | Increment `reportCount`; hide once it reaches the threshold (3). |

- Question id = `hashContent(text)` — **kept identical to** `frontend/src/services/gemini.ts` so the same question never duplicates.
- Writes use Firestore `create()` (create-only) → re-submits are no-ops and never clobber `reportCount`/`hidden`.
- Validation (`isValidMCQ` / `isValidTF` / `isValidMatch`) is ported from the frontend.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in credentials
npm start              # or: npm run dev
```

Provide Firebase Admin credentials via either `GOOGLE_APPLICATION_CREDENTIALS`
(path to a service-account JSON) or an inline `FIREBASE_SERVICE_ACCOUNT` JSON string.
Set `ALLOWED_ORIGINS` to the app origin(s) permitted to call the write/report endpoints.

## Deploy

Any Node host works (Render / Railway / Fly / Cloud Run). No Firebase Blaze plan
required — this runs as a standalone service with a service-account key. Point the
frontend's question-bank base URL at the deployed origin.

## Document shape (`question_bank/{questionId}`)

```
bankKey:      "branchId_sectionId_topicId_type"   // no exam id, no difficulty
branchId, sectionId, topicId
type:         "mcq" | "tf" | "match"
difficulty:   1..10                                // per-question; range-matched on read
payload:      { …type-specific question fields }
sourceExamId: string                               // provenance only
rand:         0..1
reportCount:  0
hidden:       false
createdAt:    serverTimestamp
```
