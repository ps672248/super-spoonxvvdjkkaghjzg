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

const PI_BADGE_COLOR = '#7B1FA2';

export const PICard = ({ vars }: { vars: CardVars }) => {
  const branch = getBranch(vars.branchId);
  const fomoLine = pickFOMOLine('pi', vars);
  const rating = vars.score;
  const isHR = vars.interviewType === 'hr';
  const label = isHR ? 'HR PI RATING' : 'TECHNICAL PI RATING';
  const icon = isHR ? '🧠' : '⚙️';

  return (
    <CardBase examColor={PI_BADGE_COLOR} mode="pi" variant={vars.variant ?? 0}>
      <View style={styles.badgeRow}>
        <View style={[styles.pill, { borderColor: PI_BADGE_COLOR }]}>
          <Text style={styles.pillText}>{icon} {isHR ? 'HR PI' : 'Technical PI'}</Text>
        </View>
        <ExamBadge exam={vars.exam} branchShort={branch?.shortName} />
      </View>

      <GoldStat
        label={label}
        value={`${rating}/10`}
        sublabel={rating >= 8 ? 'Outstanding performance' : rating >= 6 ? 'Strong candidate' : 'Keep practicing'}
      />

      <FOMOLine text={fomoLine} />

      <StatChipRow>
        <StatChip icon="flame" value={`${vars.streak}d`} label="streak" />
        <StatChip icon="chatbubble-outline" value={vars.sessionsThisWeek} label="this week" />
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
    backgroundColor: 'rgba(123,31,162,0.15)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
