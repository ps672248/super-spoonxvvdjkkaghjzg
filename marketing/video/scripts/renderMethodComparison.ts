import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { bundle } from '@remotion/bundler';
import { renderMedia } from '@remotion/renderer';
import { DYNAMIC_DIRECTOR_DEFAULT_PROPS } from '../src/DynamicStoryDirector';

const __filename = fileURLToPath(import.meta.url);
const VIDEO_ROOT = path.resolve(__filename, '../..');
const OUTPUT_DIR = path.join(VIDEO_ROOT, 'output');

async function main() {
  console.log('======================================================');
  console.log('🎬 Rendering Side-by-Side Method 1 vs Method 2 Samples');
  console.log('======================================================\n');

  // 1. Bundle Remotion
  console.log('[1/4] Bundling Remotion video project...');
  const entryPoint = path.join(VIDEO_ROOT, 'src', 'index.ts');
  const bundleLocation = await bundle({
    entryPoint,
    onProgress: (p) => {
      if (p % 25 === 0) console.log(`[bundle] ${p}%`);
    },
  });
  console.log('[bundle] Bundled at:', bundleLocation);

  const totalFrames = DYNAMIC_DIRECTOR_DEFAULT_PROPS.shots.reduce(
    (sum, s) => sum + (s.durationFrames || 180),
    0
  );
  console.log(`Total duration: ${totalFrames} frames (~${(totalFrames / 30).toFixed(1)}s @ 30fps)\n`);

  // 2. Render Method 2: Hybrid Director Reel (Cached 3D Plates + Procedural Lip Sync)
  const method2Mp4 = path.join(OUTPUT_DIR, 'sample-method2-hybrid-director.mp4');
  const skipMethod2 = process.env.SKIP_M2 === '1' || process.env.M1_ONLY === '1';

  if (!skipMethod2) {
    console.log('[2/4] 🚀 Rendering Method 2 (Hybrid 3D Plates)...');
    await renderMedia({
      composition: {
        id: 'DynamicDirector',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: totalFrames,
        defaultProps: {},
        props: {
          ...DYNAMIC_DIRECTOR_DEFAULT_PROPS,
          renderEngine: 'hybrid',
        },
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: method2Mp4,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 100);
        if (pct % 20 === 0) console.log(`[method2] Render progress: ${pct}%`);
      },
    });
    console.log('✅ Method 2 Video ready:', method2Mp4, '\n');
  } else {
    console.log('[2/4] ⏭️ Skipping Method 2 render (cached at:', method2Mp4, ')\n');
  }

  // 3. Render Method 1: Procedural Three.js Reel (Pure 3D Code Engine)
  const method1Mp4 = path.join(OUTPUT_DIR, 'sample-method1-procedural-threejs.mp4');
  console.log('[3/4] 🚀 Rendering Method 1 (Pure 3D Three.js Code)...');
  await renderMedia({
    composition: {
      id: 'DynamicDirectorThreeJS',
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: totalFrames,
      defaultProps: {},
      props: {
        ...DYNAMIC_DIRECTOR_DEFAULT_PROPS,
        renderEngine: 'threejs',
      },
    },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: method1Mp4,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct % 20 === 0) console.log(`[method1] Render progress: ${pct}%`);
    },
  });
  console.log('✅ Method 1 Video ready:', method1Mp4, '\n');

  // 4. Extract Side-by-Side Comparison Stills
  console.log('[4/4] Extracting comparison frames via ffmpeg...');
  const timestamps = [
    { sec: 4, name: 'shot1_arjun_anxiety' },
    { sec: 12, name: 'shot2_priya_mentor' },
    { sec: 22, name: 'shot3_gameplay_screen' },
    { sec: 30, name: 'shot4_arjun_victory' },
    { sec: 38, name: 'shot5_dual_outro' },
  ];

  for (const t of timestamps) {
    const m2Out = path.join(OUTPUT_DIR, `compare_m2_${t.name}.jpg`);
    const m1Out = path.join(OUTPUT_DIR, `compare_m1_${t.name}.jpg`);

    execSync(`ffmpeg -y -ss ${t.sec} -i "${method2Mp4}" -vframes 1 -q:v 2 "${m2Out}"`, { stdio: 'ignore' });
    execSync(`ffmpeg -y -ss ${t.sec} -i "${method1Mp4}" -vframes 1 -q:v 2 "${m1Out}"`, { stdio: 'ignore' });
    console.log(`Extracted ${t.name} at ${t.sec}s`);
  }

  console.log('\n======================================================');
  console.log('🎉 Comparison Render Complete!');
  console.log('Method 1 (Pure 3D Three.js):', method1Mp4);
  console.log('Method 2 (Hybrid 3D Plates):', method2Mp4);
  console.log('======================================================');

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal render error:', err);
  process.exit(1);
});

