import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { CTAOutro, CTA_OUTRO_SECONDS, fontFamily } from './Brand';
import { AnimatedBackground } from './Motion';
import { BGM_FILE } from './audio';
import { GOLD, INK, LOGO_FILE, WHITE } from './theme';

export type MemeCardProps = {
  vertical: string;
  /** Path under public/ of the generated meme, e.g. 'memes/generated/2026-07-28-govt-meme.png'.
   * renderMeme.ts writes it there BEFORE bundle() so staticFile() can serve it. */
  imageFile: string;
  /** Exam name for the top tag, e.g. 'BCA'. Blank when the unfiltered fallback picked the question. */
  examLabel?: string;
  /** Topic for the top tag, e.g. 'Data Structures'. */
  topicLabel?: string;
  /** Rough word count of the concept behind the meme — sizes the hold (see memeTimeline). */
  conceptWords?: number;
  hasBgm?: boolean;
  hasOutro?: boolean;
};

const FPS = 30;
const MIN_HOLD_SECONDS = 4;
const MAX_HOLD_SECONDS = 6;
const WORDS_PER_SECOND = 4; // reading a meme panel is faster than reading prose

export const MEME_CARD_FPS = FPS;

/**
 * Two beats, nothing else. The hold has to be long enough to READ — there's no
 * voiceover carrying it — but the whole video stays 6-8s because completion and
 * loops are what Shorts/Reels actually rank on.
 *
 * Called by both calculateMemeCardMetadata and the component itself, so the
 * duration can never drift between the two (same contract as quizTimeline()).
 */
export function memeTimeline(props: MemeCardProps) {
  const words = props.conceptWords ?? 0;
  const holdSec = Math.min(MAX_HOLD_SECONDS, Math.max(MIN_HOLD_SECONDS, words / WORDS_PER_SECOND));
  const hold = Math.round(holdSec * FPS);
  const cta = CTA_OUTRO_SECONDS * FPS;
  return { hold, cta, total: hold + cta };
}

export const calculateMemeCardMetadata: CalculateMetadataFunction<MemeCardProps> = ({ props }) => ({
  durationInFrames: memeTimeline(props).total,
  props,
});

/**
 * Persistent wordmark with the real app logo. The image prompt explicitly forbids
 * the model from adding any branding, so we add our own — consistently placed,
 * and it survives the screenshot-and-repost path that carries most of a meme's
 * reach.
 */
const Watermark: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      bottom: 40,
      right: 44,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'rgba(10,14,23,0.78)',
      borderRadius: 999,
      padding: '10px 22px 10px 12px',
    }}
  >
    <Img src={staticFile(LOGO_FILE)} style={{ width: 40, height: 40, borderRadius: 10 }} />
    <div style={{ fontFamily, fontSize: 24, fontWeight: 800, color: WHITE, letterSpacing: 0.3 }}>Aspirant Arcade</div>
  </div>
);

/**
 * Exam + topic tag across the top. Rendered here rather than asked of the image
 * model on purpose: the model gets no say over spelling or placement, and the
 * prompt explicitly forbids it adding label-like text (that's what turned the
 * first attempts into infographics). This is also where the letterbox band above
 * a square meme earns its keep.
 */
const chipStyle = (primary: boolean): React.CSSProperties => ({
  fontFamily,
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
  // exam chip is solid gold, topic chip is outlined — primary vs secondary at a
  // glance, even at thumbnail size
  color: primary ? INK : GOLD,
  background: primary ? GOLD : 'rgba(10,14,23,0.78)',
  border: primary ? 'none' : `2px solid ${GOLD}`,
  borderRadius: 999,
  padding: '10px 24px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 440,
});

const ExamTag: React.FC<{ examLabel?: string; topicLabel?: string }> = ({ examLabel, topicLabel }) => {
  const exam = examLabel?.trim();
  const topic = topicLabel?.trim();
  if (!exam && !topic) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: 44,
        right: 44,
        display: 'flex',
        // exam pinned left, topic pinned right — they read as two separate facts
        // rather than one long centred string, and neither pushes the other off
        // when a topic name runs long
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
      }}
    >
      <div style={exam ? chipStyle(true) : { visibility: 'hidden' }}>{exam || '.'}</div>
      {topic ? <div style={chipStyle(false)}>{topic}</div> : null}
    </div>
  );
};

/**
 * The meme image itself is deliberately motionless — no ProgressBar, no KenBurns,
 * nothing applied on top of it. It has to read as a real meme screenshot, and
 * anything moving over it gives away that it's an ad. (The shared
 * AnimatedBackground sits *behind* this, so its drift only shows in the letterbox
 * bars.)
 *
 * objectFit is 'contain', never 'cover': meme templates come in every aspect
 * ratio and cropping one cuts the punchline off.
 */
const MemeFrame: React.FC<{ imageFile: string; examLabel?: string; topicLabel?: string }> = ({
  imageFile,
  examLabel,
  topicLabel,
}) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Img src={staticFile(imageFile)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    <ExamTag examLabel={examLabel} topicLabel={topicLabel} />
    <Watermark />
  </AbsoluteFill>
);

export const MemeCard: React.FC<MemeCardProps> = (props) => {
  const frame = useCurrentFrame();
  const { hold, cta } = memeTimeline(props);
  const inCta = frame >= hold;

  return (
    // Same backdrop as QuizCard/NewsRecap — ink base plus the shared
    // AnimatedBackground. Memes come back square, so the letterbox bars are a
    // large part of a 1080×1920 frame; filling them with the house background
    // keeps the meme reel visually of a piece with the other two rather than
    // introducing a colour that appears nowhere else.
    //
    // The drift only ever shows in those bars — the meme image itself sits on
    // top and stays completely static, which is what lets it read as a real
    // screenshot.
    <AbsoluteFill style={{ background: INK }}>
      <AnimatedBackground />
      {props.hasBgm && <Audio src={staticFile(BGM_FILE)} loop volume={0.35} />}

      {!inCta ? (
        <Sequence from={0} durationInFrames={hold} layout="none">
          <MemeFrame imageFile={props.imageFile} examLabel={props.examLabel} topicLabel={props.topicLabel} />
        </Sequence>
      ) : (
        // CTAOutro reads durationInFrames off its own Sequence context, which is
        // what makes its trailing loop-fade land exactly on the last frame.
        <Sequence from={hold} durationInFrames={cta} layout="none">
          <CTAOutro hasOutro={props.hasOutro} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// Placeholder for Root.tsx only — the real per-render duration always comes
// from calculateMemeCardMetadata above.
export const MEME_CARD_DURATION_IN_FRAMES = MIN_HOLD_SECONDS * FPS + CTA_OUTRO_SECONDS * FPS;
