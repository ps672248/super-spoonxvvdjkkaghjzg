import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CardBase } from '../shared/CardBase';
import { CardFooter } from '../shared/CardFooter';
import { ExamBadge } from '../shared/ExamBadge';
import { FOMOLine } from '../shared/FOMOLine';
import type { ExamConfig } from '../../../config/psus';
import type { BoardEntry } from '../../../services/leaderboard';

interface WeeklyTop3CardProps {
  exam: ExamConfig;
  metric: string;
  entries: BoardEntry[];
  highlightUid?: string;
}

const MEDAL = ['🥇', '🥈', '🥉'];
const MEDAL_COLOR = ['#FFD700', '#C0C0C0', '#CD7F32'];
const GOLD = '#FDC003';

export const WeeklyTop3Card = ({ exam, metric, entries, highlightUid }: WeeklyTop3CardProps) => {
  const top3 = entries.slice(0, 3);
  const metricLabel = metric === 'global_correct' ? 'correct answers' : `${metric} score`;

  const fomoLine = `This week's ${exam.name} leaderboard just dropped. Your name missing? Fix that.`;

  return (
    <CardBase examColor={GOLD} mode="mcq" variant={1}>
      <View style={styles.badgeRow}>
        <View style={styles.weekPill}>
          <Text style={styles.weekText}>📊 Weekly Top 3</Text>
        </View>
        <ExamBadge exam={exam} />
      </View>

      <View style={styles.metricLabel}>
        <Text style={styles.metricText}>{metricLabel.toUpperCase()}</Text>
      </View>

      <View style={styles.podium}>
        {top3.map((entry, i) => {
          const isHighlight = entry.uid === highlightUid;
          return (
            <View
              key={entry.uid}
              style={[
                styles.podiumRow,
                isHighlight && styles.podiumRowHighlight,
              ]}
            >
              <Text style={styles.medal}>{MEDAL[i]}</Text>
              <View style={styles.podiumInfo}>
                <Text style={[styles.podiumName, isHighlight && styles.podiumNameGold]} numberOfLines={1}>
                  {entry.name}
                </Text>
                <Text style={styles.podiumBranch}>{entry.branchName}</Text>
              </View>
              <Text style={[styles.podiumValue, { color: MEDAL_COLOR[i] }]}>
                {entry.value.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>

      <FOMOLine text={fomoLine} />

      <CardFooter />
    </CardBase>
  );
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  weekPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDC003',
    backgroundColor: 'rgba(253,192,3,0.1)',
  },
  weekText: {
    fontSize: 12,
    color: '#FDC003',
    fontFamily: 'Inter_600SemiBold',
  },
  metricLabel: {
    marginTop: 16,
    marginBottom: 8,
  },
  metricText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
  },
  podium: {
    gap: 8,
    marginBottom: 16,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  podiumRowHighlight: {
    backgroundColor: 'rgba(253,192,3,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253,192,3,0.3)',
  },
  medal: {
    fontSize: 24,
    width: 30,
    textAlign: 'center',
  },
  podiumInfo: {
    flex: 1,
  },
  podiumName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter_600SemiBold',
  },
  podiumNameGold: {
    color: '#FDC003',
  },
  podiumBranch: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  podiumValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
