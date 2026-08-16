/* eslint-disable no-console */
/**
 * Renders today's meme reel — one concept-teaching meme per day, built from a
 * famous meme template plus a real question out of the app's own question bank.
 *
 * Two frames only: the generated meme (static hold), then the shared CTA outro.
 * No TTS, no narration — the joke and the concept both live inside the image.
 *
 * Flow:
 *   1. MEME_PAUSE check — second layer behind meme-bot.yml's job-level gate
 *   2. resolveVideoVertical(), with a weekend rotation (unlike the quiz reel,
 *      which skips Sat/Sun — weekends are peak social hours for memes)
 *   3. rankTopics() → a syllabus TOPIC ("Arithmetic"), least-recently-used first
 *   4. pickTemplate() weighted by meme_history approval + recency
 *   5. writeMemeScript() → a text model LOOKS at the template, picks the funniest
 *      trap inside the topic, and writes the exact captions — validated and
 *      retried before a paid image call happens
 *   6. generateMemeImage() → places that exact text, written into public/ BEFORE
 *      bundle() so staticFile() can serve it (same ordering constraint the quiz
 *      reel has with its TTS clips)
 *   7. render → metadata → publish OR send to Discord → log to meme_history.json
 *
 * Steps 5 and 6 are split on purpose: image models are renderers, not comedy
 * writers, and one call doing both produced typos and captions that didn't fit
 * the layout. See src/memeScript.ts.
 *
 * Step 3 is a topic, not a question, also on purpose — a random MCQ is usually
 * unmemeable ("Which of these is Nijvachak Sarvanam?") and forcing a joke onto it
 * capped the whole bucket's quality. See src/memeTopics.ts.
 *
 * There is NO degraded mode. If the script or the image fails, this exits 0
 * without rendering: a meme with wrong or misspelled text is worse than no post.
 *
 * Env:
 *   FIREBASE_SERVICE_ACCOUNT   service-account JSON (same as the other entrypoints)
 *   VIDEO_VERTICAL             override the day-based rotation
 *   MEME_TEMPLATE              override the template pick (template id) — for testing
 *   MEME_TOPIC                 override the topic pick (syllabus topic id or title) — for testing
 *   MEME_IMAGE_PROVIDER        puter (default) | gemini — see src/memeImage.ts
 *   PUTER_AUTH_TOKEN           puter.com/dashboard#account → Create token
 *   GEMINI_API_KEYS            REQUIRED — writes the meme script (src/memeScript.ts),
 *                              and also backs the gemini image provider fallback
 *   MEME_PAUSE                 'true' to skip the run entirely (result days, controversies)
 *   MEME_PUBLISH               THE only publish switch for this bucket.
 *                                false → stage to Cloudinary + post to Discord with
 *                                        Approve/Reject buttons
 *                                true  → publish to YouTube + Instagram immediately,
 *                                        then post a "published" card to Discord
 *                              Independent of the shared PUBLISH env the quiz/news
 *                              reels use — those are already live and this bucket's
 *                              decision is its own.
 *   DISCORD_BOT_TOKEN / DISCORD_MEME_CHANNEL_ID   the approval + notification channel
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { resolveVideoVertical, type Vertical } from './fetchContent';
import { buildMemeMetadata } from './metadata';
import { generateMemeImage } from './memeImage';
import { fetchTemplateImage, writeMemeScript } from './memeScript';
import { rankTemplates, templateById, type MemeTemplate } from './memeTemplates';
import { examLabelForTopic, rankTopics } from './memeTopics';
import { appendRecord, readHistory, templateStats, topicUsage, usedMisconceptions } from './memeHistory';
import { notifyPublished, stageForApproval } from './memeApproval';
import type { MemeCardProps } from './MemeCard';
import { audioFlags, flagUploadFailureForCI, OUTPUT_DIR, PUBLIC_DIR, publish, renderComposition, renderCoverStill } from './renderShared';

const VERTICAL_ROTATION: Vertical[] = ['engineering', 'govt', 'college', 'entrance', 'schooling'];

/** Appends -2, -3… when a run already used this slug today, so every generation
 * gets its own history row AND its own image file. */
function uniqueSlug(base: string): string {
  const taken = new Set(readHistory().map((r) => r.id));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** The quiz reel skips Sat/Sun; memes don't — weekends are peak social hours.
 * Falls back to a day-of-month rotation so the weekend slots still vary. */
function resolveMemeVertical(): Vertical {
  const scheduled = resolveVideoVertical();
  if (scheduled) return scheduled;
  const istDate = new Date(Date.now() + 5.5 * 3600_000).getUTCDate();
  return VERTICAL_ROTATION[istDate % VERTICAL_ROTATION.length];
}

async function main() {
  if (process.env.MEME_PAUSE === 'true') {
    console.log('[meme-bot] MEME_PAUSE=true — skipping today\'s meme. Exiting.');
    return;
  }

  // MEME_PUBLISH is the only switch. It deliberately ignores the shared PUBLISH
  // env the quiz/news reels use — this bucket's publish decision is its own.
  const memePublish = process.env.MEME_PUBLISH === 'true';
  const vertical = resolveMemeVertical();
  console.log(`[meme-bot] Vertical: ${vertical}. MEME_PUBLISH=${memePublish} → ${memePublish ? 'publish to YouTube + Instagram' : 'send to Discord for approval'}`);

  const forcedTemplate = (process.env.MEME_TEMPLATE || '').trim();
  const forced = forcedTemplate ? templateById(forcedTemplate) : undefined;
  // A forced id is a testing instruction, so it's honoured exactly — no falling
  // through to a different template behind your back.
  const candidates = forced ? [forced] : rankTemplates(vertical, templateStats());
  if (candidates.length === 0) {
    console.warn(
      forcedTemplate
        ? `[meme-bot] MEME_TEMPLATE="${forcedTemplate}" not found in the bank. Exiting.`
        : `[meme-bot] No approved template fits "${vertical}". Run \`npm run templates:refresh\`, approve some, then retry. Exiting.`,
    );
    return;
  }

  // The subject is a syllabus TOPIC, not a specific question — the writer picks
  // the funniest trap inside it. See src/memeTopics.ts for why the old
  // one-random-MCQ draw capped quality.
  const forcedTopic = (process.env.MEME_TOPIC || '').trim();
  const ranked = rankTopics(vertical, topicUsage());
  const topic = forcedTopic ? ranked.find((t) => t.topicId === forcedTopic || t.title.toLowerCase() === forcedTopic.toLowerCase()) : ranked[0];
  if (!topic) {
    console.warn(
      forcedTopic
        ? `[meme-bot] MEME_TOPIC="${forcedTopic}" is not a topic in "${vertical}". Exiting.`
        : `[meme-bot] No syllabus topics found for "${vertical}". Exiting.`,
    );
    return;
  }
  const examLabel = examLabelForTopic(topic, vertical);
  console.log(`[meme-bot] Topic: ${topic.title} (${topic.topicId}, ${topic.importance}) — ${examLabel}`);

  // The art is fetched once and shared by both stages: the writer needs to SEE the
  // layout to know how many captions it can carry, and the gemini image provider
  // needs the same bytes inline. Never written to disk.
  //
  // Walking candidates because memes.co.in's media host times out on roughly half
  // of requests (see rankTemplates). Capped at 4 so a host-wide outage fails in
  // ~9 min rather than grinding through the whole bank.
  let template: MemeTemplate | undefined;
  let templateImage: { base64: string; mime: string } | undefined;
  for (const candidate of candidates.slice(0, 4)) {
    console.log(`[meme-bot] Template: ${candidate.name} (${candidate.id})${candidate.riskNote ? ` — ⚠ ${candidate.riskNote}` : ''}`);
    try {
      templateImage = await fetchTemplateImage(candidate.sourceUrl);
      template = candidate;
      break;
    } catch (e) {
      console.warn(`[meme-bot] ${(e as Error).message}`);
    }
  }
  if (!template || !templateImage) {
    console.warn('[meme-bot] No template art could be fetched — rendering nothing today.');
    return;
  }

  // Text first, and validated before any image call: a bad script costs a free
  // retry, a bad image costs money and a ruined post.
  const script = await writeMemeScript({
    template,
    templateImage,
    topic,
    examLabel,
    vertical,
    // Scoped to this topic: there are only so many famous traps in "Arithmetic",
    // and without this the model reaches for the same one every rotation.
    usedMisconceptions: usedMisconceptions(topic.topicId),
  });
  if (!script) {
    console.warn('[meme-bot] No usable meme script — rendering nothing today.');
    return;
  }

  const generated = await generateMemeImage({ template, script, templateImage });
  if (!generated) {
    // Deliberate: no fallback image, no partial post. Silence beats a bad meme.
    console.warn('[meme-bot] Image generation failed — rendering nothing today.');
    return;
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  // One meme/day means the plain slug is normally unique. Re-runs on the same
  // day (testing, or a retry after a bad generation) must NOT reuse it:
  // meme_history.json is keyed by id, and updateMemeRecord() patches the first
  // match — duplicates would leave later rows permanently unreviewable, all
  // pointing at whichever image was written last.
  const slug = uniqueSlug(`${today}-${vertical}-meme`);

  // Must land under public/ before bundle() copies it into the Remotion bundle —
  // staticFile() can only serve what was there at bundle time.
  const generatedDir = path.join(PUBLIC_DIR, 'memes', 'generated');
  mkdirSync(generatedDir, { recursive: true });
  const imageFile = path.posix.join('memes', 'generated', `${slug}.png`);
  writeFileSync(path.join(PUBLIC_DIR, imageFile), generated.buffer);
  console.log(`[meme-bot] Meme image written to public/${imageFile}`);

  console.log('[meme-bot] Bundling Remotion project...');
  const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });

  const { hasNewsBgm, hasOutro } = audioFlags();
  console.log(`[meme-bot] Audio available — bgm:${hasNewsBgm} outro:${hasOutro}`);

  // Sized off the caption text that's actually ON the image — the viewer reads the
  // meme, nothing else. (Before the script stage existed we had no way to know
  // what the model had written, so this was guessed from the source question.)
  const conceptWords = script.panels.map((p) => p.text).join(' ').trim().split(/\s+/).filter(Boolean).length;
  // Both labels now come straight from the syllabus entry, so neither can be a
  // coded slug — that's what used to render "ENTM MATRICES" on the chip.
  const renderProps: MemeCardProps = {
    vertical,
    imageFile,
    examLabel,
    topicLabel: topic.title,
    conceptWords,
    hasBgm: hasNewsBgm,
    hasOutro,
  };

  const outFile = await renderComposition(
    bundleLocation,
    'MemeCard',
    renderProps as unknown as Record<string, unknown>,
    path.join(OUTPUT_DIR, `${slug}.mp4`),
  );

  // Frame 30 (1s in) — the meme itself, settled. That's the whole hook, so it's
  // the right grid tile and YouTube thumbnail.
  const coverPath = await renderCoverStill(
    bundleLocation, 'MemeCard', renderProps as unknown as Record<string, unknown>, 30, outFile.replace(/\.mp4$/, '-cover.jpg'),
  );

  // The upload copy teases the trap, not the topic name — "markup and discount
  // don't cancel out" is a reason to watch; "Arithmetic" is not.
  const meta = buildMemeMetadata(vertical, template.name, `${topic.title} — ${script.misconception}`);
  writeFileSync(outFile.replace(/\.mp4$/, '.meta.json'), JSON.stringify(meta, null, 2));

  // Exactly two modes, no other conditions:
  //   MEME_PUBLISH=true  → publish to YouTube + Instagram, then say so in Discord
  //   MEME_PUBLISH=false → stage to Cloudinary + post to Discord with Approve/
  //                        Reject buttons; meme-publish.yml finishes the job once
  //                        a human decides (this run has already exited by then)
  let links: Awaited<ReturnType<typeof publish>> = {};
  if (memePublish) {
    links = await publish(outFile, meta, coverPath, true);
    flagUploadFailureForCI(links, true);
    await notifyPublished({
      id: slug,
      vertical,
      examLabel: renderProps.examLabel,
      topicLabel: renderProps.topicLabel,
      templateName: template.name,
      title: meta.youtube.title,
      ...links,
    });
  } else {
    await stageForApproval({
      id: slug,
      videoPath: outFile,
      coverPath,
      meta,
      vertical,
      examLabel: renderProps.examLabel,
      topicLabel: renderProps.topicLabel,
      templateId: template.id,
      templateName: template.name,
      riskNote: template.riskNote,
      mechanic: script.mechanic,
      fact: script.fact,
    });
    console.log('[meme-bot] Awaiting Approve/Reject in Discord — nothing is published until then.');
  }

  appendRecord({
    id: slug,
    runAt: new Date().toISOString(),
    templateId: template.id,
    templateName: template.name,
    vertical,
    topicId: topic.topicId,
    examLabel: renderProps.examLabel,
    topicLabel: renderProps.topicLabel,
    imagePath: `public/${imageFile}`,
    prompt: generated.prompt,
    provider: generated.provider,
    captions: script.panels.map((p) => p.text),
    misconception: script.misconception,
    mechanic: script.mechanic,
    fact: script.fact,
    approved: null,
    ...links,
  });

  console.log('[meme-bot] Done.');
}

main().catch((e) => {
  console.error('[meme-bot] Fatal:', e);
  process.exit(1);
});
