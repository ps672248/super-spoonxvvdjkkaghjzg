import { Platform } from 'react-native';
import { useConfirmStore } from '@/stores/confirmStore';

/**
 * Embed mode = the app running inside an <iframe> on the marketing website.
 * Activated by the `?embed=1` query param on first load. We persist the flag in
 * sessionStorage because expo-router drops the query string on client-side nav.
 *
 * In embed mode:
 *  - Only the "Prepare" quiz flow is usable (see ALLOWED_PREFIXES).
 *  - Gemini calls route through the website proxy (no API key shipped to client).
 *  - The model is forced to gemini-3.1-flash-lite (also enforced server-side).
 *  - Blocked pages / quota-exhaustion show a redirect-to-full-site modal.
 */

const SS_KEY = 'aa_embed_mode';

/** Real standalone web app URL — redirect target for blocked actions. */
export const STANDALONE_URL = 'https://aspirant-arcade-fwa8.vercel.app';

/**
 * Marketing website base — hosts the Gemini proxy (`/api/gemini`).
 * Note: this is the *website* domain, NOT the app domain (the app is a static
 * export with no server routes). Override via EXPO_PUBLIC_GEMINI_PROXY_URL.
 */
const WEBSITE_URL = 'https://aspirant-arcade.vercel.app';
export const GEMINI_PROXY_URL =
  process.env.EXPO_PUBLIC_GEMINI_PROXY_URL || `${WEBSITE_URL}/api/gemini`;

/** Model forced in embed mode (cheap, low quota). */
export const EMBED_MODEL = 'gemini-3.1-flash-lite';

/** Sentinel stored as the "api key" in embed mode so key-presence gates pass. */
export const EMBED_KEY_SENTINEL = 'embed-proxy';

// Detect once on module load (web only).
let cached: boolean | null = null;

function detect(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1') {
      window.sessionStorage.setItem(SS_KEY, '1');
      return true;
    }
    if (window.sessionStorage.getItem(SS_KEY) === '1') return true;
  } catch {
    /* sessionStorage/URL unavailable — fall through to frame check */
  }
  // Fallback: if we're inside a cross-origin iframe, treat as embed.
  // Accessing window.top across origins throws → that itself means we're framed.
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** True when running inside the marketing-site iframe. */
export function isEmbed(): boolean {
  if (cached === null) cached = detect();
  return cached;
}

// Route prefixes usable inside the iframe (the quiz "Prepare" flow).
const ALLOWED_PREFIXES = ['/sections', '/syllabus', '/game-mode', '/play'];

/** Home/index is allowed; everything outside the quiz flow is blocked. */
export function isRouteAllowedInEmbed(pathname: string): boolean {
  if (!pathname || pathname === '/' || pathname === '/index') return true;
  // Strip the (tabs) group + leading slash variations.
  const p = pathname.replace('/(tabs)', '') || '/';
  if (p === '/' || p === '/index') return true;
  return ALLOWED_PREFIXES.some(prefix => p === prefix || p.startsWith(prefix + '/'));
}

/**
 * Open the given app path on the full standalone site in a new tab.
 * Used when an embed user chooses "Redirect" in the blocked-action modal.
 */
export function openOnFullSite(pathname?: string) {
  if (typeof window === 'undefined') return;
  const path = pathname && pathname !== '/' ? pathname : '';
  window.open(`${STANDALONE_URL.replace(/\/$/, '')}${path}`, '_blank', 'noopener');
}

// Guard against stacking multiple modals when several blocked events fire.
let redirectModalOpen = false;

/**
 * Show the "available on the full site" confirm modal.
 * Confirm → open the full app (optionally at `pathname`) in a new tab.
 * @param reason 'page' for blocked routes, 'quota' when the free demo is used up.
 */
export async function showEmbedRedirectModal(opts?: { pathname?: string; reason?: 'page' | 'quota' }) {
  if (redirectModalOpen) return;
  redirectModalOpen = true;
  const isQuota = opts?.reason === 'quota';
  try {
    const confirmed = await useConfirmStore.getState().show({
      title: isQuota ? 'Free demo used up' : 'Available on the full site',
      message: isQuota
        ? "You've used your free demo quiz. Continue on the full Aspirant Arcade site to keep practicing."
        : 'This feature is available on the full Aspirant Arcade site. Open it now?',
      confirmText: 'Open full site',
      cancelText: 'Cancel',
    });
    if (confirmed) openOnFullSite(opts?.pathname);
  } finally {
    redirectModalOpen = false;
  }
}
