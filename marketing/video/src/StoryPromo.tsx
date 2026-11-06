import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
  interpolate,
} from 'remotion';
import { Audio } from '@remotion/media';
import { fontFamily } from './Brand';
import { BORDER, GOLD, INK, MUTED, PANEL, WHITE, CORRECT_GREEN } from './theme';
import audioEnvelopes from './audioEnvelopes.json';
import { LowPolyMouth } from './LowPolyCharacter';

export interface StoryDialogue {
  hindi: string;
  englishSub?: string;
  audioSrc?: string;
  durationFrames?: number;
}

export interface StoryPromoProps {
  hasBgm?: boolean;
  featureTag?: string;
  scene1Priya?: StoryDialogue;
  scene1Arjun?: StoryDialogue;
  scene2Priya?: StoryDialogue;
  scene2Arjun?: StoryDialogue;
  scene3Arjun?: StoryDialogue;
  outro?: {
    headlineMain?: string;
    headlineSub?: string;
    tagline?: string;
    ctaButton?: string;
  };
}

export const STORY_PROMO_DURATION_IN_FRAMES = 1310; // ~43.6 seconds @ 30fps

export const StoryPromo: React.FC<StoryPromoProps> = ({
  hasBgm = true,
  featureTag = 'Focus Guard',
  scene1Priya,
  scene1Arjun,
  scene2Priya,
  scene2Arjun,
  scene3Arjun,
  outro,
}) => {
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
      {/* Background BGM Bed */}
      {hasBgm && <Audio src={staticFile('audio/bgm.mp3')} loop volume={0.12} />}

      {/* ─── Top Header Watermark (Real Aspirant Arcade Logo) ─── */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          left: '48px',
          right: '48px',
          zIndex: 40,
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
            padding: '7px 16px',
            borderRadius: '999px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: `1.5px solid rgba(253, 192, 3, 0.4)`,
            fontSize: '13px',
            fontWeight: 800,
            color: GOLD,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}
        >
          {featureTag}
        </div>
      </div>

      {/* ─── SCENE 1 (Frames 0 - 490): The Reality Check Hook ─── */}
      <Sequence from={0} durationInFrames={490}>
        <Scene1RealityCheck priyaDialogue={scene1Priya} arjunDialogue={scene1Arjun} />
      </Sequence>

      {/* ─── SCENE 2 (Frames 490 - 830): The Focus Guard Intervention (POV Phone) ─── */}
      <Sequence from={490} durationInFrames={340}>
        <Scene2Intervention priyaDialogue={scene2Priya} arjunDialogue={scene2Arjun} />
      </Sequence>

      {/* ─── SCENE 3 (Frames 830 - 1070): The Breakthrough ─── */}
      <Sequence from={830} durationInFrames={240}>
        <Scene3Breakthrough arjunDialogue={scene3Arjun} />
      </Sequence>

      {/* ─── SCENE 4 (Frames 1070 - 1310): Dual Victory & CTA Outro ─── */}
      <Sequence from={1070} durationInFrames={240}>
        <Scene4Outro outroProps={outro} />
      </Sequence>
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCENE 1: THE REALITY CHECK (Cinematic 3D Low-Poly Arjun & Priya)
   Matching @base.learn Reel 1 (Arjun at desk) & Reel 2 (Priya mentor)
══════════════════════════════════════════════════════════════════ */
const Scene1RealityCheck: React.FC<{
  priyaDialogue?: StoryDialogue;
  arjunDialogue?: StoryDialogue;
}> = ({ priyaDialogue, arjunDialogue }) => {
  const frame = useCurrentFrame();

  // Part A (Arjun speaks): 0 to 221 frames
  // Part B (Priya speaks): 221 to 490 frames
  const isArjunPart = frame < 221;

  // Cinematic Ken Burns Camera Motion
  const arjunScale = interpolate(frame, [0, 220], [1.02, 1.18], { extrapolateRight: 'clamp' });
  const arjunY = interpolate(frame, [0, 220], [0, -30], { extrapolateRight: 'clamp' });

  const priyaLocalFrame = frame - 221;
  const priyaScale = interpolate(priyaLocalFrame, [0, 269], [1.03, 1.16], { extrapolateRight: 'clamp' });
  const priyaY = interpolate(priyaLocalFrame, [0, 269], [0, -25], { extrapolateRight: 'clamp' });

  // Audio amplitude for subtle screen light pulse
  const clipKey = isArjunPart ? 'dialogue1_arjun' : 'dialogue2_priya';
  const ampArray = (audioEnvelopes as any)[clipKey] || [];
  const localIndex = isArjunPart ? frame : priyaLocalFrame;
  const amplitude = ampArray[localIndex] || 0;

  return (
    <AbsoluteFill>
      {/* 1. Spoken Audio */}
      <Sequence from={0} durationInFrames={221}>
        <Audio src={staticFile(arjunDialogue?.audioSrc || 'audio/narration/dialogue1_arjun.mp3')} volume={1.0} />
      </Sequence>
      <Sequence from={221} durationInFrames={269}>
        <Audio src={staticFile(priyaDialogue?.audioSrc || 'audio/narration/dialogue2_priya.mp3')} volume={1.0} />
      </Sequence>

      {/* 2. Visual 3D Low-Poly World */}
      {isArjunPart ? (
        <AbsoluteFill
          style={{
            transform: `scale(${arjunScale}) translateY(${arjunY}px)`,
            transformOrigin: '55% 40%',
          }}
        >
          <Img
            src={staticFile('scenes/scene1_arjun_desk.jpg')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Real-time audio-synced Lip Sync Mouth */}
          <LowPolyMouth
            amplitude={amplitude}
            centerX="59.9%"
            centerY="40.3%"
            baseWidth={24}
            maxHeight={14}
            rotationDeg={-6}
            lipColor="rgba(100, 45, 30, 0.95)"
          />
          {/* Subtle audio-reactive monitor glow reflection overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.22) 0%, transparent 60%)',
              opacity: 0.6 + amplitude * 0.4,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            transform: `scale(${priyaScale}) translateY(${priyaY}px)`,
            transformOrigin: '50% 35%',
          }}
        >
          <Img
            src={staticFile('scenes/scene2_priya_desk.jpg')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Real-time audio-synced Lip Sync Mouth */}
          <LowPolyMouth
            amplitude={amplitude}
            centerX="65.75%"
            centerY="39.97%"
            baseWidth={26}
            maxHeight={14}
            rotationDeg={1}
            lipColor="rgba(110, 40, 30, 0.95)"
          />
          {/* Warm desk lamp glow overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 18% 40%, rgba(253, 192, 3, 0.18) 0%, transparent 55%)',
              opacity: 0.7 + amplitude * 0.3,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
        </AbsoluteFill>
      )}

      {/* 3. Top Scrim Gradient for Ultra-Crisp Subtitle Readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '420px',
          background: 'linear-gradient(180deg, rgba(6, 9, 19, 0.94) 0%, rgba(6, 9, 19, 0.80) 65%, rgba(6, 9, 19, 0) 100%)',
          zIndex: 32,
          pointerEvents: 'none',
        }}
      />

      {/* 4. Editorial Subtitle Card (Reel 2 Style: // 01 · the hook) */}
      <div
        style={{
          position: 'absolute',
          top: '115px',
          left: '48px',
          right: '48px',
          zIndex: 35,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
          <span
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              color: MUTED,
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            // 01 · THE HOOK
          </span>

          <span
            style={{
              padding: '6px 18px',
              backgroundColor: isArjunPart ? 'rgba(244, 63, 94, 0.25)' : 'rgba(253, 192, 3, 0.25)',
              color: isArjunPart ? '#FB7185' : GOLD,
              border: `2px solid ${isArjunPart ? 'rgba(244, 63, 94, 0.6)' : 'rgba(253, 192, 3, 0.6)'}`,
              borderRadius: '999px',
              fontWeight: 900,
              fontSize: '14px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            {isArjunPart ? '📱 ARJUN (Stressed Aspirant)' : '💡 PRIYA (Study Buddy)'}
          </span>
        </div>

        <h2
          style={{
            fontSize: '44px',
            fontWeight: 900,
            lineHeight: 1.25,
            letterSpacing: '-0.5px',
            margin: '0 auto',
            maxWidth: '820px',
            color: WHITE,
            textShadow: '0 4px 30px rgba(0,0,0,0.85)',
          }}
        >
          {isArjunPart ? (
            arjunDialogue?.hindi ? `"${arjunDialogue.hindi}"` : (
              <>
                "Bhai sach bata... phone sirf <span style={{ color: GOLD }}>5 MINUTE</span> ke liye uthaya tha, aur 2 ghante se swipe kar raha hoon!"
              </>
            )
          ) : (
            priyaDialogue?.hindi ? `"${priyaDialogue.hindi}"` : (
              <>
                "Aur raat ko guilt karega: <span style={{ color: '#FB7185' }}>'Aaj ka syllabus phir reh gaya!'</span> Kitni baar bola hai Focus Guard laga le!"
              </>
            )
          )}
        </h2>
      </div>
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCENE 2: THE INTERVENTION (First-Person POV of Smartphone)
   Reels Feed Blocked by Holographic Focus Guard GATE Quiz
══════════════════════════════════════════════════════════════════ */
const Scene2Intervention: React.FC<{
  priyaDialogue?: StoryDialogue;
  arjunDialogue?: StoryDialogue;
}> = ({ priyaDialogue, arjunDialogue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Part A (Arjun asks): 0 to 74 frames (490-564 in master)
  // Part B (Priya explains on POV phone): 74 to 340 frames (564-830 in master)
  const isArjunAsking = frame < 74;

  const priyaLocalFrame = frame - 74;
  const isAnswerRevealed = priyaLocalFrame > 140;

  // Cinematic Camera push-in towards the smartphone screen
  const cameraZoom = interpolate(frame, [0, 340], [1.02, 1.15], { extrapolateRight: 'clamp' });
  const cameraY = interpolate(frame, [0, 340], [0, -20], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* 1. Spoken Audio */}
      <Sequence from={0} durationInFrames={74}>
        <Audio src={staticFile(arjunDialogue?.audioSrc || 'audio/narration/dialogue3_arjun.mp3')} volume={1.0} />
      </Sequence>
      <Sequence from={74} durationInFrames={266}>
        <Audio src={staticFile(priyaDialogue?.audioSrc || 'audio/narration/dialogue4_priya.mp3')} volume={1.0} />
      </Sequence>

      {/* 2. Visual Scene */}
      {isArjunAsking ? (
        <AbsoluteFill
          style={{
            transform: 'scale(1.15) translateY(-30px)',
            transformOrigin: '55% 40%',
          }}
        >
          <Img
            src={staticFile('scenes/scene1_arjun_desk.jpg')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <LowPolyMouth
            amplitude={((audioEnvelopes as any)['dialogue3_arjun'] || [])[frame] || 0}
            centerX="59.9%"
            centerY="40.3%"
            baseWidth={24}
            maxHeight={14}
            rotationDeg={-6}
            lipColor="rgba(100, 45, 30, 0.95)"
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom}) translateY(${cameraY}px)`,
            transformOrigin: '50% 50%',
          }}
        >
          <Img
            src={staticFile('scenes/scene3_phone_intervention.jpg')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Holographic cyan/gold energy shimmer */}
          <div
            style={{
              position: 'absolute',
              top: '28%',
              left: '30%',
              width: '40%',
              height: '35%',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
              opacity: Math.sin(frame / 6) * 0.2 + 0.8,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
        </AbsoluteFill>
      )}

      {/* 3. Top Scrim Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '420px',
          background: 'linear-gradient(180deg, rgba(6, 9, 19, 0.94) 0%, rgba(6, 9, 19, 0.80) 65%, rgba(6, 9, 19, 0) 100%)',
          zIndex: 32,
          pointerEvents: 'none',
        }}
      />

      {/* 4. Editorial Subtitle Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '115px',
          left: '48px',
          right: '48px',
          zIndex: 35,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
          <span
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              color: MUTED,
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            // 02 · THE INTERVENTION
          </span>
          <span
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(34, 197, 94, 0.25)',
              color: CORRECT_GREEN,
              border: '2px solid rgba(34, 197, 94, 0.6)',
              borderRadius: '999px',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            🛡️ Focus Guard Active
          </span>
        </div>

        <h2
          style={{
            fontSize: '42px',
            fontWeight: 900,
            lineHeight: 1.25,
            color: WHITE,
            margin: '0 auto',
            maxWidth: '820px',
            textShadow: '0 4px 30px rgba(0,0,0,0.85)',
          }}
        >
          {isArjunAsking ? (
            arjunDialogue?.hindi ? `"${arjunDialogue.hindi}"` : '"Lekin Focus Guard se kya hoga?"'
          ) : (
            priyaDialogue?.hindi ? `"${priyaDialogue.hindi}"` : (
              <>
                "Instagram kholte hi har 3 reel ke baad ek <span style={{ color: GOLD }}>GATE question</span> screen block karega!"
              </>
            )
          )}
        </h2>
      </div>
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCENE 3: THE BREAKTHROUGH (Arjun Celebrates Two Thumbs Up)
   "Doomscrolling Defeated" Emerald Green Monitor
══════════════════════════════════════════════════════════════════ */
const Scene3Breakthrough: React.FC<{
  arjunDialogue?: StoryDialogue;
}> = ({ arjunDialogue }) => {
  const frame = useCurrentFrame();

  const cameraScale = interpolate(frame, [0, 240], [1.02, 1.15], { extrapolateRight: 'clamp' });
  const cameraY = interpolate(frame, [0, 240], [0, -25], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Audio src={staticFile(arjunDialogue?.audioSrc || 'audio/narration/dialogue5_arjun.mp3')} volume={1.0} />

      {/* 1. Arjun Celebrating in 3D Low-Poly Room */}
      <AbsoluteFill
        style={{
          transform: `scale(${cameraScale}) translateY(${cameraY}px)`,
          transformOrigin: '55% 45%',
        }}
      >
        <Img
          src={staticFile('scenes/scene4_arjun_victory.jpg')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <LowPolyMouth
          amplitude={((audioEnvelopes as any)['dialogue5_arjun'] || [])[frame] || 0}
          centerX="62.5%"
          centerY="40.7%"
          baseWidth={26}
          maxHeight={13}
          rotationDeg={0}
          lipColor="rgba(100, 45, 30, 0.95)"
        />
        {/* Celebratory Emerald Green monitor glow shimmer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 22% 48%, rgba(34, 197, 94, 0.24) 0%, transparent 60%)',
            opacity: Math.sin(frame / 5) * 0.2 + 0.8,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      </AbsoluteFill>

      {/* 2. Top Scrim Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '420px',
          background: 'linear-gradient(180deg, rgba(6, 9, 19, 0.94) 0%, rgba(6, 9, 19, 0.80) 65%, rgba(6, 9, 19, 0) 100%)',
          zIndex: 32,
          pointerEvents: 'none',
        }}
      />

      {/* 3. Subtitles */}
      <div
        style={{
          position: 'absolute',
          top: '115px',
          left: '48px',
          right: '48px',
          zIndex: 35,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
          <span
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              color: MUTED,
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            // 03 · THE BREAKTHROUGH
          </span>
          <span
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(34, 197, 94, 0.25)',
              color: CORRECT_GREEN,
              border: '2px solid rgba(34, 197, 94, 0.6)',
              borderRadius: '999px',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            🎉 Doomscrolling Defeated
          </span>
        </div>

        <h2
          style={{
            fontSize: '44px',
            fontWeight: 900,
            lineHeight: 1.25,
            letterSpacing: '-0.5px',
            margin: '0 auto',
            maxWidth: '820px',
            color: WHITE,
            textShadow: '0 4px 30px rgba(0,0,0,0.85)',
          }}
        >
          {arjunDialogue?.hindi ? `"${arjunDialogue.hindi}"` : (
            <>
              "Arrey waah! Sahi answer diya tabhi scroll hua! Matlab <span style={{ color: GOLD }}>DOOMSCROLLING BAND</span> aur score chalu!"
            </>
          )}
        </h2>
      </div>
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCENE 4: DUAL CTA OUTRO
   "Stop Scrolling. Start Scoring."
══════════════════════════════════════════════════════════════════ */
const Scene4Outro: React.FC<{
  outroProps?: StoryPromoProps['outro'];
}> = ({ outroProps }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleIn = spring({ frame, fps, config: { damping: 11, mass: 0.8 } });

  return (
    <AbsoluteFill>
      <Audio src={staticFile('audio/narration/dialogue6_both.mp3')} volume={1.0} />

      {/* Cinematic Blurred Study Background */}
      <AbsoluteFill
        style={{
          transform: 'scale(1.1)',
          filter: 'blur(10px) brightness(0.4)',
        }}
      >
        <Img
          src={staticFile('scenes/scene4_arjun_victory.jpg')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>

      {/* Dark Vignette Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, rgba(15, 23, 42, 0.4) 0%, rgba(6, 9, 19, 0.95) 85%)',
        }}
      />

      {/* Floating CTA Card Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '220px',
          left: '48px',
          right: '48px',
          zIndex: 35,
          textAlign: 'center',
          transform: `scale(${scaleIn})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <Img
          src={staticFile('logo_transparent.png')}
          style={{
            width: '120px',
            height: '120px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 15px 40px rgba(253, 192, 3, 0.6))',
          }}
        />

        <div>
          <h2 style={{ fontSize: '60px', fontWeight: 900, color: WHITE, margin: 0, letterSpacing: '-1.5px' }}>
            {outroProps?.headlineMain || 'STOP SCROLLING.'}
          </h2>
          <h2 style={{ fontSize: '60px', fontWeight: 900, color: GOLD, margin: '6px 0 0 0', letterSpacing: '-1.5px', textShadow: '0 0 35px rgba(253, 192, 3, 0.5)' }}>
            {outroProps?.headlineSub || 'START SCORING.'}
          </h2>
        </div>

        <p style={{ color: MUTED, fontSize: '22px', fontWeight: 700, margin: 0 }}>
          {outroProps?.tagline || 'Beat reel addiction with real GATE & PSU questions.'}
        </p>

        <div
          style={{
            padding: '16px 38px',
            borderRadius: '999px',
            backgroundColor: GOLD,
            color: INK,
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            boxShadow: '0 15px 40px rgba(253, 192, 3, 0.5)',
          }}
        >
          {outroProps?.ctaButton || 'Download Aspirant Arcade App • Play Store'}
        </div>
      </div>
    </AbsoluteFill>
  );
};
