import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useActivityStore, StudySession, InterviewSession } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfigStore } from '@/stores/configStore';
import { categoryIdForExam, getCategory } from '@/config/categories';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MODE_LABELS: Record<string, string> = {
  mcq: 'MCQ', survival: 'Survival', match: 'Match',
  slasher: 'Slasher', mario: 'Mario', tsunami: 'Tsunami',
};

const MODE_COLORS: Record<string, string> = {
  mcq: Colors.mcqBlue, survival: Colors.survivalRed, match: Colors.matchGreen,
  slasher: '#E91E63', mario: Colors.marioYellow, tsunami: Colors.primary,
};

const TYPE_LABELS: Record<string, string> = {
  gd: 'GD', technical: 'Technical', hr: 'HR',
};

const TYPE_COLORS: Record<string, string> = {
  gd: Colors.tertiary, technical: Colors.primary, hr: Colors.matchGreen,
};

function formatTopicId(topicId: string): string {
  const parts = topicId.split('_');
  const name = parts.length > 1 ? parts.slice(1).join(' ') : topicId;
  return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function pct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

function accuracyColor(acc: number): string {
  if (acc >= 70) return Colors.matchGreen;
  if (acc >= 50) return Colors.marioYellow;
  return Colors.survivalRed;
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function StudyCard({ session }: { session: StudySession }) {
  const modeColor = MODE_COLORS[session.gameMode] ?? Colors.primary;
  const acc = pct(session.questionsCorrect, session.questionsTotal);
  const topicsToShow = session.topics.slice(0, 3);
  const extraTopics = session.topics.length - 3;

  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardInner}>
        {/* Badge row */}
        <View style={styles.badgeRow}>
          <View style={styles.examBadge}>
            <Text style={styles.examBadgeText} numberOfLines={1}>{session.psuName.toUpperCase()}</Text>
          </View>
          {session.branchName ? (
            <View style={styles.branchBadge}>
              <Text style={styles.branchBadgeText} numberOfLines={1}>{session.branchName.toUpperCase()}</Text>
            </View>
          ) : null}
          <View style={[styles.modePill, { borderColor: modeColor }]}>
            <Text style={[styles.modePillText, { color: modeColor }]}>
              {MODE_LABELS[session.gameMode] ?? session.gameMode}
            </Text>
          </View>
        </View>

        {/* Topics */}
        {session.topics.length > 0 && (
          <View style={styles.topicRow}>
            <Ionicons name="book-outline" size={12} color={Colors.outline} />
            <Text style={styles.topicText} numberOfLines={2}>
              {topicsToShow.map(formatTopicId).join(', ')}
              {extraTopics > 0 ? ` +${extraTopics} more` : ''}
            </Text>
          </View>
        )}

        {/* Divider + Stats */}
        <View style={styles.statsDivider} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{session.questionsCorrect}/{session.questionsTotal}</Text>
            <Text style={styles.statLabel}>correct</Text>
          </View>
          <View style={styles.statDot} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accuracyColor(acc) }]}>{acc}%</Text>
            <Text style={styles.statLabel}>accuracy</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={styles.dateText}>{formatDate(session.timestamp)}</Text>
        </View>
      </View>
    </View>
  );
}

function InterviewCard({ session }: { session: InterviewSession }) {
  const typeColor = TYPE_COLORS[session.type] ?? Colors.primary;
  const typeLabel = TYPE_LABELS[session.type] ?? session.type.toUpperCase();

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: Colors.primary }]} />
      <View style={styles.cardInner}>
        {/* Badge row */}
        <View style={styles.badgeRow}>
          <View style={styles.examBadge}>
            <Text style={styles.examBadgeText} numberOfLines={1}>{session.psuName.toUpperCase()}</Text>
          </View>
          {session.branchName ? (
            <View style={styles.branchBadge}>
              <Text style={styles.branchBadgeText} numberOfLines={1}>{session.branchName.toUpperCase()}</Text>
            </View>
          ) : null}
          <View style={[styles.modePill, { borderColor: typeColor }]}>
            <Text style={[styles.modePillText, { color: typeColor }]}>{typeLabel}</Text>
          </View>
        </View>

        {/* GD topic */}
        {session.type === 'gd' && session.topic ? (
          <View style={styles.topicRow}>
            <Ionicons name="chatbubbles-outline" size={12} color={Colors.outline} />
            <Text style={styles.topicText} numberOfLines={2}>{session.topic}</Text>
          </View>
        ) : null}

        {/* Divider + Stats */}
        <View style={styles.statsDivider} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accuracyColor(session.overallRating * 10) }]}>
              {session.overallRating}/10
            </Text>
            <Text style={styles.statLabel}>score</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={styles.dateText}>{formatDate(session.timestamp)}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type CombinedItem =
  | { kind: 'study'; data: StudySession }
  | { kind: 'interview'; data: InterviewSession };

const ALL = '__all__';

export default function SessionsScreen() {
  const router = useRouter();
  const sessions = useActivityStore(s => s.sessions);
  const interviewSessions = useActivityStore(s => s.interviewSessions);
  const { categoryId } = useSettingsStore();
  const categories = useConfigStore(s => s.categories);
  const category = getCategory(categoryId);

  const [examFilter, setExamFilter] = useState(ALL);

  // Category-filtered pool
  const catStudy = useMemo(
    () => sessions.filter(s => categoryIdForExam(s.psuId, categories) === categoryId),
    [sessions, categoryId, categories],
  );
  const catInterview = useMemo(
    () => interviewSessions.filter(s => categoryIdForExam(s.psuId, categories) === categoryId),
    [interviewSessions, categoryId, categories],
  );

  // Unique exam names for filter chips
  const examNames = useMemo(() => {
    const names = new Set<string>();
    catStudy.forEach(s => names.add(s.psuName));
    catInterview.forEach(s => names.add(s.psuName));
    return Array.from(names).sort();
  }, [catStudy, catInterview]);

  // Final combined + sorted list
  const combined: CombinedItem[] = useMemo(() => {
    const study = (examFilter === ALL ? catStudy : catStudy.filter(s => s.psuName === examFilter))
      .map(s => ({ kind: 'study' as const, data: s }));
    const interviews = (examFilter === ALL ? catInterview : catInterview.filter(s => s.psuName === examFilter))
      .map(s => ({ kind: 'interview' as const, data: s }));
    return [...study, ...interviews].sort((a, b) => b.data.timestamp - a.data.timestamp);
  }, [catStudy, catInterview, examFilter]);

  const renderItem = ({ item }: { item: CombinedItem }) =>
    item.kind === 'study' ? <StudyCard session={item.data} /> : <InterviewCard session={item.data} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Session History</Text>
          <Text style={styles.headerSub}>{category.name}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Exam filter chips */}
      {examNames.length > 0 && (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[styles.filterChip, examFilter === ALL && styles.filterChipActive]}
              onPress={() => setExamFilter(ALL)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, examFilter === ALL && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {examNames.map(name => (
              <TouchableOpacity
                key={name}
                style={[styles.filterChip, examFilter === name && styles.filterChipActive]}
                onPress={() => setExamFilter(name)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, examFilter === name && styles.filterChipTextActive]}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {combined.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="time-outline" size={44} color={Colors.outlineVariant} />
          <Text style={styles.emptyText}>
            {examNames.length === 0
              ? 'No sessions yet. Start practicing to see your history here.'
              : 'No sessions for this exam.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={combined}
          keyExtractor={(item, i) => `${item.kind}-${item.data.id ?? i}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F0F2F5', backgroundColor: '#FFF',
  },
  backBtn: { width: 30 },
  headerRight: { minWidth: 30 },
  headerTitle: { ...Typography.h3, color: Colors.onSurface },
  headerSub: { ...Typography.bodySm, color: Colors.outline, fontSize: 11, marginTop: 1 },

  filterBar: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1, borderColor: 'transparent',
  },
  filterChipActive: { backgroundColor: Colors.primary + '18', borderColor: Colors.primary },
  filterChipText: { ...Typography.buttonSm, color: Colors.onSurfaceVariant, fontSize: 13 },
  filterChipTextActive: { color: Colors.primary, fontFamily: 'Inter_700Bold' },

  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },

  // Card — matches bookmarks.tsx / insights.tsx pattern
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  cardAccent: { width: 6, backgroundColor: Colors.gold },
  cardInner: { flex: 1, padding: Spacing.lg, gap: Spacing.sm },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },
  examBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md, paddingVertical: 3,
    borderRadius: Radius.sm, flexShrink: 1, minWidth: 0,
  },
  examBadgeText: {
    ...Typography.labelCaps, color: Colors.secondary,
    fontSize: 9, fontFamily: 'Inter_700Bold',
  },
  branchBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md, paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  branchBadgeText: {
    ...Typography.labelCaps, color: '#FFF',
    fontSize: 9, fontFamily: 'Inter_700Bold',
  },
  modePill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  modePillText: { ...Typography.labelCaps, fontFamily: 'Inter_700Bold', fontSize: 9 },

  topicRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  topicText: { ...Typography.bodySm, color: Colors.onSurfaceVariant, fontSize: 12, flex: 1 },

  statsDivider: { height: 1, backgroundColor: '#F0F2F5', marginVertical: Spacing.xs },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.outlineVariant },
  statItem: { alignItems: 'center' },
  statValue: { ...Typography.h4, fontFamily: 'Inter_700Bold', fontSize: 14, color: Colors.onSurface },
  statLabel: { ...Typography.bodySm, color: Colors.outline, fontSize: 10, marginTop: 1 },
  dateText: { ...Typography.bodySm, color: Colors.outline, fontSize: 11 },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyMd, color: Colors.onSurfaceVariant,
    textAlign: 'center', maxWidth: 280,
  },
});
