import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { PSUS, PSUConfig } from '@/config/psus';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedPSU, selectedBranch, setPSU } = useExamStore();
  const [modalVisible, setModalVisible] = useState(false);

  const isHome = pathname === '/' || pathname === '/(tabs)';

  const handleLogoPress = () => {
    if (isHome) {
      setModalVisible(true);
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerLeft} 
          onPress={handleLogoPress}
          activeOpacity={0.7}
        >
          <View style={styles.logoBox}>
            <Image 
              source={require('../../assets/logo_transparent.png')} 
              style={{ width: 40, height: 40, borderRadius: 20 }}
              resizeMode="contain"
            />
          </View>
          <View>
            <View style={styles.logoRow}>
              <Text style={styles.headerLogo}>Aspirant Arcade</Text>
              {isHome && <Ionicons name="chevron-down" size={12} color={Colors.primary} style={{ marginLeft: 4, marginTop: 2 }} />}
            </View>
            {selectedPSU && (
              <Text style={styles.examInfo} numberOfLines={1}>
                {selectedPSU.name} {selectedBranch ? `· ${selectedBranch.name}` : ''}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.profileCircle}
          onPress={() => router.push('/(tabs)/settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select PSU Exam</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={PSUS}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: Spacing.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.psuItem, selectedPSU?.id === item.id && styles.psuItemSelected]}
                onPress={() => {
                  setPSU(item.id);
                  setModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.psuIconBox, selectedPSU?.id === item.id && { backgroundColor: Colors.primary + '20' }]}>
                  <Ionicons name={(item.ionicon || 'school') as any} size={24} color={selectedPSU?.id === item.id ? Colors.primary : Colors.onSurfaceVariant} />
                </View>
                <View style={styles.psuItemInfo}>
                  <Text style={styles.psuItemName}>{item.name}</Text>
                  <Text style={styles.psuItemFull} numberOfLines={1}>{item.fullName}</Text>
                </View>
                {selectedPSU?.id === item.id && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  logoBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'transparent', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { ...Typography.h3, color: Colors.primary, fontFamily: 'Inter_700Bold', lineHeight: 22 },
  examInfo: { 
    ...Typography.bodySm, 
    color: Colors.onSurfaceVariant, 
    fontSize: 10, 
    fontFamily: 'Inter_600SemiBold',
    marginTop: -2
  },
  profileCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F2F4F7',
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  // Modal styles
  modalSafe: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: Spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F2F5' 
  },
  modalTitle: { ...Typography.h3, color: Colors.onSurface },
  modalClose: { padding: Spacing.sm },
  psuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.md, 
    backgroundColor: '#F8F9FB', 
    borderRadius: Radius.md, 
    padding: Spacing.md, 
    marginBottom: Spacing.sm,
    borderWidth: 1, 
    borderColor: '#E6E8EB' 
  },
  psuItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '0D' },
  psuIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  psuItemInfo: { flex: 1 },
  psuItemName: { ...Typography.h4, color: Colors.onSurface },
  psuItemFull: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
});
