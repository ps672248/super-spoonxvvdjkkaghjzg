/**
 * The meme template bank — the quality moat for the meme bucket.
 *
 * Entries are appended by scripts/refreshTemplates.ts (scraped from
 * memes.co.in's public API) with `approved: false`, then a human reviews the
 * batch, edits the Gemini-drafted `conceptShape`, and flips `approved` to true.
 * Nothing unapproved is ever picked for a render — see activeTemplates().
 *
 * IMPORTANT: this module must stay importable from the Remotion *browser*
 * bundle, so `Vertical` is imported as a TYPE ONLY. A value import from
 * fetchContent.ts drags firebase-admin into the bundle and breaks bundle() for
 * every composition, not just MemeCard.
 */
import type { Vertical } from './fetchContent';
import templatesJson from '../meme_templates.json';

export type MemeTemplate = {
  /** Stable id — `memes-<sourceId>` for scraped entries, free-form for hand-added ones. */
  id: string;
  /**
   * Where the template image lives. Fetched on demand at render time and never
   * written to disk — only one template is used per day, so vendoring the whole
   * bank meant carrying megabytes to serve a single daily read.
   *
   * Tradeoff accepted: if the host 404s or is down, that day's meme fails. That
   * costs nothing, because this bucket has no degraded mode anyway — a failed
   * generation already exits 0 and posts nothing.
   */
  sourceUrl: string;
  /** The format's common name. Handed to the image model so it knows what it's recomposing. */
  name: string;
  /**
   * What KIND of concept this layout can carry — a common misconception, a
   * two-way confusion, a step-order mistake, a units trap. This is what stops
   * the model pasting a joke onto a layout it doesn't fit, so it's worth
   * writing properly rather than leaving Gemini's draft as-is.
   */
  conceptShape: string;
  fitsVerticals: Vertical[];
  /** Provenance note — set when the source is a film/TV still or a known rights-holder. */
  riskNote?: string;
  addedOn: string;
  /** Human gate. Scraped entries land false; nothing renders until this is true. */
  approved: boolean;
  /** Pruned templates are retired, never deleted — meme_history.json references these ids. */
  retired?: boolean;
};

/**
 * The bank lives in meme_templates.json rather than inline here so
 * scripts/refreshTemplates.ts can append to it safely (and a human can edit it)
 * without a script ever rewriting TypeScript source. The cast is the one place
 * that trust is asserted — refreshTemplates.ts is what enforces the shape on the
 * way in.
 */
export const MEME_TEMPLATES: MemeTemplate[] = templatesJson as MemeTemplate[];

/** Approved, un-retired templates that suit this vertical. */
export function activeTemplates(vertical: Vertical): MemeTemplate[] {
  return MEME_TEMPLATES.filter((t) => t.approved && !t.retired && t.fitsVerticals.includes(vertical));
}

export function templateById(id: string): MemeTemplate | undefined {
  return MEME_TEMPLATES.find((t) => t.id === id);
}

/**
 * Every candidate for the day, best first: least-recently-used, ties broken by
 * approval rate so the formats that keep landing get picked more often. `usage`
 * comes from meme_history.json (see src/memeHistory.ts templateStats()).
 *
 * Deterministic given the same inputs — a re-run on the same day walks the same
 * order, which keeps a failed render cheap to retry.
 *
 * Returns the whole ranked list rather than one pick because the bank stores URLs
 * instead of vendored art, and memes.co.in's media host is measurably flaky: a
 * 10-URL probe returned 5 timeouts at 20s and latencies from 322ms to 19.5s on the
 * ones that did land, with the same URL succeeding and failing minutes apart. So
 * renderMeme.ts walks this list until one template's art actually loads — a flaky
 * host costs a different template, not a skipped day.
 */
export function rankTemplates(
  vertical: Vertical,
  usage: Record<string, { lastUsedAt?: string; approvedCount: number; rejectedCount: number }> = {},
): MemeTemplate[] {
  return [...activeTemplates(vertical)].sort((a, b) => {
    const ua = usage[a.id];
    const ub = usage[b.id];
    // never-used templates first
    const la = ua?.lastUsedAt ?? '';
    const lb = ub?.lastUsedAt ?? '';
    if (la !== lb) return la < lb ? -1 : 1;
    return approvalRate(ub) - approvalRate(ua);
  });
}

/** The single best candidate. Kept for callers that only want the pick itself. */
export function pickTemplate(
  vertical: Vertical,
  usage: Record<string, { lastUsedAt?: string; approvedCount: number; rejectedCount: number }> = {},
): MemeTemplate | undefined {
  return rankTemplates(vertical, usage)[0];
}

function approvalRate(u?: { approvedCount: number; rejectedCount: number }): number {
  if (!u) return 1; // unproven templates get the benefit of the doubt
  const total = u.approvedCount + u.rejectedCount;
  return total === 0 ? 1 : u.approvedCount / total;
}
