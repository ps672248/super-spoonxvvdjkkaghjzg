import type { ExamConfig, ExamSection } from '../psus';

// ─────────────────────────────────────────────────────────────────────────────
// Schooling (Class 9–12) exams. Each class is one exam; subjects are sections,
// chapters are topics (see ../syllabus/schooling.ts). No branch/stream dimension
// in this pilot (branches: []), so the home flow skips the branch step.
// Streams (Science/Commerce/Arts) for 11/12 are a future enhancement.
// `examType: 'Boards'`, no negative marking.
// ─────────────────────────────────────────────────────────────────────────────

type SubjectSeed = {
  id: string;
  name: string;
  icon: string;
  color: string;
  difficultyRange: [number, number];
  description: string;
};

function toSection(s: SubjectSeed, count: number): ExamSection {
  return {
    id: s.id,
    name: s.name,
    icon: s.icon,
    color: s.color,
    questionCount: count,
    marksPerQuestion: 1,
    totalMarks: count,
    weightagePercent: 0, // even weighting across subjects for practice
    difficultyRange: s.difficultyRange,
    branchSpecific: false,
    description: s.description,
  };
}

const class9Subjects: SubjectSeed[] = [
  { id: 'sci9',  name: 'Science',        icon: 'flask',      color: '#43A047', difficultyRange: [1, 4], description: 'Physics, Chemistry & Biology (NCERT Class 9)' },
  { id: 'math9', name: 'Mathematics',    icon: 'calculator', color: '#1976D2', difficultyRange: [1, 4], description: 'NCERT Class 9 Mathematics' },
  { id: 'sst9',  name: 'Social Science', icon: 'globe',      color: '#8E24AA', difficultyRange: [1, 3], description: 'History, Geography & Civics' },
  { id: 'eng9',  name: 'English',        icon: 'text',       color: '#E65100', difficultyRange: [1, 3], description: 'Reading, Grammar, Writing & Literature' },
];

const class10Subjects: SubjectSeed[] = [
  { id: 'sci10',  name: 'Science',        icon: 'flask',      color: '#43A047', difficultyRange: [2, 5], description: 'Physics, Chemistry & Biology (NCERT Class 10)' },
  { id: 'math10', name: 'Mathematics',    icon: 'calculator', color: '#1976D2', difficultyRange: [2, 5], description: 'NCERT Class 10 Mathematics' },
  { id: 'sst10',  name: 'Social Science', icon: 'globe',      color: '#8E24AA', difficultyRange: [1, 4], description: 'History, Geography, Civics & Economics' },
  { id: 'eng10',  name: 'English',        icon: 'text',       color: '#E65100', difficultyRange: [1, 4], description: 'Reading, Grammar, Writing & Literature' },
];

const class11Subjects: SubjectSeed[] = [
  { id: 'phy11',  name: 'Physics',     icon: 'magnet',     color: '#3949AB', difficultyRange: [4, 7], description: 'NCERT Class 11 Physics' },
  { id: 'chem11', name: 'Chemistry',   icon: 'flask',      color: '#00897B', difficultyRange: [3, 6], description: 'NCERT Class 11 Chemistry' },
  { id: 'math11', name: 'Mathematics', icon: 'calculator', color: '#1976D2', difficultyRange: [4, 7], description: 'NCERT Class 11 Mathematics' },
  { id: 'bio11',  name: 'Biology',     icon: 'leaf',       color: '#43A047', difficultyRange: [3, 5], description: 'NCERT Class 11 Biology' },
  { id: 'eng11',  name: 'English',     icon: 'text',       color: '#E65100', difficultyRange: [1, 4], description: 'Reading, Grammar, Writing & Literature' },
];

const class12Subjects: SubjectSeed[] = [
  { id: 'phy12',  name: 'Physics',     icon: 'magnet',     color: '#3949AB', difficultyRange: [5, 8], description: 'NCERT Class 12 Physics' },
  { id: 'chem12', name: 'Chemistry',   icon: 'flask',      color: '#00897B', difficultyRange: [4, 7], description: 'NCERT Class 12 Chemistry' },
  { id: 'math12', name: 'Mathematics', icon: 'calculator', color: '#1976D2', difficultyRange: [5, 8], description: 'NCERT Class 12 Mathematics' },
  { id: 'bio12',  name: 'Biology',     icon: 'leaf',       color: '#43A047', difficultyRange: [4, 6], description: 'NCERT Class 12 Biology' },
  { id: 'eng12',  name: 'English',     icon: 'text',       color: '#E65100', difficultyRange: [2, 5], description: 'Reading, Grammar, Writing & Literature' },
];

function schoolingExam(
  id: string,
  name: string,
  fullName: string,
  ionicon: string,
  subjects: SubjectSeed[],
  perSection = 12,
): ExamConfig {
  return {
    id,
    name,
    fullName,
    color: '#1A237E',
    bgColor: '#E8EAF6',
    icon: '🎓',
    ionicon,
    examType: 'Boards',
    totalQuestions: subjects.length * perSection,
    totalMarks: subjects.length * perSection,
    durationMinutes: 60,
    negativeMarking: 0,
    branches: [],
    sections: subjects.map(s => toSection(s, perSection)),
    tipText: 'Practice chapter-wise. No negative marking — attempt every question.',
    prepTips: {},
    hasInterview: false,
    interviewStages: [],
  };
}

export const schoolingExams: ExamConfig[] = [
  schoolingExam('class-9',  'Class 9',  'CBSE / NCERT Class 9',  'school',  class9Subjects),
  schoolingExam('class-10', 'Class 10', 'CBSE / NCERT Class 10', 'school',  class10Subjects),
  schoolingExam('class-11', 'Class 11', 'CBSE / NCERT Class 11', 'library', class11Subjects),
  schoolingExam('class-12', 'Class 12', 'CBSE / NCERT Class 12', 'library', class12Subjects),
];
