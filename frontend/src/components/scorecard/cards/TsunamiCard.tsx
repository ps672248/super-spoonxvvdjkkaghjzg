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

export const TsunamiCard = ({ vars }: { vars: CardVars }) => {
  const branch = getBranch(vars.branchId);
  const fomoLine = pickFOMOLine('tsunami', vars);
  const bestCombo = vars.bestCombo ?? 0;
  const correct = vars.score;
  const total = vars.totalAsked ?? 0;

  return (
    <CardBase examColor={vars.exam.color} mode="tsunami" variant={vars.variant ?? 0}>
      <View style={styles.badgeRow}>
        <ModeBadge mode="tsunami" />
        <ExamBadge exam={vars.exam} branchShort={branch?.shortName} />
      </View>

      <GoldStat
        label="BEST COMBO"
        value={`${bestCombo}x`}
        sublabel={total > 0 ? `${correct}/${total} statements correct` : `${correct} correct`}
      />

      <FOMOLine text={fomoLine} />

      <StatChipRow>
        <StatChip icon="flame" value={`${vars.streak}d`} label="streak" />
        <StatChip icon="flash-outline" value={`${bestCombo}x`} label="best combo" />
        <StatChip icon="layers-outline" value={vars.sessionsThisWeek} label="this week" />
      </StatChipRow>

      <CardFooter />
    </CardBase>
  );
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
