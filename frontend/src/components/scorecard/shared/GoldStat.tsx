import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GoldStatProps {
  value: string | number;
  label?: string;
  sublabel?: string;
}

export const GoldStat = ({ value, label, sublabel }: GoldStatProps) => (
  <View style={styles.container}>
    {label && <Text style={styles.label}>{label}</Text>}
    <Text style={styles.value}>{value}</Text>
    {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 4,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    color: '#FDC003',
    fontFamily: 'Inter_700Bold',
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: -2,
  },
  sublabel: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
});
