import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderCoverStill } from '../src/renderShared';
import type { ThumbnailCardProps } from '../src/ThumbnailCard';

const SAMPLE_PROPS: ThumbnailCardProps = {
  vertical: 'govt-exams',
  headline: 'IBPS PO 2026 Notification Out: 5,000+ Posts & High Salary Breakdown',
  hookLine: 'BREAKING VACANCY UPDATE',
  badge: 'MEGA RECRUITMENT',
  highlightStat: {
    value: '₹1,40,000/mo',
    subtext: 'Starting In-Hand Gross Pay',
    emoji: '💰',
  },
  keyPills: ['⚡ 5,314 Openings', '📝 Pattern Updated', '⏳ Apply by Oct 15'],
};

async function main() {
  console.log('🎨 Generating High-CTR Thumbnails for Landscape (16:9) and Reel (9:16)...');
  const entryPoint = path.join(process.cwd(), 'src', 'index.ts');
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  // 1. Landscape 16:9
  const landscapeOut = path.join(process.cwd(), 'output', 'sample-landscape-cover.jpg');
  await renderCoverStill(bundleLocation, 'NewsThumbnailLandscape', SAMPLE_PROPS, 0, landscapeOut);

  // 2. Reel 9:16
  const reelOut = path.join(process.cwd(), 'output', 'sample-reel-cover.jpg');
  await renderCoverStill(bundleLocation, 'NewsThumbnailReel', { ...SAMPLE_PROPS, format: 'reel' }, 0, reelOut);

  console.log('✅ Generated both thumbnails successfully!');
}

main().catch(console.error);
