import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential,
  sendPasswordResetEmail, linkWithCredential,
} from 'firebase/auth';
import { auth, GOOGLE_WEB_CLIENT_ID } from '@/config/firebase';
import { Colors, Typography, Radius, Spacing, Shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();

  // ── Main form ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Forgot password ────────────────────────────────────────────────────────
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // ── Account linking (Google + existing email/password account) ─────────────
  const [pendingCred, setPendingCred] = useState<any>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)/settings');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const target = resetEmail.trim() || email.trim();
    if (!target) {
      Alert.alert('Enter email', 'Type your email address above first.');
      return;
    }
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, target);
      Alert.alert('Email sent', `Password reset link sent to ${target}. Check your inbox.`);
      setShowForgotPw(false);
      setResetEmail('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) throw new Error('No ID token returned from Google');
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      router.replace('/(tabs)/settings');
    } catch (error: any) {
      let statusCodes: any = {};
      try { statusCodes = require('@react-native-google-signin/google-signin').statusCodes; } catch {}

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — do nothing
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // already in progress — do nothing
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available on this device.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        // Email already registered with password — offer to link accounts
        const cred = GoogleAuthProvider.credentialFromError(error);
        const existingEmail = error.customData?.email || '';
        if (cred && existingEmail) {
          setPendingCred(cred);
          setPendingEmail(existingEmail);
          setShowLinkModal(true);
        } else {
          Alert.alert('Account exists', 'An account already exists with this email. Please sign in with your password.');
        }
      } else {
        Alert.alert('Google Sign-In Failed', error.message || 'Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccounts = async () => {
    if (!linkPassword) {
      Alert.alert('Enter password', 'Enter your existing password to link accounts.');
      return;
    }
    setIsLinking(true);
    try {
      const result = await signInWithEmailAndPassword(auth, pendingEmail, linkPassword);
      await linkWithCredential(result.user, pendingCred);
      setShowLinkModal(false);
      setLinkPassword('');
      router.replace('/(tabs)/settings');
    } catch (error: any) {
      Alert.alert('Link Failed', error.message || 'Could not link accounts. Check your password.');
    } finally {
      setIsLinking(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access premium support and more</Text>
          </View>

          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.outline} />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor={Colors.outline}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.outline} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.outline}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.outline}
                  />
                </TouchableOpacity>
              </View>
              {/* Forgot password toggle */}
              <TouchableOpacity
                onPress={() => {
                  setResetEmail(email);
                  setShowForgotPw(v => !v);
                }}
                style={styles.forgotLink}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Inline reset form */}
            {showForgotPw && (
              <View style={styles.resetBox}>
                <Text style={styles.resetTitle}>Reset Password</Text>
                <Text style={styles.resetSub}>Enter the email linked to your account. We'll send a reset link.</Text>
                <View style={[styles.inputContainer, { marginTop: Spacing.sm }]}>
                  <Ionicons name="mail-outline" size={18} color={Colors.outline} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={Colors.outline}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.loginButton, { marginTop: Spacing.sm }]}
                  onPress={handleForgotPassword}
                  disabled={isSendingReset}
                >
                  {isSendingReset
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.loginButtonText}>Send Reset Email</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.loginButtonText}>Sign In</Text>
              }
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register' as any)}>
                <Text style={styles.linkText}>Register</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.guestButton} onPress={() => router.back()}>
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Account linking modal */}
      <Modal
        visible={showLinkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRow}>
              <Ionicons name="link-outline" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Link Your Accounts</Text>
            <Text style={styles.modalBody}>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>{pendingEmail}</Text>
              {'\n'}is already registered with email & password.{'\n\n'}Enter your password below to link your Google account — you'll be able to sign in with either method going forward.
            </Text>
            <View style={[styles.inputContainer, { marginTop: Spacing.md }]}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.outline} />
              <TextInput
                style={styles.input}
                placeholder="Your existing password"
                placeholderTextColor={Colors.outline}
                value={linkPassword}
                onChangeText={setLinkPassword}
                secureTextEntry
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.loginButton, { marginTop: Spacing.md }]}
              onPress={handleLinkAccounts}
              disabled={isLinking}
            >
              {isLinking
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.loginButtonText}>Link & Sign In</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => { setShowLinkModal(false); setLinkPassword(''); }}
            >
              <Text style={styles.guestButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBFF' },
  scrollContent: { padding: Spacing.xl, paddingTop: Spacing.xl },
  backButton: { marginBottom: Spacing.xxl },
  header: { marginBottom: Spacing.xxxl },
  title: { ...Typography.h1, color: Colors.primary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodyMd, color: Colors.outline },
  form: { gap: Spacing.xl },
  inputGroup: { gap: Spacing.sm },
  label: { ...Typography.labelCaps, color: Colors.outline, fontSize: 10 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EAEDF2', borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: Spacing.md,
  },
  input: { flex: 1, ...Typography.bodyMd, color: Colors.onSurface },
  forgotLink: { alignSelf: 'flex-end', marginTop: 4 },
  forgotText: { ...Typography.bodySm, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  resetBox: {
    backgroundColor: '#F0F4FF', borderRadius: Radius.md,
    padding: Spacing.lg, borderWidth: 1, borderColor: '#D0DAFF',
  },
  resetTitle: { ...Typography.h4, color: Colors.primary, marginBottom: 4 },
  resetSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, lineHeight: 18 },
  loginButton: {
    backgroundColor: Colors.primary, paddingVertical: 16,
    borderRadius: Radius.md, alignItems: 'center', ...Shadows.button,
  },
  loginButtonText: { ...Typography.button, color: '#FFF' },
  separator: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, marginVertical: Spacing.sm,
  },
  line: { flex: 1, height: 1, backgroundColor: '#EAEDF2' },
  separatorText: { ...Typography.labelCaps, color: Colors.outline, fontSize: 10 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', paddingVertical: 14, borderRadius: Radius.md,
    gap: Spacing.md, borderWidth: 1, borderColor: '#EAEDF2', ...Shadows.card,
  },
  googleButtonText: { ...Typography.button, color: Colors.onSurface, fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  footerText: { ...Typography.bodyMd, color: Colors.outline },
  linkText: { ...Typography.bodyMd, color: Colors.primary, fontWeight: 'bold' },
  guestButton: { alignItems: 'center', marginTop: Spacing.xl },
  guestButtonText: { ...Typography.bodyMd, color: Colors.outline, textDecorationLine: 'underline' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: Radius.lg,
    padding: Spacing.xl, width: '100%',
  },
  modalIconRow: { alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h3, color: Colors.primary, textAlign: 'center', marginBottom: Spacing.sm },
  modalBody: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, lineHeight: 22, textAlign: 'center' },
});
