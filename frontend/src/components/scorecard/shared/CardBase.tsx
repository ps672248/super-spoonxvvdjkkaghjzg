import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { GameMode } from '../../../config/scorecard-templates';
import { MODE_THEMES, type CardVariant } from './themes';

export const CARD_WIDTH = 360;
export const CARD_HEIGHT = 640;

interface CardBaseProps {
  examColor: string;
  mode: GameMode;
  variant?: CardVariant;
  children: React.ReactNode;
}

export const CardBase = ({ examColor, mode, variant = 0, children }: CardBaseProps) => {
  const theme = MODE_THEMES[mode];
  const colors = theme.gradients[variant] as [string, string, string];
  const { start, end } = theme.directions[variant];

  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={styles.container}
    >
      {/* Left accent strip — exam brand color */}
      <View style={[styles.accentStrip, { backgroundColor: examColor }]} />

      {/* Mode-tinted glow circle for depth */}
      <View style={[styles.glowCircle, { backgroundColor: theme.glow }]} />

      {/* Secondary smaller circle bottom-left */}
      <View style={[styles.glowCircle2, { backgroundColor: theme.glow }]} />

      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  glowCircle: {
    position: 'absolute',
    top: -CARD_HEIGHT * 0.28,
    right: -CARD_WIDTH * 0.28,
    width: CARD_WIDTH * 0.75,
    height: CARD_WIDTH * 0.75,
    borderRadius: CARD_WIDTH * 0.375,
  },
  glowCircle2: {
    position: 'absolute',
    bottom: -CARD_WIDTH * 0.2,
    left: -CARD_WIDTH * 0.1,
    width: CARD_WIDTH * 0.5,
    height: CARD_WIDTH * 0.5,
    borderRadius: CARD_WIDTH * 0.25,
  },
  content: {
    flex: 1,
    paddingLeft: 24,
    paddingRight: 20,
    paddingTop: 28,
    paddingBottom: 20,
  },
});
