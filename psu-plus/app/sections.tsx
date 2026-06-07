import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useIsWide } from '@/hooks/useColumns';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { getSyllabusTopics } from '@/config/syllabus';

import { AppHeader } from '@/components/AppHeader';

export default function SectionsScreen() {
  const router = useRouter();
  const {
    selectedPSU,
    selectedBranch,
    selectedSections,
    selectedTopics,
    toggleSection,
    toggleTopic,
    setAllSections,
    setAllTopics,
    clearSections,
    clearTopics
  } = useExamStore();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const isWide = useIsWide();

  if (!selectedPSU) { router.replace('/'); return null; }

  const sections = selectedPSU.sections;
  const allSectionIds = sections.map(s => s.id);

  const isAllSectionsSelected = selectedSections.length === allSectionIds.length;

  const handleToggleAllSections = () => {
    if (isAllSectionsSelected) {
      clearSections();
      clearTopics();
    } else {
      setAllSections(allSectionIds);
      // Select all topics for all sections
      const allTopicIds = allSectionIds.flatMap(sid =>
        getSyllabusTopics(sid, selectedBranch?.id).map(t => t.id)
      );
      setAllTopics(allTopicIds);
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const handleTopicToggle = (topicId: string, sectionId: string) => {
    toggleTopic(topicId);
    // If a topic is selected, ensure the section is also in selectedSections
    if (!selectedSections.includes(sectionId)) {
      toggleSection(sectionId);
    }
  };

  const handleSelectAllInSection = (sectionId: string) => {
    const topics = getSyllabusTopics(sectionId, selectedBranch?.id);
    const topicIds = topics.map(t => t.id);
    const allInSelected = topicIds.every(tid => selectedTopics.includes(tid));

    if (allInSelected) {
      // Deselect all in this section
      topicIds.forEach(tid => {
        if (selectedTopics.includes(tid)) toggleTopic(tid);
      });
    } else {
      // Select all in this section
      topicIds.forEach(tid => {
        if (!selectedTopics.includes(tid)) toggleTopic(tid);
      });
      if (!selectedSections.includes(sectionId)) toggleSection(sectionId);
    }
  };

  const canProceed = selectedTopics.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Block */}
        <View style={styles.titleSection}>
          <View style={styles.targetLabel}>
            <Ionicons name="business" size={14} color={Colors.primary} />
            <Text style={styles.targetLabelText}>TARGET SYLLABUS</Text>
          </View>
          <Text style={styles.mainTitle}>{selectedPSU.name} - {selectedBranch?.name ?? 'All Branches'}</Text>
          <Text style={styles.subText}>Select the topics you want to practice. All materials are updated for the 2024 session.</Text>
        </View>

        {/* Curriculum Overview Card */}
        <TouchableOpacity
          style={styles.overviewCard}
          onPress={handleToggleAllSections}
          activeOpacity={0.8}
        >
          <View style={styles.overviewLeft}>
            <Ionicons name="list" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.overviewTitle} numberOfLines={1}>Curriculum Overview</Text>
            </View>
          </View>
          <View style={styles.overviewRight}>
            <View style={[styles.radio, isAllSectionsSelected && styles.radioActive]}>
              {isAllSectionsSelected && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel} numberOfLines={1}>Select All Sections</Text>
          </View>
        </TouchableOpacity>

        {/* Interview Preparation Card */}
        {selectedPSU.hasInterview && (
          <TouchableOpacity
            style={styles.interviewCard}
            onPress={() => router.push('/interview-prep' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.interviewCardLeft}>
              <View style={styles.interviewIconBox}>
                <Ionicons name="mic" size={22} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.interviewTitle}>Interview Preparation</Text>
                <Text style={styles.interviewSub}>{selectedPSU.interviewStages.join(' → ')}</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={18} color={Colors.outline} />
          </TouchableOpacity>
        )}

        {/* Sections List */}
        <View style={[styles.sectionList, isWide && styles.sectionGrid]}>
          {sections.map(section => (
            <SectionAccordion
              key={section.id}
              section={section}
              branchId={selectedBranch?.id}
              isExpanded={expandedSection === section.id}
              onToggle={() => toggleAccordion(section.id)}
              selectedTopics={selectedTopics}
              onTopicToggle={(tid) => handleTopicToggle(tid, section.id)}
              onSelectAll={() => handleSelectAllInSection(section.id)}
              isWide={isWide}
            />
          ))}
        </View>

        {/* PSU Strategy Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipAccent} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>📋 {selectedPSU.name} Strategy</Text>
            <Text style={styles.tipText}>{selectedPSU.tipText}</Text>
            {selectedBranch && selectedPSU.prepTips?.[selectedBranch.id] && (
              <Text style={[styles.tipText, { marginTop: 6, fontFamily: 'Inter_600SemiBold' }]}>
                {selectedBranch.shortName}: {selectedPSU.prepTips[selectedBranch.id]}
              </Text>
            )}
          </View>
        </View>

        {/* Branch Prep Tips */}
        {selectedBranch?.generalTip && (
          <View style={[styles.tipCard, { marginTop: Spacing.sm }]}>
            <View style={[styles.tipAccent, { backgroundColor: Colors.gold }]} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: '#7B5800' }]}>🎯 {selectedBranch.name} Prep</Text>
              <Text style={styles.tipText}>{selectedBranch.generalTip}</Text>
              {selectedBranch.coreSubjects.length > 0 && (
                <View style={styles.coreRow}>
                  <Text style={styles.coreLabel}>CORE: </Text>
                  {selectedBranch.coreSubjects.map((s, i) => (
                    <View key={i} style={styles.coreTag}>
                      <Text style={styles.coreTagText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedBtn, !canProceed && styles.disabledBtn]}
          onPress={() => canProceed && router.push('/game-mode')}
          activeOpacity={0.8}
        >
          <Text style={styles.proceedBtnText}>Proceed to Practice</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SectionAccordion({
  section,
  branchId,
  isExpanded,
  onToggle,
  selectedTopics,
  onTopicToggle,
  onSelectAll,
  isWide,
}: any) {
  const topics = getSyllabusTopics(section.id, branchId);
  const selectedCount = topics.filter(t => selectedTopics.includes(t.id)).length;
  const isAllSelected = selectedCount === topics.length && topics.length > 0;

  return (
    <View style={[styles.accordionContainer, isWide && styles.accordionGridItem]}>
      <TouchableOpacity
        style={[styles.accordionHeader, isExpanded && styles.accordionHeaderActive]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Ionicons name={section.icon as any} size={24} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accordionTitle} numberOfLines={1}>{section.name}</Text>
            <Text style={styles.accordionSub} numberOfLines={1}>{topics.length} Topics • {section.description}</Text>
          </View>
        </View>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.outline} />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.accordionContent}>
          {section.studyTip && (
            <View style={styles.studyTipBanner}>
              <Ionicons name="bulb-outline" size={14} color="#7B5800" style={{ marginTop: 1 }} />
              <Text style={styles.studyTipText}>{section.studyTip}</Text>
            </View>
          )}
          <View style={styles.subHeader}>
            <Text style={styles.subHeaderText}>SUB-TOPICS</Text>
            <TouchableOpacity onPress={onSelectAll} style={styles.selectAllBtn}>
              <Ionicons
                name={isAllSelected ? "checkmark-done-circle" : "checkmark-circle-outline"}
                size={16}
                color={isAllSelected ? Colors.success : Colors.outline}
              />
              <Text style={[styles.selectAllText, isAllSelected && { color: Colors.success }]}>Select All</Text>
            </TouchableOpacity>
          </View>

          <View style={isWide ? styles.topicsGrid : undefined}>
            {topics.map(topic => {
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.topicRow, isWide && styles.topicRowGrid]}
                  onPress={() => onTopicToggle(topic.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                  </View>
                  <Text style={[styles.topicText, isSelected && styles.topicTextActive]}>{topic.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
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
    borderBottomColor: '#F0F2F5',
  },
  headerLogo: { ...Typography.h3, color: Colors.primary, fontFamily: 'Inter_700Bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1 },
  profileBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileInitial: { color: Colors.primary, fontFamily: 'Inter_700Bold', fontSize: 14 },
  profileName: { ...Typography.bodySm, color: Colors.onSurfaceVariant, fontFamily: 'Inter_600SemiBold', flexShrink: 1 },

  container: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing.lg },

  titleSection: { marginBottom: Spacing.md },
  targetLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  targetLabelText: { ...Typography.labelCaps, color: Colors.primary, fontSize: 10 },
  mainTitle: { ...Typography.h1, color: Colors.primary, fontSize: 32, lineHeight: 38 },
  subText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginTop: Spacing.sm, lineHeight: 22 },

  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    gap: Spacing.md,
  },
  overviewLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, minWidth: 0 },
  overviewTitle: { ...Typography.h3, color: Colors.primary, flexShrink: 1 },
  overviewRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1, minWidth: 0 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  radioLabel: { ...Typography.bodySm, color: Colors.onSurfaceVariant, fontFamily: 'Inter_600SemiBold', flexShrink: 1 },

  sectionList: { gap: Spacing.lg },
  sectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, alignItems: 'flex-start' },
  accordionGridItem: { flexGrow: 1, flexBasis: '48%', maxWidth: '100%' },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  accordionContainer: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    paddingLeft: 10,
    paddingRight: 10
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderTopWidth: 4,
    borderTopColor: Colors.gold,
  },
  accordionHeaderActive: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  accordionTitle: { ...Typography.h3, color: Colors.onSurface },
  accordionSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },

  accordionContent: { padding: Spacing.lg, backgroundColor: '#FAFBFC' },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  subHeaderText: { ...Typography.labelCaps, color: Colors.outline, fontSize: 10 },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectAllText: { ...Typography.bodySm, color: Colors.outline, fontFamily: 'Inter_600SemiBold' },

  topicRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  topicRowGrid: { width: '48%' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  topicText: { ...Typography.bodyMd, color: Colors.onSurface },
  topicTextActive: { fontFamily: 'Inter_600SemiBold' },

  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F6FF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: Spacing.lg
  },
  tipAccent: { width: 6, backgroundColor: Colors.primary },
  tipContent: { padding: Spacing.lg, flex: 1 },
  tipTitle: { ...Typography.h4, color: Colors.primary },
  tipText: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 4, lineHeight: 20 },
  studyTipBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#FFF8E1', borderRadius: Radius.sm, padding: Spacing.sm,
    marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.gold,
  },
  studyTipText: { ...Typography.bodySm, color: '#7B5800', lineHeight: 18, flex: 1 },
  coreRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 8, gap: 4 },
  coreLabel: { ...Typography.labelCaps, color: Colors.outline, fontSize: 9 },
  coreTag: { backgroundColor: '#FFF8E1', borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.gold },
  coreTagText: { ...Typography.bodySm, fontSize: 10, color: '#7B5800', fontFamily: 'Inter_600SemiBold' },

  interviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF1FF',
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...Shadows.card,
  },
  interviewCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  interviewIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interviewTitle: { ...Typography.h4, color: Colors.primary },
  interviewSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },

  footer: { padding: Spacing.xl, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.gold,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    ...Shadows.button,
  },
  disabledBtn: { opacity: 0.5 },
  proceedBtnText: { ...Typography.button, color: Colors.white, fontSize: 18 },
});
