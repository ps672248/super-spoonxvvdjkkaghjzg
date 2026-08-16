import React from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Audio } from '@remotion/media';
import { CTAOutro, CTA_OUTRO_SECONDS, Header, fontFamily } from './Brand';
import { AnimatedBackground, ConfettiBurst, KenBurns, ProgressBar } from './Motion';
import { BORDER, CORRECT_GREEN, GOLD, INK, MUTED, PANEL, VERTICAL_LABEL, WHITE } from './theme';
import { QUIZ_BGM_FILE, REVEAL_FILE, TICK_FILE } from './audio';
import type { NarrationClip } from './tts';

export type QuizNarration = {
  hook?: NarrationClip | null;
  question?: NarrationClip | null;
  pause?: NarrationClip | null;
  reveal?: NarrationClip | null;
};

export type QuizCardProps = {
  vertical: string;
  question: string;
  options: string[]; // exactly 4
  correctIndex: number; // 0-3
  explanation?: string;
  /** First-1.5s pattern-interrupt line (Gemini-authored, fallback pool in metadata.ts). */
  hookLine?: string;
  /** Overrides the vertical label in the header — Sunday's reel is pinned to
   *  one exam, and "SSC CGL · 12 DAYS LEFT" is a far stronger hook than
   *  "GOVT EXAMS". Set by render.ts from the day's calendar target. */
  headerTag?: string;
  /** Voiceover clips generated pre-render by src/tts.ts — all optional; scenes stretch to fit them. */
  narration?: QuizNarration;
  /** Set by render.ts based on whether the file actually exists in public/ — see src/audio.ts. */
  hasBgm?: boolean;
  hasTick?: boolean;
  hasReveal?: boolean;
  hasOutro?: boolean;
};

const FPS = 30;
export const QUIZ_CARD_FPS = FPS;

const PAD_SEC = 0.4; // breathing room after a narration clip ends

function sceneFrames(minSec: number, clip?: NarrationClip | null): number {
  return Math.round(Math.max(minSec, clip ? clip.durationSec + PAD_SEC : 0) * FPS);
}

/** Narration-driven scene lengths + cumulative start frames. The single source of
 * truth for both the composition and calculateQuizCardMetadata — scenes stretch to
 * fit their voiceover but never fall below the silent-render minimums. */
export function quizTimeline(props: QuizCardProps) {
  const n = props.narration ?? {};
  const hook = props.hookLine ? sceneFrames(1.5, n.hook) : 0;
  const question = sceneFrames(3.5, n.question);
  const countdown = 3 * FPS;
  const pause = sceneFrames(2, n.pause);
  const reveal = sceneFrames(4, n.reveal);
  const cta = CTA_OUTRO_SECONDS * FPS;
  const starts = {
    hook: 0,
    question: hook,
    countdown: hook + question,
    pause: hook + question + countdown,
    reveal: hook + question + countdown + pause,
    cta: hook + question + countdown + pause + reveal,
  };
  return { hook, question, countdown, pause, reveal, cta, starts, total: starts.cta + cta };
}

export const calculateQuizCardMetadata: CalculateMetadataFunction<QuizCardProps> = ({ props }) => ({
  durationInFrames: quizTimeline(props).total,
  props,
});

// Static default matching the placeholder defaultProps (no hook, no narration) — Root.tsx only.
export const QUIZ_CARD_DURATION_IN_FRAMES = quizTimeline({
  vertical: 'engineering',
  question: '',
  options: [],
  correctIndex: 0,
}).total;

const OptionRow: React.FC<{
  index: number;
  text: string;
  isCorrect: boolean;
  showReveal: boolean;
  revealLocalFrame: number;
  enterFrame: number;
}> = ({ index, text, isCorrect, showReveal, revealLocalFrame, enterFrame }) => {
  const { fps } = useVideoConfig();
  // springy stagger with a touch of overshoot — livelier than the old damped slide
  const enter = spring({ frame: enterFrame - index * 5, fps, config: { damping: 13, mass: 0.8 } });
  const translateY = interpolate(enter, [0, 1], [46, 0]);
  const slideX = interpolate(enter, [0, 1], [index % 2 === 0 ? -36 : 36, 0]);

  const dimmed = showReveal && !isCorrect;
  const highlighted = showReveal && isCorrect;
  // correct option pops (1 → 1.08 → 1) as the reveal lands
  const pop = highlighted ? spring({ frame: revealLocalFrame, fps, config: { damping: 9, mass: 0.6 } }) : 0;
  const popScale = highlighted ? 1 + Math.sin(Math.min(pop, 1) * Math.PI) * 0.08 : 1;

  return (
    <div
      style={{
        opacity: Math.min(1, enter) * (dimmed ? 0.35 : 1),
        transform: `translate(${slideX}px, ${translateY}px) scale(${popScale})`,
        filter: dimmed ? 'saturate(0.4)' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        background: PANEL,
        border: `3px solid ${highlighted ? CORRECT_GREEN : BORDER}`,
        boxShadow: highlighted ? `0 0 44px rgba(34,197,94,0.35)` : undefined,
        borderRadius: 24,
        padding: '28px 32px',
        marginBottom: 22,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 30,
          fontWeight: 800,
          color: highlighted ? CORRECT_GREEN : GOLD,
          width: 44,
          flexShrink: 0,
        }}
      >
        {String.fromCharCode(65 + index)}
      </div>
      <div style={{ fontFamily, fontSize: 32, fontWeight: 600, color: WHITE, lineHeight: 1.3 }}>{text}</div>
      {highlighted && (
        <div style={{ marginLeft: 'auto', fontFamily, fontSize: 32, fontWeight: 800, color: CORRECT_GREEN }}>✓</div>
      )}
    </div>
  );
};

const Countdown: React.FC<{ localFrame: number; fps: number }> = ({ localFrame, fps }) => {
  const secondsLeft = 3 - Math.floor(localFrame / fps);
  if (secondsLeft < 1 || secondsLeft > 3) return null;
  const withinSecond = localFrame % fps;
  const pulse = spring({ frame: withinSecond, fps, config: { damping: 12 } });
  const scale = interpolate(pulse, [0, 1], [1.4, 1]);
  const opacity = interpolate(withinSecond, [0, 4, fps - 6, fps], [0, 1, 1, 0]);
  // urgency builds: ring glow + screen-edge vignette intensify as time runs out
  const urgency = interpolate(localFrame, [0, 3 * fps], [0, 1]);
  const glow = 18 + urgency * 42;

  return (
    <>
      <AbsoluteFill
        style={{
          boxShadow: `inset 0 0 ${120 + urgency * 160}px rgba(253,192,3,${0.05 + urgency * 0.16})`,
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 320 }}>
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            width: 160,
            height: 160,
            borderRadius: 80,
            border: `4px solid ${GOLD}`,
            background: 'rgba(253,192,3,0.08)',
            boxShadow: `0 0 ${glow}px rgba(253,192,3,0.5)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontFamily, fontSize: 84, fontWeight: 800, color: GOLD }}>{secondsLeft}</div>
        </div>
      </AbsoluteFill>
    </>
  );
};

/** 0–1.5s pattern interrupt — the swipe/stay decision happens here. */
const HookScene: React.FC<{ hookLine: string; vertical: string; headerTag?: string }> = ({ hookLine, vertical, headerTag }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame, fps, config: { damping: 10, mass: 0.7 } });
  const scale = interpolate(punch, [0, 1], [0.55, 1]);

  return (
    <>
      <Header tag={headerTag || VERTICAL_LABEL[vertical] || vertical} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: '0 64px' }}>
        <div
          style={{
            opacity: Math.min(1, punch * 1.4),
            transform: `scale(${scale})`,
            fontFamily,
            fontSize: 64,
            fontWeight: 800,
            color: WHITE,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {hookLine}
        </div>
        <div
          style={{
            opacity: interpolate(frame, [8, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            marginTop: 36,
            fontFamily,
            fontSize: 28,
            fontWeight: 700,
            color: GOLD, 
            letterSpacing: 3,
          }}
        >
          CAN YOU ANSWER IT?
        </div>
      </AbsoluteFill>
    </>
  );
};

/** Between countdown and reveal — explicit comment bait, also narrated. */
const PauseOverlay: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();
  const punch = spring({ frame: localFrame, fps, config: { damping: 11, mass: 0.7 } });
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10,14,23,0.82)',
        opacity: Math.min(1, localFrame / 4),
      }}
    >
      <div
        style={{
          transform: `scale(${interpolate(punch, [0, 1], [0.6, 1])})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          textAlign: 'center',
          padding: '0 64px',
        }}
      >
        <div style={{ fontFamily, fontSize: 88 }}>⏸️</div>
        <div style={{ fontFamily, fontSize: 54, fontWeight: 800, color: WHITE, lineHeight: 1.2 }}>Pause now</div>
        <div style={{ fontFamily, fontSize: 40, fontWeight: 700, color: GOLD }}>Comment your answer 👇</div>
      </div>
    </AbsoluteFill>
  );
};

export const QuizCard: React.FC<QuizCardProps> = (props) => {
  const { vertical, question, options, correctIndex, explanation, hookLine, headerTag, narration, hasBgm, hasTick, hasReveal, hasOutro } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = quizTimeline(props);

  const inHook = frame < tl.starts.question;
  const inCta = frame >= tl.starts.cta;
  const inPause = frame >= tl.starts.pause && frame < tl.starts.reveal;
  const showReveal = frame >= tl.starts.reveal;
  const revealLocalFrame = frame - tl.starts.reveal;

  const questionOpacity = interpolate(frame - tl.starts.question, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bgmVolume = narration ? 0.18 : 0.35; // duck the bed under voiceover

  return (
    <AbsoluteFill style={{ background: INK }}>
      <AnimatedBackground />
      {hasBgm && <Audio src={staticFile(QUIZ_BGM_FILE)} volume={bgmVolume} />}

      {/* narration clips — each pinned to its scene start */}
      {narration?.hook && hookLine ? (
        <Sequence from={tl.starts.hook} durationInFrames={tl.hook} layout="none">
          <Audio src={staticFile(narration.hook.src)} />
        </Sequence>
      ) : null}
      {narration?.question ? (
        <Sequence from={tl.starts.question} durationInFrames={tl.question + tl.countdown} layout="none">
          <Audio src={staticFile(narration.question.src)} />
        </Sequence>
      ) : null}
      {narration?.pause ? (
        <Sequence from={tl.starts.pause} durationInFrames={tl.pause} layout="none">
          <Audio src={staticFile(narration.pause.src)} />
        </Sequence>
      ) : null}
      {narration?.reveal ? (
        <Sequence from={tl.starts.reveal} durationInFrames={tl.reveal} layout="none">
          <Audio src={staticFile(narration.reveal.src)} />
        </Sequence>
      ) : null}

      {inHook && hookLine ? (
        <HookScene hookLine={hookLine} vertical={vertical} headerTag={headerTag} />
      ) : !inCta ? (
        <>
          <KenBurns durationInFrames={tl.starts.cta - tl.starts.question}>
            <Header tag={headerTag || VERTICAL_LABEL[vertical] || vertical} />

            <AbsoluteFill style={{ justifyContent: 'center', padding: '0 56px' }}>
              <div
                style={{
                  opacity: questionOpacity,
                  fontFamily,
                  fontSize: 44,
                  fontWeight: 800,
                  color: WHITE,
                  lineHeight: 1.25,
                  marginBottom: 48,
                }}
              >
                {question}
              </div>

              {options.map((opt, i) => (
                <OptionRow
                  key={i}
                  index={i}
                  text={opt}
                  isCorrect={i === correctIndex}
                  showReveal={showReveal}
                  revealLocalFrame={revealLocalFrame}
                  enterFrame={frame - tl.starts.question - 8}
                />
              ))}

              {showReveal && explanation ? (
                <div
                  style={{
                    opacity: interpolate(revealLocalFrame, [6, 20], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    }),
                    marginTop: 12,
                    fontFamily,
                    fontSize: 26,
                    fontWeight: 400,
                    color: MUTED,
                    lineHeight: 1.4,
                  }}
                >
                  {explanation}
                </div>
              ) : null}
            </AbsoluteFill>
          </KenBurns>

          <Countdown localFrame={frame - tl.starts.countdown} fps={fps} />

          {inPause && <PauseOverlay localFrame={frame - tl.starts.pause} />}

          {showReveal && (
            <Sequence from={tl.starts.reveal} durationInFrames={Math.round(1.3 * fps)} layout="none">
              <ConfettiBurst />
            </Sequence>
          )}

          {/* compact CTA banner during reveal — the full-screen outro is only 2s now */}
          {showReveal && (
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 90 }}>
              <div
                style={{
                  opacity: interpolate(revealLocalFrame, [18, 30], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                  fontFamily,
                  fontSize: 26,
                  fontWeight: 800,
                  color: INK,
                  background: GOLD,
                  borderRadius: 999,
                  padding: '14px 36px',
                }}
              >
                📲 Practice free — Aspirant Arcade
              </div>
            </AbsoluteFill>
          )}

          {hasTick && (
            // One continuous play across the whole 3s countdown beat — not
            // one-shot per second. A 3s tick.mp3 (ticking clock, running beep)
            // matches this exactly; a shorter one just finishes early and goes quiet.
            <Sequence from={tl.starts.countdown} durationInFrames={tl.countdown} layout="none">
              <Audio src={staticFile(TICK_FILE)} volume={0.6} />
            </Sequence>
          )}

          {hasReveal && (
            <Sequence from={tl.starts.reveal} durationInFrames={fps} layout="none">
              <Audio src={staticFile(REVEAL_FILE)} volume={0.7} />
            </Sequence>
          )}
        </>
      ) : (
        // Wrapped in its own Sequence so useCurrentFrame() inside CTAOutro is
        // 0-based for this beat, not the global (already-elapsed) frame count.
        <Sequence from={tl.starts.cta} durationInFrames={tl.cta} layout="none">
          <CTAOutro hasOutro={hasOutro} />
        </Sequence>
      )}

      <ProgressBar />
    </AbsoluteFill>
  );
};
