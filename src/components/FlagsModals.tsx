import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, 
  TextInput, Alert, Platform, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFlagsContext } from '@/context/FlagsContext';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useAuthStore } from '@/stores/authStore';

export const FlagsModals: React.FC = () => {
  const {
    isMaintenanceMode,
    maintenanceMessage,
    showPermissionExplainer,
    dismissPermissionExplainer,
    handlePermissionAllow,
    showWhatsNew,
    whatsNewItems,
    dismissWhatsNew,
    showAppRate,
    markRated,
    scheduleRateReminder,
  } = useFlagsContext();

  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);

  const handleRateSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating first.');
      return;
    }
    setIsSubmittingRate(true);
    await markRated(rating, reviewText, user?.uid || null);
    setIsSubmittingRate(false);
    setRating(0);
    setReviewText('');
    if (rating > 3) {
      Alert.alert('Thank You!', 'We appreciate your stellar support!');
    } else {
      Alert.alert('Feedback Received', 'Thank you for helping us improve.');
    }
  };

  return (
    <>
      {/* 1. Maintenance Modal */}
      <Modal
        visible={isMaintenanceMode}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.maintenanceOverlay}>
          <View style={styles.maintenanceCard}>
            <View style={styles.maintenanceIconBg}>
              <Ionicons name="construct-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.maintenanceTitle}>Under Maintenance</Text>
            <Text style={styles.maintenanceText}>{maintenanceMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* 2. Permission Explainer Modal */}
      <Modal
        visible={showPermissionExplainer && !isMaintenanceMode}
        animationType="slide"
        transparent={true}
        onRequestClose={dismissPermissionExplainer}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="notifications-outline" size={32} color={Colors.primary} />
              <Text style={styles.modalTitle}>Stay on Track!</Text>
            </View>
            <Text style={styles.modalDesc}>
              Enable notifications to receive daily exam prep reminders, new mock test alerts, and syllabus updates directly on your device.
            </Text>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={dismissPermissionExplainer}>
                <Text style={styles.secondaryBtnText}>Not Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => handlePermissionAllow(user?.uid || 'guest')}>
                <Text style={styles.primaryBtnText}>Enable Notifications</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. What's New Modal */}
      <Modal
        visible={showWhatsNew && !isMaintenanceMode && !showPermissionExplainer}
        animationType="slide"
        transparent={true}
        onRequestClose={dismissWhatsNew}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="sparkles-outline" size={32} color={Colors.gold} />
              <Text style={styles.modalTitle}>What's New in Aspirant Arcade</Text>
            </View>

            <ScrollView style={styles.whatsNewList} showsVerticalScrollIndicator={false}>
              {whatsNewItems.map((item, index) => (
                <View key={index} style={styles.whatsNewItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.whatsNewItemText}>{item}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.fullWidthBtn} onPress={dismissWhatsNew}>
              <Text style={styles.fullWidthBtnText}>Got it, let's explore!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. App Rate Modal */}
      <Modal
        visible={showAppRate && !isMaintenanceMode && !showPermissionExplainer && !showWhatsNew}
        animationType="slide"
        transparent={true}
        onRequestClose={() => scheduleRateReminder(7)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="star-half-outline" size={32} color={Colors.gold} />
              <Text style={styles.modalTitle}>Enjoying Aspirant Arcade?</Text>
            </View>
            <Text style={styles.modalDesc}>
              Tap a star to rate your experience. Your feedback fuels our mission to help you ace your exams!
            </Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={36} 
                    color={Colors.gold} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional Review Text */}
            {rating > 0 && (
              <View style={styles.reviewContainer}>
                <Text style={styles.reviewLabel}>
                  {rating <= 3 ? "How can we improve?" : "What do you love about it?"}
                </Text>
                <TextInput
                  style={styles.reviewInput}
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="Tell us your thoughts (optional)..."
                  placeholderTextColor={Colors.outlineVariant}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => scheduleRateReminder(7)}>
                <Text style={styles.secondaryBtnText}>Remind Me Later</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryBtn, rating === 0 && styles.primaryBtnDisabled]} 
                onPress={handleRateSubmit}
                disabled={rating === 0 || isSubmittingRate}
              >
                {isSubmittingRate ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Submit Rating</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  maintenanceOverlay: {
    flex: 1,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  maintenanceCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.cardHover,
  },
  maintenanceIconBg: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  maintenanceTitle: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  maintenanceText: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadows.cardHover,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  modalDesc: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  whatsNewList: {
    maxHeight: 250,
    marginBottom: Spacing.xl,
  },
  whatsNewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: '#F9FBFF',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  whatsNewItemText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  reviewContainer: {
    marginBottom: Spacing.xl,
  },
  reviewLabel: {
    ...Typography.labelCaps,
    color: Colors.outline,
    marginBottom: Spacing.sm,
  },
  reviewInput: {
    backgroundColor: '#F9FBFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    ...Typography.button,
    color: Colors.outline,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.outlineVariant,
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryBtnText: {
    ...Typography.button,
    color: '#FFF',
  },
  fullWidthBtn: {
    width: '100%',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  fullWidthBtnText: {
    ...Typography.button,
    color: '#FFF',
  },
});
