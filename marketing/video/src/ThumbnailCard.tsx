import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { GOLD, INK, PANEL, BORDER, WHITE, MUTED, VERTICAL_LABEL, LOGO_FILE } from './theme';
import type { Beat } from './NewsRecap';

const { fontFamily } = loadFont('normal', { weights: ['400', '600', '700', '800', '900'], subsets: ['latin'] });

export type ThumbnailCardProps = {
  vertical: string;
  headline: string;
  hookLine?: string;
  format?: 'reel' | 'landscape';
  badge?: string;
  beats?: Beat[];
  highlightStat?: {
    value: string;
    subtext: string;
    emoji?: string;
  };
  keyPills?: string[];
};

export const ThumbnailCard: React.FC<ThumbnailCardProps> = ({
  vertical,
  headline,
  hookLine,
  format = 'landscape',
  badge = 'OFFICIAL NOTIFICATION',
  beats,
  highlightStat,
  keyPills,
}) => {
  const isLandscape = format === 'landscape';
  const categoryLabel = VERTICAL_LABEL[vertical] ?? vertical.toUpperCase();

  // Extract smart highlight stat from beats if not provided
  let heroStat = highlightStat;
  if (!heroStat && beats) {
    const statBeat = beats.find((b) => b.stat || b.mediaType === 'stat_callout');
    if (statBeat?.stat) {
      heroStat = statBeat.stat;
    } else {
      const tableBeat = beats.find((b) => b.table);
      if (tableBeat) {
        heroStat = { value: '500+ POSTS', subtext: 'Multiple Branches Open', emoji: '📊' };
      }
    }
  }

  // Extract smart feature pills if not provided
  let pills = keyPills;
  if (!pills && beats) {
    pills = beats
      .filter((b) => b.label && b.label !== 'VACANCIES')
      .slice(0, 3)
      .map((b) => (b.emoji ? `${b.emoji} ${b.label}` : b.label));
  }
  if (!pills || pills.length === 0) {
    pills = ['⚡ Full Eligibility', '📝 Exam Pattern', '⏳ Apply Online'];
  }

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
          background: 'radial-gradient(circle, rgba(253,192,3,0.22) 0%, rgba(253,192,3,0.06) 45%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, rgba(59,130,246,0.12) 40%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Neon Crimson Accent Glow (bottom left) */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 600,
          left: -100,
          bottom: -150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 65%)',
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

      {/* Corner Bracket Accents for Arcade / Tech Vibe */}
      <div
        style={{
          position: 'absolute',
          inset: isLandscape ? 24 : 32,
          border: '1.5px solid rgba(253,192,3,0.2)',
          borderRadius: 24,
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.85)',
        }}
      />

      {isLandscape ? (
        /* ══════════════════════════════════════════════════════════════
           16:9 LONG-FORM YOUTUBE THUMBNAIL (1920 x 1080)
           ══════════════════════════════════════════════════════════════ */
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '50px 76px 46px 76px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Bar: Brand, Category, & High-Contrast Alert Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #FDC003 0%, #D97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 28px rgba(253,192,3,0.6)',
                }}
              >
                <Img src={staticFile(LOGO_FILE)} style={{ width: 30, height: 30, objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: WHITE, letterSpacing: 0.5, lineHeight: 1 }}>
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
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  padding: '9px 22px',
                  borderRadius: 10,
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>🚨</span>
                <span>{badge}</span>
              </div>
              <div
                style={{
                  border: `2px solid ${GOLD}`,
                  color: GOLD,
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: 2,
                  padding: '8px 22px',
                  borderRadius: 999,
                  background: 'rgba(253, 192, 3, 0.1)',
                  boxShadow: '0 0 20px rgba(253,192,3,0.2)',
                }}
              >
                {categoryLabel}
              </div>
            </div>
          </div>

          {/* Main Hero Split Grid (60% Left Title + 40% Right 3D Highlight Card) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 48,
              flex: 1,
              marginTop: 18,
              marginBottom: 18,
            }}
          >
            {/* Left Column: Giant Catchy 2-Tone Headline & Sub-Hook */}
            <div style={{ flex: 1.35, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {hookLine ? (
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
                    letterSpacing: 0.8,
                    boxShadow: '0 6px 24px rgba(253, 192, 3, 0.4)',
                  }}
                >
                  <span>⚡</span>
                  <span>{hookLine.toUpperCase()}</span>
                </div>
              ) : null}

              <div
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: WHITE,
                  lineHeight: 1.12,
                  letterSpacing: -0.5,
                  textShadow: '0 10px 35px rgba(0,0,0,0.95)',
                }}
              >
                {headline}
              </div>

              {/* Verified Trust Stamp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1.5px solid rgba(34, 197, 94, 0.4)',
                    padding: '6px 16px',
                    borderRadius: 999,
                    color: '#4ADE80',
                    fontSize: 15,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  <span>✓</span>
                  <span>100% VERIFIED NOTIFICATION</span>
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  • Complete Breakdown Inside
                </div>
              </div>
            </div>

            {/* Right Column: 3D Glossy Stat Card */}
            <div
              style={{
                flex: 0.85,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(145deg, rgba(26,38,66,0.9) 0%, rgba(11,17,31,0.95) 100%)',
                border: `3px solid ${GOLD}`,
                borderRadius: 32,
                padding: '38px 32px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.85), 0 0 45px rgba(253,192,3,0.3)',
                position: 'relative',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Highlight Badge Pill */}
              <div
                style={{
                  position: 'absolute',
                  top: -18,
                  background: 'linear-gradient(90deg, #FDC003 0%, #D97706 100%)',
                  color: INK,
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: 2,
                  padding: '7px 22px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 18px rgba(253,192,3,0.5)',
                }}
              >
                🔥 KEY HIGHLIGHT
              </div>

              {heroStat ? (
                <>
                  <div style={{ fontSize: 56, marginBottom: 6 }}>{heroStat.emoji || '💰'}</div>
                  <div
                    style={{
                      fontSize: 50,
                      fontWeight: 900,
                      color: GOLD,
                      textAlign: 'center',
                      lineHeight: 1.08,
                      textShadow: '0 0 25px rgba(253,192,3,0.45)',
                      letterSpacing: -0.5,
                    }}
                  >
                    {heroStat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: WHITE,
                      textAlign: 'center',
                      marginTop: 10,
                      background: 'rgba(255,255,255,0.08)',
                      padding: '6px 18px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {heroStat.subtext}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 56, marginBottom: 6 }}>📢</div>
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 900,
                      color: GOLD,
                      textAlign: 'center',
                      textShadow: '0 0 25px rgba(253,192,3,0.45)',
                    }}
                  >
                    APPLY NOW
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: WHITE,
                      textAlign: 'center',
                      marginTop: 10,
                      background: 'rgba(255,255,255,0.08)',
                      padding: '6px 18px',
                      borderRadius: 12,
                    }}
                  >
                    Full Eligibility Details
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Feature Badges & High-CTR CTA Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '2px solid rgba(255,255,255,0.1)',
              paddingTop: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {pills.map((pill, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.18)',
                    color: WHITE,
                    fontSize: 19,
                    fontWeight: 800,
                    padding: '10px 24px',
                    borderRadius: 999,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  }}
                >
                  {pill}
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'linear-gradient(90deg, #FDC003 0%, #D97706 100%)',
                color: INK,
                fontSize: 20,
                fontWeight: 900,
                padding: '12px 28px',
                borderRadius: 999,
                boxShadow: '0 6px 25px rgba(253,192,3,0.45)',
              }}
            >
              <span>WATCH FULL BREAKDOWN</span>
              <span style={{ fontSize: 22 }}>➔</span>
            </div>
          </div>
        </AbsoluteFill>
      ) : (
        /* ══════════════════════════════════════════════════════════════
           9:16 VERTICAL REEL / SHORTS COVER (1080 x 1920)
           (Optimized for both Full 9:16 View AND 1:1 Instagram Grid Safe Zone)
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
                🚨 {badge}
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
                {categoryLabel}
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
            {hookLine ? (
              <div
                style={{
                  background: 'linear-gradient(90deg, #FDC003 0%, #F59E0B 100%)',
                  color: INK,
                  fontSize: 26,
                  fontWeight: 900,
                  padding: '12px 30px',
                  borderRadius: 14,
                  letterSpacing: 0.5,
                  boxShadow: '0 8px 28px rgba(253, 192, 3, 0.45)',
                }}
              >
                ⚡ {hookLine.toUpperCase()}
              </div>
            ) : null}

            <div
              style={{
                fontSize: 60,
                fontWeight: 900,
                color: WHITE,
                lineHeight: 1.16,
                letterSpacing: -0.5,
                textShadow: '0 12px 40px rgba(0,0,0,0.95)',
              }}
            >
              {headline}
            </div>

            {/* Central 3D Stat Highlight Card */}
            {heroStat ? (
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
                    padding: '6px 20px',
                    borderRadius: 999,
                    textTransform: 'uppercase',
                  }}
                >
                  🔥 KEY HIGHLIGHT
                </div>

                <div style={{ fontSize: 54, marginBottom: 6 }}>{heroStat.emoji || '💰'}</div>
                <div
                  style={{
                    fontSize: 54,
                    fontWeight: 900,
                    color: GOLD,
                    lineHeight: 1.08,
                    textShadow: '0 0 30px rgba(253,192,3,0.5)',
                  }}
                >
                  {heroStat.value}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: WHITE,
                    marginTop: 10,
                    background: 'rgba(255,255,255,0.08)',
                    padding: '8px 20px',
                    borderRadius: 14,
                    display: 'inline-block',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {heroStat.subtext}
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom Action Footer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              {pills.map((pill, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.16)',
                    color: WHITE,
                    fontSize: 22,
                    fontWeight: 800,
                    padding: '10px 24px',
                    borderRadius: 999,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {pill}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 10,
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

