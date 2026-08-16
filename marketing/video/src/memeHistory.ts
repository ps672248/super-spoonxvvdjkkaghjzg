/**
 * Approval + engagement log for the meme bucket — the load-bearing safety
 * mechanism, not bookkeeping.
 *
 * The image model bakes caption text into the picture, and nothing downstream
 * can correct a typo or a joke that didn't land. So every generation is written
 * here with `approved: null` and stays unpublished until a human rules on it.
 *
 * `rejectReason` is what turns review into a feedback loop rather than a chore:
 *   text-error    dominating → switch MEME_IMAGE_PROVIDER (see src/memeImage.ts)
 *   not-funny     clustering on one template → retire that template
 *   wrong-concept dominating → the conceptShape briefs need rewriting
 *
 * Node-only. Never import this from a composition — it touches fs and would
 * break the Remotion browser bundle.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type RejectReason = 'text-error' | 'not-funny' | 'wrong-concept';

export type MemeRecord = {
  id: string;
  runAt: string;
  templateId: string;
  templateName: string;
  vertical: string;
  /** Syllabus topic the meme was built from (src/memeTopics.ts). Drives topic
   * rotation and lets `usedMisconceptions` be scoped to the same topic. */
  topicId?: string;
  /** Optional since topic-first generation replaced the question draw — rows
   * written before that still carry it. */
  examId?: string;
  /** The on-screen tag labels, persisted so scripts/testMeme.ts can re-render an
   * identical frame without re-querying Firestore. */
  examLabel?: string;
  topicLabel?: string;
  /** Path to the generated meme, relative to marketing/video/. */
  imagePath: string;
  /** The exact prompt used — so a bad batch can be diagnosed without re-running. */
  prompt: string;
  provider: string;
  /** What the script stage wrote (src/memeScript.ts). Stored separately from the
   * image so a reject can be attributed: if `captions` read well and the picture
   * is wrong, that's a render failure (switch provider); if the captions
   * themselves are weak, the writer prompt is what needs work. */
  captions?: string[];
  /** The misconception the joke aimed at, and the writer's one-line mechanic. Makes
   * `not-funny` vs `wrong-concept` separable months later without opening the PNG. */
  misconception?: string;
  mechanic?: string;
  /** The plain-language claim the meme rests on. The model supplies this itself
   * under topic-first generation, so it's the row you check when a `wrong-concept`
   * reject comes in. */
  fact?: string;
  approved: boolean | null;
  rejectReason?: RejectReason;
  youtubeUrl?: string;
  instagramUrl?: string;
  engagement?: { reach?: number; saves?: number; sends?: number; retentionPct?: number };
};

const HISTORY_FILE = path.join(process.cwd(), 'meme_history.json');

/** Unbounded on purpose — unlike analytics-history.json this is the audit trail
 * for what got published, and per-template stats degrade if old rows are dropped. */
export function readHistory(): MemeRecord[] {
  if (!existsSync(HISTORY_FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
    return Array.isArray(parsed) ? (parsed as MemeRecord[]) : [];
  } catch (e) {
    console.warn(`[meme-bot] meme_history.json unreadable (${(e as Error).message}) — starting a fresh log.`);
    return [];
  }
}

function writeHistory(rows: MemeRecord[]): void {
  writeFileSync(HISTORY_FILE, `${JSON.stringify(rows, null, 2)}\n`);
}

/** Newest-first, matching analytics-history.json's convention.
 *
 * Rejects duplicate ids outright: updateMemeRecord() patches the first match, so
 * a duplicate would make every later row with that id permanently unreviewable —
 * and they'd all point at whichever image was written last. renderMeme.ts already
 * disambiguates via uniqueSlug(); this is the backstop. */
export function appendRecord(record: MemeRecord): void {
  const rows = readHistory();
  if (rows.some((r) => r.id === record.id)) {
    throw new Error(`meme_history.json already has a record with id "${record.id}" — refusing to write a duplicate.`);
  }
  rows.unshift(record);
  writeHistory(rows);
  console.log(`[meme-bot] Logged ${record.id} to meme_history.json (approved: null — awaiting review).`);
}

export function updateMemeRecord(id: string, patch: Partial<MemeRecord>): MemeRecord | undefined {
  const rows = readHistory();
  const row = rows.find((r) => r.id === id);
  if (!row) return undefined;
  Object.assign(row, patch);
  writeHistory(rows);
  return row;
}

/** Last-used timestamp per syllabus topic, feeding rankTopics() in memeTopics.ts
 * so the rotation moves through the syllabus instead of resampling favourites. */
export function topicUsage(): Record<string, string> {
  const usage: Record<string, string> = {};
  for (const row of readHistory()) {
    if (!row.topicId) continue;
    if (!usage[row.topicId] || row.runAt > usage[row.topicId]) usage[row.topicId] = row.runAt;
  }
  return usage;
}

/** Misconceptions already used on a topic. Fed back into the writer prompt —
 * without it the model returns its single favourite joke for that topic every
 * time it comes round (there are only so many famous traps per topic). */
export function usedMisconceptions(topicId: string): string[] {
  return readHistory()
    .filter((r) => r.topicId === topicId && r.misconception)
    .map((r) => r.misconception!);
}

/** Per-template usage + approval, feeding pickTemplate() in memeTemplates.ts. */
export function templateStats(): Record<string, { lastUsedAt?: string; approvedCount: number; rejectedCount: number }> {
  const stats: Record<string, { lastUsedAt?: string; approvedCount: number; rejectedCount: number }> = {};
  for (const row of readHistory()) {
    const s = (stats[row.templateId] ??= { approvedCount: 0, rejectedCount: 0 });
    if (!s.lastUsedAt || row.runAt > s.lastUsedAt) s.lastUsedAt = row.runAt;
    if (row.approved === true) s.approvedCount += 1;
    if (row.approved === false) s.rejectedCount += 1;
  }
  return stats;
}

/** Approval rate across rows a human has actually ruled on — pending rows are
 * excluded so an unreviewed backlog can't drag the number down. Nothing gates on
 * this; it's here for the analytics report and for deciding when
 * MEME_PUBLISH=true is worth flipping. */
export function approvalSummary(): { reviewed: number; approved: number; pending: number; rate: number } {
  const rows = readHistory();
  const approved = rows.filter((r) => r.approved === true).length;
  const rejected = rows.filter((r) => r.approved === false).length;
  const reviewed = approved + rejected;
  return {
    reviewed,
    approved,
    pending: rows.filter((r) => r.approved === null).length,
    rate: reviewed === 0 ? 0 : approved / reviewed,
  };
}
