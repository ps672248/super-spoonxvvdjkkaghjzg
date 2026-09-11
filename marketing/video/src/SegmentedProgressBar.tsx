import React from 'react';
import { GOLD } from './theme';

export const SegmentedProgressBar: React.FC<{
  currentBeatIndex: number; // 0 is headline, 1..N are beats
  totalBeats: number;      // total items including headline
  beatProgress: number;    // 0..1 progress inside current beat
  format?: 'reel' | 'landscape';
}> = ({ currentBeatIndex, totalBeats, beatProgress, format = 'reel' }) => {
  const isLandscape = format === 'landscape';

  return (
    <div
      style={{
        position: 'absolute',
        top: isLandscape ? 20 : 36,
        left: isLandscape ? 48 : 56,
        right: isLandscape ? 48 : 56,
        display: 'flex',
        gap: 8,
        zIndex: 50,
      }}
    >
      {Array.from({ length: totalBeats }).map((_, i) => {
        let fill = 0;
        if (i < currentBeatIndex) fill = 1;
        else if (i === currentBeatIndex) fill = Math.min(1, Math.max(0, beatProgress));

        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: isLandscape ? 5 : 6,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${fill * 100}%`,
                height: '100%',
                background: GOLD,
                boxShadow: fill > 0 ? '0 0 10px rgba(253, 192, 3, 0.8)' : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
