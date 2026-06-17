import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const APP_URL = 'https://aspirant-arcade.xyz';

export const CardFooter = () => (
  <View style={styles.footer}>
    <View style={styles.divider} />
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.appName}>Aspirant Arcade</Text>
        <Text style={styles.url}>aspirant-arcade.xyz</Text>
        <Text style={styles.tagline}>Free PSU & Exam Prep</Text>
      </View>
      <View style={styles.qrWrapper}>
        <QRCode
          value={APP_URL}
          size={52}
          color="#FFFFFF"
          backgroundColor="transparent"
        />
        <Text style={styles.scanLabel}>scan to download</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  footer: {
    marginTop: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    gap: 2,
  },
  appName: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  url: {
    color: '#FDC003',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  tagline: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  qrWrapper: {
    alignItems: 'center',
    gap: 3,
  },
  scanLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
    fontSize: 8,
    letterSpacing: 0.5,
  },
});
