import React from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD_WIDTH, CARD_HEIGHT } from './shared/CardBase';
import { useScoreCard } from './useScoreCard';
import { ScoreCardCanvas } from './ScoreCardCanvas';

interface ScoreCardSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const ScoreCardSheet = ({ visible, onClose, children }: ScoreCardSheetProps) => {
  const { ref, capturing, share, saveToGallery } = useScoreCard();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Score Card</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          {/* Preview — full card scaled down to fit bottom sheet */}
          <View style={styles.previewWrapper}>
            <View style={styles.previewInner}>
              {children}
            </View>
          </View>

          {/* Off-screen capture target */}
          <ScoreCardCanvas shotRef={ref}>
            {children}
          </ScoreCardCanvas>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={share}
              disabled={capturing}
            >
              {capturing
                ? <ActivityIndicator color="#000666" size="small" />
                : <Ionicons name="share-outline" size={20} color="#000666" />
              }
              <Text style={styles.btnPrimaryText}>Share</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnSecondary]}
              onPress={saveToGallery}
              disabled={capturing}
            >
              <Ionicons name="download-outline" size={20} color="rgba(255,255,255,0.85)" />
              <Text style={styles.btnSecondaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0D1240',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter_700Bold',
  },
  previewContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  previewWrapper: {
    height: CARD_HEIGHT * 0.6,
    overflow: 'hidden',
    borderRadius: 14,
    alignSelf: 'center',
    width: CARD_WIDTH * 0.6,
  },
  previewInner: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    // scale from top-left: translate by -(dim*(1-scale)/2) before scaling
    transform: [
      { translateX: -(CARD_WIDTH * 0.4 / 2) },
      { translateY: -(CARD_HEIGHT * 0.4 / 2) },
      { scale: 0.6 },
    ],
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnPrimary: {
    backgroundColor: '#FDC003',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  btnPrimaryText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#000666',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.85)',
  },
});
