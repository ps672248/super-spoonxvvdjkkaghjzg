/* eslint-disable no-console */
/**
 * Dynamic Video Script Renderer (Pure-Code Characters, Scenes, UI & SFX)
 *
 * Renders any news, experience, strategy, or marketing video from a dynamic
 * JSON script, built-in preset, or live Gemini topic prompt.
 *
 * Usage:
 *   npm run render:dynamic                                       (renders default dynamic script)
 *   npm run render:dynamic -- --script scripts/sample-dynamic-script.json
 *   npm run render:dynamic -- --preset experience
 *   npm run render:dynamic -- --preset strategy --format landscape
 *   npm run render:dynamic -- --topic "GATE 2026 Virtual Calculator Hacks" --mode strategy --vertical engineering
 */
import 'dotenv/config';
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import {
  cadenceForClip,
  DYNAMIC_SCRIPT_PRESETS,
  generateDynamicScriptWithGemini,
  scriptToNewsRecapProps,
  type DynamicVideoMode,
  type DynamicVideoScript,
} from '../src/dynamicScript';
import {
  beatFramesFor,
  headlineFramesFor,
  type NewsNarration,
} from '../src/NewsRecap';
import {
  audioFlags,
  OUTPUT_DIR,
  PUBLIC_DIR,
  renderComposition,
  renderCoverStill,
  resolveBrowserExecutable,
} from '../src/renderShared';
import { synthesizeNarration } from '../src/tts';
import type { Vertical } from '../src/fetchContent';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

async function loadDynamicScript(args: Record<string, string | boolean>): Promise<DynamicVideoScript> {
  const format = (args.format === 'landscape' ? 'landscape' : 'reel') as 'reel' | 'landscape';

  if (typeof args.script === 'string') {
    const abs = path.resolve(process.cwd(), args.script);
    if (!existsSync(abs)) {
      throw new Error(`Dynamic script file not found: ${abs}`);
    }
    const parsed = JSON.parse(readFileSync(abs, 'utf8')) as DynamicVideoScript;
    return { ...parsed, format: args.format ? format : parsed.format ?? 'reel' };
  }

  if (typeof args.topic === 'string') {
    const mode = (typeof args.mode === 'string' ? args.mode : 'news') as DynamicVideoMode;
    const vertical = (typeof args.vertical === 'string' ? args.vertical : 'engineering') as Vertical;
    console.log(`🤖 Generating dynamic video script via Gemini for topic: "${args.topic}" (${mode}/${vertical})...`);
    return generateDynamicScriptWithGemini(args.topic, mode, vertical, format);
  }

  const presetKey = (typeof args.preset === 'string' ? args.preset : 'experience') as DynamicVideoMode;
  const preset = DYNAMIC_SCRIPT_PRESETS[presetKey] ?? DYNAMIC_SCRIPT_PRESETS.experience;
  return {
    ...preset,
    format,
    ...(typeof args.vertical === 'string' ? { vertical: args.vertical as Vertical } : {}),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const script = await loadDynamicScript(args);
  const format = script.format === 'landscape' ? 'landscape' : 'reel';
  const compId = format === 'landscape' ? 'NewsRecapLandscape' : 'NewsRecap';

  console.log(`\n🎬 Dynamic Video Script Renderer`);
  console.log(`   Mode:      ${script.mode.toUpperCase()}`);
  console.log(`   Vertical:  ${script.vertical}`);
  console.log(`   Format:    ${format} (${compId})`);
  console.log(`   Scene:     ${script.scene || 'auto'}`);
  console.log(`   Character: ${script.character || 'auto'}`);
  console.log(`   Headline:  ${script.headline}\n`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Ensure pure-code SFX WAVs + check available music beds
  const flags = audioFlags();
  console.log(
    `🔊 Audio layers: BGM=${flags.hasNewsBgm} Outro=${flags.hasOutro} ProceduralSFX=${flags.hasSfx}`,
  );

  // 2. Synthesize TTS narration clips & compute per-frame lip-sync cadences
  const headlineSpeech = script.spokenHeadline?.trim() || `${script.hookLine}. ${script.headline}`;
  const nHeadline = await synthesizeNarration(headlineSpeech, `dyn-head-${script.mode}`);

  const spokenBeatLines: (string | null)[] = [];
  const nBeats = await Promise.all(
    script.beats.map(async (beat, i) => {
      if (beat.noAudio) {
        spokenBeatLines[i] = null;
        return null;
      }
      const line = beat.spokenText?.trim() || beat.text?.trim();
      if (!line) {
        spokenBeatLines[i] = null;
        return null;
      }
      spokenBeatLines[i] = line;
      return synthesizeNarration(line, `dyn-beat-${script.mode}-${i}`);
    }),
  );

  const ctaSpeech =
    script.ctaSpeech?.trim() || 'Free mock tests aur daily notes ke liye Aspirant Arcade app download karein.';
  const nCta = await synthesizeNarration(ctaSpeech, `dyn-cta-${script.mode}`);

  const narration: NewsNarration = {
    headline: nHeadline,
    beats: nBeats,
    cta: nCta,
    headlineCadence: cadenceForClip(nHeadline, headlineSpeech, PUBLIC_DIR),
    beatCadences: nBeats.map((clip, i) => cadenceForClip(clip, spokenBeatLines[i] ?? null, PUBLIC_DIR)),
    ctaCadence: cadenceForClip(nCta, ctaSpeech, PUBLIC_DIR),
  };

  console.log(
    `🎙️ Narration ready — headline:${Boolean(nHeadline)} beats:${nBeats.map(Boolean).join(',')} cta:${Boolean(nCta)}`,
  );

  // 3. Convert dynamic script to Remotion NewsRecap props
  const newsProps = scriptToNewsRecapProps(script, narration, flags);

  // 4. Bundle and Render MP4 + Cover
  console.log('📦 Bundling Remotion composition...');
  const bundleLocation = await bundle({ entryPoint: path.join(process.cwd(), 'src', 'index.ts') });

  const baseName = slugify(script.id || `${script.mode}-${script.headline}`) || `dynamic-${script.mode}`;
  const outFile =
    typeof args.out === 'string'
      ? path.resolve(process.cwd(), args.out)
      : path.join(OUTPUT_DIR, `dynamic-${baseName}-${format}.mp4`);
  const coverPath = outFile.replace(/\.mp4$/, '-cover.jpg');
  const scriptDumpPath = outFile.replace(/\.mp4$/, '.script.json');

  writeFileSync(scriptDumpPath, JSON.stringify(script, null, 2));

  console.log(`🎥 Rendering "${compId}" → ${outFile}`);
  await renderComposition(bundleLocation, compId, newsProps, outFile);
  await renderCoverStill(bundleLocation, compId, newsProps, 45, coverPath);

  // Optional keyframe preview stills for quick visual inspection
  if (args.stills) {
    const browserExecutable = resolveBrowserExecutable();
    const headlineLen = headlineFramesFor(narration);
    const beatLens = beatFramesFor(script.beats, narration);
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compId,
      inputProps: newsProps,
      browserExecutable,
    });

    const sampleFrames: Array<{ name: string; frame: number }> = [
      { name: 'frame-01-headline', frame: Math.min(composition.durationInFrames - 1, Math.floor(headlineLen * 0.6)) },
    ];
    let cursor = headlineLen;
    beatLens.forEach((len, idx) => {
      sampleFrames.push({
        name: `frame-0${idx + 2}-beat${idx}`,
        frame: Math.min(composition.durationInFrames - 1, cursor + Math.floor(len * 0.5)),
      });
      cursor += len;
    });
    sampleFrames.push({
      name: `frame-99-outro`,
      frame: Math.min(composition.durationInFrames - 1, cursor + 22),
    });

    for (const sf of sampleFrames) {
      const stillOut = path.join(OUTPUT_DIR, `${baseName}-${sf.name}.jpg`);
      await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: stillOut,
        frame: sf.frame,
        inputProps: newsProps,
        browserExecutable,
        imageFormat: 'jpeg',
        jpegQuality: 88,
      });
      console.log(`🖼️ Preview still: ${stillOut}`);
    }
  }

  console.log(`\n✅ Dynamic Video Ready!`);
  console.log(`📹 Video:  ${outFile}`);
  console.log(`🖼️ Cover:  ${coverPath}`);
  console.log(`📜 Script: ${scriptDumpPath}\n`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Dynamic render failed:', e);
  process.exit(1);
});
