/* eslint-disable no-console */
/**
 * Second half of the meme approval flow — runs after a human clicks Approve or
 * Reject in Discord.
 *
 *   meme-bot.yml  render → stage to Cloudinary → Discord card with buttons
 *      ↓ (button press → website/app/api/discord/interactions marks Firestore)
 *   meme-publish.yml → THIS FILE
 *      approved → download the staged mp4 → YouTube (+Instagram) → clean up
 *      rejected → clean up only
 *
 * Cloudinary is always cleaned, either way. The whole point of staging is that
 * nothing lingers once a decision exists.
 *
 * Rejection is not a failure: it exits 0. A rejected meme is the system working.
 *
 * Usage:  MEME_ID=2026-07-29-college-meme npm run meme:publish
 *
 * Env:
 *   MEME_ID                    which approval doc to act on (required)
 *   FIREBASE_SERVICE_ACCOUNT   Firestore access
 *   CLOUDINARY_*               staged-asset download + cleanup
 *   YT_CLIENT_SECRET/YT_UPLOAD_TOKEN, IG_*   see src/publishYouTube.ts / publishInstagram.ts
 *
 * There is no MEME_PUBLISH gate on this path: clicking Approve in Discord IS the
 * decision, and a second switch would silently swallow an explicit human
 * approval.
 */
import 'dotenv/config';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cleanupStaged, notifyPublished, readApproval, updateApproval } from './memeApproval';
import { updateMemeRecord } from './memeHistory';
import { OUTPUT_DIR, publish } from './renderShared';

async function download(url: string, outFile: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} for ${url}`);
  writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
  return outFile;
}

async function main() {
  const id = (process.env.MEME_ID || '').trim();
  if (!id) {
    console.error('[meme-publish] MEME_ID is required.');
    process.exit(1);
  }

  const doc = await readApproval(id);
  if (!doc) {
    console.error(`[meme-publish] No approval record for "${id}".`);
    process.exit(1);
  }

  if (doc.status === 'pending') {
    console.warn(`[meme-publish] "${id}" is still pending — nothing decided yet. Exiting without touching it.`);
    return;
  }

  if (doc.status === 'rejected') {
    console.log(`[meme-publish] "${id}" was rejected (${doc.rejectReason || 'no reason given'}). Cleaning up, publishing nothing.`);
    await cleanupStaged(doc.staged);
    await updateApproval(id, { staged: { videoUrl: '', videoPublicId: '' } });
    updateMemeRecord(id, { approved: false, rejectReason: doc.rejectReason as never });
    return; // exit 0 — a rejection is the system working, not a failure
  }

  // ── approved ────────────────────────────────────────────────────────────────
  // No gate here. Approving in Discord IS the decision — a second switch would
  // silently swallow an explicit human approval, which is worse than either
  // publishing or failing loudly.
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`[meme-publish] "${id}" approved — pulling the staged copy back down.`);
  const videoPath = await download(doc.staged.videoUrl, path.join(OUTPUT_DIR, `${id}.mp4`));
  const coverPath = doc.staged.coverUrl
    ? await download(doc.staged.coverUrl, path.join(OUTPUT_DIR, `${id}-cover.jpg`)).catch(() => undefined)
    : undefined;

  // publish() handles YouTube and Instagram independently — one failing never
  // blocks the other, and it never throws. `true` forces the gate: the human
  // already approved, so the shared PUBLISH env has no say here.
  const links = await publish(videoPath, doc.meta, coverPath, true);

  // Cleanup runs regardless: if the upload failed, the artifact is the recovery
  // copy, and leaving the staged asset up doesn't help anyone.
  await cleanupStaged(doc.staged);

  await updateApproval(id, {
    ...links,
    staged: { videoUrl: '', videoPublicId: '' },
    decidedAt: doc.decidedAt || new Date().toISOString(),
  });
  updateMemeRecord(id, { approved: true, ...links });

  await notifyPublished({
    id,
    vertical: doc.vertical,
    examLabel: doc.examLabel,
    topicLabel: doc.topicLabel,
    templateName: doc.templateName,
    title: doc.meta.youtube.title,
    ...links,
  });

  if (!links.youtubeUrl && !links.instagramUrl) {
    console.error('[meme-publish] Approved but nothing published — check the upload errors above.');
    process.exit(1);
  }
  console.log(`[meme-publish] Done. ${links.youtubeUrl ? `YouTube: ${links.youtubeUrl} ` : ''}${links.instagramUrl ? `Instagram: ${links.instagramUrl}` : ''}`);
}

main().catch((e) => {
  console.error('[meme-publish] Fatal:', e);
  process.exit(1);
});
