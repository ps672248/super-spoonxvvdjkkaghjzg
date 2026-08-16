/**
 * Discord approval flow for the meme bucket.
 *
 * The render job is a GitHub Actions run — it finishes and exits, so it cannot
 * sit waiting for a human. Approval is therefore split across two runs:
 *
 *   meme-bot.yml     render → stage to Cloudinary → post to Discord with buttons
 *      ↓ (human clicks Approve / Reject in Discord)
 *   website/app/api/discord/interactions  → marks Firestore → dispatches ↓
 *   meme-publish.yml  publish to YouTube (+IG) if approved → always clean up Cloudinary
 *
 * Cloudinary is the staging host because Discord needs a URL it can play inline
 * and Meta needs a public `video_url` anyway — the same account and folder
 * pattern src/publishInstagram.ts already uses. Every staged asset is deleted
 * once a decision lands, approve or reject.
 *
 * Firestore (`meme_approvals`) carries the decision state rather than
 * meme_history.json, because the website — which handles the button press — can
 * reach Firestore but not the repo. meme_history.json is reconciled afterwards
 * by publishApproved.ts.
 *
 * NOTE ON DISCORD: this posts via the BOT token, not a webhook. Plain channel
 * webhooks cannot carry interactive components — only application-owned messages
 * can, and the buttons are the entire point.
 *
 * Env: CLOUDINARY_*, FIREBASE_SERVICE_ACCOUNT, DISCORD_BOT_TOKEN,
 *      DISCORD_MEME_CHANNEL_ID.
 */
import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import { getFirebaseApp } from './firebaseAdmin';
import type { UploadMetadata } from './metadata';

const CLOUDINARY_FOLDER = 'aspirant-arcade/meme-approvals';
const COLLECTION = 'meme_approvals';

export type ApprovalDecision = 'pending' | 'approved' | 'rejected';

export type StagedMeme = {
  videoUrl: string;
  videoPublicId: string;
  coverUrl?: string;
  coverPublicId?: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: requireEnv('CLOUDINARY_API_KEY'),
    api_secret: requireEnv('CLOUDINARY_API_SECRET'),
  });
}

async function upload(filePath: string, resourceType: 'video' | 'image'): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(filePath, { resource_type: resourceType, folder: CLOUDINARY_FOLDER });
  return { url: result.secure_url, publicId: result.public_id };
}

/** Best-effort by design — a stuck staged asset is a few KB of clutter, not a
 * reason to fail a decision that has already been made. */
export async function cleanupStaged(staged: Partial<StagedMeme>): Promise<void> {
  configureCloudinary();
  const targets: [string | undefined, 'video' | 'image'][] = [
    [staged.videoPublicId, 'video'],
    [staged.coverPublicId, 'image'],
  ];
  for (const [publicId, resourceType] of targets) {
    if (!publicId) continue;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`[meme-approval] Cloudinary cleaned: ${publicId}`);
    } catch (e) {
      console.warn(`[meme-approval] Cloudinary cleanup failed for ${publicId}:`, e);
    }
  }
}

function db() {
  getFirebaseApp();
  return admin.firestore();
}

export type ApprovalDoc = {
  id: string;
  status: ApprovalDecision;
  rejectReason?: string;
  vertical: string;
  examLabel?: string;
  topicLabel?: string;
  templateId: string;
  templateName: string;
  riskNote?: string;
  /** The script stage's one-line account of why this is meant to be funny
   * (src/memeScript.ts). Shown on the card so a reviewer can tell "the joke was
   * wrong" from "the joke was right and the picture botched it" — which is the
   * difference between the Not funny and Typo buttons. */
  mechanic?: string;
  /** The plain-language claim the joke rests on. Since topic-first generation the
   * model supplies the fact itself rather than inheriting a verified one from
   * question_bank, so this is the line to read before clicking Approve — the
   * punchline is Hinglish and compressed, and checking it means decoding the joke
   * first. This says it straight. */
  fact?: string;
  meta: UploadMetadata;
  staged: StagedMeme;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
};

export async function readApproval(id: string): Promise<ApprovalDoc | null> {
  const snap = await db().collection(COLLECTION).doc(id).get();
  return snap.exists ? (snap.data() as ApprovalDoc) : null;
}

export async function updateApproval(id: string, patch: Partial<ApprovalDoc>): Promise<void> {
  await db().collection(COLLECTION).doc(id).set(patch, { merge: true });
}

/** Posts the review card. Four buttons: one approve, three rejects — Discord
 * components can't collect free text, and a reason is what makes the log
 * diagnostic rather than a tally (see src/memeHistory.ts). */
/**
 * The repo carries five DISCORD_WEBHOOK_* vars, so pasting a webhook URL in here
 * is the obvious mistake — and it produces a bare `404: Not Found` from Discord
 * that says nothing about the cause. Catch it at the source instead.
 *
 * Same check as channelIdProblem() in frontend/functions/src/discord.ts, which
 * guards DISCORD_SUPPORT_CHANNEL_ID. Duplicated because Cloud Functions deploy as
 * their own package and can't import from here — keep the two in sync by hand.
 *
 * This one THROWS where the functions version returns false, and that asymmetry is
 * deliberate: a support alert without its button is still a useful alert, but a
 * meme card without Approve/Reject is unreviewable, so the run aborts and
 * stageForApproval() cleans up the staged Cloudinary asset rather than orphaning it.
 */
function requireChannelId(): string {
  const raw = requireEnv('DISCORD_MEME_CHANNEL_ID').trim();
  if (/^\d{17,20}$/.test(raw)) return raw;
  const hint = /discord(app)?\.com\/api\/webhooks\//.test(raw)
    ? 'That is a webhook URL. Buttons can only be posted by a bot, so this needs a channel id instead — ' +
      'right-click the channel → Copy Channel ID (Developer Mode on).'
    : 'Expected a numeric channel id (17-20 digits).';
  throw new Error(`DISCORD_MEME_CHANNEL_ID is not a channel id. ${hint}`);
}

async function postToDiscord(doc: ApprovalDoc): Promise<void> {
  const token = requireEnv('DISCORD_BOT_TOKEN');
  const channelId = requireChannelId();

  const fields = [
    { name: 'Vertical', value: doc.vertical, inline: true },
    { name: 'Template', value: doc.templateName, inline: true },
    ...(doc.examLabel ? [{ name: 'Exam', value: doc.examLabel, inline: true }] : []),
    ...(doc.topicLabel ? [{ name: 'Topic', value: doc.topicLabel, inline: true }] : []),
    ...(doc.riskNote ? [{ name: '⚠ Risk', value: doc.riskNote.slice(0, 1024), inline: false }] : []),
    // Fact first: it's the one field that can make this a hard reject regardless
    // of how good the joke is.
    ...(doc.fact ? [{ name: '✅ Check this claim', value: doc.fact.slice(0, 1024), inline: false }] : []),
    ...(doc.mechanic ? [{ name: 'Intended joke', value: doc.mechanic.slice(0, 1024), inline: false }] : []),
    { name: 'YouTube title', value: doc.meta.youtube.title.slice(0, 1024), inline: false },
  ];

  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // The URL goes in content, not just the embed — Discord only renders an
      // inline player for a bare link on its own line.
      content: `🧠 **Meme awaiting review** — \`${doc.id}\`\n${doc.staged.videoUrl}`,
      embeds: [
        {
          title: doc.id,
          url: doc.staged.videoUrl,
          color: 0xfdc003,
          fields,
          ...(doc.staged.coverUrl ? { thumbnail: { url: doc.staged.coverUrl } } : {}),
          footer: { text: 'Approve publishes to YouTube. Reject deletes it. Either way the staged copy is removed.' },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            { type: 2, style: 3, label: 'Approve', custom_id: `meme-approve:${doc.id}` },
            { type: 2, style: 4, label: 'Typo', custom_id: `meme-reject:${doc.id}:text-error` },
            { type: 2, style: 4, label: 'Not funny', custom_id: `meme-reject:${doc.id}:not-funny` },
            { type: 2, style: 4, label: 'Wrong concept', custom_id: `meme-reject:${doc.id}:wrong-concept` },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    // 404 here is almost never a missing endpoint — Discord returns it for
    // channels the bot cannot *see*, rather than a 403.
    const hint =
      res.status === 404
        ? ` — check the bot is in the server and has View Channel + Send Messages on channel ${channelId}`
        : '';
    throw new Error(`Discord post failed: HTTP ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}${hint}`);
  }
  console.log(`[meme-approval] Posted ${doc.id} to Discord for review.`);
}

/**
 * Posts a "this went live" card to the same channel. Best-effort: the meme is
 * already published by the time this runs, so a Discord hiccup must not make the
 * run look failed.
 */
export async function notifyPublished(args: {
  id: string;
  vertical: string;
  examLabel?: string;
  topicLabel?: string;
  templateName: string;
  title: string;
  youtubeUrl?: string;
  instagramUrl?: string;
}): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_MEME_CHANNEL_ID;
  if (!token || !channelId) {
    console.warn('[meme-approval] DISCORD_BOT_TOKEN / DISCORD_MEME_CHANNEL_ID not set — skipping the published notification.');
    return;
  }

  const both = args.youtubeUrl && args.instagramUrl;
  const links = [
    args.youtubeUrl ? `▶️ YouTube: ${args.youtubeUrl}` : '▶️ YouTube: ❌ failed',
    args.instagramUrl ? `📸 Instagram: ${args.instagramUrl}` : '📸 Instagram: ❌ failed',
  ].join('\n');

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `${both ? '✅' : '⚠️'} **Meme published** — \`${args.id}\``,
        embeds: [
          {
            title: args.title,
            // amber, not green, when only one platform took it — a half-publish
            // needs to look different at a glance
            color: both ? 0x22c55e : 0xf59e0b,
            description: links,
            fields: [
              { name: 'Vertical', value: args.vertical, inline: true },
              { name: 'Template', value: args.templateName, inline: true },
              ...(args.examLabel ? [{ name: 'Exam', value: args.examLabel, inline: true }] : []),
              ...(args.topicLabel ? [{ name: 'Topic', value: args.topicLabel, inline: true }] : []),
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}`);
    console.log('[meme-approval] Posted the published notification to Discord.');
  } catch (e) {
    console.warn(`[meme-approval] Published notification failed (the meme is already live): ${(e as Error).message}`);
  }
}

/**
 * Stages a rendered meme for human review. Throws on failure — unlike a missing
 * cover or a flaky upload, a meme nobody can review is a dead end, and failing
 * loudly beats a silent backlog of unreviewable renders.
 */
export async function stageForApproval(args: {
  id: string;
  videoPath: string;
  coverPath?: string;
  meta: UploadMetadata;
  vertical: string;
  examLabel?: string;
  topicLabel?: string;
  templateId: string;
  templateName: string;
  riskNote?: string;
  mechanic?: string;
  fact?: string;
}): Promise<ApprovalDoc> {
  configureCloudinary();
  console.log('[meme-approval] Staging to Cloudinary...');
  const video = await upload(args.videoPath, 'video');
  const cover = args.coverPath ? await upload(args.coverPath, 'image').catch(() => undefined) : undefined;

  const doc: ApprovalDoc = {
    id: args.id,
    status: 'pending',
    vertical: args.vertical,
    ...(args.examLabel ? { examLabel: args.examLabel } : {}),
    ...(args.topicLabel ? { topicLabel: args.topicLabel } : {}),
    templateId: args.templateId,
    templateName: args.templateName,
    ...(args.riskNote ? { riskNote: args.riskNote } : {}),
    ...(args.mechanic ? { mechanic: args.mechanic } : {}),
    ...(args.fact ? { fact: args.fact } : {}),
    meta: args.meta,
    staged: {
      videoUrl: video.url,
      videoPublicId: video.publicId,
      ...(cover ? { coverUrl: cover.url, coverPublicId: cover.publicId } : {}),
    },
    createdAt: new Date().toISOString(),
  };

  await db().collection(COLLECTION).doc(doc.id).set(doc);

  try {
    await postToDiscord(doc);
  } catch (e) {
    // The staged copy would otherwise sit in Cloudinary forever with nobody
    // able to act on it.
    await cleanupStaged(doc.staged);
    await db().collection(COLLECTION).doc(doc.id).delete();
    throw e;
  }

  return doc;
}
