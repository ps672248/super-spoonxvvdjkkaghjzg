/* eslint-disable no-console */
/**
 * Renders and publishes Aspirant Arcade 100+ Shot Director Marketing Reels.
 *
 * Driven by the 100+ Shot Catalog:
 * - Gemini selects the scenes from the catalog (Arjun/Priya poses, expressions, gameplay).
 * - Synthesizes Hindi neural audio voices for every shot.
 * - Assembles the dynamic timeline in Remotion (DynamicDirector composition).
 * - Generates high-CTR cover stills and publishing metadata.
 *
 * Env:
 *   STORY_PROMPT / MARKETING_FEATURE  prompt or theme
 *   TARGET_PLATFORM                   instagram | youtube | both (default: instagram)
 *   PUBLISH                           'true' to upload live (default: false)
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { OUTPUT_DIR, renderComposition, renderCoverStill } from './renderShared';
import { uploadInstagramReel } from './publishInstagram';
import { uploadYouTubeShort, setYouTubeThumbnail } from './publishYouTube';
import { generateDirectorStory } from './directorStoryGenerator';

export async function renderDirectorReel(
  featureOrPrompt: string = 'exam-anxiety-games',
  targetPlatform: 'instagram' | 'youtube' | 'both' = 'instagram',
  publishLive: boolean = false
) {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const storyResult = await generateDirectorStory(featureOrPrompt);
  const { featureId, featureBadge, campaignTitle, directorProps, caption, hashtags, youtubeTitle, youtubeDescription } = storyResult;

  console.log('\n======================================================');
  console.log(`🎬 Rendering Director Storyboard: [${featureBadge}]`);
  console.log(`Campaign: "${campaignTitle}"`);
  console.log(`🎯 Platform Target: ${targetPlatform.toUpperCase()} | PUBLISH=${publishLive}`);
  console.log('======================================================\n');

  // Bundle Remotion Project
  console.log('[director-reel] Bundling Remotion video project...');
  const entryPoint = path.join(process.cwd(), 'src', 'index.ts');
  const bundleLocation = await bundle({
    entryPoint,
    onProgress: (p) => {
      if (p % 25 === 0) console.log(`[bundle] ${p}%`);
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const outFile = path.join(OUTPUT_DIR, `${today}-director-${featureId}.mp4`);
  const coverFile = path.join(OUTPUT_DIR, `${today}-director-${featureId}-cover.jpg`);
  const priyaCoverFile = path.join(OUTPUT_DIR, `${today}-director-${featureId}-priya.jpg`);

  // 1. Render Video
  console.log(`[director-reel] Rendering DynamicDirector composition to: ${outFile}...`);
  await renderComposition(bundleLocation, 'DynamicDirector', directorProps as unknown as Record<string, unknown>, outFile);

  // 2. Render Stills
  console.log(`[director-reel] Rendering cover stills...`);
  await renderCoverStill(bundleLocation, 'DynamicDirector', directorProps as unknown as Record<string, unknown>, 60, coverFile);
  await renderCoverStill(bundleLocation, 'DynamicDirector', directorProps as unknown as Record<string, unknown>, 260, priyaCoverFile);

  // 3. Save Metadata JSON
  const meta = {
    campaign: featureBadge,
    title: campaignTitle,
    shotsCount: directorProps.shots.length,
    totalDurationFrames: directorProps.totalDurationFrames,
    instagram: {
      caption,
    },
    youtube: {
      title: youtubeTitle,
      description: youtubeDescription,
      tags: hashtags.map((h) => h.replace(/^#/, '')),
    },
  };
  const metaFile = path.join(OUTPUT_DIR, `${today}-director-${featureId}.meta.json`);
  writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`[director-reel] Metadata written to: ${metaFile}`);

  if (!publishLive) {
    console.log(`[director-reel] PUBLISH is false — local video ready at: ${outFile}\n`);
    console.log('======================================================');
    console.log(`🎉 Director Marketing Storyboard Render Complete!`);
    console.log(`Video: ${outFile}`);
    console.log(`Cover: ${coverFile}`);
    console.log('======================================================\n');
    return { videoPath: outFile, coverPath: coverFile, metaFile };
  }

  // 4. Live Publishing Pipeline
  if (targetPlatform === 'instagram' || targetPlatform === 'both') {
    try {
      console.log('[director-reel] 📸 Publishing to Instagram Reels...');
      const igId = await uploadInstagramReel(outFile, caption, coverFile);
      console.log(`[director-reel] ✅ Instagram Reel published! ID: ${igId}`);
    } catch (e) {
      console.error('[director-reel] ✗ Instagram upload failed:', e);
    }
  }

  if (targetPlatform === 'youtube' || targetPlatform === 'both') {
    try {
      console.log('[director-reel] ▶️ Publishing to YouTube Shorts...');
      const ytVideoId = await uploadYouTubeShort(outFile, meta.youtube);
      console.log(`[director-reel] ✅ YouTube Short published! Video ID: ${ytVideoId}`);
      if (coverFile) {
        await setYouTubeThumbnail(ytVideoId, coverFile);
      }
    } catch (e) {
      console.error('[director-reel] ✗ YouTube upload failed:', e);
    }
  }

  return { videoPath: outFile, coverPath: coverFile, metaFile };
}

// Direct CLI invocation
const isDirectRun = process.argv[1]?.includes('renderDirectorReel');
if (isDirectRun) {
  const prompt = process.env.STORY_PROMPT || process.env.MARKETING_FEATURE || 'exam-anxiety-games';
  const platform = (process.env.TARGET_PLATFORM as any) || 'instagram';
  const publish = process.env.PUBLISH === 'true';

  renderDirectorReel(prompt, platform, publish)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[director-reel] Error rendering director reel:', err);
      process.exit(1);
    });
}
