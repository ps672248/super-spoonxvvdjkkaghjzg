/**
 * One-time migration: uploads static config to Firestore.
 * Triggered from admin panel in Settings (admin email only).
 */

import { db } from '../config/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { PSUS } from '../config/psus';
import { BRANCHES } from '../config/branches';
import { domainTopicMap, quantTopics, reasoningTopics, englishTopics, gkTopics } from '../config/syllabus/index';

export const migrateStaticToFirebase = async () => {
  console.log('[Migration] Starting...');

  // 1. Upload PSUs
  for (const psu of PSUS) {
    await setDoc(doc(db, 'psus', psu.id), psu);
  }
  console.log('[Migration] PSUs done');

  // 2. Upload Branches
  for (const branch of BRANCHES) {
    await setDoc(doc(db, 'branches', branch.id), branch);
  }
  console.log('[Migration] Branches done');

  // 3. Upload Aptitude Syllabus
  const aptitudeGroups = [
    { id: 'quant', topics: quantTopics },
    { id: 'reasoning', topics: reasoningTopics },
    { id: 'english', topics: englishTopics },
    { id: 'gk', topics: gkTopics },
  ];
  for (const group of aptitudeGroups) {
    for (const topic of group.topics) {
      await setDoc(doc(db, 'syllabus', `${group.id}_${topic.id}`), {
        ...topic,
        sectionId: group.id,
      });
    }
  }
  console.log('[Migration] Aptitude syllabus done');

  // 4. Upload Domain Syllabus
  for (const [branchId, topics] of Object.entries(domainTopicMap)) {
    for (const topic of topics) {
      await setDoc(doc(db, 'syllabus', `technical_${branchId}_${topic.id}`), {
        ...topic,
        sectionId: 'technical',
        branchId,
      });
    }
  }
  console.log('[Migration] Domain syllabus done');

  // 5. Set version metadata
  await setDoc(doc(db, 'metadata', 'config_version'), {
    version: 1,
    updatedAt: new Date().toISOString(),
  });

  console.log('[Migration] Complete!');
};
