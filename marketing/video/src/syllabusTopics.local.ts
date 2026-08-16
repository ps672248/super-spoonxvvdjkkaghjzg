/**
 * ⚠️ MANUAL SETUP REQUIRED — meme generation will not work until this file is filled in.
 *
 * memeTopics.ts used to import these 7 maps + 4 arrays directly from the main
 * app's `frontend/src/config/syllabus/*` — that only worked because this
 * package lived in the same repo. It's been split out into its own public
 * repo, so that cross-package import no longer resolves.
 *
 * This file is intentionally left empty rather than auto-copied — populate it
 * by hand, once, from the source repo:
 *   frontend/src/config/syllabus/college.ts    → collegeTopicMap
 *   frontend/src/config/syllabus/domain.ts     → domainTopicMap
 *   frontend/src/config/syllabus/entrance.ts   → entranceTopicMap
 *   frontend/src/config/syllabus/engmaths.ts   → genericEngMathsTopics
 *   frontend/src/config/syllabus/govt.ts       → govtTopicMap
 *   frontend/src/config/syllabus/teaching.ts   → teachingTopicMap
 *   frontend/src/config/syllabus/schooling.ts  → schoolingTopicMap
 *   frontend/src/config/syllabus/aptitude.ts   → englishTopics, gkTopics, quantTopics, reasoningTopics
 *
 * Copy the actual exported values across (paste, don't re-type). Shapes must
 * match memeTopics.ts's expectations:
 *   - *TopicMap exports: Record<string, { id, title, importance?, subtopics? }[]>
 *   - the 5 flat exports (genericEngMathsTopics, englishTopics, gkTopics,
 *     quantTopics, reasoningTopics): { id, title, importance?, subtopics? }[]
 *
 * These are stale the moment the source syllabus changes — acceptable for a
 * meme-topic picker, not something worth re-wiring a live cross-repo import
 * for. Re-copy periodically if meme topics start feeling out of date.
 *
 * memeTopics.ts throws a clear error at call time if these are still empty —
 * that's deliberate, so a forgotten setup step fails loudly instead of
 * silently producing empty/broken memes.
 */

type RawTopic = {
  id: string;
  title: string;
  importance?: string;
  subtopics?: string[];
};

export const collegeTopicMap: Record<string, RawTopic[]> = {};
export const domainTopicMap: Record<string, RawTopic[]> = {};
export const entranceTopicMap: Record<string, RawTopic[]> = {};
export const govtTopicMap: Record<string, RawTopic[]> = {};
export const teachingTopicMap: Record<string, RawTopic[]> = {};
export const schoolingTopicMap: Record<string, RawTopic[]> = {};

export const genericEngMathsTopics: RawTopic[] = [];
export const englishTopics: RawTopic[] = [];
export const gkTopics: RawTopic[] = [];
export const quantTopics: RawTopic[] = [];
export const reasoningTopics: RawTopic[] = [];
