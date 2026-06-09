import { useState, useCallback } from 'react';
import { useExamStore } from '../stores/examStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useSeenQuestionsStore } from '../stores/seenQuestionsStore';
export { MCQQuestion, MatchChallenge, TFStatement } from '../services/gemini';
import { generateQuestions, generateMatchChallenges, generateTrueFalse } from '../services/gemini';
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
      // Use ALL selected sections — combine for richer question variety
      const matchingSections = selectedPSU.sections.filter(s => selectedSections.includes(s.id));
      const activeSections = matchingSections.length > 0 ? matchingSections : [selectedPSU.sections[0]];
      const primarySection = activeSections[0];
      const sectionName = activeSections.length === 1
        ? activeSections[0].name
        : activeSections.map(s => s.name).join(' + ');
      const sectionId = activeSections.map(s => s.id).join('_');

      // Gather topics from ALL active sections
      const allTopics = activeSections.flatMap(sec => getSyllabusTopics(sec.id, selectedBranch?.id));

      // Use ALL user-selected topics — combine titles so Gemini mixes questions across them
      const matchingTopics = allTopics.filter(t => selectedTopics.includes(t.id));
      const activeTopics = matchingTopics.length > 0 ? matchingTopics : [allTopics[0]];
      const topicTitle = activeTopics.length === 1
        ? activeTopics[0].title
        : activeTopics.map(t => t.title).join(', ');
      const topicId = activeTopics.map(t => t.id).join('_');

      const seenQuestions = getSeenForPsu(selectedPSU.id);

      const params = {
        apiKey: geminiApiKey || '',
        modelId: geminiModel,
        psuId: selectedPSU.id,
        psuName: selectedPSU.name,
        psuDifficulty: selectedPSU.difficulty,
        branchId: selectedBranch?.id || 'all',
        branchName: selectedBranch?.name || 'General',
        sectionId,
        sectionName,
        sectionDifficulty: primarySection.difficulty,
        negativeMarking: selectedPSU.negativeMarking,
        topicId,
        topicTitle,
        gameMode,
        count: countOverride || storeCount || 10,
        bypassCache: true, // always fetch fresh — no stale questions per session
        seenQuestions,
      };

      if (gameMode === 'match') {
        // Special case for match challenges
        return await generateMatchChallenges(params);
      } else if (gameMode === 'tsunami') {
        // True/False statements for Tsunami swipe mode
        return await generateTrueFalse(params);
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
