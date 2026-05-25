import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Bullet {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  text: string;
}

interface Slide {
  id: string;
  ionicon: keyof typeof Ionicons.glyphMap;
  accent: string;
  title: string;
  body: string;
  bullets?: Bullet[];
}

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    ionicon: 'trophy',
    accent: Colors.primary,
    title: 'Crack PSU.\nYour Way.',
    body: 'Aspirant Arcade is built for serious aspirants. AI-generated questions, gamified practice modes, and a study system that adapts to your target university and branch.',
  },
  {
    id: 'modes',
    ionicon: 'game-controller',
    accent: Colors.matchGreen,
    title: "Practice That\nDoesn't Feel Like Work",
    body: 'Five ways to sharpen your edge:',
    bullets: [
      { icon: 'flash',           iconColor: Colors.gold,        text: 'MCQ Blitz — rapid-fire timed rounds' },
      { icon: 'skull',           iconColor: Colors.survivalRed,  text: 'Survival — one wrong answer ends it' },
      { icon: 'link',            iconColor: Colors.matchGreen,   text: 'Match — connect concepts under pressure' },
      { icon: 'cut',             iconColor: '#E91E63',           text: 'Syllabus Slasher — slice correct answers' },
      { icon: 'game-controller', iconColor: Colors.marioYellow,  text: 'Mario Runner — dodge obstacles, answer to survive' },
    ],
  },
  {
    id: 'gemini',
    ionicon: 'sparkles',
    accent: '#7B2FBE',
    title: 'Unlimited Questions,\nZero Data Risk',
    body: "Questions generated live using your own Google Gemini API key — always fresh and on-syllabus. Your key never leaves your device.",
    bullets: [
      { icon: 'lock-closed', iconColor: Colors.primary,      text: "Stored in your device's secure storage only" },
      { icon: 'ban',         iconColor: Colors.survivalRed,   text: 'Never sent to any server or shared' },
      { icon: 'flash',       iconColor: Colors.gold,          text: "Google's free tier is more than enough" },
    ],
  },
  {
    id: 'login',
    ionicon: 'cloud',
    accent: Colors.mcqBlue,
    title: 'Sign In to\nUnlock the Full Picture',
    body: 'A free account gives you:',
    bullets: [
      { icon: 'bookmark',       iconColor: Colors.gold,        text: 'Bookmarks synced across your devices' },
      { icon: 'settings',       iconColor: Colors.primary,     text: 'Settings backed up to the cloud' },
      { icon: 'headset',        iconColor: Colors.matchGreen,  text: 'Priority support when you need help' },
      { icon: 'school',         iconColor: Colors.mcqBlue,     text: 'Request support for new exams or branches' },
    ],
  },
  {
    id: 'start',
    ionicon: 'rocket',
    accent: Colors.marioYellow,
    title: 'One Step Before\nYou Begin',
    body: 'Add your Gemini API key to start generating questions instantly. It takes under a minute — and you can always do it later from Settings.',
  },
];

function SlideItem({ slide }: { slide: Slide }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Fixed header: icon + title + body */}
      <View style={[styles.iconCircle, { backgroundColor: slide.accent }]}>
        <Ionicons name={slide.ionicon} size={34} color="#FFF" />
      </View>
      <Text style={styles.slideTitle}>{slide.title}</Text>
      <Text style={styles.slideBody}>{slide.body}</Text>

      {/* Scrollable bullets */}
      {slide.bullets && (
        <ScrollView
          style={styles.bulletScroll}
          contentContainerStyle={styles.bulletList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {slide.bullets.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletIconBox, { backgroundColor: b.iconColor + '18' }]}>
                <Ionicons name={b.icon} size={18} color={b.iconColor} />
              </View>
              <Text style={styles.bulletText}>{b.text}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboarded } = useSettingsStore();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === SLIDES.length - 1;

  const goNext = () => {
    const next = currentIndex + 1;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== currentIndex) setCurrentIndex(idx);
  };

  const handleSetupKey = () => {
    router.replace('/api-setup');
  };

  const handleSkip = async () => {
    await setOnboarded();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="game-controller" size={18} color={Colors.gold} />
          </View>
          <Text style={styles.logoText}>Aspirant <Text style={styles.logoAccent}>Arcade</Text></Text>
        </View>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={s => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => <SlideItem slide={item} />}
        style={styles.flatList}
      />

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        {isLast ? (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSetupKey}>
              <Ionicons name="sparkles" size={18} color={Colors.secondary} style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Set Up Gemini Key</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={handleSkip}>
              <Text style={styles.ghostBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
            <Text style={styles.primaryBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.secondary} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...Typography.h4,
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  logoAccent: {
    color: Colors.gold,
  },
  skipText: {
    ...Typography.bodyMd,
    color: Colors.outline,
    fontFamily: 'Inter_600SemiBold',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing.xl + Spacing.md,
    paddingTop: Spacing.xl,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.cardHover,
  },
  slideTitle: {
    ...Typography.h1,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
    lineHeight: 42,
  },
  slideBody: {
    ...Typography.bodyLg,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },
  bulletScroll: {
    flex: 1,
  },
  bulletList: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  bulletIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bulletText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: Radius.pill,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.outlineVariant,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  primaryBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...Shadows.button,
  },
  primaryBtnText: {
    ...Typography.button,
    color: Colors.secondary,
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  ghostBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostBtnText: {
    ...Typography.bodyMd,
    color: Colors.outline,
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
});
