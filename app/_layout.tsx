import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { Colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  const { loadSettings } = useSettingsStore();
  const { loadBookmarks } = useBookmarkStore();

  useEffect(() => {
    async function init() {
      await Promise.all([loadSettings(), loadBookmarks()]);
      if (fontsLoaded) SplashScreen.hideAsync();
    }
    init();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor={Colors.surface} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surface } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sections" options={{ presentation: 'card' }} />
        <Stack.Screen name="syllabus" options={{ presentation: 'card' }} />
        <Stack.Screen name="game-mode" options={{ presentation: 'card' }} />
        <Stack.Screen name="play/mcq" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="play/survival" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="play/match" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="play/slasher" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="play/mario" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="api-setup" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

