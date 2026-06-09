import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useConfigStore } from '@/stores/configStore';
import { useSeenQuestionsStore } from '@/stores/seenQuestionsStore';
import { FlagsProvider } from '@/context/FlagsContext';
import { FlagsModals } from '@/components/FlagsModals';
import { ConfirmModal } from '@/components/ConfirmModal';
import { DownloadAppBanner } from '@/components/DownloadAppBanner';
import { ToastProvider } from '@/context/ToastContext';
import { EmbedGuard } from '@/components/EmbedGuard';
import { isEmbed } from '@/utils/embed';
import { pingDevice } from '@/services/deviceAnalytics';
import { Colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black });
  const { loadSettings, isLoaded, isOnboarded } = useSettingsStore();
  const { initialize } = useAuthStore();
  const { loadConfig } = useConfigStore();
  const { load: loadSeenQuestions } = useSeenQuestionsStore();

  // initialize() sets up the auth listener which owns bookmark + activity loading.
  // loadSettings/loadConfig/loadSeenQuestions are auth-independent so load them directly.
  useEffect(() => {
    async function init() {
      initialize();
      pingDevice(); // guest/device heartbeat (best-effort, fire-and-forget)
      await Promise.all([loadSettings(), loadConfig(), loadSeenQuestions()]);
    }
    init();
  }, []);

  // Once both fonts and settings are ready: hide splash + gate onboarding
  useEffect(() => {
    if (!fontsLoaded || !isLoaded) return;
    SplashScreen.hideAsync();
    // Embed (iframe) users skip onboarding — straight into the quiz demo.
    if (!isOnboarded && !isEmbed()) {
      router.replace('/onboarding');
    }
  }, [fontsLoaded, isLoaded]);

  if (!fontsLoaded) return null;

  return (
    <FlagsProvider>
      <ToastProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <DownloadAppBanner />
          <StatusBar style="dark" backgroundColor={Colors.surface} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surface } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="sections" options={{ presentation: 'card' }} />
            <Stack.Screen name="syllabus" options={{ presentation: 'card' }} />
            <Stack.Screen name="game-mode" options={{ presentation: 'card' }} />
            <Stack.Screen name="play/mcq" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="play/survival" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="play/match" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="play/slasher" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="play/mario" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="play/tsunami" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="api-setup" options={{ presentation: 'modal' }} />
            <Stack.Screen name="auth/login" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="interview-prep" options={{ presentation: 'card' }} />
            <Stack.Screen name="interview-mock" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="leaderboard" options={{ presentation: 'card' }} />
          </Stack>
        </GestureHandlerRootView>
        {/* Overlays rendered outside GestureHandlerRootView — anchored to ToastProvider root (position:relative on web) */}
        <EmbedGuard />
        <FlagsModals />
        <ConfirmModal />
      </ToastProvider>
    </FlagsProvider>
  );
}

