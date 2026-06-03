import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/theme';
import { useFlagsContext } from '@/context/FlagsContext';

const DISMISSED_KEY = 'psuplus_download_banner_dismissed';

// Fallback URL — update when APK is published
const FALLBACK_APK_URL = 'https://aspirant-arcade.vercel.app';

export const DownloadAppBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const { updateApkUrl } = useFlagsContext();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    AsyncStorage.getItem(DISMISSED_KEY).then(val => {
      if (!val) setVisible(true);
    });
  }, []);

  if (Platform.OS !== 'web' || !visible) return null;

  const handleDownload = () => {
    const url = updateApkUrl || FALLBACK_APK_URL;
    Linking.openURL(url);
  };

  const handleDismiss = async () => {
    await AsyncStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <Ionicons name="phone-portrait-outline" size={20} color={Colors.gold} />
        <Text style={styles.text}>Get the full experience on Android</Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
          <Text style={styles.downloadText}>Download App</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={Colors.onPrimaryContainer} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    minWidth: 200,
  },
  text: {
    ...Typography.bodySm,
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  downloadBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadText: {
    ...Typography.buttonSm,
    color: Colors.secondary,
  },
});
