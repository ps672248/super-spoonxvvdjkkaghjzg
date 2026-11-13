import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { Audio } from '@remotion/media';
import { loadFont } from '@remotion/google-fonts/Inter';
import { GOLD, INK, WHITE, VERTICAL_LABEL, LOGO_FILE } from './theme';
import { BGM_FILE, BGM_INSTA_TRENDING_FILE } from './audio';
import type { Beat } from './NewsRecap';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800', '900'],
  subsets: ['latin'],
});

export type InstaFramePoint = {
  icon: string;
  label: string;
  value: string;
  subtext?: string;
};

export type InstaFrameHeroStat = {
  metric: string;
  label: string;
  subtext?: string;
};

export type InstaFrameBottomCta = {
  saveText?: string;
  followText?: string;
  downloadText?: string;
};

export type InstaFrameData = {
  badge?: string;
  category?: string;
  kicker?: string;
  headline?: string;
  heroStat?: InstaFrameHeroStat;
  points?: InstaFramePoint[];
  bottomCta?: InstaFrameBottomCta;
};

export type NewsRecapSingleFrameProps = {
  vertical: string;
  headline: string;
  hookLine?: string;
  beats?: Beat[];
  instaFrame?: InstaFrameData;
  hasBgm?: boolean;
  hasInstaTrendingBgm?: boolean;
};

export const NEWS_RECAP_SINGLE_FRAME_FPS = 30;
export const NEWS_RECAP_SINGLE_FRAME_DURATION = 180; // exactly 6.0 seconds at 30 FPS

export const NewsRecapSingleFrame: React.FC<NewsRecapSingleFrameProps> = ({
  vertical,
  headline,
  hookLine,
  beats,
  instaFrame,
  hasBgm = true,
  hasInstaTrendingBgm = false,
}) => {
  const frame = useCurrentFrame();

  // Gentle micro-motion to avoid compression banding & keep the video dynamic
  const scale = interpolate(frame, [0, 90, 180], [1, 1.018, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const glowPulse = interpolate(frame, [0, 90, 180], [0.24, 0.38, 0.24], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Category and badge derivation
  const categoryLabel =
    instaFrame?.category || VERTICAL_LABEL[vertical] || vertical.toUpperCase();
  const topBadge = instaFrame?.badge || '🚨 OFFICIAL NOTICE';
  const kicker = instaFrame?.kicker || hookLine || '⚡ MASSIVE VACANCY ALERT';
  const primaryHeadline = instaFrame?.headline || headline;

  // Hero Stat extraction with smart fallback to beats
  let heroStat = instaFrame?.heroStat;
  if (!heroStat && beats) {
    const statBeat = beats.find((b) => b.stat || b.mediaType === 'stat_callout');
    if (statBeat?.stat) {
      heroStat = {
        metric: statBeat.stat.value,
        label: statBeat.label || 'KEY METRIC',
        subtext: statBeat.stat.subtext,
      };
    }
  }
  if (!heroStat) {
    heroStat = {
      metric: 'OFFICIAL',
      label: 'EXAM NOTIFICATION',
      subtext: 'Complete Details Inside',
    };
  }

  // 4 Structured Points extraction
  let points = instaFrame?.points;
  if (!points || points.length === 0) {
    const fallbackBeats = beats && beats.length > 0 ? beats.slice(0, 4) : [];
    const defaultIcons = ['📅', '💰', '🎓', '📝'];
    points = fallbackBeats.map((b, i) => ({
      icon: b.emoji || defaultIcons[i % defaultIcons.length] || '📌',
      label: b.label || `Point ${i + 1}`,
      value: b.text || 'Check notification details',
      subtext: b.mediaType === 'table' ? 'Structured vacancy matrix' : undefined,
    }));
  }
  // Guarantee exactly up to 4 points
  const displayPoints = points.slice(0, 4);

  // Bottom CTAs
  const saveText =
    instaFrame?.bottomCta?.saveText || '📌 SAVE THIS REEL TO PREPARE LATER';
  const followText =
    instaFrame?.bottomCta?.followText || '🔔 FOLLOW FOR UPDATES';
  const downloadText =
    instaFrame?.bottomCta?.downloadText || '📲 DOWNLOAD APP (BIO)';

  // Audio track: Low-tone trending BGM with smooth fade in/out
  const audioSource = hasInstaTrendingBgm ? BGM_INSTA_TRENDING_FILE : BGM_FILE;
  const canPlayAudio = hasInstaTrendingBgm || hasBgm;

  return (
    <AbsoluteFill
      style={{
        background: '#060913',
        overflow: 'hidden',
        fontFamily,
      }}
    >
      {/* ─── Low-Tone Background Music (No Speech, No SFX) ─── */}
      {canPlayAudio ? (
        <Audio
          src={staticFile(audioSource)}
          volume={(f) =>
            interpolate(f, [0, 15, 165, 180], [0, 0.18, 0.18, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
          loop
        />
      ) : null}

      {/* ─── Atmospheric Lighting Flares ─── */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 700,
          left: -200,
          top: -200,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(253,192,3,${glowPulse}) 0%, rgba(253,192,3,0.06) 45%, transparent 70%)`,
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 800,
          right: -250,
          bottom: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.30) 0%, rgba(59,130,246,0.12) 40%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* ─── Main Single-Frame Layout with Subtle Breathing Motion ─── */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '80px 48px 100px 48px',
          boxSizing: 'border-box',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* 1. TOP HEADER: Brand Identity & Status Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Brand Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(255,255,255,0.06)',
              padding: '8px 22px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FDC003 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(253,192,3,0.5)',
              }}
            >
              <img
                src={staticFile(LOGO_FILE)}
                alt="Aspirant Arcade"
                style={{ width: 22, height: 22, objectFit: 'contain' }}
              />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: WHITE, letterSpacing: 0.5 }}>
              Aspirant Arcade
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>
              • Daily Exam News
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
                color: WHITE,
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: 1.5,
                padding: '6px 18px',
                borderRadius: 8,
                textTransform: 'uppercase',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
              }}
            >
              {topBadge}
            </div>
            <div
              style={{
                background: 'rgba(253,192,3,0.14)',
                border: `2px solid ${GOLD}`,
                color: GOLD,
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: 1.5,
                padding: '5px 18px',
                borderRadius: 999,
                textTransform: 'uppercase',
              }}
            >
              {categoryLabel}
            </div>
          </div>
        </div>

        {/* 2. CENTER ZONE: Kicker, Big Headline & Hero Stat */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            width: '100%',
            maxWidth: 980,
            textAlign: 'center',
          }}
        >
          {kicker ? (
            <div
              style={{
                background: 'linear-gradient(90deg, #FDC003 0%, #F59E0B 100%)',
                color: INK,
                fontSize: 22,
                fontWeight: 900,
                padding: '8px 24px',
                borderRadius: 12,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                boxShadow: '0 6px 20px rgba(253, 192, 3, 0.4)',
              }}
            >
              {kicker}
            </div>
          ) : null}

          <div
            style={{
              fontSize: 54,
              fontWeight: 900,
              color: WHITE,
              lineHeight: 1.15,
              letterSpacing: -0.5,
              textShadow: '0 8px 30px rgba(0,0,0,0.9)',
              margin: '2px 0',
            }}
          >
            {primaryHeadline}
          </div>

          {/* Central 3D Stat Callout */}
          <div
            style={{
              width: '100%',
              background: 'linear-gradient(145deg, rgba(26,38,66,0.92) 0%, rgba(11,17,31,0.96) 100%)',
              border: `3px solid ${GOLD}`,
              borderRadius: 24,
              padding: '24px 20px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.9), 0 0 35px rgba(253,192,3,0.25)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              marginTop: 4,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(90deg, #FDC003 0%, #D97706 100%)',
                color: INK,
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: 1.5,
                padding: '4px 18px',
                borderRadius: 999,
                textTransform: 'uppercase',
              }}
            >
              • {heroStat.label} •
            </div>

            <div
              style={{
                fontSize: 66,
                fontWeight: 900,
                color: GOLD,
                lineHeight: 1.05,
                textShadow: '0 0 30px rgba(253,192,3,0.6)',
                margin: '6px 0',
              }}
            >
              {heroStat.metric}
            </div>

            {heroStat.subtext ? (
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: WHITE,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '6px 18px',
                  borderRadius: 12,
                  display: 'inline-block',
                  border: '1px solid rgba(255,255,255,0.14)',
                }}
              >
                {heroStat.subtext}
              </div>
            ) : null}
          </div>

          {/* 3. 4-QUADRANT STRUCTURED INFO MATRIX */}
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 14,
              marginTop: 8,
              textAlign: 'left',
            }}
          >
            {displayPoints.map((pt, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 18,
                  padding: '16px 18px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{pt.icon}</span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: idx === 0 ? '#FDE047' : idx === 1 ? '#86EFAC' : idx === 2 ? '#93C5FD' : '#C084FC',
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {pt.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: WHITE,
                    lineHeight: 1.25,
                    marginTop: 2,
                  }}
                >
                  {pt.value}
                </div>
                {pt.subtext ? (
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>
                    {pt.subtext}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* 4. BOTTOM-MOST CONVERSION FOOTER: FOLLOW & DOWNLOAD CTA */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            maxWidth: 980,
          }}
        >
          {/* Save Callout Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#FDE047',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 0.8,
            }}
          >
            <span>📌</span>
            <span>{saveText}</span>
          </div>

          {/* Primary Dual Conversion Strip */}
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 14,
            }}
          >
            {/* Follow Button */}
            <div
              style={{
                background: 'linear-gradient(90deg, #E11D48 0%, #DC2626 100%)',
                color: WHITE,
                fontSize: 18,
                fontWeight: 900,
                padding: '16px 12px',
                borderRadius: 18,
                boxShadow: '0 8px 24px rgba(225, 29, 72, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                border: '1.5px solid rgba(255,255,255,0.2)',
                textAlign: 'center',
              }}
            >
              <span>🔔</span>
              <span>{followText}</span>
            </div>

            {/* Download App Button */}
            <div
              style={{
                background: 'linear-gradient(90deg, #FDC003 0%, #D97706 100%)',
                color: INK,
                fontSize: 18,
                fontWeight: 900,
                padding: '16px 12px',
                borderRadius: 18,
                boxShadow: '0 8px 24px rgba(253,192,3,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                border: '1.5px solid #FDE047',
                textAlign: 'center',
              }}
            >
              <span>📲</span>
              <span>{downloadText}</span>
            </div>
          </div>

          {/* Micro Trust Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: 'rgba(255,255,255,0.45)',
              fontSize: 14,
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            <span>✓ Free Daily MCQs</span>
            <span>•</span>
            <span>✓ Study Notes &amp; PYQs</span>
            <span>•</span>
            <span>aspirant-arcade.xyz</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
