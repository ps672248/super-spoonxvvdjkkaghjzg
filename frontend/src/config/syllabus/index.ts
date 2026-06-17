import { Topic, domainTopicMap } from './domain';
import { quantTopics, reasoningTopics, englishTopics, gkTopics } from './aptitude';
import { schoolingTopicMap } from './schooling';

export type { Topic };

// Data-driven resolver: the PSU section ids resolve to their fixed/branch sources;
// any other section id (e.g. schooling subjects) is looked up in a registry. New
// exam categories register a `sectionId → Topic[]` map here — no switch edits.
const topicRegistry: Record<string, Topic[]> = {
  ...schoolingTopicMap,
};

export function getSyllabusTopics(sectionId: string, branchId?: string): Topic[] {
  switch (sectionId) {
    case 'technical':
      return branchId ? (domainTopicMap[branchId] ?? []) : [];
    case 'quant':
      return quantTopics;
    case 'reasoning':
      return reasoningTopics;
    case 'english':
      return englishTopics;
    case 'gk':
      return gkTopics;
    default:
      return topicRegistry[sectionId] ?? [];
  }
}

export { quantTopics, reasoningTopics, englishTopics, gkTopics, domainTopicMap };
