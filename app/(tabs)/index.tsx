import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { BranchConfig, BRANCHES } from '@/config/branches';
import { PSUS, PSUConfig } from '@/config/psus';
import { useExamStore } from '@/stores/examStore';
import { AppHeader } from '@/components/AppHeader';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedPSU, selectedBranch, setPSU, setBranch } = useExamStore();


  const showExams = !selectedPSU;

  const availableItems = showExams
    ? PSUS
    : BRANCHES.filter(b => selectedPSU.branches.includes(b.id));

  const handleItemSelect = (item: PSUConfig | BranchConfig) => {
    if (showExams) {
      setPSU(item.id);
    } else {
      setBranch(item.id);
      router.push('/sections');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleWrap}>
            <Text style={styles.titleMain}>
              {showExams ? 'Choose Your Challenge' : 'Select Your Branch'}
            </Text>
            <View style={styles.titleUnderline} />
          </View>
        </View>

        {/* List Section */}
        <View style={styles.branchList}>
          {availableItems.map((item) => (
            <SelectionItem
              key={item.id}
              item={item}
              type={showExams ? 'psu' : 'branch'}
              isSelected={showExams ? (selectedPSU as any)?.id === item.id : selectedBranch?.id === item.id}
              onPress={() => handleItemSelect(item)}
            />
          ))}
        </View>

        {!showExams && (
          <TouchableOpacity
            style={styles.backToExams}
            onPress={() => setPSU(null)}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.outline} />
            <Text style={styles.backToExamsText}>Back to Exams</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SelectionItem({
  item,
  type,
  isSelected,
  onPress
}: {
  item: PSUConfig | BranchConfig;
  type: 'psu' | 'branch';
  isSelected: boolean;
  onPress: () => void
}) {
  const icon = type === 'psu' ? (item as PSUConfig).ionicon || 'school' : (item as BranchConfig).icon;
  const title = item.name;
  const subtitle = type === 'psu' ? (item as PSUConfig).fullName : 'TAP TO START PREP';

  return (
    <TouchableOpacity
      style={[styles.branchCard, isSelected && styles.branchCardSelected]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.branchAccent, isSelected && { width: '100%' }]} />
      <View style={styles.branchCardInner}>
        <View style={[styles.branchIconBox, isSelected && { backgroundColor: Colors.primary + '20' }]}>
          <Ionicons name={icon as any} size={28} color={isSelected ? Colors.primary : Colors.onSurfaceVariant} />
        </View>
        <View style={styles.branchInfo}>
          <Text style={[styles.branchTitle, isSelected && { color: Colors.primary }]}>{title}</Text>
          {isSelected && <Text style={styles.branchSubtitle}>{'CURRENTLY SELECTED'}</Text>}
          <Text style={styles.branchSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  container: { flex: 1 },
  content: { paddingBottom: Spacing.xxxl },

  titleSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleMain: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    flex: 1,
  },
  titleUnderline: {
    width: 80,
    height: 4,
    backgroundColor: Colors.gold,
    borderRadius: 2
  },

  branchList: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  branchCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  branchCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08', // Subtle primary background
  },
  branchAccent: {
    height: 4,
    backgroundColor: Colors.gold,
    width: '35%',
    borderBottomRightRadius: 2,
  },
  branchCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg
  },
  branchIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  branchInfo: { flex: 1 },
  branchTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.onSurface
  },
  branchSubtitle: {
    ...Typography.labelCaps,
    color: Colors.outline,
    marginTop: 4,
    fontSize: 10,
  },

  emptyState: { padding: Spacing.xxl, alignItems: 'center' },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },

  backToExams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.xs,
    paddingVertical: Spacing.md
  },
  backToExamsText: {
    ...Typography.labelCaps,
    color: Colors.outline,
    fontSize: 12
  }
});
