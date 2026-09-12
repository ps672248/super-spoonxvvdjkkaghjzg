import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { GOLD, INK, WHITE, VERTICAL_LABEL, LOGO_FILE } from './theme';
import type { Beat } from './NewsRecap';
import type { VideoThumbnail } from './adminVideoApproval';

const { fontFamily } = loadFont('normal', { weights: ['400', '600', '700', '800', '900'], subsets: ['latin'] });

export type ThumbnailCardProps = {
  vertical: string;
  headline: string;
  hookLine?: string;
  format?: 'reel' | 'landscape';
  badge?: string;
  thumbnail?: VideoThumbnail;
  beats?: Beat[];
  highlightStat?: {
    value: string;
    subtext: string;
    emoji?: string;
  };
};

export const ThumbnailCard: React.FC<ThumbnailCardProps> = ({
  vertical,
  headline,
  hookLine,
  format = 'landscape',
  badge = 'OFFICIAL NOTIFICATION',
  thumbnail,
  beats,
  highlightStat,
}) => {
  const isLandscape = format === 'landscape';
  const categoryLabel = VERTICAL_LABEL[vertical] ?? vertical.toUpperCase();

  // Smart fallback extraction if thumbnail object is not passed
  let fallbackHeroStat = highlightStat;
  if (!fallbackHeroStat && beats) {
    const statBeat = beats.find((b) => b.stat || b.mediaType === 'stat_callout');
    if (statBeat?.stat) {
      fallbackHeroStat = statBeat.stat;
    } else {
      const tableBeat = beats.find((b) => b.table);
      if (tableBeat) {
        fallbackHeroStat = { value: '500+ POSTS', subtext: 'Multiple Openings' };
      }
    }
  }

  // Resolved values per zone
  const topBadge = thumbnail?.topBar?.badge?.trim() || badge;
  const topCategory = thumbnail?.topBar?.category?.trim() || categoryLabel;

  const leftKicker = thumbnail?.leftColumn?.kicker?.trim() || hookLine || 'OFFICIAL BRIEFING';
  const leftHeadline = thumbnail?.leftColumn?.primaryHeadline?.trim() || headline;
  const leftSecondary = thumbnail?.leftColumn?.secondaryText?.trim() || '';
  const leftTrust = thumbnail?.leftColumn?.trustStamp?.trim() || '✓ 100% VERIFIED NOTICE';

  const rightCardHeader = thumbnail?.rightColumn?.cardHeader?.trim() || 'KEY HIGHLIGHT';
  const rightMetric = thumbnail?.rightColumn?.heroMetric?.trim() || fallbackHeroStat?.value || 'OFFICIAL';
  const rightSubtext = thumbnail?.rightColumn?.subtext?.trim() || fallbackHeroStat?.subtext || 'Complete Analysis Inside';

  return (
    <AbsoluteFill
      style={{
        background: '#060913',
        overflow: 'hidden',
        fontFamily,
      }}
    >
      {/* ─── Multi-Layer Atmospheric Lighting ─── */}
      {/* Dynamic Top-Left Gold Flare */}
      <div
        style={{
          position: 'absolute',
          width: isLandscape ? 1300 : 900,
          height: isLandscape ? 1000 : 700,
          left: -200,
          top: -200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253,192,3,0.24) 0%, rgba(253,192,3,0.06) 45%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Cyber Indigo / Blue Center Right Flare */}
      <div
        style={{
          position: 'absolute',
          width: isLandscape ? 1400 : 1000,
          height: isLandscape ? 1100 : 800,
          right: -250,
          bottom: isLandscape ? -200 : 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.28) 0%, rgba(59,130,246,0.14) 40%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Neon Crimson Accent Glow */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 600,
          left: -100,
          bottom: -150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.16) 0%, transparent 65%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Futuristic Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: isLandscape ? '70px 70px' : '60px 60px',
          opacity: 0.75,
        }}
      />

      {/* Corner Bracket Frame */}
      <div
        style={{
          position: 'absolute',
          inset: isLandscape ? 24 : 32,
          border: '1.5px solid rgba(253,192,3,0.22)',
          borderRadius: 24,
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.85)',
        }}
      />

      {isLandscape ? (
        /* ══════════════════════════════════════════════════════════════
           16:9 LONG-FORM YOUTUBE THUMBNAIL (1920 x 1080)
           Clean, High-CTR 60/40 Zoned Layout with Timestamp Safe Zone
           ══════════════════════════════════════════════════════════════ */
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 80px 48px 80px',
            boxSizing: 'border-box',
          }}
        >
          {/* 1. TOP BAR: Brand + Category Pill + Urgency Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #FDC003 0%, #D97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(253,192,3,0.65)',
                }}
              >
                <Img src={staticFile(LOGO_FILE)} style={{ width: 32, height: 32, objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 900, color: WHITE, letterSpacing: 0.5, lineHeight: 1 }}>
                  ASPIRANT ARCADE
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 4 }}>
                  Official Briefing
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
                  color: WHITE,
                  fontSize: 19,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  padding: '10px 24px',
                  borderRadius: 12,
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{topBadge}</span>
              </div>
              <div
                style={{
                  border: `2px solid ${GOLD}`,
                  color: GOLD,
                  fontSize: 19,
                  fontWeight: 900,
                  letterSpacing: 2,
                  padding: '9px 24px',
                  borderRadius: 999,
                  background: 'rgba(253, 192, 3, 0.12)',
                  boxShadow: '0 0 20px rgba(253,192,3,0.25)',
                }}
              >
                {topCategory}
              </div>
            </div>
          </div>

          {/* 2. MAIN SPLIT GRID (62% Left Focus + 38% Right Hero Metric Card) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 56,
              flex: 1,
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            {/* Left Column: Huge 2-Tone Headline, Kicker & Verified Badge */}
            <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {leftKicker ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    alignSelf: 'flex-start',
                    background: 'linear-gradient(90deg, #FDC003 0%, #F59E0B 100%)',
                    color: INK,
                    fontSize: 22,
                    fontWeight: 900,
                    padding: '8px 24px',
                    borderRadius: 10,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    boxShadow: '0 6px 24px rgba(253, 192, 3, 0.45)',
                  }}
                >
                  <span>⚡</span>
                  <span>{leftKicker}</span>
                </div>
              ) : null}

              <div
                style={{
                  fontSize: 68,
                  fontWeight: 900,
                  color: WHITE,
                  lineHeight: 1.1,
                  letterSpacing: -0.5,
                  textShadow: '0 10px 40px rgba(0,0,0,0.95)',
                }}
              >
                {leftHeadline}
              </div>

              {leftSecondary ? (
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#93C5FD',
                    letterSpacing: 0.5,
                    textShadow: '0 4px 15px rgba(0,0,0,0.8)',
                  }}
                >
                  {leftSecondary}
                </div>
              ) : null}

              {/* Verified Trust Stamp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(34, 197, 94, 0.16)',
                    border: '1.5px solid rgba(34, 197, 94, 0.45)',
                    padding: '7px 18px',
                    borderRadius: 999,
                    color: '#4ADE80',
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  <span>{leftTrust}</span>
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  • Full Official Breakdown
                </div>
              </div>
            </div>

            {/* Right Column: Sleek 3D Card focused purely on Hero Metric */}
            <div
              style={{
                flex: 0.82,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(145deg, rgba(26,38,66,0.92) 0%, rgba(11,17,31,0.96) 100%)',
                border: `3.5px solid ${GOLD}`,
                borderRadius: 32,
                padding: '42px 34px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.9), 0 0 50px rgba(253,192,3,0.35)',
                position: 'relative',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Card Header Pill */}
              <div
                style={{
                  position: 'absolute',
                  top: -18,
                  background: 'linear-gradient(90deg, #FDC003 0%, #D97706 100%)',
                  color: INK,
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: 2,
                  padding: '7px 24px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 18px rgba(253,192,3,0.5)',
                }}
              >
                • {rightCardHeader} •
              </div>

              {/* Massive Hero Metric (Clean, Bold, No Redundant Middle Emoji) */}
              <div
                style={{
                  fontSize: 62,
                  fontWeight: 900,
                  color: GOLD,
                  textAlign: 'center',
                  lineHeight: 1.05,
                  letterSpacing: -1,
                  textShadow: '0 0 35px rgba(253,192,3,0.5)',
                  margin: '12px 0',
                }}
              >
                {rightMetric}
              </div>

              {/* Explanatory Subtext Pill */}
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 800,
                  color: WHITE,
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.08)',
                  padding: '8px 22px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.14)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  maxWidth: '100%',
                }}
              >
                {rightSubtext}
              </div>
            </div>
          </div>

          {/* 3. BOTTOM STRIP: Clear, Unobstructed Safe Zone for YouTube Timestamp */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1.5px solid rgba(255,255,255,0.08)',
              paddingTop: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: 700 }}>
              <span>Aspirant Arcade Original Series</span>
              <span>•</span>
              <span>Free Engineering &amp; Govt Exam Prep</span>
            </div>

            {/* Bottom Right is left empty — YouTube overlay badge safe zone */}
            <div style={{ width: 140, height: 20 }} />
          </div>
        </AbsoluteFill>
      ) : (
        /* ══════════════════════════════════════════════════════════════
           9:16 VERTICAL REEL / SHORTS COVER (1080 x 1920)
           (Optimized for 9:16 View & Instagram 1:1 Square Grid Safe Zone)
           ══════════════════════════════════════════════════════════════ */
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '90px 60px 100px 60px',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          {/* Top Header: Brand Logo & Category Tag */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #FDC003 0%, #D97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(253,192,3,0.5)',
                }}
              >
                <Img src={staticFile(LOGO_FILE)} style={{ width: 28, height: 28, objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: WHITE, letterSpacing: 0.5 }}>
                Aspirant Arcade
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
                  color: WHITE,
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  padding: '7px 20px',
                  borderRadius: 8,
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                }}
              >
                {topBadge}
              </div>
              <div
                style={{
                  background: 'rgba(253,192,3,0.12)',
                  border: `2px solid ${GOLD}`,
                  color: GOLD,
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: 2,
                  padding: '6px 20px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                }}
              >
                {topCategory}
              </div>
            </div>
          </div>

          {/* Center Main Stage (Instagram 1:1 Safe Crop Area) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 28,
              width: '100%',
              maxWidth: 960,
            }}
          >
            {leftKicker ? (
              <div
                style={{
                  background: 'linear-gradient(90deg, #FDC003 0%, #F59E0B 100%)',
                  color: INK,
                  fontSize: 26,
                  fontWeight: 900,
                  padding: '12px 30px',
                  borderRadius: 14,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 28px rgba(253, 192, 3, 0.45)',
                }}
              >
                ⚡ {leftKicker}
              </div>
            ) : null}

            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: WHITE,
                lineHeight: 1.15,
                letterSpacing: -0.5,
                textShadow: '0 12px 40px rgba(0,0,0,0.95)',
              }}
            >
              {leftHeadline}
            </div>

            {leftSecondary ? (
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#93C5FD',
                  letterSpacing: 0.5,
                }}
              >
                {leftSecondary}
              </div>
            ) : null}

            {/* Central 3D Stat Highlight Card */}
            <div
              style={{
                width: '100%',
                background: 'linear-gradient(145deg, rgba(26,38,66,0.92) 0%, rgba(11,17,31,0.96) 100%)',
                border: `3.5px solid ${GOLD}`,
                borderRadius: 32,
                padding: '36px 28px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.9), 0 0 45px rgba(253,192,3,0.3)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                marginTop: 10,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #FDC003 0%, #D97706 100%)',
                  color: INK,
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: 2,
                  padding: '6px 22px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                }}
              >
                • {rightCardHeader} •
              </div>

              <div
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: GOLD,
                  lineHeight: 1.08,
                  textShadow: '0 0 30px rgba(253,192,3,0.5)',
                  margin: '8px 0',
                }}
              >
                {rightMetric}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: WHITE,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '8px 20px',
                  borderRadius: 14,
                  display: 'inline-block',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {rightSubtext}
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
            <div
              style={{
                background: 'linear-gradient(90deg, #FDC003 0%, #D97706 100%)',
                color: INK,
                fontSize: 26,
                fontWeight: 900,
                padding: '16px 44px',
                borderRadius: 999,
                boxShadow: '0 10px 35px rgba(253,192,3,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>▶</span>
              <span>TAP TO WATCH REEL</span>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

