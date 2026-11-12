/* eslint-disable no-console */
/**
 * Daily Marketing Feature Story Reel Runner
 *
 * Picks 1 feature a day from the 10-feature Aspirant Arcade catalog, rotates
 * across 14 aspirant settings while consulting the last 10 runs FOR THAT
 * SPECIFIC FEATURE in marketing_history.json, generates a dynamic 5-scene
 * character dialogue script via Gemini, renders MarketingReel with pure-code
 * characters/backgrounds/phone-mockups + procedural SFX + TTS, and optionally
 * publishes to YouTube Shorts + Instagram Reels.
 *
 * Usage:
 *   npm run render:marketing
 *   npm run render:marketing -- --feature focus_guard --force --stills
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import {
  MARKETING_REEL_FPS,
  marketingSceneFramesFor,
  type MarketingNarration,
  type MarketingReelProps,
} from './MarketingReel';
import {
  generateMarketingStoryScript,
  loadMarketingHistory,
  MARKETING_SETTINGS,
  pickDailyFeature,
  pickRotatedSetting,
  saveMarketingHistory,
} from './marketingScript';
import { cadenceForClip } from './dynamicScript';
import type { UploadMetadata } from './metadata';
import {
  audioFlags,
  flagUploadFailureForCI,
  OUTPUT_DIR,
  PUBLIC_DIR,
  PUBLISH,
  publish,
  renderComposition,
  renderCoverStill,
  resolveBrowserExecutable,
  type PublishResult,
} from './renderShared';
import { synthesizeNarration } from './tts';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.aspirantarcade.app';
const SITE_URL = 'https://www.aspirant-arcade.xyz';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

async function notifyDiscord(
  featureTitle: string,
  settingLabel: string,
  meta: UploadMetadata,
  links: PublishResult,
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_NEWCONTENT;
  if (!webhookUrl) return;

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: 'Feature', value: featureTitle, inline: true },
    { name: 'Setting', value: settingLabel, inline: true },
  ];
  if (links.youtubeUrl) fields.push({ name: 'YouTube Shorts', value: links.youtubeUrl, inline: true });
  if (links.instagramUrl) fields.push({ name: 'Instagram Reel', value: links.instagramUrl, inline: true });

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: `🎬 Daily Marketing Reel: ${meta.youtube.title}`,
            description: meta.instagram.caption.slice(0, 300),
            color: 0x22c55e,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    console.warn('[marketing] Discord notify error:', e);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const today = todayIST();
  const force = Boolean(args.force) || process.env.FORCE === 'true';
  const featureOverride =
    (typeof args.feature === 'string' ? args.feature : process.env.MARKETING_FEATURE)?.trim() || undefined;
  const settingOverride =
    (typeof args.setting === 'string' ? args.setting : process.env.MARKETING_SETTING)?.trim() || undefined;
  const shouldPublish = Boolean(args.publish) || PUBLISH;

  const store = loadMarketingHistory();
  if (!force && !featureOverride && store.lastRunDate === today) {
    console.log(`[marketing] Already generated 1 feature reel today (${today}). Use --force or --feature to override.`);
    return;
  }

  const feature = pickDailyFeature(store, featureOverride);
  const featureHistory = store.byFeature[feature.id] ?? [];
  const setting = pickRotatedSetting(store, feature.id, settingOverride);

  console.log(`\n🎬 Daily Marketing Story Reel (${today})`);
  console.log(`   Feature (1/day): ${feature.id} — ${feature.title}`);
  console.log(`   Rotated Setting: ${setting.id} — ${setting.label}`);
  console.log(`   Feature History: ${featureHistory.length}/10 prior entries consulted`);
  console.log(`   Publish Enabled: ${shouldPublish}\n`);

  // 1. Dynamically generate today's non-repeating story script via Gemini
  const story = await generateMarketingStoryScript(feature, setting, featureHistory);
  const chosenSettingId = story.setting || setting.id;
  const chosenSettingSpec =
    MARKETING_SETTINGS.find((s) => s.id === chosenSettingId) || setting;

  console.log(
    `📜 Script: "${story.title}" | Setting: ${chosenSettingSpec.id} ("${chosenSettingSpec.label}") | Hook: "${story.hookLine}" (${story.scenes.length} scenes)`,
  );

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const flags = audioFlags();

  // 2. Synthesize multi-character voiceovers & lip-sync cadences
  const sceneClips = await Promise.all(
    story.scenes.map((sc, i) =>
      synthesizeNarration(sc.spokenLine, `mkt-${feature.id}-${i}`, sc.speaker),
    ),
  );
  const ctaClip = await synthesizeNarration(story.ctaSpeech, `mkt-${feature.id}-cta`, 'priya');

  const narration: MarketingNarration = {
    scenes: sceneClips,
    sceneCadences: sceneClips.map((clip, i) =>
      cadenceForClip(clip, story.scenes[i]?.spokenLine ?? null, PUBLIC_DIR, MARKETING_REEL_FPS),
    ),
    cta: ctaClip,
  };

  console.log(
    `🎙️ Narration — scenes:${sceneClips.map(Boolean).join(',')} cta:${Boolean(ctaClip)} | SFX:${flags.hasSfx}`,
  );

  const props: MarketingReelProps = {
    featureId: feature.id,
    featureTag: feature.tag,
    setting: chosenSettingId,
    hookLine: story.hookLine,
    title: story.title,
    commentPrompt: story.commentPrompt,
    scenes: story.scenes,
    narration,
    hasBgm: flags.hasNewsBgm,
    hasOutro: flags.hasOutro,
    hasSfx: flags.hasSfx,
  };

  // 3. Bundle & Render MP4 + Cover
  const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });
  const baseSlug = `${today}-${feature.id}-${slugify(story.title)}`;
  const outFile = path.join(OUTPUT_DIR, `marketing-${baseSlug}.mp4`);
  const coverPath = outFile.replace(/\.mp4$/, '-cover.jpg');

  await renderComposition(bundleLocation, 'MarketingReel', props, outFile);
  await renderCoverStill(bundleLocation, 'MarketingReel', props, 35, coverPath);

  if (args.stills) {
    const browserExecutable = resolveBrowserExecutable();
    const comp = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MarketingReel',
      inputProps: props,
      browserExecutable,
    });
    const lens = marketingSceneFramesFor(story.scenes, narration);
    let cursor = 0;
    for (let i = 0; i < lens.length; i++) {
      const f = Math.min(comp.durationInFrames - 1, cursor + Math.floor(lens[i] * 0.55));
      const stillPath = path.join(OUTPUT_DIR, `marketing-${baseSlug}-scene${i + 1}.jpg`);
      await renderStill({
        composition: comp,
        serveUrl: bundleLocation,
        output: stillPath,
        frame: f,
        inputProps: props,
        browserExecutable,
        imageFormat: 'jpeg',
        jpegQuality: 88,
      });
      console.log(`🖼️ Preview still: ${stillPath}`);
      cursor += lens[i];
    }
  }

  // 4. Build platform metadata & optionally publish
  const footer = `\n\n📲 Download free (no login): ${PLAY_STORE_URL}\n🌐 Web: ${SITE_URL}`;
  const tags = Array.from(new Set([...story.youtubeTags, 'AspirantArcade', 'Shorts'])).slice(0, 15);
  const hashtags = story.instagramHashtags
    .map((h) => (h.startsWith('#') ? h : `#${h.replace(/\s+/g, '')}`))
    .slice(0, 10)
    .join(' ');

  const uploadMeta: UploadMetadata = {
    youtube: {
      title: `${story.youtubeTitle.slice(0, 88)} #Shorts`,
      description: `${story.youtubeDescription}${footer}\n\n${story.commentPrompt}`,
      tags,
    },
    instagram: {
      caption: `${story.instagramCaption}\n\n💬 ${story.commentPrompt}${footer}\n\n${hashtags}`,
    },
  };
  writeFileSync(outFile.replace(/\.mp4$/, '.meta.json'), JSON.stringify({ story, uploadMeta }, null, 2));

  const links = await publish(outFile, uploadMeta, coverPath, shouldPublish, 'reel');
  flagUploadFailureForCI(links, shouldPublish);
  await notifyDiscord(feature.title, chosenSettingSpec.label, uploadMeta, links);

  // 5. Persist per-feature last-10 history
  saveMarketingHistory(store, {
    date: today,
    featureId: feature.id,
    setting: chosenSettingId,
    hookLine: story.hookLine,
    title: story.title,
    storySummary: story.storySummary,
    ...(links.youtubeUrl ? { youtubeUrl: links.youtubeUrl } : {}),
    ...(links.instagramUrl ? { instagramUrl: links.instagramUrl } : {}),
  });

  console.log(`\n✅ Marketing Reel Complete: ${outFile}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Marketing reel failed:', e);
  process.exit(1);
});
