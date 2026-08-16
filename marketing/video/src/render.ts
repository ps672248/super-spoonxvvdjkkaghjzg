/* eslint-disable no-console */
/**
 * Renders today's daily quiz-card reel to marketing/video/output/ as an MP4,
 * and — only when PUBLISH=true — uploads it to YouTube Shorts and Instagram
 * Reels with platform-appropriate title/description/hashtags (see src/metadata.ts).
 *
 * Per render this now also (all best-effort, silent fallbacks):
 *   1. picks the question from the day's vertical via sourceExamId (fetchContent.ts),
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
 *   FIREBASE_SERVICE_ACCOUNT   service-account JSON (or GOOGLE_APPLICATION_CREDENTIALS file path)
 *   VIDEO_VERTICAL             override the day-based rotation (engineering|entrance|govt|college|schooling)
 *   GEMINI_API_KEYS            optional — comma-separated, enables Gemini hook/upload copy (same secret as blog bot)
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
import { buildQuizCardProps, examDisplayName, generateQuestionForExam, resolveDayTarget, type Vertical } from './fetchContent';
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
  console.log(
    `[video-bot] Vertical: ${vertical}${targetExamId ? ` (targeting ${day.examName || targetExamId}, ${day.daysLeft}d to ${day.eventType})` : ''}. PUBLISH=${process.env.PUBLISH === 'true'}`,
  );

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);

  let quizProps = await buildQuizCardProps(vertical, targetExamId);
  if (!quizProps && targetExamId) {
    // The bank has nothing for this exam. Generate one rather than quietly
    // switching Sunday's reel to a different exam than the day's articles.
    console.warn(`[video-bot] No banked question for ${day.examName || targetExamId} — generating one.`);
    const generated = await generateQuestionForExam(targetExamId, day.examName || examDisplayName(targetExamId));
    if (generated) quizProps = await buildQuizCardProps(vertical, targetExamId) || null;
    if (!quizProps && generated) {
      // The freshly-written doc may not be visible to the rand-cursor query
      // yet; render straight from the in-memory copy.
      quizProps = {
        vertical,
        question: generated.question,
        options: generated.options,
        correctIndex: 'ABCD'.indexOf((generated.correct || 'A').toUpperCase()[0]) < 0 ? 0 : 'ABCD'.indexOf((generated.correct || 'A').toUpperCase()[0]),
        explanation: generated.explanation,
        examId: generated.examId,
        topicTitle: generated.topicTitle,
      };
    }
  }
  if (!quizProps) {
    console.warn('[video-bot] No question available — skipping QuizCard render.');
    return;
  }
  console.log(`[video-bot] Question exam: ${quizProps.examId ? examDisplayName(quizProps.examId) : '(unfiltered fallback)'}`);

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
