import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useAuthStore } from '@/stores/authStore';
import { useConfigStore } from '@/stores/configStore';
import { useActivityStore } from '@/stores/activityStore';
import { FlagsProvider } from '@/context/FlagsContext';
import { FlagsModals } from '@/components/FlagsModals';
import { Colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black });
  const { loadSettings, isLoaded, isOnboarded } = useSettingsStore();
  const { loadBookmarks } = useBookmarkStore();
  const { initialize } = useAuthStore();
  const { loadConfig } = useConfigStore();
  const { loadSessions } = useActivityStore();

  // Load all stores on mount
  useEffect(() => {
    async function init() {
      initialize();
      await Promise.all([loadSettings(), loadBookmarks(), loadConfig(), loadSessions()]);
    }
    init();
  }, []);

  // Once both fonts and settings are ready: hide splash + gate onboarding
  useEffect(() => {
    if (!fontsLoaded || !isLoaded) return;
    SplashScreen.hideAsync();
    if (!isOnboarded) {
      router.replace('/onboarding');
    }
  }, [fontsLoaded, isLoaded]);

  if (!fontsLoaded) return null;

  return (
    <FlagsProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
          <Stack.Screen name="api-setup" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/login" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <FlagsModals />
      </GestureHandlerRootView>
    </FlagsProvider>
  );
}

