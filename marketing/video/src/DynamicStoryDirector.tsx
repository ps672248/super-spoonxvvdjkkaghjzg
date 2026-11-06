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
import { getShotDefinition } from './catalog/scenesCatalog';
import { LowPolyMouth } from './LowPolyCharacter';
import { ThreeCharacterScene } from './ThreeCharacterScene';
import audioEnvelopes from './audioEnvelopes.json';

export interface DirectorShotProps {
  sceneId: string;
  speaker: 'arjun' | 'priya' | 'both' | 'screen' | 'narrator';
  voice?: string;
  dialogueHindi: string;
  captionEn?: string;
  audioSrc?: string;
  dialogueClip?: keyof typeof audioEnvelopes;
  audioEnvelope?: number[];
  durationFrames: number;
  cameraMotion?: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'shake' | 'static';
  editorialTag?: string;
  badgeLabel?: string;
  assetPath?: string;
}

export interface DynamicDirectorProps {
  [key: string]: unknown;
  renderEngine?: 'hybrid' | 'threejs';
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
  renderEngine: 'hybrid',
  hasBgm: true,
  featureBadge: '🎮 10+ ARCADE GAMES',
  campaignTitle: 'Exam Anxiety vs Arcade Learning',
  shots: [
    {
      sceneId: 'arjun_head_in_hands_books',
      speaker: 'arjun',
      dialogueHindi: 'Yaar exam itna paas hai aur book kholte hi anxiety ho rahi hai... padhna chahta hoon par dimag freeze ho jata hai!',
      captionEn: 'When exam anxiety freezes your brain...',
      audioSrc: 'audio/narration/dialogue1_arjun.mp3',
      dialogueClip: 'dialogue1_arjun',
      durationFrames: 220,
      cameraMotion: 'zoom_in',
      editorialTag: '// 01 · THE REALITY CHECK',
      badgeLabel: '😰 EXAM ANXIETY',
      assetPath: 'scenes/catalog/arjun_head_in_hands_books.jpg',
    },
    {
      sceneId: 'priya_arms_crossed_smirking',
      speaker: 'priya',
      dialogueHindi: 'Toh tension chhod aur Aspirant Arcade pe games khel na! Yahan 10 se zyada interactive games hain jo tough formulas yaad kara dete hain!',
      captionEn: 'Stop overthinking. Start gaming.',
      audioSrc: 'audio/narration/dialogue2_priya.mp3',
      dialogueClip: 'dialogue2_priya',
      durationFrames: 268,
      cameraMotion: 'zoom_in',
      editorialTag: '// 02 · THE MENTOR INTERVENTION',
      badgeLabel: '💡 STUDY HACK',
      assetPath: 'scenes/catalog/priya_arms_crossed_smirking.jpg',
    },
    {
      sceneId: 'screen_formula_master_combo_10x',
      speaker: 'screen',
      dialogueHindi: 'Formula Master aur Speed Arena mein questions solve karna actual video game jaisa lag raha hai!',
      captionEn: '10+ Gamified Modes for GATE & PSUs',
      audioSrc: 'audio/narration/dialogue4_priya.mp3',
      dialogueClip: 'dialogue4_priya',
      durationFrames: 265,
      cameraMotion: 'pan_right',
      editorialTag: '// 03 · THE GAMEPLAY',
      badgeLabel: '🕹️ FORMULA MASTER',
      assetPath: 'scenes/catalog/screen_formula_master_combo_10x.jpg',
    },
    {
      sceneId: 'arjun_two_thumbs_up_grinning',
      speaker: 'arjun',
      dialogueHindi: 'Ab exam ka koi stress nahi! Daily streaks aur boss battles se concepts chutkiyon mein clear ho gaye!',
      captionEn: 'Confidence restored. Zero stress.',
      audioSrc: 'audio/narration/dialogue5_arjun.mp3',
      dialogueClip: 'dialogue5_arjun',
      durationFrames: 237,
      cameraMotion: 'zoom_in',
      editorialTag: '// 04 · THE BREAKTHROUGH',
      badgeLabel: '🏆 ANXIETY DEFEATED',
      assetPath: 'scenes/catalog/arjun_two_thumbs_up_grinning.jpg',
    },
    {
      sceneId: 'dual_high_five_celebration',
      speaker: 'both',
      dialogueHindi: 'Aaj hi Google Play Store se Aspirant Arcade download karo aur apni exam prep ko level up karo!',
      captionEn: 'Download Aspirant Arcade • Free on Play Store',
      audioSrc: 'audio/narration/dialogue6_both.mp3',
      dialogueClip: 'dialogue6_both',
      durationFrames: 236,
      cameraMotion: 'static',
      editorialTag: '// 05 · CALL TO ACTION',
      badgeLabel: '📲 DOWNLOAD NOW',
      assetPath: 'scenes/catalog/dual_high_five_celebration.jpg',
    },
  ],
};

export const DynamicStoryDirector: React.FC<DynamicDirectorProps> = ({
  renderEngine = 'hybrid',
  hasBgm = true,
  featureBadge = '🎮 10+ ARCADE GAMES',
  shots = DYNAMIC_DIRECTOR_DEFAULT_PROPS.shots,
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
          <ShotRenderer
            shot={shot}
            shotIndex={idx}
            totalShots={shotSchedules.length}
            renderEngine={renderEngine}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SHOT RENDERER (Supports Method 1 Three.js & Method 2 Hybrid)
══════════════════════════════════════════════════════════════════ */
const ShotRenderer: React.FC<{
  shot: DirectorShotProps & { from: number; duration: number };
  shotIndex: number;
  totalShots: number;
  renderEngine?: 'hybrid' | 'threejs';
}> = ({ shot, shotIndex, totalShots, renderEngine = 'hybrid' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shotDef = getShotDefinition(shot.sceneId);

  // 1. Camera Motion Interpolation (Method 2)
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
  const clipKey = shot.dialogueClip;
  if (clipKey && (audioEnvelopes as any)[clipKey]) {
    const env = (audioEnvelopes as any)[clipKey];
    amplitude = env[frame] || 0;
  } else if (shot.audioEnvelope && shot.audioEnvelope.length > 0) {
    amplitude = shot.audioEnvelope[frame] || 0;
  } else {
    const speechActive = frame > 6 && frame < shot.duration - 8;
    if (speechActive) {
      const syllableWave = Math.sin(frame * 0.9) * 0.5 + Math.sin(frame * 1.7) * 0.3 + 0.5;
      amplitude = Math.max(0, Math.min(1, syllableWave));
    }
  }

  // Speaker styling
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

  const imageSrc = shot.assetPath || shotDef.fallbackAsset || 'scenes/catalog/arjun_head_in_hands_books.jpg';

  return (
    <AbsoluteFill>
      {/* Spoken Narration Audio */}
      {shot.audioSrc && <Audio src={staticFile(shot.audioSrc)} volume={1.0} />}

      {/* ─── VISUAL ENGINE SWITCH (Method 1 vs Method 2) ─── */}
      {renderEngine === 'threejs' ? (
        // METHOD 1: Pure Procedural Three.js 3D WebGL Engine
        <AbsoluteFill>
          {isScreen ? (
            <InGameArcadeScreen frame={frame} duration={shot.duration} />
          ) : (
            <ThreeCharacterScene
              variant={isBoth ? 'dual' : isPriya ? 'priya' : 'arjun'}
              mood={isBoth ? 'celebrating' : shot.sceneId.includes('grinning') ? 'celebrating' : shot.sceneId.includes('head_in_hands') ? 'shocked' : 'talking'}
              cameraAngle={isBoth ? 'wide' : isPriya ? 'cinematic_3quarter' : shot.sceneId.includes('grinning') ? 'closeup' : 'cinematic_3quarter'}
              dialogueClip={clipKey}
              dialogueStartFrame={0}
              width={1080}
              height={1920}
            />
          )}
        </AbsoluteFill>
      ) : (
        // METHOD 2: Hybrid 3D Cached Scene Plate + Real-Time Lip-Sync
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
      )}

      {/* Top Scrim Gradient for Subtitle Legibility */}
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

/**
 * High-Tech In-Game Arcade Screen Cutaway (Method 1 & 2)
 */
const InGameArcadeScreen: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const pulse = Math.sin(frame * 0.2) * 0.08 + 1.0;
  const progress = Math.min(1, frame / (duration * 0.75));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#040814',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
      }}
    >
      {/* Background Cyber Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* In-Game HUD Card */}
      <div
        style={{
          width: '920px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          border: '2.5px solid #FDC003',
          borderRadius: '28px',
          padding: '48px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(253, 192, 3, 0.25)',
          marginTop: '120px',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>⚡</span>
            <div>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#FDC003', letterSpacing: '1px' }}>
                FORMULA MASTER · SPEED ARENA
              </p>
              <p style={{ margin: 0, fontSize: '15px', color: '#94A3B8', fontWeight: 600 }}>
                1v1 LIVE MULTIPLAYER · GATE 2026
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '8px 24px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              border: '2px solid #22C55E',
              borderRadius: '999px',
              fontSize: '18px',
              fontWeight: 900,
              color: '#22C55E',
              transform: `scale(${pulse})`,
            }}
          >
            🔥 10x COMBO STREAK
          </div>
        </div>

        {/* Speed Timer Bar */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px', fontWeight: 800, color: '#94A3B8' }}>
            <span>COMBO SPEED GAUGE</span>
            <span style={{ color: '#FDC003' }}>+450 XP (SURGE)</span>
          </div>
          <div style={{ width: '100%', height: '14px', backgroundColor: '#1E293B', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FDC003 0%, #22C55E 100%)',
                boxShadow: '0 0 16px rgba(34, 197, 94, 0.6)',
              }}
            />
          </div>
        </div>

        {/* Question Box */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', letterSpacing: '1px', textTransform: 'uppercase' }}>
            // QUESTION 04 OF 15 · ELECTRICAL & INSTRUMENTATION
          </span>
          <p style={{ margin: '14px 0 0 0', fontSize: '26px', fontWeight: 800, color: WHITE, lineHeight: 1.4 }}>
            In any linear, bilateral circuit, which theorem replaces the whole network with one voltage source and series resistor?
          </p>
        </div>

        {/* Options Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
              fontSize: '20px',
              fontWeight: 700,
              color: '#94A3B8',
            }}
          >
            A. Norton's Theorem
          </div>

          <div
            style={{
              padding: '24px',
              backgroundColor: 'rgba(34, 197, 94, 0.25)',
              borderRadius: '16px',
              border: '2.5px solid #22C55E',
              fontSize: '20px',
              fontWeight: 900,
              color: '#22C55E',
              boxShadow: '0 0 24px rgba(34, 197, 94, 0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>B. Thevenin's Theorem</span>
            <span>✅ +100 PTS</span>
          </div>
        </div>

        {/* Rank Surge Banner */}
        <div
          style={{
            marginTop: '32px',
            padding: '18px 28px',
            backgroundColor: '#1E293B',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(253, 192, 3, 0.3)',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#94A3B8' }}>LIVE LEADERBOARD SURGE</span>
          <span style={{ fontSize: '22px', fontWeight: 900, color: '#FDC003' }}>
            ARJUN: #420 ➔ #12 (TOP 1%) 🚀
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
