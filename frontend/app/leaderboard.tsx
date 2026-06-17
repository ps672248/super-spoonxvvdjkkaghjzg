import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useActivityStore } from '@/stores/activityStore';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLeaderboardStore } from '@/stores/leaderboardStore';
import { getCategory } from '@/config/categories';
import { SyncBadge } from '@/components/SyncBadge';
import {
  fetchBoard, fetchMyRank, fetchOvertakeTarget, myValueFor,
  type BoardEntry, type BoardMetric, type BoardWindow,
} from '@/services/leaderboard';

const METRICS: { id: BoardMetric; label: string; unit: string }[] = [
  { id: 'global_correct', label: 'Correct', unit: 'correct' },
  { id: 'mario', label: 'Mario', unit: 'pts' },
  { id: 'slasher', label: 'Slasher', unit: 'pts' },
  { id: 'tsunami', label: 'Tsunami', unit: 'pts' },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const sessions = useActivityStore(s => s.sessions);
  const categoryId = useSettingsStore(s => s.categoryId);
  const markSeen = useLeaderboardStore(s => s.markSeen);

  const [tier, setTier] = useState<BoardWindow>('week');
  const [metric, setMetric] = useState<BoardMetric>('global_correct');
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [myRank, setMyRank] = useState(0);
  const [myValue, setMyValue] = useState(0);
  const [overtake, setOvertake] = useState<BoardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const unit = METRICS.find(m => m.id === metric)!.unit;

  // Clear the header badge once they're looking at the board.
  useEffect(() => { markSeen(); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const value = myValueFor(sessions, metric, tier, categoryId);
    setMyValue(value);
    try {
      const [board, rank, target] = await Promise.all([
        fetchBoard(categoryId, metric, tier),
        user ? fetchMyRank(categoryId, metric, tier, value) : Promise.resolve(0),
        user ? fetchOvertakeTarget(categoryId, metric, tier, value) : Promise.resolve(null),
      ]);
      setEntries(board);
      setMyRank(rank);
      setOvertake(target);
    } catch {
      // Keep any previously-loaded entries on screen (stale-while-revalidate).
    } finally {
      setLoading(false);
    }
  }, [metric, tier, sessions, user, categoryId]);

  useEffect(() => { load(); }, [load]);

  // ── Your-position / CTA card ───────────────────────────────────────────────
  const renderSelfCard = () => {
    if (!user) {
      return (
        <TouchableOpacity
          style={[styles.selfCard, styles.selfCardCta]}
          onPress={() => router.push('/auth/login' as any)}
          activeOpacity={0.9}
        >
          <Ionicons name="trophy" size={26} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selfCtaTitle}>Sign in to join the leaderboard</Text>
            <Text style={styles.selfCtaSub}>
              Your {myValue > 0 ? `${myValue} ${unit}` : 'progress'} goes live the moment you sign in.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      );
    }
    if (myRank === 0) {
      // Light card here — dark text on the navy selfCard is unreadable.
      return (
        <View style={[styles.selfCard, styles.selfCardLight]}>
          <Ionicons
            name={loading ? 'hourglass-outline' : 'flag-outline'}
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.selfJoinText}>
            {loading
              ? 'Loading your rank…'
              : metric === 'global_correct'
                ? 'Answer 1 question to join the board.'
                : `Play ${METRICS.find(m => m.id === metric)!.label} to land on the board.`}
          </Text>
        </View>
      );
    }
    const gap = overtake ? Math.max(0, overtake.value - myValue) : 0;
    return (
      <View style={styles.selfCard}>
        <View style={styles.rankPill}>
          <Text style={styles.rankPillText}>#{myRank}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.selfValue}>{myValue} {unit}</Text>
          {overtake ? (
            <Text style={styles.selfHint}>
              {gap} {unit} to overtake {overtake.name}
            </Text>
          ) : (
            <Text style={styles.selfHint}>You're #1 — defend it 🔥</Text>
          )}
        </View>
      </View>
    );
  };

  const renderRow = ({ item, index }: { item: BoardEntry; index: number }) => {
    const rank = index + 1;
    const isMe = user?.uid === item.uid;
    const medal = rank <= 3;
    return (
      <View style={[styles.row, isMe && styles.rowMe]}>
        <Text style={[styles.rowRank, medal && styles.rowRankMedal]}>
          {medal ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
        </Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.rowName, isMe && styles.rowNameMe]} numberOfLines={1}>
            {item.name}{isMe ? ' (you)' : ''}
          </Text>
          {!!(item.branchName || item.branchId) && (
            <Text style={styles.rowBranch} numberOfLines={1}>{item.branchName || item.branchId}</Text>
          )}
        </View>
        <Text style={styles.rowValue}>{item.value}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.headerSub}>{getCategory(categoryId).name}</Text>
        </View>
        <View style={styles.headerRight}>
          <SyncBadge visible={loading} label="" />
        </View>
      </View>

      {/* Tier toggle */}
      <View style={styles.tierRow}>
        {(['week', 'alltime'] as BoardWindow[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tierBtn, tier === t && styles.tierBtnActive]}
            onPress={() => setTier(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tierText, tier === t && styles.tierTextActive]}>
              {t === 'week' ? 'This Week' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metric chips */}
      <View style={styles.chipRow}>
        {METRICS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.chip, metric === m.id && styles.chipActive]}
            onPress={() => setMetric(m.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, metric === m.id && styles.chipTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderSelfCard()}

      {entries.length === 0 ? (
        <View style={styles.center}>
          {loading ? (
            <SyncBadge visible label="Loading board" />
          ) : (
            <>
              <Ionicons name="trophy-outline" size={40} color={Colors.outlineVariant} />
              <Text style={styles.emptyText}>
                No scores yet {tier === 'week' ? 'this week' : ''}. Be the first — play a round.
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.uid}
          renderItem={renderRow}
          contentContainerStyle={{ paddingBottom: Spacing.xxxl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F0F2F5', backgroundColor: '#FFF',
  },
  backBtn: { width: 30 },
  headerRight: { minWidth: 30, alignItems: 'flex-end' },
  headerTitle: { ...Typography.h3, color: Colors.onSurface },
  headerSub: { ...Typography.bodySm, color: Colors.outline, fontSize: 11, marginTop: 1 },

  tierRow: {
    flexDirection: 'row', gap: Spacing.sm, margin: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainer, borderRadius: Radius.pill, padding: 4,
  },
  tierBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.pill, alignItems: 'center' },
  tierBtnActive: { backgroundColor: Colors.primary },
  tierText: { ...Typography.button, color: Colors.onSurfaceVariant, fontSize: 13 },
  tierTextActive: { color: Colors.onPrimary },

  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceContainer, borderWidth: 1, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: Colors.gold + '22', borderColor: Colors.gold },
  chipText: { ...Typography.buttonSm, color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.goldDark, fontFamily: 'Inter_700Bold' },

  selfCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    padding: Spacing.lg, borderRadius: Radius.lg, ...Shadows.card,
  },
  selfCardCta: { backgroundColor: '#FFF', borderWidth: 1, borderColor: Colors.gold },
  selfCardLight: { backgroundColor: '#FFF', borderWidth: 1, borderColor: Colors.outlineVariant },
  selfCtaTitle: { ...Typography.h4, color: Colors.primary },
  selfCtaSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  selfJoinText: { ...Typography.bodyMd, color: Colors.onSurface, flex: 1, fontFamily: 'Inter_600SemiBold' },
  rankPill: {
    minWidth: 52, paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.pill, backgroundColor: Colors.gold, alignItems: 'center',
  },
  rankPillText: { ...Typography.h4, color: Colors.secondary, fontFamily: 'Inter_700Bold' },
  selfValue: { ...Typography.h3, color: Colors.onPrimary },
  selfHint: { ...Typography.bodySm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '55',
    minHeight: 56,
  },
  rowMe: { backgroundColor: Colors.gold + '14' },
  rowRank: { width: 34, textAlign: 'center', ...Typography.bodyMd, color: Colors.onSurfaceVariant, fontFamily: 'Inter_700Bold' },
  rowRankMedal: { fontSize: 20 },
  rowName: { ...Typography.bodyMd, color: Colors.onSurface, fontFamily: 'Inter_600SemiBold' },
  rowNameMe: { color: Colors.primary, fontFamily: 'Inter_700Bold' },
  rowBranch: { ...Typography.bodySm, color: Colors.outline, fontSize: 11, marginTop: 1 },
  rowValue: { ...Typography.h4, color: Colors.goldDark },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 260 },
});
