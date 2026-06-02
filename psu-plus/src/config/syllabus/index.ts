import { Topic, domainTopicMap } from './domain';
import { quantTopics, reasoningTopics, englishTopics, gkTopics } from './aptitude';

export type { Topic };

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
      return [];
  }
}

export { quantTopics, reasoningTopics, englishTopics, gkTopics, domainTopicMap };
