/**
 * MIGRATION SCRIPT: Static Config to Firebase Firestore
 * 
 * Instructions:
 * 1. Run this script once to upload your current static TS config data to Firestore.
 * 2. Ensure your Firebase Admin SDK or client-side permissions allow these writes.
 */

import { db } from '../src/config/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { PSUS } from '../src/config/psus';
import { BRANCHES } from '../src/config/branches';
import { domainTopicMap, quantTopics, reasoningTopics, englishTopics, gkTopics } from '../src/config/syllabus';

export const migrateStaticToFirebase = async () => {
  console.log('Starting migration...');

  // 1. Upload PSUs
  console.log('Uploading PSUs...');
  for (const psu of PSUS) {
    await setDoc(doc(db, 'psus', psu.id), psu);
  }

  // 2. Upload Branches
  console.log('Uploading Branches...');
  for (const branch of BRANCHES) {
    await setDoc(doc(db, 'branches', branch.id), branch);
  }

  // 3. Upload Syllabus (Aptitude)
  console.log('Uploading Aptitude Syllabus...');
  const aptitudeData = [
    { id: 'quant', topics: quantTopics },
    { id: 'reasoning', topics: reasoningTopics },
    { id: 'english', topics: englishTopics },
    { id: 'gk', topics: gkTopics },
  ];

  for (const group of aptitudeData) {
    for (const topic of group.topics) {
      await setDoc(doc(db, 'syllabus', `${group.id}_${topic.id}`), {
        ...topic,
        sectionId: group.id,
      });
    }
  }

  // 4. Upload Syllabus (Domain)
  console.log('Uploading Domain Syllabus...');
  for (const [branchId, topics] of Object.entries(domainTopicMap)) {
    for (const topic of topics) {
      await setDoc(doc(db, 'syllabus', `technical_${branchId}_${topic.id}`), {
        ...topic,
        sectionId: 'technical',
        branchId: branchId,
      });
    }
  }

  // 5. Set Initial Version
  await setDoc(doc(db, 'metadata', 'config_version'), {
    version: 1,
    updatedAt: new Date().toISOString(),
  });

  console.log('Migration complete!');
};
