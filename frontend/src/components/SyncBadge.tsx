import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/theme';

/**
 * Tiny "syncing…" indicator — a slowly spinning sync icon + optional label.
 * Shown while local data is already on screen and a background cloud sync runs,
 * so the user never sees a blocking spinner or a false "no data" state.
 */
export function SyncBadge({ visible, label = 'Syncing' }: { visible: boolean; label?: string }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [visible]);

  if (!visible) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="sync" size={13} color={Colors.outline} />
      </Animated.View>
      {!!label && <Text style={styles.txt}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  txt: { ...Typography.labelCaps, fontSize: 9, color: Colors.outline },
});
