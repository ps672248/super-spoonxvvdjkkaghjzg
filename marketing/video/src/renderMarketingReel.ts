/* eslint-disable no-console */
/**
 * Renders and publishes Aspirant Arcade 3D Character Marketing Story Reels.
 *
 * Designed specifically for Instagram Reels (and YouTube Shorts):
 * Takes a key app feature or auto-generates a custom story around aspirant struggles
 * (e.g. Exam Anxiety, 10+ Arcade Games, Focus Guard, Speed Battles),
 * pairs it with a 3D low-poly character banter storyline (Arjun & Priya),
 * synthesizes Hindi voices, and publishes with high-converting captions and hashtags.
 *
 * Env:
 *   STORY_PROMPT / MARKETING_FEATURE  custom prompt, or 'focus-guard', 'speed-arena', 'auto'
 *   TARGET_PLATFORM                   instagram | youtube | both (default: instagram)
 *   PUBLISH                           'true' to upload live (default: false)
 *   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET (required if PUBLISH=true on Instagram)
 *   IG_BUSINESS_ACCOUNT_ID / IG_ACCESS_TOKEN (required if PUBLISH=true on Instagram)
 *   YT_CLIENT_SECRET / YT_UPLOAD_TOKEN (required if PUBLISH=true on YouTube)
 *   DISCORD_WEBHOOK_NEWCONTENT (optional)
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { OUTPUT_DIR, renderComposition, renderCoverStill } from './renderShared';
import { uploadInstagramReel } from './publishInstagram';
import { uploadYouTubeShort, setYouTubeThumbnail } from './publishYouTube';
import { generateMarketingStory } from './marketingStoryGenerator';
import type { StoryPromoProps } from './StoryPromo';

const SITE_URL = 'https://www.aspirant-arcade.xyz';

export interface MarketingCampaign {
  featureId: string;
  featureName: string;
  badge: string;
  headline: string;
  caption: string;
  hashtags: string[];
  youtubeTitle: string;
  youtubeDescription: string;
}

export const CAMPAIGNS: Record<string, MarketingCampaign> = {
  'focus-guard': {
    featureId: 'focus-guard',
    featureName: 'Focus Guard',
    badge: '⚡ Focus Guard Active',
    headline: 'Stop Scrolling. Start Scoring.',
    caption: `📱 "Bhai sirf 5 minute ke liye phone uthaya tha, aur 2 ghante se reels swipe ho rahi hain!" 🤦‍♂️\n\nSound familiar? Syllabus pending hai aur guilt on top!\n\nMeet Focus Guard on Aspirant Arcade 🛡️\nHar 3 reel ke baad ek exam-realistic GATE / PSU question aapki screen block karega.\nSahi answer doge tabhi scroll chalega!\n\n🎯 Doomscrolling BAND, aur daily score CHALU.\n📲 Download Aspirant Arcade on Google Play Store (Link in bio!)\n🌐 Or practice free exam mocks on https://aspirant-arcade.xyz`,
    hashtags: [
      '#AspirantArcade',
      '#FocusGuard',
      '#GATE2026',
      '#PSURecruitment',
      '#EngineeringLife',
      '#StopDoomscrolling',
      '#StudyMotivation',
      '#BTechLife',
      '#IndianStudents',
      '#Aspirants',
    ],
    youtubeTitle: 'Phone 5 min ke liye uthaya aur 2 ghante gaye? 📱 Focus Guard is Here! #Shorts',
    youtubeDescription: `Doomscrolling kills your exam prep. Focus Guard pauses your Instagram/YouTube reels and challenges you with real GATE & PSU questions.\n\nPlay Store: https://play.google.com/store/apps/details?id=xyz.aspirant_arcade.app\nWebsite: https://www.aspirant-arcade.xyz\n\n#Shorts #GATE2026 #AspirantArcade #StudyTips`,
  },
  'speed-arena': {
    featureId: 'speed-arena',
    featureName: 'Speed Arena',
    badge: '⚡ Speed Arena Live',
    headline: '1v1 Live Mock Battles',
    caption: `⚡ Boring solo mocks se thak gaye ho?\n\nChallenge your friends or all-India aspirants in live 60-second 1v1 GATE and PSU battles!\nReal-time rank updates, instant solutions, and daily leaderboards.\n\n📲 Download Aspirant Arcade on Google Play Store (Link in bio!)\n🌐 Play now: https://aspirant-arcade.xyz`,
    hashtags: [
      '#AspirantArcade',
      '#SpeedArena',
      '#GATE2026',
      '#PSUJobs',
      '#CompetitiveExams',
      '#GamifiedLearning',
      '#MockTest',
    ],
    youtubeTitle: '1v1 Live Exam Battles on Aspirant Arcade ⚡ #Shorts',
    youtubeDescription: `Real-time 1v1 mock battles for engineering and government exams.\n\nPlay Store: https://play.google.com/store/apps/details?id=xyz.aspirant_arcade.app\nWebsite: https://www.aspirant-arcade.xyz\n\n#Shorts #GATE2026 #SpeedArena`,
  },
};

async function notifyDiscord(title: string, caption: string, links: { instagramUrl?: string; youtubeUrl?: string }): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_NEWCONTENT;
  if (!webhookUrl || (!links.instagramUrl && !links.youtubeUrl)) return;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: 'Campaign', value: title, inline: true },
  ];
  if (links.instagramUrl) fields.push({ name: 'Instagram Reel', value: links.instagramUrl });
  if (links.youtubeUrl) fields.push({ name: 'YouTube Short', value: links.youtubeUrl });

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `🎬 New Marketing Reel Published: ${title}`,
          description: caption.slice(0, 200) + '...',
          color: 0xFDC003,
          fields,
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    if (!res.ok) console.error(`[marketing-reel] Discord webhook failed: ${res.status}`);
  } catch (e) {
    console.error('[marketing-reel] Discord webhook error:', e);
  }
}

export async function renderMarketingReel(
  featureOrPrompt: string = 'focus-guard',
  targetPlatform: 'instagram' | 'youtube' | 'both' = 'instagram',
  publishLive: boolean = false
) {
  const isCustomOrAuto =
    featureOrPrompt.includes(' ') ||
    featureOrPrompt === 'auto' ||
    featureOrPrompt.includes('anxi') ||
    featureOrPrompt.includes('game') ||
    featureOrPrompt.includes('stress');

  let storyProps: StoryPromoProps = { hasBgm: true };
  let fullCaption = '';
  let metaYoutube = { title: '', description: '', tags: [] as string[] };
  let featureId = 'marketing';
  let featureName = 'Marketing Story';

  if (isCustomOrAuto) {
    const promptArg = featureOrPrompt === 'auto' ? undefined : featureOrPrompt;
    const generated = await generateMarketingStory(promptArg);
    storyProps = generated.storyProps;
    fullCaption = `${generated.caption}\n\n${generated.hashtags.join(' ')}`;
    metaYoutube = {
      title: generated.youtubeTitle,
      description: generated.youtubeDescription,
      tags: generated.hashtags.map((h) => h.replace('#', '')),
    };
    featureId = generated.featureId;
    featureName = generated.featureBadge;
  } else {
    const campaign = CAMPAIGNS[featureOrPrompt] || CAMPAIGNS['focus-guard'];
    featureId = campaign.featureId;
    featureName = campaign.featureName;
    fullCaption = `${campaign.caption}\n\n${campaign.hashtags.join(' ')}`;
    metaYoutube = {
      title: campaign.youtubeTitle,
      description: campaign.youtubeDescription,
      tags: campaign.hashtags.map((h) => h.replace('#', '')),
    };
  }

  console.log('\n======================================================');
  console.log(`🎬 Rendering Marketing Story Reel: [${featureName}]`);
  console.log(`🎯 Platform Target: ${targetPlatform.toUpperCase()} | PUBLISH=${publishLive}`);
  console.log('======================================================\n');

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });

  const outFile = path.join(OUTPUT_DIR, `${today}-marketing-${featureId}.mp4`);
  const coverFile = path.join(OUTPUT_DIR, `${today}-marketing-${featureId}-cover.jpg`);
  const priyaCoverFile = path.join(OUTPUT_DIR, `${today}-marketing-${featureId}-priya.jpg`);

  // 1. Render Video
  console.log(`[marketing-reel] Rendering StoryPromo composition to: ${outFile}...`);
  await renderComposition(bundleLocation, 'StoryPromo', storyProps as unknown as Record<string, unknown>, outFile);

  // 2. Render Stills
  console.log(`[marketing-reel] Rendering cover stills...`);
  await renderCoverStill(bundleLocation, 'StoryPromo', storyProps as unknown as Record<string, unknown>, 60, coverFile);
  await renderCoverStill(bundleLocation, 'StoryPromo', storyProps as unknown as Record<string, unknown>, 280, priyaCoverFile);

  // 3. Save Metadata JSON
  const meta = {
    campaign: featureName,
    instagram: {
      caption: fullCaption,
    },
    youtube: metaYoutube,
  };
  const metaFile = outFile.replace(/\.mp4$/, '.meta.json');
  writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  console.log(`[marketing-reel] Metadata written to: ${metaFile}`);

  // 4. Publishing
  const results: { instagramUrl?: string; youtubeUrl?: string } = {};

  if (publishLive) {
    if (targetPlatform === 'instagram' || targetPlatform === 'both') {
      try {
        console.log(`[marketing-reel] 🚀 Uploading to Instagram Reels via Meta Graph API...`);
        const igId = await uploadInstagramReel(outFile, fullCaption, coverFile);
        results.instagramUrl = `https://instagram.com/reel/${igId}`;
        console.log(`[marketing-reel] ✓ Published to Instagram: ${results.instagramUrl}`);
      } catch (e) {
        console.error(`[marketing-reel] ✗ Instagram upload failed:`, e);
      }
    }

    if (targetPlatform === 'youtube' || targetPlatform === 'both') {
      try {
        console.log(`[marketing-reel] 🚀 Uploading to YouTube Shorts...`);
        const ytId = await uploadYouTubeShort(outFile, meta.youtube);
        results.youtubeUrl = `https://youtube.com/shorts/${ytId}`;
        console.log(`[marketing-reel] ✓ Published to YouTube Shorts: ${results.youtubeUrl}`);
        if (coverFile) {
          await setYouTubeThumbnail(ytId, coverFile);
        }
      } catch (e) {
        console.error(`[marketing-reel] ✗ YouTube upload failed:`, e);
      }
    }

    await notifyDiscord(featureName, fullCaption, results);
  } else {
    console.log(`[marketing-reel] PUBLISH is false — local video ready at: ${outFile}`);
  }

  console.log('\n======================================================');
  console.log(`🎉 Marketing Story Reel Render Complete!`);
  console.log(`Video: ${outFile}`);
  console.log(`Cover: ${coverFile}`);
  console.log('======================================================\n');

  return { outFile, coverFile, results };
}

// CLI runner
async function main() {
  const prompt = (process.env.STORY_PROMPT || process.env.MARKETING_FEATURE || 'focus-guard').trim();
  const platform = (process.env.TARGET_PLATFORM || 'instagram').toLowerCase() as 'instagram' | 'youtube' | 'both';
  const publish = process.env.PUBLISH === 'true';

  await renderMarketingReel(prompt, platform, publish);
}

const isDirectRun = process.argv[1]?.includes('renderMarketingReel');
if (isDirectRun) {
  main().catch((err) => {
    console.error('Fatal marketing reel error:', err);
    process.exit(1);
  });
}
