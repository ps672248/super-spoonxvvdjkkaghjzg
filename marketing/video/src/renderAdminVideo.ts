/* eslint-disable no-console */
/**
 * Renders an admin-panel-triggered news-recap reel and stages it to
 * Cloudinary for in-panel review — first half of the admin video pipeline
 * (see src/adminVideoApproval.ts for the full state-machine diagram).
 *
 * Unlike src/renderNewsRecap.ts (the auto-bot path, which renders AND
 * publishes in one run with content passed via env vars), this reads the
 * article's videoBeats/videoMeta straight out of Firestore — the admin may
 * have hand-edited them in the review UI — and never calls YouTube/Instagram
 * itself; src/publishAdminVideo.ts does that after a human approves.
 *
 * Usage:  ARTICLE_SLUG=some-article-slug npm run admin-video:render
 *
 * Env:
 *   ARTICLE_SLUG              which articles/{slug} doc to render (required)
 *   FIREBASE_SERVICE_ACCOUNT  Firestore access
 *   CLOUDINARY_*              staging destination — see src/adminVideoApproval.ts
 *   SARVAM_API_KEY            optional — Hinglish narration, same as renderNewsRecap.ts
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import type { Vertical } from './fetchContent';
import { resolveBeats, type NewsNarration } from './NewsRecap';
import { hinglishEnabled, toHinglish } from './hinglish';
import { synthesizeNarration } from './tts';
import { audioFlags, OUTPUT_DIR, renderComposition, renderCoverStill } from './renderShared';
import { readArticle, stageAdminVideo, updateArticleVideo } from './adminVideoApproval';

async function fail(slug: string, message: string): Promise<never> {
  console.error(`[admin-video-render] ${message}`);
  await updateArticleVideo(slug, { videoStatus: 'render_failed', videoError: message.slice(0, 500) });
  process.exit(1);
}

async function main() {
  const slug = (process.env.ARTICLE_SLUG || '').trim();
  if (!slug) { console.error('[admin-video-render] ARTICLE_SLUG is required.'); process.exit(1); }

  const article = await readArticle(slug);
  if (!article) await fail(slug, `No article found at articles/${slug}.`);
  // Guards against a stale/duplicate workflow_dispatch acting on an article
  // whose approval state has since moved on (e.g. the admin regenerated the
  // script after this run was already queued).
  if (article!.videoStatus !== 'rendering') {
    console.warn(`[admin-video-render] articles/${slug} is not in 'rendering' state (actual: ${article!.videoStatus ?? 'none'}) — nothing to do.`);
    return;
  }
  const beats = article!.videoBeats;
  const videoMeta = article!.videoMeta;
  if (!beats?.length || !videoMeta?.youtubeTitle) {
    await fail(slug, 'articles/' + slug + ' is missing videoBeats/videoMeta — cannot render.');
    return;
  }

  const vertical = (article!.relatedVertical || 'engineering') as Vertical;
  const headline = article!.title;
  const hookLine = videoMeta.hookLine?.trim() || undefined;
  const format = article!.videoFormat || 'reel';
  const compositionId = format === 'landscape' ? 'NewsRecapLandscape' : 'NewsRecap';

  try {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);

    const resolved = resolveBeats(beats);
    const nHeadline = await synthesizeNarration(`${hookLine ? `${hookLine}. ` : ''}${headline}`, 'admin-headline');

    const nBeats = await Promise.all(
      resolved.map(async (beat, i) => {
        if (beat.noAudio || !beat.text?.trim()) return null;
        let line = beat.text;
        if (hinglishEnabled()) {
          const h = await toHinglish([line]);
          line = h[0] ?? line;
        }
        return synthesizeNarration(line, `admin-beat-${i}`);
      }),
    );
    const narration: NewsNarration = { headline: nHeadline, beats: nBeats };

    console.log(`[admin-video-render] Bundling Remotion project for ${compositionId} (${format})...`);
    const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });

    const { hasNewsBgm, hasOutro } = audioFlags();
    const newsProps = { vertical, headline, beats: resolved, hookLine, narration, format, hasBgm: hasNewsBgm, hasOutro };
    const outFile = await renderComposition(
      bundleLocation, compositionId, newsProps,
      path.join(OUTPUT_DIR, `${today}-${slug}-admin.mp4`),
    );
    const coverPath = await renderCoverStill(
      bundleLocation, compositionId, newsProps, 45, outFile.replace(/\.mp4$/, '-cover.jpg'),
    );

    const staged = await stageAdminVideo(slug, outFile, coverPath);
    console.log(`[admin-video-render] Staged: ${staged.videoUrl}`);
    console.log('[admin-video-render] Done — awaiting admin approval in the panel.');
  } catch (e) {
    await fail(slug, `Fatal: ${(e as Error).message}`);
  }
}

main().catch((e) => {
  console.error('[admin-video-render] Unhandled:', e);
  process.exit(1);
});
