import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}

export const StatChip = ({ icon, value, label }: StatChipProps) => (
  <View style={styles.chip}>
    <Ionicons name={icon} size={13} color="rgba(255,255,255,0.5)" />
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

export const StatChipRow = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.row}>{children}</View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  value: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
});
