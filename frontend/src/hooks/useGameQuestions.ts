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

type SectionRef = { id: string; name: string; branchSpecific: boolean; difficultyRange: [number, number]; [k: string]: any };
type TopicRef = { id: string; title: string };
type SectionTopicPair = { sec: SectionRef; topic: TopicRef };

/** Match a question's `topic` string back to one of the active topic IDs. */
function matchTopicId(questionTopic: string | undefined, pairs: SectionTopicPair[]): string | null {
  if (!questionTopic) return null;
  const q = questionTopic.toLowerCase().trim();
  const exact = pairs.find(p => p.topic.title.toLowerCase() === q);
  if (exact) return exact.topic.id;
  const partial = pairs.find(p => {
    const t = p.topic.title.toLowerCase();
    return q.includes(t) || t.includes(q);
  });
  return partial?.topic.id ?? null;
}

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
  const [bankingPending, setBankingPending] = useState(false);

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

      // Build per-(section, topic) pairs for individual bank key routing.
      // Seeded questions are stored under single-topic keys; combined keys have no entries.
      const sectionTopicPairs: SectionTopicPair[] = [];
      for (const sec of activeSections) {
        const secTopics = getSyllabusTopics(sec.id, selectedBranch?.id);
        const matched = secTopics.filter(t => selectedTopics.includes(t.id));
        if (matched.length === 0) continue; // skip sections with no selected topics
        for (const topic of matched) sectionTopicPairs.push({ sec: sec as SectionRef, topic });
      }
      // Safety fallback — only if no pairs at all (shouldn't happen through normal UI)
      if (sectionTopicPairs.length === 0) {
        const sec = activeSections[0];
        const secTopics = getSyllabusTopics(sec.id, selectedBranch?.id);
        if (secTopics.length > 0) sectionTopicPairs.push({ sec: sec as SectionRef, topic: secTopics[0] });
      }

      // Pass all selected topics to Gemini — generates questions spread across every topic.
      // Each returned question is matched back to its topic via matchTopicId and banked individually.
      const allTopicTitles = sectionTopicPairs.map(p => p.topic.title).join(', ');
      const allTopicIds = sectionTopicPairs.map(p => p.topic.id).join('_');

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
        topicId: allTopicIds,
        topicTitle: allTopicTitles,
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
      const hasKey = !!geminiApiKey;

      // Helper: branchId for a section's bank key (non-branch-specific sections use 'all')
      const keyBranch = (sec: SectionRef) =>
        sec.branchSpecific ? (selectedBranch?.id || 'all') : 'all';

      // ── No Gemini key → serve from the shared question bank ──
      if (!hasKey) {
        let banked: any[];
        const needed = params.count;

        if (sectionTopicPairs.length === 1) {
          const { sec, topic } = sectionTopicPairs[0];
          banked = await fetchFromBank(
            buildBankKey(keyBranch(sec), sec.id, topic.id, type),
            [diffMin, diffMax], needed, seenQuestions,
          );
        } else {
          // Fetch `needed` from each topic independently — handles imbalanced banks
          // (topic with fewer questions contributes less; others fill the gap).
          const allFetched = await Promise.all(
            sectionTopicPairs.map(({ sec, topic }) =>
              fetchFromBank(
                buildBankKey(keyBranch(sec), sec.id, topic.id, type),
                [diffMin, diffMax], needed, seenQuestions,
              )
            )
          );
          const merged = allFetched.flat();
          for (let i = merged.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [merged[i], merged[j]] = [merged[j], merged[i]];
          }
          banked = merged.slice(0, needed);
        }

        if (banked.length > 0) {
          setServedFromBank(true);
          if (banked.length < (params.count ?? 10)) {
            showToast(`Only ${banked.length} question${banked.length === 1 ? '' : 's'} available in the bank for this selection. Add a Gemini key for more.`, 'info');
          } else {
            showToast('Showing saved questions — these may repeat. Add a Gemini key for unlimited fresh ones.', 'info');
          }
          return banked;
        }
        // Bank is empty — mark the error so play screens can offer the configure CTA
        const err: any = new Error('No questions have been seeded for this topic yet. Add a Gemini key in Settings to generate fresh questions.');
        err.needsApiKey = true;
        throw err;
      }

      // ── Has key → generate live, then bank the batch (fire-and-forget) ──
      const result = gameMode === 'match'
        ? await generateMatchChallenges(params)
        : gameMode === 'tsunami'
          ? await generateTrueFalse(params)
          : await generateQuestions(params);

      // Skip banking inside the embed demo (single-call quota, proxy-keyed).
      if (!isEmbed()) {
        setBankingPending(true);
        const groups = new Map<string, { pair: SectionTopicPair; qs: any[] }>();
        for (const q of result as any[]) {
          const tid = matchTopicId(q.topicTitle, sectionTopicPairs);
          const pair = tid
            ? sectionTopicPairs.find(p => p.topic.id === tid)
            : sectionTopicPairs[0];
          if (!pair) continue;
          if (!groups.has(pair.topic.id)) groups.set(pair.topic.id, { pair, qs: [] });
          groups.get(pair.topic.id)!.qs.push(q);
        }
        Promise.all(
          Array.from(groups.values()).map(({ pair, qs }) =>
            submitToBank({
              branchId: keyBranch(pair.sec), sectionId: pair.sec.id, topicId: pair.topic.id, type,
              sourceExamId: selectedPSU.id, difficultyRange: pair.sec.difficultyRange,
            }, qs)
          )
        ).finally(() => setBankingPending(false));
      }

      return result;
    } catch (err: any) {
      const msg = err.message || 'Failed to generate questions';
      setError(msg);
      if (!err.needsApiKey) console.error('[useGameQuestions] Error:', err);
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
    bankingPending,
    psu: selectedPSU,
    branch: selectedBranch,
  };
};
