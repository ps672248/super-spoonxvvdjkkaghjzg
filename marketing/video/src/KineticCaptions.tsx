import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { fontFamily } from './Brand';
import { GOLD, WHITE } from './theme';

export const KineticCaptions: React.FC<{
  text: string;
  durationInFrames: number;
  format?: 'reel' | 'landscape';
  fontSize?: number;
}> = ({ text, durationInFrames, format = 'reel', fontSize }) => {
  const frame = useCurrentFrame();
  const isLandscape = format === 'landscape';
  const defaultSize = isLandscape ? 36 : 46;
  const size = fontSize || defaultSize;

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  // Active word calculation based on linear pacing across duration
  const startFrame = 6; // brief breathing room
  const speakingFrames = Math.max(1, durationInFrames - startFrame - 6);
  const framesPerWord = speakingFrames / words.length;

  const currentWordIdx = frame < startFrame
    ? 0
    : Math.min(words.length - 1, Math.floor((frame - startFrame) / framesPerWord));

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: isLandscape ? '10px 14px' : '12px 16px',
        fontFamily,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.25,
        textAlign: 'center',
        maxWidth: isLandscape ? 900 : 960,
      }}
    >
      {words.map((word, idx) => {
        const isActive = idx === currentWordIdx;
        const isPast = idx < currentWordIdx;
        const wordFrameProgress = (frame - startFrame - idx * framesPerWord) / framesPerWord;
        const pop = isActive ? interpolate(wordFrameProgress, [0, 0.3, 1], [1, 1.15, 1], { extrapolateRight: 'clamp' }) : 1;

        return (
          <span
            key={idx}
            style={{
              color: isActive ? GOLD : isPast ? WHITE : 'rgba(255, 255, 255, 0.45)',
              transform: `scale(${pop})`,
              display: 'inline-block',
              transition: 'color 0.15s ease',
              textShadow: isActive ? '0 0 25px rgba(253, 192, 3, 0.7)' : '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
