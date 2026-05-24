import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore, GameMode } from '@/stores/examStore';
import { useSettingsStore } from '@/stores/settingsStore';

const GAME_MODES: {
  id: GameMode;
  title: string;
  desc: string;
  icon: string;
  accent: string;
  bg?: string;
  showHearts?: boolean;
}[] = [
    {
      id: 'mcq',
      title: 'Classic MCQ',
      desc: 'The cornerstone of preparation. Timed sets with detailed analytical feedback for every wrong attempt.',
      icon: 'document-text',
      accent: Colors.gold,
    },
    {
      id: 'survival',
      title: 'Survival',
      desc: '3 lives. High pressure. The questions get harder as you progress. How long can you last?',
      icon: 'stopwatch',
      accent: Colors.error,
      showHearts: true,
    },
    {
      id: 'match',
      title: 'Match the Following',
      desc: 'Master concepts by connecting definitions, formulas, and units in an interactive grid.',
      icon: 'grid',
      accent: Colors.gold,
    },
    {
      id: 'slasher',
      title: 'Syllabus Slasher',
      desc: 'Slice through topics in a high-speed 3D Dojo. Defuse academic bombs with quick-fire questions!',
      icon: 'flash',
      accent: '#FF4D4D',
    },
    {
      id: 'mario',
      title: 'Super Mario Mode',
      desc: 'A classic platformer experience where you clear levels by answering engineering questions.',
      icon: 'game-controller',
      accent: '#1A237E',
    },
  ];

import { AppHeader } from '@/components/AppHeader';

export default function GameModeScreen() {
  const router = useRouter();
  const { selectedPSU, setMode, questionCount, setQuestionCount } = useExamStore();
  const { geminiApiKey } = useSettingsStore();
  const [showApiModal, setShowApiModal] = React.useState(false);

  if (!selectedPSU) { router.replace('/'); return null; }

  const handleSelect = (mode: GameMode) => {
    if (!geminiApiKey) {
      setShowApiModal(true);
      return;
    }
    setMode(mode);
    router.push(`/play/${mode}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Difficulty Badge & Title */}
        <View style={styles.titleSection}>
          <View style={styles.diffBadge}>
            <Ionicons name="settings" size={12} color={Colors.secondary} />
            <Text style={styles.diffText}>MODERATE DIFFICULTY • {selectedPSU.name}</Text>
          </View>
          <Text style={styles.mainTitle}>Choose Your{"\n"}Practice Mode</Text>
          <Text style={styles.subText}>
            Select a specialized study environment to sharpen your technical skills and conceptual clarity through gamified challenges.
          </Text>
        </View>

        {/* Question Count Slider */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Ionicons name="list" size={18} color={Colors.primary} />
            <Text style={styles.sliderTitle}>Questions per Session</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{questionCount}</Text>
            </View>
          </View>
          <View style={styles.sliderRow}>
            {[5, 10, 15, 20].map((val) => (
              <TouchableOpacity 
                key={val} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setQuestionCount(val);
                }}
                style={[styles.sliderOption, questionCount === val && styles.sliderOptionSelected]}
                activeOpacity={0.7}
              >
                <Text style={[styles.sliderOptionText, questionCount === val && styles.sliderOptionTextSelected]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sliderTrack}>
             <View style={[styles.sliderProgress, { width: `${((questionCount - 5) / 15) * 100}%` }]} />
          </View>
        </View>

        {/* Mode Cards */}
        <View style={styles.modeList}>
          {GAME_MODES.map((mode) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              onPress={() => handleSelect(mode.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* API Key Modal */}
      <ApiKeyModal 
        visible={showApiModal} 
        onClose={() => setShowApiModal(false)}
        onGoToSettings={() => {
          setShowApiModal(false);
          router.push('/api-setup');
        }}
      />
    </SafeAreaView>
  );
}

function ModeCard({ mode, onPress }: { mode: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.cardAccent, { backgroundColor: mode.accent }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: mode.accent + '15' }]}>
            <Ionicons name={mode.icon as any} size={24} color={mode.accent} />
          </View>
          {mode.id === 'mcq' && (
            <View style={styles.goalBadge}>
              <Text style={styles.goalText}>PRACTICE GOAL: 100%</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{mode.title}</Text>
        <Text style={styles.cardDesc}>{mode.desc}</Text>

        <View style={styles.cardFooter}>
          {mode.showHearts && (
            <View style={styles.heartsRow}>
              <Ionicons name="heart" size={18} color={Colors.error} />
              <Ionicons name="heart" size={18} color={Colors.error} />
              <Ionicons name="heart" size={18} color={Colors.error} />
            </View>
          )}

          {mode.bg && (
            <Image source={{ uri: mode.bg }} style={styles.stadiumImg} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ApiKeyModal({ visible, onClose, onGoToSettings }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalTopAccent} />
          
          <View style={styles.modalHeaderRow}>
            <View style={styles.keyIconSquare}>
              <Ionicons name="key" size={24} color={Colors.white} />
            </View>
            <Ionicons name="information-circle-outline" size={28} color={Colors.onSurface} />
          </View>

          <Text style={styles.modalTitle}>API Key Required</Text>
          <Text style={styles.modalDesc}>
            To generate personalized practice questions and syllabus-specific study guides, an active Gemini API key is required. This ensures high-quality AI assistance tailored to your PSU curriculum.
          </Text>

          <View style={styles.unlockBanner}>
            <View style={styles.sparkleCircle}>
              <Ionicons name="sparkles" size={24} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.unlockTitle}>Unlock AI Generation</Text>
              <Text style={styles.unlockDesc}>Activate features like "Explain Concept" and "Custom Quiz".</Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSettingsBtn} onPress={onGoToSettings}>
              <Text style={styles.modalSettingsText}>Configure AI Access</Text>
              <Ionicons name="key" size={18} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5'
  },
  headerLogo: { ...Typography.h3, color: Colors.primary, fontFamily: 'Inter_700Bold' },

  container: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },

  titleSection: { marginBottom: Spacing.lg },

  // Slider Styles
  sliderSection: { 
    backgroundColor: '#FFF', 
    borderRadius: Radius.md, 
    padding: Spacing.lg, 
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    ...Shadows.card
  },
  sliderHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  sliderTitle: { ...Typography.h4, color: Colors.primary, flex: 1 },
  countBadge: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  countBadgeText: { ...Typography.labelCaps, color: Colors.white, fontSize: 10 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  sliderOption: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#F8F9FB', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E6E8EB'
  },
  sliderOptionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sliderOptionText: { ...Typography.h4, color: Colors.onSurfaceVariant },
  sliderOptionTextSelected: { color: Colors.white },
  sliderTrack: { height: 4, backgroundColor: '#F0F2F5', borderRadius: 2, marginHorizontal: Spacing.xs },
  sliderProgress: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md
  },
  diffText: {
    ...Typography.labelCaps,
    color: Colors.secondary,
    fontSize: 9
  },
  mainTitle: {
    ...Typography.h1,
    color: Colors.primary,
    fontSize: 32,
    lineHeight: 38
  },
  subText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.sm,
    lineHeight: 22
  },

  modeList: { gap: Spacing.xl },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  cardAccent: { height: 4, width: '40%' },
  cardInner: { padding: Spacing.lg },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  goalBadge: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm
  },
  goalText: { ...Typography.labelCaps, fontSize: 8, color: Colors.outline },

  cardTitle: {
    ...Typography.h2,
    color: Colors.primary,
    fontSize: 24,
    marginBottom: 4
  },
  cardDesc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 22
  },

  cardFooter: { marginTop: Spacing.lg },
  heartsRow: { flexDirection: 'row', gap: 4 },
  stadiumImg: {
    width: '100%',
    height: 120,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    resizeMode: 'cover'
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 6, 102, 0.4)', // Dimmed navy
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    width: '100%',
    padding: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.cardHover
  },
  modalTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.gold,
    width: '35%'
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg
  },
  keyIconSquare: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.md
  },
  modalDesc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 24,
    marginBottom: Spacing.xl
  },
  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginBottom: Spacing.xxl
  },
  sparkleCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  unlockTitle: {
    ...Typography.h4,
    color: Colors.primary
  },
  unlockDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2
  },
  modalFooter: {
    gap: Spacing.md
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center'
  },
  modalCancelText: {
    ...Typography.button,
    color: Colors.primary
  },
  modalSettingsBtn: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.gold,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.button
  },
  modalSettingsText: {
    ...Typography.button,
    color: Colors.secondary
  }
});
