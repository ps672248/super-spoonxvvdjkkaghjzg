// ─────────────────────────────────────────────────────────────────────────────
// Categories group exams into verticals (PSU, Schooling, …). A category decides
// the selection flow: whether a branch/stream step appears and in what order.
// ─────────────────────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  ionicon: string;
  color: string;
  /** Label for the sub-track step, or null when there is none. */
  branchLabel: string | null;
  /** true → pick branch first, then filter exams (PSU). false → pick exam directly. */
  branchFirst: boolean;
  /** Explicit exam membership. Omit for the default bucket (PSU = everything else). */
  examIds?: string[];
};

export const CATEGORIES: Category[] = [
  {
    id: 'psu',
    name: 'PSU Exams',
    ionicon: 'briefcase',
    color: '#1565C0',
    branchLabel: 'Branch',
    branchFirst: true,
  },
  {
    id: 'schooling',
    name: 'Schooling',
    ionicon: 'school',
    color: '#1A237E',
    branchLabel: null,
    branchFirst: false,
    examIds: ['class-9', 'class-10', 'class-11', 'class-12'],
  },
];

export const DEFAULT_CATEGORY_ID = 'psu';

export function getCategory(id?: string | null, categories: Category[] = CATEGORIES): Category {
  return categories.find(c => c.id === id) ?? categories[0];
}

/** Exam ids belonging to a category. The default bucket (no examIds) gets every
 *  exam not explicitly claimed by another category.
 *  Pass the live `categories` array from configStore for remote-config awareness. */
export function examIdsForCategory(cat: Category, allExamIds: string[], categories: Category[] = CATEGORIES): string[] {
  if (cat.examIds) return cat.examIds.filter(id => allExamIds.includes(id));
  const claimed = new Set(categories.flatMap(c => c.examIds ?? []));
  return allExamIds.filter(id => !claimed.has(id));
}

/** The category an exam belongs to. Exams not explicitly claimed fall in the default bucket.
 *  Pass the live `categories` array from configStore for remote-config awareness. */
export function categoryIdForExam(examId: string, categories: Category[] = CATEGORIES): string {
  const cat = categories.find(c => c.examIds?.includes(examId));
  return cat ? cat.id : DEFAULT_CATEGORY_ID;
}
