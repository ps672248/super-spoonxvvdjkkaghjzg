import { create } from 'zustand';
import { PSUConfig, getPSU } from '../config/psus';
import { BranchConfig, getBranch } from '../config/branches';

export type GameMode = 'mcq' | 'survival' | 'match' | 'slasher' | 'mario';

interface ExamState {
  selectedPSU: PSUConfig | null;
  selectedBranch: BranchConfig | null;
  selectedSections: string[];
  selectedTopics: string[];
  selectedMode: GameMode | null;
  questionCount: number;

  setPSU: (id: string | null) => void;
  setBranch: (id: string | null) => void;
  toggleSection: (id: string) => void;
  setAllSections: (ids: string[]) => void;
  clearSections: () => void;
  toggleTopic: (id: string) => void;
  setAllTopics: (ids: string[]) => void;
  clearTopics: () => void;
  setMode: (mode: GameMode) => void;
  setQuestionCount: (count: number) => void;
  resetSession: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  selectedPSU: null,
  selectedBranch: null,
  selectedSections: [],
  selectedTopics: [],
  selectedMode: null,
  questionCount: 10,

  setPSU: (id) => set({
    selectedPSU: id ? getPSU(id) ?? null : null,
    selectedBranch: null,
    selectedSections: [],
    selectedTopics: [],
    selectedMode: null,
  }),

  setBranch: (id) => set({
    selectedBranch: id ? getBranch(id) ?? null : null,
    selectedSections: [],
    selectedTopics: [],
    selectedMode: null,
  }),

  toggleSection: (id) => set((state) => ({
    selectedSections: state.selectedSections.includes(id)
      ? state.selectedSections.filter(s => s !== id)
      : [...state.selectedSections, id],
    selectedTopics: [],
  })),

  setAllSections: (ids) => set({ selectedSections: ids, selectedTopics: [] }),
  clearSections: () => set({ selectedSections: [], selectedTopics: [] }),

  toggleTopic: (id) => set((state) => ({
    selectedTopics: state.selectedTopics.includes(id)
      ? state.selectedTopics.filter(t => t !== id)
      : [...state.selectedTopics, id],
  })),

  setAllTopics: (ids) => set({ selectedTopics: ids }),
  clearTopics: () => set({ selectedTopics: [] }),

  setMode: (mode) => set({ selectedMode: mode }),

  setQuestionCount: (count) => set({ questionCount: count }),

  resetSession: () => set({
    selectedPSU: null,
    selectedBranch: null,
    selectedSections: [],
    selectedTopics: [],
    selectedMode: null,
    questionCount: 10,
  }),
}));
