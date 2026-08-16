# Aspirant Arcade — Video Bot (Reels / Shorts)

Remotion pipeline with three independent entrypoints. Part of `marketing/PLAN.md` §4.3 / Phase 3.

| Entrypoint | Renders | Triggered by |
|---|---|---|
| `npm run render` (`src/render.ts`) | `QuizCard` only | `video-bot.yml`'s own daily schedule |
| `npm run render:news` (`src/renderNewsRecap.ts`) | `NewsRecap` only, for one specific article | `scripts/blog_bot.ts`, directly, right after it publishes that article |
| `npm run meme` (`src/renderMeme.ts`) | `MemeCard` only | `meme-bot.yml`'s own daily schedule (8:30 PM IST) |

These aren't on the same schedule and don't poll each other. `NewsRecap` used to
render on its own cron by asking Firestore "did the blog bot publish anything
for this vertical today?" — now `blog_bot.ts` already knows the article's
content the moment it writes it (same Gemini call), so it just calls
`renderNewsRecap.ts` directly with that content in env vars instead. Nothing
video-related gets persisted in Firestore anymore (no `videoBeats`/`videoMeta`
fields on the article doc) since nothing needs to read them back out.

**Auto-publish is built but off by default.** Set `PUBLISH=true` (env var, or
either workflow's manual-trigger input) once the credentials below are set up —
until then every run only renders and uploads a workflow artifact, same as
before. The plan's original sequencing recommended a 2-3 week manual-posting
validation window before flipping this on; that's your call to make.

---

## What it renders

| Composition | Content | Duration |
|---|---|---|
| `QuizCard` | Hook line → question → 3-2-1 countdown → "pause & comment" card → answer reveal (confetti) → CTA | **dynamic, ~16-25s** |
| `NewsRecap` | Hook line + headline → 1-3 highlight beats → CTA | **dynamic, ~9-20s** |
| `MemeCard` | AI-generated meme (static hold) → CTA | **dynamic, ~6-8s** |

Both durations are content-driven. For `NewsRecap`, `blog_bot.ts` decides *what*
highlights a news item deserves (1-3 beats, see `VIDEO_BEATS_INSTRUCTION`) and
each beat is sized off its text length (~2.5 words/sec, clamped 2.5-6s/beat) —
and when narration exists, off the actual voiceover length, whichever is longer.
`QuizCard` works the same way per scene (`quizTimeline()` in `src/QuizCard.tsx`).
The CTA outro is a fixed 2s (`CTA_OUTRO_SECONDS` in `src/Brand.tsx`).

**Voiceover (`src/tts.ts`):** every render tries to synthesize narration clips
with Microsoft Edge's free TTS (`en-IN-NeerjaNeural`, override with `TTS_VOICE`)
before bundling; scenes stretch to fit the audio. Fully best-effort — offline or
failing TTS just renders the old silent version.

**Hook lines:** the first ~1.5s pattern interrupt. `NewsRecap` gets it from
Gemini via `videoMeta.hookLine` (blog bot prompt); `QuizCard` gets it from its
own Gemini call (`src/quizContent.ts`, needs `GEMINI_API_KEYS`) with a fixed
per-vertical fallback pool in `src/metadata.ts`.

`QuizCard` pulls its question from the `question_bank` collection the app
itself uses. `NewsRecap` gets its headline/beats/metadata passed in directly by
`blog_bot.ts` — it doesn't touch Firestore for content at all (Cloudinary is
used instead, only if `PUBLISH=true` and Instagram is configured, purely as a
temporary fetch source for Meta's servers — see "Publishing" below).

Both end on the same 4s CTA outro (`CTAOutro` in `src/Brand.tsx`): headline,
a pill row showing all 5 exam verticals the app covers (not just today's
topic), then two CTAs — "Download the app" and "Subscribe for daily questions".

## Audio (optional)

Every `<Audio>` usage is gated behind a `has*` boolean that `audioFlags()` in
`src/renderShared.ts` sets by checking whether the file actually exists in
`public/audio/` — a render never fails just because audio hasn't been added
yet, it just renders silent.

| File | Used for | Ideal length |
|---|---|---|
| `public/audio/quiz.mp3` | `QuizCard` background bed, volume 0.35, plays once (no loop — goes quiet if shorter than 13s) | Any |
| `public/audio/bgm.mp3` | `NewsRecap` background bed, looped, volume 0.35 | Any (loops) |
| `public/audio/tick.mp3` | Plays once across the full 3s countdown beat (not one-shot per second) | ~3s |
| `public/audio/reveal.mp3` | One-shot chime when the correct answer is revealed | ≤1s |
| `public/audio/outro.mp3` | Plays once at the start of the CTA outro — shared by both `QuizCard` and `NewsRecap` (lives in `CTAOutro`, `src/Brand.tsx`) | ≤4s (outro beat length) |

`quiz.mp3` and `bgm.mp3` are separate tracks on purpose — different vibe for
"solve this" vs "here's the news."

None of these ship in the repo — pick your own royalty-free tracks (e.g.
YouTube Audio Library, Pixabay Audio, Mixkit — check the license terms of
whichever you use) and drop them at those paths. Both entrypoints pick them up
automatically once present; no code changes needed.

## MemeCard — the daily concept meme

One meme per day: a famous meme template recaptioned around a **syllabus topic**,
then a **2-frame** video (meme hold → the shared `CTAOutro`). No TTS — the joke and
the concept both live inside the image, so there is nothing to narrate.

```bash
npm run meme                # generate + render + publish OR send to Discord
npm run meme:test           # re-render the last generated meme locally — no API calls, no posting
npm run templates:refresh   # pull new templates from memes.co.in
```

`npm run meme` is the only command that generates or publishes anything. There is
no review command — approval happens through the Discord buttons.
(`npm run meme:publish` exists but is invoked by `meme-publish.yml` after a button
press, not by hand.)

### The subject is a topic, not a question

`src/memeTopics.ts` picks a syllabus topic — "Arithmetic", "Kinematics", "Matter in
Our Surroundings" — and the writer chooses the funniest trap *inside* it.

It used to draw one random MCQ from `question_bank` and force a joke onto that
exact question. **That was the ceiling on quality.** Most questions aren't
memeable: *"Which of these is Nijvachak Sarvanam?"* is classification recall — no
shared failure, no emotional charge, no joke in there at all. The writer returned
the best meme obtainable from an unmemeable input, which is still a bad meme.

Give it "Arithmetic" instead and it can reach for the trap everyone has actually
been burned by — markup and discount not cancelling, percentage points vs percent.
It already knows which ones those are; the old design forbade it from choosing.

Topics come from the app's own syllabus config (`frontend/src/config/syllabus/`,
**1,172** topics across the five verticals) rather than being invented, so the
topic chip stays truthful and coverage rotates instead of drifting to whatever the
model finds easy. That config is plain data — types and arrays, no React, no
Firebase — so the cross-package import costs nothing at runtime. `memeTopics.ts` is
Node-only and never reaches a composition, same rule as `memeHistory.ts`.

Two consequences worth knowing:

- **Nothing verifies the fact any more.** The subject is no longer a pre-verified
  question, so the model supplies the claim itself. It must return `fact` — one
  plain sentence, no joke, no Hinglish — which is shown on the Discord card under
  **✅ Check this claim** and printed in the Actions log. Read that line before
  clicking Approve; the punchline is compressed Hinglish and checking it means
  decoding the joke first. Model knowledge is solid on famous traps and thinner on
  niche exam-specific material, which is exactly where this earns its keep.
- **`usedMisconceptions(topicId)` is fed back in.** There are only so many famous
  traps per topic, and without it the model returns its single favourite every
  time that topic comes round.

`MEME_TOPIC` overrides the pick (topic id or title) for testing.

### Two AI stages, not one

The generation step is split, and this is the second thing to know about the
bucket:

| Stage | File | Model | Job |
|---|---|---|---|
| **1. Write** | `src/memeScript.ts` | `gemini-2.5-flash` (multimodal) | Looks at the template art, picks the trap, writes the exact captions |
| **2. Render** | `src/memeImage.ts` | `gpt-image-2` via Puter | Typesets those exact strings onto the template |

It started as one call that did both, and that was the bug. Image models are
renderers, not comedy writers: asking one to invent the joke *and* spell it
produced typos (`DOT BINA?`, `JOH`), three captions crammed onto a one-character
template, and jokes that were "studying is hard" with a fact bolted on. The ~98.5%
text accuracy `gpt-image-2` is picked for is accuracy at rendering text you *hand*
it — which is now all it's asked to do.

What the split buys:

- **Nothing to misspell that we didn't supply.** Stage 2's prompt is a placement
  instruction: *"copy it character for character, including the Hinglish spellings
  — they are intentional."*
- **The writer can SEE the template**, so structure comes from the picture rather
  than from `conceptShape` (which is Gemini-drafted prose saying roughly
  "illustrates a misconception" for all 34 entries, and carries no panel count).
  Two men talking gets two lines; a single reaction character gets one.
- **The text is validated before a paid image call.** `validateScript()` enforces
  the word budget (22 total, 10 per panel), requires `fact`, and rejects Devanagari,
  label words (`Question:`, `Tip:`), competitor names, and the plain `fact`
  sentence being pasted onto the image. A failure is fed back and retried up to 3×
  — a bad script costs a ~free text call instead of an image credit and a ruined
  post.
- **The joke aims at a misconception, never at the topic broadly.** "Do not try to
  cover the topic — pick the ONE thing inside it that aspirants most reliably get
  wrong." Comedy and confusion live in the same spot.

The rule that took the most iterating: **the punchline must carry the correct
answer.** Early output only *negated* the misconception ("yahi soch ke marks gaye"),
which reads as a joke but leaves the viewer knowing their instinct was wrong and
still not knowing what's right. The prompt now demands the right answer land inside
the punchline, and `mechanic` (max 15 words, shown on the Discord card as
**Intended joke**) makes the model name which words do it.

`meme_history.json` stores `topicId`, `captions`, `misconception`, `fact`, and
`mechanic` alongside the image, so a reject is attributable: captions that read well
with a botched picture is a render problem (switch provider); weak captions is a
writer-prompt problem; a wrong `fact` is a topic the model shouldn't be trusted on.

### Frame 1 chrome

All drawn by `MemeCard.tsx` rather than asked of the image model — the model gets no
say over spelling or placement, and stage 2 explicitly forbids it adding any text
beyond what it was handed:

- **Exam chip** (solid gold) pinned top-**left**, **topic chip** (outlined) top-**right**.
  Pinned to opposite corners rather than centred so a long topic name can't push
  the exam off, and the two read as separate facts.
- **Logo + wordmark** bottom-right, using the real `public/logo.png`.
- **Background is ink + the shared `AnimatedBackground`** — same backdrop as
  `QuizCard` and `NewsRecap`. Generated memes come back square, so the letterbox
  bars are a large part of a 1080×1920 frame; filling them with the house
  background keeps the meme reel of a piece with the other two. The drift only ever
  shows in those bars — the meme image itself sits on top and stays completely
  static, which is what lets it read as a real screenshot.
- **Hold length is sized off the caption word count**, not the source question —
  the viewer reads the meme, and the question never appears on screen.

The topic chip uses `payload.topicTitle` from the question doc ("Matrices &
Determinants"), which `scripts/seed_questions.ts` already writes. It does **not**
title-case `topicId` — those are coded slugs (`entm_matrices`,
`clgimaging_digital`) and rendering them produced garbage like "ENTM MATRICES".

### `MEME_PUBLISH` — the only switch

Two branches, no other conditions:

**`MEME_PUBLISH=false` (default) — Discord approval**

```
meme-bot.yml (8:30 PM IST)
  render → upload mp4+cover to Cloudinary → post to #meme-approvals
           with Approve / Typo / Not funny / Wrong concept buttons
  ↓  (human clicks a button)
website/app/api/discord/interactions
  records the decision in Firestore `meme_approvals/<id>`
  → dispatches meme-publish.yml with the meme id
  ↓
meme-publish.yml → src/publishApproved.ts
  approved → download staged mp4 → YouTube + Instagram → "published" card in Discord
  rejected → delete Cloudinary copy only, exit 0
  (either way the staged copy is deleted)
```

**`MEME_PUBLISH=true` — publish immediately**

```
meme-bot.yml → render → YouTube + Instagram → "published" card in Discord
```

No approval step, no Cloudinary staging. The published card is green when both
platforms took it, amber when only one did.

A `workflow_dispatch` `publish` input overrides the repo variable for a single
run, so you can push one meme live without changing the default.

Notes on why it is shaped this way:

- **The card is posted by the BOT, not a webhook.** A channel webhook returns
  **200 and then silently strips `components`** — interactive buttons only exist on
  an application-owned message, because a button needs an app to route the
  interaction to. Verified empirically; the response comes back with
  `"components": []` and no error at all. Needs `DISCORD_BOT_TOKEN` +
  `DISCORD_MEME_CHANNEL_ID` (a numeric channel id — **not** a webhook URL;
  `requireChannelId()` rejects one with a pointed message, because that mistake
  otherwise surfaces only as a bare `404: Not Found`).
  This is the same trap that left `frontend/functions`' support "Resolve" button
  non-functional; `postDiscord()` there now warns when components get stripped,
  and `postDiscordAsBot()` is the fix.
- **Firestore holds the decision, not `meme_history.json`.** The website handles
  the button press and can reach Firestore but not the repo.
  `publishApproved.ts` reconciles `meme_history.json` afterwards.
- **The decision travels in Firestore, not in the workflow inputs.** A replay of
  `meme-publish.yml` can therefore never publish something that was rejected.
- **Cloudinary is always cleaned up**, approve or reject. Credentials live only in
  the workflow; the website never needs them.
- **Reject reasons are buttons, not free text** — Discord components can't collect
  text, and three fixed reasons are what make the log diagnostic (see below).
- **The buttons disappear once a decision lands.** The interaction replies with
  `UPDATE_MESSAGE` (type 7) and `components: []`, which edits the original card in
  place: the four buttons are replaced by the status line, embed untouched. Not
  just tidiness — Discord has no per-button permissions, so anyone who can see the
  card can click it, and a second click would re-dispatch `meme-publish.yml`. Error
  paths deliberately keep the buttons and reply ephemerally instead, so a failed
  decision can be retried rather than stranded.
- **`publishApproved.ts` has no publish gate.** Clicking Approve *is* the
  decision; a second switch there would silently swallow an explicit human
  approval.

### Why the caption is baked into the image

There is no Remotion text overlay on the meme itself. The caption is part of the
picture, which is the only way to get something that reads as a real meme rather
than a branded card — but it means a typo or a misfired joke **cannot be fixed
downstream**. Three consequences, all deliberate:

1. **The text is written and validated before the image exists** (stage 1 above).
   That's the only place a caption can still be corrected for free.
2. **No degraded mode.** If either stage fails, `renderMeme.ts` exits 0 and renders
   nothing. Silence beats a bad meme.
3. **`MEME_PUBLISH` is the single switch** — see below. It ignores the shared
   `PUBLISH` env the quiz/news reels use, so this bucket's decision is its own.

### The template bank

`meme_templates.json` — scraped by `scripts/refreshTemplates.ts` from
memes.co.in's public API (`https://api.memes.co.in/api/meme-templates`, no auth,
DRF-paginated, ~9,900 templates, updated daily). Chosen over memedownload.in on
two counts: memes.co.in states its templates are *"copyright free… for personal
or commercial projects"*, and its feed is current — memedownload.in's newest post
was ~6 weeks old when this was built.

**Template images are never stored.** Each entry keeps a `sourceUrl`, nothing
more. Only one template is used per day, so vendoring the bank meant carrying
megabytes to serve a single daily read. The scraper HEAD-checks each URL so dead
links stay out of the bank; at render time the Puter provider hands the URL
straight to the API (it fetches server-side, so we download nothing at all),
and the Gemini provider fetches it in memory because it needs the bytes inline.

Tradeoff: if the host 404s or is down, that day's meme fails. That costs nothing
— this bucket has no degraded mode anyway, so a failure already exits 0 and posts
nothing.

Every scraped entry lands `approved: false` and is invisible to `renderMeme.ts`
until a human reviews it. That gate is doing two jobs:

- **India-relevance.** The feed's newest pages skew global (Shrek, Palworld,
  Bluey all sit under "Memes"), with Indian formats like Panchayat scattered
  thinly among them. No category field separates those. Use
  `npm run templates:refresh -- --match panchayat` when you know what you want.
- **Copyright.** Entries whose title looks like a film/TV still get a `riskNote`
  automatically — that's the highest-enforcement category, and memes publish to
  the *same* YouTube channel as QuizCard and NewsRecap, so a claim there damages
  the whole pipeline. Consider running those Instagram-only.

`conceptShape` is a **hint, not a spec.** It's passed to the script writer as an
editorial note and the prompt tells the model the picture overrules it — because
Gemini's drafts all converge on the same sentence ("illustrates a common
misconception / expectation-versus-reality gap") for every entry, and none of them
say how many text slots the layout has or who speaks. Sharpen it during approval if
you like; structure now comes from the writer actually seeing the art. A run
without `GEMINI_API_KEYS` leaves a TODO stub and the next run backfills it.

### Image provider

`MEME_IMAGE_PROVIDER` selects who renders stage 2. Note `GEMINI_API_KEYS` is
**required either way** — stage 1 always runs on Gemini.

| Value | Model | Cost | Notes |
|---|---|---|---|
| `puter` (default) | `gpt-image-2` via `puter.ai.txt2img({ input_image })` | **$0** within the account's free monthly allowance | Needs `PUTER_AUTH_TOKEN` from `puter.com/dashboard#account`. Works headless in Node — but the return shape is undocumented (`txt2img` gives an `HTMLImageElement` in the browser), so `unwrapImage()` accepts several forms |
| `gemini` | `gemini-2.5-flash-image` | ~`$0.039`/image ≈ **$3.50/mo** | Reuses the same key ring. **No Google image model has a free tier** |

Switch to `gemini` if `meme_history.json` shows `text-error` rejections piling up
— gpt-image-2 benchmarks ~98.5% on text vs Nano Banana 2's ~91.2%, and
Roman-Hinglish is out-of-distribution for both. Since the split, a `text-error`
means the renderer mangled text it was *handed*, so compare the row's `captions`
against the image before blaming the provider.

### Kill switch

`MEME_PAUSE=true` skips the run — set it as a GitHub repo *variable* so
`meme-bot.yml` gates the job before burning Actions minutes, and it's re-read
inside `renderMeme.ts` so local runs respect it too. Flip it on result days, exam
controversies, or any national tragedy window.

### Instagram is posted by hand

No API exposes trending audio: Meta's REELS container documents no music
parameter, and audio pre-baked into a YouTube upload loses its claim-free status
because YouTube can't verify provenance. At 1/day, posting manually costs ~2 min
and buys the trending-audio reach lever. YouTube auto-publishes; the workflow
artifact is the Instagram copy.

## Vertical rotation (QuizCard only)

`resolveVideoVertical()` in `src/fetchContent.ts` matches the "Reel/Short
vertical" column in `marketing/PLAN.md` §5:

| Day (IST) | Vertical |
|---|---|
| Mon | Engineering |
| Tue | Govt |
| Wed | College |
| Thu | Entrance |
| Fri | Schooling |
| Sat/Sun | — (no scheduled reel) |

Override with `VIDEO_VERTICAL=entrance` (etc.) for a manual/test run.
`NewsRecap` has no rotation — it renders once per article, whatever vertical
that article happens to be in, whenever `blog_bot.ts` publishes one.

## Setup

```bash
cd marketing/video
npm install
```

Env (put in `.env` locally, or GitHub secrets in CI):

```
FIREBASE_SERVICE_ACCOUNT=<service account JSON, single line>
# or, if running with a local file instead:
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

Only actually needed by `render.ts` (reads `question_bank`) and by
`renderNewsRecap.ts` when `PUBLISH=true` and Instagram is configured (Storage
staging). Same service account already used by `scripts/blog_bot.ts` works here.

## Local preview (no Firestore needed)

```bash
npm run preview
```

Opens Remotion Studio with both compositions using placeholder `defaultProps`
(`src/Root.tsx`) — use this to iterate on the visual design without touching
real data.

## Render today's quiz reel

```bash
npm run render
```

Outputs to `marketing/video/output/YYYY-MM-DD-<vertical>-quiz.mp4` (gitignored
— pull these down and post manually if `PUBLISH` is off).

## Render a NewsRecap for one article

Normally only ever invoked by `scripts/blog_bot.ts` (see `triggerNewsRecapVideo()`
there), but can be run standalone for testing:

```bash
cd marketing/video
NEWS_RECAP_VERTICAL=govt \
NEWS_RECAP_HEADLINE="IBPS PO Notification 2026 Out for 6715 Vacancies" \
NEWS_RECAP_BEATS_JSON='[{"label":"VACANCIES","text":"6715 posts open"},{"label":"DEADLINE","text":"Apply by 20 July"}]' \
npm run render:news
```

`NEWS_RECAP_META_JSON` is optional (Gemini-authored YouTube/Instagram upload
copy — see "Publishing" below); omit it to fall back to deterministic metadata.

## Quiz question selection

`fetchRandomQuestion()` in `src/fetchContent.ts` picks a **random exam from the
day's vertical** (`VERTICAL_TO_EXAM_IDS`, mirroring
`frontend/src/config/categories.ts` + `psus.ts`) and rand-cursor-draws a
question with that `sourceExamId` — the ids match because
`scripts/seed_questions.ts` writes `sourceExamId` from the same config. Fallback
chain: other exams in the vertical → whole bank → an index-free scan, so a thin
pool or an undeployed Firestore index never costs a render. The exam-filtered
and whole-bank queries need composite indexes declared in
`frontend/firestore.indexes.json` — deploy them with
`firebase deploy --only firestore:indexes` (from `frontend/`).

## Publishing to YouTube Shorts + Instagram Reels

Every render also builds platform-appropriate metadata (`src/metadata.ts`).
For `NewsRecap`, it prefers Gemini's own news-specific upload copy — `scripts/blog_bot.ts`
asks for a `videoMeta` field (`youtubeTitle`, `youtubeDescription`, `youtubeTags`,
`instagramCaption`, `instagramHashtags`) alongside every article it writes, tailored
to that specific news rather than generic per-vertical tags, and hands it straight
to `renderNewsRecap.ts` via `NEWS_RECAP_META_JSON` — falling back to fixed
per-vertical hashtag sets only if that field is missing. `QuizCard` gets the
same treatment from its own Gemini call (`src/quizContent.ts`, grounded in the
actual question + exam; deterministic fallback with rotating title formulas
when Gemini is unavailable). Both platforms also get a standard link block
(blog url for news, website, Telegram) appended after the copy — see
`linkBlock()` in `src/metadata.ts`. Either way, a title/description sized to
each platform's limits and a `#Shorts` hint on YouTube get added. Metadata is always written alongside the
video as a `.meta.json` file in `output/`, whether or not `PUBLISH` is on.

**YouTube Shorts setup** (`src/publishYouTube.ts`):
1. Reuses the same OAuth *client* as `marketing/youtube/` (`client_secret.json`) — but needs a **fresh token** with the `youtube.upload` scope, authorized against whichever Google account should own the Aspirant Arcade **brand channel** (not one of the comment-bot persona accounts — those are meant to look like individual students, not the official channel).
2. One-time locally:
   ```bash
   cd marketing/video
   cp ../youtube/client_secret.json .
   npm run auth:youtube-upload
   ```
   Opens a browser consent URL, writes `youtube_upload_token.json`.
3. Add secrets: `YT_CLIENT_SECRET` (same value as the comment bots), `YT_UPLOAD_TOKEN` (contents of the new token file). Both `video-bot.yml` and `blog-bot.yml` need these — the latter writes them into `marketing/video/` before running the blog bot, since that's what actually invokes `renderNewsRecap.ts`.

**Instagram Reels setup** (`src/publishInstagram.ts`):
1. The Graph API's Reels endpoint needs a public `video_url` (it fetches the file itself, no raw upload) — this stages the rendered MP4 to **Cloudinary** first (the same account already used elsewhere in this project — see `backend/src/index.js`'s `/cloudinarySignature` route), gets back a `secure_url`, then deletes the staged copy once Instagram's done fetching it.
2. Needs, one-time, in Meta for Developers: an app with the Instagram Graph API product, an Instagram **Business** account linked to a Facebook Page you manage, and a long-lived Page access token with `instagram_content_publish` + `pages_read_engagement`.
3. Add secrets: `IG_BUSINESS_ACCOUNT_ID`, `IG_ACCESS_TOKEN`, plus the existing `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` (same ones `backend/` already uses — no new account, no Firebase Storage/Blaze plan needed).

**Going live:** once both are wired, set `PUBLISH=true` (repo variable, or pass `publish: true` on a manual `workflow_dispatch` run — both workflows have this input now). Each platform uploads independently — one failing (e.g. Instagram token expired) logs an error but doesn't block the other or fail the whole run; the artifact upload always still happens as a backup.
