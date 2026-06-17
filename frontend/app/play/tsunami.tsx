import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Animated, PanResponder, Dimensions, Platform, Modal, TextInput,
} from 'react-native';
import { Alert } from '@/utils/alert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useGameQuestions, TFStatement } from '@/hooks/useGameQuestions';
import { GameResultScreen, GenericResultItem } from '@/components/game/GameResultScreen';
import { ApiKeyModal } from '@/components/ApiKeyModal';

type GameState = 'loading' | 'playing' | 'result';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const useNative = Platform.OS !== 'web';

export default function TsunamiScreen() {
  const router = useRouter();
  const { selectedPSU, selectedBranch } = useExamStore();
  const { isQuestionBookmarked, addQuestionBookmark, removeQuestionBookmark } = useBookmarkStore();

  if (!selectedPSU) { router.replace('/'); return null; }

  const [gameState, setGameState] = useState<GameState>('loading');
  const [statements, setStatements] = useState<TFStatement[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [results, setResults] = useState<{ s: TFStatement; choice: boolean; correct: boolean }[]>([]);
  const [showApiModal, setShowApiModal] = useState(false);

  // Note modal (bookmark with an optional note)
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [localNote, setLocalNote] = useState('');

  const pan = useRef(new Animated.ValueXY()).current;
  const { loadQuestions, bankingPending } = useGameQuestions();

  useEffect(() => { load(); }, []);

  // Recenter the card whenever a new statement comes up.
  useEffect(() => { pan.setValue({ x: 0, y: 0 }); }, [currentIdx]);

  async function load() {
    setGameState('loading');
    try {
      const data = await loadQuestions('tsunami');
      setStatements(data as TFStatement[]);
      setGameState('playing');
    } catch (e: any) {
      if (e.needsApiKey) { setShowApiModal(true); return; }
      Alert.alert('Connection Failure', e.message);
      router.back();
    }
  }

  function register(choice: boolean) {
    const stmt = statements[currentIdx];
    if (!stmt) return;
    const correct = choice === stmt.isTrue;

    let nCombo = combo, nScore = score, nLives = lives;
    if (correct) {
      nCombo = combo + 1;
      nScore = score + 10 * nCombo; // combo multiplier
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      nCombo = 0;
      nLives = lives - 1;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setResults(prev => [...prev, { s: stmt, choice, correct }]);
    setCombo(nCombo);
    if (nCombo > bestCombo) setBestCombo(nCombo);
    setScore(nScore);
    setLives(nLives);

    if (nLives <= 0 || currentIdx + 1 >= statements.length) {
      setGameState('result');
    } else {
      setCurrentIdx(c => c + 1);
    }
  }

  // Bookmark payload — stored as a 2-option MCQ (correct = 'T'/'F' so the shared
  // MCQ bookmark renderer highlights the right answer via first-char matching).
  function tfPayload(s: TFStatement, note: string) {
    return {
      id: s.id,
      type: 'mcq',
      question: s.statement,
      options: ['True', 'False'],
      correct: s.isTrue ? 'T' : 'F',
      explanation: s.explanation,
      psuName: selectedPSU?.name || '',
      branchName: selectedBranch?.name || 'General',
      topicTitle: s.topicTitle || 'General',
      note,
    } as any;
  }

  // Fling the card off-screen, then register the answer.
  function fling(choice: boolean) {
    Animated.timing(pan, {
      toValue: { x: choice ? SCREEN_W * 1.4 : -SCREEN_W * 1.4, y: 0 },
      duration: 220,
      useNativeDriver: useNative,
    }).start(() => register(choice));
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          if (g.dx > SWIPE_THRESHOLD) fling(true);
          else if (g.dx < -SWIPE_THRESHOLD) fling(false);
          else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: useNative }).start();
        },
      }),
    [currentIdx, combo, score, lives, statements],
  );

  if (gameState === 'loading') {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTitle}>Summoning the Tsunami…</Text>
        <ApiKeyModal
          visible={showApiModal}
          onClose={() => { setShowApiModal(false); router.back(); }}
          onConfigure={() => router.replace('/api-setup' as any)}
        />
      </SafeAreaView>
    );
  }

  if (gameState === 'result') {
    const generic: GenericResultItem[] = results.map(r => ({
      id: r.s.id,
      question: r.s.statement,
      explanation: r.s.explanation,
      topic: r.s.topicTitle,
      isCorrect: r.correct,
      type: 'mcq',
      yourAnswer: r.choice ? 'True' : 'False',
      correctAnswer: r.s.isTrue ? 'True' : 'False',
      rawQuestion: {
        ...r.s,
        question: r.s.statement,
        options: ['True', 'False'],
        correct: r.s.isTrue ? 'T' : 'F',
      },
    }));

    return (
      <GameResultScreen
        modeName="Tsunami"
        score={score}
        statsLabel="Best Combo"
        statsValue={`x${bestCombo}`}
        results={generic}
        onRestart={() => router.replace('/play/tsunami')}
        onHome={() => router.replace('/')}
        extraStats={{ bestCombo }}
        bankingPending={bankingPending}
      />
    );
  }

  const stmt = statements[currentIdx];

  // Overlay opacity + tilt from drag.
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const trueOpacity = pan.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const falseOpacity = pan.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.livesRow}>
          {[...Array(3)].map((_, i) => (
            <Ionicons key={i} name="heart" size={20} color={i < lives ? Colors.error : Colors.outline} style={{ marginLeft: 4 }} />
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={[styles.comboBox, combo >= 2 && styles.comboHot]}>
          <Text style={[styles.comboText, combo >= 2 && { color: Colors.secondary }]}>
            {combo >= 2 ? `🔥 x${combo} COMBO` : 'NO COMBO'}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>LEFT</Text>
          <Text style={styles.statValue}>{statements.length - currentIdx}</Text>
        </View>
      </View>

      {/* Swipe card */}
      <View style={styles.cardArea}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
          ]}
          {...panResponder.panHandlers}
        >
          <Animated.View style={[styles.stamp, styles.stampTrue, { opacity: trueOpacity }]}>
            <Text style={styles.stampTrueText}>TRUE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampFalse, { opacity: falseOpacity }]}>
            <Text style={styles.stampFalseText}>FALSE</Text>
          </Animated.View>

          <Text style={styles.cardTopic}>{(stmt.topicTitle || 'GENERAL').toUpperCase()}</Text>
          <Text style={styles.statement}>{stmt.statement}</Text>
          <Text style={styles.swipeHint}>← swipe FALSE · TRUE swipe →</Text>
        </Animated.View>
      </View>

      {/* Button fallback (web / tap) */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.tfBtn, styles.falseBtn]} onPress={() => fling(false)} activeOpacity={0.85}>
          <Ionicons name="close" size={24} color={Colors.error} />
          <Text style={[styles.tfBtnText, { color: Colors.error }]}>FALSE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bookmarkBtn}
          onPress={() => {
            if (isQuestionBookmarked(stmt.id)) {
              removeQuestionBookmark(stmt.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              setLocalNote('');
              setNoteModalVisible(true);
            }
          }}
        >
          <Ionicons name={isQuestionBookmarked(stmt.id) ? 'bookmark' : 'bookmark-outline'} size={22} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tfBtn, styles.trueBtn]} onPress={() => fling(true)} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={24} color={Colors.success} />
          <Text style={[styles.tfBtnText, { color: Colors.success }]}>TRUE</Text>
        </TouchableOpacity>
      </View>

      {/* Bookmark note modal */}
      <Modal visible={noteModalVisible} transparent animationType="fade" onRequestClose={() => setNoteModalVisible(false)}>
        <View style={styles.noteOverlay}>
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Save to Bookmarks</Text>
            <Text style={styles.noteSubtitle}>Add an optional note for this statement</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Type your note here…"
              placeholderTextColor={Colors.outline}
              multiline
              value={localNote}
              onChangeText={setLocalNote}
              maxLength={200}
            />
            <View style={styles.noteActions}>
              <TouchableOpacity style={styles.noteCancelBtn} onPress={() => setNoteModalVisible(false)}>
                <Text style={styles.noteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noteSaveBtn}
                onPress={() => {
                  addQuestionBookmark(tfPayload(stmt, localNote));
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setNoteModalVisible(false);
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
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FBFF', padding: Spacing.xl },
  loadingTitle: { ...Typography.h4, color: Colors.onSurfaceVariant, marginTop: Spacing.md },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  backBtn: { padding: Spacing.sm },
  livesRow: { flexDirection: 'row', alignItems: 'center' },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  statBox: { alignItems: 'center', minWidth: 56 },
  statLabel: { ...Typography.labelCaps, color: Colors.outline, fontSize: 9 },
  statValue: { ...Typography.h3, color: Colors.primary },
  comboBox: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Colors.surfaceContainer },
  comboHot: { backgroundColor: Colors.gold },
  comboText: { ...Typography.labelCaps, fontSize: 11, color: Colors.outline },

  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: {
    width: '100%',
    maxWidth: 420,
    minHeight: 280,
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F2F5',
    ...Shadows.cardHover,
  },
  cardTopic: { ...Typography.labelCaps, color: Colors.primary, letterSpacing: 1.5, marginBottom: Spacing.lg, fontSize: 10 },
  statement: { ...Typography.h3, color: Colors.onSurface, textAlign: 'center', lineHeight: 30 },
  swipeHint: { ...Typography.bodySm, color: Colors.outline, marginTop: Spacing.xl, fontSize: 11 },

  stamp: { position: 'absolute', top: 18, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 3 },
  stampTrue: { right: 18, borderColor: Colors.success, transform: [{ rotate: '12deg' }] },
  stampFalse: { left: 18, borderColor: Colors.error, transform: [{ rotate: '-12deg' }] },
  stampTrueText: { ...Typography.h3, color: Colors.success, fontFamily: 'Inter_900Black' },
  stampFalseText: { ...Typography.h3, color: Colors.error, fontFamily: 'Inter_900Black' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.lg, paddingBottom: Spacing.xl, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  tfBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.lg, borderRadius: Radius.md, borderWidth: 1.5, ...Shadows.card },
  falseBtn: { backgroundColor: '#FEF2F2', borderColor: Colors.error + '55' },
  trueBtn: { backgroundColor: '#F0FDF4', borderColor: Colors.success + '55' },
  tfBtnText: { ...Typography.button },
  bookmarkBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F2F4F7', alignItems: 'center', justifyContent: 'center' },

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
});
