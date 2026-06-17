import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CardBase } from '../shared/CardBase';
import { CardFooter } from '../shared/CardFooter';
import { ModeBadge } from '../shared/ModeBadge';
import { ExamBadge } from '../shared/ExamBadge';
import { GoldStat } from '../shared/GoldStat';
import { FOMOLine } from '../shared/FOMOLine';
import { StatChip, StatChipRow } from '../shared/StatChip';
import { pickFOMOLine } from '../../../config/scorecard-templates';
import type { CardVars } from '../../../config/scorecard-templates';
import { getBranch } from '../../../config/branches';

interface SurvivalCardProps {
  vars: CardVars;
}

export const SurvivalCard = ({ vars }: SurvivalCardProps) => {
  const branch = getBranch(vars.branchId);
  const fomoLine = pickFOMOLine('survival', vars);
  const round = vars.round ?? vars.score;

  return (
    <CardBase examColor={vars.exam.color} mode="survival" variant={vars.variant ?? 0}>
      <View style={styles.badgeRow}>
        <ModeBadge mode="survival" />
        <ExamBadge exam={vars.exam} branchShort={branch?.shortName} />
      </View>

      <GoldStat
        label="SURVIVED"
        value={`Round ${round}`}
        sublabel={vars.percentile ? `Top ${vars.percentile}% today` : undefined}
      />

      <FOMOLine text={fomoLine} />

      <StatChipRow>
        <StatChip icon="flame" value={`${vars.streak}d`} label="streak" />
        <StatChip icon="layers-outline" value={vars.sessionsThisWeek} label="this week" />
        {vars.rank && <StatChip icon="trophy-outline" value={`#${vars.rank}`} label="rank" />}
      </StatChipRow>

      <CardFooter />
    </CardBase>
  );
};

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
