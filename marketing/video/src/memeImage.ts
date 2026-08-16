/**
 * Stage 2 of 2: renders the meme image, placing the EXACT caption text that
 * memeScript.ts already wrote and validated.
 *
 * This model does not write jokes. It used to, and that was the bug: a single
 * call that had to invent the comedy and spell it produced typos and captions
 * crammed onto templates that couldn't carry them. See memeScript.ts for the
 * reasoning behind the split. Everything here is deliberately mechanical —
 * "place this string there, add nothing".
 *
 * Provider is swappable via MEME_IMAGE_PROVIDER:
 *   puter  — default. $0 within the account allowance, and exposes gpt-image-2,
 *            the best text renderer available (its quoted accuracy is for
 *            rendering supplied text, which is now exactly what we ask of it).
 *            Node behaviour is undocumented: txt2img returns an HTMLImageElement
 *            in the browser, which doesn't exist here, so unwrapImage() below
 *            handles several shapes.
 *   gemini — fallback. gemini-2.5-flash-image, ~$0.039/image, reuses the
 *            GEMINI_API_KEYS ring. No free tier on any Google image model.
 *
 * Unlike quizContent.ts there is NO degraded mode: a meme with misspelled or
 * wrong text is worse than no post, so total failure returns null and
 * renderMeme.ts exits without rendering.
 *
 * Env: PUTER_AUTH_TOKEN, MEME_IMAGE_PROVIDER (puter|gemini), GEMINI_API_KEYS,
 *      GEMINI_IMAGE_MODEL (default gemini-2.5-flash-image), PUTER_IMAGE_MODEL
 *      (default gpt-image-2).
 */
import type { MemeTemplate } from './memeTemplates';
import type { MemeScript } from './memeScript';

/**
 * A placement instruction, not a creative brief. The only judgement left to the
 * image model is typography and where exactly a line sits on the art — the words
 * themselves are fixed, so there is nothing here for it to reword or misspell
 * that we didn't hand it.
 */
export function buildMemePrompt(args: { template: MemeTemplate; script: MemeScript }): string {
  const { template, script } = args;
  // Placement and content are on SEPARATE lines with explicit delimiters. When
  // they shared a line (`1. bottom caption → "…"`), the model rendered the whole
  // line onto the image — numbering, the arrow, the placement word and the quotes
  // all became part of the caption. "Verbatim" and inline scaffolding cannot
  // coexist.
  const slots = script.panels
    .map(
      (p, i) =>
        `--- TEXT BLOCK ${i + 1} ---\nGoes here: ${p.where}\nRender exactly these words:\n${p.text}\n--- END TEXT BLOCK ${i + 1} ---`,
    )
    .join('\n\n');
  const wordCount = script.panels.map((p) => p.text).join(' ').trim().split(/\s+/).length;

  return `Edit the attached meme template ("${template.name}") by adding caption text to it. The image is otherwise finished — you are typesetting, not illustrating.

${slots}

ONLY the words on the "Render exactly these words" lines go on the image. Everything else above is an instruction to you and must NOT appear: no block numbers, no dashes or markers, no "TEXT BLOCK", no "Goes here", no placement words, no arrows, and no quotation marks around the caption unless the caption itself contains them.

THE TEXT IS FINAL. Copy it character for character, including the Hinglish spellings — they are intentional. Do not reword it, do not translate it, do not correct it, do not shorten it, do not add a single word of your own. Exactly ${wordCount} words go on this image and no others.

TYPESETTING:
- Standard meme lettering: bold, high contrast, legible on a phone at thumbnail size. Use whatever the template's own convention is — impact-style caps over the art, or plain text in the white bar if the template has one.
- Put each line where its placement says. If a line belongs to a person, put it next to that person.
- Keep it inside the frame with a little margin. Nothing clipped, nothing running off an edge.

DO NOT:
- Do not add any other text — no labels, no watermark, no signature, no "QUESTION"/"ANSWER"/"TIP" headings, no emoji that isn't in the text above.
- Do not add diagrams, icons, arrows, boxes, panels, banners, or a footer strip.
- Do not redraw, restyle, recolour, or regenerate the characters or background. Same picture, plus text.
- Do not leave a band of empty space at the top or bottom — the video overlays its own exam/topic tags and logo at the frame edges.
- Do not crop the composition. Keep portrait or square framing; this is posted as a vertical Reel.

Output: the edited image only.`;
}

/** Puter's txt2img returns an HTMLImageElement in the browser. In Node the shape is
 * undocumented, so accept every plausible form and fail loudly rather than silently. */
async function unwrapImage(result: unknown): Promise<Buffer> {
  if (typeof result === 'string') return fromDataUrlOrUrl(result);
  if (Buffer.isBuffer(result)) return result;

  const obj = result as Record<string, unknown> | null;
  if (obj && typeof obj === 'object') {
    if (typeof obj.src === 'string') return fromDataUrlOrUrl(obj.src);
    if (typeof obj.url === 'string') return fromDataUrlOrUrl(obj.url);
    if (typeof (obj as { arrayBuffer?: unknown }).arrayBuffer === 'function') {
      return Buffer.from(await (obj as unknown as Blob).arrayBuffer());
    }
  }
  throw new Error(`Unrecognised image result shape: ${Object.prototype.toString.call(result)}`);
}

async function fromDataUrlOrUrl(s: string): Promise<Buffer> {
  const m = /^data:image\/\w+;base64,(.+)$/s.exec(s);
  if (m) return Buffer.from(m[1], 'base64');
  if (/^https?:\/\//.test(s)) {
    const res = await fetch(s, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`Image fetch failed: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error('Image result string was neither a data URL nor an http URL');
}

async function generateViaPuter(prompt: string, templateRef: string): Promise<Buffer> {
  const token = process.env.PUTER_AUTH_TOKEN;
  if (!token) throw new Error('PUTER_AUTH_TOKEN not set');

  // Dynamic + untyped: the package ships no types, and this path is only
  // reached when the provider is actually selected.
  const mod = (await import('@heyputer/puter.js/src/init.cjs')) as unknown as {
    init?: (t: string) => unknown;
    default?: ((t: string) => unknown) | { init?: (t: string) => unknown };
  };
  const initFn =
    mod.init ??
    (typeof mod.default === 'function' ? mod.default : (mod.default as { init?: (t: string) => unknown })?.init);
  if (typeof initFn !== 'function') throw new Error('Could not resolve init() from @heyputer/puter.js');

  const puter = initFn(token) as { ai: { txt2img: (o: Record<string, unknown>) => Promise<unknown> } };
  // input_image takes a public URL directly, so this provider never downloads
  // the template at all — Puter's side fetches it.
  //
  // Wrapped in a race because txt2img takes no AbortSignal: without this a stalled
  // call hangs the Actions job until the workflow's own limit, hours later, having
  // published nothing. Generous — image editing genuinely takes a minute or two.
  const result = await Promise.race([
    puter.ai.txt2img({
      prompt,
      input_image: templateRef,
      model: process.env.PUTER_IMAGE_MODEL || 'gpt-image-2',
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Puter txt2img timed out after 5 min')), 5 * 60_000),
    ),
  ]);
  return unwrapImage(result);
}

async function generateViaGemini(prompt: string, templateBase64: string, mime: string): Promise<Buffer> {
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) throw new Error('GEMINI_API_KEYS not set');
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

  let lastError = 'no keys tried';
  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mime, data: templateBase64 } }] }],
        }),
        signal: AbortSignal.timeout(120_000), // image gen is slower than text
      });
      if (res.status === 429) { lastError = 'HTTP 429'; continue; } // quota — next key
      const data = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[];
      };
      if (data.error) {
        if (/quota|exhausted|rate|RESOURCE_EXHAUSTED/i.test(data.error.message || '')) { lastError = data.error.message!; continue; }
        throw new Error(data.error.message || `HTTP ${res.status}`);
      }
      const b64 = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
      if (!b64) { lastError = 'response contained no image part'; continue; }
      return Buffer.from(b64, 'base64');
    } catch (e) {
      lastError = (e as Error).message;
      console.warn(`[meme-bot] Gemini image call failed: ${lastError}`);
    }
  }
  throw new Error(`All Gemini keys failed — ${lastError}`);
}

/**
 * Returns the finished meme as a PNG/JPEG buffer, or null if generation failed.
 * Null means "post nothing today" — there is no acceptable degraded meme.
 *
 * `script` comes from writeMemeScript() and is already validated; `templateImage`
 * is fetched once by renderMeme.ts and shared with the script stage, so the
 * template is downloaded at most once per run (and not at all on the Puter path,
 * which takes the URL and fetches server-side).
 */
export async function generateMemeImage(args: {
  template: MemeTemplate;
  script: MemeScript;
  templateImage: { base64: string; mime: string };
}): Promise<{ buffer: Buffer; prompt: string; provider: string } | null> {
  const provider = (process.env.MEME_IMAGE_PROVIDER || 'puter').trim().toLowerCase();
  const prompt = buildMemePrompt(args);
  const { sourceUrl, name } = args.template;

  try {
    console.log(`[meme-bot] Rendering meme via ${provider} onto template "${name}"...`);
    const buffer =
      provider === 'gemini'
        ? await generateViaGemini(prompt, args.templateImage.base64, args.templateImage.mime)
        : await generateViaPuter(prompt, sourceUrl);

    console.log(`[meme-bot] Image generated (${Math.round(buffer.length / 1024)} KB).`);
    return { buffer, prompt, provider };
  } catch (e) {
    console.error(`[meme-bot] Image generation failed via ${provider}: ${(e as Error).message}`);
    return null;
  }
}
