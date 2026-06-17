import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, LayoutAnimation, Modal, TextInput
} from 'react-native';
import { useIsWide } from '@/hooks/useColumns';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useBookmarkStore, BookmarkedQuestion } from '@/stores/bookmarkStore';
import { AppHeader } from '@/components/AppHeader';
import { SyncBadge } from '@/components/SyncBadge';

export default function BookmarksScreen() {
  const { questionBookmarks, removeQuestionBookmark, updateQuestionNote, isSyncing } = useBookmarkStore();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const isWide = useIsWide();
  const [attemptMode, setAttemptMode] = useState(false);

  // Note Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<BookmarkedQuestion | null>(null);
  const [tempNote, setTempNote] = useState('');

  // Grouping questions by PSU
  const grouped = questionBookmarks.reduce((acc, b) => {
    const groupName = b.psuName || 'General';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(b);
    return acc;
  }, {} as Record<string, BookmarkedQuestion[]>);

  const toggleGroup = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleAttemptMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAttemptMode(!attemptMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openNoteModal = (item: BookmarkedQuestion) => {
    setEditingItem(item);
    setTempNote(item.note || '');
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (editingItem) {
      await updateQuestionNote(editingItem.id, tempNote);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setModalVisible(false);
    setEditingItem(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title & Attempt Mode Toggle */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle} numberOfLines={1} adjustsFontSizeToFit>Saved Questions</Text>
            <View style={styles.countBadge}>
               <Text style={styles.countText}>{questionBookmarks.length} ITEMS</Text>
            </View>
            <SyncBadge visible={isSyncing} />
          </View>

          <TouchableOpacity 
            style={[styles.attemptToggle, attemptMode && styles.attemptToggleActive]} 
            onPress={toggleAttemptMode}
          >
            <Ionicons 
              name={attemptMode ? "flask" : "flask-outline"} 
              size={18} 
              color={attemptMode ? "#FFF" : Colors.primary} 
            />
            <Text style={[styles.attemptToggleText, attemptMode && { color: '#FFF' }]}>
              {attemptMode ? "Exit Practice" : "Practice Mode"}
            </Text>
          </TouchableOpacity>
        </View>

        {questionBookmarks.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="bookmarks-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{isSyncing ? 'Syncing your saved questions…' : 'No saved questions yet'}</Text>
            <Text style={styles.emptyDesc}>
              {isSyncing
                ? 'Pulling your bookmarks from the cloud.'
                : 'Bookmark challenging questions during your study sessions to review them here.'}
            </Text>
          </View>
        ) : (
          Object.entries(grouped).map(([groupName, items]) => (
            <View key={groupName} style={styles.groupContainer}>
              <TouchableOpacity 
                style={styles.groupHeader} 
                onPress={() => toggleGroup(groupName)}
                activeOpacity={0.7}
              >
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="ribbon-outline" size={20} color={Colors.secondary} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.groupTitle} numberOfLines={1}>{groupName}</Text>
                    <Text style={styles.groupSub} numberOfLines={1}>{items.length} SAVED QUESTIONS</Text>
                  </View>
                </View>
                <Ionicons 
                  name={expandedGroups[groupName] ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={Colors.primary} 
                />
              </TouchableOpacity>

              {expandedGroups[groupName] !== false && (
                <View style={[styles.groupList, isWide && styles.groupListGrid]}>
                  {items.map(item => (
                    <BookmarkItem
                      key={item.id}
                      item={item}
                      attemptMode={attemptMode}
                      isWide={isWide}
                      onRemove={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        removeQuestionBookmark(item.id);
                      }}
                      onEditNote={() => openNoteModal(item)}
                    />
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Note Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Study Note</Text>
            <Text style={styles.modalSubtitle}>Refine your notes for this question</Text>
            
            <TextInput
              style={styles.noteInput}
              placeholder="Type your note here..."
              placeholderTextColor={Colors.outline}
              multiline
              value={tempNote}
              onChangeText={setTempNote}
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn} 
                onPress={saveNote}
              >
                <Text style={styles.modalSaveText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BookmarkItem({
  item,
  onRemove,
  onEditNote,
  attemptMode,
  isWide,
}: {
  item: BookmarkedQuestion;
  onRemove: () => void;
  onEditNote: () => void;
  attemptMode: boolean;
  isWide?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState<string | null>(null);

  // Auto-expand and reveal when attempted
  React.useEffect(() => {
    if (currentAttempt) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);
    }
  }, [currentAttempt]);

  // Reset attempt if mode toggled off
  React.useEffect(() => {
    if (!attemptMode) setCurrentAttempt(null);
  }, [attemptMode]);

  const handleOptionPress = (optKey: string) => {
    if (!attemptMode || currentAttempt || isMatchQuestion) return;
    setCurrentAttempt(optKey);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const isMatchQuestion = 
    item.type === 'match' ||
    item.correct === "MATCHING_TYPE" || 
    item.topicTitle === "Matching Challenge" || 
    (item.options && item.options.length > 0 && String(item.options?.[0]).includes('|')) ||
    item.correct?.includes(' -> ');

  const prevStatus = isMatchQuestion ? 'skipped' : (!item.yourAnswer ? 'skipped' : (item.yourAnswer === item.correct ? 'correct' : 'wrong'));
  const statusColors = {
    correct: Colors.success,
    wrong: Colors.error,
    skipped: Colors.outline
  };

  // Helper to render Match Pairs
  const renderMatchPairs = () => {
    const isStructured = item.options && item.options.length > 0 && String(item.options?.[0]).includes('|');
    
    const pairs = (item.pairs && item.pairs.length > 0) 
      ? item.pairs 
      : (item.options || []).map((opt, idx) => {
          if (isStructured) {
            const [id, left, right] = opt.split('|');
            return { id, left, right };
          }
          let left = 'Term';
          if (item.correct?.includes(' -> ')) {
            const parts = item.correct.split('; ');
            const found = parts.find(p => p.endsWith(` -> ${opt}`));
            if (found) left = found.split(' -> ')[0];
          }
          return { id: String(idx), left, right: opt };
        });
    
    // Scramble right side for attempt mode
    const scrambledRight = [...pairs].sort(() => Math.random() - 0.5);

    let userMatches: Record<string, string> = {};
    if (isStructured && item.yourAnswer) {
      try {
        userMatches = JSON.parse(item.yourAnswer);
      } catch(e) { /* ignore */ }
    }

    const showSolution = !attemptMode || currentAttempt === 'MATCH_DONE';

    if (attemptMode && !showSolution) {
      return (
        <View style={styles.matchReviewContainer}>
          <Text style={styles.sectionLabel}>MATCH THE TERMS (SCRAMBLED)</Text>
          <View style={styles.scrambledGrid}>
            <View style={styles.scrambledCol}>
              <Text style={styles.scrambledLabel}>LEFT SIDE</Text>
              {pairs.map((p, i) => (
                <View key={i} style={styles.scrambledItem}><Text style={styles.matchText}>{p.left}</Text></View>
              ))}
            </View>
            <View style={styles.scrambledCol}>
              <Text style={styles.scrambledLabel}>RIGHT SIDE</Text>
              {scrambledRight.map((p, i) => (
                <View key={i} style={[styles.scrambledItem, { backgroundColor: Colors.primary + '10' }]}>
                  <Text style={styles.matchText}>{p.right}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.revealBtn} 
            onPress={() => {
              setCurrentAttempt('MATCH_DONE');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          >
            <Text style={styles.revealBtnText}>Reveal Correct Pairs</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.matchReviewContainer}>
        <Text style={styles.sectionLabel}>CORRECT PAIRS</Text>
        {pairs.map((p, idx) => {
          const userRightId = userMatches[p.id];
          const isCorrect = userRightId === p.id;
          const userRightText = pairs.find(x => x.id === userRightId)?.right || 'None';

          return (
            <View key={idx} style={styles.matchPairRow}>
              <View style={styles.matchLeft}>
                <Text style={styles.matchText}>{p.left}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={Colors.outline} />
              <View style={[styles.matchRight, styles.matchCorrect]}>
                <Text style={[styles.matchText, { color: Colors.success }]}>{p.right}</Text>
              </View>
              
              {item.yourAnswer && !isCorrect && (
                <View style={styles.userMatchBadge}>
                  <Text style={styles.userMatchLabel}>You paired: {userRightText}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.card, isWide && styles.cardGrid]}>
      <View style={[styles.cardAccent, { backgroundColor: statusColors[prevStatus] }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            {!!item.psuName && (
              <View style={styles.psuBadge}>
                <Text style={styles.psuBadgeText} numberOfLines={1}>{item.psuName.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.branchBadge}>
              <Text style={styles.branchBadgeText}>{item.branchName?.toUpperCase() || 'GENERAL'}</Text>
            </View>
            <View style={[styles.statusBadge, { borderColor: statusColors[prevStatus] }]}>
              <Text style={[styles.statusBadgeText, { color: statusColors[prevStatus] }]}>
                {prevStatus.toUpperCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onRemove}>
            <Ionicons name="bookmark" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.9}>
          <Text style={styles.questionText} numberOfLines={expanded ? undefined : 3}>
            {item.question || (isMatchQuestion ? "Matching Challenge" : "Untitled Question")}
          </Text>
          {!expanded && (item.question?.length || 0) > 100 && (
            <Text style={styles.readMore}>Read More...</Text>
          )}
        </TouchableOpacity>

        {/* Options Section (for MCQ) or Pairs Section (for Match) */}
        <View style={styles.optionsArea}>
          {!isMatchQuestion ? (
            item.options && item.options.length > 0 && (
              <View style={styles.optionsContainer}>
                <Text style={styles.sectionLabel}>OPTIONS {attemptMode && !currentAttempt && "(TAP TO ATTEMPT)"}</Text>
                {item.options.map((opt, index) => {
                  const optKey = opt.charAt(0).toUpperCase();
                  const isCorrect = optKey === item.correct?.toUpperCase();
                  // yourAnswer may be full option string ("A. text") or just key ("A")
                  const isPrevAnswer = !!item.yourAnswer &&
                    item.yourAnswer.trim().charAt(0).toUpperCase() === optKey;
                  const isCurrentAttempt = optKey === currentAttempt;

                  // Visibility logic
                  const showResults = !attemptMode || !!currentAttempt;
                  const isWrongPrev = showResults && isPrevAnswer && !isCorrect;
                  const isWrongCurrent = showResults && isCurrentAttempt && !isCorrect;

                  return (
                    <TouchableOpacity 
                      key={index} 
                      activeOpacity={attemptMode && !currentAttempt ? 0.7 : 1}
                      onPress={() => handleOptionPress(optKey)}
                      style={[
                        styles.optionRow,
                        showResults && isCorrect && styles.optionCorrect,
                        showResults && (isWrongPrev || isWrongCurrent) && styles.optionWrong,
                        attemptMode && !currentAttempt && isCurrentAttempt && styles.optionSelected
                      ]}
                    >
                      <View style={[
                        styles.optionIndicator,
                        showResults && isCorrect && { backgroundColor: Colors.success },
                        showResults && (isWrongPrev || isWrongCurrent) && { backgroundColor: Colors.error },
                        !showResults && isCurrentAttempt && { backgroundColor: Colors.primary }
                      ]}>
                        <Text style={styles.optionIndicatorText}>{optKey}</Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        showResults && isCorrect && { color: Colors.success, fontFamily: 'Inter_700Bold' },
                        showResults && (isWrongPrev || isWrongCurrent) && { color: Colors.error }
                      ]}>
                        {opt}
                      </Text>
                      
                      {showResults && (
                        <View style={styles.markerRow}>
                          {isPrevAnswer && !attemptMode ? (
                            <View style={[
                              styles.youChip,
                              { backgroundColor: isCorrect ? Colors.success : Colors.error }
                            ]}>
                              <Text style={styles.youChipText}>you</Text>
                            </View>
                          ) : (
                            isPrevAnswer && (
                              <View style={styles.prevMarker}>
                                <Text style={styles.markerText}>PREV</Text>
                              </View>
                            )
                          )}
                          {isCurrentAttempt && (
                            <View style={styles.currentMarker}>
                              <Text style={styles.markerText}>NEW</Text>
                            </View>
                          )}
                          {isCorrect && <Ionicons name="checkmark-circle" size={16} color={Colors.success} />}
                          {(isWrongPrev || isWrongCurrent) && <Ionicons name="close-circle" size={16} color={Colors.error} />}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : (
            expanded && renderMatchPairs()
          )}
        </View>

        {/* Note — visible only when NOT in attempt mode */}
        {!attemptMode && <TouchableOpacity style={styles.noteBox} onPress={onEditNote}>
          <View style={styles.noteHeader}>
            <Ionicons name="document-text-outline" size={14} color={Colors.secondary} />
            <Text style={styles.noteHeaderTitle}>MY STUDY NOTE</Text>
            <Ionicons name="pencil" size={12} color={Colors.outline} />
          </View>
          <Text style={[styles.noteText, !item.note && styles.noteTextEmpty]}>
            {item.note || "Tap to add a study note…"}
          </Text>
        </TouchableOpacity>}

        {/* Explanation — shown by default; only hidden mid-attempt before the answer is revealed. */}
        {!!item.explanation && (!attemptMode || (isMatchQuestion ? currentAttempt === 'MATCH_DONE' : !!currentAttempt)) && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            <View style={styles.reviewGrid}>
              <View style={styles.reviewSection}>
                <Text style={styles.explanationLabel}>EXPLANATION</Text>
                <Text style={styles.explanationText}>{item.explanation}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  container: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing.xxxl },

  headerRow: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginBottom: Spacing.md
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mainTitle: { 
    ...Typography.h1, 
    color: Colors.primary, 
    fontSize: 26, 
    flexShrink: 1 
  },
  countBadge: { 
    backgroundColor: '#EAEDF2', 
    paddingHorizontal: Spacing.md, 
    paddingVertical: 6, 
    borderRadius: Radius.sm,
    flexShrink: 0
  },
  countText: { ...Typography.labelCaps, fontSize: 10, color: Colors.outline },

  attemptToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent:'center',
    width:'fit',
    gap: 6, 
    backgroundColor: '#FFF', 
    paddingHorizontal: Spacing.md, 
    paddingVertical: 8, 
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexShrink: 0,
    ...Shadows.card
  },
  attemptToggleActive: { backgroundColor: Colors.primary },
  attemptToggleText: { ...Typography.labelCaps, color: Colors.primary, fontSize: 10 },

  groupContainer: { marginBottom: Spacing.md },
  groupHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
    marginBottom: Spacing.md
  },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  groupTitle: { ...Typography.h3, color: Colors.primary },
  groupSub: { ...Typography.labelCaps, fontSize: 10, color: Colors.outline, marginTop: 2 },

  groupList: { gap: Spacing.xl },
  groupListGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  cardGrid: { width: '48%' },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: Radius.md, 
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    flexDirection: 'row'
  },
  cardAccent: { width: 6, backgroundColor: Colors.gold },
  cardInner: { flex: 1, padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
  psuBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    maxWidth: 140,
  },
  psuBadgeText: {
    ...Typography.labelCaps,
    color: Colors.secondary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  branchBadge: {
    backgroundColor: Colors.primary, 
    paddingHorizontal: Spacing.md, 
    paddingVertical: 4, 
    borderRadius: Radius.sm 
  },
  branchBadgeText: { 
    ...Typography.labelCaps, 
    color: Colors.gold, 
    fontSize: 9,
    fontFamily: 'Inter_700Bold'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    ...Typography.labelCaps,
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
  },

  questionText: { 
    ...Typography.h3, 
    color: Colors.onSurface, 
    fontSize: 18, 
    lineHeight: 24 
  },
  readMore: { ...Typography.bodySm, color: Colors.primary, marginTop: 4, fontFamily: 'Inter_600SemiBold' },
  
  optionsArea: { marginTop: Spacing.md },
  optionsContainer: { gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionLabel: { ...Typography.labelCaps, color: Colors.outline, fontSize: 10, marginBottom: 4 },
  optionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.md, 
    padding: Spacing.sm, 
    borderRadius: Radius.sm,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F0F2F5'
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '0D' },
  optionCorrect: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  optionWrong: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  optionIndicator: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: Colors.outlineVariant, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  optionIndicatorText: { ...Typography.labelCaps, color: '#FFF', fontSize: 10, fontFamily: 'Inter_700Bold' },
  optionText: { ...Typography.bodySm, color: Colors.onSurface, flex: 1 },

  markerRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  prevMarker: { backgroundColor: Colors.outline, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 },
  currentMarker: { backgroundColor: Colors.primary, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 },
  markerText: { color: '#FFF', fontSize: 7, fontFamily: 'Inter_700Bold' },
  youChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.pill },
  youChipText: { color: '#FFF', fontSize: 8, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },

  expandedContent: { marginTop: Spacing.md },
  divider: { height: 1, backgroundColor: '#F0F2F5', marginVertical: Spacing.md },
  
  reviewGrid: { marginTop: Spacing.sm },
  reviewSection: { marginBottom: Spacing.md },
  explanationLabel: { ...Typography.labelCaps, color: Colors.primary, fontSize: 10, marginBottom: 4 },
  explanationText: { ...Typography.bodySm, color: Colors.onSurfaceVariant, lineHeight: 20 },

  // Match Review Styles
  matchReviewContainer: { gap: Spacing.sm, marginTop: Spacing.sm },
  matchPairRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.sm, 
    flexWrap: 'wrap',
    marginBottom: Spacing.xs 
  },
  matchLeft: { 
    backgroundColor: '#F8F9FB', 
    padding: 8, 
    borderRadius: Radius.xs, 
    borderWidth: 1, 
    borderColor: '#E6E8EB',
    minWidth: 80
  },
  matchRight: { 
    padding: 8, 
    borderRadius: Radius.xs, 
    borderWidth: 1,
    minWidth: 80
  },
  matchCorrect: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  matchText: { ...Typography.bodySm, fontSize: 12 },
  userMatchBadge: { 
    backgroundColor: Colors.error + '10', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4,
    marginLeft: 4 
  },
  userMatchLabel: { ...Typography.labelCaps, fontSize: 8, color: Colors.error },

  // Match Attempt Styles
  scrambledGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  scrambledCol: { flex: 1, gap: Spacing.xs },
  scrambledLabel: { ...Typography.labelCaps, fontSize: 8, color: Colors.outline, marginBottom: 4 },
  scrambledItem: { 
    backgroundColor: '#F3F4F6', 
    padding: 8, 
    borderRadius: Radius.xs, 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  revealBtn: { 
    backgroundColor: Colors.primary, 
    padding: Spacing.md, 
    borderRadius: Radius.md, 
    alignItems: 'center',
    marginTop: Spacing.sm 
  },
  revealBtnText: { ...Typography.button, color: '#FFF', fontSize: 12 },

  noteBox: { 
    backgroundColor: '#F8F9FB', 
    padding: Spacing.md, 
    borderRadius: Radius.md, 
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E6E8EB'
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  noteHeaderTitle: { ...Typography.labelCaps, color: Colors.secondary, fontSize: 9 },
  noteText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 18
  },
  noteTextEmpty: {
    color: Colors.outline,
    opacity: 0.6,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, marginTop: 100 },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.primary + '20',
  },
  emptyTitle: { ...Typography.h3, color: Colors.onSurface },
  emptyDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: '#FFF', borderRadius: Radius.lg, padding: Spacing.xl, ...Shadows.cardHover },
  modalTitle: { ...Typography.h2, color: Colors.primary, marginBottom: 4 },
  modalSubtitle: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginBottom: Spacing.xl },
  noteInput: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: Radius.md, 
    padding: Spacing.lg, 
    height: 120, 
    textAlignVertical: 'top',
    ...Typography.bodyMd,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Spacing.xl
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalCancelBtn: { flex: 1, paddingVertical: Spacing.lg, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.outline },
  modalCancelText: { ...Typography.button, color: Colors.onSurfaceVariant },
  modalSaveBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: Spacing.lg, alignItems: 'center', borderRadius: Radius.md },
  modalSaveText: { ...Typography.button, color: '#FFF' },
});
