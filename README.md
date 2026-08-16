# Aspirant Arcade — content & growth bots

Automated content/marketing pipeline for [Aspirant Arcade](https://www.aspirant-arcade.xyz) — split out from the main (private) app repo into its own public repo to run on GitHub Actions' unlimited free minutes for public repos, instead of the private repo's 2,000 min/month cap.

Public on purpose: none of this is the app's source, the admin panel, or the content-generation prompts (those stay in the private repo). What's here is comment bots, video rendering, and growth reporting — compute-heavy or high-frequency workloads with no proprietary logic worth keeping closed.

## Layout

| Directory | What it does |
|---|---|
| [`marketing/video/`](marketing/video/) | Remotion pipeline — daily quiz-card, meme, and NewsRecap reels for YouTube Shorts/Instagram |
| [`marketing/youtube/`](marketing/youtube/) | Per-vertical YouTube comment bots (Python) |
| [`marketing/reddit/`](marketing/reddit/) | Reddit comment bot (Python) |
| [`growth/`](growth/) | Weekly SEO + analytics digest — Search Console, GA4, Vercel, Firestore product counts → Discord |
| [`.github/workflows/`](.github/workflows/) | Everything above, scheduled or dispatched |

## How this connects to the private repo

- **Secrets** come from the private repo's `.env.config` (single source of truth, shared root — see that repo's env-sync tooling). Shared values (Firebase, Gemini, Cloudinary, YouTube/Instagram creds) are pushed here from the same generated file, not hand-duplicated.
- **`render-news-recap.yml`** is triggered by a tiny same-repo workflow in the private repo (`workflow_run` on its Blog Bot completing) — a payload-less dispatch. It doesn't get told which article; it queries Firestore itself for articles marked `videoStatus: 'pending'`. See that workflow's header comment and `marketing/video/src/renderPendingRecaps.ts`.
- **Admin-panel video approval** (`admin-video-render.yml`/`admin-video-publish.yml`) is dispatched directly by the private repo's website admin panel — same Firestore-state-machine pattern, the article doc is the source of truth, not the dispatch payload.
- **`marketing/video/src/syllabusTopics.local.ts`** needs manual population before meme generation works — see that file's header comment. Deliberately not auto-copied from the private repo's `frontend/src/config/syllabus/*`.

## One-time setup after cloning

1. `npm install` in each subdirectory you're working on (no root workspace — each is independent).
2. Populate `marketing/video/src/syllabusTopics.local.ts` (see its header comment) if you need meme generation working locally.
3. Secrets come from the private repo's env-sync tooling, not from anything in this repo.
