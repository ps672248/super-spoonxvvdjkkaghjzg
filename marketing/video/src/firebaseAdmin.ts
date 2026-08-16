import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

// Same credential-loading pattern as scripts/blog_bot.ts — shared here so
// fetchContent.ts (Firestore reads) and publishInstagram.ts (Storage upload)
// don't both call admin.initializeApp() and crash on the second call.
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  }
  return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json', 'utf8'));
}

let app: admin.app.App | undefined;
export function getFirebaseApp(): admin.app.App {
  if (!app) app = admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount()) });
  return app;
}
