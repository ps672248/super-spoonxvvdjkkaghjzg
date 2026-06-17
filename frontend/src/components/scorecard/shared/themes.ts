import type { GameMode } from '../../../config/scorecard-templates';

export type CardVariant = 0 | 1 | 2;

interface ModeTheme {
  /** 3 gradient stop arrays — one per variant */
  gradients: [string[], string[], string[]];
  /** Gradient directions per variant */
  directions: [
    { start: { x: number; y: number }; end: { x: number; y: number } },
    { start: { x: number; y: number }; end: { x: number; y: number } },
    { start: { x: number; y: number }; end: { x: number; y: number } },
  ];
  /** Accent glow color (used for overlay circle tint) */
  glow: string;
  /** Badge background tint alpha suffix (hex) */
  badgeBg: string;
  /** Text color to use inside mode/exam badges for readability on this theme */
  badgeText: string;
}

export const MODE_THEMES: Record<GameMode, ModeTheme> = {
  mcq: {
    gradients: [
      ['#001233', '#003380', '#000F2E'],
      ['#001A4D', '#0055B3', '#001233'],
      ['#000D26', '#002B6B', '#001A4D'],
    ],
    directions: [
      { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
      { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    ],
    glow: 'rgba(0,85,179,0.15)',
    badgeBg: '25',
    badgeText: '#7EB8FF',
  },
  survival: {
    gradients: [
      ['#1A0000', '#6B0F1A', '#0D0000'],
      ['#200005', '#7A001A', '#1A0000'],
      ['#0D0000', '#550010', '#1A0005'],
    ],
    directions: [
      { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
      { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    ],
    glow: 'rgba(107,15,26,0.2)',
    badgeBg: '25',
    badgeText: '#FF8A8A',
  },
  match: {
    gradients: [
      ['#001A0A', '#0D5C2A', '#001205'],
      ['#00200D', '#0A6633', '#001A0A'],
      ['#000F05', '#08472A', '#001A0A'],
    ],
    directions: [
      { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
      { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    ],
    glow: 'rgba(13,92,42,0.18)',
    badgeBg: '25',
    badgeText: '#6ED89A',
  },
  mario: {
    gradients: [
      ['#1A0D00', '#5C3D00', '#0F0800'],
      ['#1F1000', '#6B4700', '#1A0D00'],
      ['#0F0800', '#47300A', '#1A1000'],
    ],
    directions: [
      { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
      { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    ],
    glow: 'rgba(92,61,0,0.2)',
    badgeBg: '22',
    badgeText: '#FFD166',  // warm gold — readable on dark amber
  },
  slasher: {
    gradients: [
      ['#0D001A', '#3D0070', '#080012'],
      ['#10001F', '#470080', '#0D001A'],
      ['#08000F', '#300060', '#0D001A'],
    ],
    directions: [
      { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
      { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    ],
    glow: 'rgba(61,0,112,0.2)',
    badgeBg: '25',
    badgeText: '#C992FF',  // lilac — readable on dark purple
  },
  tsunami: {
    gradients: [
      ['#001A1A', '#005C5C', '#000F0F'],
      ['#001F1F', '#006666', '#001A1A'],
      ['#000F0F', '#004747', '#001A1A'],
    ],
    directions: [
      { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
      { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    ],
    glow: 'rgba(0,92,92,0.18)',
    badgeBg: '25',
    badgeText: '#5CDADA',
  },
  pi: {
    gradients: [
      ['#0D0026', '#3D0080', '#0A001A'],
      ['#10002E', '#4A0099', '#0D0026'],
      ['#0A0020', '#30006B', '#0D0026'],
    ],
    directions: [
      { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
      { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    ],
    glow: 'rgba(61,0,128,0.18)',
    badgeBg: '25',
    badgeText: '#C992FF',
  },
  gd: {
    gradients: [
      ['#001A20', '#006070', '#000F14'],
      ['#001F26', '#007080', '#001A20'],
      ['#000F14', '#005060', '#001A20'],
    ],
    directions: [
      { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
      { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    ],
    glow: 'rgba(0,96,112,0.18)',
    badgeBg: '25',
    badgeText: '#5CE8E8',
  },
};

/** Consistent "safe" text for badges when mode color would be illegible */
export function modeBadgeText(mode: GameMode): string {
  return MODE_THEMES[mode].badgeText;
}

/** Hex luminance check — returns true if color is light (needs dark text) */
export function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // WCAG relative luminance approximation
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 140;
}
