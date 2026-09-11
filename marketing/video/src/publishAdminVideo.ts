/* eslint-disable no-console */
/**
 * Second half of the admin video pipeline — runs after the admin clicks
 * Approve or Reject on the staged preview in /admin/blog/[slug]/video.
 *
 *   admin-video-render.yml   render → stage to Cloudinary → videoStatus: video_ready
 *      ↓ (admin panel writes videoStatus: publishing|rejected, dispatches this)
 *   admin-video-publish.yml → THIS FILE
 *      publishing → download the staged mp4 → YouTube (+Instagram) → clean up
 *      rejected   → clean up only
 *
 * Cloudinary is always cleaned, either way. Rejection is not a failure — it
 * exits 0, same reasoning as src/publishApproved.ts (the meme equivalent):
 * a rejected video is the system working, not something to alarm on.
 *
 * Usage:  ARTICLE_SLUG=some-article-slug npm run admin-video:publish
 *
 * Env:
 *   ARTICLE_SLUG               which articles/{slug} doc to act on (required)
 *   FIREBASE_SERVICE_ACCOUNT   Firestore access
 *   CLOUDINARY_*                staged-asset download + cleanup
 *   YT_CLIENT_SECRET/YT_UPLOAD_TOKEN, IG_*   see src/publishYouTube.ts / publishInstagram.ts
 *
 * No publish gate here: the admin clicking Approve IS the decision, same as
 * the meme flow's Discord button — a second switch would silently swallow it.
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cleanupStagedVideo, readArticle, updateArticleVideo } from './adminVideoApproval';
import { buildNewsMetadata } from './metadata';
import { OUTPUT_DIR, publish } from './renderShared';
import type { Vertical } from './fetchContent';

async function download(url: string, outFile: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} for ${url}`);
  writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
  return outFile;
}

async function main() {
  const slug = (process.env.ARTICLE_SLUG || '').trim();
  if (!slug) { console.error('[admin-video-publish] ARTICLE_SLUG is required.'); process.exit(1); }

  const article = await readArticle(slug);
  if (!article) { console.error(`[admin-video-publish] No article found at articles/${slug}.`); process.exit(1); return; }

  if (article.videoStatus === 'rejected') {
    console.log(`[admin-video-publish] "${slug}" was rejected. Cleaning up, publishing nothing.`);
    if (article.videoStaged) await cleanupStagedVideo(article.videoStaged);
    if (article.videoStagedLandscape) await cleanupStagedVideo(article.videoStagedLandscape);
    await updateArticleVideo(slug, {
      videoStaged: { videoUrl: '', videoPublicId: '' },
      videoStagedLandscape: { videoUrl: '', videoPublicId: '' },
    });
    return; // exit 0 — a rejection is the system working, not a failure
  }

  if (article.videoStatus !== 'publishing') {
    console.warn(`[admin-video-publish] "${slug}" is not in 'publishing' state (actual: ${article.videoStatus ?? 'none'}) — nothing to do.`);
    return;
  }
  if (!article.videoStaged?.videoUrl && !article.videoStagedLandscape?.videoUrl) {
    console.error(`[admin-video-publish] "${slug}" is 'publishing' but has no staged video — cannot proceed.`);
    await updateArticleVideo(slug, { videoStatus: 'publish_failed', videoError: 'No staged video found.' });
    process.exit(1);
  }

  console.log(`[admin-video-publish] "${slug}" approved — pulling staged copies back down.`);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  try {
    const vertical = (article.relatedVertical || 'engineering') as Vertical;
    const articleUrl = `https://www.aspirant-arcade.xyz/blog/${slug}`;
    const videoLinks: Record<string, string> = { ...(article.videoLinks || {}) };

    // 1. Publish 9:16 Reel (Shorts + Instagram) if staged
    if (article.videoStaged?.videoUrl) {
      console.log(`[admin-video-publish] Publishing 9:16 Reel...`);
      const reelPath = await download(article.videoStaged.videoUrl, path.join(OUTPUT_DIR, `${slug}-reel-admin.mp4`));
      const reelCoverPath = article.videoStaged.coverUrl
        ? await download(article.videoStaged.coverUrl, path.join(OUTPUT_DIR, `${slug}-reel-admin-cover.jpg`)).catch(() => undefined)
        : undefined;

      const reelBeats = article.reelBeats || article.videoBeats || [];
      const reelMeta = article.reelMeta || article.videoMeta;
      const meta = buildNewsMetadata(vertical, article.title, reelBeats, reelMeta, articleUrl, 'reel');
      writeFileSync(path.join(OUTPUT_DIR, `${slug}-reel-admin.meta.json`), JSON.stringify(meta, null, 2));

      const links = await publish(reelPath, meta, reelCoverPath, true);
      if (links.youtubeUrl) {
        videoLinks.youtube = links.youtubeUrl;
        videoLinks.youtubeShort = links.youtubeUrl;
      }
      if (links.instagramUrl) videoLinks.instagram = links.instagramUrl;
      await cleanupStagedVideo(article.videoStaged);
    }

    // 2. Publish 16:9 Long-Form (YouTube Main) if staged
    if (article.videoStagedLandscape?.videoUrl) {
      console.log(`[admin-video-publish] Publishing 16:9 Long-Form...`);
      const landscapePath = await download(article.videoStagedLandscape.videoUrl, path.join(OUTPUT_DIR, `${slug}-landscape-admin.mp4`));
      const landscapeCoverPath = article.videoStagedLandscape.coverUrl
        ? await download(article.videoStagedLandscape.coverUrl, path.join(OUTPUT_DIR, `${slug}-landscape-admin-cover.jpg`)).catch(() => undefined)
        : undefined;

      const landscapeBeats = article.landscapeBeats || article.videoBeats || [];
      const landscapeMeta = article.landscapeMeta || article.videoMeta;
      const meta = buildNewsMetadata(vertical, article.title, landscapeBeats, landscapeMeta, articleUrl, 'landscape');
      writeFileSync(path.join(OUTPUT_DIR, `${slug}-landscape-admin.meta.json`), JSON.stringify(meta, null, 2));

      const links = await publish(landscapePath, meta, landscapeCoverPath, true);
      if (links.youtubeUrl) {
        videoLinks.youtubeLongForm = links.youtubeUrl;
        if (!videoLinks.youtube) videoLinks.youtube = links.youtubeUrl;
      }
      await cleanupStagedVideo(article.videoStagedLandscape);
    }

    if (Object.keys(videoLinks).length === 0) {
      await updateArticleVideo(slug, {
        videoStatus: 'publish_failed',
        videoError: 'Both YouTube and Instagram upload failed — see workflow logs.',
        videoStaged: { videoUrl: '', videoPublicId: '' },
        videoStagedLandscape: { videoUrl: '', videoPublicId: '' },
      });
      console.error('[admin-video-publish] Approved but nothing published — check the upload errors above.');
      process.exit(1);
    }

    await updateArticleVideo(slug, {
      videoStatus: 'published',
      videoLinks,
      videoStaged: { videoUrl: '', videoPublicId: '' },
      videoStagedLandscape: { videoUrl: '', videoPublicId: '' },
      videoError: '',
    });
    console.log(`[admin-video-publish] Done. Links:`, videoLinks);
  } catch (e) {
    await updateArticleVideo(slug, { videoStatus: 'publish_failed', videoError: (e as Error).message.slice(0, 500) });
    // Staged copy deliberately left in place on an unexpected failure (as
    // opposed to the handled "no links" case above) — it wasn't necessarily
    // reached, so cleaning it up here could delete the only recovery copy.
    throw e;
  }
}

main().catch((e) => {
  console.error('[admin-video-publish] Fatal:', e);
  process.exit(1);
});
