import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GameMode } from '../../../config/scorecard-templates';
import { MODE_META } from '../../../config/scorecard-templates';
import { modeBadgeText } from './themes';

interface ModeBadgeProps {
  mode: GameMode;
}

export const ModeBadge = ({ mode }: ModeBadgeProps) => {
  const meta = MODE_META[mode];
  const textColor = modeBadgeText(mode);

  return (
    <View style={[styles.badge, { backgroundColor: meta.color + '20', borderColor: meta.color + '55' }]}>
      <Text style={styles.icon}>{meta.icon}</Text>
      <Text style={[styles.label, { color: textColor }]}>
        {meta.label}
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
    letterSpacing: 1.2,
  },
});
