/**
 * Uploads a rendered reel to YouTube Shorts.
 *
 * Needs its own OAuth token with the youtube.upload scope — the tokens already
 * generated for marketing/youtube/*.py (comment bots) only have youtube.force-ssl
 * and, more importantly, belong to persona accounts pretending to be students,
 * not the Aspirant Arcade brand channel. Generate a fresh token against
 * whichever Google account should own the brand channel's uploads.
 *
 * One-time local setup (same client_secret.json as marketing/youtube/):
 *   1. cd marketing/video
 *   2. node -e "require('./src/publishYouTube.ts')" won't work directly (TS) —
 *      run scripts/generateYouTubeUploadToken.ts instead (see below), which
 *      opens a browser consent screen and writes youtube_upload_token.json.
 *   3. Add secrets: YT_CLIENT_SECRET (reuse existing), YT_UPLOAD_TOKEN (new).
 */
import { createReadStream, readFileSync } from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const CLIENT_SECRET_FILE = path.join(process.cwd(), 'client_secret.json');
const TOKEN_FILE = path.join(process.cwd(), 'youtube_upload_token.json');

export { SCOPES, CLIENT_SECRET_FILE, TOKEN_FILE };

function loadOAuthClient() {
  const raw = JSON.parse(readFileSync(CLIENT_SECRET_FILE, 'utf8'));
  const cfg = raw.installed || raw.web;
  const client = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, cfg.redirect_uris?.[0]);
  client.setCredentials(JSON.parse(readFileSync(TOKEN_FILE, 'utf8')));
  return client;
}

export type YouTubeUploadMeta = { title: string; description: string; tags: string[] };

/** Returns the uploaded video's id, or throws — caller decides how to handle failures. */
export async function uploadYouTubeShort(filePath: string, meta: YouTubeUploadMeta): Promise<string> {
  const auth = loadOAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: meta.title,
        description: meta.description,
        tags: meta.tags,
        categoryId: '27', // Education
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: { body: createReadStream(filePath) },
  });

  if (!res.data.id) throw new Error('YouTube upload returned no video id');
  return res.data.id;
}

/**
 * Sets a custom thumbnail on an already-uploaded video. Best-effort — never
 * throws: custom thumbnails require the channel's Google account to be
 * phone-verified, and an unverified channel gets a 403 here; the video itself
 * is already live either way. The youtube.upload scope on the existing token
 * covers thumbnails.set, so no re-auth is needed.
 *
 * Note: the Shorts swipe feed renders its own frame regardless — the custom
 * thumbnail shows on the channel grid, search results, and embeds.
 */
export async function setYouTubeThumbnail(videoId: string, imagePath: string): Promise<void> {
  try {
    const auth = loadOAuthClient();
    const youtube = google.youtube({ version: 'v3', auth });
    await youtube.thumbnails.set({
      videoId,
      media: { body: createReadStream(imagePath) },
    });
    console.log(`[video] ✓ YouTube thumbnail set on ${videoId}`);
  } catch (e) {
    console.warn(`[video] YouTube thumbnail set failed for ${videoId} (video is still live):`, e);
  }
}
