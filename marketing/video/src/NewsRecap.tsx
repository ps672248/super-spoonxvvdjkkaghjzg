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
import { KenBurns } from './Motion';
import { SceneBackground, resolveSceneTheme, type SceneTheme } from './SceneBackground';
import {
  AnimatedCharacter,
  inferMoodFromBeat,
  type CharacterId,
  type CharacterMood,
} from './AnimatedCharacter';
import { GOLD, INK, VERTICAL_LABEL, WHITE } from './theme';
import {
  BGM_FILE,
  BGM_MOTIVATION_FILE,
  BGM_CORPORATE_FILE,
  WHOOSH_FILE,
  DING_FILE,
  POP_FILE,
  HOOK_BOOM_FILE,
} from './audio';
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
  spokenText?: string;
  noAudio?: boolean;
  emoji?: string;
  mood?: CharacterMood;
  scene?: SceneTheme;
  sfx?: 'whoosh' | 'ding' | 'pop' | 'boom';
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
  /** Optional precomputed per-frame speech openness [0..1] for lip-sync */
  headlineCadence?: number[] | null;
  beatCadences?: (number[] | null)[];
  ctaCadence?: number[] | null;
};

export type NewsRecapProps = {
  vertical: string;
  headline: string;
  beats: Beat[];
  hookLine?: string;
  narration?: NewsNarration;
  format?: 'reel' | 'landscape';
  videoKind?: 'news' | 'strategy' | 'experience' | 'marketing';
  scene?: SceneTheme;
  character?: CharacterId | 'none';
  bgmMood?: 'breaking_news' | 'motivation' | 'corporate';
  hasBgm?: boolean;
  hasMotivationBgm?: boolean;
  hasCorporateBgm?: boolean;
  hasOutro?: boolean;
  hasSfx?: boolean;
  fullStoryLabel?: string;
  telegram?: TelegramCta;
  duckOutroSting?: boolean;
};

const FPS = 30;
const HEADLINE_SECONDS = 2.8;
const WORDS_PER_SECOND = 2.6;
const MIN_BEAT_SECONDS = 2.6;
const MAX_BEAT_SECONDS = 15;
const PAD_SEC = 0.4;
const FALLBACK_BEAT: Beat = { label: 'KEY POINT', text: 'See the full article in the app.' };

export const NEWS_RECAP_FPS = FPS;
export const CTA_LEN = CTA_OUTRO_SECONDS * FPS;

function defaultVisualDurationForMedia(beat: Beat): number {
  switch (beat.mediaType) {
    case 'table':
      return 4.5;
    case 'checklist':
      return 4.0;
    case 'comparison':
      return 4.4;
    case 'image':
    case 'video_clip':
      return 3.6;
    case 'quote':
      return 3.4;
    case 'stat_callout':
      return 3.0;
    case 'gif':
      return 2.8;
    default:
      return 2.9;
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

export const calculateNewsRecapMetadata: CalculateMetadataFunction<NewsRecapProps> = ({ props }) => {
  const headlineLen = headlineFramesFor(props.narration);
  const totalBeatFrames = beatFramesFor(props.beats, props.narration).reduce((a, b) => a + b, 0);
  const outroLen = outroFramesFor(props.narration);
  return {
    durationInFrames: headlineLen + totalBeatFrames + outroLen,
    props: { ...props, beats: resolveBeats(props.beats) },
  };
};

function tagSuffixForKind(kind?: string): { label: string; pulseColor: string } {
  switch (kind) {
    case 'strategy':
      return { label: 'STRATEGY', pulseColor: '#38BDF8' };
    case 'experience':
      return { label: 'REAL STORY', pulseColor: '#A855F7' };
    case 'marketing':
      return { label: 'FEATURE', pulseColor: '#22C55E' };
    default:
      return { label: 'BREAKING', pulseColor: '#F43F5E' };
  }
}

function accentForKind(kind?: string): string {
  switch (kind) {
    case 'strategy':
      return '#38BDF8';
    case 'experience':
      return '#C084FC';
    case 'marketing':
      return '#22C55E';
    default:
      return GOLD;
  }
}

/* ─── Pure-Code Voice Waveform Visualizer ─── */
const VoiceWaveform: React.FC<{
  active: boolean;
  cadence?: number[] | null;
  accentColor?: string;
  bars?: number;
}> = ({ active, cadence, accentColor = GOLD, bars = 14 }) => {
  const frame = useCurrentFrame();
  const amp = cadence && cadence.length > 0 ? cadence[Math.min(cadence.length - 1, frame)] ?? 0 : 0.65;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 34 }}>
      {Array.from({ length: bars }).map((_, idx) => {
        const wave = active
          ? 0.25 + Math.abs(Math.sin(frame * 0.35 + idx * 0.72) * Math.cos(frame * 0.14 - idx * 0.3)) * (0.4 + amp * 0.7)
          : 0.16;
        const barH = Math.round(6 + Math.min(1, wave) * 26);
        return (
          <div
            key={idx}
            style={{
              width: 5,
              height: barH,
              borderRadius: 99,
              background: idx % 3 === 0 ? accentColor : '#FFFFFF',
              opacity: active ? 0.92 : 0.3,
              boxShadow: active && idx % 3 === 0 ? `0 0 10px ${accentColor}` : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

/* ─── Presenter HUD Box beside Character ─── */
const PresenterStatusCard: React.FC<{
  character: CharacterId;
  mood: CharacterMood;
  speaking: boolean;
  cadence?: number[] | null;
  accentColor: string;
  badgeText: string;
}> = ({ character, mood, speaking, cadence, accentColor, badgeText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 14 } });

  const moodTag =
    mood === 'alert'
      ? '🚨 ACTION ALERT'
      : mood === 'shocked'
      ? '⚡ HUGE SHOCK'
      : mood === 'celebrate'
      ? '🎉 BIG OPPORTUNITY'
      : mood === 'thinking'
      ? '💡 EXAM INSIGHT'
      : mood === 'stressed'
      ? '⚠️ WATCH OUT'
      : mood === 'frustrated'
      ? '😤 DON\'T FALL FOR THIS'
      : mood === 'confident' || mood === 'smug'
      ? '💪 CONFIDENT MOVE'
      : mood === 'determined'
      ? '🔥 LOCK IN NOW'
      : mood === 'whispering'
      ? '🤫 INSIDER TIP'
      : mood === 'relieved'
      ? '😌 RELIEF AHEAD'
      : mood === 'panicked'
      ? '😱 CRUNCH TIME'
      : mood === 'curious'
      ? '🔍 DEEP DIVE'
      : mood === 'excited'
      ? '⚡ LIVE UPDATE'
      : '🎙️ KEY BREAKDOWN';

  const hostName = character === 'priya' ? 'Priya · Exam Mentor' : 'Arjun · Aspirant Host';

  return (
    <div
      style={{
        flex: 1,
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [24, 0])}px)`,
        background: 'rgba(15, 21, 32, 0.80)',
        border: `1.5px solid ${accentColor}55`,
        borderRadius: 22,
        padding: '22px 26px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 16px 34px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: WHITE,
            background: 'rgba(255, 255, 255, 0.10)',
            border: `1.5px solid ${accentColor}`,
            borderRadius: 999,
            padding: '6px 16px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {moodTag}
        </span>
      </div>

      <div style={{ fontSize: 24, fontWeight: 700, color: WHITE, lineHeight: 1.25 }}>
        {badgeText}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <VoiceWaveform active={speaking} cadence={cadence} accentColor={accentColor} bars={12} />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.68)' }}>
          {hostName}
        </span>
      </div>
    </div>
  );
};

/* ─── Headline Scene Component ─── */
const HeadlineBeat: React.FC<{
  vertical: string;
  headline: string;
  hookLine?: string;
  durationInFrames: number;
  format?: 'reel' | 'landscape';
  videoKind?: string;
  defaultScene: SceneTheme;
  character?: CharacterId | 'none';
  speaking?: boolean;
  cadence?: number[] | null;
}> = ({
  vertical,
  headline,
  hookLine,
  durationInFrames,
  format = 'reel',
  videoKind,
  defaultScene,
  character = 'arjun',
  speaking = false,
  cadence,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isLandscape = format === 'landscape';
  const kindMeta = tagSuffixForKind(videoKind);
  const accent = accentForKind(videoKind);

  const hookPunch = spring({ frame, fps, config: { damping: 10, mass: 0.65 } });
  const handoff = hookLine
    ? interpolate(frame, [14, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;
  const headlineOpacity = hookLine ? handoff : interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <SceneBackground scene={defaultScene} format={format} />
      <KenBurns durationInFrames={durationInFrames}>
      <Header
        tag={`${VERTICAL_LABEL[vertical] ?? vertical} · ${kindMeta.label}`}
        livePulse
        pulseColor={kindMeta.pulseColor}
      />
      {isLandscape ? (
        <AbsoluteFill
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '110px 100px 80px 100px',
            gap: 48,
          }}
        >
          <div style={{ flex: 1.35, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {hookLine ? (
              <div
                style={{
                  alignSelf: 'flex-start',
                  opacity: Math.min(1, hookPunch * 1.4),
                  transform: `scale(${interpolate(hookPunch, [0, 1], [0.72, 1])})`,
                  fontFamily,
                  fontSize: 32,
                  fontWeight: 900,
                  color: INK,
                  background: GOLD,
                  borderRadius: 16,
                  padding: '12px 24px',
                  boxShadow: '0 0 36px rgba(253, 192, 3, 0.5)',
                }}
              >
                ⚡ {hookLine}
              </div>
            ) : null}
            <div
              style={{
                opacity: headlineOpacity,
                transform: `translateY(${interpolate(headlineOpacity, [0, 1], [24, 0])}px)`,
                fontFamily,
                fontSize: 54,
                fontWeight: 900,
                color: WHITE,
                lineHeight: 1.18,
                textShadow: '0 6px 24px rgba(0,0,0,0.85)',
              }}
            >
              {headline}
            </div>
            <div style={{ marginTop: 8 }}>
              <VoiceWaveform active={speaking} cadence={cadence} accentColor={accent} bars={18} />
            </div>
          </div>

          {character !== 'none' ? (
            <div style={{ flex: 0.75, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
              <AnimatedCharacter
                character={character}
                mood="excited"
                speaking={speaking}
                cadence={cadence ?? undefined}
                accentColor={accent}
                size={410}
              />
            </div>
          ) : null}
        </AbsoluteFill>
      ) : (
        /* 9:16 Reel Headline Stage */
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {/* Center Headline Stage */}
          <div
            style={{
              position: 'absolute',
              top: 390,
              left: 54,
              right: 54,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 30,
            }}
          >
            {hookLine ? (
              <div
                style={{
                  opacity: Math.min(1, hookPunch * 1.4),
                  transform: `scale(${interpolate(hookPunch, [0, 1], [0.65, 1])})`,
                  fontFamily,
                  fontSize: 38,
                  fontWeight: 900,
                  color: INK,
                  background: GOLD,
                  borderRadius: 20,
                  padding: '16px 30px',
                  lineHeight: 1.2,
                  boxShadow: '0 10px 35px rgba(253, 192, 3, 0.45)',
                }}
              >
                ⚡ {hookLine}
              </div>
            ) : null}
            <div
              style={{
                opacity: headlineOpacity,
                transform: `translateY(${interpolate(headlineOpacity, [0, 1], [28, 0])}px)`,
                fontFamily,
                fontSize: 54,
                fontWeight: 900,
                color: WHITE,
                lineHeight: 1.22,
                textShadow: '0 6px 26px rgba(0, 0, 0, 0.9)',
                background: 'rgba(15, 21, 32, 0.72)',
                border: `2px solid ${accent}44`,
                borderRadius: 28,
                padding: '34px 30px',
                boxShadow: `0 24px 54px rgba(0, 0, 0, 0.6), 0 0 36px ${accent}22`,
                backdropFilter: 'blur(14px)',
              }}
            >
              {headline}
            </div>
            <div
              style={{
                opacity: headlineOpacity,
                fontFamily,
                fontSize: 22,
                fontWeight: 800,
                color: accent,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              ● KEY BREAKDOWN COMING UP ↓
            </div>
          </div>

          {/* Lower Stage Character + Waveform */}
          {character !== 'none' ? (
            <div
              style={{
                position: 'absolute',
                bottom: 145,
                left: 48,
                right: 48,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <AnimatedCharacter
                character={character}
                mood="excited"
                speaking={speaking}
                cadence={cadence ?? undefined}
                accentColor={accent}
                size={360}
              />
              <PresenterStatusCard
                character={character}
                mood="excited"
                speaking={speaking}
                cadence={cadence}
                accentColor={accent}
                badgeText={
                  videoKind === 'strategy'
                    ? 'Full blueprint in 20 seconds'
                    : videoKind === 'experience'
                    ? 'Real aspirant insights ahead'
                    : videoKind === 'marketing'
                    ? 'Level up your daily prep'
                    : 'Key dates, stats & rules inside'
                }
              />
            </div>
          ) : null}
        </AbsoluteFill>
      )}
      </KenBurns>
    </AbsoluteFill>
  );
};

/* ─── Highlight / Media Beat Scene Component ─── */
const HighlightBeat: React.FC<{
  vertical: string;
  beat: Beat;
  index: number;
  durationInFrames: number;
  format?: 'reel' | 'landscape';
  videoKind?: string;
  defaultScene: SceneTheme;
  character?: CharacterId | 'none';
  speaking?: boolean;
  cadence?: number[] | null;
}> = ({
  vertical,
  beat,
  index,
  durationInFrames,
  format = 'reel',
  videoKind,
  defaultScene,
  character = 'arjun',
  speaking = false,
  cadence,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 12, mass: 0.75 } });
  const sceneFade = interpolate(frame, [0, 8], [0.25, 1], { extrapolateRight: 'clamp' });
  const isLandscape = format === 'landscape';
  const kindMeta = tagSuffixForKind(videoKind);
  const accent = accentForKind(videoKind);

  const mood = inferMoodFromBeat({
    mood: beat.mood,
    emoji: beat.emoji,
    label: beat.label,
    mediaType: beat.mediaType,
  });

  const hasCustomMedia = beat.mediaType && beat.mediaType !== 'none';
  const stepTag = `${String(index + 1).padStart(2, '0')} · ${beat.label}`;

  return (
    <AbsoluteFill style={{ opacity: sceneFade }}>
      <SceneBackground scene={beat.scene ?? defaultScene} format={format} />
      <KenBurns durationInFrames={durationInFrames}>
      <Header
        tag={`${VERTICAL_LABEL[vertical] ?? vertical} · ${kindMeta.label}`}
        livePulse
        pulseColor={kindMeta.pulseColor}
      />

      {isLandscape ? (
        /* ─── Long Form (16:9 Landscape): Dual-Pane with Character ─── */
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '108px 90px 76px 90px',
            gap: 48,
          }}
        >
          {/* Left Column: Tag, Captions, Character */}
          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: enter,
              transform: `translateX(${interpolate(enter, [0, 1], [-40, 0])}px)`,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {beat.emoji ? <span style={{ fontSize: 34 }}>{beat.emoji}</span> : null}
                <div
                  style={{
                    fontFamily,
                    fontSize: 22,
                    fontWeight: 900,
                    color: INK,
                    background: GOLD,
                    borderRadius: 999,
                    padding: '6px 18px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stepTag}
                </div>
              </div>

              {beat.text ? (
                <KineticCaptions
                  text={beat.text}
                  durationInFrames={durationInFrames}
                  format="landscape"
                  fontSize={34}
                  highlightColor={accent}
                />
              ) : null}
            </div>

            {character !== 'none' ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
                <AnimatedCharacter
                  character={character}
                  mood={mood}
                  speaking={speaking}
                  cadence={cadence ?? undefined}
                  accentColor={accent}
                  size={250}
                />
                <div style={{ paddingBottom: 24 }}>
                  <VoiceWaveform active={speaking} cadence={cadence} accentColor={accent} bars={14} />
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column: Visual Media Card */}
          <div
            style={{
              flex: 1.15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: enter,
              transform: `scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
            }}
          >
            {hasCustomMedia ? (
              renderMediaCard(beat, 'landscape', durationInFrames)
            ) : (
              <HeroTextCard text={beat.text} emoji={beat.emoji} label={beat.label} accentColor={accent} isLandscape />
            )}
          </div>
        </AbsoluteFill>
      ) : (
        /* ─── Reels (9:16 Vertical): Non-overlapping 4-Zone Stage ─── */
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {/* Zone 1 (y: 188..258): Beat Step Tag Pill */}
          <div
            style={{
              position: 'absolute',
              top: 188,
              left: 54,
              right: 54,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: enter,
              transform: `translateY(${interpolate(enter, [0, 1], [-18, 0])}px)`,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(15, 21, 32, 0.88)',
                border: `2px solid ${accent}`,
                borderRadius: 999,
                padding: '10px 26px',
                boxShadow: `0 0 28px ${accent}44`,
              }}
            >
              {beat.emoji ? <span style={{ fontSize: 30 }}>{beat.emoji}</span> : null}
              <span
                style={{
                  fontFamily,
                  fontSize: 25,
                  fontWeight: 900,
                  color: GOLD,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                }}
              >
                {stepTag}
              </span>
            </div>
          </div>

          {/* Zone 2 (y: 268..960): Center Glassmorphic Visual Card */}
          <div
            style={{
              position: 'absolute',
              top: 268,
              left: 48,
              right: 48,
              height: 690,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {hasCustomMedia ? (
              renderMediaCard(beat, 'reel', durationInFrames)
            ) : (
              <HeroTextCard text={beat.text} emoji={beat.emoji} label={beat.label} accentColor={accent} />
            )}
          </div>

          {/* Zone 3 (y: 985..1245): Bouncy Kinetic Captions */}
          {beat.text && !beat.noAudio ? (
            <div
              style={{
                position: 'absolute',
                top: 985,
                left: 52,
                right: 52,
                height: 260,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <KineticCaptions
                text={beat.text}
                durationInFrames={durationInFrames}
                format="reel"
                fontSize={40}
                highlightColor={accent}
              />
            </div>
          ) : null}

          {/* Zone 4 (bottom: 140..535): Animated Character + Live Presenter Card */}
          {character !== 'none' ? (
            <div
              style={{
                position: 'absolute',
                bottom: 140,
                left: 48,
                right: 48,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <AnimatedCharacter
                character={character}
                mood={mood}
                speaking={speaking}
                cadence={cadence ?? undefined}
                accentColor={accent}
                size={340}
              />
              <PresenterStatusCard
                character={character}
                mood={mood}
                speaking={speaking}
                cadence={cadence}
                accentColor={accent}
                badgeText={beat.label}
              />
            </div>
          ) : null}
        </AbsoluteFill>
      )}
      </KenBurns>
    </AbsoluteFill>
  );
};

/* ─── Hero Card Fallback when beat has no specialized mediaType ─── */
const HeroTextCard: React.FC<{
  text: string;
  emoji?: string;
  label: string;
  accentColor: string;
  isLandscape?: boolean;
}> = ({ text, emoji, label, accentColor, isLandscape }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 12 } });

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isLandscape ? 820 : 920,
        padding: isLandscape ? '42px 44px' : '46px 36px',
        borderRadius: 28,
        background: 'rgba(15, 21, 32, 0.88)',
        border: `2.5px solid ${accentColor}`,
        boxShadow: `0 25px 50px rgba(0,0,0,0.65), 0 0 40px ${accentColor}28`,
        backdropFilter: 'blur(14px)',
        textAlign: 'center',
        transform: `scale(${interpolate(enter, [0, 1], [0.88, 1])})`,
        opacity: enter,
        fontFamily,
      }}
    >
      {emoji ? <div style={{ fontSize: isLandscape ? 64 : 76, marginBottom: 14 }}>{emoji}</div> : null}
      <div
        style={{
          fontSize: isLandscape ? 22 : 24,
          fontWeight: 800,
          color: accentColor,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: isLandscape ? 38 : 44,
          fontWeight: 900,
          color: WHITE,
          lineHeight: 1.28,
        }}
      >
        {text}
      </div>
    </div>
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
        paddingBottom: isLandscape ? 28 : 56,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: isLandscape ? 20 : 24,
          fontWeight: 700,
          color: WHITE,
          background: 'rgba(10, 14, 23, 0.78)',
          border: `1.5px solid ${GOLD}`,
          borderRadius: 999,
          padding: isLandscape ? '8px 24px' : '10px 28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        📰 Full details → {label}
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
  videoKind = 'news',
  scene,
  character = 'arjun',
  bgmMood = 'breaking_news',
  hasBgm,
  hasMotivationBgm,
  hasCorporateBgm,
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

  const resolvedScene = resolveSceneTheme(vertical, videoKind, scene);

  // Duck BGM cleanly while narration speaks
  const hasAnyNarration = Boolean(narration?.headline || narration?.beats?.some(Boolean));
  const bgmVolume = hasAnyNarration ? 0.14 : 0.32;
  const bgmTrack =
    bgmMood === 'motivation' && hasMotivationBgm
      ? BGM_MOTIVATION_FILE
      : bgmMood === 'corporate' && hasCorporateBgm
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
      {/* Segmented Top Progress Bar */}
      {!inCta ? (
        <SegmentedProgressBar
          currentBeatIndex={currentStep}
          totalBeats={totalSteps}
          beatProgress={stepProgress}
          format={format}
        />
      ) : null}

      {/* Background Music Bed */}
      {hasBgm && <Audio src={staticFile(bgmTrack)} loop volume={bgmVolume} />}

      {/* Pure-Code Procedural SFX Layer */}
      {hasSfx && (
        <>
          {/* 0.0s Hook Impact Boom */}
          <Sequence from={0} durationInFrames={Math.min(24, headlineLen)} layout="none">
            <Audio src={staticFile(HOOK_BOOM_FILE)} volume={0.65} />
          </Sequence>

          {/* Per-Beat Transition Whoosh + Data Reveal Ding/Pop */}
          {resolvedBeats.map((beat, i) => {
            const start = beatStart(i);
            const len = beatFrames[i];
            const revealSfx =
              beat.sfx === 'ding' || beat.mediaType === 'stat_callout' || beat.mediaType === 'table'
                ? DING_FILE
                : POP_FILE;
            return (
              <React.Fragment key={`sfx-${i}`}>
                <Sequence from={start} durationInFrames={Math.min(18, len)} layout="none">
                  <Audio src={staticFile(WHOOSH_FILE)} volume={0.42} />
                </Sequence>
                {len > 16 ? (
                  <Sequence from={start + 5} durationInFrames={Math.min(24, len - 5)} layout="none">
                    <Audio src={staticFile(revealSfx)} volume={0.36} />
                  </Sequence>
                ) : null}
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* Headline Narration */}
      {narration?.headline ? (
        <Sequence from={0} durationInFrames={headlineLen} layout="none">
          <Audio src={staticFile(narration.headline.src)} />
        </Sequence>
      ) : null}

      {/* Beat Narrations */}
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
              videoKind={videoKind}
              defaultScene={resolvedScene}
              character={character}
              speaking={Boolean(narration?.headline)}
              cadence={narration?.headlineCadence}
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
                videoKind={videoKind}
                defaultScene={resolvedScene}
                character={character}
                speaking={!beat.noAudio && Boolean(narration?.beats?.[i])}
                cadence={narration?.beatCadences?.[i]}
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
