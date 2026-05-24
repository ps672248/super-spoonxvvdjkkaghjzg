import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, LayoutAnimation, Alert,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useSettingsStore, GEMINI_MODELS } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { testApiKey } from '@/services/gemini';
import { AppHeader } from '@/components/AppHeader';
import { signOut } from 'firebase/auth';
import { auth as firebaseAuth } from '@/config/firebase';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    geminiApiKey, geminiModel, fullName,
    setApiKey, setModel, setFullName 
  } = useSettingsStore();
  
  const [localKey, setLocalKey] = useState(geminiApiKey || '');
  const [localName, setLocalName] = useState(fullName || '');
  const [showKey, setShowKey] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setLocalKey(geminiApiKey);
    setLocalName(fullName);
  }, [geminiApiKey, fullName]);

  const handleSave = async () => {
    await setApiKey(localKey);
    await setFullName(localName);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    Alert.alert('Success', 'Profile and configuration saved!');
  };

  const handleTest = async () => {
    if (!localKey) {
      Alert.alert('Error', 'Please enter an API key first.');
      return;
    }
    setIsTesting(true);
    const success = await testApiKey(localKey, geminiModel);
    setIsTesting(false);
    
    if (success) {
      Alert.alert('Success', 'Connection verified! Your API key and model are working correctly.');
    } else {
      Alert.alert('Connection Failed', 'Unable to reach Gemini API. Please check your key and network connection.');
    }
  };

  const selectedModel = GEMINI_MODELS.find(m => m.id === geminiModel) || GEMINI_MODELS[0];

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSelectModel = (id: string) => {
    setModel(id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut(firebaseAuth);
            Alert.alert('Signed Out', 'You have been signed out successfully.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Card */}
          <View style={styles.card}>
            <View style={[styles.cardAccent, { backgroundColor: Colors.primary }]} />
            <View style={styles.cardInner}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
                <Text style={styles.cardTitle}>Account</Text>
              </View>

              {user ? (
                <View style={styles.accountInfo}>
                  <View>
                    <Text style={styles.accountName}>{user.displayName || 'User'}</Text>
                    <Text style={styles.accountEmail}>{user.email}</Text>
                  </View>
                  <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                    <Text style={styles.signOutBtnText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.accountInfo}>
                  <Text style={styles.guestText}>You are currently browsing as a guest.</Text>
                  <TouchableOpacity 
                    style={styles.signInBtn} 
                    onPress={() => router.push('/auth/login' as any)}
                  >
                    <Text style={styles.signInBtnText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Profile Details Card */}
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardInner}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Profile Details</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <View style={styles.inputContainer}>
                  <TextInput 
                    style={styles.input}
                    value={localName}
                    onChangeText={setLocalName}
                    placeholder="Enter your full name"
                  />
                </View>
                <Text style={styles.helperText}>This name will be used to personalize your performance feedback.</Text>
              </View>
            </View>
          </View>

          {/* API Configuration Card */}
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardInner}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="grid-outline" size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>API Configuration</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>GEMINI API KEY</Text>
                <View style={styles.inputContainer}>
                  <TextInput 
                    style={styles.input}
                    value={localKey}
                    onChangeText={setLocalKey}
                    placeholder="Paste your API key here"
                    secureTextEntry={!showKey}
                  />
                  <TouchableOpacity onPress={() => setShowKey(!showKey)}>
                    <Ionicons 
                      name={showKey ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={Colors.outline} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>MODEL SELECTION</Text>
                <TouchableOpacity 
                  style={[styles.inputContainer, isDropdownOpen && styles.inputContainerActive]}
                  onPress={toggleDropdown}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inputText}>{selectedModel.label}</Text>
                  <View style={styles.dropdownIcons}>
                    <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={Colors.outline} />
                  </View>
                </TouchableOpacity>

                {isDropdownOpen && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                      {GEMINI_MODELS.map((m) => (
                        <TouchableOpacity 
                          key={m.id} 
                          style={[styles.dropdownItem, m.id === geminiModel && styles.dropdownItemActive]}
                          onPress={() => handleSelectModel(m.id)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.dropdownItemLabel, m.id === geminiModel && styles.dropdownItemLabelActive]}>
                              {m.label}
                            </Text>
                            <Text style={styles.dropdownItemDesc}>{m.desc}</Text>
                          </View>
                          {m.id === geminiModel && (
                            <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity 
                  style={styles.testBtn} 
                  onPress={handleTest}
                  disabled={isTesting}
                >
                  <Text style={styles.testBtnText}>
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Help & Support Card */}
          <View style={styles.card}>
            <View style={[styles.cardAccent, { backgroundColor: Colors.primary }]} />
            <View style={styles.cardInner}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="help-buoy-outline" size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Help & Support</Text>
              </View>
              <Text style={styles.supportDesc}>
                Need assistance? Check our FAQs or contact our premium support team directly.
              </Text>
              <TouchableOpacity 
                style={[styles.supportBtn, !user && styles.supportBtnDisabled]} 
                onPress={() => router.push('/support' as any)}
              >
                <Text style={styles.supportBtnText}>
                  {!user ? 'Sign In to Access Support' : 'Contact Support'}
                </Text>
                <Ionicons 
                  name={!user ? "lock-closed" : "chevron-forward"} 
                  size={18} 
                  color="#FFF" 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.adminLink} 
                onPress={() => router.push('/admin-support' as any)}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color={Colors.outline} />
                <Text style={styles.adminLinkText}>Admin Portal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FBFF' },
  container: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing.xxxl },

  card: { 
    backgroundColor: '#FFF', 
    borderRadius: Radius.md, 
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  cardAccent: { height: 4, width: '40%', backgroundColor: Colors.gold },
  cardInner: { padding: Spacing.xl },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  cardTitle: { ...Typography.h2, color: Colors.primary },

  field: { marginBottom: Spacing.lg },
  fieldLabel: { 
    ...Typography.labelCaps, 
    color: Colors.outline, 
    fontSize: 10, 
    marginBottom: Spacing.sm 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EAEDF2', 
    borderRadius: Radius.md, 
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  inputContainerActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF'
  },
  input: { 
    flex: 1, 
    ...Typography.bodyMd, 
    color: Colors.onSurface,
    padding: 0
  },
  inputText: { 
    flex: 1, 
    ...Typography.bodyMd, 
    color: Colors.onSurface 
  },
  dropdownIcons: { flexDirection: 'row', alignItems: 'center' },
  helperText: { 
    ...Typography.bodySm, 
    color: Colors.outline, 
    fontSize: 10, 
    marginTop: Spacing.xs,
    fontStyle: 'italic'
  },

  dropdownList: { 
    marginTop: Spacing.sm,
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    ...Shadows.card,
    overflow: 'hidden'
  },
  dropdownItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    gap: Spacing.md
  },
  dropdownItemActive: {
    backgroundColor: '#F9FBFF'
  },
  dropdownItemLabel: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontFamily: 'Inter_600SemiBold'
  },
  dropdownItemLabelActive: {
    color: Colors.primary
  },
  dropdownItemDesc: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 11,
    marginTop: 2
  },

  btnRow: { 
    flexDirection: 'row', 
    gap: Spacing.md, 
    marginTop: Spacing.md 
  },
  testBtn: { 
    flex: 1, 
    paddingVertical: Spacing.lg, 
    borderRadius: Radius.md, 
    borderWidth: 2, 
    borderColor: Colors.primary,
    alignItems: 'center'
  },
  testBtnText: { 
    ...Typography.button, 
    color: Colors.primary,
    fontSize: 14
  },
  saveBtn: { 
    flex: 1, 
    paddingVertical: Spacing.lg, 
    borderRadius: Radius.md, 
    backgroundColor: Colors.gold,
    alignItems: 'center',
    ...Shadows.button
  },
  saveBtnText: { 
    ...Typography.button, 
    color: Colors.secondary,
    fontSize: 14
  },
  supportDesc: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    marginBottom: Spacing.lg,
    opacity: 0.8
  },
  supportBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    ...Shadows.button
  },
  supportBtnText: {
    ...Typography.button,
    color: '#FFF',
    fontSize: 14
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
    opacity: 0.6
  },
  adminLinkText: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 12,
    textDecorationLine: 'underline'
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  accountName: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontWeight: 'bold',
  },
  accountEmail: {
    ...Typography.bodySm,
    color: Colors.outline,
  },
  signOutBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FF4D4F',
  },
  signOutBtnText: {
    ...Typography.button,
    color: '#FF4D4F',
    fontSize: 12,
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
  },
  signInBtnText: {
    ...Typography.button,
    color: '#FFF',
    fontSize: 12,
  },
  guestText: {
    ...Typography.bodyMd,
    color: Colors.outline,
    flex: 1,
  },
  supportBtnDisabled: {
    backgroundColor: Colors.outline,
    opacity: 0.8,
  }
});
