/**
 * Uploads a rendered reel to Instagram via the Meta Graph API.
 *
 * The Graph API's Reels endpoint needs a public `video_url` (it fetches the
 * file itself — no raw multipart upload), so this stages the MP4 to Cloudinary
 * first (same account already used elsewhere in this project — see
 * backend/src/index.js's /cloudinarySignature route and
 * frontend/src/services/cloudinary.ts), gets back a `secure_url`, runs the
 * container → publish flow, then deletes the staged copy — Cloudinary is just
 * a fetch source for Meta's servers, not a permanent home for the video.
 *
 * One-time manual setup (cannot be automated — needs your Meta business assets):
 *   1. Meta for Developers → create an app, add the Instagram Graph API product.
 *   2. Convert/link the target Instagram account to a Business account, linked
 *      to a Facebook Page you manage.
 *   3. Generate a long-lived Page access token with instagram_content_publish
 *      + pages_read_engagement permissions.
 *   4. Get the IG Business Account id (Graph API Explorer: GET /me/accounts →
 *      then GET /{page-id}?fields=instagram_business_account).
 *   5. Add secrets: IG_BUSINESS_ACCOUNT_ID, IG_ACCESS_TOKEN, plus the existing
 *      CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 *      (same ones backend/ already uses — no new Cloudinary account needed).
 */
import { v2 as cloudinary } from 'cloudinary';

const GRAPH_API_VERSION = 'v21.0';
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 120_000;
const CLOUDINARY_FOLDER = 'aspirant-arcade/reels-staging';

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

async function stageToCloudinary(filePath: string, resourceType: 'video' | 'image'): Promise<{ url: string; publicId: string }> {
  configureCloudinary();
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: resourceType,
    folder: CLOUDINARY_FOLDER,
  });
  return { url: result.secure_url, publicId: result.public_id };
}

/** Best-effort — a cleanup failure shouldn't fail an otherwise-successful publish. */
async function cleanupCloudinary(publicId: string, resourceType: 'video' | 'image'): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (e) {
    console.warn(`[instagram] Cloudinary cleanup failed for ${publicId}:`, e);
  }
}

async function createContainer(videoUrl: string, caption: string, coverUrl?: string): Promise<string> {
  const igUserId = requireEnv('IG_BUSINESS_ACCOUNT_ID');
  const token = requireEnv('IG_ACCESS_TOKEN');

  const params = new URLSearchParams({ media_type: 'REELS', video_url: videoUrl, caption, access_token: token });
  // Custom cover image for the reel (shows on the profile grid + feed tile).
  // Like video_url, Meta fetches it from a public URL — the staged Cloudinary copy.
  if (coverUrl) params.set('cover_url', coverUrl);

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${igUserId}/media`, {
    method: 'POST',
    body: params,
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(`IG container creation failed: ${JSON.stringify(data)}`);
  return data.id as string;
}

async function waitUntilReady(creationId: string): Promise<void> {
  const token = requireEnv('IG_ACCESS_TOKEN');
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${creationId}?fields=status_code&access_token=${token}`,
    );
    const data = await res.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error(`IG container processing failed: ${JSON.stringify(data)}`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error('IG container did not finish processing in time');
}

async function publishContainer(creationId: string): Promise<string> {
  const igUserId = requireEnv('IG_BUSINESS_ACCOUNT_ID');
  const token = requireEnv('IG_ACCESS_TOKEN');

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${igUserId}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: creationId, access_token: token }),
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(`IG publish failed: ${JSON.stringify(data)}`);
  return data.id as string;
}

/** The media_publish response id is Graph API's internal id, NOT the public
 * permalink shortcode — building a URL by hand from it 404s. Fetch the real
 * permalink instead. */
async function fetchPermalink(mediaId: string): Promise<string> {
  const token = requireEnv('IG_ACCESS_TOKEN');
  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}?fields=permalink&access_token=${token}`);
  const data = await res.json();
  if (!res.ok || !data.permalink) throw new Error(`IG permalink lookup failed: ${JSON.stringify(data)}`);
  return data.permalink as string;
}

/**
 * Pre-flight: catch a dead token or misconfigured id BEFORE staging to Cloudinary,
 * with an actionable message. Deliberately does NOT use /debug_token — that
 * endpoint requires an app access token or a token belonging to an app
 * owner/developer, which a System User token is neither, so it 400s on a
 * perfectly valid token. Instead this does the exact read the real publish
 * calls depend on (GET /{igUserId}), so a pass here means the publish calls
 * below will authenticate fine too.
 */
async function assertTokenAlive(): Promise<void> {
  const igId = requireEnv('IG_BUSINESS_ACCOUNT_ID');
  if (!/^\d+$/.test(igId)) {
    throw new Error(
      `IG_BUSINESS_ACCOUNT_ID must be the numeric Instagram Business Account id, not a username (got "${igId}"). ` +
        'Link the IG professional account to the Facebook Page first, then read it via GET /{page-id}?fields=instagram_business_account.',
    );
  }
  const token = requireEnv('IG_ACCESS_TOKEN');
  let data: { id?: string; error?: { message?: string; code?: number } };
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${igId}?fields=id,username&access_token=${token}`);
    data = await res.json();
  } catch (e) {
    console.warn('[instagram] Token pre-flight check unreachable — proceeding anyway:', (e as Error).message);
    return;
  }
  if (data.error || !data.id) {
    throw new Error(
      `IG_ACCESS_TOKEN / IG_BUSINESS_ACCOUNT_ID can't read the Instagram account (${data.error?.message ?? 'no id returned'}). ` +
        'Regenerate the token or fix the id (see marketing/secrets.md → "IG token renewal") and update the GitHub secret, marketing/video/.env, and Vercel.',
    );
  }
}

/** Returns the published reel's public permalink URL, or throws — caller decides
 * how to handle failures. `coverPath` (optional) is staged alongside the video
 * and becomes the reel's cover image; a cover staging failure is downgraded to
 * a warning so it can never block the reel itself. */
export async function uploadInstagramReel(filePath: string, caption: string, coverPath?: string): Promise<string> {
  await assertTokenAlive();
  const { url: videoUrl, publicId } = await stageToCloudinary(filePath, 'video');

  let coverUrl: string | undefined;
  let coverPublicId: string | undefined;
  if (coverPath) {
    try {
      const staged = await stageToCloudinary(coverPath, 'image');
      coverUrl = staged.url;
      coverPublicId = staged.publicId;
    } catch (e) {
      console.warn('[instagram] Cover staging failed — publishing reel without a custom cover:', e);
    }
  }

  try {
    const creationId = await createContainer(videoUrl, caption, coverUrl);
    await waitUntilReady(creationId);
    const mediaId = await publishContainer(creationId);
    return await fetchPermalink(mediaId);
  } finally {
    await cleanupCloudinary(publicId, 'video');
    if (coverPublicId) await cleanupCloudinary(coverPublicId, 'image');
  }
}
