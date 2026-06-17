import { useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  isEmbed,
  isRouteAllowedInEmbed,
  showEmbedRedirectModal,
  EMBED_MODEL,
  EMBED_KEY_SENTINEL,
} from '@/utils/embed';

/**
 * Mounted at the app root. Only active in embed (iframe) mode. It:
 *  1. Forces the model to flash-lite and sets a sentinel API key so the quiz
 *     flow's key-presence gates pass (the real key lives in the website proxy).
 *  2. Blocks navigation to any route outside the quiz "Prepare" flow — bouncing
 *     back home and offering to open the feature on the full standalone site.
 */
export function EmbedGuard() {
  const pathname = usePathname();
  const router = useRouter();

  // One-time embed setup.
  useEffect(() => {
    if (!isEmbed()) return;
    useSettingsStore.setState({
      geminiModel: EMBED_MODEL,
      geminiApiKey: EMBED_KEY_SENTINEL,
      isOnboarded: true, // never show onboarding inside the iframe
    });
  }, []);

  // Route guard.
  useEffect(() => {
    if (!isEmbed() || !pathname) return;
    if (isRouteAllowedInEmbed(pathname)) return;
    // Bounce back to the quiz home, then prompt redirect to the full site.
    router.replace('/');
    showEmbedRedirectModal({ pathname, reason: 'page' });
  }, [pathname]);

  return null;
}
