import 'dotenv/config';
import path from 'node:path';
import { copyFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, rmSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { getVideoMetadata } from '@remotion/renderer';
import { OUTPUT_DIR, renderComposition } from './renderShared';

async function main() {
  const longFormDir = path.join(process.cwd(), 'long_form');
  const tempDir = path.join(process.cwd(), 'public', 'long_form_temp');

  if (!existsSync(longFormDir)) {
    console.error(`[longform-render] Directory not found: ${longFormDir}`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const videoExtensions = ['.mp4', '.mov', '.m4v', '.mkv', '.webm'];
  const videoFiles = readdirSync(longFormDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return videoExtensions.includes(ext);
  });

  if (videoFiles.length === 0) {
    console.log(`[longform-render] No videos found to render in: ${longFormDir}`);
    process.exit(0);
  }

  console.log(`[longform-render] Found ${videoFiles.length} video(s) to render:`);
  for (const file of videoFiles) {
    console.log(`  - ${file}`);
  }

  const successes: string[] = [];
  const failures: { file: string; error: unknown }[] = [];
  let bundleLocation = '';

  try {
    // Create temporary directory in public/ for Webpack to serve the assets
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    console.log('[longform-render] Copying all source videos to public temp directory before bundling...');
    for (const file of videoFiles) {
      const srcPath = path.join(longFormDir, file);
      const destPath = path.join(tempDir, file);
      copyFileSync(srcPath, destPath);
      console.log(`  ✓ Copied ${file} to public temp folder`);
    }

    console.log('[longform-render] Bundling Remotion project...');
    bundleLocation = await bundle({ 
      entryPoint: path.join(process.cwd(), 'src', 'index.ts') 
    });

    for (const file of videoFiles) {
      const sourceVideo = path.join(longFormDir, file);
      const ext = path.extname(file);
      const baseName = path.basename(file, ext);
      const outFile = path.join(OUTPUT_DIR, `${baseName}_edited.mp4`);

      console.log(`\n[longform-render] Processing video: ${file}`);
      try {
        console.log(`[longform-render] Reading video metadata...`);
        const metadata = await getVideoMetadata(sourceVideo);
        const videoDurationInSeconds = metadata.durationInSeconds;
        console.log(`[longform-render] Video duration: ${videoDurationInSeconds}s (${Math.floor(videoDurationInSeconds! * 24)} frames @ 24fps)`);

        console.log('[longform-render] Rendering LongFormEdit composition...');
        await renderComposition(
          bundleLocation,
          'LongFormEdit',
          { 
            videoDurationInSeconds,
            videoFilename: `long_form_temp/${file}`
          },
          outFile
        );
        console.log(`[longform-render] Successfully rendered edited video to: ${outFile}`);
        successes.push(file);
      } catch (error) {
        console.error(`[longform-render] Render failed for ${file} with error:`, error);
        failures.push({ file, error });
      }
    }
  } catch (err) {
    console.error('[longform-render] Fatal error in rendering process:', err);
    process.exit(1);
  } finally {
    // Clean up temporary directory and all files inside it
    if (existsSync(tempDir)) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
        console.log('[longform-render] Cleaned up temporary public directory.');
      } catch (cleanupError) {
        console.warn('[longform-render] Warning: Failed to delete temporary directory:', cleanupError);
      }
    }
  }

  // Log final run summary
  console.log('\n=========================================');
  console.log('[longform-render] Rendering completed.');
  console.log(`Successfully rendered: ${successes.length}/${videoFiles.length}`);
  if (failures.length > 0) {
    console.log(`Failed renders: ${failures.length}`);
    for (const fail of failures) {
      console.log(`  - ${fail.file}`);
    }
    process.exit(1);
  } else {
    console.log('All renders succeeded!');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('[longform-render] Fatal error in render script:', e);
  process.exit(1);
});
