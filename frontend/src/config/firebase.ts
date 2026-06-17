import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Updated from google-services.json
export const firebaseConfig = {
  apiKey: "AIzaSyDU_mJjMVdABUcu2qauZnS2N0qSqypi-B0",
  authDomain: "alhansat-4edee.firebaseapp.com",
  databaseURL: "https://alhansat-4edee-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "alhansat-4edee",
  storageBucket: "alhansat-4edee.appspot.com",
  messagingSenderId: "7326957343",
  appId: "1:7326957343:android:5a27c5e447f6e3e0a9fa2a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Web uses IndexedDB/localStorage; native uses AsyncStorage
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? [indexedDBLocalPersistence, browserLocalPersistence]
    : getReactNativePersistence(ReactNativeAsyncStorage),
});

// Web Client ID — from Firebase Console → Project Settings → Your Apps → Android → google-services.json
// Look for oauth_client entry with "client_type": 3
// Format: 7326957343-xxxx.apps.googleusercontent.com
export const GOOGLE_WEB_CLIENT_ID = '7326957343-f22287e1p5peat7dqjoaulh9q60ldi5s.apps.googleusercontent.com';

export default app;
