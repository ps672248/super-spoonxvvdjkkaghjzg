import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFlagsContext } from '@/context/FlagsContext';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/context/ToastContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

export const FlagsModals: React.FC = () => {
  const {
    isMaintenanceMode,
    maintenanceMessage,
    retryMaintenance,
    showPermissionExplainer,
    dismissPermissionExplainer,
    handlePermissionAllow,
    showWhatsNew,
    whatsNewItems,
    dismissWhatsNew,
    showAppRate,
    markRated,
    scheduleRateReminder,
    showAppUpdate,
    updateVersion,
    updateApkUrl,
    updateReleaseNotes,
    forceUpdate,
    dismissUpdate,
  } = useFlagsContext();

  const { user } = useAuthStore();
  const { showToast } = useToast();

  // ── Maintenance state ─────────────────────────────────────────────────────
  const [isRetrying, setIsRetrying] = useState(false);

  // ── Rate modal state ──────────────────────────────────────────────────────
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);

  // ── Update modal state ────────────────────────────────────────────────────
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const downloadResumable = useRef<FileSystem.DownloadResumable | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRateSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a star rating first.', 'warning');
      return;
    }
    setIsSubmittingRate(true);
    try {
      await markRated(rating, reviewText, user?.uid ?? null);
      showToast(rating > 3 ? 'Thanks for the love! 🎉' : 'Feedback received — thank you!', 'success');
    } catch {
      showToast('Failed to submit rating. Please try again.', 'error');
    } finally {
      setIsSubmittingRate(false);
      setRating(0);
      setReviewText('');
    }
  };

  const handleCancelDownload = async () => {
    try {
      await downloadResumable.current?.pauseAsync();
    } catch { /* ignore */ }
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  const openUnknownSourcesSettings = async () => {
    try {
      await IntentLauncher.startActivityAsync(
        'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
        { data: 'package:com.aspirants.arcade' }
      );
      showToast('Enable "Install unknown apps" for Aspirant Arcade, then tap Download & Install again.', 'warning');
    } catch {
      showToast('Go to Settings → Apps → Special access → Install unknown apps → enable Aspirant Arcade, then retry.', 'warning');
    }
  };

  const installAPK = async (fileUri: string) => {
    // Step 1: get content URI (FileProvider-backed)
    let contentUri: string;
    try {
      contentUri = await FileSystem.getContentUriAsync(fileUri);
    } catch (e: any) {
      showToast('Failed to prepare APK: ' + (e?.message ?? 'unknown error'), 'error');
      setIsDownloading(false);
      return;
    }

    // Step 2: launch package installer
    // Android handles "Install unknown apps" UI itself — only redirect to settings on hard failure
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1 | 268435456, // FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK
        type: 'application/vnd.android.package-archive',
      });
    } catch (_e: any) {
      // Intent threw (no handler / hard failure) — fall back to expo-sharing sheet
      try {
        const { shareAsync } = await import('expo-sharing');
        await shareAsync(fileUri, {
          mimeType: 'application/vnd.android.package-archive',
          dialogTitle: 'Install Aspirant Arcade Update',
        });
      } catch {
        await openUnknownSourcesSettings();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadUpdate = async () => {
    if (!updateApkUrl || isDownloading) return;
    if (Platform.OS !== 'android') {
      // iOS: just open URL
      Linking.openURL(updateApkUrl);
      return;
    }
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const rawName = updateApkUrl.split('/').pop() ?? 'aspirant_arcade_update.apk';
      const filename = rawName.split('?')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      downloadResumable.current = FileSystem.createDownloadResumable(
        updateApkUrl,
        fileUri,
        {},
        (progress) => {
          const pct = progress.totalBytesExpectedToWrite > 0
            ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
            : 0;
          setDownloadProgress(isNaN(pct) ? 0 : pct);
        }
      );

      const result = await downloadResumable.current.downloadAsync();
      if (!result || result.status !== 200) {
        throw new Error(`Status ${result?.status ?? 'unknown'}`);
      }
      showToast('Download complete! Launching installer…', 'success');
      await installAPK(result.uri);
    } catch (e: any) {
      setIsDownloading(false);
      setDownloadProgress(0);
      showToast('Download failed — ' + (e.message ?? 'try again'), 'error');
    }
  };

  // ── Visibility guards (priority order) ────────────────────────────────────
  const noMaint  = !isMaintenanceMode;
  const noUpdate = noMaint && !showAppUpdate;
  const noPerm   = noUpdate && !showPermissionExplainer;
  const noNew    = noPerm  && !showWhatsNew;

  return (
    <>
      {/* ── 1. Maintenance (blocks everything, non-dismissible) ── */}
      <Modal
        visible={isMaintenanceMode}
        animationType="slide"
        transparent
        onRequestClose={() => {/* intentionally blocked */}}
      >
        <View style={styles.maintenanceOverlay}>
          <View style={styles.maintenanceCard}>
            <View style={styles.iconBg}>
              <Ionicons name="construct-outline" size={52} color={Colors.primary} />
            </View>
            <Text style={styles.maintenanceTitle}>Under Maintenance</Text>
            <Text style={styles.maintenanceBody}>{maintenanceMessage}</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.retryBtn, isRetrying && { opacity: 0.7 }]}
              onPress={async () => {
                setIsRetrying(true);
                await retryMaintenance();
                setIsRetrying(false);
              }}
              disabled={isRetrying}
            >
              {isRetrying
                ? <ActivityIndicator size="small" color="#FFF" />
                : <>
                    <Ionicons name="refresh-outline" size={18} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Check Again</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 2. App Update ── */}
      <Modal visible={noMaint && showAppUpdate} animationType="slide" transparent onRequestClose={forceUpdate ? undefined : dismissUpdate}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="arrow-up-circle-outline" size={36} color="#1565C0" />
              </View>
              <Text style={styles.cardTitle}>Update Available</Text>
              <Text style={styles.cardSubtitle}>Version {updateVersion} is ready</Text>
            </View>

            {updateReleaseNotes.length > 0 && (
              <View style={styles.releaseNotesList}>
                {updateReleaseNotes.map((note, i) => (
                  <View key={i} style={styles.releaseNoteItem}>
                    <Ionicons name="checkmark-circle" size={15} color="#1565C0" />
                    <Text style={styles.releaseNoteText}>{note}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.updateNotes}>
              <View style={styles.updateNote}>
                <Ionicons name="download-outline" size={16} color="#1565C0" />
                <Text style={styles.updateNoteText}>Downloaded directly from our servers</Text>
              </View>
            </View>

            {/* Progress bar */}
            {isDownloading && (
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round(downloadProgress * 100)}%` as any }]} />
                </View>
                <Text style={styles.progressLabel}>{Math.round(downloadProgress * 100)}%</Text>
              </View>
            )}

            <View style={styles.footer}>
              {isDownloading ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleCancelDownload}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
              ) : !forceUpdate ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={dismissUpdate}>
                  <Text style={styles.secondaryBtnText}>Later</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#1565C0' }, isDownloading && { opacity: 0.7 }]}
                onPress={handleDownloadUpdate}
                disabled={isDownloading}
              >
                {isDownloading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={styles.primaryBtnText}>Download & Install</Text>
                }
              </TouchableOpacity>
            </View>
            {forceUpdate && (
              <Text style={styles.forceNotice}>This update is required to continue using the app.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* ── 3. Permission Explainer ── */}
      <Modal
        visible={noUpdate && showPermissionExplainer}
        animationType="slide"
        transparent
        onRequestClose={dismissPermissionExplainer}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="notifications-outline" size={32} color="#2E7D32" />
              </View>
              <Text style={styles.cardTitle}>Stay on Track!</Text>
            </View>
            <Text style={styles.cardDesc}>
              Enable notifications to receive daily exam prep reminders, new mock test alerts, and syllabus updates directly on your device.
            </Text>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={dismissPermissionExplainer}>
                <Text style={styles.secondaryBtnText}>Not Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => handlePermissionAllow(user?.uid ?? 'guest')}>
                <Text style={styles.primaryBtnText}>Enable Notifications</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 4. What's New ── */}
      <Modal
        visible={noPerm && showWhatsNew}
        animationType="slide"
        transparent
        onRequestClose={dismissWhatsNew}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles-outline" size={32} color={Colors.gold} />
              <Text style={styles.cardTitle}>What's New</Text>
            </View>
            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
              {whatsNewItems.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success ?? '#2E7D32'} />
                  <Text style={styles.listItemText} numberOfLines={3}>{item}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.primaryBtn, styles.fullBtn]} onPress={dismissWhatsNew}>
              <Text style={styles.primaryBtnText}>Got it, let's go!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 5. App Rate ── */}
      <Modal
        visible={noNew && showAppRate}
        animationType="slide"
        transparent
        onRequestClose={() => scheduleRateReminder(7)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star-half-outline" size={32} color={Colors.gold} />
              <Text style={styles.cardTitle}>Enjoying Aspirant Arcade?</Text>
            </View>
            <Text style={styles.cardDesc}>
              Your rating helps more students find us. Takes 5 seconds!
            </Text>

            {/* Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={38}
                    color={Colors.gold}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional review */}
            {rating > 0 && (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewLabel}>
                  {rating <= 3 ? 'What can we improve?' : 'What do you love most?'}
                </Text>
                <TextInput
                  style={styles.reviewInput}
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="Optional — tell us your thoughts…"
                  placeholderTextColor={Colors.outlineVariant}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}

            <View style={styles.footer}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => scheduleRateReminder(7)}>
                <Text style={styles.secondaryBtnText}>Remind Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, rating === 0 && styles.primaryBtnOff]}
                onPress={handleRateSubmit}
                disabled={rating === 0 || isSubmittingRate}
              >
                {isSubmittingRate
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={styles.primaryBtnText}>Submit</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  maintenanceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
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
  iconBg: {
    width: 96, height: 96,
    borderRadius: Radius.pill,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  maintenanceTitle: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  maintenanceBody: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 0,
    paddingHorizontal: Spacing.xxl,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadows.cardHover,
    maxHeight: '85%',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 72, height: 72,
    borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textAlign: 'center',
  },
  cardDesc: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },

  progressWrap: {
    marginBottom: Spacing.lg,
    gap: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E3EAF5',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1565C0',
    borderRadius: Radius.pill,
  },
  progressLabel: {
    ...Typography.bodySm,
    color: '#1565C0',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },

  updateNotes: { gap: 8, marginBottom: Spacing.xl },
  updateNote: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  updateNoteText: { ...Typography.bodyMd, color: Colors.onSurface },
  releaseNotesList: { gap: 8, marginBottom: Spacing.lg, backgroundColor: '#EEF4FF', borderRadius: 10, padding: Spacing.md },
  releaseNoteItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  releaseNoteText: { ...Typography.bodyMd, color: '#1565C0', flex: 1, lineHeight: 20 },
  forceNotice: {
    ...Typography.bodySm,
    color: '#B71C1C',
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },

  listScroll: { maxHeight: 240, marginBottom: Spacing.lg },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#F9FBFF',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  listItemText: { ...Typography.bodyMd, color: Colors.onSurface, flex: 1 },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  reviewBox: { marginBottom: Spacing.xl },
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

  footer: { flexDirection: 'row', gap: Spacing.md },
  fullBtn: { width: '100%' },
  secondaryBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: { ...Typography.button, color: Colors.outline },
  primaryBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  primaryBtnOff: {
    backgroundColor: Colors.outlineVariant,
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },
});
