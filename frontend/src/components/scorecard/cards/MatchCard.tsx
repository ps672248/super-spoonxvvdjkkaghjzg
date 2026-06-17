import React from 'react';
import { View, StyleSheet } from 'react-native';
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

export const MatchCard = ({ vars }: { vars: CardVars }) => {
  const branch = getBranch(vars.branchId);
  const fomoLine = pickFOMOLine('match', vars);
  const total = vars.totalAsked ?? 8;
  const accuracy = total > 0 ? Math.round((vars.score / total) * 100) : 0;

  return (
    <CardBase examColor={vars.exam.color} mode="match" variant={vars.variant ?? 0}>
      <View style={styles.badgeRow}>
        <ModeBadge mode="match" />
        <ExamBadge exam={vars.exam} branchShort={branch?.shortName} />
      </View>

      <GoldStat
        label="MATCHED"
        value={`${vars.score}/${total}`}
        sublabel={`${accuracy}% accuracy`}
      />

      <FOMOLine text={fomoLine} />

      <StatChipRow>
        <StatChip icon="flame" value={`${vars.streak}d`} label="streak" />
        <StatChip icon="layers-outline" value={vars.sessionsThisWeek} label="this week" />
      </StatChipRow>

      <CardFooter />
    </CardBase>
  );
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
