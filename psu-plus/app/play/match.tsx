import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Animated
} from 'react-native';
import { Alert } from '@/utils/alert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { MatchChallenge, MatchPair } from '@/services/gemini';
import { useGameQuestions } from '@/hooks/useGameQuestions';
import { GameResultScreen, GenericResultItem } from '@/components/game/GameResultScreen';
import { UnifiedQuestion } from '@/components/game/UnifiedQuestion';

type GameState = 'loading' | 'playing' | 'result';

export default function MatchScreen() {
  const router = useRouter();
  const { selectedPSU, selectedBranch } = useExamStore();
  const { fullName } = useSettingsStore();
  const { isQuestionBookmarked, addQuestionBookmark, removeQuestionBookmark, questionBookmarks } = useBookmarkStore();

  if (!selectedPSU) { router.replace('/'); return null; }

  const [gameState, setGameState] = useState<GameState>('loading');
  const [challenges, setChallenges] = useState<MatchChallenge[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  
  const [leftSelected, setLeftSelected] = useState<string | null>(null);
  const [rightSelected, setRightSelected] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({}); // leftId -> rightId
  const [shuffledRights, setShuffledRights] = useState<MatchPair[]>([]);
  const [results, setResults] = useState<{ q: MatchChallenge; score: number; userMatches: Record<string, string> }[]>([]);


  useEffect(() => {
    loadMatchChallenges();
  }, []);

  useEffect(() => {
    if (challenges[currentIdx]) {
      const pairs = challenges[currentIdx].pairs;
      setShuffledRights([...pairs].sort(() => Math.random() - 0.5));
      setMatches({});
    }
  }, [currentIdx, challenges]);

  const { loadQuestions: fetchQuestions } = useGameQuestions();

  async function loadMatchChallenges() {
    setGameState('loading');
    try {
      const data = await fetchQuestions('match');
      setChallenges(data as MatchChallenge[]);
      setGameState('playing');
    } catch (e: any) {
      Alert.alert('Connection Failure', e.message);
      router.back();
    }
  }

  // handleLeftPress and handleRightPress are now handled internally by UnifiedQuestion

  function handleSkip() {
    const currentChallenge = challenges[currentIdx];
    setResults(prev => [...prev, { q: currentChallenge, score: 0, userMatches: {} }]);
    if (currentIdx + 1 < challenges.length) {
      setCurrentIdx(c => c + 1);
    } else {
      setGameState('result');
    }
  }

  function handleNext() {
    const currentChallenge = challenges[currentIdx];
    let correctCount = 0;
    currentChallenge.pairs.forEach(p => {
      if (matches[p.id] === p.id) correctCount++;
    });
    const setScoreValue = Math.round((correctCount / currentChallenge.pairs.length) * 100);
    setScore(s => s + setScoreValue);
    setResults(prev => [...prev, { q: currentChallenge, score: setScoreValue, userMatches: { ...matches } }]);
    if (currentIdx + 1 < challenges.length) {
      setCurrentIdx(c => c + 1);
    } else {
      setGameState('result');
    }
  }

  if (gameState === 'loading') {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTitle}>Preparing Challenges...</Text>
      </SafeAreaView>
    );
  }

  if (gameState === 'result') {
    const genericResults: GenericResultItem[] = results.map(r => ({
      id: r.q.id,
      question: "Match the following terms correctly.",
      explanation: r.q.explanation,
      isCorrect: r.score === 100,
      type: 'match',
      matchPairs: r.q.pairs.map(p => ({
        left: p.left,
        right: p.right,
        userRight: r.q.pairs.find(x => x.id === r.userMatches[p.id])?.right || 'None',
        isCorrect: r.userMatches[p.id] === p.id
      })),
      rawQuestion: {
        ...r.q,
        question: "Match the following terms correctly.",
        options: r.q.pairs.map(p => `${p.id}|${p.left}|${p.right}`),
        correct: "MATCHING_TYPE"
      }
    }));

    return (
      <GameResultScreen
        modeName="Match Making"
        score={score}
        statsLabel="Challenges Cleared"
        statsValue={challenges.length}
        results={genericResults}
        onRestart={() => router.replace('/play/match')}
        onHome={() => router.replace('/')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.headerTitle}>Match Making</Text></View>
        <View style={styles.bookmarkPlaceholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>CHALLENGE {currentIdx + 1} OF {challenges.length}</Text>
          <View style={styles.miniProgressBar}>
            <View style={[styles.miniProgressFill, { width: `${(currentIdx / challenges.length) * 100}%` }]} />
          </View>
        </View>
        <Text style={styles.instruction}>Connect the related terms from both lists.</Text>
        
          <UnifiedQuestion
            type="match"
            mode="interactive"
            theme="light"
            pairs={challenges[currentIdx].pairs}
            currentMatches={matches}
            onMatchesChange={setMatches}
            onAnswer={handleNext}
            isBookmarked={isQuestionBookmarked(challenges[currentIdx].id)}
            bookmarkNote={questionBookmarks.find(b => b.id === challenges[currentIdx].id)?.note}
            onToggleBookmark={(note) => {
              if (isQuestionBookmarked(challenges[currentIdx].id)) {
                removeQuestionBookmark(challenges[currentIdx].id);
              } else {
                addQuestionBookmark({
                  id: challenges[currentIdx].id,
                  type: 'match',
                  explanation: challenges[currentIdx].explanation,
                  pairs: challenges[currentIdx].pairs,
                  psuName: selectedPSU?.name || '',
                  branchName: selectedBranch?.name || '',
                  topicTitle: 'Match Making',
                  note: note || ''
                } as any);
              }
            }}
          />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}><Text style={styles.skipBtnText}>SKIP</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, Object.keys(matches).length === 0 && styles.nextBtnDisabled]} onPress={handleNext} disabled={Object.keys(matches).length === 0}>
          <Text style={styles.nextBtnText}>{currentIdx + 1 === challenges.length ? 'SAVE & FINISH' : 'SAVE & NEXT'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FBFF', padding: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  headerTitle: { ...Typography.h4, color: Colors.primary },
  headerCenter: { flex: 1, alignItems: 'center' },
  bookmarkPlaceholder: { width: 40 },
  backBtn: { padding: Spacing.sm },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  progressText: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 10 },
  miniProgressBar: { flex: 1, height: 4, backgroundColor: '#F0F2F5', borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 2 },
  instruction: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', opacity: 0.8 },
  matchGrid: { flexDirection: 'row', gap: Spacing.md },
  column: { flex: 1, gap: Spacing.sm },
  columnHeader: { ...Typography.labelCaps, color: Colors.outline, textAlign: 'center', marginBottom: 4, fontSize: 10 },
  matchCard: { minHeight: 85, backgroundColor: '#FFF', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1.5, borderColor: '#F0F2F5', justifyContent: 'center', alignItems: 'center', ...Shadows.card },
  cardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '0D' },
  cardLocked: { borderColor: Colors.primary, backgroundColor: '#F0F7FF' },
  cardText: { ...Typography.bodySm, color: Colors.onSurface, textAlign: 'center', lineHeight: 18, fontFamily: 'Inter_600SemiBold' },
  textLocked: { color: Colors.primary, opacity: 0.8 },
  footer: { flexDirection: 'row', padding: Spacing.lg, paddingBottom: Spacing.xl, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F2F5', gap: Spacing.md },
  skipBtn: { flex: 1, backgroundColor: '#F2F4F7', borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center' },
  skipBtnText: { ...Typography.button, color: Colors.onSurfaceVariant },
  nextBtn: { flex: 2, backgroundColor: '#000051', borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', ...Shadows.button },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { ...Typography.button, color: '#FFF' },
  loadingTitle: { ...Typography.h4, color: Colors.onSurfaceVariant, marginTop: Spacing.md },
});
