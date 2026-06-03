import React from 'react';
import { Modal, ModalProps, View, StyleSheet, Platform } from 'react-native';

interface AppModalProps extends Omit<ModalProps, 'transparent' | 'animationType'> {
  children: React.ReactNode;
}

/**
 * Cross-platform modal: native uses RN Modal (proper stacking above nav),
 * web uses absolute overlay (RN Modal is broken on web).
 */
export function AppModal({ visible, children, onRequestClose, ...rest }: AppModalProps) {
  if (!visible) return null;

  if (Platform.OS === 'web') {
    return <View style={styles.webOverlay}>{children}</View>;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
      {...rest}
    >
      {children}
    </Modal>
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9000,
  } as any,
});
