/**
 * Interview Store — in-memory session state only.
 * No AsyncStorage. No Firebase. Cleared on new session start or PSU change.
 *
 * Used to pass tech PI summary to HR PI so the interviewer has context.
 */

import { create } from 'zustand';

interface InterviewStore {
  /** Full Gemini summary text from the completed technical PI session */
  techSummary: string;
  /** GD topic text (for display reference during/after the GD) */
  gdTopic: string;

  setTechSummary: (summary: string) => void;
  setGdTopic: (topic: string) => void;
  /** Call when starting a new interview flow or when PSU/branch changes */
  clearSession: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  techSummary: '',
  gdTopic: '',

  setTechSummary: (summary) => set({ techSummary: summary }),
  setGdTopic: (topic) => set({ gdTopic: topic }),
  clearSession: () => set({ techSummary: '', gdTopic: '' }),
}));
