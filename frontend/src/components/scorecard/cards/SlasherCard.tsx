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

export const SlasherCard = ({ vars }: { vars: CardVars }) => {
  const branch = getBranch(vars.branchId);
  const fomoLine = pickFOMOLine('slasher', vars);
  const total = vars.totalAsked ?? 0;
  const accuracy = total > 0 ? Math.round((vars.score / total) * 100) : 0;

  return (
    <CardBase examColor={vars.exam.color} mode="slasher" variant={vars.variant ?? 0}>
      <View style={styles.badgeRow}>
        <ModeBadge mode="slasher" />
        <ExamBadge exam={vars.exam} branchShort={branch?.shortName} />
      </View>

      <GoldStat
        label="SLASHED"
        value={vars.score}
        sublabel={total > 0 ? `${accuracy}% accuracy · ${total} topics` : undefined}
      />

      <FOMOLine text={fomoLine} />

      <StatChipRow>
        <StatChip icon="flame" value={`${vars.streak}d`} label="streak" />
        <StatChip icon="checkmark-circle-outline" value={`${accuracy}%`} label="accuracy" />
        {vars.combo != null && vars.combo > 1 && (
          <StatChip icon="flash-outline" value={`${vars.combo}x`} label="combo" />
        )}
      </StatChipRow>

      <CardFooter />
    </CardBase>
  );
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
