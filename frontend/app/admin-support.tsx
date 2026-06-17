import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  addReply,
  getAllTicketsWithMessages,
  updateTicketStatus,
} from '@/services/support';
import { uploadToCloudinary } from '@/services/cloudinary';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { TicketList } from '@/components/support/TicketList';
import { ChatThread } from '@/components/support/ChatThread';
import { db } from '@/config/firebase';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { editQuestionInBank } from '@/services/questionBank';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RatingEntry {
  id: string;
  rating: number;
  review: string;
  userId: string;
  timestamp: number;
  createdAt: string;
}

interface FlaggedQuestion {
  docId: string;
  bankKey: string;
  type: 'mcq' | 'tf' | 'match';
  reportCount: number;
  hidden: boolean;
  sectionId?: string;
  topicId?: string;
  payload: {
    question?: string;
    options?: string[];
    correct?: string;
    explanation?: string;
    statement?: string;
  };
}

type AdminTab = 'tickets' | 'ratings' | 'flagged';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderStars(rating: number) {
  return [1, 2, 3, 4, 5].map(i => (
    <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={14} color="#F59E0B" />
  ));
}

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

// ─── Ratings panel ────────────────────────────────────────────────────────────

const RatingsPanel: React.FC = () => {
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'ratings'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RatingEntry[];
      setRatings(data);
    } catch (e: any) {
      showToast('Failed to load ratings: ' + e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={rStyles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (ratings.length === 0) {
    return (
      <View style={rStyles.centered}>
        <Ionicons name="star-outline" size={40} color={Colors.outlineVariant} />
        <Text style={rStyles.emptyText}>No ratings yet</Text>
      </View>
    );
  }

  // Compute stats
  const avg = ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length;
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => r.rating === star).length,
    pct: Math.round((ratings.filter(r => r.rating === star).length / ratings.length) * 100),
  }));

  return (
    <ScrollView style={rStyles.container} contentContainerStyle={rStyles.content} showsVerticalScrollIndicator={false}>
      {/* Summary card */}
      <View style={rStyles.summaryCard}>
        <View style={rStyles.avgBlock}>
          <Text style={rStyles.avgNumber}>{avg.toFixed(1)}</Text>
          <View style={rStyles.avgStars}>{renderStars(Math.round(avg))}</View>
          <Text style={rStyles.avgCount}>{ratings.length} rating{ratings.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={rStyles.distBlock}>
          {dist.map(({ star, count, pct }) => (
            <View key={star} style={rStyles.distRow}>
              <Text style={rStyles.distStar}>{star}</Text>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <View style={rStyles.distBar}>
                <View style={[rStyles.distFill, { width: `${pct}%` }]} />
              </View>
              <Text style={rStyles.distCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Individual ratings */}
      {ratings.map(r => (
        <View key={r.id} style={rStyles.ratingCard}>
          <View style={rStyles.ratingHeader}>
            <View style={rStyles.starsRow}>{renderStars(r.rating)}</View>
            <Text style={rStyles.ratingDate}>{formatDate(r.timestamp)}</Text>
          </View>
          <Text style={rStyles.ratingUser} numberOfLines={1}>
            {r.userId === 'guest' ? '👤 Guest' : `👤 ${r.userId.slice(0, 12)}…`}
          </Text>
          {!!r.review && (
            <Text style={rStyles.ratingReview}>"{r.review}"</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

// ─── Flagged questions panel ──────────────────────────────────────────────────

const FlaggedQuestionsPanel: React.FC = () => {
  const [items, setItems] = useState<FlaggedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editItem, setEditItem] = useState<FlaggedQuestion | null>(null);
  const { showToast } = useToast();
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState(['', '', '', '']);
  const [editCorrect, setEditCorrect] = useState('A');
  const [editExplanation, setEditExplanation] = useState('');
  const [editPairs, setEditPairs] = useState<{ id: string; left: string; right: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => { fetchFlagged(); }, []);

  const fetchFlagged = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'question_bank'),
        where('reportCount', '>', 0),
        orderBy('reportCount', 'desc'),
        limit(100),
      );
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ docId: d.id, ...d.data() } as FlaggedQuestion)));
    } catch (e: any) {
      showToast('Failed to load flagged questions: ' + e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFlags = async (docId: string) => {
    const ok = await editQuestionInBank(docId);
    if (ok) {
      setItems(prev => prev.filter(i => i.docId !== docId));
    } else {
      showToast('Could not clear flags. Try again.', 'error');
    }
  };

  const openEdit = (item: FlaggedQuestion) => {
    setEditError(null);
    setEditItem(item);
    setEditExplanation(item.payload?.explanation || '');
    if (item.type === 'match') {
      setEditPairs(
        (item.payload?.pairs || []).map((p: any) => ({ id: p.id || String(Math.random()), left: p.left || '', right: p.right || '' }))
      );
    } else {
      setEditQuestion(item.payload?.question || '');
      setEditOptions(
        item.payload?.options?.length === 4
          ? item.payload.options
          : ['A) ', 'B) ', 'C) ', 'D) '],
      );
      setEditCorrect(item.payload?.correct || 'A');
    }
  };

  const handleSave = async () => {
    if (!editItem) return;
    setIsSaving(true);
    const newPayload = editItem.type === 'match'
      ? {
          ...editItem.payload,
          pairs: editPairs.map(p => ({ id: p.id, left: p.left.trim(), right: p.right.trim() })),
          explanation: editExplanation.trim(),
        }
      : {
          ...editItem.payload,
          question: editQuestion.trim(),
          options: editOptions,
          correct: editCorrect,
          explanation: editExplanation.trim(),
        };
    const ok = await editQuestionInBank(editItem.docId, newPayload);
    setIsSaving(false);
    if (ok) {
      setItems(prev => prev.filter(i => i.docId !== editItem.docId));
      setEditItem(null);
      showToast('Question updated and unflagged.', 'success');
    } else {
      setEditError('Could not save. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={fStyles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={fStyles.centered}>
        <Ionicons name="flag-outline" size={40} color={Colors.outlineVariant} />
        <Text style={fStyles.emptyText}>No flagged questions</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={fStyles.container} contentContainerStyle={fStyles.content} showsVerticalScrollIndicator={false}>
        <Text style={fStyles.subtitle}>{items.length} question{items.length !== 1 ? 's' : ''} flagged by users</Text>
        {items.map(item => (
          <View key={item.docId} style={[fStyles.card, item.hidden && fStyles.cardHidden]}>
            <View style={fStyles.cardHeader}>
              <View style={fStyles.badges}>
                <View style={fStyles.reportBadge}>
                  <Ionicons name="flag" size={12} color="#DC2626" />
                  <Text style={fStyles.reportCount}>{item.reportCount} report{item.reportCount !== 1 ? 's' : ''}</Text>
                </View>
                {item.hidden && (
                  <View style={fStyles.hiddenBadge}>
                    <Text style={fStyles.hiddenText}>HIDDEN</Text>
                  </View>
                )}
                <Text style={fStyles.typeTag}>{(item.type || 'mcq').toUpperCase()}</Text>
              </View>
              <Text style={fStyles.bankKey} numberOfLines={1}>{item.bankKey}</Text>
            </View>

            {item.type === 'mcq' && (
              <Text style={fStyles.questionText} numberOfLines={3}>
                {item.payload?.question || '(no question text)'}
              </Text>
            )}
            {item.type === 'tf' && (
              <Text style={fStyles.questionText} numberOfLines={3}>
                {item.payload?.statement || '(no statement)'}
              </Text>
            )}
            {item.type === 'match' && (
              <Text style={fStyles.questionText} numberOfLines={2}>(Match challenge)</Text>
            )}

            <View style={fStyles.cardActions}>
              <TouchableOpacity style={fStyles.unflagBtn} onPress={() => handleClearFlags(item.docId)}>
                <Ionicons name="flag-outline" size={14} color={Colors.primary} />
                <Text style={fStyles.unflagText}>Clear Flags</Text>
              </TouchableOpacity>
              {(item.type === 'mcq' || item.type === 'match') && (
                <TouchableOpacity style={fStyles.editBtn} onPress={() => openEdit(item)}>
                  <Ionicons name="create-outline" size={14} color="#FFF" />
                  <Text style={fStyles.editText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!editItem} transparent animationType="slide" onRequestClose={() => { setEditItem(null); setEditError(null); }}>
        <View style={fStyles.modalOverlay}>
          <View style={fStyles.modalCard}>
            {/* Fixed header */}
            <View style={fStyles.modalHeader}>
              <Text style={fStyles.modalTitle}>Edit Question</Text>
              <TouchableOpacity onPress={() => { setEditItem(null); setEditError(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={Colors.outline} />
              </TouchableOpacity>
            </View>

            {/* Scrollable form — each input uses scrollEnabled={false} so outer scroll owns it */}
            <ScrollView
              style={fStyles.modalScroll}
              contentContainerStyle={fStyles.modalForm}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {editItem?.type === 'match' ? (
                <>
                  <Text style={fStyles.fieldLabel}>Pairs</Text>
                  {editPairs.map((pair, i) => (
                    <View key={pair.id} style={{ marginBottom: Spacing.sm }}>
                      <Text style={[fStyles.fieldLabel, { marginBottom: 4 }]}>Pair {i + 1}</Text>
                      <View style={fStyles.pairRow}>
                        <TextInput
                          style={[fStyles.optionInput, { flex: 1, marginRight: 6, marginBottom: 0 }]}
                          multiline
                          scrollEnabled={false}
                          value={pair.left}
                          onChangeText={v => {
                            const next = [...editPairs];
                            next[i] = { ...next[i], left: v };
                            setEditPairs(next);
                          }}
                          placeholder="Left..."
                          placeholderTextColor={Colors.outline}
                        />
                        <TextInput
                          style={[fStyles.optionInput, { flex: 1, marginBottom: 0 }]}
                          multiline
                          scrollEnabled={false}
                          value={pair.right}
                          onChangeText={v => {
                            const next = [...editPairs];
                            next[i] = { ...next[i], right: v };
                            setEditPairs(next);
                          }}
                          placeholder="Right..."
                          placeholderTextColor={Colors.outline}
                        />
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <>
                  <Text style={fStyles.fieldLabel}>Question</Text>
                  <TextInput
                    style={fStyles.questionInput}
                    multiline
                    scrollEnabled={false}
                    value={editQuestion}
                    onChangeText={setEditQuestion}
                    placeholder="Question text..."
                    placeholderTextColor={Colors.outline}
                  />

                  <Text style={fStyles.fieldLabel}>Options</Text>
                  {editOptions.map((opt, i) => (
                    <TextInput
                      key={i}
                      style={fStyles.optionInput}
                      multiline
                      scrollEnabled={false}
                      value={opt}
                      onChangeText={v => {
                        const next = [...editOptions];
                        next[i] = v;
                        setEditOptions(next);
                      }}
                      placeholder={`${'ABCD'[i]}) option...`}
                      placeholderTextColor={Colors.outline}
                    />
                  ))}

                  <Text style={fStyles.fieldLabel}>Correct Answer</Text>
                  <View style={fStyles.correctRow}>
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <TouchableOpacity
                        key={letter}
                        style={[fStyles.correctBtn, editCorrect === letter && fStyles.correctBtnActive]}
                        onPress={() => setEditCorrect(letter)}
                      >
                        <Text style={[fStyles.correctBtnText, editCorrect === letter && fStyles.correctBtnTextActive]}>
                          {letter}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={fStyles.fieldLabel}>Explanation</Text>
              <TextInput
                style={fStyles.explanationInput}
                multiline
                scrollEnabled={false}
                value={editExplanation}
                onChangeText={setEditExplanation}
                placeholder="Explanation..."
                placeholderTextColor={Colors.outline}
              />
            </ScrollView>

            {/* Fixed footer — always visible */}
            {editError && (
              <View style={fStyles.editErrorBanner}>
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text style={fStyles.editErrorText}>{editError}</Text>
              </View>
            )}
            <View style={fStyles.modalActions}>
              <TouchableOpacity style={fStyles.cancelBtn} onPress={() => { setEditItem(null); setEditError(null); }}>
                <Text style={fStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={fStyles.saveBtn} onPress={handleSave} disabled={isSaving}>
                {isSaving
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={fStyles.saveText}>Save & Unflag</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AdminSupportScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('tickets');

  useEffect(() => {
    const unsubscribe = getAllTicketsWithMessages(fetchedTickets => {
      setTickets(fetchedTickets);
      if (selectedTicket) {
        const updated = fetchedTickets.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReply = async (message: string, attachments: any[]) => {
    if (!selectedTicket) return;
    const urls = await Promise.all(
      (attachments ?? []).map((a: any) => uploadToCloudinary(a.uri))
    );
    await addReply(selectedTicket.id, message, urls);
  };

  const handleUpdateStatus = async (status: 'open' | 'closed' | 'pending') => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket.id, status);
    setSelectedTicket({ ...selectedTicket, status });
    showToast(`Ticket marked as ${status}.`, 'success');
  };

  // Show chat thread when a ticket is open
  if (selectedTicket) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ChatThread
          ticket={selectedTicket}
          isLoading={isLoading}
          isAdmin
          onBack={() => setSelectedTicket(null)}
          onReply={handleReply}
          onUpdateStatus={handleUpdateStatus}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['tickets', 'ratings', 'flagged'] as AdminTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'tickets' ? 'chatbubbles-outline' : tab === 'ratings' ? 'star-outline' : 'flag-outline'}
              size={16}
              color={activeTab === tab ? Colors.primary : Colors.outline}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'tickets'
                ? `Tickets${tickets.length ? ` (${tickets.length})` : ''}`
                : tab === 'ratings' ? 'Ratings' : 'Flagged'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'tickets' ? (
        <TicketList
          tickets={tickets}
          isLoading={isLoading}
          isAdmin
          onSelectTicket={setSelectedTicket}
        />
      ) : activeTab === 'ratings' ? (
        <RatingsPanel />
      ) : (
        <FlaggedQuestionsPanel />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  backBtn: { padding: 6 },
  headerTitle: { ...Typography.h3, color: Colors.primary },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { ...Typography.bodyMd, color: Colors.outline },
  tabTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
});

const fStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  emptyText: { ...Typography.bodyMd, color: Colors.outline },
  subtitle: { ...Typography.bodySm, color: Colors.outline, marginBottom: 4 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  cardHidden: { borderLeftColor: '#7F1D1D', backgroundColor: '#FFF5F5' },
  cardHeader: { gap: 4 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reportBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  reportCount: { ...Typography.labelCaps, color: '#DC2626', fontSize: 10 },
  hiddenBadge: { backgroundColor: '#7F1D1D', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  hiddenText: { ...Typography.labelCaps, color: '#FFF', fontSize: 10 },
  typeTag: { ...Typography.labelCaps, color: Colors.outline, fontSize: 10 },
  bankKey: { ...Typography.bodySm, color: Colors.outline, fontSize: 10 },
  questionText: { ...Typography.bodyMd, color: Colors.onSurface, lineHeight: 20 },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  unflagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  unflagText: { ...Typography.bodySm, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md, backgroundColor: Colors.primary },
  editText: { ...Typography.bodySm, color: '#FFF', fontFamily: 'Inter_600SemiBold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    height: '90%',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  modalTitle: { ...Typography.h3, color: Colors.primary },
  modalScroll: { flex: 1 },
  modalForm: { padding: Spacing.xl, paddingBottom: Spacing.lg },
  fieldLabel: { ...Typography.labelCaps, color: Colors.outline, fontSize: 10, marginTop: Spacing.md, marginBottom: 6 },
  questionInput: {
    backgroundColor: '#F8FAFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: '#E1E8F0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionInput: {
    backgroundColor: '#F8FAFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: '#E1E8F0',
    minHeight: 44,
    textAlignVertical: 'top',
    marginBottom: Spacing.sm,
  },
  explanationInput: {
    backgroundColor: '#F8FAFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: '#E1E8F0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pairRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  correctRow: { flexDirection: 'row', gap: Spacing.sm },
  correctBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: '#E1E8F0', alignItems: 'center' },
  correctBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  correctBtnText: { ...Typography.bodyMd, color: Colors.outline, fontFamily: 'Inter_700Bold' },
  correctBtnTextActive: { color: '#FFF' },
  editErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  editErrorText: { ...Typography.bodySm, color: '#DC2626', flex: 1 },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  cancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: '#F0F2F5' },
  cancelText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, fontFamily: 'Inter_700Bold' },
  saveBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.primary },
  saveText: { ...Typography.bodyMd, color: '#FFF', fontFamily: 'Inter_700Bold' },
});

const rStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  emptyText: { ...Typography.bodyMd, color: Colors.outline },

  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.xl,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  avgBlock: { alignItems: 'center', gap: 4, minWidth: 72 },
  avgNumber: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    color: Colors.onSurface,
    lineHeight: 48,
  },
  avgStars: { flexDirection: 'row', gap: 2 },
  avgCount: { ...Typography.bodySm, color: Colors.outline },

  distBlock: { flex: 1, gap: 6, justifyContent: 'center' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distStar: { ...Typography.bodySm, color: Colors.outline, width: 10, textAlign: 'right' },
  distBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F2F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  distCount: { ...Typography.bodySm, color: Colors.outline, width: 20, textAlign: 'right' },

  ratingCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    gap: 6,
  },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  starsRow: { flexDirection: 'row', gap: 2 },
  ratingDate: { ...Typography.bodySm, color: Colors.outline },
  ratingUser: { ...Typography.bodySm, color: Colors.outline, fontFamily: 'Inter_600SemiBold' },
  ratingReview: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
