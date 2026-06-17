import { useState, useCallback } from 'react';
import { useExamStore } from '../stores/examStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useSeenQuestionsStore } from '../stores/seenQuestionsStore';
export { MCQQuestion, MatchChallenge, TFStatement } from '../services/gemini';
import { generateQuestions, generateMatchChallenges, generateTrueFalse } from '../services/gemini';
import { getSyllabusTopics } from '../config/syllabus';
import {
  gameModeToType, buildBankKey,
  fetchFromBank, submitToBank, BankMeta,
} from '../services/questionBank';
import { useToast } from '../context/ToastContext';
import { isEmbed } from '@/utils/embed';

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
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servedFromBank, setServedFromBank] = useState(false);

  const loadQuestions = useCallback(async (gameMode: string, countOverride?: number) => {
    if (!selectedPSU) {
      setError('No PSU selected');
      return [];
    }

    setLoading(true);
    setError(null);
    setServedFromBank(false);

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

      // Difficulty band (1–10) for this selection — drives both the prompt tag and bank range.
      const [diffMin, diffMax] = primarySection.difficultyRange;

      const params = {
        apiKey: geminiApiKey || '',
        modelId: geminiModel,
        psuId: selectedPSU.id,
        psuName: selectedPSU.name,
        branchId: selectedBranch?.id || 'all',
        branchName: selectedBranch?.name || 'General',
        sectionId,
        sectionName,
        negativeMarking: selectedPSU.negativeMarking,
        topicId,
        topicTitle,
        gameMode,
        examFraming: selectedPSU.examType === 'Boards'
          ? 'Indian school board (CBSE/NCERT) examinations'
          : undefined,
        difficultyMin: diffMin,
        difficultyMax: diffMax,
        count: countOverride || storeCount || 10,
        bypassCache: true, // always fetch fresh — no stale questions per session
        seenQuestions,
      };

      const type = gameModeToType(gameMode);
      const bankKey = buildBankKey(params.branchId, sectionId, topicId, type);
      const hasKey = !!geminiApiKey;

      // ── No Gemini key → serve from the shared question bank ──
      if (!hasKey) {
        const banked = await fetchFromBank(bankKey, [diffMin, diffMax], params.count, seenQuestions);
        if (banked.length > 0) {
          setServedFromBank(true);
          if (banked.length < (params.count ?? 10)) {
            showToast(`Only ${banked.length} question${banked.length === 1 ? '' : 's'} available in the bank for this selection. Add a Gemini key for more.`, 'info');
          } else {
            showToast('Showing saved questions — these may repeat. Add a Gemini key for unlimited fresh ones.', 'info');
          }
          return banked;
        }
        throw new Error('No saved questions yet for this selection. Add a Gemini key in Settings to generate fresh questions.');
      }

      // ── Has key → generate live, then bank the batch (fire-and-forget) ──
      const result = gameMode === 'match'
        ? await generateMatchChallenges(params)
        : gameMode === 'tsunami'
          ? await generateTrueFalse(params)
          : await generateQuestions(params);

      // Skip banking inside the embed demo (single-call quota, proxy-keyed).
      if (!isEmbed()) {
        const meta: BankMeta = {
          branchId: params.branchId, sectionId, topicId, type,
          sourceExamId: selectedPSU.id, difficultyRange: [diffMin, diffMax],
        };
        void submitToBank(meta, result as any[]);
      }

      return result;
    } catch (err: any) {
      const msg = err.message || 'Failed to generate questions';
      setError(msg);
      console.error('[useGameQuestions] Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedPSU, selectedBranch, selectedSections, selectedTopics, storeCount, geminiApiKey, geminiModel, getSeenForPsu, showToast]);

  return {
    loadQuestions,
    loading,
    error,
    servedFromBank,
    psu: selectedPSU,
    branch: selectedBranch,
  };
};
