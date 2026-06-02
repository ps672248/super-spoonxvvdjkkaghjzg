import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { getSyllabusTopics, Topic } from '@/config/syllabus';
import { generateStudySheet } from '@/services/gemini';
import { AppHeader } from '@/components/AppHeader';

export default function SyllabusScreen() {
  const router = useRouter();
  const { selectedPSU, selectedBranch, selectedSections, selectedTopics, toggleTopic, setAllTopics, clearTopics } = useExamStore();
  const { geminiApiKey, geminiModel } = useSettingsStore();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [studyTopic, setStudyTopic] = useState<Topic | null>(null);
  const [studyContent, setStudyContent] = useState<string>('');
  const [loadingStudy, setLoadingStudy] = useState(false);

  if (!selectedPSU) { router.replace('/'); return null; }

  const sections = selectedPSU.sections.filter(s => selectedSections.includes(s.id));

  const sectionData = useMemo(() =>
    sections.map(s => ({
      section: s,
      topics: getSyllabusTopics(s.id, selectedBranch?.id),
    })), [sections, selectedBranch]);

  const allTopicIds = sectionData.flatMap(s => s.topics.map(t => t.id));
  const allSelected = allTopicIds.length > 0 && allTopicIds.every(id => selectedTopics.includes(id));

  const toggleAll = () => {
    allSelected ? clearTopics() : setAllTopics(allTopicIds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleSectionTopics = (section: typeof sections[0], topics: Topic[]) => {
    const ids = topics.map(t => t.id);
    const allSectionSelected = ids.every(id => selectedTopics.includes(id));
    const newTopics = allSectionSelected
      ? selectedTopics.filter(id => !ids.includes(id))
      : [...new Set([...selectedTopics, ...ids])];
    setAllTopics(newTopics);
  };

  const toggleExpand = (sectionId: string) =>
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const handleBookmark = async (topic: Topic, section: typeof sections[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isBookmarked(topic.id)) {
      await removeBookmark(topic.id);
    } else {
      await addBookmark({
        topicId: topic.id,
        topicTitle: topic.title,
        sectionId: section.id,
        sectionName: section.name,
        branchId: selectedBranch?.id ?? 'all',
        branchName: selectedBranch?.name ?? 'All Branches',
        psuId: selectedPSU!.id,
        psuName: selectedPSU!.name,
      });
    }
  };

  const handleStudy = async (topic: Topic) => {
    setStudyTopic(topic);
    setLoadingStudy(true);
    setStudyContent('');
    try {
      const sheet = await generateStudySheet({
        apiKey: geminiApiKey,
        modelId: geminiModel,
        topicTitle: topic.title,
        psuName: selectedPSU!.name,
        branchName: selectedBranch?.name ?? 'General',
      });
      setStudyContent(sheet);
    } catch (e: any) {
      setStudyContent('Failed to load study guide. Please check your API key.');
    } finally {
      setLoadingStudy(false);
    }
  };

  const canContinue = selectedTopics.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <AppHeader />

      {/* Select All bar */}
      <View style={styles.selectAllBar}>
        <TouchableOpacity style={styles.selectAllBtn} onPress={toggleAll} activeOpacity={0.8}>
          <View style={[styles.checkbox, allSelected && styles.checkboxActive]}>
            {allSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={styles.selectAllText}>
            {allSelected ? 'Deselect All' : 'Select All Topics'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.selectedCount}>{selectedTopics.length} selected</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {sectionData.map(({ section, topics }) => {
          const isExpanded = expandedSections[section.id] !== false;
          const sectionSelectedCount = topics.filter(t => selectedTopics.includes(t.id)).length;
          const allSectionSelected = topics.length > 0 && sectionSelectedCount === topics.length;

          return (
            <View key={section.id} style={styles.sectionAccordion}>
              <TouchableOpacity
                style={[styles.accordionHeader, { borderLeftColor: section.color }]}
                onPress={() => toggleExpand(section.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
                <View style={styles.accordionTitleWrap}>
                  <Text style={styles.accordionTitle} numberOfLines={1}>{section.name}</Text>
                  <Text style={styles.accordionSub} numberOfLines={1}>{sectionSelectedCount}/{topics.length} selected</Text>
                </View>
                <TouchableOpacity
                  style={styles.selectSectionBtn}
                  onPress={() => toggleSectionTopics(section, topics)}
                >
                  <Text style={[styles.selectSectionText, { color: section.color }]}>
                    {allSectionSelected ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.outline} />
              </TouchableOpacity>

              {isExpanded && topics.map(topic => {
                const isSelected = selectedTopics.includes(topic.id);
                const bookmarked = isBookmarked(topic.id);
                return (
                  <View key={topic.id} style={[styles.topicRow, isSelected && styles.topicRowSelected, { borderLeftColor: isSelected ? section.color : 'transparent' }]}>
                    <TouchableOpacity
                      style={styles.topicMain}
                      onPress={() => { toggleTopic(topic.id); Haptics.selectionAsync(); }}
                      onLongPress={() => handleBookmark(topic, section)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.topicCheckbox, isSelected && { backgroundColor: section.color, borderColor: section.color }]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                      </View>
                      <View style={[styles.topicInfo, { flex: 1, minWidth: 0 }]}>
                        <Text style={[styles.topicTitle, isSelected && { color: Colors.onSurface, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={2}>{topic.title}</Text>
                        <Text style={styles.topicMeta} numberOfLines={1}>~{topic.estimatedQCount}Q · {topic.tags[0]}</Text>
                      </View>
                      {bookmarked && <Ionicons name="bookmark" size={16} color={Colors.secondary} style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.studyBtn} onPress={() => handleStudy(topic)}>
                      <Ionicons name="school-outline" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}
        <Text style={styles.longPressHint}>💡 Long-press to bookmark · Tap 🎓 for study guide</Text>
      </ScrollView>

      {/* Continue footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={() => canContinue && router.push('/game-mode')}
          activeOpacity={canContinue ? 0.8 : 1}
        >
          <Text style={styles.continueBtnText}>
            {canContinue ? `Continue with ${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''}` : 'Select at least 1 topic'}
          </Text>
          {canContinue && <Ionicons name="arrow-forward" size={18} color={Colors.onPrimary} />}
        </TouchableOpacity>
      </View>

      {/* Study Modal */}
      <Modal visible={!!studyTopic} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitle}>
                <Ionicons name="school" size={24} color={Colors.primary} />
                <Text style={styles.modalTopicTitle}>{studyTopic?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setStudyTopic(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {loadingStudy ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.modalLoadingText}>Generating Study Guide...</Text>
                </View>
              ) : (
                <Text style={styles.studyText}>{studyContent}</Text>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setStudyTopic(null)}>
                <Text style={styles.modalDoneText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { ...Typography.h4, color: Colors.onSurface },
  headerSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  selectAllBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surfaceContainerLow, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: Colors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectAllText: { ...Typography.button, color: Colors.primary },
  selectedCount: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxxl },
  sectionAccordion: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.md, overflow: 'hidden', ...Shadows.card, marginBottom: Spacing.sm },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderLeftWidth: 4, backgroundColor: Colors.surfaceContainerLow },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  accordionTitleWrap: { flex: 1 },
  accordionTitle: { ...Typography.h4, color: Colors.onSurface },
  accordionSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 1 },
  selectSectionBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  selectSectionText: { ...Typography.buttonSm },
  topicRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '80', borderLeftWidth: 3 },
  topicMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  topicRowSelected: { backgroundColor: Colors.primary + '06' },
  topicCheckbox: { width: 18, height: 18, borderRadius: 3, borderWidth: 2, borderColor: Colors.outline, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topicInfo: { flex: 1 },
  topicTitle: { ...Typography.bodyMd, color: Colors.onSurface },
  topicMeta: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  studyBtn: { padding: Spacing.md, borderLeftWidth: 1, borderLeftColor: Colors.outlineVariant + '40' },
  longPressHint: { ...Typography.bodySm, color: Colors.onSurfaceVariant, textAlign: 'center', paddingVertical: Spacing.md },
  footer: { padding: Spacing.lg, paddingBottom: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLowest },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.pill, padding: Spacing.lg, ...Shadows.button },
  continueBtnDisabled: { backgroundColor: Colors.outline },
  continueBtnText: { ...Typography.button, color: Colors.white },
  // Study Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, height: '80%', padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  modalTopicTitle: { ...Typography.h3, color: Colors.onSurface, flex: 1 },
  closeBtn: { padding: Spacing.sm },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingBottom: Spacing.xl },
  modalLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxl },
  modalLoadingText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginTop: Spacing.md },
  studyText: { ...Typography.bodyMd, color: Colors.onSurface, lineHeight: 24 },
  modalFooter: { marginTop: Spacing.md },
  modalDoneBtn: { backgroundColor: Colors.primary, borderRadius: Radius.pill, padding: Spacing.lg, alignItems: 'center' },
  modalDoneText: { ...Typography.button, color: Colors.white },
});
