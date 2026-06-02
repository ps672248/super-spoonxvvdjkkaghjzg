import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useGameQuestions, MCQQuestion } from '@/hooks/useGameQuestions';
import { GameResultScreen, GenericResultItem } from '@/components/game/GameResultScreen';
import { UnifiedQuestion } from '@/components/game/UnifiedQuestion';

type GameState = 'loading' | 'playing' | 'result';

export default function SurvivalScreen() {
  const router = useRouter();
  const { selectedPSU } = useExamStore();
  const { isQuestionBookmarked, addQuestionBookmark, removeQuestionBookmark, questionBookmarks } = useBookmarkStore();

  if (!selectedPSU) { router.replace('/'); return null; }

  const [gameState, setGameState] = useState<GameState>('loading');
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [results, setResults] = useState<{ q: MCQQuestion; chosen: string; correct: boolean }[]>([]);

  const { loadQuestions: fetchQuestions } = useGameQuestions();

  useEffect(() => {
    loadSurvival();
  }, []);

  async function loadSurvival() {
    setGameState('loading');
    try {
      const data = await fetchQuestions('mcq');
      setQuestions(data as MCQQuestion[]);
      setGameState('playing');
    } catch (e: any) {
      Alert.alert('Connection Failure', e.message);
      router.back();
    }
  }

  function handleAnswer(option: string | Record<string, string>) {
    if (typeof option !== 'string') return;
    const q = questions[currentIdx];
    const isCorrect = option.trim()[0]?.toUpperCase() === q.correct.trim()[0]?.toUpperCase();
    
    if (isCorrect) {
      setScore(s => s + 10);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setLives(l => l - 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setResults(prev => [...prev, { q, chosen: option, correct: isCorrect }]);

    if (lives - (isCorrect ? 0 : 1) <= 0 || currentIdx + 1 >= questions.length) {
      setGameState('result');
    } else {
      setCurrentIdx(c => c + 1);
    }
  }

  if (gameState === 'loading') {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTitle}>Initializing Simulator...</Text>
      </SafeAreaView>
    );
  }

  if (gameState === 'result') {
    const genericResults: GenericResultItem[] = results.map(r => ({
      id: r.q.id,
      question: r.q.question,
      explanation: r.q.explanation,
      topic: r.q.topicTitle,
      isCorrect: r.correct,
      type: 'mcq',
      yourAnswer: r.chosen,
      correctAnswer: r.q.options.find(o => o.trim()[0]?.toUpperCase() === r.q.correct.trim()[0]?.toUpperCase()),
      rawQuestion: r.q
    }));

    return (
      <GameResultScreen
        modeName="Survival Mode"
        score={score}
        statsLabel="Lives Remaining"
        statsValue={Math.max(0, lives)}
        results={genericResults}
        onRestart={() => router.replace('/play/survival')}
        onHome={() => router.replace('/')}
      />
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.headerTitle}>Survival Quest</Text></View>
        <View style={styles.livesRow}>
          {[...Array(3)].map((_, i) => (
            <Ionicons key={i} name="heart" size={20} color={i < lives ? Colors.error : Colors.outline} style={{ marginLeft: 4 }} />
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.qHeader}>
          <Text style={styles.qTopic}>{(currentQ.topicTitle || 'General').toUpperCase()}</Text>
          <Text style={styles.qProgress}>QUESTION {currentIdx + 1} / {questions.length}</Text>
        </View>
        
        <UnifiedQuestion
          type="mcq"
          mode="interactive"
          theme="light"
          question={currentQ.question}
          options={currentQ.options}
          onAnswer={handleAnswer}
          isBookmarked={isQuestionBookmarked(currentQ.id)}
          bookmarkNote={questionBookmarks.find(b => b.id === currentQ.id)?.note}
          onToggleBookmark={(note) => {
            if (isQuestionBookmarked(currentQ.id)) {
              removeQuestionBookmark(currentQ.id);
            } else {
              addQuestionBookmark({
                ...currentQ,
                note: note || '',
                psuName: selectedPSU?.name || '',
                branchName: 'General',
                topicTitle: currentQ.topicTitle || 'General'
              });
            }
          }}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValueHud}>{score}</Text>
        </View>
        <View style={styles.bookmarkPlaceholder} />
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
  backBtn: { padding: Spacing.sm },
  livesRow: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1, padding: Spacing.xl },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  qTopic: { ...Typography.labelCaps, color: Colors.primary, letterSpacing: 2 },
  qProgress: { ...Typography.labelCaps, color: Colors.outline },
  questionText: { ...Typography.h2, color: Colors.onSurface, marginBottom: Spacing.xxl, lineHeight: 32 },
  optionsContainer: { gap: Spacing.md },
  optionBtn: { backgroundColor: '#FFF', padding: Spacing.xl, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#F0F2F5', ...Shadows.card },
  optionText: { ...Typography.bodyMd, color: Colors.onSurface, fontFamily: 'Inter_600SemiBold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderTopWidth: 1, borderTopColor: '#F0F2F5', backgroundColor: '#FFF' },
  scoreBox: { alignItems: 'flex-start' },
  scoreLabel: { ...Typography.labelCaps, color: Colors.outline, fontSize: 10 },
  scoreValueHud: { ...Typography.h3, color: Colors.primary },
  bookmarkPlaceholder: { width: 40 },
  loadingTitle: { ...Typography.h4, color: Colors.onSurfaceVariant, marginTop: Spacing.md },
});
