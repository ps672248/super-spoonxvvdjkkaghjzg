// Academic Kinetic design system — from PSU Plus Gamified Prep (Stitch project 16553323456868927522)
import { Platform } from 'react-native';

export const Colors = {
  // Core brand
  primary:           '#000666',
  primaryContainer:  '#1A237E',
  onPrimary:         '#FFFFFF',
  onPrimaryContainer:'#8690EE',

  secondary:         '#785900',
  secondaryContainer:'#FDC003',
  onSecondary:       '#FFFFFF',
  onSecondaryContainer: '#6C5000',

  tertiary:          '#000E5D',
  tertiaryContainer: '#0D2187',
  onTertiary:        '#FFFFFF',
  onTertiaryContainer: '#8090F6',

  // Surfaces
  surface:               '#F7F9FC',
  surfaceDim:            '#D8DADD',
  surfaceBright:         '#F7F9FC',
  surfaceContainerLowest:'#FFFFFF',
  surfaceContainerLow:   '#F2F4F7',
  surfaceContainer:      '#ECEEF1',
  surfaceContainerHigh:  '#E6E8EB',
  surfaceContainerHighest:'#E0E3E6',

  // Text & icons
  onSurface:         '#191C1E',
  onSurfaceVariant:  '#454652',
  outline:           '#767683',
  outlineVariant:    '#C6C5D4',

  // Semantic
  error:             '#BA1A1A',
  onError:           '#FFFFFF',
  errorContainer:    '#FFDAD6',
  onErrorContainer:  '#93000A',
  success:           '#2E7D32',
  successContainer:  '#E8F5E9',
  warning:           '#F57C00',
  warningContainer:  '#FFF3E0',

  // Accent gold (used for CTAs, gamification rewards)
  gold:              '#FDC003',
  goldDark:          '#785900',

  // Game mode colors
  mcqBlue:       '#1976D2',
  survivalRed:   '#C62828',
  matchGreen:    '#2E7D32',
  marioYellow:   '#F9A825',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Typography = {
  h1: { fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  h2: { fontFamily: 'Inter_600SemiBold', fontSize: 24, lineHeight: 32, letterSpacing: -0.25 },
  h3: { fontFamily: 'Inter_600SemiBold', fontSize: 20, lineHeight: 28 },
  h4: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 24 },
  bodyLg: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 26 },
  bodyMd: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  bodySm: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  labelCaps: { fontFamily: 'Inter_700Bold', fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  button: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  buttonSm: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16 },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  xs:3,
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const Shadows = {
  card: Platform.select({
    web: { boxShadow: '0px 2px 8px rgba(26,35,126,0.08)' } as any,
    default: { shadowColor: '#1A237E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  })!,
  cardHover: Platform.select({
    web: { boxShadow: '0px 4px 16px rgba(26,35,126,0.14)' } as any,
    default: { shadowColor: '#1A237E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 6 },
  })!,
  button: Platform.select({
    web: { boxShadow: '0px 4px 8px rgba(253,192,3,0.30)' } as any,
    default: { shadowColor: '#FDC003', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 4 },
  })!,
};
