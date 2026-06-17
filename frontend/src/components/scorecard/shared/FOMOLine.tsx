import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FOMOLineProps {
  text: string;
}

export const FOMOLine = ({ text }: FOMOLineProps) => (
  <View style={styles.container}>
    <View style={styles.divider} />
    <Text style={styles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: '#FDC003',
    borderRadius: 1,
    marginBottom: 12,
  },
  text: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
});
