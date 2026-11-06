import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { fontFamily } from './Brand';
import { GOLD, MUTED, WHITE, CORRECT_GREEN } from './theme';
import { getShotDefinition, type MouthAnchor } from './catalog/scenesCatalog';
import { LowPolyMouth } from './LowPolyCharacter';

export interface DirectorShotProps {
  sceneId: string;
  speaker: 'arjun' | 'priya' | 'both' | 'screen' | 'narrator';
  voice?: string;
  dialogueHindi: string;
  captionEn?: string;
  audioSrc?: string;
  audioEnvelope?: number[];
  durationFrames: number;
  cameraMotion?: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'shake' | 'static';
  editorialTag?: string;
  badgeLabel?: string;
}

export interface DynamicDirectorProps {
  [key: string]: unknown;
  hasBgm?: boolean;
  featureBadge?: string;
  campaignTitle?: string;
  shots: DirectorShotProps[];
  totalDurationFrames?: number;
  outro?: {
    headlineMain?: string;
    headlineSub?: string;
    tagline?: string;
    ctaButton?: string;
  };
}

export const DYNAMIC_DIRECTOR_DEFAULT_PROPS: DynamicDirectorProps = {
  hasBgm: true,
  featureBadge: '🎮 10+ ARCADE GAMES',
  campaignTitle: 'Exam Anxiety vs Arcade Learning',
  shots: [
    {
      sceneId: 'arjun_head_in_hands_books',
      speaker: 'arjun',
      dialogueHindi: 'Yaar exam itna paas hai aur book kholte hi anxiety ho rahi hai... padhna chahta hoon par dimag freeze ho jata hai!',
      captionEn: 'When exam anxiety freezes your brain...',
      audioSrc: 'audio/narration/dialogue2_arjun.mp3',
      durationFrames: 220,
      cameraMotion: 'zoom_in',
      editorialTag: '// 01 · THE REALITY CHECK',
      badgeLabel: '😰 EXAM ANXIETY',
    },
    {
      sceneId: 'priya_arms_crossed_smirking',
      speaker: 'priya',
      dialogueHindi: 'Toh tension chhod aur Aspirant Arcade pe games khel na! Yahan 10 se zyada interactive games hain jo tough formulas yaad kara dete hain!',
      captionEn: 'Stop overthinking. Start gaming.',
      audioSrc: 'audio/narration/dialogue1_priya.mp3',
      durationFrames: 270,
      cameraMotion: 'zoom_in',
      editorialTag: '// 02 · THE MENTOR INTERVENTION',
      badgeLabel: '💡 STUDY HACK',
    },
    {
      sceneId: 'screen_formula_master_combo_10x',
      speaker: 'screen',
      dialogueHindi: 'Formula Master aur Speed Arena mein questions solve karna actual video game jaisa lag raha hai!',
      captionEn: '10+ Gamified Modes for GATE & PSUs',
      audioSrc: 'audio/narration/dialogue4_priya.mp3',
      durationFrames: 260,
      cameraMotion: 'pan_right',
      editorialTag: '// 03 · THE GAMEPLAY',
      badgeLabel: '🕹️ FORMULA MASTER',
    },
    {
      sceneId: 'arjun_two_thumbs_up_grinning',
      speaker: 'arjun',
      dialogueHindi: 'Ab exam ka koi stress nahi! Daily streaks aur boss battles se concepts chutkiyon mein clear ho gaye!',
      captionEn: 'Confidence restored. Zero stress.',
      audioSrc: 'audio/narration/dialogue5_arjun.mp3',
      durationFrames: 240,
      cameraMotion: 'zoom_in',
      editorialTag: '// 04 · THE BREAKTHROUGH',
      badgeLabel: '🏆 ANXIETY DEFEATED',
    },
    {
      sceneId: 'dual_high_five_celebration',
      speaker: 'both',
      dialogueHindi: 'Aaj hi Google Play Store se Aspirant Arcade download karo aur apni exam prep ko level up karo!',
      captionEn: 'Download Aspirant Arcade • Free on Play Store',
      audioSrc: 'audio/narration/dialogue4_priya.mp3',
      durationFrames: 240,
      cameraMotion: 'static',
      editorialTag: '// 05 · CALL TO ACTION',
      badgeLabel: '📲 DOWNLOAD NOW',
    },
  ],
};

export const DynamicStoryDirector: React.FC<DynamicDirectorProps> = ({
  hasBgm = true,
  featureBadge = '🎮 10+ ARCADE GAMES',
  shots = DYNAMIC_DIRECTOR_DEFAULT_PROPS.shots,
  outro,
}) => {
  // Compute cumulative start frames for each shot
  let cumulative = 0;
  const shotSchedules = shots.map((shot) => {
    const from = cumulative;
    const duration = shot.durationFrames || 180;
    cumulative += duration;
    return { ...shot, from, duration };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#060913',
        fontFamily,
        color: WHITE,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Background BGM */}
      {hasBgm && <Audio src={staticFile('audio/bgm.mp3')} loop volume={0.12} />}

      {/* ─── Top Brand Header (Aspirant Arcade Watermark) ─── */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          left: '48px',
          right: '48px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Img
            src={staticFile('logo_transparent.png')}
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 16px rgba(253, 192, 3, 0.45))',
            }}
          />
          <div>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: WHITE, letterSpacing: '0.5px' }}>
              ASPIRANT ARCADE
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: GOLD, fontWeight: 700 }}>
              Stop scrolling. Start scoring.
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '7px 18px',
            borderRadius: '999px',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            border: `1.5px solid rgba(253, 192, 3, 0.45)`,
            fontSize: '13px',
            fontWeight: 800,
            color: GOLD,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}
        >
          {featureBadge}
        </div>
      </div>

      {/* ─── Dynamic Sequences for Every Shot Directorial Block ─── */}
      {shotSchedules.map((shot, idx) => (
        <Sequence from={shot.from} durationInFrames={shot.duration} key={`${shot.sceneId}-${idx}`}>
          <ShotRenderer shot={shot} shotIndex={idx} totalShots={shotSchedules.length} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SHOT RENDERER (Renders individual director shot from catalog)
══════════════════════════════════════════════════════════════════ */
const ShotRenderer: React.FC<{
  shot: DirectorShotProps & { from: number; duration: number };
  shotIndex: number;
  totalShots: number;
}> = ({ shot, shotIndex, totalShots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shotDef = getShotDefinition(shot.sceneId);

  // 1. Camera Motion Interpolation
  let transform = 'scale(1.05)';
  if (shot.cameraMotion === 'zoom_in' || !shot.cameraMotion) {
    const scale = interpolate(frame, [0, shot.duration], [1.02, 1.16], { extrapolateRight: 'clamp' });
    const y = interpolate(frame, [0, shot.duration], [0, -22], { extrapolateRight: 'clamp' });
    transform = `scale(${scale}) translateY(${y}px)`;
  } else if (shot.cameraMotion === 'zoom_out') {
    const scale = interpolate(frame, [0, shot.duration], [1.16, 1.02], { extrapolateRight: 'clamp' });
    transform = `scale(${scale})`;
  } else if (shot.cameraMotion === 'pan_right') {
    const x = interpolate(frame, [0, shot.duration], [-25, 25], { extrapolateRight: 'clamp' });
    transform = `scale(1.08) translateX(${x}px)`;
  } else if (shot.cameraMotion === 'shake') {
    const shakeX = Math.sin(frame * 0.8) * 6;
    const shakeY = Math.cos(frame * 0.9) * 4;
    transform = `scale(1.08) translate(${shakeX}px, ${shakeY}px)`;
  }

  // 2. Lip-Sync Amplitude calculation
  let amplitude = 0;
  if (shot.audioEnvelope && shot.audioEnvelope.length > 0) {
    amplitude = shot.audioEnvelope[frame] || 0;
  } else {
    // Natural procedural speech cadence fallback
    const speechActive = frame > 6 && frame < shot.duration - 8;
    if (speechActive) {
      const syllableWave = Math.sin(frame * 0.9) * 0.5 + Math.sin(frame * 1.7) * 0.3 + 0.5;
      amplitude = Math.max(0, Math.min(1, syllableWave));
    }
  }

  // Determine speaker styling
  const isArjun = shot.speaker === 'arjun';
  const isPriya = shot.speaker === 'priya';
  const isBoth = shot.speaker === 'both';
  const isScreen = shot.speaker === 'screen';

  let speakerLabel = '📱 ARJUN (Stressed Aspirant)';
  let speakerColor = '#FB7185';
  let speakerBg = 'rgba(244, 63, 94, 0.22)';
  let speakerBorder = 'rgba(244, 63, 94, 0.6)';

  if (isPriya) {
    speakerLabel = '💡 PRIYA (Study Mentor)';
    speakerColor = GOLD;
    speakerBg = 'rgba(253, 192, 3, 0.22)';
    speakerBorder = 'rgba(253, 192, 3, 0.6)';
  } else if (isBoth) {
    speakerLabel = '⚡ ARJUN & PRIYA (Victory Duo)';
    speakerColor = CORRECT_GREEN;
    speakerBg = 'rgba(34, 197, 94, 0.22)';
    speakerBorder = 'rgba(34, 197, 94, 0.6)';
  } else if (isScreen) {
    speakerLabel = '🕹️ ASPIRANT ARCADE (In-Game)';
    speakerColor = '#38BDF8';
    speakerBg = 'rgba(56, 189, 248, 0.22)';
    speakerBorder = 'rgba(56, 189, 248, 0.6)';
  }

  // Use fallback if asset is placeholder
  const imageSrc = shotDef.fallbackAsset || 'scenes/scene1_arjun_desk.jpg';

  return (
    <AbsoluteFill>
      {/* Spoken Narration Audio */}
      {shot.audioSrc && <Audio src={staticFile(shot.audioSrc)} volume={1.0} />}

      {/* Visual Scene Background */}
      <AbsoluteFill
        style={{
          transform,
          transformOrigin: '50% 45%',
        }}
      >
        <Img src={staticFile(imageSrc)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

        {/* Character Procedural Lip-Sync Mouth */}
        {shotDef.mouth && !isScreen && (
          <LowPolyMouth
            amplitude={amplitude}
            centerX={shotDef.mouth.centerX}
            centerY={shotDef.mouth.centerY}
            baseWidth={shotDef.mouth.baseWidth}
            maxHeight={shotDef.mouth.maxHeight}
            rotationDeg={shotDef.mouth.rotationDeg}
            lipColor={shotDef.mouth.lipColor}
          />
        )}

        {/* Ambient atmospheric lighting */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isPriya
              ? 'radial-gradient(circle at 60% 40%, rgba(253, 192, 3, 0.16) 0%, transparent 60%)'
              : 'radial-gradient(circle at 40% 40%, rgba(56, 189, 248, 0.16) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </AbsoluteFill>

      {/* Top Scrim Gradient for Ultra-Crisp Subtitle Legibility */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '430px',
          background: 'linear-gradient(180deg, rgba(6, 9, 19, 0.96) 0%, rgba(6, 9, 19, 0.82) 65%, rgba(6, 9, 19, 0) 100%)',
          zIndex: 32,
          pointerEvents: 'none',
        }}
      />

      {/* Subtitles & Directorial Tag Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '115px',
          left: '48px',
          right: '48px',
          zIndex: 38,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
          <span
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              color: MUTED,
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            {shot.editorialTag || `// 0${shotIndex + 1} · SHOT ${shotIndex + 1}`}
          </span>

          <span
            style={{
              padding: '6px 18px',
              backgroundColor: speakerBg,
              color: speakerColor,
              border: `2px solid ${speakerBorder}`,
              borderRadius: '999px',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            {speakerLabel}
          </span>
        </div>

        {/* Spoken Hindi Subtitle Headline */}
        <h2
          style={{
            fontSize: '44px',
            fontWeight: 900,
            lineHeight: 1.25,
            letterSpacing: '-0.5px',
            margin: '0 auto',
            maxWidth: '850px',
            color: WHITE,
            textShadow: '0 4px 32px rgba(0,0,0,0.92)',
          }}
        >
          "{shot.dialogueHindi}"
        </h2>

        {/* English Context Subtitle */}
        {shot.captionEn && (
          <p
            style={{
              margin: '12px auto 0 auto',
              fontSize: '20px',
              color: GOLD,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textShadow: '0 2px 16px rgba(0,0,0,0.85)',
            }}
          >
            {shot.captionEn}
          </p>
        )}
      </div>

      {/* Bottom Progress Pill Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '44px',
          left: '48px',
          right: '48px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {Array.from({ length: totalShots }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '999px',
              backgroundColor: i < shotIndex ? GOLD : i === shotIndex ? WHITE : 'rgba(255, 255, 255, 0.25)',
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
