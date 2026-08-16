/* eslint-disable no-console */
/**
 * Scheduled entry point for automatic NewsRecap videos, replacing the old
 * spawnSync call blog_bot.ts (private repo) used to make directly into this
 * package when both lived in one repo. That local-subprocess call can't cross
 * a repo boundary, so the two sides are now decoupled: blog_bot.ts persists
 * the video content onto the article's Firestore doc instead of piping it
 * over env vars, and this script discovers + renders whatever's pending —
 * triggered by a payload-less workflow_dispatch from a tiny same-repo
 * workflow in the private repo (workflow_run on "Blog Bot" completing), not
 * told which article by the dispatch itself.
 *
 * Self-healing by construction: a render that fails partway leaves the
 * article's videoStatus at 'pending', so the next trigger just picks it back
 * up. No retry-count bookkeeping — matches how video_fallback.ts's own catch-up
 * scan already tolerates partial failure (missing videoLinks = try again).
 *
 * Firestore contract this depends on (written by blog_bot.ts, private repo):
 *   videoStatus   'pending' | 'video_ready' — this script only picks up 'pending'
 *   videoBeats    Beat[] — required, articles without it never got a video
 *   videoMeta     ArticleVideoMeta — optional
 *   videoTelegram TelegramCta — optional, this exam's Telegram CTA if it has one
 *   videoKind     string — optional, 'strategy' picks the Telegram CTA over the
 *                 full-story one (see renderNewsRecap.ts's spokenCta)
 *
 * On success, writes back: videoStatus: 'video_ready', videoLinks: {...}.
 * On failure: leaves videoStatus untouched (stays 'pending'), logs, continues
 * to the next candidate — one bad render never blocks the rest of the run.
 *
 * Env:
 *   FIREBASE_SERVICE_ACCOUNT   required
 *   RECAP_TARGET_DATE          override target publishDate (YYYY-MM-DD), default today (UTC)
 *   PUBLISH                    'true' to upload to YouTube/Instagram (default: off — see render-news-recap.yml)
 *   SARVAM_API_KEY / GEMINI_API_KEYS   optional, Hinglish narration
 *   YT_CLIENT_SECRET / YT_UPLOAD_TOKEN / IG_BUSINESS_ACCOUNT_ID / IG_ACCESS_TOKEN /
 *   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET   required if PUBLISH=true
 */
import 'dotenv/config';
import { getFirebaseApp } from './firebaseAdmin';
import type { ArticleVideoMeta, Vertical } from './fetchContent';
import type { Beat } from './NewsRecap';
import type { TelegramCta } from './Brand';
import { renderOneRecap } from './renderNewsRecap';

const ARTICLES_COLLECTION = 'articles';
const TARGET_DATE = process.env.RECAP_TARGET_DATE || new Date().toISOString().slice(0, 10);

// Mirrors scripts/blog_bot.ts's PW_CATEGORY_TO_VERTICAL — keep in sync.
const CATEGORY_TO_VERTICAL: Record<string, Vertical> = {
  psu: 'engineering', entrance: 'entrance', govt: 'govt', college: 'college', boards: 'schooling',
};

interface PendingArticleDoc {
  title: string;
  category?: string;
  videoBeats?: Beat[];
  videoMeta?: ArticleVideoMeta;
  videoTelegram?: TelegramCta;
  videoKind?: string;
}

async function main() {
  const db = getFirebaseApp().firestore();
  console.log(`[render-pending] Scanning articles/publishDate=${TARGET_DATE} videoStatus=pending...`);

  const snap = await db.collection(ARTICLES_COLLECTION)
    .where('publishDate', '==', TARGET_DATE)
    .where('videoStatus', '==', 'pending')
    .get();

  const candidates = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as PendingArticleDoc) }))
    .filter((a) => CATEGORY_TO_VERTICAL[a.category || ''] && a.videoBeats && a.videoBeats.length > 0);

  console.log(`[render-pending] ${snap.size} pending doc(s), ${candidates.length} renderable.`);
  if (candidates.length === 0) {
    console.log('[render-pending] Nothing to do.');
    return;
  }

  let rendered = 0;
  for (const article of candidates) {
    const vertical = CATEGORY_TO_VERTICAL[article.category || ''];
    console.log(`[render-pending] Rendering: articles/${article.id} ("${article.title.slice(0, 60)}")`);

    try {
      const links = await renderOneRecap({
        vertical,
        headline: article.title,
        beats: article.videoBeats!,
        videoMeta: article.videoMeta,
        telegram: article.videoTelegram,
        kind: article.videoKind,
      });

      const videoLinks: Record<string, string> = {};
      if (links.youtubeUrl) videoLinks.youtube = links.youtubeUrl;
      if (links.instagramUrl) videoLinks.instagram = links.instagramUrl;

      await db.collection(ARTICLES_COLLECTION).doc(article.id).update({
        videoStatus: 'video_ready',
        ...(Object.keys(videoLinks).length > 0 ? { videoLinks } : {}),
      });
      console.log(`  [render-pending] Done — articles/${article.id} marked video_ready.`);
      rendered++;
    } catch (e) {
      console.error(`  [render-pending] Render failed for articles/${article.id}, left pending for next run: ${e}`);
    }
  }

  console.log(`[render-pending] Done. Rendered ${rendered}/${candidates.length}.`);
}

main().catch((e) => {
  console.error('[render-pending] Fatal:', e);
  process.exit(1);
});
