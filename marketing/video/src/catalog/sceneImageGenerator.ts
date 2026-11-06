/* eslint-disable no-console */
/**
 * On-Demand Scene Image Generator & Cache for the 500-Shot Catalog.
 *
 * When Gemini Director selects a shot, this engine checks:
 *   1. Does public/scenes/catalog/<sceneId>.jpg already exist?
 *      -> If YES: Returns the cached path immediately (0 delay, 0 cost).
 *   2. Does it NOT exist?
 *      -> Generates the 3D low-poly scene image on demand via Puter / Gemini,
 *         matching the official Navy Blue (#0F1E36) & Yellow (#FDC003) brand attire.
 *      -> Caches the image permanently to public/scenes/catalog/<sceneId>.jpg.
 *   3. If generation fails or is offline:
 *      -> Returns the shot's fallbackAsset safely so video rendering never breaks.
 */
import 'dotenv/config';
import path from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { getShotDefinition, type ShotDefinition } from './scenesCatalog';

const CATALOG_DIR = path.join(process.cwd(), 'public', 'scenes', 'catalog');

export interface SceneResolutionResult {
  assetRelPath: string;
  source: 'cached' | 'generated' | 'fallback';
}

/**
 * Builds the official 3D low-poly generation prompt for a catalog shot
 */
export function buildScenePrompt(shot: ShotDefinition): string {
  const isCharacter = shot.character !== 'screen';
  const characterDesc = isCharacter
    ? `The character is wearing a modern Navy Blue (#0F1E36) jacket with bright Yellow (#FDC003) accents and the Aspirant Arcade logo badge on chest.`
    : `High-tech futuristic clean UI with neon yellow and cyan glow.`;

  return `Stylized 3D low-poly render: ${shot.description}. ${characterDesc} Setting is ${shot.setting.replace(/_/g, ' ')}, camera framing is ${shot.camera.replace(/_/g, ' ')}. Warm cinematic studio lighting, 9:16 vertical portrait framing, clean premium 3D mobile game aesthetic, highly detailed low-poly geometry. No text watermarks.`;
}

/**
 * Generates an image buffer via Puter or Gemini
 */
async function generateImageBuffer(prompt: string): Promise<Buffer | null> {
  // 1. Try Puter if token available
  const puterToken = process.env.PUTER_AUTH_TOKEN;
  if (puterToken) {
    try {
      const mod = (await import('@heyputer/puter.js/src/init.cjs')) as unknown as {
        init?: (t: string) => unknown;
        default?: ((t: string) => unknown) | { init?: (t: string) => unknown };
      };
      const initFn =
        mod.init ??
        (typeof mod.default === 'function' ? mod.default : (mod.default as { init?: (t: string) => unknown })?.init);

      if (typeof initFn === 'function') {
        const puter = initFn(puterToken) as { ai: { txt2img: (o: Record<string, unknown>) => Promise<unknown> } };
        const result = await Promise.race([
          puter.ai.txt2img({
            prompt,
            model: process.env.PUTER_IMAGE_MODEL || 'gpt-image-2',
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Puter txt2img timeout after 90s')), 90_000)
          ),
        ]);

        const buf = await unwrapBuffer(result);
        if (buf) return buf;
      }
    } catch (e) {
      console.warn(`[scene-gen] Puter image call notice: ${(e as Error).message}`);
    }
  }

  // 2. Try Gemini Image API fallback
  const geminiKeys = (process.env.GEMINI_API_KEYS || process.env.VIDEO_GEMINI_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  if (geminiKeys.length > 0) {
    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
    for (const key of geminiKeys) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
            signal: AbortSignal.timeout(60_000),
          }
        );
        if (res.status === 429) continue;
        const data = (await res.json().catch(() => ({}))) as any;
        const b64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)?.inlineData?.data;
        if (b64) return Buffer.from(b64, 'base64');
      } catch (err) {
        // try next key
      }
    }
  }

  return null;
}

async function unwrapBuffer(result: unknown): Promise<Buffer | null> {
  if (Buffer.isBuffer(result)) return result;
  if (typeof result === 'string') {
    const m = /^data:image\/\w+;base64,(.+)$/s.exec(result);
    if (m) return Buffer.from(m[1], 'base64');
    if (/^https?:\/\//.test(result)) {
      const res = await fetch(result, { signal: AbortSignal.timeout(30_000) });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    }
  }
  const obj = result as Record<string, unknown> | null;
  if (obj && typeof obj === 'object') {
    if (typeof obj.src === 'string') return unwrapBuffer(obj.src);
    if (typeof obj.url === 'string') return unwrapBuffer(obj.url);
  }
  return null;
}

/**
 * Resolves a scene asset with On-Demand Generation and Caching.
 *
 * @param sceneId ID from the scenes catalog
 * @param forceRegenerate If true, ignores cache and generates fresh image
 */
export async function resolveSceneAsset(
  sceneId: string,
  forceRegenerate: boolean = false
): Promise<SceneResolutionResult> {
  mkdirSync(CATALOG_DIR, { recursive: true });
  const shotDef = getShotDefinition(sceneId);

  const targetFileName = `${sceneId}.jpg`;
  const targetFullPath = path.join(CATALOG_DIR, targetFileName);
  const targetRelPath = `scenes/catalog/${targetFileName}`;

  // 1. Check permanent disk cache
  if (!forceRegenerate && existsSync(targetFullPath)) {
    return { assetRelPath: targetRelPath, source: 'cached' };
  }

  // 2. On-Demand Generation
  console.log(`[scene-gen] 🎨 On-Demand generating shot image: "${sceneId}"...`);
  const prompt = buildScenePrompt(shotDef);

  try {
    const buffer = await generateImageBuffer(prompt);
    if (buffer && buffer.length > 1000) {
      writeFileSync(targetFullPath, buffer);
      console.log(`[scene-gen] ✅ Saved to catalog cache: ${targetRelPath}`);
      return { assetRelPath: targetRelPath, source: 'generated' };
    }
  } catch (err) {
    console.warn(`[scene-gen] Generation error for ${sceneId}:`, err);
  }

  // 3. Graceful fallback to pre-rendered base asset
  console.log(`[scene-gen] ℹ️ Using fallback asset for "${sceneId}": ${shotDef.fallbackAsset}`);
  return { assetRelPath: shotDef.fallbackAsset, source: 'fallback' };
}
