import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ExamConfig } from '../../../config/psus';
import { isLightColor } from './themes';

interface ExamBadgeProps {
  exam: ExamConfig;
  branchShort?: string;
}

export const ExamBadge = ({ exam, branchShort }: ExamBadgeProps) => {
  // If exam.color is bright (e.g. yellow/light orange), white text won't work.
  // Use a muted light version instead, keeping bg tint.
  const light = isLightColor(exam.color);
  const textColor = light ? 'rgba(255,255,255,0.75)' : exam.color;

  return (
    <View style={[styles.badge, { backgroundColor: exam.color + '22', borderColor: exam.color + '50' }]}>
      <Text style={styles.icon}>{exam.icon}</Text>
      <Text style={[styles.label, { color: textColor }]}>
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
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
