import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { OUTPUT_DIR, renderComposition, renderCoverStill, audioFlags } from '../src/renderShared';
import type { Beat, NewsRecapProps } from '../src/NewsRecap';

const __filename = fileURLToPath(import.meta.url);
const VIDEO_ROOT = path.resolve(__filename, '../..');

async function main() {
  console.log('\n======================================================');
  console.log('🚀 Re-Rendering All 3 Sample Video Types for Aspirant Arcade');
  console.log('======================================================\n');

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Bundle Remotion project
  console.log('📦 Bundling Remotion project from:', path.join(VIDEO_ROOT, 'src', 'index.ts'));
  const bundleLocation = await bundle({ entryPoint: path.join(VIDEO_ROOT, 'src', 'index.ts') });

  // ---------------------------------------------------------
  // SAMPLE 3: Single Frame Job Recap for Instagram (NO character)
  // ---------------------------------------------------------
  console.log('\n------------------------------------------------------');
  console.log('🎥 1/3: Rendering Single Frame Job Recap (No character, Clean)...');
  console.log('------------------------------------------------------');
  const singleFrameOut = path.join(OUTPUT_DIR, 'sample-single-frame-job.mp4');
  const singleFrameCover = path.join(OUTPUT_DIR, 'sample-single-frame-job-cover.jpg');

  await renderComposition(
    bundleLocation,
    'SingleFrameJob',
    {
      orgName: 'ISRO Recruitment 2026',
      badge: '320 Vacancies • Freshers Eligible',
      role: "Scientist / Engineer 'SC'",
      salary: '₹1,56,000 / mo',
      salarySub: 'Pay Level 10 + Central DA, HRA & Medical Perks',
      branches: ['Mechanical', 'Electronics', 'Computer Science', 'Electrical', 'Civil'],
      deadline: '28 MARCH 2026',
      examDate: 'MAY 2026 (CBT)',
      selectionProcess: 'Valid GATE Score / Written Test + Interview',
    },
    singleFrameOut
  );
  await renderCoverStill(bundleLocation, 'SingleFrameJob', {}, 30, singleFrameCover);
  console.log(`✅ Single Frame Job Reel rendered: ${singleFrameOut}`);

  // ---------------------------------------------------------
  // SAMPLE 2: News Recap Reel (WITH character anchor!)
  // ---------------------------------------------------------
  console.log('\n------------------------------------------------------');
  console.log('🎥 2/3: Rendering News Recap Reel (WITH Character Anchor)...');
  console.log('------------------------------------------------------');
  const newsOut = path.join(OUTPUT_DIR, 'sample-reel.mp4');
  const newsCover = path.join(OUTPUT_DIR, 'sample-reel-cover.jpg');

  const sampleBeats: Beat[] = [
    {
      label: 'VACANCIES',
      emoji: '📊',
      text: 'Branch-wise vacancy distribution across key disciplines',
      mediaType: 'table',
      table: {
        headers: ['Discipline', 'UR', 'OBC', 'Total'],
        rows: [
          ['Mechanical', '120', '65', '240'],
          ['Electrical', '90', '48', '180'],
          ['Chemical', '40', '22', '80'],
        ],
      },
      noAudio: true,
    },
    {
      label: 'SALARY',
      emoji: '💰',
      text: 'Executive Trainee Pay Scale ₹50,000 to ₹1,60,000',
      mediaType: 'stat_callout',
      stat: {
        value: '₹1,40,000/mo',
        subtext: 'Estimated Starting CTC + Perks',
        emoji: '💰',
      },
      noAudio: true,
    },
    {
      label: 'ELIGIBILITY',
      emoji: '🎯',
      text: 'BE/BTech With 60% Marks & Valid GATE 2026 Score',
      mediaType: 'checklist',
      checklist: {
        items: [
          'Full-time 4-year Engineering Degree',
          'Minimum 60% aggregate (50% for SC/ST)',
          'Valid GATE 2026 Registration',
        ],
      },
      noAudio: true,
    },
    {
      label: 'DEADLINE',
      emoji: '🚨',
      text: 'Online Applications Close On 15 March 2026',
      mediaType: 'quote',
      quote: {
        text: 'Do not wait for the last date to avoid portal rush.',
        author: 'Official Notification',
      },
      noAudio: true,
    },
  ];

  const { hasNewsBgm, hasOutro } = audioFlags();
  const newsProps: NewsRecapProps = {
    vertical: 'engineering',
    headline: 'HPCL Executive Trainee 2026 Notification Released',
    hookLine: '500+ PSU jobs just dropped — check eligibility now',
    beats: sampleBeats.map((b) => ({ ...b, noAudio: false })),
    format: 'reel',
    fullStoryLabel: 'aspirant-arcade.xyz/blog',
    hasBgm: hasNewsBgm,
    hasOutro,
    narration: {
      headline: { src: 'audio/narration/news_headline.mp3', durationSec: 9.07 },
      beats: [
        { src: 'audio/narration/news_beat0.mp3', durationSec: 7.92 },
        { src: 'audio/narration/news_beat1.mp3', durationSec: 7.92 },
        { src: 'audio/narration/news_beat2.mp3', durationSec: 8.33 },
        { src: 'audio/narration/news_beat3.mp3', durationSec: 9.17 },
      ],
      cta: { src: 'audio/narration/news_cta.mp3', durationSec: 5.86 },
    },
  };

  await renderComposition(bundleLocation, 'NewsRecap', newsProps, newsOut);
  await renderCoverStill(bundleLocation, 'NewsRecap', newsProps, 45, newsCover);
  await renderCoverStill(bundleLocation, 'NewsRecap', newsProps, 340, path.join(OUTPUT_DIR, 'extracted-news-frame.jpg'));
  console.log(`✅ News Recap Reel (with Character & Voice) rendered: ${newsOut}`);

  // ---------------------------------------------------------
  // SAMPLE 1: Marketing Story Reel (WITH Character Speaking + Hindi Audio)
  // ---------------------------------------------------------
  console.log('\n------------------------------------------------------');
  console.log('🎥 3/3: Rendering Marketing Story Reel (WITH Speaking Character + Audio)...');
  console.log('------------------------------------------------------');
  const storyOut = path.join(OUTPUT_DIR, 'sample-marketing-story.mp4');
  const storyCover = path.join(OUTPUT_DIR, 'sample-marketing-story-cover.jpg');

  await renderComposition(
    bundleLocation,
    'StoryPromo',
    {
      hasBgm: true,
    },
    storyOut
  );
  await renderCoverStill(bundleLocation, 'StoryPromo', {}, 60, storyCover);
  await renderCoverStill(bundleLocation, 'StoryPromo', {}, 280, path.join(OUTPUT_DIR, 'sample-marketing-story-priya.jpg'));
  console.log(`✅ Marketing Story Reel (with Audio) rendered: ${storyOut}`);

  console.log('\n======================================================');
  console.log('🎉 ALL 3 SAMPLE VIDEOS RE-RENDERED WITH ALL FIXES!');
  console.log('======================================================');
  console.log(`1. Marketing Story Reel:  ${storyOut}`);
  console.log(`2. News Recap Reel:       ${newsOut}`);
  console.log(`3. Single Frame Job Reel: ${singleFrameOut}\n`);
}

main().catch((err) => {
  console.error('Fatal render error:', err);
  process.exit(1);
});
