import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useActivityStore, StudySession } from '@/stores/activityStore';
import { AppHeader } from '@/components/AppHeader';

// ─── Label maps ───────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  quant:     'Quantitative',
  reasoning: 'Reasoning',
  english:   'English',
  gk:        'General Knowledge',
  technical: 'Technical',
};

const MODE_LABELS: Record<string, string> = {
  mcq:      'MCQ Blitz',
  survival: 'Survival',
  match:    'Match',
  slasher:  'Slasher',
  mario:    'Mario Runner',
};

const MODE_COLORS: Record<string, string> = {
  mcq:      Colors.mcqBlue,
  survival: Colors.survivalRed,
  match:    Colors.matchGreen,
  slasher:  '#E91E63',
  mario:    Colors.marioYellow,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accuracyColor(acc: number): string {
  if (acc >= 70) return Colors.matchGreen;
  if (acc >= 50) return Colors.marioYellow;
  return Colors.survivalRed;
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10); // YYYY-MM-DD
}

function pct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// ─── Analytics computations ───────────────────────────────────────────────────

function computeStreak(sessions: StudySession[]): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const days = new Set(sessions.map(s => dayKey(s.timestamp)));
  const sorted = Array.from(days).sort().reverse(); // newest first

  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - 86400000);
  // Streak only counts if played today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return { current: 0, longest: 0 };

  let current = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const d1 = new Date(sorted[i]);
    const d2 = new Date(sorted[i + 1]);
    const diff = (d1.getTime() - d2.getTime()) / 86400000;
    if (diff === 1) current++;
    else break;
  }

  // Longest streak
  const asc = Array.from(days).sort();
  let longest = 1, run = 1;
  for (let i = 0; i < asc.length - 1; i++) {
    const d1 = new Date(asc[i]);
    const d2 = new Date(asc[i + 1]);
    const diff = (d2.getTime() - d1.getTime()) / 86400000;
    if (diff === 1) { run++; if (run > longest) longest = run; }
    else run = 1;
  }

  return { current, longest };
}

function computeWeeklyBars(sessions: StudySession[]): { label: string; questions: number; dayKey: string }[] {
  const bars: { label: string; questions: number; dayKey: string }[] = [];
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const ts = Date.now() - i * 86400000;
    const dk = dayKey(ts);
    const daySessions = sessions.filter(s => dayKey(s.timestamp) === dk);
    bars.push({
      label: i === 0 ? 'Today' : DAY_LABELS[new Date(ts).getDay()],
      questions: daySessions.reduce((sum, s) => sum + s.questionsTotal, 0),
      dayKey: dk,
    });
  }
  return bars;
}

function computeWeekTrend(sessions: StudySession[]): { thisWeek: number; lastWeek: number; pctChange: number } {
  const now = Date.now();
  const thisWeek = sessions.filter(s => s.timestamp >= now - 7 * 86400000)
    .reduce((sum, s) => sum + s.questionsTotal, 0);
  const lastWeek = sessions.filter(s =>
    s.timestamp >= now - 14 * 86400000 && s.timestamp < now - 7 * 86400000
  ).reduce((sum, s) => sum + s.questionsTotal, 0);
  const pctChange = lastWeek === 0
    ? (thisWeek > 0 ? 100 : 0)
    : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { thisWeek, lastWeek, pctChange };
}

function computeSectionPerf(sessions: StudySession[]) {
  const map = new Map<string, { correct: number; total: number }>();
  for (const s of sessions) {
    for (const secId of s.sections) {
      if (!map.has(secId)) map.set(secId, { correct: 0, total: 0 });
      const n = map.get(secId)!;
      const share = s.sections.length > 0
        ? Math.round(s.questionsTotal / s.sections.length)
        : s.questionsTotal;
      const cShare = s.sections.length > 0
        ? Math.round(s.questionsCorrect / s.sections.length)
        : s.questionsCorrect;
      n.total += share;
      n.correct += cShare;
    }
  }
  return Array.from(map.entries())
    .map(([sectionId, v]) => ({
      sectionId,
      label: SECTION_LABELS[sectionId] ?? sectionId,
      accuracy: pct(v.correct, v.total),
      questionsTotal: v.total,
    }))
    .sort((a, b) => b.questionsTotal - a.questionsTotal);
}

function computeModePerf(sessions: StudySession[]) {
  const map = new Map<string, { correct: number; total: number; sessions: number }>();
  for (const s of sessions) {
    if (!map.has(s.gameMode)) map.set(s.gameMode, { correct: 0, total: 0, sessions: 0 });
    const n = map.get(s.gameMode)!;
    n.correct += s.questionsCorrect;
    n.total += s.questionsTotal;
    n.sessions += 1;
  }
  return Array.from(map.entries())
    .map(([mode, v]) => ({
      mode,
      label: MODE_LABELS[mode] ?? mode,
      color: MODE_COLORS[mode] ?? Colors.primary,
      accuracy: pct(v.correct, v.total),
      sessions: v.sessions,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

function computeWeakTopics(sessions: StudySession[]) {
  const map = new Map<string, { correct: number; total: number; sessions: number; psuName: string; branchName: string }>();
  for (const s of sessions) {
    for (const topicId of s.topics) {
      if (!map.has(topicId)) {
        map.set(topicId, { correct: 0, total: 0, sessions: 0, psuName: s.psuName, branchName: s.branchName });
      }
      const n = map.get(topicId)!;
      const share = s.topics.length > 0 ? Math.round(s.questionsTotal / s.topics.length) : s.questionsTotal;
      const cShare = s.topics.length > 0 ? Math.round(s.questionsCorrect / s.topics.length) : s.questionsCorrect;
      n.total += share;
      n.correct += cShare;
      n.sessions += 1;
    }
  }
  return Array.from(map.entries())
    .map(([topicId, v]) => ({
      topicId,
      accuracy: pct(v.correct, v.total),
      sessions: v.sessions,
      psuName: v.psuName,
      branchName: v.branchName,
    }))
    .filter(t => t.accuracy < 55 && t.sessions >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);
}

function computePSUProgress(sessions: StudySession[]) {
  const map = new Map<string, { psuName: string; correct: number; total: number; sessions: number; branches: Set<string> }>();
  for (const s of sessions) {
    if (!map.has(s.psuId)) map.set(s.psuId, { psuName: s.psuName, correct: 0, total: 0, sessions: 0, branches: new Set() });
    const n = map.get(s.psuId)!;
    n.correct += s.questionsCorrect;
    n.total += s.questionsTotal;
    n.sessions += 1;
    n.branches.add(s.branchId);
  }
  return Array.from(map.entries())
    .map(([psuId, v]) => ({
      psuId,
      psuName: v.psuName,
      accuracy: pct(v.correct, v.total),
      sessions: v.sessions,
      questionsTotal: v.total,
      branches: v.branches.size,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <View style={styles.card}>
      {accent && <View style={[styles.cardAccent, { backgroundColor: accent }]} />}
      <View style={styles.cardInner}>{children}</View>
    </View>
  );
}

function CardTitle({ icon, label, color = Colors.primary }: { icon: any; label: string; color?: string }) {
  return (
    <View style={styles.cardTitleRow}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.cardTitle, { color }]}>{label}</Text>
    </View>
  );
}

function AccuracyBar({ accuracy, label, sublabel, color }: {
  accuracy: number; label: string; sublabel?: string; color?: string;
}) {
  const c = color ?? accuracyColor(accuracy);
  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelWrap}>
        <Text style={styles.barLabel}>{label}</Text>
        {sublabel && <Text style={styles.barSublabel}>{sublabel}</Text>}
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${accuracy}%`, backgroundColor: c }]} />
      </View>
      <Text style={[styles.barPct, { color: c }]}>{accuracy}%</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const { sessions, isLoaded } = useActivityStore();

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const weekBars = useMemo(() => computeWeeklyBars(sessions), [sessions]);
  const weekTrend = useMemo(() => computeWeekTrend(sessions), [sessions]);
  const sectionPerf = useMemo(() => computeSectionPerf(sessions), [sessions]);
  const modePerf = useMemo(() => computeModePerf(sessions), [sessions]);
  const weakTopics = useMemo(() => computeWeakTopics(sessions), [sessions]);
  const psuProgress = useMemo(() => computePSUProgress(sessions), [sessions]);

  const totalQuestions = useMemo(() =>
    sessions.reduce((sum, s) => sum + s.questionsTotal, 0), [sessions]);
  const overallAccuracy = useMemo(() => {
    const correct = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);
    return pct(correct, totalQuestions);
  }, [sessions, totalQuestions]);

  const barMax = Math.max(...weekBars.map(b => b.questions), 1);

  if (!isLoaded) return null;

  if (sessions.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bar-chart-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyDesc}>
            Complete your first game session to start tracking your progress.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Insights</Text>

        {/* ── Hero Stats ────────────────────────────────────────────────── */}
        <View style={styles.heroRow}>
          <View style={[styles.heroCard, { backgroundColor: Colors.primary }]}>
            <Text style={styles.heroValue}>🔥 {streak.current}</Text>
            <Text style={styles.heroLabel}>Day Streak</Text>
          </View>
          <View style={[styles.heroCard, { backgroundColor: Colors.mcqBlue }]}>
            <Text style={styles.heroValue}>{sessions.length}</Text>
            <Text style={styles.heroLabel}>Sessions</Text>
          </View>
          <View style={[styles.heroCard, { backgroundColor: accuracyColor(overallAccuracy) }]}>
            <Text style={styles.heroValue}>{overallAccuracy}%</Text>
            <Text style={styles.heroLabel}>Accuracy</Text>
          </View>
          <View style={[styles.heroCard, { backgroundColor: Colors.secondary }]}>
            <Text style={styles.heroValue}>{totalQuestions}</Text>
            <Text style={styles.heroLabel}>Questions</Text>
          </View>
        </View>

        {/* ── Weekly Activity ───────────────────────────────────────────── */}
        <Card accent={Colors.primary}>
          <CardTitle icon="calendar-outline" label="This Week" />
          <View style={styles.weekStatsRow}>
            <Text style={styles.weekTotal}>{weekTrend.thisWeek} questions</Text>
            {weekTrend.lastWeek > 0 && (
              <View style={styles.trendBadge}>
                <Ionicons
                  name={weekTrend.pctChange >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={weekTrend.pctChange >= 0 ? Colors.matchGreen : Colors.survivalRed}
                />
                <Text style={[
                  styles.trendText,
                  { color: weekTrend.pctChange >= 0 ? Colors.matchGreen : Colors.survivalRed }
                ]}>
                  {weekTrend.pctChange > 0 ? '+' : ''}{weekTrend.pctChange}% vs last week
                </Text>
              </View>
            )}
          </View>

          {/* Bar chart */}
          <View style={styles.barChart}>
            {weekBars.map(bar => {
              const height = Math.max(4, Math.round((bar.questions / barMax) * 80));
              const isToday = bar.label === 'Today';
              return (
                <View key={bar.dayKey} style={styles.barCol}>
                  <Text style={styles.barChartCount}>
                    {bar.questions > 0 ? bar.questions : ''}
                  </Text>
                  <View style={styles.barChartTrack}>
                    <View style={[
                      styles.barChartFill,
                      {
                        height,
                        backgroundColor: isToday ? Colors.gold : Colors.primary + '60',
                      }
                    ]} />
                  </View>
                  <Text style={[styles.barChartLabel, isToday && { color: Colors.gold, fontFamily: 'Inter_700Bold' }]}>
                    {bar.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {streak.longest > 1 && (
            <Text style={styles.streakNote}>
              🏆 Longest streak: {streak.longest} days
            </Text>
          )}
        </Card>

        {/* ── Weak Areas ───────────────────────────────────────────────── */}
        {weakTopics.length > 0 && (
          <Card accent={Colors.survivalRed}>
            <CardTitle icon="warning-outline" label="Needs Work" color={Colors.survivalRed} />
            <Text style={styles.cardDesc}>
              Topics with {'<'}55% accuracy across 2+ sessions
            </Text>
            {weakTopics.map(t => (
              <View key={t.topicId} style={styles.weakRow}>
                <View style={styles.weakLeft}>
                  <Text style={styles.weakTopic}>{t.topicId.replace(/_/g, ' ')}</Text>
                  <Text style={styles.weakMeta}>{t.branchName} · {t.sessions} sessions</Text>
                </View>
                <View style={[styles.weakBadge, { backgroundColor: accuracyColor(t.accuracy) + '20' }]}>
                  <Text style={[styles.weakBadgeText, { color: accuracyColor(t.accuracy) }]}>
                    {t.accuracy}%
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* ── Section Performance ──────────────────────────────────────── */}
        {sectionPerf.length > 0 && (
          <Card accent={Colors.mcqBlue}>
            <CardTitle icon="layers-outline" label="Section Performance" color={Colors.mcqBlue} />
            <View style={styles.barsContainer}>
              {sectionPerf.map(s => (
                <AccuracyBar
                  key={s.sectionId}
                  label={s.label}
                  sublabel={`${s.questionsTotal} questions`}
                  accuracy={s.accuracy}
                />
              ))}
            </View>
            {sectionPerf.length >= 2 && (
              <View style={styles.perfSummary}>
                <View style={styles.perfSummaryItem}>
                  <Ionicons name="trophy-outline" size={14} color={Colors.matchGreen} />
                  <Text style={[styles.perfSummaryText, { color: Colors.matchGreen }]}>
                    Best: {sectionPerf.reduce((a, b) => a.accuracy > b.accuracy ? a : b).label}
                  </Text>
                </View>
                <View style={styles.perfSummaryItem}>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.survivalRed} />
                  <Text style={[styles.perfSummaryText, { color: Colors.survivalRed }]}>
                    Weakest: {sectionPerf.reduce((a, b) => a.accuracy < b.accuracy ? a : b).label}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* ── Game Mode Performance ─────────────────────────────────────── */}
        {modePerf.length > 0 && (
          <Card accent={Colors.gold}>
            <CardTitle icon="game-controller-outline" label="Game Mode Stats" color={Colors.secondary} />
            <View style={styles.modeGrid}>
              {modePerf.map(m => (
                <View key={m.mode} style={styles.modeCard}>
                  <View style={[styles.modeDot, { backgroundColor: m.color }]} />
                  <Text style={styles.modeLabel}>{m.label}</Text>
                  <Text style={[styles.modeAccuracy, { color: accuracyColor(m.accuracy) }]}>
                    {m.accuracy}%
                  </Text>
                  <Text style={styles.modeSessions}>{m.sessions} sessions</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ── PSU Progress ─────────────────────────────────────────────── */}
        {psuProgress.length > 0 && (
          <Card accent={Colors.matchGreen}>
            <CardTitle icon="school-outline" label="PSU Progress" color={Colors.matchGreen} />
            <View style={styles.barsContainer}>
              {psuProgress.map(p => (
                <AccuracyBar
                  key={p.psuId}
                  label={p.psuName}
                  sublabel={`${p.sessions} sessions · ${p.branches} branch${p.branches > 1 ? 'es' : ''}`}
                  accuracy={p.accuracy}
                  color={accuracyColor(p.accuracy)}
                />
              ))}
            </View>
          </Card>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  container: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing.xl },

  pageTitle: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },

  // Hero row
  heroRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroCard: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadows.card,
  },
  heroValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFF',
    lineHeight: 24,
  },
  heroLabel: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  cardAccent: { height: 4, width: '40%' },
  cardInner: { padding: Spacing.xl, gap: Spacing.lg },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.primary,
  },
  cardDesc: {
    ...Typography.bodySm,
    color: Colors.outline,
    marginTop: -Spacing.sm,
  },

  // Weekly bar chart
  weekStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
    marginTop: -Spacing.sm,
  },
  weekTotal: {
    ...Typography.h3,
    color: Colors.onSurface,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F2F5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  trendText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 120,
    paddingTop: Spacing.md,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barChartCount: {
    ...Typography.bodySm,
    fontSize: 9,
    color: Colors.outline,
    height: 14,
  },
  barChartTrack: {
    width: '100%',
    height: 80,
    justifyContent: 'flex-end',
    backgroundColor: '#F0F2F5',
    borderRadius: Radius.xs,
    overflow: 'hidden',
  },
  barChartFill: {
    width: '100%',
    borderRadius: Radius.xs,
  },
  barChartLabel: {
    ...Typography.bodySm,
    fontSize: 9,
    color: Colors.outline,
    textAlign: 'center',
  },
  streakNote: {
    ...Typography.bodySm,
    color: Colors.outline,
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },

  // Weak areas
  weakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  weakLeft: { flex: 1 },
  weakTopic: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'capitalize',
  },
  weakMeta: {
    ...Typography.bodySm,
    color: Colors.outline,
    marginTop: 2,
  },
  weakBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginLeft: Spacing.md,
  },
  weakBadgeText: {
    ...Typography.labelCaps,
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },

  // Accuracy bars
  barsContainer: { gap: Spacing.md },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barLabelWrap: { width: 100 },
  barLabel: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  barSublabel: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 9,
    marginTop: 1,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#F0F2F5',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.pill,
    minWidth: 4,
  },
  barPct: {
    ...Typography.bodySm,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    width: 38,
    textAlign: 'right',
  },

  // Section perf summary
  perfSummary: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  perfSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perfSummaryText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },

  // Mode grid
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
  },
  modeCard: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  modeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 2,
  },
  modeLabel: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  modeAccuracy: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  modeSessions: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 10,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyIconWrap: {
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
  emptyDesc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
});
