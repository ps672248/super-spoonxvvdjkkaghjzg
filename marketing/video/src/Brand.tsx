import React from 'react';
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { loadFont } from '@remotion/google-fonts/Inter';
import { BORDER, GOLD, INK, MUTED, WHITE } from './theme';
import { OUTRO_FILE } from './audio';

const { fontFamily } = loadFont('normal', { weights: ['400', '700', '800'], subsets: ['latin'] });
export { fontFamily };

/** Top-left wordmark + top-right vertical tag pill. Stays on screen the whole video. */
export const Header: React.FC<{ tag: string }> = ({ tag }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ padding: '64px 56px', opacity }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: GOLD }} />
          <div style={{ fontFamily, fontSize: 34, fontWeight: 800, color: WHITE, letterSpacing: 0.5 }}>
            Aspirant Arcade
          </div>
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 22,
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 2,
            border: `2px solid ${BORDER}`,
            borderRadius: 999,
            padding: '10px 22px',
          }}
        >
          {tag.toUpperCase()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Frames the CTA outro runs for — 2s. Kept short on purpose: a long full-screen
 * CTA is where viewers swipe away and completion-rate (the main ranking signal)
 * dies. The exam-coverage pill grid was dropped for the same reason. */
export const CTA_OUTRO_SECONDS = 2;

/**
 * Compact full-screen closing CTA — the last beat of every reel. Headline +
 * download button + subscribe line, then a quick fade back to the dark base so
 * the loop back to frame 0 (also dark) reads seamlessly on Shorts/Reels.
 */
/** Channel handle + what it's for, shown INSTEAD of the subscribe pill when the
 *  article's exam has a Telegram channel. Replacing rather than adding keeps the
 *  outro at CTA_OUTRO_SECONDS with the same element count — a longer CTA is
 *  where completion rate dies (see the note above). */
export type TelegramCta = { handle: string; purpose?: string };

export const CTAOutro: React.FC<{
  tagline?: string;
  hasOutro?: boolean;
  telegram?: TelegramCta;
  /** True when a spoken CTA plays over this outro — the sting ducks so the
   *  voice isn't fighting it for the last two seconds. */
  duckOutroSting?: boolean;
}> = ({
  tagline = '6 game modes · AI mock interviews · no login',
  hasOutro,
  telegram,
  duckOutroSting,
}) => {
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
    <AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center' }}>
      {hasOutro && <Audio src={staticFile(OUTRO_FILE)} volume={duckOutroSting ? 0.25 : 0.8} />}
      <div
        style={{
          opacity: loopFade,
          transform: `scale(${0.85 + scale * 0.15})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          padding: '0 72px',
          textAlign: 'center',
        }}
      >
        <div style={{ opacity: headlineOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: GOLD, marginBottom: 24 }} />
          <div style={{ fontFamily, fontSize: 60, fontWeight: 800, color: WHITE, lineHeight: 1.15, whiteSpace: 'pre-line' }}>
            {'Practice free on\nAspirant Arcade'}
          </div>
        </div>

        <div style={{ opacity: ctaOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily, fontSize: 30, fontWeight: 800, color: INK, background: GOLD, borderRadius: 999, padding: '16px 44px' }}>
            📲 Download the app
          </div>
          <div
            style={{
              fontFamily,
              fontSize: 26,
              fontWeight: 700,
              color: WHITE,
              border: `2px solid ${GOLD}`,
              borderRadius: 999,
              padding: '14px 38px',
            }}
          >
            {telegram ? `✈️ ${telegram.handle}` : '🔔 Subscribe for daily questions'}
          </div>
          <div style={{ fontFamily, fontSize: 22, fontWeight: 400, color: MUTED, marginTop: 4 }}>
            {telegram?.purpose || tagline}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
