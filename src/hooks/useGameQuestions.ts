import { useState, useCallback } from 'react';
import { useExamStore } from '../stores/examStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useSeenQuestionsStore } from '../stores/seenQuestionsStore';
export { MCQQuestion, MatchChallenge } from '../services/gemini';
import { generateQuestions, generateMatchChallenges } from '../services/gemini';
import { getSyllabusTopics } from '../config/syllabus';

export const useGameQuestions = () => {
  const { 
    selectedPSU, 
    selectedBranch, 
    selectedSections, 
    selectedTopics, 
    questionCount: storeCount 
  } = useExamStore();
  
  const { geminiApiKey, geminiModel } = useSettingsStore();
  const getSeenForPsu = useSeenQuestionsStore(s => s.getSeenForPsu);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async (gameMode: string, countOverride?: number) => {
    if (!selectedPSU) {
      setError('No PSU selected');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      // Standardize metadata sourcing
      const sectionId = selectedSections[0] || 'technical';
      const section = selectedPSU.sections.find(s => s.id === sectionId) || selectedPSU.sections[0];
      
      const allTopics = getSyllabusTopics(sectionId, selectedBranch?.id);
      const topic = allTopics.find(t => selectedTopics.includes(t.id)) ?? allTopics[0];

      const seenQuestions = getSeenForPsu(selectedPSU.id);

      const params = {
        apiKey: geminiApiKey || '',
        modelId: geminiModel,
        psuId: selectedPSU.id,
        psuName: selectedPSU.name,
        psuDifficulty: selectedPSU.difficulty,
        branchId: selectedBranch?.id || 'all',
        branchName: selectedBranch?.name || 'General',
        sectionId: section.id,
        sectionName: section.name,
        sectionDifficulty: section.difficulty,
        negativeMarking: selectedPSU.negativeMarking,
        topicId: topic?.id || 'mixed',
        topicTitle: topic?.title || 'Mixed Topics',
        gameMode,
        count: countOverride || storeCount || 10,
        bypassCache: true, // always fetch fresh — no stale questions per session
        seenQuestions,
      };

      if (gameMode === 'match') {
        // Special case for match challenges
        return await generateMatchChallenges(params);
      } else {
        return await generateQuestions(params);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to generate questions';
      setError(msg);
      console.error('[useGameQuestions] Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedPSU, selectedBranch, selectedSections, selectedTopics, storeCount, geminiApiKey, geminiModel, getSeenForPsu]);

  return {
    loadQuestions,
    loading,
    error,
    psu: selectedPSU,
    branch: selectedBranch,
  };
};
