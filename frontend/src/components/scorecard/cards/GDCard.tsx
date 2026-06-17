import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CardBase } from '../shared/CardBase';
import { CardFooter } from '../shared/CardFooter';
import { ExamBadge } from '../shared/ExamBadge';
import { GoldStat } from '../shared/GoldStat';
import { FOMOLine } from '../shared/FOMOLine';
import { StatChip, StatChipRow } from '../shared/StatChip';
import { pickFOMOLine } from '../../../config/scorecard-templates';
import type { CardVars } from '../../../config/scorecard-templates';
import { getBranch } from '../../../config/branches';

const GD_BADGE_COLOR = '#00838F';

export const GDCard = ({ vars }: { vars: CardVars }) => {
  const branch = getBranch(vars.branchId);
  const fomoLine = pickFOMOLine('gd', vars);
  const rating = vars.score;

  return (
    <CardBase examColor={GD_BADGE_COLOR} mode="gd" variant={vars.variant ?? 0}>
      <View style={styles.badgeRow}>
        <View style={[styles.pill, { borderColor: GD_BADGE_COLOR }]}>
          <Text style={styles.pillText}>🗣️ Group Discussion</Text>
        </View>
        <ExamBadge exam={vars.exam} branchShort={branch?.shortName} />
      </View>

      {vars.gdTopic && (
        <View style={styles.topicBox}>
          <Text style={styles.topicLabel}>TOPIC</Text>
          <Text style={styles.topicText} numberOfLines={2}>{vars.gdTopic}</Text>
        </View>
      )}

      <GoldStat
        label="GD RATING"
        value={`${rating}/10`}
        sublabel={rating >= 8 ? 'Led the discussion' : rating >= 6 ? 'Active contributor' : 'Keep practicing'}
      />

      <FOMOLine text={fomoLine} />

      <StatChipRow>
        <StatChip icon="flame" value={`${vars.streak}d`} label="streak" />
        <StatChip icon="people-outline" value={vars.sessionsThisWeek} label="this week" />
        <StatChip icon="star-outline" value={`${rating}/10`} label="rating" />
      </StatChipRow>

      <CardFooter />
    </CardBase>
  );
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(0,131,143,0.15)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  topicBox: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: GD_BADGE_COLOR,
  },
  topicLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 3,
  },
  topicText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
