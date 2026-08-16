/**
 * One-time local script — grants YT_EDIT_TOKEN (scope youtube.force-ssl),
 * needed for the admin Videos page's edit action (videos.update). Separate
 * from generateYouTubeUploadToken.ts, which only grants youtube.upload —
 * that scope can't call videos.update.
 *
 *   cd marketing/video
 *   cp ../youtube/client_secret.json .   # reuse the same OAuth client
 *   npx tsx scripts/generateYouTubeEditToken.ts
 *
 * Opens a URL to authorize as the brand-channel account. Writes
 * youtube_edit_token.json — add its contents as the YT_EDIT_TOKEN secret
 * (website env, not GitHub Actions — only website/lib/youtube.ts reads it).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
const REDIRECT_PORT = 53683;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

async function main() {
  const raw = JSON.parse(readFileSync('client_secret.json', 'utf8'));
  const cfg = raw.installed || raw.web;
  const oAuth2Client = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, REDIRECT_URI);

  const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
  console.log('\nOpen this URL and authorize with the account that owns the brand channel:\n');
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
  writeFileSync('youtube_edit_token.json', JSON.stringify(tokens, null, 2));
  console.log('\nSaved youtube_edit_token.json — its contents are the YT_EDIT_TOKEN value.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
