import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SyllabusSlasher } from '@/components/game/SyllabusSlasher';
import { useSyllabusSlasherLogic } from '@/hooks/useSyllabusSlasherLogic';
import { Colors, Typography } from '@/theme';

export default function SlasherScreen() {
  const logic = useSyllabusSlasherLogic();

  if (logic.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>PREPARING DOJO...</Text>
      </View>
    );
  }

  return <SyllabusSlasher logic={logic} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  loadingText: { color: '#FFF', marginTop: 20, fontWeight: 'bold', letterSpacing: 2 },
});
