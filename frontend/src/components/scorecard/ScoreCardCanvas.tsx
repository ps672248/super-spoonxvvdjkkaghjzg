import React from 'react';
import { StyleSheet, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { CARD_WIDTH, CARD_HEIGHT } from './shared/CardBase';

interface ScoreCardCanvasProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shotRef: React.RefObject<any>;
  children: React.ReactNode;
}

/**
 * Off-screen wrapper for card capture.
 * Positioned outside viewport so it renders but isn't visible to the user.
 */
export const ScoreCardCanvas = ({ shotRef, children }: ScoreCardCanvasProps) => (
  <View style={styles.offscreen} pointerEvents="none">
    <ViewShot
      ref={shotRef}
      options={{ format: 'png', quality: 1 }}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      {children}
    </ViewShot>
  </View>
);

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },
});
