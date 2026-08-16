import path from 'node:path';
import { existsSync, appendFileSync } from 'node:fs';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { BGM_FILE, OUTRO_FILE, QUIZ_BGM_FILE, REVEAL_FILE, TICK_FILE } from './audio';
import type { UploadMetadata } from './metadata';
import { setYouTubeThumbnail, uploadYouTubeShort } from './publishYouTube';
import { uploadInstagramReel } from './publishInstagram';

export const OUTPUT_DIR = path.join(process.cwd(), 'output');
export const PUBLIC_DIR = path.join(process.cwd(), 'public');
export const PUBLISH = process.env.PUBLISH === 'true';

/** Audio is optional — only pass the has* flags true if the file was actually added to public/. */
export function audioFlags() {
  return {
    hasQuizBgm: existsSync(path.join(PUBLIC_DIR, QUIZ_BGM_FILE)),
    hasNewsBgm: existsSync(path.join(PUBLIC_DIR, BGM_FILE)),
    hasTick: existsSync(path.join(PUBLIC_DIR, TICK_FILE)),
    hasReveal: existsSync(path.join(PUBLIC_DIR, REVEAL_FILE)),
    hasOutro: existsSync(path.join(PUBLIC_DIR, OUTRO_FILE)),
  };
}

export async function renderComposition(bundleLocation: string, compositionId: string, inputProps: Record<string, unknown>, outFile: string): Promise<string> {
  const composition = await selectComposition({ serveUrl: bundleLocation, id: compositionId, inputProps });
  let lastPercent = -1;
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outFile,
    inputProps,
    onProgress: ({ progress }) => {
      const percent = Math.round(progress * 100);
      if (percent !== lastPercent) {
        lastPercent = percent;
        if (percent % 5 === 0 || percent === 100) {
          console.log(`[video] Rendering ${compositionId}: ${percent}%`);
        }
      }
    },
  });
  console.log(`[video] Rendered: ${outFile}`);
  return outFile;
}

/**
 * Renders a single frame of the composition as a JPEG cover/thumbnail image —
 * used as the YouTube custom thumbnail and the Instagram Reel cover so the
 * feed/grid shows the designed headline card instead of a random video frame.
 * Best-effort: returns undefined on failure (a missing cover must never block
 * the video itself from publishing).
 */
export async function renderCoverStill(
  bundleLocation: string, compositionId: string, inputProps: Record<string, unknown>, frame: number, outFile: string,
): Promise<string | undefined> {
  try {
    const composition = await selectComposition({ serveUrl: bundleLocation, id: compositionId, inputProps });
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: outFile,
      frame: Math.min(frame, composition.durationInFrames - 1),
      inputProps,
      imageFormat: 'jpeg',
      jpegQuality: 90, // YouTube caps thumbnails at 2MB — 1080×1920 @ q90 lands well under
    });
    console.log(`[video] Cover still rendered: ${outFile}`);
    return outFile;
  } catch (e) {
    console.warn('[video] Cover still render failed (continuing without a custom cover):', e);
    return undefined;
  }
}

export type PublishResult = { youtubeUrl?: string; instagramUrl?: string };

/** Uploads to both platforms independently — one failing doesn't block the other,
 * and never throws (a bad upload shouldn't fail the whole render run). Returns
 * whatever links were obtained so callers can surface/persist them.
 * `coverPath`, when given, becomes the YouTube custom thumbnail and the
 * Instagram Reel cover — both best-effort on top of an already-successful upload. */
export async function publish(
  filePath: string,
  meta: UploadMetadata,
  coverPath?: string,
  /** Overrides the shared PUBLISH env gate. The meme bucket has its own switch
   * (MEME_PUBLISH) and must not depend on the quiz/news reels' PUBLISH being on
   * — or off. Omit to keep the default behaviour. */
  gate: boolean = PUBLISH,
): Promise<PublishResult> {
  if (!gate) {
    console.log(`[video] PUBLISH not set — leaving ${path.basename(filePath)} as a local/artifact file only.`);
    return {};
  }

  const links: PublishResult = {};

  try {
    const id = await uploadYouTubeShort(filePath, meta.youtube);
    links.youtubeUrl = `https://youtube.com/shorts/${id}`;
    console.log(`[video] ✓ YouTube Shorts: ${links.youtubeUrl}`);
    if (coverPath) {
      // Separate try/catch inside setYouTubeThumbnail — a thumbnail rejection
      // (e.g. channel not phone-verified for custom thumbnails) must not mark
      // the whole upload failed; the video is already live at this point.
      await setYouTubeThumbnail(id, coverPath);
    }
  } catch (e) {
    console.error(`[video] ✗ YouTube upload failed for ${path.basename(filePath)}:`, e);
  }

  try {
    const url = await uploadInstagramReel(filePath, meta.instagram.caption, coverPath);
    links.instagramUrl = url;
    console.log(`[video] ✓ Instagram Reel published: ${url}`);
  } catch (e) {
    console.error(`[video] ✗ Instagram upload failed for ${path.basename(filePath)}:`, e);
  }

  return links;
}

/**
 * Lets blog-bot.yml / video-bot.yml skip their "upload rendered video as
 * workflow artifact" step when every requested platform actually succeeded —
 * the artifact is only meant as a recovery copy for a failed upload, not a
 * permanent backup of every successful post.
 *
 * Only ever appends "true", never "false": a single job step can render+
 * publish multiple videos (blog-bot.yml spawns one renderNewsRecap.ts child
 * per article), each writing to the same $GITHUB_OUTPUT file independently.
 * GitHub Actions resolves an output to whichever matching line appears last,
 * so if a later, fully-successful video wrote "false" it would silently mask
 * an earlier sibling's real failure. Writing only "true" on failure — and
 * leaving the output unset otherwise — means any failure anywhere in the job
 * step wins, regardless of write order.
 */
export function flagUploadFailureForCI(links: PublishResult, gate: boolean = PUBLISH): void {
  if (gate && links.youtubeUrl && links.instagramUrl) return; // fully succeeded — nothing to flag
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) appendFileSync(outputFile, 'upload_failed=true\n');
}
