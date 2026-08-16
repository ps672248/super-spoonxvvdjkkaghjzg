/* eslint-disable no-console */
/**
 * Renders + publishes a single NewsRecap reel for one article.
 *
 * Two entry points into the same logic:
 *   - renderOneRecap() — the reusable function, takes its input as a typed
 *     object. Used by renderPendingRecaps.ts, which queries Firestore for
 *     articles blog_bot.ts (in the private repo) marked videoStatus:'pending'
 *     and calls this in-process, once per article, no subprocess involved.
 *   - main() — CLI entry point for a single manual/scripted render, reading
 *     the same fields from env vars. Kept for local testing/debugging; not
 *     used by the scheduled path above.
 *
 * No Firestore access in this file itself — unlike render.ts (QuizCard), it
 * never reads FIREBASE_SERVICE_ACCOUNT. The caller already has the content.
 *
 * Env (main() / CLI form only):
 *   NEWS_RECAP_VERTICAL     engineering|entrance|govt|college|schooling
 *   NEWS_RECAP_HEADLINE     article title
 *   NEWS_RECAP_BEATS_JSON   JSON array of { label, text } (see NewsRecap.tsx Beat)
 *   NEWS_RECAP_META_JSON    optional JSON ArticleVideoMeta (Gemini-authored upload copy)
 *   NEWS_RECAP_TELEGRAM_JSON  optional JSON TelegramCta
 *   NEWS_RECAP_KIND         optional — 'strategy' picks the Telegram CTA over the full-story one
 *   SARVAM_API_KEY          optional — Sarvam bulbul:v3 Hinglish narration (needs GEMINI_API_KEYS
 *                           too for the Hinglish rewrite; see src/hinglish.ts + src/tts.ts)
 *   PUBLISH                 'true' to upload to YouTube/Instagram after rendering (default: off)
 *   YT_CLIENT_SECRET / YT_UPLOAD_TOKEN / IG_BUSINESS_ACCOUNT_ID / IG_ACCESS_TOKEN /
 *   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET   only needed if PUBLISH=true — see render.ts / publishInstagram.ts
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import type { ArticleVideoMeta, Vertical } from './fetchContent';
import { resolveBeats, type Beat, type NewsNarration } from './NewsRecap';
import type { TelegramCta } from './Brand';
import { buildNewsMetadata, type UploadMetadata } from './metadata';
import { hinglishEnabled, toHinglish } from './hinglish';
import { synthesizeNarration } from './tts';
import { audioFlags, flagUploadFailureForCI, OUTPUT_DIR, publish, renderComposition, renderCoverStill, type PublishResult } from './renderShared';

const SITE_URL = 'https://www.aspirant-arcade.xyz';

// Keep in sync with scripts/blog_bot.ts slugify() — the article doc id IS
// slugify(title), and NEWS_RECAP_HEADLINE is that exact title, so this
// reconstructs the article's URL without an extra env var.
function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

// Minimal inline Discord poster — marketing/video is its own deployable
// package (no dependency on website/lib), so this is a small duplicate of
// website/lib/discord.ts's embed builder rather than a cross-package import.
async function notifyDiscord(vertical: Vertical, meta: UploadMetadata, links: PublishResult, articleUrl: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_NEWCONTENT;
  if (!webhookUrl || (!links.youtubeUrl && !links.instagramUrl)) return;

  const descriptionLines = meta.youtube.description.split('\n').slice(0, 3).join('\n');
  const fields: { name: string; value: string; inline?: boolean }[] = [{ name: 'Category', value: vertical, inline: true }];
  if (links.youtubeUrl) fields.push({ name: 'YouTube', value: links.youtubeUrl });
  if (links.instagramUrl) fields.push({ name: 'Instagram', value: links.instagramUrl });
  fields.push({ name: 'Article', value: articleUrl });

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `📰 New video: ${meta.youtube.title}`,
          description: descriptionLines,
          color: 0x6366f1,
          fields,
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    if (!res.ok) console.error(`[news-recap] Discord webhook post failed: ${res.status} ${await res.text()}`);
  } catch (e) {
    console.error('[news-recap] Discord webhook post error:', e);
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[news-recap] Missing required env ${name}`);
    process.exit(1);
  }
  return v;
}

export type RenderOneRecapInput = {
  vertical: Vertical;
  headline: string;
  beats: Beat[];
  videoMeta?: ArticleVideoMeta;
  telegram?: TelegramCta;
  /** 'strategy' picks the Telegram CTA over the full-story one — see spokenCta below. */
  kind?: string;
};

/** Renders, uploads (if PUBLISH=true), and returns the platform links. Throws
 * on a hard failure; publish() itself swallows per-platform upload errors so
 * one platform failing doesn't block the other — see PublishResult. */
export async function renderOneRecap(input: RenderOneRecapInput): Promise<PublishResult> {
  const { vertical, headline, beats, videoMeta, telegram, kind } = input;
  console.log(`[news-recap] Vertical: ${vertical}. PUBLISH=${process.env.PUBLISH === 'true'}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);

  const hookLine = videoMeta?.hookLine?.trim() || undefined;
  const articleUrl = `${SITE_URL}/blog/${slugify(headline)}`;
  const fullStoryLabel = `${SITE_URL.replace(/^https?:\/\/(www\.)?/, '')}/blog`;

  // ONE spoken CTA, never two. Telegram wins on strategy reels — the evergreen
  // ones people subscribe off — and the full-story line wins everywhere else,
  // where there's an article worth clicking through to today. Two CTAs inside a
  // two-second outro is noise.
  const isStrategy = kind === 'strategy';
  const spokenCta = telegram && isStrategy
    ? `Telegram par join karo — ${telegram.purpose || 'exam updates'}.`
    : 'Poori khabar ka link description mein hai.';

  // Narration must exist on disk before bundle() below copies public/ into the bundle.
  // Spoken lines only — on-screen text always stays English. With Sarvam TTS
  // active these become Hinglish: preferably the hinglishHeadline/hinglishBeats
  // piggybacked on the caller's video-content Gemini call (zero extra requests),
  // else one toHinglish() fallback call (per-line fallback to English).
  const resolved = resolveBeats(beats);
  let spokenLines = [`${hookLine ? `${hookLine}. ` : ''}${headline}`, ...resolved.map((b) => b.text)];
  if (hinglishEnabled()) {
    if (videoMeta?.hinglishHeadline && videoMeta.hinglishBeats?.length === resolved.length) {
      spokenLines = [videoMeta.hinglishHeadline, ...videoMeta.hinglishBeats];
      console.log('[news-recap] Hinglish narration piggybacked from NEWS_RECAP_META_JSON.');
    } else {
      const h = await toHinglish(spokenLines);
      spokenLines = spokenLines.map((line, i) => h[i] ?? line);
      console.log(`[news-recap] Hinglish narration (fallback call): ${h.map((x) => !!x).join(',')}`);
    }
  }
  const [nHeadline, ...nBeats] = await Promise.all(
    spokenLines.map((line, i) => synthesizeNarration(line, i === 0 ? 'news-headline' : `news-beat-${i - 1}`)),
  );
  const narration: NewsNarration = { headline: nHeadline, beats: nBeats };
  console.log(`[news-recap] Narration — headline:${!!nHeadline} beats:${nBeats.map((n) => !!n).join(',')}`);

  // Spoken CTA over the outro. Sound-on is the default for a first Reels view,
  // and a spoken line converts where an on-screen pill gets skipped.
  const nCta = await synthesizeNarration(spokenCta, 'news-cta');
  narration.cta = nCta;
  console.log(`[news-recap] Spoken CTA (${telegram && isStrategy ? 'telegram' : 'full-story'}): ${!!nCta}`);

  console.log('[news-recap] Bundling Remotion project...');
  const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });

  const { hasNewsBgm, hasOutro } = audioFlags();
  console.log(`[news-recap] Audio available — newsBgm:${hasNewsBgm} outro:${hasOutro}`);

  const newsProps = {
    vertical, headline, beats, hookLine, narration,
    hasBgm: hasNewsBgm, hasOutro,
    fullStoryLabel,
    ...(telegram ? { telegram } : {}),
    duckOutroSting: !!narration.cta,
  };
  const outFile = await renderComposition(
    bundleLocation,
    'NewsRecap',
    newsProps,
    path.join(OUTPUT_DIR, `${today}-${vertical}-news.mp4`),
  );

  // Cover/thumbnail: the headline card at 1.5s — entrance animation settled,
  // still inside the 2.5s headline section. Best-effort (undefined on failure).
  const coverPath = await renderCoverStill(
    bundleLocation, 'NewsRecap', newsProps, 45, outFile.replace(/\.mp4$/, '-cover.jpg'),
  );

  const meta = buildNewsMetadata(vertical, headline, beats, videoMeta, articleUrl);
  writeFileSync(outFile.replace(/\.mp4$/, '.meta.json'), JSON.stringify(meta, null, 2));
  const links = await publish(outFile, meta, coverPath);
  flagUploadFailureForCI(links);

  await notifyDiscord(vertical, meta, links, articleUrl);
  console.log('[news-recap] Done.');
  return links;
}

// ── CLI entry point — reads the same fields renderOneRecap() takes, from env
// vars, for a manual/scripted single render. Not used by the scheduled path
// (renderPendingRecaps.ts calls renderOneRecap() directly, in-process). ──────
async function main() {
  const vertical = requireEnv('NEWS_RECAP_VERTICAL') as Vertical;
  const headline = requireEnv('NEWS_RECAP_HEADLINE');
  const beats: Beat[] = JSON.parse(requireEnv('NEWS_RECAP_BEATS_JSON'));
  const videoMeta: ArticleVideoMeta | undefined = process.env.NEWS_RECAP_META_JSON
    ? JSON.parse(process.env.NEWS_RECAP_META_JSON)
    : undefined;
  const telegram: TelegramCta | undefined = process.env.NEWS_RECAP_TELEGRAM_JSON
    ? JSON.parse(process.env.NEWS_RECAP_TELEGRAM_JSON)
    : undefined;
  const kind = process.env.NEWS_RECAP_KIND;

  const links = await renderOneRecap({ vertical, headline, beats, videoMeta, telegram, kind });

  // Parseable line for anything scripting this CLI form to pick the links
  // back up.
  console.log(`NEWS_RECAP_RESULT=${JSON.stringify(links)}`);
}

// Only run the CLI entry point when this file is executed directly (`tsx
// renderNewsRecap.ts`) — not when renderPendingRecaps.ts imports renderOneRecap.
if (process.argv[1] && process.argv[1].endsWith('renderNewsRecap.ts')) {
  main().catch((e) => {
    console.error('[news-recap] Fatal:', e);
    process.exit(1);
  });
}
