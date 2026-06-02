import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';
import * as Haptics from 'expo-haptics';

export type QuestionType = 'mcq' | 'match';
export type QuestionDisplayMode = 'interactive' | 'review';
export type QuestionTheme = 'light' | 'dark' | 'arcade';

export interface MatchPair {
  id: string;
  left: string;
  right: string;
}

interface UnifiedQuestionProps {
  type: QuestionType;
  mode: QuestionDisplayMode;
  theme?: QuestionTheme;

  // MCQ Props
  question?: string;
  options?: string[];

  // Matching Props
  pairs?: MatchPair[];
  currentMatches?: Record<string, string>;
  onMatchesChange?: (matches: Record<string, string>) => void;

  // Common Data
  explanation?: string;
  topic?: string;

  // Interaction
  onAnswer?: (answer: string | Record<string, string>) => void;

  // Bookmarking
  isBookmarked?: boolean;
  bookmarkNote?: string;
  onToggleBookmark?: (note?: string) => void;
  
  // Review Data
  userAnswer?: string | Record<string, string> | null;
  correctAnswer?: string | Record<string, string> | null;
  isCorrect?: boolean;
}

const toRoman = (num: number) => {
  const map: Record<number, string> = { 0: 'I', 1: 'II', 2: 'III', 3: 'IV', 4: 'V', 5: 'VI' };
  return map[num] || (num + 1).toString();
};

const toAlpha = (num: number) => String.fromCharCode(65 + num);

export const UnifiedQuestion = ({
  type,
  mode,
  theme = 'light',
  question,
  options,
  pairs,
  explanation,
  topic,
  onAnswer,
  userAnswer,
  correctAnswer,
  isCorrect,
  isBookmarked,
  bookmarkNote,
  onToggleBookmark,
  currentMatches: externalMatches,
  onMatchesChange
}: UnifiedQuestionProps) => {

  const [internalMatches, setInternalMatches] = useState<Record<string, string>>({});
  const activeMatches = externalMatches || internalMatches;

  const updateMatches = (m: Record<string, string>) => {
    setInternalMatches(m);
    onMatchesChange?.(m);
  };

  const [leftSelected, setLeftSelected] = useState<string | null>(null);
  const [rightSelected, setRightSelected] = useState<string | null>(null);
  const [shuffledRights, setShuffledRights] = useState<MatchPair[]>([]);
  
  // Bookmark Note Modal State
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [localNote, setLocalNote] = useState(bookmarkNote || '');

  useEffect(() => {
    setLocalNote(bookmarkNote || '');
  }, [bookmarkNote]);

  const handleBookmarkPress = () => {
    if (isBookmarked) {
      // If already bookmarked, just toggle (remove)
      onToggleBookmark?.();
    } else {
      // If not bookmarked, show modal to add note
      setNoteModalVisible(true);
    }
  };

  const handleSaveBookmark = () => {
    onToggleBookmark?.(localNote);
    setNoteModalVisible(false);
  };

  useEffect(() => {
    if (type === 'match' && pairs) {
      setShuffledRights([...pairs].sort(() => Math.random() - 0.5));
      updateMatches({});
    }
  }, [pairs, type]);

  const handleMatchLeft = (id: string) => {
    if (mode === 'review') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (activeMatches[id]) {
      const newMatches = { ...activeMatches };
      delete newMatches[id];
      updateMatches(newMatches);
      setLeftSelected(null);
      return;
    }

    if (leftSelected === id) {
      setLeftSelected(null);
    } else {
      setLeftSelected(id);
      if (rightSelected) {
        const newMatches = { ...activeMatches, [id]: rightSelected };
        updateMatches(newMatches);
        setLeftSelected(null);
        setRightSelected(null);
        if (Object.keys(newMatches).length === (pairs?.length || 0)) {
          onAnswer?.(newMatches);
        }
      }
    }
  };

  const handleMatchRight = (id: string) => {
    if (mode === 'review') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const leftId = Object.keys(activeMatches).find(key => activeMatches[key] === id);
    if (leftId) {
      const newMatches = { ...activeMatches };
      delete newMatches[leftId];
      updateMatches(newMatches);
      setRightSelected(null);
      return;
    }

    if (rightSelected === id) {
      setRightSelected(null);
    } else {
      setRightSelected(id);
      if (leftSelected) {
        const newMatches = { ...activeMatches, [leftSelected]: id };
        updateMatches(newMatches);
        setLeftSelected(null);
        setRightSelected(null);
        if (Object.keys(newMatches).length === (pairs?.length || 0)) {
          onAnswer?.(newMatches);
        }
      }
    }
  };

  // --- Theme Styles Mapping ---
  const isDark = theme === 'dark' || theme === 'arcade';
  const isArcade = theme === 'arcade';
  const themeColors = {
    text: isDark ? '#FFF' : Colors.onSurface,
    subtext: isDark ? 'rgba(255,255,255,0.75)' : Colors.onSurfaceVariant,
    cardBg: isArcade ? 'rgba(0,0,0,0.5)' : isDark ? 'rgba(255,255,255,0.08)' : '#FFF',
    surface: isDark ? 'rgba(255,255,255,0.12)' : '#F0F2F5',
    onSurface: isDark ? '#FFF' : Colors.onSurface,
    border: isArcade ? 'rgba(255,255,255,0.22)' : isDark ? 'rgba(255,255,255,0.1)' : '#F0F2F5',
    outline: isDark ? 'rgba(255,255,255,0.35)' : Colors.outline,
    primary: isDark ? (isArcade ? Colors.gold : Colors.primary) : Colors.primary,
    accent: Colors.gold,
    secondary: isDark ? (isArcade ? '#FF3D00' : Colors.secondary) : Colors.secondary,
  };

  // --- Sub-Components ---

  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);

  const MCQView = () => {
    if (mode === 'interactive') {
      return (
        <View style={styles.mcqContainer}>
          {question && (
            <View style={styles.questionHeader}>
              <Text style={[styles.questionText, { color: themeColors.text }, isArcade && styles.questionTextArcade]}>{question}</Text>
              {onToggleBookmark && (
                <TouchableOpacity onPress={handleBookmarkPress} style={styles.bookmarkBtnInline}>
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={24}
                    color={isBookmarked ? themeColors.accent : themeColors.text}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.optionsList}>
            {options?.map((opt, i) => {
              const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
              const letter = letters[i] || '?';
              const cleanOpt = opt.replace(/^[A-F][).]\s*/i, '');
              const isSelected = selectedMCQ === opt;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.optionBtn,
                    { backgroundColor: themeColors.cardBg, borderColor: themeColors.border },
                    isSelected && {
                      borderColor: themeColors.primary,
                      backgroundColor: isArcade ? 'rgba(255,215,0,0.18)' : themeColors.primary + '15',
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMCQ(opt);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[
                    styles.letterBadge,
                    { backgroundColor: isArcade ? 'rgba(255,255,255,0.15)' : isDark ? 'rgba(255,255,255,0.1)' : '#F0F2F5' },
                    isSelected && { backgroundColor: themeColors.primary }
                  ]}>
                    <Text style={[
                      styles.letterText,
                      { color: themeColors.text },
                      isSelected && { color: isArcade ? '#1a0000' : '#FFF' }
                    ]}>{letter}</Text>
                  </View>
                  <Text style={[
                    styles.optionText,
                    { color: themeColors.text },
                    isSelected && { color: themeColors.primary, fontFamily: 'Inter_700Bold' }
                  ]}>{cleanOpt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedMCQ && (
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: themeColors.primary }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onAnswer?.(selectedMCQ);
                setSelectedMCQ(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.confirmBtnText, isArcade && { color: '#1a0000' }]}>CONFIRM ANSWER</Text>
              <Ionicons name="arrow-forward" size={20} color={isArcade ? '#1a0000' : '#FFF'} />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Review Mode MCQ
    return (
      <View style={styles.reviewMcq}>
        {question && <Text style={[styles.reviewQuestionText, { color: themeColors.primary }]}>{question}</Text>}

        <View style={styles.reviewOptionsContainer}>
          {options?.map((opt, index) => {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            const letter = letters[index] || '?';
            const cleanOpt = opt.replace(/^[A-F][).]\s*/i, '');
            
            const isUserChoice = (userAnswer as string) === opt;
            const isCorrectChoice = (correctAnswer as string) === opt;
            const isWrongChoice = isUserChoice && !isCorrectChoice;

            return (
              <View 
                key={index} 
                style={[
                  styles.reviewOptionRow,
                  { backgroundColor: themeColors.cardBg, borderColor: themeColors.border },
                  isCorrectChoice && styles.optionCorrect,
                  isWrongChoice && styles.optionWrong
                ]}
              >
                <View style={[
                  styles.optionIndicator,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F2F5' },
                  isCorrectChoice && { backgroundColor: Colors.success },
                  isWrongChoice && { backgroundColor: Colors.error }
                ]}>
                  <Text style={[
                    styles.optionIndicatorText, 
                    { color: themeColors.text },
                    (isCorrectChoice || isWrongChoice) && { color: '#FFF' }
                  ]}>{letter}</Text>
                </View>
                <Text style={[
                  styles.optionText, 
                  { color: themeColors.text },
                  isCorrectChoice && { color: Colors.success, fontFamily: 'Inter_700Bold' },
                  isWrongChoice && { color: Colors.error }
                ]}>
                  {cleanOpt}
                </Text>
                {isUserChoice && (
                  <View style={styles.userMarker}>
                    <Text style={styles.userMarkerText}>YOU</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const MatchingView = () => {
    if (mode === 'interactive') {
      return (
        <View style={styles.matchContainer}>
          <View style={styles.matchHeader}>
            <Text style={[styles.matchInstruction, { color: themeColors.text }]}>Match the following pairs:</Text>
            {onToggleBookmark && (
              <TouchableOpacity onPress={handleBookmarkPress}>
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={isBookmarked ? themeColors.accent : themeColors.text}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.matchingGrid}>
            {/* Left Column */}
            <View style={styles.column}>
              <Text style={[styles.columnHeader, { color: themeColors.subtext }]}>LIST I</Text>
              {pairs?.map((pair, idx) => {
                const isSelected = leftSelected === pair.id;
                const matchedRightId = activeMatches[pair.id];
                const isMatched = !!matchedRightId;
                const roman = toRoman(idx);
                
                // Find alpha of matched item
                let matchLabel: string | null = null;
                if (isMatched) {
                  const rightIdx = shuffledRights.findIndex(p => p.id === matchedRightId);
                  if (rightIdx !== -1) {
                    matchLabel = `(${roman} - ${toAlpha(rightIdx)})`;
                  }
                }

                return (
                  <TouchableOpacity
                    key={pair.id}
                    style={[
                      styles.matchCard,
                      { backgroundColor: themeColors.cardBg, borderColor: themeColors.border },
                      isSelected && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '20' },
                      isMatched && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '10' }
                    ]}
                    onPress={() => handleMatchLeft(pair.id)}
                  >
                    <Text style={[styles.matchCardText, { color: themeColors.text }, isMatched && { opacity: 0.6 }]}>
                      {roman}. {pair.left}
                    </Text>
                    {matchLabel && (
                      <Text style={styles.matchIndicatorText}>{matchLabel}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Right Column */}
            <View style={styles.column}>
              <Text style={[styles.columnHeader, { color: themeColors.subtext }]}>LIST II</Text>
              {shuffledRights.map((pair, idx) => {
                const isSelected = rightSelected === pair.id;
                const leftId = Object.keys(activeMatches).find(key => activeMatches[key] === pair.id);
                const isMatched = !!leftId;
                const alpha = toAlpha(idx);
                
                // Find roman of matched item
                let matchLabel: string | null = null;
                if (isMatched && leftId) {
                  const leftIdx = pairs?.findIndex(p => p.id === leftId) ?? -1;
                  matchLabel = `(${toRoman(leftIdx)} - ${alpha})`;
                }

                return (
                  <TouchableOpacity
                    key={pair.id}
                    style={[
                      styles.matchCard,
                      { backgroundColor: themeColors.cardBg, borderColor: themeColors.border },
                      isSelected && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '20' },
                      isMatched && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '10' }
                    ]}
                    onPress={() => handleMatchRight(pair.id)}
                  >
                    <Text style={[styles.matchCardText, { color: themeColors.text }, isMatched && { opacity: 0.6 }]}>
                      {alpha}. {pair.right}
                    </Text>
                    {matchLabel && (
                      <Text style={styles.matchIndicatorText}>{matchLabel}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      );
    }

    // Review Mode Matching (Bookmark Style)
    const userMatchesObj = userAnswer as Record<string, string> || {};
    return (
      <View style={styles.reviewMatch}>
        <Text style={[styles.reviewQuestionText, { color: themeColors.primary, marginBottom: 0 }]}>Matching Review</Text>
        <View style={styles.reviewMatchContainer}>
          {pairs?.map((p, pi) => {
            const roman = toRoman(pi);
            const matchedRightId = userMatchesObj[p.id];
            const matchIsCorrect = matchedRightId === p.right;
            
            // Determine alpha of user's matched right item
            const rightIdx = pairs?.findIndex(x => x.right === matchedRightId) ?? -1;
            const userAlpha = rightIdx !== -1 ? toAlpha(rightIdx) : '?';
            const userMatchedText = matchedRightId || 'None';

            return (
              <View key={pi} style={styles.matchPairRow}>
                <View style={styles.matchReviewLeft}>
                  <Text style={[styles.matchText, { color: themeColors.text }]}>{roman}. {p.left}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={themeColors.outline} />
                <View style={[styles.matchReviewRight, { backgroundColor: Colors.success + '15', borderColor: Colors.success }]}>
                  <Text style={[styles.matchText, { color: Colors.success, fontFamily: 'Inter_700Bold' }]}>
                    {toAlpha(pi)}. {p.right}
                  </Text>
                </View>
                
                {!matchIsCorrect && (
                  <View style={styles.userMatchBadge}>
                    <Text style={styles.userMatchLabel}>You: {userAlpha}. {userMatchedText}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {type === 'mcq' ? <MCQView /> : <MatchingView />}

      {mode === 'review' && explanation && (
        <View style={[styles.explanationBox, { backgroundColor: themeColors.surface, borderLeftColor: themeColors.primary }]}>
          <Text style={[styles.explanationLabel, { color: themeColors.primary }]}>EXPLANATION</Text>
          <Text style={[styles.explanationText, { color: themeColors.subtext }]}>{explanation}</Text>
        </View>
      )}

      {mode === 'review' && isBookmarked && bookmarkNote && (
        <View style={[styles.savedNoteBox, { backgroundColor: isDark ? 'rgba(255,215,0,0.1)' : '#FFF9E6' }]}>
          <Ionicons name="document-text-outline" size={16} color={themeColors.primary} />
          <Text style={[styles.savedNoteText, { color: themeColors.text }]}>Note: {bookmarkNote}</Text>
        </View>
      )}
      {/* Bookmark Note Modal */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1C1E' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Save to Bookmarks</Text>
            <Text style={[styles.modalSubtitle, { color: themeColors.subtext }]}>Add an optional note for this question</Text>
            <TextInput
              style={[styles.noteInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFF', color: themeColors.text, borderColor: themeColors.border }]}
              placeholder="Type your note here..."
              placeholderTextColor={Colors.outline}
              multiline
              value={localNote}
              onChangeText={setLocalNote}
              maxLength={200}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalCancelBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F2F5' }]} 
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: isDark ? '#AAA' : '#64748B' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveBtn, { backgroundColor: themeColors.primary }]} 
                onPress={handleSaveBookmark}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },

  // MCQ Styles
  mcqContainer: { gap: Spacing.md },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg, gap: Spacing.md },
  questionText: { ...Typography.h2, lineHeight: 32, flex: 1 },
  questionTextArcade: { fontSize: 17, lineHeight: 26, fontFamily: 'Inter_700Bold' },
  bookmarkBtnInline: { paddingTop: 4 },
  bookmarkBtn: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  optionsList: { gap: Spacing.md },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  letterBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  letterText: { ...Typography.h4, fontFamily: 'Inter_700Bold' },
  optionText: { ...Typography.bodyMd, fontFamily: 'Inter_600SemiBold', flex: 1, lineHeight: 22 },
  confirmBtn: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.button
  },
  confirmBtnText: { ...Typography.button, color: '#FFF' },

  // Matching Interactive Styles
  matchContainer: { gap: Spacing.lg },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchInstruction: { ...Typography.h4, opacity: 0.8 },
  matchingGrid: { flexDirection: 'row', gap: Spacing.md },
  column: { flex: 1, gap: Spacing.sm },
  columnHeader: { ...Typography.labelCaps, textAlign: 'center', marginBottom: 4, fontSize: 10 },
  matchCard: {
    minHeight: 85,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card
  },
  matchCardText: { ...Typography.bodySm, textAlign: 'center', lineHeight: 18, fontFamily: 'Inter_600SemiBold' },
  matchIndicatorText: { 
    ...Typography.labelCaps, 
    fontSize: 9, 
    color: Colors.primary, 
    marginTop: 4,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 4,
    borderRadius: Radius.xs
  },

  // Review Mode Styles
  reviewMcq: { gap: Spacing.sm },
  reviewQuestionText: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.lg, lineHeight: 28 },
  reviewMatch: { gap: Spacing.md },
  reviewOptionsContainer: { gap: Spacing.xs },
  reviewOptionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: Spacing.md, 
    borderRadius: Radius.md, 
    borderWidth: 1, 
    marginBottom: Spacing.sm,
  },
  optionIndicator: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: Spacing.md 
  },
  optionIndicatorText: { fontSize: 12, fontWeight: '700' },
  optionCorrect: { borderColor: Colors.success, backgroundColor: Colors.success + '10' },
  optionWrong: { borderColor: Colors.error, backgroundColor: Colors.error + '10' },
  userMarker: { 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4,
    marginLeft: 8
  },
  userMarkerText: { color: '#FFF', fontSize: 8, fontWeight: '900' },

  // Match Review Styles
  reviewMatchContainer: { marginTop: Spacing.lg },
  matchPairRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  matchReviewLeft: { 
    padding: 8, 
    borderRadius: 4, 
    backgroundColor: 'rgba(0,0,0,0.02)',
    flexShrink: 1
  },
  matchReviewRight: { 
    padding: 8, 
    borderRadius: 4, 
    borderWidth: 1,
    flexShrink: 1
  },
  matchText: { fontSize: 13, lineHeight: 18 },
  userMatchBadge: { 
    backgroundColor: Colors.error + '10', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4,
    width: '100%',
    marginTop: 4
  },
  userMatchLabel: { fontSize: 11, color: Colors.error, fontStyle: 'italic' },

  explanationBox: {
    backgroundColor: '#F8FAFF',
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    marginTop: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary
  },
  explanationLabel: { ...Typography.labelCaps, color: Colors.primary, fontSize: 10, marginBottom: 6 },
  explanationText: { ...Typography.bodySm, color: Colors.onSurfaceVariant, lineHeight: 20 },

  savedNoteBox: { 
    marginTop: Spacing.lg, 
    backgroundColor: '#FFF9E6', 
    padding: Spacing.md, 
    borderRadius: Radius.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center'
  },
  savedNoteText: { ...Typography.bodySm, flex: 1, fontStyle: 'italic' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: Spacing.xl, zIndex: 1000 },
  modalContent: { backgroundColor: '#FFF', borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.lg, ...Shadows.cardHover },
  modalTitle: { ...Typography.h2, color: '#2c3e50' },
  modalSubtitle: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: -8 },
  noteInput: {
    backgroundColor: '#F8FAFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    height: 100,
    textAlignVertical: 'top',
    ...Typography.bodyMd,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#E1E8F0'
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  modalCancelBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: '#F0F2F5' },
  modalCancelText: { ...Typography.bodyMd, color: '#64748B', fontFamily: 'Inter_700Bold' },
  modalSaveBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.primary },
  modalSaveText: { ...Typography.bodyMd, color: '#FFF', fontFamily: 'Inter_700Bold' },
});
