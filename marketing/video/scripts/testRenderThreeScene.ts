import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderStill } from '@remotion/renderer';

const __filename = fileURLToPath(import.meta.url);
const VIDEO_ROOT = path.resolve(__filename, '../..');

async function main() {
  console.log('Bundling Remotion with enhanced ThreeCharacterScene...');
  const bundleLocation = await bundle({
    entryPoint: path.join(VIDEO_ROOT, 'src', 'index.ts'),
  });
  console.log('Bundled at:', bundleLocation);

  const outArjun = path.join(VIDEO_ROOT, 'output', 'procedural-3d-arjun.jpg');
  console.log('Rendering 3D Arjun cinematic 3/4 frame 45...');
  await renderStill({
    composition: {
      id: 'ThreeCharacterScene',
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 150,
      defaultProps: {},
      props: {
        variant: 'arjun',
        mood: 'talking',
        cameraAngle: 'cinematic_3quarter',
      },
    },
    serveUrl: bundleLocation,
    output: outArjun,
    frame: 45,
    imageFormat: 'jpeg',
  });
  console.log('Rendered 3D Arjun to:', outArjun);

  const outPriya = path.join(VIDEO_ROOT, 'output', 'procedural-3d-priya.jpg');
  console.log('Rendering 3D Priya cinematic 3/4 frame 45...');
  await renderStill({
    composition: {
      id: 'ThreeCharacterScene',
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 150,
      defaultProps: {},
      props: {
        variant: 'priya',
        mood: 'talking',
        cameraAngle: 'cinematic_3quarter',
      },
    },
    serveUrl: bundleLocation,
    output: outPriya,
    frame: 45,
    imageFormat: 'jpeg',
  });
  console.log('Rendered 3D Priya to:', outPriya);

  const outDual = path.join(VIDEO_ROOT, 'output', 'procedural-3d-dual.jpg');
  console.log('Rendering 3D Dual Arjun & Priya frame 45...');
  await renderStill({
    composition: {
      id: 'ThreeCharacterScene',
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 150,
      defaultProps: {},
      props: {
        variant: 'dual',
        mood: 'celebrating',
        cameraAngle: 'wide',
      },
    },
    serveUrl: bundleLocation,
    output: outDual,
    frame: 45,
    imageFormat: 'jpeg',
  });
  console.log('Rendered 3D Dual to:', outDual);

  process.exit(0);
}

main().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
