import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ExamConfig } from '../../../config/psus';
import { isLightColor } from './themes';

interface ExamBadgeProps {
  exam: ExamConfig;
  branchShort?: string;
}

export const ExamBadge = ({ exam, branchShort }: ExamBadgeProps) => {
  // Cards have dark backgrounds. Light exam colors (yellow, gold) are readable directly.
  // Dark exam colors (navy, deep red) would be invisible — use white instead.
  const light = isLightColor(exam.color);
  const textColor = light ? exam.color : 'rgba(255,255,255,0.92)';

  return (
    <View style={[styles.badge, { backgroundColor: exam.color + '22', borderColor: exam.color + '55' }]}>
      <Text style={styles.icon}>{exam.icon}</Text>
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {exam.name}{branchShort ? ` · ${branchShort}` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 11,
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
