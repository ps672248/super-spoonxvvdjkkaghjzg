import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
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

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// TODO: Replace YOUR_WEB_CLIENT_ID_FROM_FIREBASE_CONSOLE once downloaded from Firebase Console
export const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE_CONSOLE';

export default app;
