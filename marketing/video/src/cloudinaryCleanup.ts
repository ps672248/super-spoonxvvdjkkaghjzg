/* eslint-disable no-console */
import { v2 as cloudinary } from 'cloudinary';

const CLEANUP_FOLDERS = [
  'aspirant-arcade/reels-staging',
  'aspirant-arcade/blog-video-approvals',
];

function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Removes staging reel and video artifacts older than `olderThanDays` (default: 2 days).
 * Best-effort: failures never crash the caller.
 */
export async function cleanupOldCloudinaryArtifacts(olderThanDays = 2): Promise<number> {
  if (!isCloudinaryConfigured()) {
    console.log('[cloudinary-cleanup] Cloudinary credentials not set — skipping cleanup.');
    return 0;
  }

  configureCloudinary();
  const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffTime).toISOString();
  console.log(`[cloudinary-cleanup] Scanning for staging artifacts created before ${cutoffIso} (${olderThanDays} days old)...`);

  let totalDeleted = 0;
  const resourceTypes: ('video' | 'image')[] = ['video', 'image'];

  for (const folder of CLEANUP_FOLDERS) {
    for (const resType of resourceTypes) {
      try {
        const res = await cloudinary.api.resources({
          type: 'upload',
          prefix: folder,
          resource_type: resType,
          max_results: 100,
        });

        const resources = res.resources as Array<{ public_id: string; created_at: string }> | undefined;
        if (!Array.isArray(resources) || resources.length === 0) continue;

        const expired = resources.filter((item) => {
          const createdAt = new Date(item.created_at).getTime();
          return createdAt < cutoffTime;
        });

        if (expired.length > 0) {
          const publicIds = expired.map((item) => item.public_id);
          await cloudinary.api.delete_resources(publicIds, { resource_type: resType });
          console.log(`[cloudinary-cleanup] Deleted ${publicIds.length} expired ${resType}(s) from ${folder}.`);
          totalDeleted += publicIds.length;
        }
      } catch (err) {
        console.warn(`[cloudinary-cleanup] Failed scanning ${folder} (${resType}):`, err);
      }
    }
  }

  console.log(`[cloudinary-cleanup] Cleanup complete. Removed ${totalDeleted} expired artifacts.`);
  return totalDeleted;
}
