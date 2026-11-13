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
import { KineticCaptions } from './KineticCaptions';
import { SegmentedProgressBar } from './SegmentedProgressBar';
import { AnimatedCharacter, type CharacterId, type CharacterMood } from './AnimatedCharacter';
import {
  FeaturePhoneMockup,
  MarketingSceneBackdrop,
  type MarketingFeatureId,
  type MarketingSettingId,
} from './MarketingScenes';
import {
  ALERT_BLIP_FILE,
  BGM_FILE,
  DING_FILE,
  HOOK_BOOM_FILE,
  PHONE_BUZZ_FILE,
  POP_FILE,
  WHOOSH_FILE,
} from './audio';
import { GOLD, INK, WHITE } from './theme';
import type { NarrationClip } from './tts';

export type MarketingSceneBeat = {
  /** Story beat tag (e.g. "2:30 AM", "THE TRAP", "THE FIX", "IN ACTION", "YOUR TURN") */
  sceneLabel: string;
  /** Who delivers this dialogue line */
  speaker: 'arjun' | 'priya';
  /** Whether both Arjun & Priya appear on screen together */
  dualCharacters?: boolean;
  /** Emotional pose for the active speaker */
  mood: CharacterMood;
  /** Emotional reaction pose for the second character when dualCharacters is true */
  listenerMood?: CharacterMood;
  /** Draw glowing smartphone in active speaker's hand */
  holdingPhone?: boolean;
  /** Show the large interactive Android feature UI mockup in this scene */
  showPhoneMockup?: boolean;
  /** Crisp English on-screen subtitle/caption */
  captionEn: string;
  /** Conversational Hinglish/English voiceover spoken aloud */
  spokenLine: string;
  /** Optional per-scene setting backdrop override (enables multi-location stories) */
  setting?: MarketingSettingId;
  /** Optional SFX cue */
  sfx?: 'phone_buzz' | 'alert_blip' | 'whoosh' | 'ding' | 'pop';
};

export type MarketingNarration = {
  scenes?: (NarrationClip | null)[];
  sceneCadences?: (number[] | null)[];
  cta?: NarrationClip | null;
};

export type MarketingReelProps = {
  featureId: MarketingFeatureId;
  featureTag: string;
  setting: MarketingSettingId;
  hookLine: string;
  title: string;
  commentPrompt: string;
  scenes: MarketingSceneBeat[];
  narration?: MarketingNarration;
  hasBgm?: boolean;
  hasOutro?: boolean;
  hasSfx?: boolean;
  telegram?: TelegramCta;
};

export const MARKETING_REEL_FPS = 30;
const MIN_SCENE_SEC = 2.8;
const MAX_SCENE_SEC = 12;
const PAD_SEC = 0.35;
const WORDS_PER_SEC = 2.6;

function sceneSeconds(scene: MarketingSceneBeat, clip?: NarrationClip | null): number {
  const words = (scene.captionEn || '').trim().split(/\s+/).filter(Boolean).length;
  const heuristic = Math.max(MIN_SCENE_SEC, words / WORDS_PER_SEC);
  const sec = Math.max(heuristic, clip ? clip.durationSec + PAD_SEC : 0);
  return Math.min(MAX_SCENE_SEC, sec);
}

export function marketingSceneFramesFor(
  scenes: MarketingSceneBeat[],
  narration?: MarketingNarration,
): number[] {
  return scenes.map((s, i) => Math.round(sceneSeconds(s, narration?.scenes?.[i]) * MARKETING_REEL_FPS));
}

export function marketingOutroFramesFor(narration?: MarketingNarration): number {
  const sec = Math.max(CTA_OUTRO_SECONDS + 0.8, narration?.cta ? narration.cta.durationSec + PAD_SEC : 0);
  return Math.round(sec * MARKETING_REEL_FPS);
}

export const calculateMarketingReelMetadata: CalculateMetadataFunction<MarketingReelProps> = ({ props }) => {
  const sceneLens = marketingSceneFramesFor(props.scenes || [], props.narration);
  const outroLen = marketingOutroFramesFor(props.narration);
  return {
    durationInFrames: sceneLens.reduce((a, b) => a + b, 0) + outroLen,
    props,
  };
};

const StorySceneView: React.FC<{
  index: number;
  featureId: MarketingFeatureId;
  featureTag: string;
  defaultSetting: MarketingSettingId;
  hookLine: string;
  scene: MarketingSceneBeat;
  durationInFrames: number;
  speaking: boolean;
  cadence?: number[] | null;
}> = ({
  index,
  featureId,
  featureTag,
  defaultSetting,
  hookLine,
  scene,
  durationInFrames,
  speaking,
  cadence,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const sceneFade = interpolate(frame, [0, 8], [0.25, 1], { extrapolateRight: 'clamp' });
  const isFirst = index === 0;
  const activeChar: CharacterId = scene.speaker;
  const accent = scene.showPhoneMockup ? '#22C55E' : isFirst ? '#F43F5E' : GOLD;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: isFirst ? 1 : sceneFade }}>
      <MarketingSceneBackdrop setting={scene.setting ?? defaultSetting} />
      <Header tag={`APP SPOTLIGHT · ${featureTag}`} livePulse pulseColor={accent} />

      {/* Top Scene Label Pill (y: 185) */}
      <div
        style={{
          position: 'absolute',
          top: 185,
          left: 54,
          right: 54,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [-18, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 22,
            fontWeight: 900,
            color: INK,
            background: accent,
            borderRadius: 999,
            padding: '8px 24px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: `0 0 28px ${accent}66`,
          }}
        >
          {scene.sceneLabel.replace(/_/g, ' ')}
        </div>

        {/* Opening Hook Banner on Scene 1 */}
        {isFirst && hookLine ? (
          <div
            style={{
              fontFamily,
              fontSize: 40,
              fontWeight: 900,
              color: WHITE,
              textAlign: 'center',
              lineHeight: 1.2,
              background: 'rgba(15, 21, 32, 0.84)',
              border: `2px solid ${GOLD}`,
              borderRadius: 24,
              padding: '20px 28px',
              boxShadow: '0 20px 44px rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {hookLine}
          </div>
        ) : null}
      </div>

      {scene.showPhoneMockup ? (
        /* ── FEATURE DEMO LAYOUT: Phone Mockup Center + Captions + Character ── */
        <>
          <div
            style={{
              position: 'absolute',
              top: 260,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <FeaturePhoneMockup featureId={featureId} accentColor={GOLD} />
          </div>

          <div
            style={{
              position: 'absolute',
              top: 990,
              left: 52,
              right: 52,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <KineticCaptions
              text={scene.captionEn}
              durationInFrames={durationInFrames}
              format="reel"
              fontSize={38}
              highlightColor={GOLD}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 120,
              left: 56,
              right: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <AnimatedCharacter
              character={activeChar}
              mood={scene.mood}
              speaking={speaking}
              cadence={cadence ?? undefined}
              accentColor={GOLD}
              size={310}
            />
            <div
              style={{
                flex: 1,
                fontFamily,
                background: 'rgba(15, 21, 32, 0.85)',
                border: `1.5px solid ${GOLD}66`,
                borderRadius: 22,
                padding: '20px 24px',
                color: WHITE,
                boxShadow: '0 14px 32px rgba(0,0,0,0.55)',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: GOLD, marginBottom: 6 }}>
                {activeChar === 'priya' ? 'PRIYA SUGGESTS' : 'ARJUN TRIED IT'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.25 }}>
                Free on Aspirant Arcade · Zero Login
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ── STORY DIALOGUE LAYOUT: Captions Mid-Top + Character(s) Lower Stage ── */
        <>
          <div
            style={{
              position: 'absolute',
              top: isFirst ? 470 : 340,
              left: 52,
              right: 52,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <KineticCaptions
              text={scene.captionEn}
              durationInFrames={durationInFrames}
              format="reel"
              fontSize={44}
              highlightColor={GOLD}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 155,
              left: 44,
              right: 44,
              display: 'flex',
              justifyContent: scene.dualCharacters ? 'space-between' : 'center',
              alignItems: 'flex-end',
              gap: 16,
            }}
          >
            {scene.dualCharacters ? (
              <>
                <AnimatedCharacter
                  character="arjun"
                  mood={activeChar === 'arjun' ? scene.mood : scene.listenerMood ?? 'thinking'}
                  speaking={activeChar === 'arjun' && speaking}
                  cadence={activeChar === 'arjun' ? cadence ?? undefined : undefined}
                  holdingPhone={activeChar === 'arjun' && scene.holdingPhone}
                  dimmed={activeChar !== 'arjun'}
                  accentColor={GOLD}
                  size={390}
                />
                <AnimatedCharacter
                  character="priya"
                  mood={activeChar === 'priya' ? scene.mood : scene.listenerMood ?? 'explaining'}
                  speaking={activeChar === 'priya' && speaking}
                  cadence={activeChar === 'priya' ? cadence ?? undefined : undefined}
                  holdingPhone={activeChar === 'priya' && scene.holdingPhone}
                  dimmed={activeChar !== 'priya'}
                  accentColor="#38BDF8"
                  size={390}
                />
              </>
            ) : (
              <AnimatedCharacter
                character={activeChar}
                mood={scene.mood}
                speaking={speaking}
                cadence={cadence ?? undefined}
                holdingPhone={scene.holdingPhone}
                accentColor={activeChar === 'priya' ? '#38BDF8' : GOLD}
                size={480}
              />
            )}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const MarketingReel: React.FC<MarketingReelProps> = ({
  featureId,
  featureTag,
  setting,
  hookLine,
  commentPrompt,
  scenes,
  narration,
  hasBgm,
  hasOutro,
  hasSfx,
  telegram,
}) => {
  const frame = useCurrentFrame();
  const sceneLens = marketingSceneFramesFor(scenes, narration);
  const outroLen = marketingOutroFramesFor(narration);
  const totalNonCta = sceneLens.reduce((a, b) => a + b, 0);
  const inCta = frame >= totalNonCta;

  const sceneStart = (i: number) => sceneLens.slice(0, i).reduce((a, b) => a + b, 0);

  let currentStep = 0;
  let stepProgress = 0;
  let acc = 0;
  for (let i = 0; i < sceneLens.length; i++) {
    if (frame >= acc && frame < acc + sceneLens[i]) {
      currentStep = i;
      stepProgress = (frame - acc) / sceneLens[i];
      break;
    }
    acc += sceneLens[i];
  }

  const hasNarration = Boolean(narration?.scenes?.some(Boolean));

  return (
    <AbsoluteFill style={{ background: INK }}>
      {!inCta ? (
        <SegmentedProgressBar
          currentBeatIndex={currentStep}
          totalBeats={sceneLens.length}
          beatProgress={stepProgress}
          format="reel"
        />
      ) : null}

      {hasBgm && <Audio src={staticFile(BGM_FILE)} loop volume={hasNarration ? 0.14 : 0.30} />}

      {/* Procedural SFX Layer */}
      {hasSfx && (
        <>
          <Sequence from={0} durationInFrames={Math.min(20, sceneLens[0] ?? 20)} layout="none">
            <Audio
              src={staticFile(scenes[0]?.sfx === 'phone_buzz' ? PHONE_BUZZ_FILE : HOOK_BOOM_FILE)}
              volume={0.62}
            />
          </Sequence>
          {scenes.map((sc, i) => {
            if (i === 0) return null;
            const start = sceneStart(i);
            const len = sceneLens[i];
            const sfxFile =
              sc.sfx === 'alert_blip' || sc.showPhoneMockup
                ? ALERT_BLIP_FILE
                : sc.sfx === 'ding'
                ? DING_FILE
                : sc.sfx === 'phone_buzz'
                ? PHONE_BUZZ_FILE
                : POP_FILE;
            return (
              <React.Fragment key={`msfx-${i}`}>
                <Sequence from={start} durationInFrames={Math.min(16, len)} layout="none">
                  <Audio src={staticFile(WHOOSH_FILE)} volume={0.40} />
                </Sequence>
                {len > 14 ? (
                  <Sequence from={start + 4} durationInFrames={Math.min(20, len - 4)} layout="none">
                    <Audio src={staticFile(sfxFile)} volume={0.42} />
                  </Sequence>
                ) : null}
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* Voiceover Clips */}
      {scenes.map((_, i) =>
        narration?.scenes?.[i] ? (
          <Sequence key={`mn-${i}`} from={sceneStart(i)} durationInFrames={sceneLens[i]} layout="none">
            <Audio src={staticFile(narration.scenes[i]!.src)} />
          </Sequence>
        ) : null,
      )}
      {narration?.cta ? (
        <Sequence from={totalNonCta} durationInFrames={outroLen} layout="none">
          <Audio src={staticFile(narration.cta.src)} />
        </Sequence>
      ) : null}

      {/* Visual Scenes + Outro */}
      {!inCta ? (
        <Series>
          {scenes.map((sc, i) => (
            <Series.Sequence key={`mscene-${i}`} durationInFrames={sceneLens[i]} layout="none">
              <StorySceneView
                index={i}
                featureId={featureId}
                featureTag={featureTag}
                defaultSetting={setting}
                hookLine={hookLine}
                scene={sc}
                durationInFrames={sceneLens[i]}
                speaking={Boolean(narration?.scenes?.[i])}
                cadence={narration?.sceneCadences?.[i]}
              />
            </Series.Sequence>
          ))}
        </Series>
      ) : (
        <Sequence from={totalNonCta} durationInFrames={outroLen} layout="none">
          <AbsoluteFill>
            <CTAOutro hasOutro={hasOutro} telegram={telegram} duckOutroSting={Boolean(narration?.cta)} />
            {commentPrompt ? (
              <div
                style={{
                  position: 'absolute',
                  bottom: 140,
                  left: 60,
                  right: 60,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily,
                    fontSize: 26,
                    fontWeight: 800,
                    color: GOLD,
                    background: 'rgba(15, 21, 32, 0.90)',
                    border: `1.5px solid ${GOLD}`,
                    borderRadius: 999,
                    padding: '12px 28px',
                    textAlign: 'center',
                  }}
                >
                  💬 {commentPrompt}
                </div>
              </div>
            ) : null}
          </AbsoluteFill>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

export const MARKETING_REEL_DURATION_IN_FRAMES = 5 * 100 + 84;
