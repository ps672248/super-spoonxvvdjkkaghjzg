import { getVideoMetadata } from '@remotion/renderer';
import path from 'path';

async function main() {
  const videoPath = path.join(process.cwd(), 'long_form', 'प्राचीन_भारत_की_एक_यात्रा.mp4');
  console.log('Inspecting video at:', videoPath);
  try {
    const metadata = await getVideoMetadata(videoPath);
    console.log('Video Metadata:', JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Error getting metadata:', error);
  }
}

main();
