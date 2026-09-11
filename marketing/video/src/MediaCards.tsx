import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from 'remotion';
import { fontFamily } from './Brand';
import { BORDER, GOLD, INK, PANEL, WHITE, MUTED, CORRECT_GREEN } from './theme';

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface StatCalloutData {
  value: string;
  subtext: string;
  emoji?: string;
}

export interface ChecklistData {
  items: string[];
}

export interface ComparisonData {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}

export interface QuoteData {
  text: string;
  source?: string;
  author?: string;
}

export interface GifData {
  gifUrl?: string;
  stickerPreset?: 'alert' | 'fire' | 'clock' | 'money' | 'celebrate' | 'target';
}

const STICKER_ICONS: Record<string, string> = {
  alert: '🚨',
  fire: '🔥',
  clock: '⏳',
  money: '💰',
  celebrate: '🎉',
  target: '🎯',
};

/* ─── Table Card Component ─── */
export const TableCard: React.FC<{
  table: TableData;
  format?: 'reel' | 'landscape';
  durationInFrames: number;
}> = ({ table, format = 'reel' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const isLandscape = format === 'landscape';

  const headers = table.headers || [];
  const rows = table.rows || [];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isLandscape ? 860 : 960,
        opacity: Math.min(1, enter * 1.2),
        transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])}) translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
        background: 'rgba(15, 21, 32, 0.88)',
        border: `2px solid ${GOLD}`,
        borderRadius: 20,
        padding: isLandscape ? '24px 32px' : '28px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(253, 192, 3, 0.15)',
        backdropFilter: 'blur(16px)',
        fontFamily,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid rgba(253, 192, 3, 0.4)` }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: isLandscape ? '12px 18px' : '14px 16px',
                  color: GOLD,
                  fontSize: isLandscape ? 22 : 24,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => {
            const rowDelay = 8 + rIdx * 5;
            const rowEnter = spring({ frame: Math.max(0, frame - rowDelay), fps, config: { damping: 12 } });
            return (
              <tr
                key={rIdx}
                style={{
                  opacity: rowEnter,
                  transform: `translateX(${interpolate(rowEnter, [0, 1], [-20, 0])}px)`,
                  borderBottom: rIdx === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  background: rIdx % 2 === 1 ? 'rgba(255,255,255,0.03)' : 'transparent',
                }}
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    style={{
                      padding: isLandscape ? '14px 18px' : '16px',
                      color: cIdx === 0 ? WHITE : '#E2E8F0',
                      fontSize: isLandscape ? 24 : 26,
                      fontWeight: cIdx === 0 ? 700 : 500,
                      lineHeight: 1.3,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ─── Stat Hero Callout Card ─── */
export const StatCard: React.FC<{
  stat: StatCalloutData;
  format?: 'reel' | 'landscape';
}> = ({ stat, format = 'reel' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 10, mass: 0.7 } });
  const isLandscape = format === 'landscape';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isLandscape ? '36px 48px' : '44px 32px',
        background: 'radial-gradient(circle at center, rgba(253,192,3,0.18) 0%, rgba(15,21,32,0.92) 70%)',
        border: `3px solid ${GOLD}`,
        borderRadius: 28,
        boxShadow: '0 0 60px rgba(253, 192, 3, 0.35)',
        transform: `scale(${interpolate(enter, [0, 1], [0.75, 1])})`,
        opacity: enter,
        fontFamily,
        textAlign: 'center',
        maxWidth: isLandscape ? 700 : 880,
      }}
    >
      {stat.emoji ? (
        <div style={{ fontSize: isLandscape ? 56 : 72, marginBottom: 12 }}>
          {stat.emoji}
        </div>
      ) : null}
      <div
        style={{
          fontSize: isLandscape ? 68 : 82,
          fontWeight: 900,
          color: GOLD,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          textShadow: '0 0 30px rgba(253,192,3,0.5)',
        }}
      >
        {stat.value}
      </div>
      <div
        style={{
          fontSize: isLandscape ? 28 : 34,
          fontWeight: 700,
          color: WHITE,
          marginTop: 14,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}
      >
        {stat.subtext}
      </div>
    </div>
  );
};

/* ─── Image Card with KenBurns Zoom ─── */
export const ImageCard: React.FC<{
  mediaUrl: string;
  caption?: string;
  format?: 'reel' | 'landscape';
  durationInFrames: number;
}> = ({ mediaUrl, caption, format = 'reel', durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const isLandscape = format === 'landscape';

  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.08], { extrapolateRight: 'clamp' });
  const src = mediaUrl.startsWith('http') ? mediaUrl : staticFile(mediaUrl);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isLandscape ? 820 : 920,
        height: isLandscape ? 480 : 640,
        borderRadius: 24,
        overflow: 'hidden',
        border: `2px solid ${GOLD}`,
        boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
        position: 'relative',
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
      }}
    >
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${zoom})`,
        }}
      />
      {caption ? (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
            color: WHITE,
            fontFamily,
            fontSize: isLandscape ? 22 : 26,
            fontWeight: 700,
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
};

/* ─── Video Clip Card ─── */
export const VideoClipCard: React.FC<{
  mediaUrl: string;
  volume?: number;
  format?: 'reel' | 'landscape';
}> = ({ mediaUrl, volume = 0, format = 'reel' }) => {
  const isLandscape = format === 'landscape';
  const src = mediaUrl.startsWith('http') ? mediaUrl : staticFile(mediaUrl);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isLandscape ? 840 : 920,
        height: isLandscape ? 480 : 600,
        borderRadius: 24,
        overflow: 'hidden',
        border: `2px solid ${GOLD}`,
        boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
      }}
    >
      <Video
        src={src}
        volume={volume}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(err) => {
          console.warn(`[VideoClipCard] Video ${src} could not be played:`, err);
        }}
      />
    </div>
  );
};

/* ─── Checklist / Steps Card ─── */
export const ChecklistCard: React.FC<{
  checklist: ChecklistData;
  format?: 'reel' | 'landscape';
}> = ({ checklist, format = 'reel' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const isLandscape = format === 'landscape';

  const items = checklist.items || [];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isLandscape ? 800 : 900,
        display: 'flex',
        flexDirection: 'column',
        gap: isLandscape ? 16 : 20,
        opacity: enter,
        fontFamily,
      }}
    >
      {items.map((item, idx) => {
        const itemDelay = 6 + idx * 7;
        const itemEnter = spring({ frame: Math.max(0, frame - itemDelay), fps, config: { damping: 12 } });
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: isLandscape ? '16px 24px' : '20px 28px',
              background: 'rgba(15, 21, 32, 0.88)',
              border: `1.5px solid ${BORDER}`,
              borderLeft: `6px solid ${GOLD}`,
              borderRadius: 16,
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              transform: `translateX(${interpolate(itemEnter, [0, 1], [-40, 0])}px)`,
              opacity: itemEnter,
            }}
          >
            <div
              style={{
                width: isLandscape ? 32 : 38,
                height: isLandscape ? 32 : 38,
                borderRadius: '50%',
                background: CORRECT_GREEN,
                color: INK,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: isLandscape ? 18 : 22,
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div
              style={{
                fontSize: isLandscape ? 24 : 28,
                fontWeight: 700,
                color: WHITE,
                lineHeight: 1.3,
              }}
            >
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Comparison Card ─── */
export const ComparisonCard: React.FC<{
  comparison: ComparisonData;
  format?: 'reel' | 'landscape';
}> = ({ comparison, format = 'reel' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const isLandscape = format === 'landscape';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isLandscape ? 24 : 20,
        width: '100%',
        maxWidth: isLandscape ? 920 : 980,
        opacity: enter,
        fontFamily,
      }}
    >
      {/* Left Column */}
      <div
        style={{
          background: 'rgba(15, 21, 32, 0.9)',
          border: `2px solid ${BORDER}`,
          borderRadius: 20,
          padding: isLandscape ? '20px 24px' : '22px 18px',
        }}
      >
        <div style={{ fontSize: isLandscape ? 24 : 26, fontWeight: 800, color: MUTED, marginBottom: 14, textTransform: 'uppercase' }}>
          {comparison.leftTitle}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comparison.leftItems.map((it, i) => (
            <div key={i} style={{ fontSize: isLandscape ? 20 : 22, color: WHITE, fontWeight: 600 }}>
              • {it}
            </div>
          ))}
        </div>
      </div>

      {/* Right Column (Highlighted) */}
      <div
        style={{
          background: 'rgba(15, 21, 32, 0.95)',
          border: `2px solid ${GOLD}`,
          borderRadius: 20,
          padding: isLandscape ? '20px 24px' : '22px 18px',
          boxShadow: '0 0 30px rgba(253, 192, 3, 0.2)',
        }}
      >
        <div style={{ fontSize: isLandscape ? 24 : 26, fontWeight: 800, color: GOLD, marginBottom: 14, textTransform: 'uppercase' }}>
          {comparison.rightTitle}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comparison.rightItems.map((it, i) => (
            <div key={i} style={{ fontSize: isLandscape ? 20 : 22, color: WHITE, fontWeight: 700 }}>
              ✓ {it}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── GIF / Sticker Card ─── */
export const GifCard: React.FC<{
  gif: GifData;
  format?: 'reel' | 'landscape';
}> = ({ gif, format = 'reel' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bounce = spring({ frame, fps, config: { damping: 8, mass: 0.6 } });
  const isLandscape = format === 'landscape';

  if (gif.gifUrl) {
    const src = gif.gifUrl.startsWith('http') ? gif.gifUrl : staticFile(gif.gifUrl);
    return (
      <div
        style={{
          transform: `scale(${interpolate(bounce, [0, 1], [0.6, 1])})`,
          borderRadius: 24,
          overflow: 'hidden',
          border: `3px solid ${GOLD}`,
          boxShadow: '0 0 40px rgba(253,192,3,0.3)',
          maxWidth: isLandscape ? 480 : 540,
        }}
      >
        <Img src={src} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
    );
  }

  const icon = (gif.stickerPreset && STICKER_ICONS[gif.stickerPreset]) || '🔥';
  return (
    <div
      style={{
        fontSize: isLandscape ? 120 : 150,
        transform: `scale(${interpolate(bounce, [0, 1], [0.4, 1.1])})`,
        filter: 'drop-shadow(0 0 30px rgba(253,192,3,0.5))',
      }}
    >
      {icon}
    </div>
  );
};

/* ─── Quote Card ─── */
export const QuoteCard: React.FC<{
  quote: QuoteData;
  format?: 'reel' | 'landscape';
}> = ({ quote, format = 'reel' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const isLandscape = format === 'landscape';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isLandscape ? 820 : 900,
        padding: isLandscape ? '28px 36px' : '32px 28px',
        background: 'rgba(15, 21, 32, 0.92)',
        borderLeft: `8px solid ${GOLD}`,
        borderRadius: '0 20px 20px 0',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        fontFamily,
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [-30, 0])}px)`,
      }}
    >
      <div style={{ fontSize: isLandscape ? 40 : 48, color: GOLD, lineHeight: 1 }}>“</div>
      <div
        style={{
          fontSize: isLandscape ? 28 : 32,
          fontWeight: 600,
          fontStyle: 'italic',
          color: WHITE,
          lineHeight: 1.35,
          marginTop: -10,
        }}
      >
        {quote.text}
      </div>
      {quote.source ? (
        <div
          style={{
            fontSize: isLandscape ? 20 : 24,
            fontWeight: 700,
            color: MUTED,
            marginTop: 16,
            textAlign: 'right',
          }}
        >
          — {quote.source}
        </div>
      ) : null}
    </div>
  );
};
