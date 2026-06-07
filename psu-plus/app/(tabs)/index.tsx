import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { BRANCHES, BranchConfig } from '@/config/branches';
import { PSUS, PSUConfig } from '@/config/psus';
import { useExamStore } from '@/stores/examStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { AppHeader } from '@/components/AppHeader';
import { useColumns } from '@/hooks/useColumns';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedPSU, setPSU, setBranch } = useExamStore();
  const { primaryBranchId, setPrimaryBranch } = useSettingsStore();
  const cols = useColumns();

  // Grid card sizing: each card grows to fill the row. flexBasis caps items
  // per row to `cols`; flexGrow lets fewer items stretch to use all space.
  const gridCardStyle = cols > 1
    ? { flexGrow: 1, flexBasis: `${Math.floor(100 / cols) - 2}%` as any, maxWidth: '100%' as any }
    : null;

  const showBranchSelect = !primaryBranchId;
  const filteredPSUs = primaryBranchId
    ? PSUS.filter(p => p.branches.includes(primaryBranchId))
    : [];

  const handleBranchSelect = (branch: BranchConfig) => {
    setBranch(branch.id);
    setPrimaryBranch(branch.id);
  };

  const handlePSUSelect = (psu: PSUConfig) => {
    setPSU(psu.id);
    if (primaryBranchId) setBranch(primaryBranchId);
    router.push('/sections');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.titleMain}>
            {showBranchSelect ? 'Select Your Branch' : 'Choose Your Challenge'}
          </Text>
          <View style={styles.titleUnderline} />
        </View>

        <View style={[styles.list, cols > 1 && styles.grid]}>
          {showBranchSelect
            ? BRANCHES.map(branch => (
                <TouchableOpacity
                  key={branch.id}
                  style={[styles.card, gridCardStyle]}
                  onPress={() => handleBranchSelect(branch)}
                  activeOpacity={0.9}
                >
                  <View style={styles.accent} />
                  <View style={[styles.cardInner, cols > 1 && styles.cardInnerGrid]}>
                    <View style={[styles.iconBox, cols > 1 && styles.iconBoxGrid]}>
                      <Ionicons name={branch.icon as any} size={cols > 1 ? 32 : 28} color={Colors.onSurfaceVariant} />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{branch.name}</Text>
                      <Text style={styles.sub}>TAP TO SELECT</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            : filteredPSUs.map(psu => (
                <TouchableOpacity
                  key={psu.id}
                  style={[styles.card, selectedPSU?.id === psu.id && styles.cardSelected, gridCardStyle]}
                  onPress={() => handlePSUSelect(psu)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.accent, selectedPSU?.id === psu.id && { width: '100%' }]} />
                  <View style={[styles.cardInner, cols > 1 && styles.cardInnerGrid]}>
                    <View style={[styles.iconBox, selectedPSU?.id === psu.id && { backgroundColor: Colors.primary + '20' }, cols > 1 && styles.iconBoxGrid]}>
                      <Ionicons
                        name={(psu.ionicon || 'school') as any}
                        size={cols > 1 ? 32 : 28}
                        color={selectedPSU?.id === psu.id ? Colors.primary : Colors.onSurfaceVariant}
                      />
                    </View>
                    <View style={styles.info}>
                      <Text style={[styles.name, selectedPSU?.id === psu.id && { color: Colors.primary }]}>
                        {psu.name}
                      </Text>
                      <Text style={styles.sub} numberOfLines={1}>{psu.fullName}</Text>
                    </View>
                    {selectedPSU?.id === psu.id && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  container: { flex: 1 },
  content: { paddingBottom: Spacing.xxxl },

  titleSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleMain: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    flex: 1,
  },
  titleUnderline: {
    width: 80, height: 4,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },

  list: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  accent: {
    height: 4,
    backgroundColor: Colors.gold,
    width: '35%',
    borderBottomRightRadius: 2,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  iconBox: {
    width: 56, height: 56,
    borderRadius: Radius.md,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInnerGrid: { flexDirection: 'column', alignItems: 'flex-start', paddingVertical: Spacing.xl },
  iconBoxGrid: { width: 64, height: 64, borderRadius: Radius.lg, marginBottom: Spacing.md },
  info: { flex: 1 },
  name: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.onSurface,
  },
  sub: {
    ...Typography.labelCaps,
    color: Colors.outline,
    marginTop: 4,
    fontSize: 10,
  },
});
