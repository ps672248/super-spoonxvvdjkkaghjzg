import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useInterviewStore } from '@/stores/interviewStore';
export default function InterviewPrepScreen() {
  const router = useRouter();
  const { selectedPSU, selectedBranch } = useExamStore();
  const { geminiApiKey, userIntroduction } = useSettingsStore();
  const { techSummary, clearSession } = useInterviewStore();

  if (!selectedPSU || !selectedPSU.hasInterview) {
    router.replace('/');
    return null;
  }

  const hasApiKey = !!geminiApiKey;
  const hasIntro = !!userIntroduction.trim();
  const stages = selectedPSU.interviewStages;
  const hasGD = stages.includes('GD');
  const hasTech = stages.includes('Technical PI');
  const hasHR = stages.includes('HR PI');

  const handleStart = (mode: 'gd' | 'technical' | 'hr') => {
    if (!hasApiKey) return;
    if (!hasIntro) {
      router.push('/(tabs)/settings');
      return;
    }
    clearSession();
    router.push({ pathname: '/interview-mock', params: { mode } } as any);
  };

  const handleStartHR = () => {
    if (!hasApiKey) return;
    if (!hasIntro) {
      router.push('/(tabs)/settings' as any);
      return;
    }
    // Don't clear session — preserve techSummary if coming from tech PI
    router.push({ pathname: '/interview-mock', params: { mode: 'hr' } } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interview Preparation</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={styles.titleBlock}>
          <View style={styles.psuRow}>
            <Text style={styles.psuName}>{selectedPSU.fullName}</Text>
          </View>
          {selectedBranch && (
            <Text style={styles.branchName}>{selectedBranch.name}</Text>
          )}
          <View style={styles.stageChips}>
            {stages.map((stage, i) => (
              <React.Fragment key={stage}>
                <View style={styles.stageChip}>
                  <Text style={styles.stageChipText}>{stage}</Text>
                </View>
                {i < stages.length - 1 && (
                  <Ionicons name="arrow-forward" size={14} color={Colors.outline} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Interview Tip */}
        {selectedPSU.interviewTip && (
          <View style={styles.tipCard}>
            <View style={styles.tipAccent} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>💡 Strategy for {selectedPSU.name}</Text>
              <Text style={styles.tipText}>{selectedPSU.interviewTip}</Text>
            </View>
          </View>
        )}

        {/* No API Key warning */}
        {!hasApiKey && (
          <TouchableOpacity
            style={styles.warningCard}
            onPress={() => router.push('/api-setup')}
            activeOpacity={0.8}
          >
            <Ionicons name="key-outline" size={20} color="#B45309" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Gemini API Key Required</Text>
              <Text style={styles.warningText}>All interview simulations use AI. Tap to set up your key.</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#B45309" />
          </TouchableOpacity>
        )}

        {/* No Intro warning */}
        {!hasIntro && (
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileTitle}>Set Up Your Career Profile</Text>
              <Text style={styles.profileText}>Add your introduction so the AI can personalise your interview. Tap to go to Settings → Career Profile.</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.outline} />
          </TouchableOpacity>
        )}

        {/* GD Section */}
        {hasGD && (
          <View style={styles.stageCard}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageIconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="people" size={22} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stageTitle}>Group Discussion</Text>
                <Text style={styles.stageSub}>AI-orchestrated simulation with 3 virtual participants</Text>
              </View>
            </View>
            <Text style={styles.stageDesc}>
              Gemini generates a PSU-relevant topic and runs a structured GD with virtual candidates Aisha, Rahul, and Dev.
              You participate in opening, discussion, and conclusion rounds. Evaluated on 5 dimensions.
            </Text>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: '#2E7D32' }, (!hasApiKey || !hasIntro) && styles.startBtnDisabled]}
              onPress={() => handleStart('gd')}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={18} color={Colors.white} />
              <Text style={styles.startBtnText}>Start GD Simulation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Technical PI Section */}
        {hasTech && (
          <View style={styles.stageCard}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageIconBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="code-slash" size={22} color="#1565C0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stageTitle}>Technical Interview</Text>
                <Text style={styles.stageSub}>
                  Personalised to your profile{selectedBranch ? ` · ${selectedBranch.name}` : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.stageDesc}>
              AI interviewer asks 8–10 questions based on your introduction and branch.
              Difficulty adapts to your answers. PSU-specific questions included. Full evaluation at end.
            </Text>
            {selectedBranch && (
              <View style={styles.subjectChips}>
                <Text style={styles.subjectChipsLabel}>COVERS: </Text>
                {selectedBranch.coreSubjects.map((s, i) => (
                  <View key={i} style={styles.subjectChip}>
                    <Text style={styles.subjectChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: '#1565C0' }, (!hasApiKey || !hasIntro) && styles.startBtnDisabled]}
              onPress={() => handleStart('technical')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={18} color={Colors.white} />
              <Text style={styles.startBtnText}>Start Technical Mock</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* HR PI Section */}
        {hasHR && (
          <View style={styles.stageCard}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageIconBox, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="briefcase" size={22} color="#E65100" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stageTitle}>HR Interview</Text>
                <Text style={styles.stageSub}>Motivation, leadership, {selectedPSU.name} fit</Text>
              </View>
            </View>
            <Text style={styles.stageDesc}>
              Fully AI-powered HR round. Covers motivation, teamwork, career goals, and {selectedPSU.name} knowledge.
              If you completed the technical round, the HR interviewer will reference that performance.
            </Text>
            {techSummary ? (
              <View style={styles.techMemoryBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                <Text style={styles.techMemoryText}>Tech PI summary available — HR round will be personalised</Text>
              </View>
            ) : (
              <View style={styles.techMemoryBadgeEmpty}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.outline} />
                <Text style={styles.techMemoryTextEmpty}>Complete Tech PI first for a connected experience (optional)</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: '#E65100' }, (!hasApiKey || !hasIntro) && styles.startBtnDisabled]}
              onPress={handleStartHR}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.white} />
              <Text style={styles.startBtnText}>Start HR Mock</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.onSurface, flex: 1, textAlign: 'center' },
  scrollContent: { padding: Spacing.xl, gap: Spacing.lg },

  titleBlock: { gap: Spacing.sm },
  psuRow: { flexDirection: 'row', alignItems: 'center' },
  psuName: { ...Typography.h2, color: Colors.onSurface },
  branchName: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  stageChips: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
  stageChip: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  stageChipText: { ...Typography.bodySm, color: Colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 },

  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#1a237e',
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  tipAccent: { width: 6, backgroundColor: Colors.gold },
  tipContent: { padding: Spacing.lg, flex: 1 },
  tipTitle: { ...Typography.h4, color: '#FFF' },
  tipText: { ...Typography.bodySm, color: '#C5CAE9', marginTop: 6, lineHeight: 20 },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...Shadows.card,
  },
  warningTitle: { ...Typography.h4, color: '#92400E' },
  warningText: { ...Typography.bodySm, color: '#B45309', marginTop: 2 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Shadows.card,
  },
  profileTitle: { ...Typography.h4, color: Colors.primary },
  profileText: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2, lineHeight: 18 },

  stageCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  stageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stageIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stageTitle: { ...Typography.h3, color: Colors.onSurface },
  stageSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  stageDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, lineHeight: 22 },

  subjectChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  subjectChipsLabel: { ...Typography.labelCaps, color: Colors.outline, fontSize: 9 },
  subjectChip: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  subjectChipText: { ...Typography.bodySm, fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  techMemoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  techMemoryText: { ...Typography.bodySm, color: '#2E7D32', lineHeight: 16 },
  techMemoryBadgeEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  techMemoryTextEmpty: { ...Typography.bodySm, color: Colors.outline, lineHeight: 16 },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    ...Shadows.button,
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { ...Typography.button, color: Colors.white, fontSize: 15 },
});
