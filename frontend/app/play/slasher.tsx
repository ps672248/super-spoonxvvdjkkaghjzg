import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SyllabusSlasher } from '@/components/game/SyllabusSlasher';
import { useSyllabusSlasherLogic } from '@/hooks/useSyllabusSlasherLogic';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { Colors, Typography } from '@/theme';

export default function SlasherScreen() {
  const logic = useSyllabusSlasherLogic();
  const router = useRouter();
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    if (!logic.loading && logic.needsApiKey) setShowApiModal(true);
  }, [logic.loading, logic.needsApiKey]);

  if (logic.loading || logic.needsApiKey) {
    return (
      <View style={styles.center}>
        {logic.loading && (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>PREPARING DOJO...</Text>
          </>
        )}
        <ApiKeyModal
          visible={showApiModal}
          onClose={() => { setShowApiModal(false); router.back(); }}
          onConfigure={() => router.replace('/api-setup' as any)}
        />
      </View>
    );
  }

  return (
    <SyllabusSlasher
      logic={logic}
      onRestart={() => router.replace('/play/slasher')}
      onHome={() => router.replace('/')}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  loadingText: { color: '#FFF', marginTop: 20, fontWeight: 'bold', letterSpacing: 2 },
});
