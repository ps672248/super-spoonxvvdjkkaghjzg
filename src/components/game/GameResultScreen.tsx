import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useExamStore } from '../../stores/examStore';
import { UnifiedQuestion } from './UnifiedQuestion';
import * as Haptics from 'expo-haptics';

export interface GenericResultItem {
  id: string;
  question: string;
  explanation: string;
  topic?: string;
  isCorrect: boolean;
  type: 'mcq' | 'match';
  
  // MCQ specific
  yourAnswer?: string;
  correctAnswer?: string;
  
  // Match specific
  matchPairs?: {
    left: string;
    right: string;
    userRight: string;
    isCorrect: boolean;
  }[];
  
  // Raw question object for bookmarking service
  rawQuestion: any;
}

interface GameResultScreenProps {
  modeName: string;
  score: number;
  statsLabel: string;
  statsValue: string | number;
  results: GenericResultItem[];
  onRestart: () => void;
  onHome: () => void;
  personalMessage?: string;
}

export const GameResultScreen = ({
  modeName,
  score,
  statsLabel,
  statsValue,
  results,
  onRestart,
  onHome,
  personalMessage
}: GameResultScreenProps) => {
  const { fullName } = useSettingsStore();
  const { selectedPSU, selectedBranch } = useExamStore();
  const { addQuestionBookmark, isQuestionBookmarked, updateQuestionNote, removeQuestionBookmark, questionBookmarks } = useBookmarkStore();
  
  const firstName = fullName.split(' ')[0];
  
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <View style={styles.headerCard}>
          <Text style={styles.modeTitle}>{modeName}{"\n"}Results</Text>
          <Text style={styles.personalMsg}>
            {personalMessage || `Great effort, ${firstName}! Keep pushing your boundaries.`}
          </Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreLabel}>TOTAL POINTS</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreStats}>{statsValue} {statsLabel}</Text>
          </View>
        </View>

        {/* Results List */}
        <View style={styles.resultsList}>
          <Text style={styles.reviewHeader}>TRAINING LOG</Text>
          {results.map((item, i) => {
            const bookmarked = isQuestionBookmarked(item.id);
            const savedNote = questionBookmarks.find(b => b.id === item.id)?.note;

            return (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewCardTop}>
                  <View style={styles.questionTag}>
                    <Text style={styles.questionTagText}>
                      {item.type === 'mcq' ? 'QUESTION' : 'CHALLENGE'} {String(i + 1).padStart(2, '0')} • {item.topic?.toUpperCase() || 'GENERAL'}
                    </Text>
                  </View>
                </View>

                <UnifiedQuestion
                  type={item.type}
                  mode="review"
                  question={item.question}
                  explanation={item.explanation}
                  isCorrect={item.isCorrect}
                  options={item.type === 'mcq' ? item.rawQuestion.options : undefined}
                  userAnswer={item.type === 'mcq' ? item.yourAnswer : item.matchPairs?.reduce((acc: any, p) => ({ ...acc, [p.left]: p.userRight }), {})}
                  correctAnswer={item.type === 'mcq' ? item.correctAnswer : undefined}
                  pairs={item.type === 'match' ? item.matchPairs?.map(p => ({ id: p.left, left: p.left, right: p.right })) : undefined}
                  isBookmarked={bookmarked}
                  bookmarkNote={savedNote}
                  onToggleBookmark={async (note) => {
                    if (bookmarked) {
                      if (!note) {
                        await removeQuestionBookmark(item.id);
                      } else {
                        await updateQuestionNote(item.id, note);
                      }
                    } else {
                      await addQuestionBookmark({
                        ...item.rawQuestion,
                        yourAnswer: item.type === 'mcq' ? item.yourAnswer : JSON.stringify(item.matchPairs),
                        psuName: selectedPSU?.name || 'PSU',
                        branchName: selectedBranch?.name || 'General',
                        note: note || '',
                      });
                    }
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.restartBtn} onPress={onRestart}>
            <Text style={styles.restartBtnText}>RESTART</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={onHome}>
            <Text style={styles.homeBtnText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  scrollContent: { paddingBottom: Spacing.xxxl },
  headerCard: { 
    backgroundColor: '#1A237E', 
    padding: Spacing.xl, 
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    alignItems: 'center',
    ...Shadows.cardHover
  },
  modeTitle: { ...Typography.h1, color: '#FFF', textAlign: 'center', fontSize: 36, lineHeight: 42 },
  personalMsg: { ...Typography.bodyMd, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.xl },
  scoreBadge: { 
    backgroundColor: Colors.gold, 
    borderRadius: Radius.lg, 
    paddingHorizontal: Spacing.xxl, 
    paddingVertical: Spacing.xl, 
    marginTop: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.button
  },
  scoreLabel: { ...Typography.labelCaps, color: Colors.secondary, fontSize: 12 },
  scoreValue: { ...Typography.h1, color: Colors.secondary, fontSize: 48, marginVertical: 4 },
  scoreStats: { ...Typography.bodySm, color: Colors.secondary, fontFamily: 'Inter_600SemiBold' },

  resultsList: { padding: Spacing.lg, gap: Spacing.xl },
  reviewHeader: { color: Colors.outline, fontSize: 12, fontWeight: '900', letterSpacing: 4, marginBottom: 4 },
  reviewCard: { 
    backgroundColor: '#FFF', 
    borderRadius: Radius.md, 
    padding: Spacing.lg, 
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    borderTopWidth: 4,
    borderTopColor: Colors.gold
  },
  reviewCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  questionTag: { backgroundColor: '#FFF9E6', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill },
  questionTagText: { ...Typography.labelCaps, color: '#B8860B', fontSize: 9, fontFamily: 'Inter_700Bold' },
  footerActions: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md },
  restartBtn: { flex: 1, backgroundColor: '#F2F4F7', paddingVertical: Spacing.lg, borderRadius: Radius.md, alignItems: 'center' },
  restartBtnText: { ...Typography.button, color: Colors.onSurfaceVariant },
  homeBtn: { flex: 1, backgroundColor: Colors.gold, paddingVertical: Spacing.lg, borderRadius: Radius.md, alignItems: 'center', ...Shadows.button },
  homeBtnText: { ...Typography.button, color: Colors.secondary },
});
