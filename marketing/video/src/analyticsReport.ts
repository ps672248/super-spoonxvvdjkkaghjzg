/* eslint-disable no-console */
/**
 * Weekly performance feedback loop — pulls the last ANALYTICS_WINDOW_DAYS
 * (default 28) of published reels from YouTube and Instagram, attributes each
 * back to its vertical (by reverse-matching metadata.ts's VERTICAL_HASHTAGS in
 * the description), and posts a digest to Discord: totals, per-vertical
 * averages, and the best/worst videos by retention. The point is to stop
 * guessing which hooks/verticals work — prune what the numbers say is weak.
 *
 * Data sources, each independently best-effort (a missing one degrades the
 * report instead of failing the run):
 *   - YouTube Data API (YT_API_KEY + YT_CHANNEL_ID — public reads): uploads
 *     list, views/likes/comments, titles.
 *   - YouTube Analytics API (OAuth — same client_secret.json +
 *     youtube_upload_token.json as uploads): retention metrics
 *     (averageViewPercentage etc). Needs the token to include the
 *     yt-analytics.readonly scope — re-run scripts/generateYouTubeUploadToken.ts
 *     (its scope list now includes it) and update the YT_UPLOAD_TOKEN secret if
 *     you see a permission error; the report still posts view counts without it.
 *   - Instagram Graph API (IG_BUSINESS_ACCOUNT_ID + IG_ACCESS_TOKEN): reel
 *     views/reach/likes via media insights.
 *
 * The numbers then go to Gemini (GEMINI_API_KEYS — same ring as everywhere
 * else) which returns 3-5 ranked, concrete suggestions for what to change in
 * the video pipeline (hooks to prune, vertical rebalancing, metadata tweaks),
 * appended to the Discord digest. Suggestions are advisory — a human applies
 * them (usually to metadata.ts) — and the step is skipped silently when no
 * Gemini key is available.
 *
 * Commands:  npm run analytics      (from marketing/video)
 * Schedule:  .github/workflows/analytics-report.yml (weekly, Sunday evening IST)
 *
 * Env: YT_API_KEY, YT_CHANNEL_ID, IG_BUSINESS_ACCOUNT_ID, IG_ACCESS_TOKEN,
 *      DISCORD_WEBHOOK_ANALYTICS (falls back to DISCORD_WEBHOOK_NEWCONTENT),
 *      ANALYTICS_WINDOW_DAYS (default 28).
 */
import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';
import { CLIENT_SECRET_FILE, TOKEN_FILE } from './publishYouTube';
import { VERTICAL_HASHTAGS } from './metadata';
import type { Vertical } from './fetchContent';

const GRAPH_API_VERSION = 'v21.0';
const WINDOW_DAYS = Number(process.env.ANALYTICS_WINDOW_DAYS || 28);

// Rolling history of past runs, committed back to the repo by
// analytics-report.yml (runners are ephemeral) — lets you check whether last
// week's suggestion actually moved the numbers without scrolling Discord.
const HISTORY_FILE = path.join(process.cwd(), 'analytics-history.json');
const HISTORY_MAX_RUNS = 7;

type YtVideo = {
  id: string;
  title: string;
  publishedAt: string;
  vertical: Vertical | 'unknown';
  views: number;
  likes: number;
  comments: number;
  // From the Analytics API — undefined when the OAuth token lacks the scope.
  avgViewPct?: number;
  avgViewDurationSec?: number;
  subscribersGained?: number;
};

type IgReel = { caption: string; permalink: string; timestamp: string; views?: number; reach?: number; likes?: number };

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function detectVertical(description: string): Vertical | 'unknown' {
  for (const [vertical, tags] of Object.entries(VERTICAL_HASHTAGS) as [Vertical, string[]][]) {
    if (tags.some((t) => description.includes(t))) return vertical;
  }
  return 'unknown';
}

// ── YouTube ───────────────────────────────────────────────────────────────────

async function fetchYouTubeVideos(): Promise<YtVideo[]> {
  const key = process.env.YT_API_KEY;
  const channelId = process.env.YT_CHANNEL_ID;
  if (!key || !channelId) {
    console.warn('[analytics] YT_API_KEY / YT_CHANNEL_ID not set — skipping YouTube.');
    return [];
  }
  const youtube = google.youtube({ version: 'v3', auth: key });

  const ch = await youtube.channels.list({ id: [channelId], part: ['contentDetails'] });
  const uploadsPlaylist = ch.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylist) throw new Error(`No uploads playlist found for channel ${channelId}`);

  const since = isoDaysAgo(WINDOW_DAYS);
  const ids: string[] = [];
  let pageToken: string | undefined;
  // Uploads playlist is newest-first — stop paging once we cross the window.
  do {
    const page = await youtube.playlistItems.list({
      playlistId: uploadsPlaylist, part: ['contentDetails'], maxResults: 50, pageToken,
    });
    let crossedWindow = false;
    for (const item of page.data.items ?? []) {
      const publishedAt = item.contentDetails?.videoPublishedAt;
      if (!publishedAt || publishedAt < since) { crossedWindow = true; continue; }
      if (item.contentDetails?.videoId) ids.push(item.contentDetails.videoId);
    }
    pageToken = crossedWindow ? undefined : (page.data.nextPageToken ?? undefined);
  } while (pageToken && ids.length < 200);

  const videos: YtVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = await youtube.videos.list({ id: ids.slice(i, i + 50), part: ['snippet', 'statistics'] });
    for (const v of batch.data.items ?? []) {
      videos.push({
        id: v.id!,
        title: v.snippet?.title ?? '(untitled)',
        publishedAt: v.snippet?.publishedAt ?? '',
        vertical: detectVertical(v.snippet?.description ?? ''),
        views: Number(v.statistics?.viewCount ?? 0),
        likes: Number(v.statistics?.likeCount ?? 0),
        comments: Number(v.statistics?.commentCount ?? 0),
      });
    }
  }
  return videos;
}

/** Enriches videos in place with retention metrics. Returns false (with a
 * console explanation) when the OAuth token can't query the Analytics API. */
async function enrichWithRetention(videos: YtVideo[]): Promise<boolean> {
  if (videos.length === 0) return false;
  if (!existsSync(CLIENT_SECRET_FILE) || !existsSync(TOKEN_FILE)) {
    console.warn('[analytics] client_secret.json / youtube_upload_token.json missing — skipping retention metrics.');
    return false;
  }
  try {
    const { readFileSync } = await import('node:fs');
    const raw = JSON.parse(readFileSync(CLIENT_SECRET_FILE, 'utf8'));
    const cfg = raw.installed || raw.web;
    const auth = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, cfg.redirect_uris?.[0]);
    auth.setCredentials(JSON.parse(readFileSync(TOKEN_FILE, 'utf8')));
    const analytics = google.youtubeAnalytics({ version: 'v2', auth });

    const res = await analytics.reports.query({
      ids: 'channel==MINE',
      startDate: isoDaysAgo(WINDOW_DAYS).slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      metrics: 'averageViewPercentage,averageViewDuration,subscribersGained',
      dimensions: 'video',
      filters: `video==${videos.map((v) => v.id).join(',')}`,
      maxResults: 200,
    });
    const byId = new Map<string, number[]>();
    for (const row of res.data.rows ?? []) {
      byId.set(String(row[0]), (row as unknown[]).slice(1).map(Number));
    }
    for (const v of videos) {
      const m = byId.get(v.id);
      if (m) [v.avgViewPct, v.avgViewDurationSec, v.subscribersGained] = m;
    }
    return true;
  } catch (e) {
    console.warn(
      '[analytics] YouTube Analytics query failed — posting view counts only. If this is a scope error, ' +
        're-run marketing/video/scripts/generateYouTubeUploadToken.ts (now includes yt-analytics.readonly) ' +
        `and update the YT_UPLOAD_TOKEN secret. Error: ${(e as Error).message}`,
    );
    return false;
  }
}

// ── Instagram ─────────────────────────────────────────────────────────────────

async function fetchInstagramReels(): Promise<IgReel[]> {
  const igId = process.env.IG_BUSINESS_ACCOUNT_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  if (!igId || !token) {
    console.warn('[analytics] IG_BUSINESS_ACCOUNT_ID / IG_ACCESS_TOKEN not set — skipping Instagram.');
    return [];
  }
  const since = isoDaysAgo(WINDOW_DAYS);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igId}/media?fields=caption,permalink,timestamp,media_product_type&limit=50&access_token=${token}`,
    );
    const data = (await res.json()) as { data?: { id: string; caption?: string; permalink: string; timestamp: string; media_product_type?: string }[]; error?: { message?: string } };
    if (data.error) throw new Error(data.error.message);
    const reels = (data.data ?? []).filter((m) => m.timestamp >= since && m.media_product_type === 'REELS');

    const out: IgReel[] = [];
    for (const m of reels) {
      const reel: IgReel = { caption: (m.caption ?? '').split('\n')[0].slice(0, 80), permalink: m.permalink, timestamp: m.timestamp };
      // Meta renamed reel plays to "views" (2024); older API versions may still
      // want "plays" — try new names first, fall back once.
      for (const metrics of ['views,reach,likes', 'plays,reach,likes']) {
        const ins = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${m.id}/insights?metric=${metrics}&access_token=${token}`);
        const insData = (await ins.json()) as { data?: { name: string; values?: { value?: number }[] }[]; error?: unknown };
        if (insData.error || !insData.data) continue;
        for (const metric of insData.data) {
          const value = metric.values?.[0]?.value ?? 0;
          if (metric.name === 'views' || metric.name === 'plays') reel.views = value;
          else if (metric.name === 'reach') reel.reach = value;
          else if (metric.name === 'likes') reel.likes = value;
        }
        break;
      }
      out.push(reel);
    }
    return out;
  } catch (e) {
    console.warn(`[analytics] Instagram fetch failed — skipping: ${(e as Error).message}`);
    return [];
  }
}

// ── Gemini suggestions ────────────────────────────────────────────────────────

const SUGGESTIONS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    suggestions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { action: { type: 'STRING' }, why: { type: 'STRING' } },
        required: ['action', 'why'],
      },
    },
  },
  required: ['suggestions'],
};

function buildSuggestionsPrompt(videos: YtVideo[], hasRetention: boolean, reels: IgReel[]): string {
  // Compact per-video rows — enough signal for pattern-finding without blowing
  // the prompt up (titles carry the hook formula, which is the main knob).
  const ytRows = videos.map((v) => ({
    title: v.title.slice(0, 90),
    vertical: v.vertical,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    ...(v.avgViewPct !== undefined ? { retentionPct: Number(v.avgViewPct.toFixed(1)) } : {}),
    ...(v.subscribersGained ? { subsGained: v.subscribersGained } : {}),
  }));
  const igRows = reels.map((r) => ({ caption: r.caption, views: r.views ?? 0, reach: r.reach ?? 0, likes: r.likes ?? 0 }));

  return `You are the growth analyst for Aspirant Arcade, an Indian exam-prep app that auto-publishes short vertical videos daily to YouTube Shorts + Instagram Reels:
- A daily quiz reel (hook line → MCQ → countdown → answer reveal), vertical rotates by weekday across: engineering (GATE/PSU), entrance (JEE/NEET), govt (SSC/banking), college, schooling (CBSE boards).
- News recap reels per published article (hook → headline → 1-3 fact beats).
Pipeline knobs a human can turn: the hook-line pool and title formulas, per-vertical hashtag sets, YouTube titles/descriptions/tags and IG captions (Gemini-written per video), the weekday vertical rotation, Hinglish vs English voiceover, cover/thumbnail frame choice, video pacing/length.

Last-${WINDOW_DAYS}-days performance${hasRetention ? '' : ' (retention metrics unavailable this run — judge by views/likes/comments only)'}:
YOUTUBE: ${JSON.stringify(ytRows)}
INSTAGRAM: ${JSON.stringify(igRows)}

Give 3-5 suggestions, ranked most-impactful first. Each: { action: one concrete change to the pipeline knobs above (max 180 chars, imperative, specific — name the exact hook pattern/vertical/tweak), why: the evidence from the data above (max 120 chars, cite numbers) }. Ground every suggestion in this data — no generic best-practice filler. If the data is too thin for a claim, say so in that suggestion instead of inventing a pattern.

Return valid JSON only.`;
}

/** Best-effort — returns null (and the report ships without the section) when
 * no Gemini key is available or every key/call fails. */
async function fetchGeminiSuggestions(videos: YtVideo[], hasRetention: boolean, reels: IgReel[]): Promise<{ action: string; why: string }[] | null> {
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    console.log('[analytics] GEMINI_API_KEYS not set — skipping suggestions section.');
    return null;
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = buildSuggestionsPrompt(videos, hasRetention, reels);

  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: SUGGESTIONS_SCHEMA },
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429) continue; // quota — next key
      const data = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      if (data.error) {
        if (/quota|exhausted|rate|RESOURCE_EXHAUSTED/i.test(data.error.message || '')) continue;
        throw new Error(data.error.message || `HTTP ${res.status}`);
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      const parsed = JSON.parse(text) as { suggestions?: { action?: string; why?: string }[] };
      const suggestions = (parsed.suggestions ?? [])
        .filter((s): s is { action: string; why: string } => Boolean(s.action && s.why))
        .slice(0, 5);
      return suggestions.length ? suggestions : null;
    } catch (e) {
      console.warn(`[analytics] Gemini suggestions call failed: ${(e as Error).message}`);
    }
  }
  console.warn('[analytics] All Gemini keys failed — skipping suggestions section.');
  return null;
}

// ── History ───────────────────────────────────────────────────────────────────

/** Prepends this run to analytics-history.json, trimmed to the last
 * HISTORY_MAX_RUNS runs. Best-effort — a corrupt/missing file starts fresh. */
function appendHistory(videos: YtVideo[], hasRetention: boolean, reels: IgReel[], suggestions: { action: string; why: string }[] | null): void {
  try {
    let history: unknown[] = [];
    try {
      const parsed = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
      if (Array.isArray(parsed)) history = parsed;
    } catch { /* first run or corrupt file — start fresh */ }

    const byVertical: Record<string, { videos: number; views: number; avgRetentionPct?: number }> = {};
    for (const v of videos) {
      const bucket = (byVertical[v.vertical] ??= { videos: 0, views: 0 });
      bucket.videos += 1;
      bucket.views += v.views;
    }
    for (const [vertical, bucket] of Object.entries(byVertical)) {
      const withPct = videos.filter((v) => v.vertical === vertical && v.avgViewPct !== undefined);
      if (withPct.length) bucket.avgRetentionPct = Number((withPct.reduce((s, v) => s + v.avgViewPct!, 0) / withPct.length).toFixed(1));
    }
    const retained = videos.filter((v) => v.avgViewPct !== undefined);

    history.unshift({
      runAt: new Date().toISOString(),
      windowDays: WINDOW_DAYS,
      youtube: {
        videos: videos.length,
        totalViews: videos.reduce((s, v) => s + v.views, 0),
        ...(retained.length ? { avgRetentionPct: Number((retained.reduce((s, v) => s + v.avgViewPct!, 0) / retained.length).toFixed(1)) } : {}),
        ...(hasRetention ? { subsGained: videos.reduce((s, v) => s + (v.subscribersGained ?? 0), 0) } : {}),
        byVertical,
      },
      instagram: {
        reels: reels.length,
        totalViews: reels.reduce((s, r) => s + (r.views ?? 0), 0),
        totalReach: reels.reduce((s, r) => s + (r.reach ?? 0), 0),
      },
      suggestions: suggestions ?? [],
    });

    writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(0, HISTORY_MAX_RUNS), null, 2) + '\n');
    console.log(`[analytics] ✓ History updated (${Math.min(history.length, HISTORY_MAX_RUNS)} runs kept): ${HISTORY_FILE}`);
  } catch (e) {
    console.warn(`[analytics] History write failed — report unaffected: ${(e as Error).message}`);
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

function fmtPct(n?: number): string {
  return n === undefined ? '—' : `${n.toFixed(1)}%`;
}

function buildReport(videos: YtVideo[], hasRetention: boolean, reels: IgReel[]): { text: string; fields: { name: string; value: string }[] } {
  const fields: { name: string; value: string }[] = [];
  const lines: string[] = [];

  if (videos.length > 0) {
    const totalViews = videos.reduce((s, v) => s + v.views, 0);
    const totalSubs = videos.reduce((s, v) => s + (v.subscribersGained ?? 0), 0);
    const retained = videos.filter((v) => v.avgViewPct !== undefined);
    const avgRetention = retained.length ? retained.reduce((s, v) => s + v.avgViewPct!, 0) / retained.length : undefined;
    fields.push({
      name: `▶️ YouTube (${videos.length} videos, last ${WINDOW_DAYS}d)`,
      value: `${totalViews.toLocaleString()} views · avg retention ${fmtPct(avgRetention)}${hasRetention ? ` · +${totalSubs} subs` : ' · (no Analytics scope — views only)'}`,
    });

    // Per-vertical averages — the "which verticals earn their slot" view.
    const byVertical = new Map<string, YtVideo[]>();
    for (const v of videos) {
      byVertical.set(v.vertical, [...(byVertical.get(v.vertical) ?? []), v]);
    }
    const verticalLines = [...byVertical.entries()]
      .sort((a, b) => b[1].reduce((s, v) => s + v.views, 0) - a[1].reduce((s, v) => s + v.views, 0))
      .map(([vertical, vs]) => {
        const views = vs.reduce((s, v) => s + v.views, 0);
        const withPct = vs.filter((v) => v.avgViewPct !== undefined);
        const pct = withPct.length ? withPct.reduce((s, v) => s + v.avgViewPct!, 0) / withPct.length : undefined;
        return `**${vertical}** — ${vs.length} vids · ${views.toLocaleString()} views · retention ${fmtPct(pct)}`;
      });
    fields.push({ name: '📊 By vertical', value: verticalLines.join('\n').slice(0, 1024) });

    // Best/worst by retention when we have it, by views otherwise.
    const ranked = [...videos].sort((a, b) =>
      hasRetention ? (b.avgViewPct ?? -1) - (a.avgViewPct ?? -1) : b.views - a.views,
    );
    const line = (v: YtVideo) =>
      `[${v.title.slice(0, 60)}](https://youtube.com/shorts/${v.id}) — ${v.views} views · ${fmtPct(v.avgViewPct)}`;
    fields.push({ name: `🏆 Top 3 (by ${hasRetention ? 'retention' : 'views'})`, value: ranked.slice(0, 3).map(line).join('\n').slice(0, 1024) });
    if (ranked.length > 3) {
      fields.push({ name: '🪫 Bottom 3 — prune these hooks', value: ranked.slice(-3).reverse().map(line).join('\n').slice(0, 1024) });
    }
  } else {
    fields.push({ name: '▶️ YouTube', value: 'No videos found in window (or API unavailable).' });
  }

  if (reels.length > 0) {
    const totalViews = reels.reduce((s, r) => s + (r.views ?? 0), 0);
    const totalReach = reels.reduce((s, r) => s + (r.reach ?? 0), 0);
    const top = [...reels].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
    fields.push({
      name: `📸 Instagram (${reels.length} reels)`,
      value: `${totalViews.toLocaleString()} views · ${totalReach.toLocaleString()} reach\nTop: [${top.caption}](${top.permalink}) — ${top.views ?? 0} views`,
    });
  }

  // Plain-text mirror for the console/log.
  for (const f of fields) lines.push(`## ${f.name}`, f.value, '');
  return { text: lines.join('\n'), fields };
}

async function postToDiscord(fields: { name: string; value: string }[]): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_ANALYTICS || process.env.DISCORD_WEBHOOK_NEWCONTENT;
  if (!webhookUrl) {
    console.warn('[analytics] No Discord webhook set — report printed to console only.');
    return;
  }
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: `📈 Weekly reels report — last ${WINDOW_DAYS} days`,
        color: 0x22c55e,
        fields,
        timestamp: new Date().toISOString(),
      }],
    }),
  });
  if (!res.ok) console.error(`[analytics] Discord webhook post failed: ${res.status} ${await res.text()}`);
  else console.log('[analytics] ✓ Report posted to Discord.');
}

async function main() {
  console.log(`[analytics] Window: last ${WINDOW_DAYS} days.`);
  const videos = await fetchYouTubeVideos();
  console.log(`[analytics] YouTube videos in window: ${videos.length}`);
  const hasRetention = await enrichWithRetention(videos);
  const reels = await fetchInstagramReels();
  console.log(`[analytics] Instagram reels in window: ${reels.length}`);

  if (videos.length === 0 && reels.length === 0) {
    console.error('[analytics] Nothing fetched from either platform — check credentials.');
    process.exit(1);
  }

  const { text, fields } = buildReport(videos, hasRetention, reels);

  const suggestions = await fetchGeminiSuggestions(videos, hasRetention, reels);
  if (suggestions) {
    const value = suggestions.map((s, i) => `${i + 1}. **${s.action}**\n↳ ${s.why}`).join('\n');
    fields.push({ name: '🤖 What to change next week (Gemini)', value: value.slice(0, 1024) });
  }

  console.log(`\n${text}`);
  if (suggestions) console.log('## 🤖 Suggestions\n' + suggestions.map((s, i) => `${i + 1}. ${s.action} — ${s.why}`).join('\n'));
  appendHistory(videos, hasRetention, reels, suggestions);
  await postToDiscord(fields);
}

main().catch((e) => {
  console.error('[analytics] Fatal:', e);
  process.exit(1);
});
