import { create } from 'zustand';
import { useConfigStore } from './configStore';
import { PSUConfig, PSUS } from '../config/psus';
import { BranchConfig, BRANCHES } from '../config/branches';

export type GameMode = 'mcq' | 'survival' | 'match' | 'slasher' | 'mario' | 'tsunami';

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

  setPSU: (id) => {
    const { getPSU } = useConfigStore.getState();
    const psu = id ? (getPSU(id) ?? PSUS.find(p => p.id === id) ?? null) : null;
    set({
      selectedPSU: psu,
      selectedBranch: null,
      selectedSections: [],
      selectedTopics: [],
      selectedMode: null,
    });
  },

  setBranch: (id) => {
    const { getBranch } = useConfigStore.getState();
    const branch = id ? (getBranch(id) ?? BRANCHES.find(b => b.id === id) ?? null) : null;
    set({
      selectedBranch: branch,
      selectedSections: [],
      selectedTopics: [],
      selectedMode: null,
    });
  },

  toggleSection: (id) => set((state) => ({
    selectedSections: state.selectedSections.includes(id)
      ? state.selectedSections.filter(s => s !== id)
      : [...state.selectedSections, id],
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
