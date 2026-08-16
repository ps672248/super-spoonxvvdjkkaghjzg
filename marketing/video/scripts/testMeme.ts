/* eslint-disable no-console */
/**
 * Local render test for MemeCard — the meme equivalent of eyeballing a QuizCard
 * in Remotion Studio, but pointed at a meme that was actually generated.
 *
 * Generates NOTHING and publishes NOTHING. It takes the most recent meme image
 * already sitting in public/memes/generated/ and re-renders the video around it,
 * so you can check the hold length, the exam/topic tag, the watermark and the CTA
 * outro without burning an image-model call or touching Discord.
 *
 * Usage:
 *   npm run meme:test                  # newest generated meme
 *   npm run meme:test -- --id 2026-07-30-college-meme
 *
 * For interactive/scrubbing work use `npm run preview` and pick MemeCard — it
 * defaults to whatever this script last wrote to public/memes/generated/latest.png.
 */
import 'dotenv/config';
import path from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { readHistory } from '../src/memeHistory';
import { audioFlags, OUTPUT_DIR, PUBLIC_DIR, renderComposition, renderCoverStill } from '../src/renderShared';
import type { MemeCardProps } from '../src/MemeCard';

const GENERATED_DIR = path.join(PUBLIC_DIR, 'memes', 'generated');

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const VERTICALS = ['engineering', 'entrance', 'govt', 'college', 'schooling'];

/** Slug shape is `YYYY-MM-DD-<vertical>-meme`, optionally `-2`, `-3`. */
function verticalFromId(id: string): string | undefined {
  return VERTICALS.find((v) => id.includes(`-${v}-meme`));
}

function newestGeneratedId(): string | undefined {
  if (!existsSync(GENERATED_DIR)) return undefined;
  const pngs = readdirSync(GENERATED_DIR)
    .filter((f) => f.endsWith('.png') && f !== 'latest.png')
    .map((f) => ({ f, mtime: statSync(path.join(GENERATED_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return pngs[0]?.f.replace(/\.png$/, '');
}

async function main() {
  const id = (arg('--id') || newestGeneratedId() || '').trim();
  if (!id) {
    console.error(
      '[meme-test] No generated meme found in public/memes/generated/.\n' +
        '            Run `npm run meme` first (that is the only command that generates one).',
    );
    process.exit(1);
  }

  const imageFile = path.posix.join('memes', 'generated', `${id}.png`);
  if (!existsSync(path.join(PUBLIC_DIR, imageFile))) {
    console.error(`[meme-test] public/${imageFile} does not exist.`);
    process.exit(1);
  }

  // The vertical comes from the slug, not the history row: a run that aborted
  // before logging (e.g. the Discord post failed) still leaves a renderable
  // image, and defaulting its vertical would silently mislabel the test frame.
  const row = readHistory().find((r) => r.id === id);
  const props: MemeCardProps = {
    vertical: verticalFromId(id) ?? row?.vertical ?? 'engineering',
    imageFile,
    examLabel: row?.examLabel ?? (row?.examId ? row.examId.replace(/-/g, ' ').toUpperCase() : ''),
    topicLabel: row?.topicLabel ?? '',
    conceptWords: 22,
    ...audioFlags2(),
  };

  // Keeps `npm run preview` useful: Studio's MemeCard defaultProps point here.
  copyFileSync(path.join(PUBLIC_DIR, imageFile), path.join(GENERATED_DIR, 'latest.png'));

  console.log(`[meme-test] Rendering ${id} (vertical: ${props.vertical})...`);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });

  const out = await renderComposition(
    bundleLocation,
    'MemeCard',
    props as unknown as Record<string, unknown>,
    path.join(OUTPUT_DIR, `${id}-test.mp4`),
  );
  // out already ends in -test.mp4 — don't append the suffix twice.
  await renderCoverStill(bundleLocation, 'MemeCard', props as unknown as Record<string, unknown>, 30, out.replace(/\.mp4$/, '-cover.jpg'));

  console.log(`\n[meme-test] Open it: ${out}`);
  console.log('[meme-test] Nothing was published and no image-model call was made.');
}

function audioFlags2() {
  const { hasNewsBgm, hasOutro } = audioFlags();
  return { hasBgm: hasNewsBgm, hasOutro };
}

main().catch((e) => {
  console.error('[meme-test] Fatal:', e);
  process.exit(1);
});
