import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfirmStore } from '@/stores/confirmStore';
import { Colors, Typography, Radius, Spacing, Shadows } from '@/theme';

export function ConfirmModal() {
  const { visible, options, confirm, cancel } = useConfirmStore();
  if (!options) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-upload-outline" size={28} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>{options.title}</Text>
          <Text style={styles.message}>{options.message}</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={confirm}>
            <Text style={styles.primaryBtnText}>{options.confirmText}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={cancel}>
            <Text style={styles.cancelBtnText}>{options.cancelText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    ...Shadows.cardHover,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h3,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.button,
  },
  primaryBtnText: {
    ...Typography.button,
    color: Colors.white,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...Typography.bodyMd,
    color: Colors.error,
    fontFamily: 'Inter_600SemiBold',
  },
});
