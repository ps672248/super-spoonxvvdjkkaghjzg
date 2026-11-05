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
import { ThreeCharacterScene } from './ThreeCharacterScene';
import { fontFamily } from './Brand';
import { BORDER, GOLD, INK, MUTED, PANEL, WHITE, CORRECT_GREEN } from './theme';

export const STORY_PROMO_DURATION_IN_FRAMES = 1310; // ~43.6 seconds @ 30fps

export const StoryPromo: React.FC<{ hasBgm?: boolean }> = ({ hasBgm = true }) => {
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
      {hasBgm && <Audio src={staticFile('audio/bgm.mp3')} loop volume={0.10} />}

      {/* Top Scrim Gradient for Ultra-Crisp Subtitle Readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '380px',
          background: 'linear-gradient(180deg, rgba(6, 9, 19, 0.92) 0%, rgba(6, 9, 19, 0.75) 55%, rgba(6, 9, 19, 0) 100%)',
          zIndex: 32,
          pointerEvents: 'none',
        }}
      />

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
          Focus Guard
        </div>
      </div>

      {/* ─── SCENE 1 (Frames 0 - 490): The Reality Check Hook ─── */}
      <Sequence from={0} durationInFrames={490}>
        <Scene1Dialogue />
      </Sequence>

      {/* ─── SCENE 2 (Frames 490 - 830): The Focus Guard Intervention ─── */}
      <Sequence from={490} durationInFrames={340}>
        <Scene2FocusGuard />
      </Sequence>

      {/* ─── SCENE 3 (Frames 830 - 1070): The Breakthrough ─── */}
      <Sequence from={830} durationInFrames={240}>
        <Scene3Breakthrough />
      </Sequence>

      {/* ─── SCENE 4 (Frames 1070 - 1310): Dual Victory & CTA Outro ─── */}
      <Sequence from={1070} durationInFrames={240}>
        <Scene4Outro />
      </Sequence>
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCENE 1: THE REALITY CHECK (Cinematic 3D Low-Poly Close-ups)
   Matching @base.learn Reel 1 (Arjun at desk) & Reel 2 (Investigation)
══════════════════════════════════════════════════════════════════ */
const Scene1Dialogue: React.FC = () => {
  const frame = useCurrentFrame();

  // Part A (Arjun speaks): 0 to 221 frames
  // Part B (Priya speaks): 221 to 490 frames
  const isArjunPart = frame < 221;

  return (
    <AbsoluteFill>
      {/* 1. Spoken Audio */}
      <Sequence from={0} durationInFrames={221}>
        <Audio src={staticFile('audio/narration/dialogue1_arjun.mp3')} volume={1.0} />
      </Sequence>
      <Sequence from={221} durationInFrames={269}>
        <Audio src={staticFile('audio/narration/dialogue2_priya.mp3')} volume={1.0} />
      </Sequence>

      {/* 2. 3D Low-Poly Character Scene (Cut between Arjun & Priya) */}
      {isArjunPart ? (
        <ThreeCharacterScene
          key="s1_arjun"
          variant="arjun"
          cameraAngle="closeup"
          dialogueClip="dialogue1_arjun"
          dialogueStartFrame={0}
          mood="talking"
          showMonitor={true}
        />
      ) : (
        <ThreeCharacterScene
          key="s1_priya"
          variant="priya"
          cameraAngle="closeup"
          dialogueClip="dialogue2_priya"
          dialogueStartFrame={221}
          mood="talking"
          showMonitor={true}
        />
      )}

      {/* 3. Sleek Editorial Editorial Subtitle Overlay (Reel 2 Style) */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
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
              backgroundColor: isArjunPart ? 'rgba(244, 63, 94, 0.2)' : 'rgba(253, 192, 3, 0.2)',
              color: isArjunPart ? '#FB7185' : GOLD,
              border: `2px solid ${isArjunPart ? 'rgba(244, 63, 94, 0.5)' : 'rgba(253, 192, 3, 0.5)'}`,
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
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
          }}
        >
          {isArjunPart ? (
            <>
              "Bhai sach bata... phone sirf <span style={{ color: GOLD }}>5 MINUTE</span> ke liye uthaya tha, aur 2 ghante se swipe kar raha hoon!"
            </>
          ) : (
            <>
              "Aur raat ko guilt karega: <span style={{ color: '#FB7185' }}>'Aaj ka syllabus phir reh gaya!'</span> Focus Guard laga le!"
            </>
          )}
        </h2>
      </div>
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCENE 2: THE FOCUS GUARD INTERVENTION (Interactive Quiz Overlay)
══════════════════════════════════════════════════════════════════ */
const Scene2FocusGuard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isArjunPart = frame < 74;
  const isCorrect = frame > 190;
  const popAnim = spring({ frame: frame - 40, fps, config: { damping: 11, mass: 0.8 } });

  return (
    <AbsoluteFill>
      {/* 1. Spoken Audio */}
      <Sequence from={0} durationInFrames={74}>
        <Audio src={staticFile('audio/narration/dialogue3_arjun.mp3')} volume={1.0} />
      </Sequence>
      <Sequence from={74} durationInFrames={266}>
        <Audio src={staticFile('audio/narration/dialogue4_priya.mp3')} volume={1.0} />
      </Sequence>

      {/* 2. 3D Low-Poly Character Scene */}
      {isArjunPart ? (
        <ThreeCharacterScene
          key="s2_arjun"
          variant="arjun"
          cameraAngle="medium"
          dialogueClip="dialogue3_arjun"
          dialogueStartFrame={0}
          mood="questioning"
          showMonitor={true}
        />
      ) : (
        <ThreeCharacterScene
          key="s2_priya"
          variant="priya"
          cameraAngle="over_shoulder"
          dialogueClip="dialogue4_priya"
          dialogueStartFrame={74}
          mood="talking"
          showMonitor={true}
        />
      )}

      {/* 3. Header Subtitles */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
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
            // 02 · THE SOLUTION
          </span>
          <span
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: CORRECT_GREEN,
              border: '2px solid rgba(34, 197, 94, 0.5)',
              borderRadius: '999px',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            🛡️ Focus Guard
          </span>
        </div>

        <h2
          style={{
            fontSize: '40px',
            fontWeight: 900,
            lineHeight: 1.25,
            color: WHITE,
            margin: '0 auto',
            maxWidth: '820px',
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
          }}
        >
          {isArjunPart ? (
            '"Lekin Focus Guard se kya hoga?"'
          ) : (
            <>
              "Har 3 reel ke baad ek <span style={{ color: GOLD }}>GATE question</span> screen block karega!"
            </>
          )}
        </h2>
      </div>

      {/* 4. Floating 3D-styled Intervention Card */}
      <div
        style={{
          position: 'absolute',
          bottom: '140px',
          left: '48px',
          right: '48px',
          zIndex: 35,
          transform: `scale(${Math.max(0, popAnim)})`,
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '3px solid rgba(253, 192, 3, 0.55)',
          borderRadius: '26px',
          padding: '26px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${BORDER}`, paddingBottom: '12px', marginBottom: '14px' }}>
          <span style={{ fontSize: '14px', fontWeight: 900, color: GOLD, letterSpacing: '0.5px' }}>
            ⚡ FOCUS GUARD INTERVENTION
          </span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: 'rgba(244, 63, 94, 0.25)',
              color: '#FB7185',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              padding: '3px 12px',
              borderRadius: '999px',
              fontWeight: 900,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Reels Paused: 3/3
          </span>
        </div>

        <p style={{ fontSize: '20px', fontWeight: 900, color: WHITE, margin: '0 0 16px 0', lineHeight: 1.3 }}>
          In a reversible adiabatic process, what happens to entropy?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '16px', fontWeight: 700 }}>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: `2px solid ${BORDER}`,
              color: MUTED,
            }}
          >
            A) Increases continuously
          </div>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.25)' : 'rgba(30, 41, 59, 0.6)',
              border: `2px solid ${isCorrect ? CORRECT_GREEN : BORDER}`,
              color: isCorrect ? CORRECT_GREEN : MUTED,
              fontWeight: 800,
            }}
          >
            B) Remains Constant (Isentropic) {isCorrect && '✅ Sahi Answer!'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCENE 3: THE BREAKTHROUGH (Celebrating in 3D)
══════════════════════════════════════════════════════════════════ */
const Scene3Breakthrough: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile('audio/narration/dialogue5_arjun.mp3')} volume={1.0} />

      {/* 3D Celebrating Arjun */}
      <ThreeCharacterScene
        variant="arjun"
        cameraAngle="medium"
        dialogueClip="dialogue5_arjun"
        dialogueStartFrame={0}
        mood="celebrating"
        showMonitor={true}
      />

      {/* Subtitles Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
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
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: CORRECT_GREEN,
              border: '2px solid rgba(34, 197, 94, 0.5)',
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
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
          }}
        >
          "Arrey waah! Sahi answer diya tabhi scroll hua! Matlab <span style={{ color: GOLD }}>DOOMSCROLLING BAND</span> aur score chalu!"
        </h2>
      </div>
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCENE 4: DUAL CTA OUTRO
══════════════════════════════════════════════════════════════════ */
const Scene4Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleIn = spring({ frame, fps, config: { damping: 12, mass: 0.9 } });

  return (
    <AbsoluteFill>
      <Audio src={staticFile('audio/narration/dialogue6_both.mp3')} volume={1.0} />

      {/* 3D Background Scene */}
      <ThreeCharacterScene
        variant="arjun"
        cameraAngle="wide"
        dialogueClip="dialogue6_both"
        dialogueStartFrame={0}
        mood="celebrating"
        showMonitor={true}
      />

      {/* Floating CTA Card Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '180px',
          left: '48px',
          right: '48px',
          zIndex: 35,
          textAlign: 'center',
          transform: `scale(${scaleIn})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <Img
          src={staticFile('logo_transparent.png')}
          style={{
            width: '110px',
            height: '110px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 15px 35px rgba(253, 192, 3, 0.5))',
          }}
        />

        <div>
          <h2 style={{ fontSize: '56px', fontWeight: 900, color: WHITE, margin: 0, letterSpacing: '-1px' }}>
            STOP SCROLLING.
          </h2>
          <h2 style={{ fontSize: '56px', fontWeight: 900, color: GOLD, margin: '4px 0 0 0', letterSpacing: '-1px' }}>
            START SCORING.
          </h2>
        </div>

        <div
          style={{
            padding: '14px 34px',
            borderRadius: '999px',
            backgroundColor: GOLD,
            color: INK,
            fontSize: '22px',
            fontWeight: 900,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            boxShadow: '0 12px 35px rgba(253, 192, 3, 0.45)',
          }}
        >
          Download Aspirant Arcade App • Play Store
        </div>
      </div>
    </AbsoluteFill>
  );
};
