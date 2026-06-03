import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Animated, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { MCQQuestion } from '@/services/gemini';
import { useGameQuestions } from '@/hooks/useGameQuestions';
import { GameResultScreen, GenericResultItem } from '@/components/game/GameResultScreen';
import { UnifiedQuestion } from '@/components/game/UnifiedQuestion';

type SessionState = 'loading' | 'playing' | 'result';

export default function MCQScreen() {
  const router = useRouter();
  const { selectedPSU, selectedBranch, questionCount } = useExamStore();
  const { geminiModel, fullName } = useSettingsStore();
  const { isQuestionBookmarked, addQuestionBookmark, removeQuestionBookmark, questionBookmarks } = useBookmarkStore();

  const [state, setState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{ q: MCQQuestion; chosen: string | null; correct: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const psu = selectedPSU!;

  const { loadQuestions: fetchQuestions } = useGameQuestions();

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    setState('loading');
    setError(null);
    try {
      const qs = await fetchQuestions('mcq', questionCount);
      setQuestions(qs as MCQQuestion[]);
      setState('playing');
    } catch (e: any) {
      setError(e.message ?? 'Failed to load questions');
    }
  }

  function handleAnswer(option: string | Record<string, string>) {
    if (typeof option !== 'string') return;
    const q = questions[current];
    // Check if the first letter of the option matches q.correct
    const isCorrect = option.trim()[0]?.toUpperCase() === q.correct.trim()[0]?.toUpperCase();
    
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setResults(r => [...r, { q, chosen: option, correct: isCorrect }]);
    
    if (current + 1 >= questions.length) {
      setState('result');
    } else {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
      setCurrent(c => c + 1);
    }
  }

  function handleSkip() {
    const q = questions[current];
    setResults(r => [...r, { q, chosen: null, correct: false }]);
    if (current + 1 >= questions.length) {
      setState('result');
    } else {
      setCurrent(c => c + 1);
    }
  }

  if (state === 'loading') {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        {error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Failed to load questions</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadQuestions}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>Generating Questions</Text>
            <Text style={styles.loadingDesc}>
              {geminiModel} is crafting {questionCount} questions tailored to {psu.name}...
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (state === 'result') {
    const genericResults: GenericResultItem[] = results.map(r => ({
      id: r.q.id,
      question: r.q.question,
      explanation: r.q.explanation,
      topic: r.q.topicTitle,
      isCorrect: r.correct,
      type: 'mcq',
      yourAnswer: r.chosen || 'Skipped',
      correctAnswer: r.q.options.find(o => o.trim()[0]?.toUpperCase() === r.q.correct.trim()[0]?.toUpperCase()),
      rawQuestion: r.q
    }));

    return (
      <GameResultScreen
        modeName="Mock MCQ Session"
        score={score}
        statsLabel="Accuracy"
        statsValue={`${Math.round((score / questions.length) * 100)}%`}
        results={genericResults}
        onRestart={() => router.replace('/play/mcq')}
        onHome={() => router.replace('/')}
      />
    );
  }

  const q = questions[current];
  const progress = (current + 1) / questions.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topControls}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.questionNavTitle}>Question {current + 1} of {questions.length}</Text>
        <View style={styles.bookmarkPlaceholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressBarContainer}>
           <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>

        <Animated.View style={{ opacity: fadeAnim, marginTop: Spacing.xl }}>
           <UnifiedQuestion
             type="mcq"
             mode="interactive"
             theme="light"
             question={q.question}
             options={q.options}
             onAnswer={handleAnswer}
             isBookmarked={isQuestionBookmarked(q.id)}
             bookmarkNote={questionBookmarks.find(b => b.id === q.id)?.note}
             onToggleBookmark={(note) => {
               if (isQuestionBookmarked(q.id)) {
                 removeQuestionBookmark(q.id);
               } else {
                 addQuestionBookmark({
                   ...q,
                   note: note || '',
                   psuName: selectedPSU?.name || '',
                   branchName: selectedBranch?.name || '',
                   topicTitle: q.topicTitle || 'General'
                 });
               }
             }}
           />
        </Animated.View>
      </ScrollView>

      <View style={styles.actionFooter}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>SKIP THIS{"\n"}QUESTION</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  center: { flex: 1, backgroundColor: '#F9FBFF', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  topControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.sm },
  questionNavTitle: { ...Typography.h3, color: '#1A237E' },
  bookmarkPlaceholder: { width: 40 },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  
  progressBarContainer: { height: 6, backgroundColor: '#F0F2F5', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 3 },

  actionFooter: { 
    padding: Spacing.lg, 
    backgroundColor: '#FFF', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F2F5',
    alignItems: 'center',
    paddingBottom: Spacing.xl
  },
  skipBtn: { alignItems: 'center' },
  skipBtnText: { ...Typography.button, color: '#6B7280', textAlign: 'center' },

  loadingState: { alignItems: 'center', gap: Spacing.lg },
  loadingTitle: { ...Typography.h3, color: Colors.onSurface },
  loadingDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  errorState: { alignItems: 'center', gap: Spacing.md },
  errorEmoji: { fontSize: 48 },
  errorTitle: { ...Typography.h3, color: Colors.onSurface },
  errorDesc: { ...Typography.bodyMd, color: Colors.error, textAlign: 'center', lineHeight: 22 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  retryText: { ...Typography.button, color: Colors.white },
});
