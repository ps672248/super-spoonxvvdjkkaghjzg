/**
 * Leaderboard store — owns the header-badge state (the FOMO pull).
 *
 * The badge tracks the user's WEEKLY global-correct rank. When it changes since
 * they last opened the board (someone passed them, or they climbed), the header
 * trophy lights up with a "↑N passed" badge — the re-engagement hook. The board
 * screen itself reads the leaderboard service directly; this store is only the
 * cross-screen badge signal.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { isEmbed } from '../utils/embed';
import { fetchMyRank, myValueFor } from '../services/leaderboard';
import type { StudySession } from './activityStore';

const lastSeenKey = (uid: string) => `psuplus_lb_lastseen_${uid}`;

interface LeaderboardState {
  myWeeklyRank: number;   // 0 = not on the board yet
  passedCount: number;    // how many you climbed past since last seen
  hasUnseen: boolean;     // drives the header badge

  /** Recompute the badge from local sessions + the live board. Call on app open and after a game. */
  refreshBadge: (sessions: StudySession[]) => Promise<void>;
  /** Mark the board as seen — clears the badge. Call when the board screen opens. */
  markSeen: () => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  myWeeklyRank: 0,
  passedCount: 0,
  hasUnseen: false,

  refreshBadge: async (sessions) => {
    const uid = auth.currentUser?.uid;
    if (!uid || isEmbed()) {
      set({ myWeeklyRank: 0, passedCount: 0, hasUnseen: false });
      return;
    }
    try {
      const myValue = myValueFor(sessions, 'global_correct', 'week');
      const rank = await fetchMyRank('global_correct', 'week', myValue);
      const raw = await AsyncStorage.getItem(lastSeenKey(uid));
      const lastSeen = raw ? parseInt(raw, 10) : 0;

      // Climbed past N people since last look.
      const passed = lastSeen > 0 && rank > 0 && rank < lastSeen ? lastSeen - rank : 0;
      // Any change (or first appearance) = a reason to look.
      const hasUnseen = rank > 0 && (lastSeen === 0 || rank !== lastSeen);

      set({ myWeeklyRank: rank, passedCount: passed, hasUnseen });
    } catch {
      // Offline — leave badge as-is.
    }
  },

  markSeen: async () => {
    const uid = auth.currentUser?.uid;
    const rank = get().myWeeklyRank;
    if (uid && rank > 0) {
      await AsyncStorage.setItem(lastSeenKey(uid), String(rank));
    }
    set({ hasUnseen: false, passedCount: 0 });
  },
}));
