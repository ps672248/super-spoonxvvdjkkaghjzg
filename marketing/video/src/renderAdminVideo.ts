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
import { readArticle, stageAdminDualVideos, stageAdminVideo, updateArticleVideo, type VideoBeat, type VideoMeta } from './adminVideoApproval';

async function fail(slug: string, message: string): Promise<never> {
  console.error(`[admin-video-render] ${message}`);
  await updateArticleVideo(slug, { videoStatus: 'render_failed', videoError: message.slice(0, 500) });
  process.exit(1);
}

function normalizeBeatRows(beats?: VideoBeat[]): VideoBeat[] | undefined {
  if (!Array.isArray(beats)) return beats;
  return beats.map((b) => {
    if (!b || !b.table || !Array.isArray(b.table.rows)) return b;
    const rawRows = b.table.rows as unknown[];
    return {
      ...b,
      table: {
        ...b.table,
        rows: rawRows.map((r) =>
          Array.isArray(r) ? (r as string[]) : (((r as { cells?: string[] })?.cells) ?? Object.values((r as object) || {}))
        ),
      },
    };
  });
}

async function renderSingleFormat(
  bundleLocation: string,
  slug: string,
  today: string,
  vertical: Vertical,
  headline: string,
  format: 'reel' | 'landscape',
  beats: VideoBeat[],
  videoMeta?: VideoMeta,
): Promise<{ videoPath: string; coverPath?: string }> {
  const compositionId = format === 'landscape' ? 'NewsRecapLandscape' : 'NewsRecap';
  const hookLine = videoMeta?.hookLine?.trim() || undefined;
  const resolved = resolveBeats(normalizeBeatRows(beats) || []);

  const nHeadline = await synthesizeNarration(`${hookLine ? `${hookLine}. ` : ''}${headline}`, `admin-${format}-headline`);

  const nBeats = await Promise.all(
    resolved.map(async (beat, i) => {
      if (beat.noAudio || !beat.text?.trim()) return null;
      let line = beat.text;
      if (hinglishEnabled()) {
        const h = await toHinglish([line]);
        line = h[0] ?? line;
      }
      return synthesizeNarration(line, `admin-${format}-beat-${i}`);
    }),
  );
  const narration: NewsNarration = { headline: nHeadline, beats: nBeats };

  const { hasNewsBgm, hasOutro } = audioFlags();
  const newsProps = { vertical, headline, beats: resolved, hookLine, narration, format, hasBgm: hasNewsBgm, hasOutro };
  const outFile = await renderComposition(
    bundleLocation, compositionId, newsProps,
    path.join(OUTPUT_DIR, `${today}-${slug}-${format}-admin.mp4`),
  );
  const coverPath = await renderCoverStill(
    bundleLocation, compositionId, newsProps, 45, outFile.replace(/\.mp4$/, '-cover.jpg'),
  );

  return { videoPath: outFile, coverPath };
}

async function main() {
  const slug = (process.env.ARTICLE_SLUG || '').trim();
  if (!slug) { console.error('[admin-video-render] ARTICLE_SLUG is required.'); process.exit(1); }

  const article = await readArticle(slug);
  if (!article) await fail(slug, `No article found at articles/${slug}.`);
  if (article!.videoStatus !== 'rendering') {
    console.warn(`[admin-video-render] articles/${slug} is not in 'rendering' state (actual: ${article!.videoStatus ?? 'none'}) — nothing to do.`);
    return;
  }

  const vertical = (article!.relatedVertical || 'engineering') as Vertical;
  const headline = article!.title;
  const format = article!.videoFormat || 'both';

  try {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);

    console.log(`[admin-video-render] Bundling Remotion project...`);
    const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });

    if (format === 'both') {
      const reelBeats = article!.reelBeats || article!.videoBeats || [];
      const reelMeta = article!.reelMeta || article!.videoMeta;
      const landscapeBeats = article!.landscapeBeats || article!.videoBeats || [];
      const landscapeMeta = article!.landscapeMeta || article!.videoMeta;

      if (!reelBeats.length && !landscapeBeats.length) {
        await fail(slug, 'Missing both reel and landscape beats — cannot render.');
      }

      console.log(`[admin-video-render] (1/2) Rendering 9:16 Reel (${reelBeats.length} beats)...`);
      const reel = await renderSingleFormat(bundleLocation, slug, today, vertical, headline, 'reel', reelBeats, reelMeta);

      console.log(`[admin-video-render] (2/2) Rendering 16:9 Landscape (${landscapeBeats.length} beats)...`);
      const landscape = await renderSingleFormat(bundleLocation, slug, today, vertical, headline, 'landscape', landscapeBeats, landscapeMeta);

      const staged = await stageAdminDualVideos(slug, { reel, landscape });
      console.log(`[admin-video-render] Staged Reel: ${staged.videoStaged?.videoUrl}`);
      console.log(`[admin-video-render] Staged Landscape: ${staged.videoStagedLandscape?.videoUrl}`);
    } else if (format === 'landscape') {
      const beats = article!.landscapeBeats || article!.videoBeats || [];
      const meta = article!.landscapeMeta || article!.videoMeta;
      if (!beats.length) await fail(slug, 'Missing landscape beats — cannot render.');

      console.log(`[admin-video-render] Rendering 16:9 Landscape (${beats.length} beats)...`);
      const landscape = await renderSingleFormat(bundleLocation, slug, today, vertical, headline, 'landscape', beats, meta);
      const staged = await stageAdminDualVideos(slug, { landscape, reel: landscape });
      console.log(`[admin-video-render] Staged: ${staged.videoStagedLandscape?.videoUrl}`);
    } else {
      const beats = article!.reelBeats || article!.videoBeats || [];
      const meta = article!.reelMeta || article!.videoMeta;
      if (!beats.length) await fail(slug, 'Missing reel beats — cannot render.');

      console.log(`[admin-video-render] Rendering 9:16 Reel (${beats.length} beats)...`);
      const reel = await renderSingleFormat(bundleLocation, slug, today, vertical, headline, 'reel', beats, meta);
      const staged = await stageAdminDualVideos(slug, { reel });
      console.log(`[admin-video-render] Staged: ${staged.videoStaged?.videoUrl}`);
    }

    console.log('[admin-video-render] Done — awaiting admin approval in the panel.');
  } catch (e) {
    await fail(slug, `Fatal: ${(e as Error).message}`);
  }
}

main().catch((e) => {
  console.error('[admin-video-render] Unhandled:', e);
  process.exit(1);
});
