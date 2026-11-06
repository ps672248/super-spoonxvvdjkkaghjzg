import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderStill } from '@remotion/renderer';

const __filename = fileURLToPath(import.meta.url);
const VIDEO_ROOT = path.resolve(__filename, '../..');

async function test() {
  console.log('Testing Three.js Remotion bundle...');
  const bundleLocation = await bundle({
    entryPoint: path.join(VIDEO_ROOT, 'src', 'index.ts'),
  });
  console.log('Bundled successfully at:', bundleLocation);

  const outPath = path.join(VIDEO_ROOT, 'output', 'test-threejs-still.jpg');
  console.log('Rendering test frame 45...');
  await renderStill({
    composition: {
      id: 'StoryPromo',
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 1310,
      defaultProps: {},
      props: {},
    },
    serveUrl: bundleLocation,
    output: outPath,
    frame: 45,
    imageFormat: 'jpeg',
  });
  console.log('Still rendered successfully to:', outPath);
}

test().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

