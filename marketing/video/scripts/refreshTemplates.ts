/* eslint-disable no-console */
/**
 * Pulls new meme templates from memes.co.in into the local bank.
 *
 * Same architecture as scripts/blog_bot.ts's runPwNewsMode(): hit a public
 * source, dedup permanently by the source's own id, fetch the asset, and let
 * Gemini draft the descriptive fields — except the source here is a real JSON
 * API rather than scraped JSON-LD.
 *
 *   GET https://api.memes.co.in/api/meme-templates?page=N
 *   → { count, next, previous, results: [{ id, title, image_url, categoryname,
 *       tags_display, created_at, status, visibility, no_of_views }] }
 *
 * Chosen over memedownload.in on two counts: memes.co.in states its templates
 * are "copyright free… for personal or commercial projects", and its feed is
 * current (memedownload.in's newest post was ~6 weeks old when this was built).
 *
 * Nothing here publishes anything. Every scraped entry lands with
 * approved: false and is invisible to renderMeme.ts until a human reviews the
 * batch, sharpens the conceptShape, and flips the flag.
 *
 * Usage:  npm run templates:refresh            (2 pages, ~40 candidates)
 *         npm run templates:refresh -- --pages 5
 *
 * Env: GEMINI_API_KEYS (optional — without it, conceptShape is left as a TODO
 *      stub for the human to write, which is the honest failure mode).
 */
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const API_BASE = 'https://api.memes.co.in';
const LIST_URL = `${API_BASE}/api/meme-templates`;
const MEDIA_BASE = `${API_BASE}/media/`;

const ROOT = process.cwd();
const BANK_FILE = path.join(ROOT, 'meme_templates.json');

/** How stale the feed can get before we say so. A source going dormant is the
 * failure mode that otherwise rots silently for months. */
const STALE_AFTER_DAYS = 30;

/**
 * Categories worth pulling. Allowlist rather than blocklist — a new category
 * should be a deliberate opt-in.
 *
 * Reality check from the first real run: the newest pages skew heavily global
 * (Shrek, Palworld, Bluey, Shark Week all sit under "Memes"), with genuinely
 * Indian formats like Panchayat scattered thinly among them. The category field
 * can't separate those, so India-relevance is enforced by the human approval
 * gate, not here — which is exactly why every scraped entry lands approved:false.
 * Use --match to pull a specific format when you already know what you want.
 */
const CATEGORY_ALLOWLIST = ['memes', 'reaction', 'actor', 'bollywood', 'trending', 'funny', 'comedy', 'tv', 'movies'];

const TODO_CONCEPT_SHAPE = 'TODO: describe what kind of teaching concept this layout can carry.';

/** Titles matching these are flagged with a riskNote — film/TV stills are the
 * highest-enforcement category and shouldn't reach the YouTube brand channel
 * unreviewed. Not a block: the human decides during approval. */
const FILM_TV_HINTS = [
  'panchayat', 'dhurandhar', 'movie', 'film', 'serial', 'webseries', 'web series',
  'bollywood', 'sacred games', 'mirzapur', 'scam 1992', 'gangs of', 'kgf', 'pushpa', 'animal',
];

type ApiTemplate = {
  id: number;
  title: string;
  image_url: string;
  no_of_views?: number;
  categoryname?: string;
  tags_display?: string[];
  created_at: string;
  status?: string;
  visibility?: string;
};

type BankEntry = {
  id: string;
  sourceUrl: string;
  name: string;
  conceptShape: string;
  fitsVerticals: string[];
  riskNote?: string;
  addedOn: string;
  approved: boolean;
  retired?: boolean;
};

const VERTICALS = ['engineering', 'entrance', 'govt', 'college', 'schooling'] as const;

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function readBank(): BankEntry[] {
  try {
    const parsed = JSON.parse(readFileSync(BANK_FILE, 'utf8'));
    return Array.isArray(parsed) ? (parsed as BankEntry[]) : [];
  } catch {
    return [];
  }
}

async function fetchPage(page: number): Promise<ApiTemplate[]> {
  const res = await fetch(`${LIST_URL}?page=${page}`, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching page ${page}`);
  const data = (await res.json()) as { results?: ApiTemplate[] };
  return data.results ?? [];
}

/** Gemini drafts conceptShape + which verticals a format suits. Best-effort:
 * without it the entry still lands, with a stub the human must fill in — better
 * than silently inventing a brief nobody wrote. */
async function draftConceptShape(t: ApiTemplate): Promise<{ conceptShape: string; fitsVerticals: string[] } | null> {
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const prompt = `A meme template called "${t.title}" (category: ${t.categoryname || 'unknown'}, tags: ${(t.tags_display || []).join(', ') || 'none'}).

Aspirant Arcade is an Indian exam-prep app that makes one meme per day teaching a real exam concept (GATE/PSU, JEE/NEET, SSC/Banking, college degrees, CBSE boards).

Return JSON with:
- "conceptShape": one or two sentences describing what KIND of teaching concept this specific template's structure can carry — e.g. a common misconception, a two-way confusion between similar things, a step-order mistake, a units trap, an expectation-vs-reality gap. Be specific to this template's actual layout and mood, not generic.
- "fitsVerticals": array from ["engineering","entrance","govt","college","schooling"] — only the ones where this format's humour would genuinely land. Usually 2-4, not all 5.

Return valid JSON only.`;

  const SCHEMA = {
    type: 'OBJECT',
    properties: {
      conceptShape: { type: 'STRING' },
      fitsVerticals: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['conceptShape', 'fitsVerticals'],
  };

  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429) continue;
      const data = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      if (data.error) {
        if (/quota|exhausted|rate|RESOURCE_EXHAUSTED/i.test(data.error.message || '')) continue;
        throw new Error(data.error.message);
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      const parsed = JSON.parse(text) as { conceptShape?: string; fitsVerticals?: string[] };
      const fits = (parsed.fitsVerticals || []).filter((v) => (VERTICALS as readonly string[]).includes(v));
      if (!parsed.conceptShape || fits.length === 0) continue;
      return { conceptShape: parsed.conceptShape, fitsVerticals: fits };
    } catch (e) {
      console.warn(`[templates] Gemini draft failed for "${t.title}": ${(e as Error).message}`);
    }
  }
  return null;
}

async function main() {
  const pages = Number(arg('--pages') || 2);
  const bank = readBank();
  const known = new Set(bank.map((e) => e.id));

  console.log(`[templates] Fetching ${pages} page(s) from ${LIST_URL}...`);
  const candidates: ApiTemplate[] = [];
  for (let p = 1; p <= pages; p++) {
    try {
      candidates.push(...(await fetchPage(p)));
    } catch (e) {
      console.warn(`[templates] Page ${p} failed: ${(e as Error).message}`);
    }
  }
  if (candidates.length === 0) {
    console.error('[templates] No candidates returned — source may be down or the API shape changed. Nothing written.');
    process.exit(1);
  }

  // Recency guard — the whole point of picking this source over memedownload.in.
  const newest = candidates.map((c) => c.created_at).sort().at(-1)!;
  const ageDays = Math.floor((Date.now() - new Date(newest).getTime()) / 86_400_000);
  console.log(`[templates] Newest item: ${newest} (${ageDays}d old).`);
  if (ageDays > STALE_AFTER_DAYS) {
    console.warn(
      `[templates] ⚠ Source looks dormant — newest item is ${ageDays} days old (threshold ${STALE_AFTER_DAYS}). ` +
        'Check whether memes.co.in is still updating before trusting this bank for trend-chasing.',
    );
  }

  const match = (arg('--match') || '').trim().toLowerCase();
  const fresh = candidates.filter((t) => {
    if (known.has(`memes-${t.id}`)) return false;
    if (t.status && t.status !== 'approved') return false;
    if (t.visibility && t.visibility !== 'published') return false;
    const cat = (t.categoryname || '').toLowerCase();
    if (!CATEGORY_ALLOWLIST.some((c) => cat.includes(c))) return false;
    if (match) {
      const haystack = `${t.title} ${(t.tags_display || []).join(' ')}`.toLowerCase();
      if (!haystack.includes(match)) return false;
    }
    return true;
  });

  console.log(`[templates] ${candidates.length} fetched → ${fresh.length} new and in-category${match ? ` matching "${match}"` : ''}.`);

  const added: BankEntry[] = [];
  for (const t of fresh) {
    const id = `memes-${t.id}`;
    // image_url is a relative, space-containing path — encodeURI, not
    // encodeURIComponent (the slashes have to survive).
    const sourceUrl = MEDIA_BASE + encodeURI(t.image_url);

    // Deliberately NOT downloaded. Only one template is used per day, so
    // vendoring the whole bank meant carrying megabytes to serve a single daily
    // read. src/memeImage.ts fetches on demand (or hands the URL straight to
    // Puter, which fetches it itself). A HEAD check keeps dead links out of the
    // bank rather than discovering them at 8:30 PM.
    try {
      const head = await fetch(sourceUrl, { method: 'HEAD', signal: AbortSignal.timeout(20_000) });
      if (!head.ok) throw new Error(`HTTP ${head.status}`);
    } catch (e) {
      console.warn(`[templates] Skipping "${t.title}" — image unreachable: ${(e as Error).message}`);
      continue;
    }

    const draft = await draftConceptShape(t);
    const title = t.title.toLowerCase();
    const riskNote = FILM_TV_HINTS.some((h) => title.includes(h))
      ? 'Looks like a film/TV still — highest-enforcement category. Consider Instagram-only, off the YouTube brand channel.'
      : undefined;

    added.push({
      id,
      sourceUrl,
      name: t.title,
      conceptShape: draft?.conceptShape ?? TODO_CONCEPT_SHAPE,
      fitsVerticals: draft?.fitsVerticals ?? [...VERTICALS],
      ...(riskNote ? { riskNote } : {}),
      addedOn: new Date().toISOString().slice(0, 10),
      approved: false,
    });
    console.log(`[templates] + ${t.title}${riskNote ? ' ⚠ film/TV' : ''}${draft ? '' : ' (conceptShape needs writing)'}`);
  }

  // Backfill: entries added on a run where GEMINI_API_KEYS wasn't set still carry
  // the stub. Retry them here rather than making the human write every brief by
  // hand because of one missing env var.
  let backfilled = 0;
  for (const entry of bank) {
    if (entry.conceptShape !== TODO_CONCEPT_SHAPE || entry.retired) continue;
    const draft = await draftConceptShape({ id: 0, title: entry.name, image_url: '', created_at: entry.addedOn });
    if (!draft) continue;
    entry.conceptShape = draft.conceptShape;
    entry.fitsVerticals = draft.fitsVerticals;
    backfilled += 1;
    console.log(`[templates] ~ drafted conceptShape for "${entry.name}"`);
  }

  if (added.length === 0 && backfilled === 0) {
    console.log('[templates] Nothing new to add.');
    return;
  }

  writeFileSync(BANK_FILE, `${JSON.stringify([...bank, ...added], null, 2)}\n`);
  if (backfilled > 0) console.log(`[templates] Backfilled ${backfilled} conceptShape draft(s).`);
  if (added.length === 0) return;
  console.log(
    `\n[templates] Added ${added.length} template(s), all approved: false.\n` +
      `[templates] Next: review meme_templates.json — sharpen each conceptShape, check the ⚠ film/TV ones, then flip approved to true.\n` +
      '[templates] Nothing renders until you do.',
  );
}

main().catch((e) => {
  console.error('[templates] Fatal:', e);
  process.exit(1);
});
