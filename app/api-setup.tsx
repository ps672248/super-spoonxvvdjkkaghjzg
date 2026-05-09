import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useSettingsStore, GEMINI_MODELS } from '@/stores/settingsStore';

export default function ApiSetupScreen() {
  const router = useRouter();
  const { geminiApiKey, geminiModel, setApiKey, setModel, setOnboarded } = useSettingsStore();
  const [key, setKey] = useState(geminiApiKey);
  const [selectedModel, setSelectedModel] = useState(geminiModel);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const stableModels = GEMINI_MODELS.filter(m => m.tier === 'stable');
  const previewModels = GEMINI_MODELS.filter(m => m.tier === 'preview');

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

  return (
    <View style={styles.modalOverlay}>
      <KeyboardAvoidingView 
        style={{ width: '100%', alignItems: 'center' }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalTopAccent} />
          
          <View style={styles.modalHeaderRow}>
            <View style={styles.keyIconSquare}>
              <Ionicons name="key" size={24} color={Colors.white} />
            </View>
            <Ionicons name="sparkles-outline" size={28} color={Colors.primary} />
          </View>

          <Text style={styles.modalTitle}>Configure AI Access</Text>
          <Text style={styles.modalDesc}>
            Enter your Gemini API key to unlock personalized practice questions and syllabus-specific study guides tailored to your PSU curriculum.
          </Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* API Key input */}
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
              <TouchableOpacity
                style={styles.getKeyLink}
                onPress={() => Alert.alert('Get API Key', 'Visit https://aistudio.google.com/app/apikey to get a free Gemini API key.')}
              >
                <Ionicons name="open-outline" size={12} color={Colors.primary} />
                <Text style={styles.getKeyText}>Get a free key at aistudio.google.com</Text>
              </TouchableOpacity>
            </View>

            {/* Model selector - Compact */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>AI MODEL</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelRow}>
                {stableModels.map(m => (
                  <TouchableOpacity 
                    key={m.id} 
                    style={[styles.miniModel, selectedModel === m.id && styles.miniModelSelected]}
                    onPress={() => setSelectedModel(m.id)}
                  >
                    <Text style={[styles.miniModelLabel, selectedModel === m.id && styles.miniModelLabelSelected]}>{m.label.split(' ')[2] || m.label.split(' ')[1]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.unlockBanner}>
              <View style={styles.sparkleCircle}>
                <Ionicons name="sparkles" size={24} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.unlockTitle}>Unlock AI Generation</Text>
                <Text style={styles.unlockDesc}>Activate explainers and custom quizzes.</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
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
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '85%',
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
    marginBottom: Spacing.sm
  },
  modalDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.lg
  },
  scroll: { maxHeight: 400 },
  fieldGroup: { marginBottom: Spacing.lg, gap: Spacing.xs },
  fieldLabel: { ...Typography.labelCaps, color: Colors.outline, fontSize: 10 },
  keyInput: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F2F4F7', 
    borderRadius: Radius.md, 
    borderWidth: 1.5, 
    borderColor: '#E6E8EB', 
    overflow: 'hidden' 
  },
  keyField: { 
    flex: 1, 
    padding: Spacing.md, 
    ...Typography.bodyMd, 
    color: Colors.onSurface, 
    fontFamily: 'Inter_400Regular' 
  },
  eyeBtn: { padding: Spacing.md },
  getKeyLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  getKeyText: { ...Typography.bodySm, color: Colors.primary, fontSize: 11 },
  
  modelRow: { gap: Spacing.sm, paddingVertical: 4 },
  miniModel: { 
    paddingHorizontal: Spacing.md, 
    paddingVertical: 8, 
    borderRadius: Radius.sm, 
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#E6E8EB'
  },
  miniModelSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary
  },
  miniModelLabel: { ...Typography.bodySm, color: Colors.onSurfaceVariant, fontSize: 12 },
  miniModelLabelSelected: { color: Colors.primary, fontFamily: 'Inter_700Bold' },

  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginTop: Spacing.sm
  },
  sparkleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  unlockTitle: { ...Typography.h4, color: Colors.primary, fontSize: 14 },
  unlockDesc: { ...Typography.bodySm, color: Colors.onSurfaceVariant, fontSize: 11, marginTop: 2 },
  
  modalFooter: { marginTop: Spacing.xl },
  saveBtn: { 
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
  saveBtnDisabled: { backgroundColor: Colors.outline, opacity: 0.6 },
  saveBtnText: { ...Typography.button, color: Colors.secondary, fontSize: 16 }
});

