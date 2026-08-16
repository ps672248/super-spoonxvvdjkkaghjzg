/**
 * One-time local script — run this once to grant YouTube Shorts upload access.
 *
 *   cd marketing/video
 *   cp ../youtube/client_secret.json .   # reuse the same OAuth client the comment bots use
 *   npx tsx scripts/generateYouTubeUploadToken.ts
 *
 * Opens a URL for you to authorize in a browser (sign in as whichever Google
 * account should own the Aspirant Arcade brand channel's uploads — NOT one of
 * the comment-bot persona accounts). Writes youtube_upload_token.json, which
 * publishYouTube.ts reads at upload time. Add its contents as the
 * YT_UPLOAD_TOKEN GitHub secret for CI.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { google } from 'googleapis';

// upload = Shorts publishing (publishYouTube.ts); the two readonly scopes feed
// the weekly analytics report (src/analyticsReport.ts). Re-run this script and
// update the YT_UPLOAD_TOKEN secret whenever this list grows — old tokens keep
// only the scopes they were minted with.
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];
const REDIRECT_PORT = 53682;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

async function main() {
  const raw = JSON.parse(readFileSync('client_secret.json', 'utf8'));
  const cfg = raw.installed || raw.web;
  const oAuth2Client = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, REDIRECT_URI);

  const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
  console.log('\nOpen this URL and authorize with the account that should own the brand channel:\n');
  console.log(authUrl, '\n');

  const code: string = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', REDIRECT_URI);
      const c = url.searchParams.get('code');
      if (c) {
        res.end('Authorized — you can close this tab.');
        server.close();
        resolve(c);
      } else {
        res.end('No code received.');
        reject(new Error('No code in redirect'));
      }
    });
    server.listen(REDIRECT_PORT);
  });

  const { tokens } = await oAuth2Client.getToken(code);
  writeFileSync('youtube_upload_token.json', JSON.stringify(tokens, null, 2));
  console.log('\nSaved youtube_upload_token.json — add its contents as the YT_UPLOAD_TOKEN secret.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
