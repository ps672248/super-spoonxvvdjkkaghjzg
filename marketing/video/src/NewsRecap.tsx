import React from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Audio } from '@remotion/media';
import { CTAOutro, CTA_OUTRO_SECONDS, Header, fontFamily, type TelegramCta } from './Brand';
import { LandscapeOutro } from './LandscapeOutro';
import { AnimatedBackground, KenBurns, ProgressBar } from './Motion';
import { GOLD, INK, VERTICAL_LABEL, WHITE, MUTED } from './theme';
import { BGM_FILE, BGM_MOTIVATION_FILE, BGM_CORPORATE_FILE, WHOOSH_FILE, DING_FILE, POP_FILE } from './audio';
import type { NarrationClip } from './tts';
import {
  TableCard,
  StatCard,
  ImageCard,
  VideoClipCard,
  ChecklistCard,
  ComparisonCard,
  GifCard,
  QuoteCard,
  type TableData,
  type StatCalloutData,
  type ChecklistData,
  type ComparisonData,
  type QuoteData,
  type GifData,
} from './MediaCards';
import { KineticCaptions } from './KineticCaptions';
import { SegmentedProgressBar } from './SegmentedProgressBar';

export type BeatMediaType =
  | 'none'
  | 'table'
  | 'image'
  | 'video_clip'
  | 'stat_callout'
  | 'checklist'
  | 'comparison'
  | 'quote'
  | 'gif';

export type Beat = {
  label: string;
  text: string;
  noAudio?: boolean;
  emoji?: string;
  mediaType?: BeatMediaType;
  mediaUrl?: string;
  table?: TableData;
  stat?: StatCalloutData;
  checklist?: ChecklistData;
  comparison?: ComparisonData;
  quote?: QuoteData;
  gif?: GifData;
};

export type NewsNarration = {
  /** hook + headline read as one clip */
  headline?: NarrationClip | null;
  /** parallel to the resolved beats array */
  beats?: (NarrationClip | null)[];
  /** One spoken CTA over the outro */
  cta?: NarrationClip | null;
};

export type NewsRecapProps = {
  vertical: string;
  headline: string;
  beats: Beat[];
  hookLine?: string;
  narration?: NewsNarration;
  format?: 'reel' | 'landscape';
  bgmMood?: 'breaking_news' | 'motivation' | 'corporate';
  hasBgm?: boolean;
  hasOutro?: boolean;
  hasSfx?: boolean;
  fullStoryLabel?: string;
  telegram?: TelegramCta;
  duckOutroSting?: boolean;
};

const FPS = 30;
const HEADLINE_SECONDS = 2.8;
const WORDS_PER_SECOND = 2.5;
const MIN_BEAT_SECONDS = 2.5;
const MAX_BEAT_SECONDS = 15;
const PAD_SEC = 0.4;
const FALLBACK_BEAT: Beat = { label: 'KEY POINT', text: 'See the full article in the app.' };

export const NEWS_RECAP_FPS = FPS;
export const CTA_LEN = CTA_OUTRO_SECONDS * FPS;

function defaultVisualDurationForMedia(beat: Beat): number {
  switch (beat.mediaType) {
    case 'table':
      return 4.8;
    case 'checklist':
      return 4.2;
    case 'comparison':
      return 4.6;
    case 'image':
    case 'video_clip':
      return 3.8;
    case 'quote':
      return 3.6;
    case 'stat_callout':
      return 3.2;
    case 'gif':
      return 3.0;
    default:
      return 3.0;
  }
}

function beatSeconds(beat: Beat): number {
  const words = (beat.text || '').trim().split(/\s+/).filter(Boolean).length;
  const textSec = words > 0 ? words / WORDS_PER_SECOND : 0;
  const visualSec = defaultVisualDurationForMedia(beat);
  return Math.min(MAX_BEAT_SECONDS, Math.max(MIN_BEAT_SECONDS, Math.max(textSec, visualSec)));
}

export function resolveBeats(beats: Beat[] | undefined): Beat[] {
  return beats && beats.length > 0 ? beats : [FALLBACK_BEAT];
}

/** Headline scene: fixed minimum, stretched to fit the hook+headline narration. */
export function headlineFramesFor(narration?: NewsNarration): number {
  const clip = narration?.headline;
  return Math.round(Math.max(HEADLINE_SECONDS, clip ? clip.durationSec + PAD_SEC : 0) * FPS);
}

/** Beat scenes: text/visual length heuristic as floor, narration length wins when longer. */
export function beatFramesFor(beats: Beat[], narration?: NewsNarration): number[] {
  return resolveBeats(beats).map((b, i) => {
    const clip = b.noAudio ? null : narration?.beats?.[i];
    const sec = Math.max(beatSeconds(b), clip ? clip.durationSec + PAD_SEC : 0);
    return Math.round(sec * FPS);
  });
}

/** Outro scene: minimum CTA floor, dynamically extended to fit the complete spoken CTA narration. */
export function outroFramesFor(narration?: NewsNarration): number {
  const clip = narration?.cta;
  const minOutroSec = CTA_OUTRO_SECONDS;
  const sec = Math.max(minOutroSec, clip ? clip.durationSec + PAD_SEC : minOutroSec);
  return Math.round(sec * FPS);
}

/** Total duration calculation */
export const calculateNewsRecapMetadata: CalculateMetadataFunction<NewsRecapProps> = ({ props }) => {
  const headlineLen = headlineFramesFor(props.narration);
  const totalBeatFrames = beatFramesFor(props.beats, props.narration).reduce((a, b) => a + b, 0);
  const outroLen = outroFramesFor(props.narration);
  return {
    durationInFrames: headlineLen + totalBeatFrames + outroLen,
    props: { ...props, beats: resolveBeats(props.beats) },
  };
};

/* ─── Headline Scene Component ─── */
const HeadlineBeat: React.FC<{
  vertical: string;
  headline: string;
  hookLine?: string;
  durationInFrames: number;
  format?: 'reel' | 'landscape';
}> = ({ vertical, headline, hookLine, durationInFrames, format = 'reel' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isLandscape = format === 'landscape';

  const hookPunch = spring({ frame, fps, config: { damping: 10, mass: 0.7 } });
  const handoff = hookLine
    ? interpolate(frame, [22, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;
  const headlineOpacity = hookLine ? handoff : interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <KenBurns durationInFrames={durationInFrames}>
      <Header tag={`${VERTICAL_LABEL[vertical] ?? vertical} · NEWS`} />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: isLandscape ? '0 120px' : '0 56px',
          textAlign: 'center',
        }}
      >
        {hookLine ? (
          <div
            style={{
              opacity: Math.min(1, hookPunch * 1.4),
              transform: `scale(${interpolate(hookPunch, [0, 1], [0.65, 1]) - handoff * 0.15}) translateY(${-handoff * 20}px)`,
              fontFamily,
              fontSize: isLandscape ? 40 : 54,
              fontWeight: 900,
              color: GOLD,
              lineHeight: 1.2,
              marginBottom: isLandscape ? 20 : 28,
              textShadow: '0 0 35px rgba(253, 192, 3, 0.4)',
            }}
          >
            {hookLine}
          </div>
        ) : null}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${interpolate(headlineOpacity, [0, 1], [30, 0])}px)`,
            fontFamily,
            fontSize: isLandscape ? 48 : 52,
            fontWeight: 800,
            color: WHITE,
            lineHeight: 1.22,
            maxWidth: isLandscape ? 1200 : '100%',
          }}
        >
          {headline}
        </div>
      </AbsoluteFill>
    </KenBurns>
  );
};

/* ─── Highlight / Media Beat Scene Component ─── */
const HighlightBeat: React.FC<{
  vertical: string;
  beat: Beat;
  index: number;
  durationInFrames: number;
  format?: 'reel' | 'landscape';
}> = ({ vertical, beat, index, durationInFrames, format = 'reel' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 13, mass: 0.8 } });
  const isLandscape = format === 'landscape';

  const labelSpacing = interpolate(enter, [0, 1], [8, 2]);
  const hasCustomMedia = beat.mediaType && beat.mediaType !== 'none';

  return (
    <KenBurns durationInFrames={durationInFrames}>
      <Header tag={`${VERTICAL_LABEL[vertical] ?? vertical} · NEWS`} />

      {isLandscape ? (
        /* ─── Long Form (16:9 Landscape): Split Dual-Pane Layout ─── */
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '100px 90px 80px 90px',
            gap: 60,
          }}
        >
          {/* Left Column: Tag, Subtitle / Text, Highlights */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              opacity: enter,
              transform: `translateX(${interpolate(enter, [0, 1], [-50, 0])}px)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {beat.emoji ? <span style={{ fontSize: 32 }}>{beat.emoji}</span> : null}
              <div
                style={{
                  fontFamily,
                  fontSize: 24,
                  fontWeight: 800,
                  color: GOLD,
                  letterSpacing: labelSpacing,
                  textTransform: 'uppercase',
                }}
              >
                {beat.label}
              </div>
            </div>

            <div style={{ width: 80, height: 5, borderRadius: 3, background: GOLD }} />

            {beat.text ? (
              <KineticCaptions
                text={beat.text}
                durationInFrames={durationInFrames}
                format="landscape"
                fontSize={36}
              />
            ) : null}
          </div>

          {/* Right Column: Visual Media Card */}
          <div
            style={{
              flex: 1.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: enter,
              transform: `scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
            }}
          >
            {renderMediaCard(beat, 'landscape', durationInFrames)}
          </div>
        </AbsoluteFill>
      ) : (
        /* ─── Reels (9:16 Vertical): Stacked Layout ─── */
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '120px 48px 140px 48px',
            gap: 24,
          }}
        >
          {/* Top Tag & Emoji */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: enter,
              transform: `translateY(${interpolate(enter, [0, 1], [-20, 0])}px)`,
            }}
          >
            {beat.emoji ? <span style={{ fontSize: 36 }}>{beat.emoji}</span> : null}
            <div
              style={{
                fontFamily,
                fontSize: 26,
                fontWeight: 800,
                color: GOLD,
                letterSpacing: labelSpacing,
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(253, 192, 3, 0.4)',
              }}
            >
              {beat.label}
            </div>
          </div>

          {/* Center Media Card (if present) or prominent text highlight */}
          {hasCustomMedia ? (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '12px 0',
              }}
            >
              {renderMediaCard(beat, 'reel', durationInFrames)}
            </div>
          ) : (
            <div
              style={{
                fontFamily,
                fontSize: 46,
                fontWeight: 800,
                color: WHITE,
                lineHeight: 1.3,
                textAlign: 'center',
                margin: '20px 0',
                textShadow: '0 4px 15px rgba(0,0,0,0.8)',
              }}
            >
              {beat.text}
            </div>
          )}

          {/* Subtitle / Kinetic Caption below media */}
          {hasCustomMedia && beat.text && !beat.noAudio ? (
            <div style={{ marginTop: 12 }}>
              <KineticCaptions
                text={beat.text}
                durationInFrames={durationInFrames}
                format="reel"
                fontSize={34}
              />
            </div>
          ) : null}

          {/* Gold Divider Accent */}
          <div
            style={{
              width: interpolate(enter, [0, 1], [0, 140]),
              height: 6,
              borderRadius: 3,
              background: GOLD,
              marginTop: 10,
              boxShadow: '0 0 15px rgba(253,192,3,0.6)',
            }}
          />
        </AbsoluteFill>
      )}
    </KenBurns>
  );
};

function renderMediaCard(beat: Beat, format: 'reel' | 'landscape', durationInFrames: number) {
  if (beat.table && beat.mediaType === 'table') {
    return <TableCard table={beat.table} format={format} durationInFrames={durationInFrames} />;
  }
  if (beat.stat && beat.mediaType === 'stat_callout') {
    return <StatCard stat={beat.stat} format={format} />;
  }
  if (beat.mediaUrl && beat.mediaType === 'image') {
    return <ImageCard mediaUrl={beat.mediaUrl} format={format} durationInFrames={durationInFrames} />;
  }
  if (beat.mediaUrl && beat.mediaType === 'video_clip') {
    return <VideoClipCard mediaUrl={beat.mediaUrl} format={format} />;
  }
  if (beat.checklist && beat.mediaType === 'checklist') {
    return <ChecklistCard checklist={beat.checklist} format={format} />;
  }
  if (beat.comparison && beat.mediaType === 'comparison') {
    return <ComparisonCard comparison={beat.comparison} format={format} />;
  }
  if (beat.quote && beat.mediaType === 'quote') {
    return <QuoteCard quote={beat.quote} format={format} />;
  }
  if (beat.gif && beat.mediaType === 'gif') {
    return <GifCard gif={beat.gif} format={format} />;
  }
  return null;
}

/* ─── Persistent Bottom Strip ─── */
const FullStoryStrip: React.FC<{ label: string; format?: 'reel' | 'landscape' }> = ({ label, format = 'reel' }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const isLandscape = format === 'landscape';

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: isLandscape ? 36 : 78,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: isLandscape ? 20 : 24,
          fontWeight: 700,
          color: WHITE,
          background: 'rgba(0,0,0,0.55)',
          border: `1.5px solid ${GOLD}`,
          borderRadius: 999,
          padding: isLandscape ? '8px 24px' : '10px 28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        📰 Full story → {label}
      </div>
    </AbsoluteFill>
  );
};

/* ─── Main NewsRecap Composition ─── */
export const NewsRecap: React.FC<NewsRecapProps> = ({
  vertical,
  headline,
  beats,
  hookLine,
  narration,
  format = 'reel',
  bgmMood = 'breaking_news',
  hasBgm,
  hasOutro,
  hasSfx,
  fullStoryLabel,
  telegram,
  duckOutroSting,
}) => {
  const frame = useCurrentFrame();
  const resolvedBeats = resolveBeats(beats);
  const headlineLen = headlineFramesFor(narration);
  const beatFrames = beatFramesFor(beats, narration);
  const outroLen = outroFramesFor(narration);
  const totalNonCta = headlineLen + beatFrames.reduce((a, b) => a + b, 0);
  const inCta = frame >= totalNonCta;
  const isLandscape = format === 'landscape';

  const bgmVolume = narration ? 0.18 : 0.35;
  const bgmTrack =
    bgmMood === 'motivation'
      ? BGM_MOTIVATION_FILE
      : bgmMood === 'corporate'
      ? BGM_CORPORATE_FILE
      : BGM_FILE;

  const beatStart = (i: number) => headlineLen + beatFrames.slice(0, i).reduce((a, b) => a + b, 0);

  // Segmented progress calculation
  const totalSteps = 1 + resolvedBeats.length;
  let currentStep = 0;
  let stepProgress = 0;

  if (frame < headlineLen) {
    currentStep = 0;
    stepProgress = frame / headlineLen;
  } else {
    let accumulated = headlineLen;
    for (let i = 0; i < resolvedBeats.length; i++) {
      if (frame >= accumulated && frame < accumulated + beatFrames[i]) {
        currentStep = i + 1;
        stepProgress = (frame - accumulated) / beatFrames[i];
        break;
      }
      accumulated += beatFrames[i];
    }
  }

  return (
    <AbsoluteFill style={{ background: INK }}>
      <AnimatedBackground format={format} />

      {/* Segmented Top Progress Bar */}
      {!inCta ? (
        <SegmentedProgressBar
          currentBeatIndex={currentStep}
          totalBeats={totalSteps}
          beatProgress={stepProgress}
          format={format}
        />
      ) : null}

      {/* Background Bed Audio */}
      {hasBgm && <Audio src={staticFile(bgmTrack)} loop volume={bgmVolume} />}

      {/* Headline Narration */}
      {narration?.headline ? (
        <Sequence from={0} durationInFrames={headlineLen} layout="none">
          <Audio src={staticFile(narration.headline.src)} />
        </Sequence>
      ) : null}

      {/* Beat Narrations (skipped when beat.noAudio === true) */}
      {resolvedBeats.map((beat, i) =>
        !beat.noAudio && narration?.beats?.[i] ? (
          <Sequence key={`n${i}`} from={beatStart(i)} durationInFrames={beatFrames[i]} layout="none">
            <Audio src={staticFile(narration.beats[i]!.src)} />
          </Sequence>
        ) : null,
      )}

      {/* Outro Narration */}
      {narration?.cta ? (
        <Sequence from={totalNonCta} durationInFrames={outroLen} layout="none">
          <Audio src={staticFile(narration.cta.src)} />
        </Sequence>
      ) : null}

      {/* Video Sequences */}
      {!inCta ? (
        <Series>
          <Series.Sequence durationInFrames={headlineLen} layout="none">
            <HeadlineBeat
              vertical={vertical}
              headline={headline}
              hookLine={hookLine}
              durationInFrames={headlineLen}
              format={format}
            />
          </Series.Sequence>
          {resolvedBeats.map((beat, i) => (
            <Series.Sequence key={i} durationInFrames={beatFrames[i]} layout="none">
              <HighlightBeat
                vertical={vertical}
                beat={beat}
                index={i}
                durationInFrames={beatFrames[i]}
                format={format}
              />
            </Series.Sequence>
          ))}
        </Series>
      ) : (
        <Sequence from={totalNonCta} durationInFrames={outroLen} layout="none">
          {isLandscape ? (
            <LandscapeOutro hasOutro={hasOutro} />
          ) : (
            <CTAOutro hasOutro={hasOutro} telegram={telegram} duckOutroSting={duckOutroSting} />
          )}
        </Sequence>
      )}

      {/* Bottom Website Tag */}
      {!inCta && fullStoryLabel ? (
        <Sequence from={0} durationInFrames={totalNonCta} layout="none">
          <FullStoryStrip label={fullStoryLabel} format={format} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

export const NEWS_RECAP_DURATION_IN_FRAMES = Math.round((HEADLINE_SECONDS + MIN_BEAT_SECONDS) * FPS) + CTA_LEN;
