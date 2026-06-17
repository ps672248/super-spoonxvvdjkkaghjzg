import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useExamStore } from '../../stores/examStore';
import { useActivityStore } from '../../stores/activityStore';
import { useSeenQuestionsStore } from '../../stores/seenQuestionsStore';
import { upsertLeaderboard } from '../../services/leaderboard';
import { categoryIdForExam } from '../../config/categories';
import { useConfigStore } from '../../stores/configStore';
import { UnifiedQuestion } from './UnifiedQuestion';
import { reportToBank } from '../../services/questionBank';
import { useToast } from '../../context/ToastContext';
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
  const { selectedPSU, selectedBranch, selectedSections, selectedTopics, selectedMode } = useExamStore();
  const { categories } = useConfigStore();
  const { addQuestionBookmark, isQuestionBookmarked, updateQuestionNote, removeQuestionBookmark, questionBookmarks } = useBookmarkStore();
  const { logSession } = useActivityStore();
  const { markSeen } = useSeenQuestionsStore();
  const { showToast } = useToast();
  const [noteModalItem, setNoteModalItem] = React.useState<GenericResultItem | null>(null);
  const [localNote, setLocalNote] = React.useState('');
  const [reportedIds, setReportedIds] = React.useState<Set<string>>(new Set());

  const handleReport = async (item: GenericResultItem) => {
    if (reportedIds.has(item.id)) return;
    setReportedIds(prev => new Set(prev).add(item.id));
    const ok = await reportToBank(item.id);
    showToast(
      ok ? 'Reported — we’ll review this question.' : 'Could not send report. Try again later.',
      ok ? 'success' : 'error',
    );
  };

  const firstName = fullName.split(' ')[0];
  const router = useRouter();

  // Log session once when result screen mounts
  React.useEffect(() => {
    if (!selectedPSU || !selectedBranch) return;
    const mode = (selectedMode ?? 'mcq');
    // Log the session, then upsert leaderboards from the now-updated local sessions.
    // Fire-and-forget — never block the results screen. upsert no-ops for guests/embed.
    logSession({
      psuId: selectedPSU.id,
      psuName: selectedPSU.name,
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      sections: selectedSections,
      topics: selectedTopics,
      gameMode: mode,
      questionsTotal: results.length,
      questionsCorrect: results.filter(r => r.isCorrect).length,
      score,
    }).then(() => {
      upsertLeaderboard(
        mode,
        fullName,
        selectedBranch.id,
        useActivityStore.getState().sessions,
        categoryIdForExam(selectedPSU.id, categories),
      );
    });
    // Log question texts to seen store so Gemini avoids them next session
    const questionTexts = results
      .map(r => r.question)
      .filter((q): q is string => typeof q === 'string' && q.length > 0);
    if (questionTexts.length > 0) {
      markSeen(selectedPSU.id, questionTexts);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fire once on mount only

  const handleBookmarkPress = (item: GenericResultItem) => {
    const bookmarked = isQuestionBookmarked(item.id);
    if (bookmarked) {
      removeQuestionBookmark(item.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setLocalNote(questionBookmarks.find(b => b.id === item.id)?.note || '');
      setNoteModalItem(item);
    }
  };
  
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
            const reported = reportedIds.has(item.id);

            return (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewCardTop}>
                  <View style={styles.questionTag}>
                    <Text style={styles.questionTagText}>
                      {item.type === 'mcq' ? 'QUESTION' : 'CHALLENGE'} {String(i + 1).padStart(2, '0')} • {item.topic?.toUpperCase() || 'GENERAL'}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleReport(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons
                        name={reported ? 'flag' : 'flag-outline'}
                        size={20}
                        color={reported ? Colors.survivalRed : Colors.outline}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleBookmarkPress(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons
                        name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={22}
                        color={bookmarked ? Colors.gold : Colors.outline}
                      />
                    </TouchableOpacity>
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
                />
              </View>
            );
          })}
        </View>

        {/* Interview prep nudge — only for PSUs with interview rounds */}
        {selectedPSU?.hasInterview && (
          <TouchableOpacity
            style={styles.interviewNudge}
            onPress={() => { onHome(); router.push('/interview-prep' as any); }}
            activeOpacity={0.85}
          >
            <View style={styles.interviewNudgeLeft}>
              <View style={styles.interviewNudgeIcon}>
                <Ionicons name="mic" size={22} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.interviewNudgeTitle}>Ready for the Interview Round?</Text>
                <Text style={styles.interviewNudgeDesc}>{selectedPSU.name} has a {selectedPSU.interviewStages?.[0] ?? 'personal interview'} round. Practice with AI mock panels.</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.restartBtn} onPress={onRestart}>
            <Text style={styles.restartBtnText}>RESTART</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={onHome}>
            <Text style={styles.homeBtnText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={!!noteModalItem} transparent animationType="fade" onRequestClose={() => setNoteModalItem(null)}>
        <View style={styles.noteOverlay}>
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Save to Bookmarks</Text>
            <Text style={styles.noteSubtitle}>Add an optional note for this question</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Type your note here..."
              placeholderTextColor={Colors.outline}
              multiline
              value={localNote}
              onChangeText={setLocalNote}
              maxLength={200}
            />
            <View style={styles.noteActions}>
              <TouchableOpacity style={styles.noteCancelBtn} onPress={() => setNoteModalItem(null)}>
                <Text style={styles.noteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noteSaveBtn}
                onPress={async () => {
                  if (noteModalItem) {
                    await addQuestionBookmark({
                      ...noteModalItem.rawQuestion,
                      yourAnswer: noteModalItem.type === 'mcq' ? noteModalItem.yourAnswer : JSON.stringify(noteModalItem.matchPairs),
                      psuName: selectedPSU?.name || 'PSU',
                      branchName: selectedBranch?.name || 'General',
                      note: localNote,
                    });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setNoteModalItem(null);
                }}
              >
                <Text style={styles.noteSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  scrollContent: { paddingBottom: Spacing.xxxl },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
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
  noteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.xl },
  noteCard: { backgroundColor: '#FFF', borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.lg, ...Shadows.cardHover },
  noteTitle: { ...Typography.h2, color: Colors.primary },
  noteSubtitle: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: -8 },
  noteInput: { backgroundColor: '#F8FAFF', borderRadius: Radius.md, padding: Spacing.md, height: 100, textAlignVertical: 'top', ...Typography.bodyMd, color: Colors.onSurface, borderWidth: 1, borderColor: '#E1E8F0' },
  noteActions: { flexDirection: 'row', gap: Spacing.md },
  noteCancelBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: '#F0F2F5' },
  noteCancelText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, fontFamily: 'Inter_700Bold' },
  noteSaveBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.primary },
  noteSaveText: { ...Typography.bodyMd, color: '#FFF', fontFamily: 'Inter_700Bold' },
  interviewNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    ...Shadows.card,
  },
  interviewNudgeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  interviewNudgeIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  interviewNudgeTitle: {
    ...Typography.bodyMd,
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  interviewNudgeDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  footerActions: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md },
  restartBtn: { flex: 1, backgroundColor: '#F2F4F7', paddingVertical: Spacing.lg, borderRadius: Radius.md, alignItems: 'center' },
  restartBtnText: { ...Typography.button, color: Colors.onSurfaceVariant },
  homeBtn: { flex: 1, backgroundColor: Colors.gold, paddingVertical: Spacing.lg, borderRadius: Radius.md, alignItems: 'center', ...Shadows.button },
  homeBtnText: { ...Typography.button, color: Colors.secondary },
});
