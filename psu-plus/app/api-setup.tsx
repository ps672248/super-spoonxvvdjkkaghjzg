import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Linking, LayoutAnimation,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useSettingsStore, GEMINI_MODELS } from '@/stores/settingsStore';
import { testApiKey } from '@/services/gemini';

const API_KEY_STEPS = [
  {
    step: '1',
    title: 'Open Google AI Studio',
    desc: 'Go to aistudio.google.com and sign in with your Google account.',
  },
  {
    step: '2',
    title: 'Click "Get API Key"',
    desc: 'Find the "Get API key" button in the left sidebar or header.',
  },
  {
    step: '3',
    title: 'Create a New Key',
    desc: 'Click "Create API key in new project" — takes about 5 seconds.',
  },
  {
    step: '4',
    title: 'Copy the Key',
    desc: 'The key starts with "AIza". Copy it and come back here to paste.',
  },
  {
    step: '5',
    title: 'Free Tier',
    desc: 'No billing required. The free tier is more than enough for daily practice.',
  },
];

export default function ApiSetupScreen() {
  const router = useRouter();
  const { geminiApiKey, geminiModel, setApiKey, setModel, setOnboarded } = useSettingsStore();
  const [key, setKey] = useState(geminiApiKey);
  const [selectedModel, setSelectedModel] = useState(geminiModel);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showKeyGuide, setShowKeyGuide] = useState(false);

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(v => !v);
  };

  const handleSelectModel = (id: string) => {
    setSelectedModel(id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(false);
  };

  const handleTest = async () => {
    if (!key.trim()) {
      Alert.alert('No API Key', 'Enter your Gemini API key first.');
      return;
    }
    setTesting(true);
    const ok = await testApiKey(key.trim(), selectedModel);
    setTesting(false);
    if (ok) {
      Alert.alert('✅ Connected', 'API key and model are working correctly.');
    } else {
      Alert.alert('Connection Failed', 'Could not reach Gemini API. Check your key and internet connection.');
    }
  };

  const handleSave = async () => {
    if (!key.trim()) {
      Alert.alert('API Key Required', 'Please enter your Gemini API key to continue.');
      return;
    }
    setSaving(true);
    await Promise.all([setApiKey(key.trim()), setModel(selectedModel), setOnboarded()]);
    setSaving(false);
    router.canGoBack() ? router.back() : router.replace('/');
  };

  const handleSkip = async () => {
    await setOnboarded();
    router.canGoBack() ? router.back() : router.replace('/');
  };

  const selectedModelObj = GEMINI_MODELS.find(m => m.id === selectedModel) || GEMINI_MODELS[0];

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <View style={styles.card}>
        {/* Gold accent bar */}
        <View style={styles.topAccent} />

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.iconSquare}>
            <Ionicons name="key" size={22} color={Colors.white} />
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.skipText}>Skip for now</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.outline} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Configure AI Access</Text>
        <Text style={styles.desc}>
          Enter your Gemini API key to unlock AI-generated questions and syllabus guides tailored to your PSU curriculum.
        </Text>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* API Key */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>GEMINI API KEY</Text>
            <View style={styles.keyInput}>
              <TextInput
                style={styles.keyField}
                value={key}
                onChangeText={setKey}
                placeholder="AIza..."
                placeholderTextColor={Colors.outline}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowKey(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={showKey ? 'eye-off' : 'eye'} size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.getKeyLink} onPress={() => setShowKeyGuide(true)}>
              <Ionicons name="help-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.getKeyText}>How to get a free API key?</Text>
            </TouchableOpacity>
          </View>

          {/* Model selector — matches settings */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>AI MODEL</Text>
            <TouchableOpacity
              style={[styles.dropdownTrigger, isDropdownOpen && styles.dropdownTriggerActive]}
              onPress={toggleDropdown}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownTriggerText} numberOfLines={1}>{selectedModelObj.label}</Text>
              <Ionicons name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.outline} />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {GEMINI_MODELS.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.dropdownItem, m.id === selectedModel && styles.dropdownItemActive, (m as any).comingSoon && { opacity: 0.5 }]}
                      onPress={() => !(m as any).comingSoon && handleSelectModel(m.id)}
                      activeOpacity={(m as any).comingSoon ? 1 : 0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.dropdownItemLabel, m.id === selectedModel && styles.dropdownItemLabelActive]} numberOfLines={1}>
                            {m.label}
                          </Text>
                          {(m as any).comingSoon && (
                            <View style={{ backgroundColor: '#FFF3CD', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                              <Text style={{ fontSize: 9, color: '#856404', fontFamily: 'Inter_600SemiBold' }}>COMING SOON</Text>
                            </View>
                          )}
                          {(m as any).requiresPaid && (
                            <View style={{ backgroundColor: '#FDE8FF', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                              <Text style={{ fontSize: 9, color: '#7B2FBE', fontFamily: 'Inter_600SemiBold' }}>PAID KEY</Text>
                            </View>
                          )}
                          {(m as any).maxUsage && (
                            <View style={{ backgroundColor: '#E8F5E9', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                              <Text style={{ fontSize: 9, color: '#2E7D32', fontFamily: 'Inter_600SemiBold' }}>MAX USAGE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.dropdownItemDesc} numberOfLines={2}>{m.desc}</Text>
                      </View>
                      {m.id === selectedModel && !((m as any).comingSoon) && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Test connection */}
          <TouchableOpacity
            style={[styles.testBtn, testing && { opacity: 0.6 }]}
            onPress={handleTest}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="wifi" size={16} color={Colors.primary} />
            )}
            <Text style={styles.testBtnText}>{testing ? 'Testing...' : 'Test Connection'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, (!key.trim() || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || !key.trim()}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Save & Start Practicing</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.secondary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Get API Key guide modal */}
      <Modal visible={showKeyGuide} transparent animationType="slide" onRequestClose={() => setShowKeyGuide(false)}>
        <View style={styles.guideOverlay}>
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <View style={styles.guideIconSquare}>
                <Ionicons name="key" size={20} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guideTitle}>Get a Free Gemini API Key</Text>
                <Text style={styles.guideSubtitle}>No billing required · Takes under 1 minute</Text>
              </View>
              <TouchableOpacity onPress={() => setShowKeyGuide(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={Colors.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.guideStepsScroll} showsVerticalScrollIndicator={false}>
              {API_KEY_STEPS.map((s, i) => (
                <View key={i} style={styles.guideStep}>
                  <View style={styles.guideStepNumber}>
                    <Text style={styles.guideStepNumberText}>{s.step}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideStepTitle}>{s.title}</Text>
                    <Text style={styles.guideStepDesc}>{s.desc}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.openStudioBtn}
              onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
            >
              <Ionicons name="open-outline" size={18} color={Colors.secondary} />
              <Text style={styles.openStudioBtnText}>Open Google AI Studio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.guideDoneBtn} onPress={() => setShowKeyGuide(false)}>
              <Text style={styles.guideDoneBtnText}>Got it, I'll paste my key now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 6, 102, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    width: '100%',
    maxHeight: '90%',
    padding: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.cardHover,
  },
  topAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 4,
    backgroundColor: Colors.gold,
    width: '35%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  iconSquare: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  skipText: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontFamily: 'Inter_600SemiBold',
  },
  title: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  desc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  scroll: { maxHeight: 420 },
  fieldGroup: { marginBottom: Spacing.lg, gap: Spacing.xs },
  fieldLabel: { ...Typography.labelCaps, color: Colors.outline, fontSize: 10, marginBottom: 2 },

  keyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEDF2',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E6E8EB',
    overflow: 'hidden',
  },
  keyField: {
    flex: 1,
    padding: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontFamily: 'Inter_400Regular',
  },
  eyeBtn: { padding: Spacing.md },
  getKeyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  getKeyText: { ...Typography.bodySm, color: Colors.primary, fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEDF2',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownTriggerActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF',
  },
  dropdownTriggerText: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  dropdownList: {
    marginTop: Spacing.sm,
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    ...Shadows.card,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    gap: Spacing.md,
  },
  dropdownItemActive: { backgroundColor: '#F9FBFF' },
  dropdownItemLabel: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontFamily: 'Inter_600SemiBold',
  },
  dropdownItemLabelActive: { color: Colors.primary },
  dropdownItemDesc: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 11,
    marginTop: 2,
  },

  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  testBtnText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 13,
  },

  footer: { marginTop: Spacing.md },
  saveBtn: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.gold,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.button,
  },
  saveBtnDisabled: { backgroundColor: '#D0D5DD' },
  saveBtnText: { ...Typography.button, color: Colors.secondary, fontSize: 15, fontFamily: 'Inter_700Bold' },

  // Guide modal
  guideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  guideCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '85%',
    ...Shadows.cardHover,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  guideIconSquare: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: { ...Typography.h3, color: Colors.primary },
  guideSubtitle: { ...Typography.bodySm, color: Colors.outline, marginTop: 2 },
  guideStepsScroll: { marginBottom: Spacing.xl },
  guideStep: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  guideStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  guideStepNumberText: {
    ...Typography.labelCaps,
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  guideStepTitle: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  guideStepDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  openStudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    ...Shadows.button,
  },
  openStudioBtnText: {
    ...Typography.button,
    color: '#FFF',
    fontSize: 14,
  },
  guideDoneBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  guideDoneBtnText: {
    ...Typography.bodyMd,
    color: Colors.outline,
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
});
