import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfigure: () => void;
}

export function ApiKeyModal({ visible, onClose, onConfigure }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.topAccent} />

          <View style={styles.headerRow}>
            <View style={styles.keyIconSquare}>
              <Ionicons name="key" size={24} color={Colors.white} />
            </View>
            <Ionicons name="information-circle-outline" size={28} color={Colors.onSurface} />
          </View>

          <Text style={styles.title}>No Questions Available</Text>
          <Text style={styles.desc}>
            The shared question bank hasn't been seeded for this topic yet.
            Add a Gemini API key to generate fresh AI questions instantly — your key, your quota, no wait.
          </Text>

          <View style={styles.unlockBanner}>
            <View style={styles.sparkleCircle}>
              <Ionicons name="sparkles" size={24} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.unlockTitle}>Unlock AI Generation</Text>
              <Text style={styles.unlockDesc}>Get unlimited fresh questions for any topic, instantly.</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.configureBtn} onPress={onConfigure}>
              <Text style={styles.configureText}>Configure AI Access</Text>
              <Ionicons name="key" size={18} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 6, 102, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    width: '100%',
    padding: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.cardHover,
  },
  topAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 4,
    backgroundColor: Colors.gold,
    width: '35%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  keyIconSquare: {
    width: 48, height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.md },
  desc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  sparkleCircle: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockTitle: { ...Typography.h4, color: Colors.primary },
  unlockDesc: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  footer: { gap: Spacing.md },
  cancelBtn: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  cancelText: { ...Typography.button, color: Colors.primary },
  configureBtn: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.gold,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.button,
  },
  configureText: { ...Typography.button, color: Colors.secondary },
});
