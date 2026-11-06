/* eslint-disable no-console */
/**
 * Automated Shot Asset Generator for the 500-Shot Master Catalog.
 *
 * Scans the 500-shot catalog and generates missing images into public/scenes/catalog/
 * using Puter (gpt-image-2) or Gemini Imagen models.
 *
 * Usage:
 *   npx tsx scripts/generateShotCatalog.ts                   // Generates missing priority shots (default 10)
 *   npx tsx scripts/generateShotCatalog.ts --batch 100       // Generates 100 shots
 *   npx tsx scripts/generateShotCatalog.ts --batch 100 --diverse // 10 shots from each of 10 categories
 *   npx tsx scripts/generateShotCatalog.ts --category hooks_and_procrastination
 *   npx tsx scripts/generateShotCatalog.ts --concurrency 2   // Parallel worker pool (default: 2)
 *   npx tsx scripts/generateShotCatalog.ts --scene arjun_head_in_hands_books // Generates specific shot
 *   npx tsx scripts/generateShotCatalog.ts --status          // Shows catalog cache coverage
 */
import 'dotenv/config';
import path from 'node:path';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { SCENES_CATALOG, TOTAL_CATALOG_SHOTS, getShotDefinition, type ShotCategory } from '../src/catalog/scenesCatalog';
import { resolveSceneAsset } from '../src/catalog/sceneImageGenerator';

const CATALOG_DIR = path.join(process.cwd(), 'public', 'scenes', 'catalog');

async function runPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const idx = i;
    const p = (async () => {
      const res = await worker(item, idx);
      results[idx] = res;
    })();
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

async function main() {
  mkdirSync(CATALOG_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const isStatusOnly = args.includes('--status');
  const isDiverse = args.includes('--diverse');
  const sceneArgIdx = args.indexOf('--scene');
  const batchArgIdx = args.indexOf('--batch');
  const categoryArgIdx = args.indexOf('--category');
  const concurrencyArgIdx = args.indexOf('--concurrency');

  const concurrency = concurrencyArgIdx !== -1 && args[concurrencyArgIdx + 1]
    ? Math.max(1, parseInt(args[concurrencyArgIdx + 1], 10) || 2)
    : 2;

  const existingFiles = new Set(readdirSync(CATALOG_DIR));
  const totalShots = Object.keys(SCENES_CATALOG);
  const cachedCount = totalShots.filter((id) => existingFiles.has(`${id}.jpg`)).length;
  const missingShots = totalShots.filter((id) => !existingFiles.has(`${id}.jpg`));

  console.log('\n======================================================');
  console.log('🎨 Aspirant Arcade 500-Shot Master Catalog Asset Manager');
  console.log(`Total Defined Shots: ${TOTAL_CATALOG_SHOTS}`);
  console.log(`Cached on Disk:     ${cachedCount} (${((cachedCount / TOTAL_CATALOG_SHOTS) * 100).toFixed(1)}%)`);
  console.log(`Pending Generation: ${missingShots.length}`);
  console.log(`Concurrency:        ${concurrency} workers`);
  console.log('======================================================\n');

  if (isStatusOnly) process.exit(0);

  // Single scene target
  if (sceneArgIdx !== -1 && args[sceneArgIdx + 1]) {
    const targetId = args[sceneArgIdx + 1];
    console.log(`Targeting single shot: "${targetId}"`);
    const res = await resolveSceneAsset(targetId, true);
    console.log(`Result: ${res.source} -> ${res.assetRelPath}`);
    process.exit(0);
  }

  // Batch target
  let batchLimit = 10;
  if (batchArgIdx !== -1 && args[batchArgIdx + 1]) {
    batchLimit = parseInt(args[batchArgIdx + 1], 10) || 10;
  }

  let toProcess: string[] = [];

  // Filter by category if specified
  if (categoryArgIdx !== -1 && args[categoryArgIdx + 1]) {
    const targetCat = args[categoryArgIdx + 1] as ShotCategory;
    toProcess = missingShots
      .filter((id) => getShotDefinition(id).category === targetCat)
      .slice(0, batchLimit);
    console.log(`Targeting category "${targetCat}": ${toProcess.length} shots queued.\n`);
  } else if (isDiverse) {
    // Pick evenly across all 10 categories
    const categories: ShotCategory[] = [
      'hooks_and_procrastination',
      'formula_and_concept_struggles',
      'mock_test_and_percentile_pain',
      'hostel_and_college_life',
      'mentor_priya_interventions',
      'arcade_modes_gameplay',
      'focus_guard_and_habit_breaking',
      'pvp_battles_and_community',
      'breakthrough_and_eureka_moments',
      'celebration_and_playstore_cta',
    ];
    const perCat = Math.ceil(batchLimit / categories.length);
    const selected: string[] = [];
    for (const cat of categories) {
      const catMissing = missingShots.filter((id) => getShotDefinition(id).category === cat);
      selected.push(...catMissing.slice(0, perCat));
    }
    toProcess = selected.slice(0, batchLimit);
    console.log(`Diverse mode: Selected ${toProcess.length} shots across ${categories.length} categories (~${perCat} per category).\n`);
  } else {
    toProcess = missingShots.slice(0, batchLimit);
    console.log(`Sequential mode: Selected first ${toProcess.length} missing shots.\n`);
  }

  let successCount = 0;
  let failedCount = 0;
  const startTime = Date.now();

  await runPool(toProcess, concurrency, async (shotId, i) => {
    const shotDef = getShotDefinition(shotId);
    console.log(`[${i + 1}/${toProcess.length}] START (${shotDef.category}) "${shotId}"...`);

    let res = await resolveSceneAsset(shotId, false);
    if (res.source === 'fallback') {
      // Retry once after a brief cooldown
      console.log(`[${i + 1}/${toProcess.length}] RETRYING "${shotId}" after cooldown...`);
      await new Promise((r) => setTimeout(r, 2000));
      res = await resolveSceneAsset(shotId, true);
    }

    if (res.source === 'generated' || res.source === 'cached') {
      successCount++;
      console.log(`[${i + 1}/${toProcess.length}] ✅ DONE "${shotId}" (${res.source})`);
    } else {
      failedCount++;
      console.warn(`[${i + 1}/${toProcess.length}] ⚠️ FALLBACK "${shotId}"`);
    }
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n======================================================');
  console.log(`🎉 Batch Generation Complete in ${durationSec}s!`);
  console.log(`✅ Success: ${successCount}/${toProcess.length}`);
  if (failedCount > 0) console.log(`⚠️ Fallback/Failed: ${failedCount}/${toProcess.length}`);
  console.log(`Cached files on disk: ${readdirSync(CATALOG_DIR).filter((f) => f.endsWith('.jpg')).length}`);
  console.log('======================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal shot generator error:', err);
  process.exit(1);
});
