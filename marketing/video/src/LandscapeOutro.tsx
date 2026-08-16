import React from 'react';
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { loadFont } from '@remotion/google-fonts/Inter';
import { INK, GOLD, WHITE, MUTED } from './theme';
import { OUTRO_FILE } from './audio';

const { fontFamily } = loadFont('normal', { weights: ['400', '700', '800'], subsets: ['latin'] });

export const LandscapeOutro: React.FC<{ hasOutro?: boolean }> = ({ hasOutro = true }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14 } });

  const headlineOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const ctaOpacity = interpolate(frame, [6, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // loop-friendly: dip content to the dark base over the last ~6 frames
  const loopFade = interpolate(frame, [durationInFrames - 6, durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center', fontFamily }}>
      {hasOutro && <Audio src={staticFile(OUTRO_FILE)} volume={0.8} />}

      <div style={{
        opacity: loopFade,
        transform: `scale(${0.9 + scale * 0.1})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        width: '100%',
        maxHeight: '100%',
        justifyContent: 'center',
        padding: '20px 40px',
        boxSizing: 'border-box',
      }}>
        {/* Title */}
        <div style={{ opacity: headlineOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: GOLD }} />
          <h1 style={{ margin: 0, fontSize: 44, fontWeight: 800, color: WHITE, textAlign: 'center', letterSpacing: 0.5 }}>
            Practice Free on Aspirant Arcade
          </h1>
          <p style={{ margin: 0, fontSize: 20, color: MUTED, textAlign: 'center' }}>
            6 game modes • AI mock interviews • No login required
          </p>
        </div>

        {/* CTA Buttons Row */}
        <div style={{
          opacity: ctaOpacity,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: 24,
          width: '100%',
          maxWidth: 1100,
          marginTop: 10,
        }}>
          {/* CTA 1: Download */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: GOLD,
            color: INK,
            borderRadius: 12,
            padding: '24px 16px',
            boxShadow: '0 4px 15px rgba(253, 192, 3, 0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📲</div>
            <div style={{ fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Download App</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4, opacity: 0.8 }}>Get the Android APK / Play Store</div>
          </div>

          {/* CTA 2: Web Search */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${GOLD}`,
            color: WHITE,
            borderRadius: 12,
            padding: '24px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌐</div>
            <div style={{ fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Search on Web</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4, color: MUTED }}>Visit aspirant-arcade.xyz</div>
          </div>

          {/* CTA 3: Subscribe */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${WHITE}`,
            color: WHITE,
            borderRadius: 12,
            padding: '24px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Subscribe</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4, color: MUTED }}>For daily updates</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
