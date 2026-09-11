/* eslint-disable no-console */
/**
 * Renders a complete sample video locally (Reel 9:16 or Landscape 16:9)
 * containing rich media: Tables, Hero Stats, Emojis, Silent Beats, Kinetic Captions.
 *
 * Usage:
 *   npm run video:test                      (renders sample Reel 9:16)
 *   FORMAT=landscape npm run video:test     (renders sample Long-Form 16:9)
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import type { Beat, NewsRecapProps } from '../src/NewsRecap';
import { audioFlags, OUTPUT_DIR, renderComposition, renderCoverStill } from '../src/renderShared';
import { synthesizeNarration } from '../src/tts';

async function main() {
  const format = (process.env.FORMAT === 'landscape' ? 'landscape' : 'reel') as 'reel' | 'landscape';
  const isLandscape = format === 'landscape';
  const compId = isLandscape ? 'NewsRecapLandscape' : 'NewsRecap';

  console.log(`\n🎬 Rendering Sample ${isLandscape ? '16:9 Long-Form' : '9:16 Reel'} Video (with Edge-TTS Voiceover)...\n`);
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const headline = 'HPCL Executive Trainee 2026 Notification Released';
  const hookLine = '500+ PSU jobs just dropped — check eligibility now';

  const sampleBeats: Beat[] = isLandscape
    ? [
        {
          label: 'VACANCIES',
          emoji: '📊',
          text: '500+ Executive Trainee vacancies announced across Mechanical, Electrical, and Chemical engineering.',
          mediaType: 'table',
          table: {
            headers: ['Discipline', 'UR', 'OBC', 'Total'],
            rows: [
              ['Mechanical', '120', '65', '240'],
              ['Electrical', '90', '48', '180'],
              ['Chemical', '40', '22', '80'],
            ],
          },
          noAudio: false,
        },
        {
          label: 'PAY SCALE',
          emoji: '💰',
          text: 'Selected candidates receive a monthly CTC of approximately 1.4 Lakhs plus full PSU perks.',
          mediaType: 'stat_callout',
          stat: {
            value: '₹1,40,000/mo',
            subtext: 'Estimated Starting CTC + Perks',
            emoji: '💰',
          },
          noAudio: false,
        },
        {
          label: 'ELIGIBILITY',
          emoji: '🎯',
          text: 'Candidates require a full-time 4-year engineering degree with 60% marks and a valid GATE scorecard.',
          mediaType: 'checklist',
          checklist: {
            items: [
              'Full-time 4-year Engineering Degree',
              'Minimum 60% aggregate (50% for SC/ST)',
              'Valid GATE 2026 Registration in matching paper',
            ],
          },
          noAudio: false,
        },
        {
          label: 'SELECTION',
          emoji: '⚔️',
          text: 'Selection consists of GATE score shortlisting followed by Computer Based Test and Personal Interview.',
          mediaType: 'comparison',
          comparison: {
            leftTitle: 'Stage 1: CBT & Shortlist',
            leftItems: ['85% weightage on GATE score', 'Domain knowledge test', 'General aptitude evaluation'],
            rightTitle: 'Stage 2: GD & PI',
            rightItems: ['15% weightage on interview', 'Group task evaluation', 'Document verification'],
          },
          noAudio: false,
        },
        {
          label: 'EXAM PATTERN',
          emoji: '📝',
          text: 'The computer test features 150 questions split between technical core concepts and general aptitude.',
          mediaType: 'table',
          table: {
            headers: ['Section', 'Questions', 'Marks', 'Duration'],
            rows: [
              ['Technical Core', '100', '100', '120 Min'],
              ['General Aptitude', '50', '50', 'Included'],
            ],
          },
          noAudio: false,
        },
        {
          label: 'EXPERT TIP',
          emoji: '💡',
          text: 'Focus on high-weightage numerical questions and previous year GATE papers to secure top ranks.',
          mediaType: 'quote',
          quote: {
            text: 'Consistent mock practice and concept clarity in core subjects is the key to clearing PSU cutoffs.',
            author: 'Aspirant Arcade Faculty',
          },
          noAudio: false,
        },
        {
          label: 'DEADLINE',
          emoji: '🚨',
          text: 'Online application window closes on 15 March 2026. Submit early to avoid portal server rush.',
          mediaType: 'gif',
          gif: {
            stickerPreset: 'alert',
          },
          noAudio: false,
        },
      ]
    : [
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
          noAudio: false,
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
          noAudio: false,
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
          noAudio: false,
        },
        {
          label: 'DEADLINE',
          emoji: '🚨',
          text: 'Online Applications Close On 15 March 2026',
          mediaType: 'gif',
          gif: {
            stickerPreset: 'alert',
          },
          noAudio: false,
        },
      ];

  console.log(`🎙️ Synthesizing Edge-TTS voiceovers for ${sampleBeats.length} sample beats...`);
  const nHeadline = await synthesizeNarration(`${hookLine}. ${headline}`, `sample-headline-${format}`);
  const nBeats = await Promise.all(
    sampleBeats.map(async (beat, i) => {
      if (beat.noAudio || !beat.text?.trim()) return null;
      return synthesizeNarration(beat.text, `sample-beat-${format}-${i}`);
    }),
  );
  const nCta = await synthesizeNarration('Poori jaankaari ke liye Aspirant Arcade app download karein.', 'sample-cta');

  const { hasNewsBgm, hasOutro } = audioFlags();

  const newsProps: NewsRecapProps = {
    vertical: 'engineering',
    headline,
    hookLine,
    beats: sampleBeats,
    format,
    narration: {
      headline: nHeadline,
      beats: nBeats,
      cta: nCta,
    },
    fullStoryLabel: 'aspirant-arcade.xyz/blog',
    hasBgm: hasNewsBgm,
    hasOutro,
  };

  console.log('📦 Bundling Remotion project...');
  const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });

  const outFile = path.join(OUTPUT_DIR, `sample-${format}.mp4`);
  const coverPath = path.join(OUTPUT_DIR, `sample-${format}-cover.jpg`);

  console.log(`🎥 Rendering composition "${compId}" to ${outFile}...`);
  await renderComposition(bundleLocation, compId, newsProps, outFile);
  await renderCoverStill(bundleLocation, compId, newsProps, 45, coverPath);

  console.log(`\n✅ Render complete!`);
  console.log(`📹 Video File: ${outFile}`);
  console.log(`🖼️ Cover File: ${coverPath}\n`);
}

main().catch((e) => {
  console.error('Render failed:', e);
  process.exit(1);
});
