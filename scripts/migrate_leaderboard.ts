/**
 * One-shot migration: copy pre-category leaderboard data into psu_ namespace.
 *
 * Before category system, boards lived at:
 *   leaderboards/{metric}_{window}/scores/{uid}
 * After migration, boards live at:
 *   leaderboards/psu_{metric}_{window}/scores/{uid}
 *
 * This script:
 *   1. Reads all leaderboard docs that have no category prefix.
 *   2. Copies their scores subcollection into psu_{docId}/scores,
 *      taking the higher value if a uid already exists on the psu_ board.
 *   3. (optional --delete flag) deletes the old unprefixed docs after copy.
 *
 * Usage:
 *   npm run migrate:lb          # dry run — prints what would change
 *   npm run migrate:lb -- --write   # actually writes
 *   npm run migrate:lb -- --write --delete  # write + delete old docs
 */

import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

// ── Firebase init ─────────────────────────────────────────────────────────────
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';
  return JSON.parse(readFileSync(p, 'utf8'));
}
admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount()) });
const db = admin.firestore();

// ── Flags ─────────────────────────────────────────────────────────────────────
const DRY = !process.argv.includes('--write');
const DELETE_OLD = process.argv.includes('--delete');
const KNOWN_PREFIXES = ['psu_', 'schooling_'];

function isUnprefixed(id: string): boolean {
  return !KNOWN_PREFIXES.some(p => id.startsWith(p));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY) console.log('DRY RUN — pass --write to apply changes\n');

  const boardsSnap = await db.collection('leaderboards').listDocuments();
  const oldDocs = boardsSnap.filter(d => isUnprefixed(d.id));

  if (oldDocs.length === 0) {
    console.log('No unprefixed leaderboard docs found — nothing to migrate.');
    return;
  }

  console.log(`Found ${oldDocs.length} unprefixed docs:`);
  oldDocs.forEach(d => console.log(`  ${d.id}`));
  console.log();

  let totalScores = 0;
  let totalWrites = 0;
  let totalSkipped = 0;

  for (const oldDoc of oldDocs) {
    const newDocId = `psu_${oldDoc.id}`;
    const scoresSnap = await db.collection('leaderboards').doc(oldDoc.id).collection('scores').get();

    if (scoresSnap.empty) {
      console.log(`  ${oldDoc.id} → empty, skip`);
      continue;
    }

    console.log(`  ${oldDoc.id} → ${newDocId}  (${scoresSnap.size} scores)`);
    totalScores += scoresSnap.size;

    // Read existing psu_ scores so we can take max
    const existingSnap = await db.collection('leaderboards').doc(newDocId).collection('scores').get();
    const existing = new Map<string, number>();
    existingSnap.forEach(d => existing.set(d.id, (d.data().value as number) || 0));

    // Batch write in chunks of 500
    const entries = scoresSnap.docs.map(d => ({ uid: d.id, data: d.data() }));
    for (let i = 0; i < entries.length; i += 500) {
      const batch = db.batch();
      let batchWrites = 0;
      for (const { uid, data } of entries.slice(i, i + 500)) {
        const incoming = (data.value as number) || 0;
        const current = existing.get(uid) || 0;
        if (incoming <= current) {
          totalSkipped++;
          continue; // psu_ already has equal or better score
        }
        const ref = db.collection('leaderboards').doc(newDocId).collection('scores').doc(uid);
        if (!DRY) batch.set(ref, data, { merge: true });
        batchWrites++;
        totalWrites++;
      }
      if (!DRY && batchWrites > 0) await batch.commit();
      console.log(`    wrote=${batchWrites} skipped_better=${entries.slice(i, i + 500).length - batchWrites}`);
    }

    if (DELETE_OLD && !DRY) {
      // Delete scores subcollection first, then the parent doc
      const delBatch = db.batch();
      scoresSnap.docs.forEach(d => delBatch.delete(d.ref));
      await delBatch.commit();
      await db.collection('leaderboards').doc(oldDoc.id).delete();
      console.log(`    deleted old doc ${oldDoc.id}`);
    }
  }

  console.log(`\nDone. boards=${oldDocs.length} scores_processed=${totalScores} written=${totalWrites} skipped_better=${totalSkipped}`);
  if (DRY) console.log('Re-run with --write to apply.');
  if (!DELETE_OLD && !DRY) console.log('Old unprefixed docs kept. Re-run with --delete to remove them.');
}

main().catch(e => { console.error(e); process.exit(1); });
