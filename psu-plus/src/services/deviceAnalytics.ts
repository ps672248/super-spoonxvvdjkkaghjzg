/**
 * Lightweight device heartbeat — lets you count GUEST installs (who never sign in)
 * since guests have no server identity otherwise.
 *
 * Each install gets a persistent random deviceId (AsyncStorage). On app open and on
 * sign-in we upsert analytics_devices/{deviceId}:
 *   { firstSeen, lastSeen, signedIn, uid, platform }
 *
 * Counting (Firestore console or getCountFromServer):
 *   guests        = where signedIn == false
 *   active guests = where signedIn == false AND lastSeen >= now - 7d
 *   conversion    = signedIn count / total
 *
 * Caveat: counts DEVICES, not humans (reinstall / cleared storage = new id).
 * Skipped entirely in the embed/iframe demo.
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { db, auth } from '../config/firebase';
import { isEmbed } from '../utils/embed';

const DEVICE_ID_KEY = 'psuplus_device_id';

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** Upsert this device's heartbeat. Best-effort — never throws. Call on app open + sign-in. */
export async function pingDevice(): Promise<void> {
  if (isEmbed()) return; // don't pollute analytics with demo traffic
  try {
    const id = await getDeviceId();
    const ref = doc(db, 'analytics_devices', id);
    const uid = auth.currentUser?.uid ?? null;
    const now = Date.now();

    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { lastSeen: now, signedIn: !!uid, uid });
    } else {
      await setDoc(ref, {
        firstSeen: now,
        lastSeen: now,
        signedIn: !!uid,
        uid,
        platform: Platform.OS,
      });
    }
  } catch {
    // Analytics is best-effort; ignore failures.
  }
}
