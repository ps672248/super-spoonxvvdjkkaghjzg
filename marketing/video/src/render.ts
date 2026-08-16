/* eslint-disable no-console */
/**
 * Renders today's daily quiz-card reel to marketing/video/output/ as an MP4,
 * and — only when PUBLISH=true — uploads it to YouTube Shorts and Instagram
 * Reels with platform-appropriate title/description/hashtags (see src/metadata.ts).
 *
 * Per render this now also (all best-effort except question generation, which
 * is required — see GEMINI_API_KEYS below):
 *   1. generates a fresh question for a random exam in the day's vertical —
 *      never draws an existing one from question_bank (fetchContent.ts's
 *      generateQuestionForExam; still persisted back to the bank there, so
 *      the pool grows over time, but this render never waits on it already
 *      having one),
 *   2. asks Gemini for a hook line + upload copy grounded in that question (quizContent.ts),
 *   3. synthesizes voiceover clips with Edge TTS (tts.ts) — BEFORE bundle(), so the
 *      MP3s land in public/ and are served to the composition via staticFile().
 * Scene lengths stretch to fit the narration — see QuizCard.tsx quizTimeline().
 *
 * PUBLISH defaults to unset/false: a render always happens and is always saved
 * locally/as a workflow artifact, but nothing posts anywhere until this is
 * explicitly turned on — flip it on once you've set up the credentials below
 * and are ready to go live (see marketing/video/README.md).
 *
 * Env:
 *   FIREBASE_SERVICE_ACCOUNT   service-account JSON (or GOOGLE_APPLICATION_CREDENTIALS file path) — only for persisting the generated question back to question_bank; the render still completes without it
 *   VIDEO_VERTICAL             override the day-based rotation (engineering|entrance|govt|college|schooling)
 *   GEMINI_API_KEYS            required — comma-separated; generates the question itself, plus the hook/upload copy (same secret as blog bot)
 *   TTS_VOICE                  optional — Edge TTS voice override (default en-IN-NeerjaNeural)
 *   SARVAM_API_KEY             optional — switches narration to Sarvam bulbul:v3 Hinglish voices
 *                              (lines Hinglish-ified via Gemini first; see src/hinglish.ts + src/tts.ts)
 *   PUBLISH                    'true' to upload to YouTube/Instagram after rendering (default: off)
 *   YT_CLIENT_SECRET / YT_UPLOAD_TOKEN   YouTube Shorts upload credentials (see src/publishYouTube.ts)
 *   IG_BUSINESS_ACCOUNT_ID / IG_ACCESS_TOKEN / CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET   Instagram Reels (see src/publishInstagram.ts)
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { examDisplayName, generateQuestionForExam, pickExamIdForVertical, resolveDayTarget, toQuizCardProps, type Vertical } from './fetchContent';
import { buildQuizMetadata, quizFallbackHook } from './metadata';
import { generateQuizVideoContent } from './quizContent';
import { hinglishEnabled, toHinglish } from './hinglish';
import { synthesizeNarration } from './tts';
import type { QuizNarration } from './QuizCard';
import { audioFlags, flagUploadFailureForCI, OUTPUT_DIR, publish, renderComposition, renderCoverStill } from './renderShared';

async function main() {
  const day = await resolveDayTarget();
  if (!day) {
    console.log('[video-bot] No reel scheduled today — set VIDEO_VERTICAL to force a run. Exiting.');
    return;
  }
  const { vertical, examId: targetExamId } = day;
  // Sunday's countdown pin targets one specific exam; every other day just
  // varies which exam within the vertical, same as the old bank-draw did.
  const examId = targetExamId || pickExamIdForVertical(vertical);
  const examName = day.examName || examDisplayName(examId);
  console.log(
    `[video-bot] Vertical: ${vertical}${targetExamId ? ` (targeting ${examName}, ${day.daysLeft}d to ${day.eventType})` : ` (${examName})`}. PUBLISH=${process.env.PUBLISH === 'true'}`,
  );

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);

  // Generates a fresh question every render rather than drawing an existing
  // one from question_bank — see fetchContent.ts's generateQuestionForExam.
  // Still persisted back to the bank there, so it also grows the pool over
  // time; this render just never waits on the bank already having one.
  console.log(`[video-bot] Generating a question for ${examName}...`);
  const generated = examId ? await generateQuestionForExam(examId, examName) : null;
  const quizProps = generated ? toQuizCardProps(vertical, generated) : null;
  if (!quizProps) {
    console.warn('[video-bot] Question generation failed — skipping QuizCard render.');
    return;
  }
  console.log(`[video-bot] Question exam: ${examDisplayName(quizProps.examId)}`);

  const gemini = await generateQuizVideoContent({ ...quizProps, vertical });
  const hookLine = gemini?.hookLine?.trim() || quizFallbackHook(vertical as Vertical);

  // Narration must exist on disk before bundle() below copies public/ into the bundle.
  const correctLetter = 'ABCD'[quizProps.correctIndex];
  const correctText = quizProps.options[quizProps.correctIndex];
  // Spoken lines only — on-screen text always stays English. With Sarvam TTS
  // active these become Hinglish: preferably from hinglishNarration piggybacked
  // on the quiz-content Gemini call above (zero extra requests), else one
  // toHinglish() fallback call (per-line fallback to English).
  // Devanagari in the fixed pause line steers tts.ts to the hi-IN voice.
  const PAUSE_LINE_HINGLISH = 'अभी pause करो, और अपना answer नीचे comment करो!';
  let spokenLines = [
    hookLine,
    quizProps.question,
    'Pause now, and comment your answer below!',
    `The answer is ${correctLetter} — ${correctText}. ${(quizProps.explanation || '').slice(0, 220)}`,
  ];
  if (hinglishEnabled()) {
    const hn = gemini?.hinglishNarration;
    if (hn?.hook && hn.question && hn.reveal) {
      spokenLines = [hn.hook, hn.question, PAUSE_LINE_HINGLISH, hn.reveal];
      console.log('[video-bot] Hinglish narration piggybacked on quiz-content call.');
    } else {
      const h = await toHinglish(spokenLines);
      spokenLines = spokenLines.map((line, i) => h[i] ?? line);
      console.log(`[video-bot] Hinglish narration (fallback call): ${h.map((x) => !!x).join(',')}`);
    }
  }
  const [nHook, nQuestion, nPause, nReveal] = await Promise.all([
    synthesizeNarration(spokenLines[0], 'quiz-hook'),
    synthesizeNarration(spokenLines[1], 'quiz-question'),
    synthesizeNarration(spokenLines[2], 'quiz-pause'),
    synthesizeNarration(spokenLines[3], 'quiz-reveal'),
  ]);
  const narration: QuizNarration = { hook: nHook, question: nQuestion, pause: nPause, reveal: nReveal };
  console.log(
    `[video-bot] Narration — hook:${!!nHook} question:${!!nQuestion} pause:${!!nPause} reveal:${!!nReveal}`,
  );

  console.log('[video-bot] Bundling Remotion project...');
  const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });

  const { hasQuizBgm, hasTick, hasReveal, hasOutro } = audioFlags();
  console.log(`[video-bot] Audio available — quizBgm:${hasQuizBgm} tick:${hasTick} reveal:${hasReveal} outro:${hasOutro}`);

  // "SSC CGL · 12 DAYS LEFT" beats "GOVT EXAMS" as a header when the day is
  // pinned to a real exam with a real date.
  const headerTag = day.examName && typeof day.daysLeft === 'number' && day.daysLeft >= 0
    ? `${day.examName} · ${day.daysLeft === 0 ? 'TODAY' : `${day.daysLeft} DAYS LEFT`}`.toUpperCase()
    : undefined;

  const quizRenderProps = { ...quizProps, hookLine, headerTag, narration, hasBgm: hasQuizBgm, hasTick, hasReveal, hasOutro };
  const outFile = await renderComposition(
    bundleLocation,
    'QuizCard',
    quizRenderProps,
    path.join(OUTPUT_DIR, `${today}-${targetExamId || vertical}-quiz.mp4`),
  );

  // Cover/thumbnail: the hook card at 1.5s — settled but pre-question, so the
  // grid tile teases without spoiling. Best-effort (undefined on failure).
  const coverPath = await renderCoverStill(
    bundleLocation, 'QuizCard', quizRenderProps, 45, outFile.replace(/\.mp4$/, '-cover.jpg'),
  );

  const meta = buildQuizMetadata(vertical as Vertical, quizProps.question, gemini);
  writeFileSync(outFile.replace(/\.mp4$/, '.meta.json'), JSON.stringify(meta, null, 2));
  const links = await publish(outFile, meta, coverPath);
  flagUploadFailureForCI(links);

  console.log('[video-bot] Done.');
}

main().catch((e) => {
  console.error('[video-bot] Fatal:', e);
  process.exit(1);
});
