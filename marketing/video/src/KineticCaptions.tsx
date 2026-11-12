import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { fontFamily } from './Brand';
import { GOLD, WHITE } from './theme';

export const KineticCaptions: React.FC<{
  text: string;
  durationInFrames: number;
  format?: 'reel' | 'landscape';
  fontSize?: number;
  highlightColor?: string;
  showBackdrop?: boolean;
}> = ({
  text,
  durationInFrames,
  format = 'reel',
  fontSize,
  highlightColor = GOLD,
  showBackdrop = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isLandscape = format === 'landscape';
  const defaultSize = isLandscape ? 36 : 44;
  const size = fontSize || defaultSize;

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  // Brief 5-frame breathing room at beat entry & end
  const startFrame = 5;
  const speakingFrames = Math.max(1, durationInFrames - startFrame - 6);
  const framesPerWord = speakingFrames / words.length;

  const currentWordIdx =
    frame < startFrame
      ? 0
      : Math.min(words.length - 1, Math.floor((frame - startFrame) / framesPerWord));

  // If a sentence is long (> 10 words), window into chunks of ~8 words so it never overflows vertically
  const chunkSize = isLandscape ? 12 : 9;
  const chunkIdx = Math.floor(currentWordIdx / chunkSize);
  const chunkStart = chunkIdx * chunkSize;
  const visibleWords = words.slice(chunkStart, chunkStart + chunkSize);

  return (
    <div
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isLandscape ? '10px 14px' : '10px 15px',
        fontFamily,
        fontSize: size,
        fontWeight: 900,
        lineHeight: 1.24,
        textAlign: 'center',
        maxWidth: isLandscape ? 880 : 940,
        padding: showBackdrop ? (isLandscape ? '16px 26px' : '18px 28px') : 0,
        borderRadius: 24,
        background: showBackdrop ? 'rgba(8, 12, 22, 0.72)' : 'transparent',
        border: showBackdrop ? '1.5px solid rgba(255, 255, 255, 0.12)' : 'none',
        boxShadow: showBackdrop ? '0 14px 36px rgba(0, 0, 0, 0.55)' : 'none',
        backdropFilter: showBackdrop ? 'blur(10px)' : 'none',
      }}
    >
      {visibleWords.map((word, localIdx) => {
        const idx = chunkStart + localIdx;
        const isActive = idx === currentWordIdx;
        const isPast = idx < currentWordIdx;
        const wordLocalFrame = Math.max(0, frame - (startFrame + idx * framesPerWord));
        const wordPop = isActive
          ? spring({ frame: wordLocalFrame, fps, config: { damping: 10, mass: 0.45, stiffness: 220 } })
          : 0;
        const scale = isActive ? interpolate(wordPop, [0, 1], [1.0, 1.14]) : 1;
        const lift = isActive ? interpolate(wordPop, [0, 1], [0, -4]) : 0;

        // Numbers/stats automatically glow extra bright
        const isNumeric = /\d/.test(word);

        return (
          <span
            key={idx}
            style={{
              color: isActive
                ? highlightColor
                : isPast
                ? isNumeric
                  ? '#FEF08A'
                  : WHITE
                : 'rgba(255, 255, 255, 0.50)',
              transform: `translateY(${lift}px) scale(${scale})`,
              display: 'inline-block',
              WebkitTextStroke: '1.5px rgba(5, 8, 15, 0.85)',
              textShadow: isActive
                ? `0 0 24px ${highlightColor}CC, 0 4px 12px rgba(0,0,0,0.95)`
                : '0 3px 10px rgba(0,0,0,0.9)',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
