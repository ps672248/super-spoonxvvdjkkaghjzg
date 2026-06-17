import { useRef, useCallback, useState } from 'react';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export function useScoreCard() {
  const ref = useRef<ViewShot>(null);
  const [capturing, setCapturing] = useState(false);

  const capture = useCallback(async (): Promise<string | null> => {
    if (!ref.current) return null;
    setCapturing(true);
    try {
      // @ts-ignore — captureRef exists on the instance
      const uri: string = await ref.current.capture();
      return uri;
    } catch {
      return null;
    } finally {
      setCapturing(false);
    }
  }, []);

  const share = useCallback(async () => {
    const uri = await capture();
    if (!uri) return;
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your score' });
    } else {
      Alert.alert('Sharing not available on this device');
    }
  }, [capture]);

  const saveToGallery = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to save score card.');
      return;
    }
    const uri = await capture();
    if (!uri) return;
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Saved!', 'Score card saved to your gallery.');
  }, [capture]);

  return { ref, capturing, share, saveToGallery };
}
