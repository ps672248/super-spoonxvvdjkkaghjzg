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

interface MarioCardProps {
  vars: CardVars;
  marioMode?: 'small' | 'super' | 'fire';
}

export const MarioCard = ({ vars, marioMode }: MarioCardProps) => {
  const branch = getBranch(vars.branchId);
  const fomoLine = pickFOMOLine('mario', vars);
  const level = vars.level ?? 1;

  return (
    <CardBase examColor={vars.exam.color} mode="mario" variant={vars.variant ?? 0}>
      <View style={styles.badgeRow}>
        <ModeBadge mode="mario" />
        <ExamBadge exam={vars.exam} branchShort={branch?.shortName} />
      </View>

      <GoldStat
        label="LEVEL CLEARED"
        value={level}
        sublabel={marioMode === 'fire' ? '🔥 Fire Mario achieved' : undefined}
      />

      <FOMOLine text={fomoLine} />

      <StatChipRow>
        <StatChip icon="flame" value={`${vars.streak}d`} label="streak" />
        {vars.combo != null && <StatChip icon="flash-outline" value={vars.combo} label="combo" />}
        <StatChip icon="layers-outline" value={vars.sessionsThisWeek} label="this week" />
      </StatChipRow>

      <CardFooter />
    </CardBase>
  );
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
