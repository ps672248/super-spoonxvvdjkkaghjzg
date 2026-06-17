import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfirmStore } from '@/stores/confirmStore';
import { Colors, Typography, Radius, Spacing, Shadows } from '@/theme';

export function ConfirmModal() {
  const { visible, options, confirm, cancel } = useConfirmStore();
  if (!visible || !options) return null;

  const isAlert = !options.cancelText;

  const content = (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconRow}>
          <View style={[styles.iconCircle, isAlert && styles.iconCircleAlert]}>
            <Ionicons
              name={isAlert ? 'information-circle-outline' : 'alert-circle-outline'}
              size={28}
              color={isAlert ? Colors.warning : Colors.primary}
            />
          </View>
        </View>

        <Text style={styles.title}>{options.title}</Text>
        <Text style={styles.message}>{options.message}</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={confirm} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{options.confirmText}</Text>
        </TouchableOpacity>

        {!isAlert && (
          <TouchableOpacity style={styles.cancelBtn} onPress={cancel} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>{options.cancelText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return <View style={styles.webRoot}>{content}</View>;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={cancel}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Web: absolute overlay covering full screen with high zIndex
  webRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  } as any,
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.60)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
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
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleAlert: {
    backgroundColor: Colors.warningContainer,
    borderColor: Colors.warning,
  },
  title: {
    ...Typography.h3,
    color: Colors.onSurface,
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
    color: Colors.onPrimary,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  cancelBtnText: {
    ...Typography.bodyMd,
    color: Colors.error,
    fontFamily: 'Inter_600SemiBold',
  },
});
