/**
 * Cloudinary staging + Firestore state helpers for the admin-panel news-recap
 * video pipeline (website/app/(admin-panel)/admin/blog/[slug]/video).
 *
 * Mirrors src/memeApproval.ts's Cloudinary upload/cleanup pattern, but the
 * approval UI is the admin panel instead of Discord, and decision state lives
 * directly on the article doc (collection: 'articles') rather than a separate
 * approval collection — there's exactly one in-flight video per article, so a
 * second collection would just be an extra join for no benefit.
 *
 *   admin-video-render.yml   render → stage to Cloudinary → videoStatus: video_ready
 *   (admin approves/rejects in the panel, which writes videoStatus + dispatches ↓)
 *   admin-video-publish.yml  approved: YouTube+Instagram, rejected: cleanup only
 *
 * Env: FIREBASE_SERVICE_ACCOUNT, CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.
 */
import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import { getFirebaseApp } from './firebaseAdmin';

const CLOUDINARY_FOLDER = 'aspirant-arcade/blog-video-approvals';
const ARTICLES_COLLECTION = 'articles';

export type VideoStatus = 'script_ready' | 'rendering' | 'render_failed' | 'video_ready' | 'publishing' | 'publish_failed' | 'published' | 'rejected';

export type VideoBeat = { label: string; text: string };
export type VideoMeta = {
  hookLine?: string;
  youtubeTitle: string;
  youtubeDescription: string;
  youtubeTags: string[];
  instagramCaption: string;
  instagramHashtags: string[];
};
export type VideoStaged = { videoUrl: string; videoPublicId: string; coverUrl?: string; coverPublicId?: string };

export type ArticleDoc = {
  title: string;
  relatedVertical?: 'engineering' | 'entrance' | 'govt' | 'college' | 'schooling';
  videoStatus?: VideoStatus;
  videoBeats?: VideoBeat[];
  videoMeta?: VideoMeta;
  videoStaged?: VideoStaged;
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

function db() {
  getFirebaseApp();
  return admin.firestore();
}

export async function readArticle(slug: string): Promise<ArticleDoc | null> {
  const snap = await db().collection(ARTICLES_COLLECTION).doc(slug).get();
  return snap.exists ? (snap.data() as ArticleDoc) : null;
}

/** Plain merge — same shape as website/lib/articles-firestore.ts's updateArticle(),
 * duplicated here since this package doesn't depend on website/lib (see memeApproval.ts's
 * own note on why marketing/video stays a standalone deployable). */
export async function updateArticleVideo(slug: string, patch: Record<string, unknown>): Promise<void> {
  await db().collection(ARTICLES_COLLECTION).doc(slug).set(patch, { merge: true });
}

async function upload(filePath: string, resourceType: 'video' | 'image'): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(filePath, { resource_type: resourceType, folder: CLOUDINARY_FOLDER });
  return { url: result.secure_url, publicId: result.public_id };
}

/** Best-effort — a stuck staged asset is a few KB of clutter, not a reason to fail a decision that's already been made. */
export async function cleanupStagedVideo(staged: Partial<VideoStaged> | undefined): Promise<void> {
  if (!staged) return;
  configureCloudinary();
  const targets: [string | undefined, 'video' | 'image'][] = [
    [staged.videoPublicId, 'video'],
    [staged.coverPublicId, 'image'],
  ];
  for (const [publicId, resourceType] of targets) {
    if (!publicId) continue;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`[admin-video] Cloudinary cleaned: ${publicId}`);
    } catch (e) {
      console.warn(`[admin-video] Cloudinary cleanup failed for ${publicId}:`, e);
    }
  }
}

/** Stages a rendered video for the admin's in-panel review. Throws on failure —
 * a render nobody can review is a dead end, so the caller marks render_failed. */
export async function stageAdminVideo(slug: string, videoPath: string, coverPath?: string): Promise<VideoStaged> {
  configureCloudinary();
  console.log('[admin-video] Staging to Cloudinary...');
  const video = await upload(videoPath, 'video');
  const cover = coverPath ? await upload(coverPath, 'image').catch(() => undefined) : undefined;

  const staged: VideoStaged = {
    videoUrl: video.url,
    videoPublicId: video.publicId,
    ...(cover ? { coverUrl: cover.url, coverPublicId: cover.publicId } : {}),
  };
  await updateArticleVideo(slug, { videoStatus: 'video_ready', videoStaged: staged, videoError: '' });
  return staged;
}
