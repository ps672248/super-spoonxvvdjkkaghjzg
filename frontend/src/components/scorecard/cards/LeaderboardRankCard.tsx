import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CardBase } from '../shared/CardBase';
import { CardFooter } from '../shared/CardFooter';
import { ExamBadge } from '../shared/ExamBadge';
import { FOMOLine } from '../shared/FOMOLine';
import type { ExamConfig } from '../../../config/psus';
import { getBranch } from '../../../config/branches';

interface LeaderboardRankCardProps {
  exam: ExamConfig;
  branchId: string;
  rank: number;
  totalPlayers: number;
  value: number;
  metric: string;
  window: 'week' | 'alltime';
  streak: number;
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};
const GOLD = '#FDC003';

export const LeaderboardRankCard = ({
  exam, branchId, rank, totalPlayers, value, metric, window: win, streak,
}: LeaderboardRankCardProps) => {
  const branch = getBranch(branchId);
  const rankColor = RANK_COLORS[rank] ?? GOLD;
  const percentile = totalPlayers > 1
    ? Math.round((1 - (rank - 1) / totalPlayers) * 100)
    : 100;
  const windowLabel = win === 'week' ? 'This Week' : 'All Time';
  const metricLabel = metric === 'global_correct' ? 'correct answers' : `${metric} score`;

  const fomoLine = rank === 1
    ? `No one has beaten me on ${exam.name} ${windowLabel.toLowerCase()}. Come try.`
    : `Top ${100 - percentile + 1}% on ${exam.name}. ${totalPlayers - rank} behind me. Yet.`;

  return (
    <CardBase examColor={rankColor} mode="mcq" variant={0}>
      <View style={styles.badgeRow}>
        <View style={[styles.windowPill, { borderColor: rankColor }]}>
          <Text style={[styles.windowText, { color: rankColor }]}>{windowLabel} Leaderboard</Text>
        </View>
        <ExamBadge exam={exam} branchShort={branch?.shortName} />
      </View>

      <View style={styles.heroBlock}>
        <Text style={[styles.rankSymbol, { color: rankColor }]}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
        </Text>
        <Text style={styles.rankLabel}>RANK</Text>
        <Text style={styles.valueLine}>{value.toLocaleString()} {metricLabel}</Text>
        <Text style={styles.percentileLine}>Top {100 - percentile + 1}% of {totalPlayers.toLocaleString()} players</Text>
      </View>

      <FOMOLine text={fomoLine} />

      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipValue}>{streak}d</Text>
          <Text style={styles.chipLabel}>streak</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipValue}>#{rank}</Text>
          <Text style={styles.chipLabel}>rank</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipValue}>{percentile}%ile</Text>
          <Text style={styles.chipLabel}>percentile</Text>
        </View>
      </View>

      <CardFooter />
    </CardBase>
  );
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  windowPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(253,192,3,0.1)',
  },
  windowText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  heroBlock: {
    alignItems: 'center',
    marginVertical: 24,
  },
  rankSymbol: {
    fontSize: 72,
    lineHeight: 80,
  },
  rankLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
    marginTop: 4,
  },
  valueLine: {
    fontSize: 18,
    color: '#FDC003',
    fontFamily: 'Inter_700Bold',
    marginTop: 8,
  },
  percentileLine: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  chipValue: {
    color: '#FDC003',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  chipLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
