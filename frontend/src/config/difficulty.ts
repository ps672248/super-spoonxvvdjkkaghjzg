import { PSUS } from './psus';

export type DifficultyBand = {
  examId: string;
  examName: string;
  sectionId: string;
  sectionName: string;
  range: [number, number];
};

/** Flat list of every exam × section with its difficulty range. Derived at module load — never hand-edited. */
export const DIFFICULTY_BANDS: DifficultyBand[] = PSUS.flatMap(exam =>
  exam.sections.map(s => ({
    examId: exam.id,
    examName: exam.name,
    sectionId: s.id,
    sectionName: s.name,
    range: s.difficultyRange,
  }))
);

/** Bands indexed by difficulty level 1–10. A band appears for every level within its range. */
export const BY_LEVEL: Record<number, DifficultyBand[]> = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => {
    const level = i + 1;
    return [level, DIFFICULTY_BANDS.filter(b => b.range[0] <= level && level <= b.range[1])];
  })
);

/** Return the difficulty range for a specific exam + section pair. */
export function rangeFor(examId: string, sectionId: string): [number, number] | undefined {
  return DIFFICULTY_BANDS.find(b => b.examId === examId && b.sectionId === sectionId)?.range;
}

/** All exams whose range includes `level`. */
export function examsAtLevel(level: number): DifficultyBand[] {
  return BY_LEVEL[level] ?? [];
}

/**
 * Union of difficulty ranges across all exams that share a sectionId.
 * Used by the seeder to determine which levels to generate questions for a bankKey.
 */
export function unionRangeForSection(sectionId: string): [number, number] {
  const matching = DIFFICULTY_BANDS.filter(b => b.sectionId === sectionId);
  if (matching.length === 0) return [1, 10];
  return [
    Math.min(...matching.map(b => b.range[0])),
    Math.max(...matching.map(b => b.range[1])),
  ];
}

/** True when two sections' difficulty ranges overlap (shared question pool eligibility). */
export function rangesOverlap(
  examA: string, sectionA: string,
  examB: string, sectionB: string,
): boolean {
  const a = rangeFor(examA, sectionA);
  const b = rangeFor(examB, sectionB);
  if (!a || !b) return false;
  return a[0] <= b[1] && b[0] <= a[1];
}
