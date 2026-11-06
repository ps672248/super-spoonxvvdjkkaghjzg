/* eslint-disable no-console */
/**
 * Automated Shot Asset Generator for the 500-Shot Master Catalog.
 *
 * Scans the 500-shot catalog and generates missing images into public/scenes/catalog/
 * using Puter (gpt-image-2) or Gemini Imagen models.
 *
 * Usage:
 *   npx tsx scripts/generateShotCatalog.ts               // Generates missing priority shots (default 10)
 *   npx tsx scripts/generateShotCatalog.ts --batch 25    // Generates next 25 missing shots
 *   npx tsx scripts/generateShotCatalog.ts --scene arjun_head_in_hands_books // Generates specific shot
 *   npx tsx scripts/generateShotCatalog.ts --status      // Shows catalog cache coverage
 */
import 'dotenv/config';
import path from 'node:path';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { SCENES_CATALOG, TOTAL_CATALOG_SHOTS, getShotDefinition } from '../src/catalog/scenesCatalog';
import { resolveSceneAsset } from '../src/catalog/sceneImageGenerator';

const CATALOG_DIR = path.join(process.cwd(), 'public', 'scenes', 'catalog');

async function main() {
  mkdirSync(CATALOG_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const isStatusOnly = args.includes('--status');
  const sceneArgIdx = args.indexOf('--scene');
  const batchArgIdx = args.indexOf('--batch');

  const existingFiles = new Set(readdirSync(CATALOG_DIR));
  const totalShots = Object.keys(SCENES_CATALOG);
  const cachedCount = totalShots.filter((id) => existingFiles.has(`${id}.jpg`)).length;
  const missingShots = totalShots.filter((id) => !existingFiles.has(`${id}.jpg`));

  console.log('\n======================================================');
  console.log('🎨 Aspirant Arcade 500-Shot Master Catalog Asset Manager');
  console.log(`Total Defined Shots: ${TOTAL_CATALOG_SHOTS}`);
  console.log(`Cached on Disk:     ${cachedCount} (${((cachedCount / TOTAL_CATALOG_SHOTS) * 100).toFixed(1)}%)`);
  console.log(`Pending Generation: ${missingShots.length}`);
  console.log('======================================================\n');

  if (isStatusOnly) return;

  // Single scene target
  if (sceneArgIdx !== -1 && args[sceneArgIdx + 1]) {
    const targetId = args[sceneArgIdx + 1];
    console.log(`Targeting single shot: "${targetId}"`);
    const res = await resolveSceneAsset(targetId, true);
    console.log(`Result: ${res.source} -> ${res.assetRelPath}`);
    return;
  }

  // Batch target
  let batchLimit = 10;
  if (batchArgIdx !== -1 && args[batchArgIdx + 1]) {
    batchLimit = parseInt(args[batchArgIdx + 1], 10) || 10;
  }

  const toProcess = missingShots.slice(0, batchLimit);
  console.log(`Processing next batch of ${toProcess.length} shots...\n`);

  let successCount = 0;
  for (let i = 0; i < toProcess.length; i++) {
    const shotId = toProcess[i];
    const shotDef = getShotDefinition(shotId);
    console.log(`[${i + 1}/${toProcess.length}] (${shotDef.category}) "${shotId}"...`);

    const res = await resolveSceneAsset(shotId, false);
    if (res.source === 'generated' || res.source === 'cached') {
      successCount++;
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 Batch Complete: ${successCount}/${toProcess.length} processed successfully.`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Fatal shot generator error:', err);
  process.exit(1);
});
