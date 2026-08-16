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
import { AnimatedBackground, KenBurns, ProgressBar } from './Motion';
import { GOLD, INK, VERTICAL_LABEL, WHITE } from './theme';
import { BGM_FILE } from './audio';
import type { NarrationClip } from './tts';

export type Beat = { label: string; text: string };

export type NewsNarration = {
  /** hook + headline read as one clip */
  headline?: NarrationClip | null;
  /** parallel to the resolved beats array */
  beats?: (NarrationClip | null)[];
  /** One spoken CTA over the outro — full story, or Telegram on strategy reels. */
  cta?: NarrationClip | null;
};

export type NewsRecapProps = {
  vertical: string;
  headline: string;
  /** 1-3 highlight beats after the headline — see scripts/blog_bot.ts VIDEO_BEATS_INSTRUCTION. */
  beats: Beat[];
  /** Gemini-authored pattern interrupt shown at frame 0, before the headline. */
  hookLine?: string;
  /** Voiceover clips generated pre-render by src/tts.ts — optional; scenes stretch to fit. */
  narration?: NewsNarration;
  /** Set by render.ts based on whether the file actually exists in public/ — see src/audio.ts. */
  hasBgm?: boolean;
  hasOutro?: boolean;
  /** Readable article domain for the on-screen "full story" strip, e.g.
   *  "aspirant-arcade.xyz/blog". A domain rather than "link in description"
   *  because Instagram strips links — the caption's URL isn't tappable there,
   *  so the only thing that survives a Reels view is text someone can read. */
  fullStoryLabel?: string;
  /** Replaces the outro's subscribe pill when the exam has a channel. */
  telegram?: TelegramCta;
  /** A spoken CTA plays over the outro — duck the sting. */
  duckOutroSting?: boolean;
};

const FPS = 30;
const HEADLINE_SECONDS = 2.5; // was 4 — the swipe decision is made way before 4s
const WORDS_PER_SECOND = 2.5; // rough reading-speed heuristic for sizing each beat
const MIN_BEAT_SECONDS = 2.5;
const MAX_BEAT_SECONDS = 6;
const PAD_SEC = 0.4; // breathing room after a narration clip ends
const FALLBACK_BEAT: Beat = { label: 'KEY POINT', text: 'See the full article in the app.' };

export const NEWS_RECAP_FPS = FPS;
export const CTA_LEN = CTA_OUTRO_SECONDS * FPS;

function beatSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(MAX_BEAT_SECONDS, Math.max(MIN_BEAT_SECONDS, words / WORDS_PER_SECOND));
}

export function resolveBeats(beats: Beat[] | undefined): Beat[] {
  return beats && beats.length > 0 ? beats.slice(0, 3) : [FALLBACK_BEAT];
}

/** Headline scene: fixed minimum, stretched to fit the hook+headline narration. */
export function headlineFramesFor(narration?: NewsNarration): number {
  const clip = narration?.headline;
  return Math.round(Math.max(HEADLINE_SECONDS, clip ? clip.durationSec + PAD_SEC : 0) * FPS);
}

/** Beat scenes: text-length heuristic as the floor, narration length wins when longer. */
export function beatFramesFor(beats: Beat[], narration?: NewsNarration): number[] {
  return resolveBeats(beats).map((b, i) => {
    const clip = narration?.beats?.[i];
    const sec = Math.max(beatSeconds(b.text), clip ? clip.durationSec + PAD_SEC : 0);
    return Math.round(sec * FPS);
  });
}

/** Total duration is content-driven: headline + CTA are (near-)fixed, but the
 * highlight beats are sized off Gemini's text AND the narration audio for each —
 * capped so it never drifts past reel-length territory. */
export const calculateNewsRecapMetadata: CalculateMetadataFunction<NewsRecapProps> = ({ props }) => {
  const headlineLen = headlineFramesFor(props.narration);
  const totalBeatFrames = beatFramesFor(props.beats, props.narration).reduce((a, b) => a + b, 0);
  return {
    durationInFrames: headlineLen + totalBeatFrames + CTA_LEN,
    props: { ...props, beats: resolveBeats(props.beats) },
  };
};

const HeadlineBeat: React.FC<{ vertical: string; headline: string; hookLine?: string; durationInFrames: number }> = ({
  vertical,
  headline,
  hookLine,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hookPunch = spring({ frame, fps, config: { damping: 10, mass: 0.7 } });
  // with a hook: hook owns the first ~0.8s, then shrinks up as the headline lands
  const handoff = hookLine ? interpolate(frame, [22, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const headlineOpacity = hookLine ? handoff : interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <KenBurns durationInFrames={durationInFrames}>
      <Header tag={`${VERTICAL_LABEL[vertical] ?? vertical} · NEWS`} />
      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 56px' }}>
        {hookLine ? (
          <div
            style={{
              opacity: Math.min(1, hookPunch * 1.4),
              transform: `scale(${interpolate(hookPunch, [0, 1], [0.55, 1]) - handoff * 0.25}) translateY(${-handoff * 30}px)`,
              fontFamily,
              fontSize: interpolate(handoff, [0, 1], [58, 34]),
              fontWeight: 800,
              color: GOLD, 

              lineHeight: 1.2,
              marginBottom: 28,
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
            fontSize: 52,
            fontWeight: 800,
            color: WHITE,
            lineHeight: 1.22,
          }}
        >
          {headline}
        </div>
      </AbsoluteFill>
    </KenBurns>
  );
};

const HighlightBeat: React.FC<{ vertical: string; beat: Beat; index: number; durationInFrames: number }> = ({
  vertical,
  beat,
  index,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 13, mass: 0.8 } });
  const fromLeft = index % 2 === 0;
  const slideX = interpolate(enter, [0, 1], [fromLeft ? -90 : 90, 0]);
  const labelSpacing = interpolate(enter, [0, 1], [10, 2]);

  return (
    <KenBurns durationInFrames={durationInFrames}>
      <Header tag={`${VERTICAL_LABEL[vertical] ?? vertical} · NEWS`} />
      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 56px' }}>
        <div
          style={{
            opacity: Math.min(1, enter * 1.2),
            transform: `translateX(${slideX}px)`,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ fontFamily, fontSize: 22, fontWeight: 800, color: GOLD, letterSpacing: labelSpacing }}>
            {beat.label.toUpperCase()}
          </div>
          <div style={{ fontFamily, fontSize: 44, fontWeight: 700, color: WHITE, lineHeight: 1.3 }}>{beat.text}</div>
          <div style={{ width: interpolate(enter, [0, 1], [0, 120]), height: 6, borderRadius: 3, background: GOLD, marginTop: 8 }} />
        </div>
      </AbsoluteFill>
    </KenBurns>
  );
};

/**
 * Persistent bottom strip across the beats, ending before the outro so it never
 * competes with the CTA there. Costs no extra duration — the whole reason it
 * lives here rather than as a fourth element in the two-second outro.
 */
const FullStoryStrip: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 78, opacity }}>
      <div
        style={{
          fontFamily,
          fontSize: 24,
          fontWeight: 700,
          color: WHITE,
          background: 'rgba(0,0,0,0.45)',
          border: `1px solid ${GOLD}`,
          borderRadius: 999,
          padding: '10px 28px',
        }}
      >
        📰 Full story → {label}
      </div>
    </AbsoluteFill>
  );
};

export const NewsRecap: React.FC<NewsRecapProps> = ({ vertical, headline, beats, hookLine, narration, hasBgm, hasOutro, fullStoryLabel, telegram, duckOutroSting }) => {
  const frame = useCurrentFrame();
  const resolvedBeats = resolveBeats(beats);
  const headlineLen = headlineFramesFor(narration);
  const beatFrames = beatFramesFor(beats, narration);
  const totalNonCta = headlineLen + beatFrames.reduce((a, b) => a + b, 0);
  const inCta = frame >= totalNonCta;
  const bgmVolume = narration ? 0.18 : 0.35; // duck the bed under voiceover

  const beatStart = (i: number) => headlineLen + beatFrames.slice(0, i).reduce((a, b) => a + b, 0);

  return (
    <AbsoluteFill style={{ background: INK }}>
      <AnimatedBackground />
      {hasBgm && <Audio src={staticFile(BGM_FILE)} loop volume={bgmVolume} />}

      {narration?.headline ? (
        <Sequence from={0} durationInFrames={headlineLen} layout="none">
          <Audio src={staticFile(narration.headline.src)} />
        </Sequence>
      ) : null}
      {resolvedBeats.map((_, i) =>
        narration?.beats?.[i] ? (
          <Sequence key={`n${i}`} from={beatStart(i)} durationInFrames={beatFrames[i]} layout="none">
            <Audio src={staticFile(narration.beats[i]!.src)} />
          </Sequence>
        ) : null,
      )}

      {narration?.cta ? (
        <Sequence from={totalNonCta} durationInFrames={CTA_LEN} layout="none">
          <Audio src={staticFile(narration.cta.src)} />
        </Sequence>
      ) : null}

      {!inCta ? (
        <Series>
          <Series.Sequence durationInFrames={headlineLen} layout="none">
            <HeadlineBeat vertical={vertical} headline={headline} hookLine={hookLine} durationInFrames={headlineLen} />
          </Series.Sequence>
          {resolvedBeats.map((beat, i) => (
            <Series.Sequence key={i} durationInFrames={beatFrames[i]} layout="none">
              <HighlightBeat vertical={vertical} beat={beat} index={i} durationInFrames={beatFrames[i]} />
            </Series.Sequence>
          ))}
        </Series>
      ) : (
        <Sequence from={totalNonCta} durationInFrames={CTA_LEN} layout="none">
          <CTAOutro hasOutro={hasOutro} telegram={telegram} duckOutroSting={duckOutroSting} />
        </Sequence>
      )}

      {!inCta && fullStoryLabel ? (
        <Sequence from={0} durationInFrames={totalNonCta} layout="none">
          <FullStoryStrip label={fullStoryLabel} />
        </Sequence>
      ) : null}

      <ProgressBar />
    </AbsoluteFill>
  );
};

// Kept for anything importing a static estimate (e.g. Root.tsx's placeholder) —
// the real, per-render duration always comes from calculateNewsRecapMetadata above.
export const NEWS_RECAP_DURATION_IN_FRAMES = Math.round((HEADLINE_SECONDS + MIN_BEAT_SECONDS) * FPS) + CTA_LEN;
