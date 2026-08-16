import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { GOLD } from './theme';

/**
 * Shared motion layers used by both compositions — the "not a static slideshow"
 * kit: an animated backdrop, a top progress bar, a slow Ken Burns container,
 * and a confetti burst for the quiz reveal. All deterministic (seeded/frame-driven),
 * no extra deps.
 */

/** Two slow-drifting radial gradient blobs + a faint parallax grid behind the content. */
export const AnimatedBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / Math.max(1, durationInFrames);

  const x1 = interpolate(t, [0, 1], [-140, 60]);
  const y1 = interpolate(t, [0, 1], [-80, 140]);
  const x2 = interpolate(t, [0, 1], [120, -80]);
  const y2 = interpolate(t, [0, 1], [160, -60]);
  const gridShift = interpolate(t, [0, 1], [0, 90]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          width: 1100,
          height: 1100,
          left: -300 + x1,
          top: -250 + y1,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253,192,3,0.10) 0%, rgba(253,192,3,0) 62%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1300,
          height: 1300,
          right: -450 + x2,
          bottom: -400 + y2,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0) 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: -120,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          transform: `translate(${gridShift * 0.4}px, ${gridShift}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Thin gold bar across the very top — fills over the whole video (retention cue). */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = Math.min(100, (frame / Math.max(1, durationInFrames)) * 100);
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'rgba(255,255,255,0.06)', zIndex: 50 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: GOLD, borderRadius: '0 5px 5px 0' }} />
    </div>
  );
};

/** Slow push-in over a scene's own frames — wrap each scene's content in this. */
export const KenBurns: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({ durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames)], [1, 1.045], {
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
};

/** Deterministic full-screen confetti burst — fires over its parent Sequence's first ~1.2s. */
export const ConfettiBurst: React.FC<{ originYPct?: number }> = ({ originYPct = 55 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const life = 1.2 * fps;
  if (frame > life) return null;
  const t = frame / life;

  const COLORS = [GOLD, '#22C55E', '#6366F1', '#EC4899', '#FFFFFF'];
  const pieces = Array.from({ length: 28 }, (_, i) => {
    // seeded pseudo-random per piece — stable across frames
    const rand = (n: number) => {
      const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const angle = rand(1) * Math.PI * 2;
    const speed = 380 + rand(2) * 520;
    const dx = Math.cos(angle) * speed * t;
    const dy = Math.sin(angle) * speed * t + 640 * t * t; // gravity
    const rot = rand(3) * 720 * t;
    const size = 12 + rand(4) * 14;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: '50%',
          top: `${originYPct}%`,
          width: size,
          height: size * 0.6,
          background: COLORS[i % COLORS.length],
          borderRadius: 3,
          opacity: 1 - t,
          transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
        }}
      />
    );
  });

  return <AbsoluteFill style={{ pointerEvents: 'none' }}>{pieces}</AbsoluteFill>;
};
