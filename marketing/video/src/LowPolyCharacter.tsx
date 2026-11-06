import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { fontFamily } from './Brand';
import audioEnvelopes from './audioEnvelopes.json';

export interface LowPolyMouthProps {
  amplitude: number; // 0.0 to 1.0
  centerX: string; // e.g. "59.9%"
  centerY: string; // e.g. "40.3%"
  baseWidth?: number; // default ~24
  maxHeight?: number; // default ~14
  rotationDeg?: number;
  lipColor?: string;
  cavityColor?: string;
  teethColor?: string;
}

export const LowPolyMouth: React.FC<LowPolyMouthProps> = ({
  amplitude,
  centerX,
  centerY,
  baseWidth = 24,
  maxHeight = 14,
  rotationDeg = 0,
  lipColor = 'rgba(100, 45, 30, 0.95)',
  cavityColor = '#1F0806',
  teethColor = '#F1F5F9',
}) => {
  // If amplitude is below speaking threshold, mouth stays closed (natural image)
  if (amplitude < 0.08) {
    return null;
  }

  // Normalize speech amplitude
  const normAmp = Math.min(1, Math.max(0, (amplitude - 0.08) / 0.82));
  const height = Math.max(3.5, normAmp * maxHeight);
  const width = baseWidth + normAmp * 5;

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX,
        top: centerY,
        transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: cavityColor,
        borderRadius: '3px 3px 6px 6px',
        border: `1.5px solid ${lipColor}`,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 15,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Upper teeth polygon */}
      {height > 5 && (
        <div
          style={{
            width: '85%',
            height: '2.5px',
            margin: '0 auto',
            backgroundColor: teethColor,
            borderRadius: '0 0 2px 2px',
          }}
        />
      )}
      {/* Lower tongue warm highlight */}
      {height > 8 && (
        <div
          style={{
            width: '70%',
            height: '2.5px',
            margin: '0 auto',
            backgroundColor: '#DC2626',
            borderRadius: '2px 2px 0 0',
            opacity: 0.85,
          }}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   NEWS ANCHOR ARJUN (Corner Presenter for News Recap)
   3D Low-Poly Arjun in Aspirant Arcade Varsity Jacket with
   Live Lip-Sync and subtle conversational head cadence
══════════════════════════════════════════════════════════════════ */
export interface NewsAnchorArjunProps {
  currentClipKey?: string;
  clipFrameOffset?: number;
}

export const NewsAnchorArjun: React.FC<NewsAnchorArjunProps> = ({
  currentClipKey,
  clipFrameOffset = 0,
}) => {
  const frame = useCurrentFrame();

  const ampArray = currentClipKey ? (audioEnvelopes as any)[currentClipKey] || [] : [];
  let amplitude = 0;
  if (ampArray.length > 0) {
    amplitude = ampArray[clipFrameOffset] || 0;
  } else if (currentClipKey) {
    // Dynamic procedural speech cadence fallback for newly generated / random news clips
    const syllableWave = Math.sin(clipFrameOffset / 2.7) * Math.cos(clipFrameOffset / 1.8);
    const speechPulse = Math.abs(syllableWave);
    const pauseCycle = (clipFrameOffset % 48) < 40 ? 1 : 0;
    amplitude = speechPulse > 0.15 ? speechPulse * 0.85 * pauseCycle : 0;
  }

  // Natural conversational head motion
  const headTilt = Math.sin(frame / 7) * 1.4;
  const headBob = Math.sin(frame / 4.5) * 2;

  return (
    <div
      style={{
        position: 'absolute',
        right: '24px',
        bottom: '44px',
        width: '280px',
        height: '375px',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '2.5px solid rgba(253, 192, 3, 0.8)',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(253, 192, 3, 0.25)',
        backgroundColor: '#0F172A',
        zIndex: 28,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Anchor Video Feed */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          transform: `rotate(${headTilt}deg) translateY(${headBob}px)`,
          transformOrigin: '50% 85%',
        }}
      >
        <Img
          src={staticFile('scenes/arjun_news_anchor.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Real-time audio-synced Lip Sync Mouth */}
        <LowPolyMouth
          amplitude={amplitude}
          centerX="31.25%"
          centerY="49.17%"
          baseWidth={18}
          maxHeight={13}
          rotationDeg={-4}
          lipColor="rgba(100, 45, 30, 0.95)"
        />

        {/* Ambient Desk Light Glow Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 15% 40%, rgba(253, 192, 3, 0.15) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Anchor Lower-Third Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '12px',
          padding: '6px 10px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          borderRadius: '999px',
          border: '1px solid rgba(253, 192, 3, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22C55E',
            boxShadow: '0 0 8px #22C55E',
          }}
        />
        <span
          style={{
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            fontFamily,
          }}
        >
          ARJUN • LIVE ANCHOR
        </span>
      </div>
    </div>
  );
};

