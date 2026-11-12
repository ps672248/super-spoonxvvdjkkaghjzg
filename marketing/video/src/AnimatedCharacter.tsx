import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { GOLD } from './theme';

export type CharacterMood =
  | 'explaining'
  | 'alert'
  | 'thinking'
  | 'excited'
  | 'stressed'
  | 'celebrate'
  | 'shocked'
  | 'sleepy'
  | 'confident'
  | 'frustrated'
  | 'whispering'
  | 'relieved'
  | 'panicked'
  | 'smug'
  | 'bored'
  | 'curious'
  | 'exhausted'
  | 'determined'
  | 'embarrassed'
  | 'teasing';

export type CharacterId = 'arjun' | 'priya';

export function inferMoodFromBeat(input: {
  mood?: CharacterMood;
  emoji?: string;
  label?: string;
  mediaType?: string;
}): CharacterMood {
  if (input.mood) return input.mood;
  const emoji = input.emoji || '';
  const label = (input.label || '').toUpperCase();

  if (emoji.includes('🚨') || emoji.includes('⏳') || /DEADLINE|ALERT|URGENT|WARNING|LAST/.test(label)) {
    return 'alert';
  }
  if (emoji.includes('😱') || emoji.includes('⚡') || /SHOCK|MASSIVE|UNEXPECTED|BREAKING/.test(label)) {
    return 'shocked';
  }
  if (emoji.includes('😰') || emoji.includes('💀') || /MISTAKE|TRAP|STRESS|PANIC|FAIL/.test(label)) {
    return 'stressed';
  }
  if (emoji.includes('😤') || emoji.includes('😡') || /CUTOFF|DELAY|CANCEL|ERROR/.test(label)) {
    return 'frustrated';
  }
  if (emoji.includes('😴') || emoji.includes('🥱') || /LATE|NIGHT|FATIGUE/.test(label)) {
    return 'sleepy';
  }
  if (emoji.includes('💪') || emoji.includes('😎') || /TOPPER|CONFIDENCE|PROVEN|MASTERY/.test(label)) {
    return 'confident';
  }
  if (emoji.includes('🔥') || /LOCK IN|CRACK|TARGET|MISSION/.test(label)) {
    return 'determined';
  }
  if (emoji.includes('🤫') || /SECRET|HACK|INSIDER/.test(label)) {
    return 'whispering';
  }
  if (emoji.includes('🎉') || emoji.includes('🏆') || emoji.includes('💰') || /SALARY|PAY|RESULT|OFFER|CRACKED|WIN/.test(label)) {
    return 'celebrate';
  }
  if (emoji.includes('💡') || emoji.includes('🧠') || /TIP|STRATEGY|HOW|WHY|ANALYSIS/.test(label)) {
    return 'thinking';
  }
  if (emoji.includes('🔍') || /EXPLORE|BREAKDOWN|DETAILS/.test(label)) {
    return 'curious';
  }
  if (emoji.includes('😌') || /RELIEF|SAFE|SOLVED/.test(label)) {
    return 'relieved';
  }
  if (/NEW|VACANC|DROP|UPDATE/.test(label)) {
    return 'excited';
  }
  return 'explaining';
}

export const AnimatedCharacter: React.FC<{
  character?: CharacterId;
  mood?: CharacterMood;
  speaking?: boolean;
  cadence?: number[];
  accentColor?: string;
  size?: number;
  holdingPhone?: boolean;
  dimmed?: boolean;
}> = ({
  character = 'arjun',
  mood = 'explaining',
  speaking = false,
  cadence,
  accentColor = GOLD,
  size = 360,
  holdingPhone = false,
  dimmed = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 12, mass: 0.75 } });
  const enterY = interpolate(enter, [0, 1], [60, 0]);

  // Idle breathing + energetic subtle head bob while speaking
  const breathY = Math.sin(frame * 0.085) * 4;
  const speakBounce = speaking ? Math.abs(Math.sin(frame * 0.28)) * 3.5 : 0;
  const headTilt =
    mood === 'thinking' || mood === 'curious'
      ? -7 + Math.sin(frame * 0.05) * 2
      : mood === 'alert' || mood === 'shocked' || mood === 'panicked'
      ? Math.sin(frame * 0.45) * 2.2
      : mood === 'whispering' || mood === 'teasing'
      ? 6 + Math.sin(frame * 0.08) * 1.5
      : mood === 'smug' || mood === 'confident'
      ? -4 + Math.sin(frame * 0.04) * 1.2
      : mood === 'sleepy' || mood === 'exhausted' || mood === 'bored'
      ? 6 + Math.sin(frame * 0.03) * 1.8
      : mood === 'embarrassed'
      ? 5 + Math.sin(frame * 0.06) * 1.5
      : Math.sin(frame * 0.06) * 2.5;

  // Natural blink every ~95 frames (4-frame closure), with sleepy/exhausted droop
  const blinkMod = frame % 95;
  const isBlinking = blinkMod >= 88 && blinkMod <= 92;
  const isHeavyLids = mood === 'sleepy' || mood === 'exhausted' || mood === 'bored';
  const isWideEyes = mood === 'alert' || mood === 'shocked' || mood === 'panicked';
  const eyeScaleY = isBlinking ? 0.08 : isHeavyLids ? 0.42 : isWideEyes ? 1.15 : 1;

  // Glasses diagonal gleam every ~110 frames
  const gleamPos = ((frame % 110) / 30) * 140 - 40;
  const showGleam = frame % 110 < 30 || mood === 'confident' || mood === 'smug';

  // Speech mouth openness (0..1)
  let mouthOpen = 0;
  if (speaking) {
    if (cadence && cadence.length > 0) {
      const idx = Math.min(cadence.length - 1, Math.max(0, frame));
      mouthOpen = cadence[idx] ?? 0;
    } else {
      const raw = Math.abs(Math.sin(frame * 0.46) * Math.cos(frame * 0.19));
      mouthOpen = raw > 0.18 ? Math.min(1, raw * 1.15) : 0;
    }
  }

  // Sweat drop cycle for stressed/alert/panicked
  const sweatY = ((frame * 1.4) % 46);
  const sweatOpacity =
    mood === 'stressed' || mood === 'panicked' || mood === 'embarrassed'
      ? interpolate(sweatY, [0, 10, 38, 46], [0, 1, 1, 0])
      : 0;

  // Eye gaze offset
  const pupilDx =
    mood === 'thinking' || mood === 'curious'
      ? -4
      : mood === 'explaining' || mood === 'whispering'
      ? 3
      : mood === 'embarrassed'
      ? 4
      : mood === 'smug'
      ? -2
      : mood === 'teasing'
      ? 2
      : 0;
  const pupilDy =
    mood === 'thinking'
      ? -4
      : mood === 'curious'
      ? -3
      : mood === 'explaining'
      ? -1.5
      : mood === 'embarrassed'
      ? 3
      : mood === 'bored' || mood === 'exhausted'
      ? 2
      : 0;

  const isPriya = character === 'priya';

  return (
    <div
      style={{
        width: size,
        height: size * 1.1,
        opacity: enter * (dimmed ? 0.62 : 1),
        transform: `translateY(${enterY + breathY - speakBounce}px) scale(${dimmed ? 0.9 : 1})`,
        filter: `drop-shadow(0 18px 34px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 ${dimmed ? '8px' : '24px'} ${accentColor}33)`,
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 360 396" width="100%" height="100%" overflow="visible">
        <defs>
          <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isPriya ? '#312E81' : '#1E293B'} />
            <stop offset="100%" stopColor={isPriya ? '#1E1B4B' : '#0F172A'} />
          </linearGradient>
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F4C7A1" />
            <stop offset="100%" stopColor="#E4AE84" />
          </linearGradient>
          <clipPath id="leftLensClip">
            <rect x="118" y="138" width="52" height="36" rx="10" />
          </clipPath>
          <clipPath id="rightLensClip">
            <rect x="190" y="138" width="52" height="36" rx="10" />
          </clipPath>
        </defs>

        {/* Subtle Glowing Floor / Aura Ring behind character */}
        <ellipse cx="180" cy="368" rx="126" ry="22" fill={accentColor} opacity="0.18" />
        <ellipse cx="180" cy="368" rx="92" ry="12" fill={accentColor} opacity="0.28" />

        {/* ── BACK HAIR & SIDE PONYTAIL (for Priya) ── */}
        {isPriya && (
          <g transform={`rotate(${headTilt * 0.6}, 180, 165)`}>
            <path
              d="M 106 135 C 88 184, 86 248, 110 280 L 250 280 C 274 248, 272 184, 254 135 Z"
              fill="#1E1B2E"
            />
            {/* Sleek side ponytail */}
            <path
              d="M 96 144 C 58 164, 52 228, 76 266 C 84 236, 92 206, 108 184 Z"
              fill="#171426"
            />
            <ellipse cx="98" cy="148" rx="8" ry="11" fill={accentColor} />
          </g>
        )}

        {/* ── TORSO & HOODIE ── */}
        <g>
          {/* Shoulders & Body */}
          <path
            d="M 74 374 C 74 286, 114 252, 180 252 C 246 252, 286 286, 286 374 Z"
            fill="url(#hoodieGrad)"
            stroke={accentColor}
            strokeWidth="3.5"
          />
          {/* Hoodie Collar / Rim */}
          <path
            d="M 134 256 C 148 282, 212 282, 226 256 C 212 244, 148 244, 134 256 Z"
            fill="#0B1120"
            stroke={accentColor}
            strokeWidth="2.5"
          />
          {/* Hoodie Center Zipper & Drawstrings */}
          <line x1="180" y1="276" x2="180" y2="374" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
          <path d="M 162 276 Q 160 306, 163 324" fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <path d="M 198 276 Q 200 306, 197 324" fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <circle cx="163" cy="326" r="4" fill={accentColor} />
          <circle cx="197" cy="326" r="4" fill={accentColor} />

          {/* Brand Chest Badge */}
          <rect x="206" y="302" width="38" height="20" rx="6" fill={accentColor} opacity="0.92" />
          <path d="M 216 312 L 222 312 L 225 307 L 228 317 L 231 312 L 235 312" fill="none" stroke="#0A0E17" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* ── GESTURING ARMS ── */}
        {mood === 'explaining' || mood === 'excited' || mood === 'teasing' ? (
          /* Friendly raised presenting/waving arm */
          <g transform={`rotate(${Math.sin(frame * 0.16) * 6}, 272, 290)`}>
            <path
              d="M 258 292 Q 302 256, 292 214"
              fill="none"
              stroke="url(#hoodieGrad)"
              strokeWidth="34"
              strokeLinecap="round"
            />
            {/* Sleeve Cuff */}
            <rect x="275" y="210" width="34" height="10" rx="5" fill={accentColor} />
            {/* Friendly Open Hand */}
            <ellipse cx="292" cy="194" rx="16" ry="18" fill="url(#skinGrad)" stroke="#DDA479" strokeWidth="1.5" />
            <ellipse cx="277" cy="196" rx="5.5" ry="9" transform="rotate(-25, 277, 196)" fill="url(#skinGrad)" />
          </g>
        ) : mood === 'celebrate' ? (
          /* Fist pump arm with cuff */
          <g transform={`translate(0, ${Math.sin(frame * 0.25) * -8})`}>
            <path
              d="M 258 292 Q 312 246, 298 196"
              fill="none"
              stroke="url(#hoodieGrad)"
              strokeWidth="34"
              strokeLinecap="round"
            />
            <rect x="281" y="192" width="34" height="10" rx="5" fill={accentColor} />
            <circle cx="297" cy="176" r="18" fill="url(#skinGrad)" stroke="#DDA479" strokeWidth="2" />
          </g>
        ) : mood === 'thinking' || mood === 'curious' ? (
          /* Hand resting near chin */
          <g transform={`rotate(${Math.sin(frame * 0.08) * 2}, 120, 295)`}>
            <path
              d="M 102 308 Q 74 260, 146 232"
              fill="none"
              stroke="url(#hoodieGrad)"
              strokeWidth="32"
              strokeLinecap="round"
            />
            <circle cx="152" cy="230" r="15" fill="url(#skinGrad)" />
          </g>
        ) : mood === 'shocked' ? (
          /* Both hands clutching cheeks in disbelief */
          <g transform={`translate(0, ${Math.sin(frame * 0.35) * 3})`}>
            <path d="M 94 304 Q 72 230, 112 188" fill="none" stroke="url(#hoodieGrad)" strokeWidth="30" strokeLinecap="round" />
            <circle cx="112" cy="184" r="15" fill="url(#skinGrad)" />
            <path d="M 266 304 Q 288 230, 248 188" fill="none" stroke="url(#hoodieGrad)" strokeWidth="30" strokeLinecap="round" />
            <circle cx="248" cy="184" r="15" fill="url(#skinGrad)" />
          </g>
        ) : mood === 'confident' || mood === 'smug' ? (
          /* Thumbs up gesture */
          <g transform={`rotate(${Math.sin(frame * 0.1) * 3}, 272, 290)`}>
            <path d="M 258 292 Q 312 250, 296 210" fill="none" stroke="url(#hoodieGrad)" strokeWidth="32" strokeLinecap="round" />
            <rect x="280" y="206" width="32" height="10" rx="5" fill={accentColor} />
            <ellipse cx="296" cy="195" rx="14" ry="14" fill="url(#skinGrad)" />
            {/* Thumb pointing up */}
            <path d="M 296 195 L 296 176" stroke="url(#skinGrad)" strokeWidth="10" strokeLinecap="round" />
          </g>
        ) : mood === 'whispering' ? (
          /* Cupped hand whispering beside mouth */
          <g transform={`translate(0, ${Math.sin(frame * 0.12) * 2})`}>
            <path d="M 258 292 Q 256 226, 218 206" fill="none" stroke="url(#hoodieGrad)" strokeWidth="32" strokeLinecap="round" />
            <path d="M 212 196 Q 224 206, 216 222" fill="none" stroke="url(#skinGrad)" strokeWidth="12" strokeLinecap="round" />
          </g>
        ) : mood === 'determined' || mood === 'frustrated' ? (
          /* Both clenched fists at chest */
          <g transform={`translate(0, ${Math.sin(frame * 0.28) * 3})`}>
            <path d="M 94 304 Q 106 256, 138 250" fill="none" stroke="url(#hoodieGrad)" strokeWidth="30" strokeLinecap="round" />
            <circle cx="140" cy="248" r="15" fill="url(#skinGrad)" stroke="#DDA479" strokeWidth="2" />
            <path d="M 266 304 Q 254 256, 222 250" fill="none" stroke="url(#hoodieGrad)" strokeWidth="30" strokeLinecap="round" />
            <circle cx="220" cy="248" r="15" fill="url(#skinGrad)" stroke="#DDA479" strokeWidth="2" />
          </g>
        ) : mood === 'embarrassed' ? (
          /* Hand scratching back of head */
          <g transform={`rotate(${Math.sin(frame * 0.14) * 4}, 266, 290)`}>
            <path d="M 258 292 Q 312 210, 246 122" fill="none" stroke="url(#hoodieGrad)" strokeWidth="30" strokeLinecap="round" />
            <circle cx="244" cy="118" r="15" fill="url(#skinGrad)" />
          </g>
        ) : mood === 'relieved' ? (
          /* Hand wiping brow */
          <g transform={`rotate(${Math.sin(frame * 0.1) * 3}, 266, 290)`}>
            <path d="M 258 292 Q 296 220, 236 136" fill="none" stroke="url(#hoodieGrad)" strokeWidth="30" strokeLinecap="round" />
            <circle cx="232" cy="132" r="15" fill="url(#skinGrad)" />
          </g>
        ) : mood === 'alert' || mood === 'stressed' || mood === 'panicked' ? (
          /* Both hands raised slightly in surprise/alert */
          <g>
            <g transform={`translate(0, ${Math.sin(frame * 0.3) * 4})`}>
              <path d="M 94 304 Q 56 266, 74 222" fill="none" stroke="url(#hoodieGrad)" strokeWidth="30" strokeLinecap="round" />
              <circle cx="76" cy="214" r="15" fill="url(#skinGrad)" />
            </g>
            <g transform={`translate(0, ${Math.cos(frame * 0.3) * 4})`}>
              <path d="M 266 304 Q 304 266, 286 222" fill="none" stroke="url(#hoodieGrad)" strokeWidth="30" strokeLinecap="round" />
              <circle cx="284" cy="214" r="15" fill="url(#skinGrad)" />
            </g>
          </g>
        ) : null}

        {/* ── HEAD GROUP ── */}
        <g transform={`rotate(${headTilt}, 180, 238)`}>
          {/* Neck */}
          <rect x="160" y="218" width="40" height="44" rx="14" fill="#DFA77D" />

          {/* Ears */}
          <ellipse cx="106" cy="166" rx="13" ry="18" fill="#E4AE84" />
          <ellipse cx="254" cy="166" rx="13" ry="18" fill="#E4AE84" />
          <ellipse cx="107" cy="166" rx="6" ry="10" fill="#C98D62" />
          <ellipse cx="253" cy="166" rx="6" ry="10" fill="#C98D62" />

          {/* Face Base */}
          <rect x="108" y="84" width="144" height="154" rx="66" fill="url(#skinGrad)" />

          {/* Subtle Cheek Warmth (Deep Blush when Embarrassed) */}
          <ellipse cx="132" cy="184" rx={mood === 'embarrassed' ? 20 : 14} ry={mood === 'embarrassed' ? 12 : 8} fill="#F43F5E" opacity={mood === 'embarrassed' ? 0.6 : 0.16} />
          <ellipse cx="228" cy="184" rx={mood === 'embarrassed' ? 20 : 14} ry={mood === 'embarrassed' ? 12 : 8} fill="#F43F5E" opacity={mood === 'embarrassed' ? 0.6 : 0.16} />
          {mood === 'embarrassed' && (
            <g stroke="#E11D48" strokeWidth="2" strokeLinecap="round" opacity="0.75">
              <line x1="124" y1="180" x2="128" y2="188" />
              <line x1="130" y1="180" x2="134" y2="188" />
              <line x1="136" y1="180" x2="140" y2="188" />
              <line x1="220" y1="180" x2="224" y2="188" />
              <line x1="226" y1="180" x2="230" y2="188" />
              <line x1="232" y1="180" x2="236" y2="188" />
            </g>
          )}

          {/* ── EYES ── */}
          {mood === 'celebrate' || mood === 'relieved' ? (
            /* Happy crescent eyes */
            <g fill="none" stroke="#1E1B2E" strokeWidth="5.5" strokeLinecap="round">
              <path d="M 132 160 Q 144 146, 156 160" />
              <path d="M 204 160 Q 216 146, 228 160" />
            </g>
          ) : mood === 'teasing' || mood === 'whispering' ? (
            /* Winking left eye, wide right eye */
            <g>
              <path d="M 132 158 Q 144 168, 156 158" fill="none" stroke="#1E1B2E" strokeWidth="5" strokeLinecap="round" />
              <g transform="translate(216, 157)">
                <ellipse cx="0" cy="0" rx="14" ry="14" fill="#FFFFFF" />
                <circle cx={pupilDx} cy={pupilDy} r="8" fill="#111827" />
                <circle cx={pupilDx + 3} cy={pupilDy - 3} r="3" fill="#FFFFFF" />
              </g>
            </g>
          ) : (
            <g>
              {/* Left Eye */}
              <g transform={`translate(144, 157) scale(1, ${eyeScaleY})`}>
                <ellipse cx="0" cy="0" rx={mood === 'shocked' || mood === 'panicked' ? 15 : 13} ry={mood === 'alert' || mood === 'shocked' ? 16 : 13} fill="#FFFFFF" />
                <circle cx={pupilDx} cy={pupilDy} r={mood === 'shocked' || mood === 'panicked' ? 4.5 : mood === 'alert' ? 6.5 : 8} fill="#111827" />
                <circle cx={pupilDx + 2} cy={pupilDy - 2} r="2.4" fill="#FFFFFF" />
              </g>
              {/* Right Eye */}
              <g transform={`translate(216, 157) scale(1, ${eyeScaleY})`}>
                <ellipse cx="0" cy="0" rx={mood === 'shocked' || mood === 'panicked' ? 15 : 13} ry={mood === 'alert' || mood === 'shocked' ? 16 : 13} fill="#FFFFFF" />
                <circle cx={pupilDx} cy={pupilDy} r={mood === 'shocked' || mood === 'panicked' ? 4.5 : mood === 'alert' ? 6.5 : 8} fill="#111827" />
                <circle cx={pupilDx + 2} cy={pupilDy - 2} r="2.4" fill="#FFFFFF" />
              </g>
              {/* Under-eye fatigue bags when exhausted */}
              {mood === 'exhausted' && (
                <g stroke="#94A3B8" strokeWidth="2" fill="none" opacity="0.6">
                  <path d="M 134 172 Q 144 178, 154 172" />
                  <path d="M 206 172 Q 216 178, 226 172" />
                </g>
              )}
            </g>
          )}

          {/* ── EYEBROWS ── */}
          <g fill="none" stroke="#1E1B2E" strokeWidth="5.5" strokeLinecap="round">
            {mood === 'shocked' || mood === 'panicked' ? (
              <>
                <path d="M 126 120 Q 144 108, 160 120" />
                <path d="M 200 120 Q 216 108, 234 120" />
              </>
            ) : mood === 'frustrated' || mood === 'determined' ? (
              <>
                <path d="M 126 124 L 158 138" />
                <path d="M 202 138 L 234 124" />
              </>
            ) : mood === 'alert' || mood === 'excited' ? (
              <>
                <path d="M 128 131 Q 144 121, 158 130" />
                <path d="M 202 130 Q 216 121, 232 131" />
              </>
            ) : mood === 'stressed' ? (
              <>
                <path d="M 128 136 Q 144 134, 158 126" />
                <path d="M 202 126 Q 216 134, 232 136" />
              </>
            ) : mood === 'thinking' || mood === 'curious' || mood === 'confident' || mood === 'smug' ? (
              <>
                <path d="M 128 122 Q 144 112, 158 122" />
                <path d="M 202 135 Q 216 136, 232 135" />
              </>
            ) : mood === 'embarrassed' ? (
              <>
                <path d="M 128 136 Q 144 130, 158 124" />
                <path d="M 202 124 Q 216 130, 232 136" />
              </>
            ) : mood === 'sleepy' || mood === 'bored' || mood === 'exhausted' ? (
              <>
                <path d="M 128 136 L 158 136" />
                <path d="M 202 136 L 232 136" />
              </>
            ) : (
              <>
                <path d="M 129 134 Q 144 128, 158 134" />
                <path d="M 202 134 Q 216 128, 231 134" />
              </>
            )}
          </g>

          {/* ── NOSE ── */}
          <path d="M 178 164 Q 174 178, 184 180" fill="none" stroke="#C88A5E" strokeWidth="3.5" strokeLinecap="round" />

          {/* ── GLASSES (Iconic Aspirant Style) ── */}
          <g>
            <rect
              x="118"
              y="138"
              width="52"
              height="36"
              rx={isPriya ? '18' : '10'}
              fill="rgba(56, 189, 248, 0.10)"
              stroke="#0F172A"
              strokeWidth="4.5"
            />
            <rect
              x="190"
              y="138"
              width="52"
              height="36"
              rx={isPriya ? '18' : '10'}
              fill="rgba(56, 189, 248, 0.10)"
              stroke="#0F172A"
              strokeWidth="4.5"
            />
            <line x1="170" y1="154" x2="190" y2="154" stroke="#0F172A" strokeWidth="4.5" />
            <line x1="108" y1="152" x2="118" y2="154" stroke="#0F172A" strokeWidth="4" />
            <line x1="242" y1="154" x2="252" y2="152" stroke="#0F172A" strokeWidth="4" />

            {/* Animated Specular Lens Gleam */}
            {showGleam && (
              <>
                <g clipPath="url(#leftLensClip)">
                  <polygon
                    points={`${118 + gleamPos},135 ${134 + gleamPos},135 ${114 + gleamPos},178 ${98 + gleamPos},178`}
                    fill="#FFFFFF"
                    opacity="0.35"
                  />
                </g>
                <g clipPath="url(#rightLensClip)">
                  <polygon
                    points={`${190 + gleamPos},135 ${206 + gleamPos},135 ${186 + gleamPos},178 ${170 + gleamPos},178`}
                    fill="#FFFFFF"
                    opacity="0.35"
                  />
                </g>
              </>
            )}
          </g>

          {/* ── MOUTH (AUDIO/CADENCE LIP-SYNC) ── */}
          <g transform="translate(180, 203)">
            {mouthOpen > 0.1 ? (
              /* Animated Open Speaking Mouth */
              (() => {
                const w = 15 + mouthOpen * 8;
                const h = 4 + mouthOpen * 12;
                return (
                  <g>
                    <ellipse cx="0" cy="0" rx={w} ry={h} fill="#3B0D11" stroke="#8C4A32" strokeWidth="2.5" />
                    {/* Upper teeth */}
                    {h > 5.5 && (
                      <path
                        d={`M ${-w * 0.72} ${-h * 0.68} Q 0 ${-h * 0.85}, ${w * 0.72} ${-h * 0.68} L ${w * 0.6} ${-h * 0.25} Q 0 ${-h * 0.15}, ${-w * 0.6} ${-h * 0.25} Z`}
                        fill="#FFFFFF"
                      />
                    )}
                    {/* Tongue */}
                    {h > 7 && (
                      <ellipse cx="0" cy={h * 0.55} rx={w * 0.55} ry={h * 0.35} fill="#E11D48" />
                    )}
                  </g>
                );
              })()
            ) : mood === 'shocked' ? (
              /* Jaw-drop wide open oval */
              <g>
                <ellipse cx="0" cy="8" rx="12" ry="18" fill="#3B0D11" stroke="#8C4A32" strokeWidth="2.5" />
                <ellipse cx="0" cy="18" rx="7" ry="5" fill="#E11D48" />
              </g>
            ) : mood === 'frustrated' ? (
              /* Clenched teeth grimace */
              <g>
                <rect x="-14" y="-3" width="28" height="12" rx="4" fill="#FFFFFF" stroke="#6E331F" strokeWidth="2.5" />
                <line x1="-14" y1="3" x2="14" y2="3" stroke="#6E331F" strokeWidth="1.5" />
                <line x1="-5" y1="-3" x2="-5" y2="9" stroke="#6E331F" strokeWidth="1.5" />
                <line x1="5" y1="-3" x2="5" y2="9" stroke="#6E331F" strokeWidth="1.5" />
              </g>
            ) : mood === 'confident' || mood === 'smug' ? (
              /* Sharp confident side smirk */
              <path d="M -12 2 Q 4 1, 16 -6" fill="none" stroke="#6E331F" strokeWidth="4.5" strokeLinecap="round" />
            ) : mood === 'teasing' ? (
              /* Tongue poking out playfully */
              <g>
                <path d="M -14 -2 Q 0 8, 14 -2" fill="none" stroke="#6E331F" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M -5 3 C -5 13, 5 13, 5 3 Z" fill="#F43F5E" stroke="#8C4A32" strokeWidth="1.5" />
              </g>
            ) : mood === 'relieved' ? (
              /* Soft peaceful smile */
              <path d="M -14 0 Q 0 9, 14 0" fill="none" stroke="#6E331F" strokeWidth="4.5" strokeLinecap="round" />
            ) : mood === 'bored' ? (
              /* Flat bored line */
              <line x1="-12" y1="2" x2="12" y2="2" stroke="#6E331F" strokeWidth="4" strokeLinecap="round" />
            ) : mood === 'panicked' ? (
              /* Shivering wavy panic line */
              <path d="M -16 2 Q -8 -4, 0 3 Q 8 8, 16 2" fill="none" stroke="#6E331F" strokeWidth="4" strokeLinecap="round" />
            ) : mood === 'sleepy' ? (
              /* Yawning oval */
              <ellipse cx="0" cy="3" rx="10" ry="12" fill="#3B0D11" stroke="#8C4A32" strokeWidth="2.5" />
            ) : mood === 'celebrate' || mood === 'excited' || mood === 'explaining' ? (
              /* Friendly Smile */
              <path
                d="M -16 -3 Q 0 11, 16 -3"
                fill="none"
                stroke="#6E331F"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            ) : mood === 'alert' ? (
              /* Small Surprised 'o' */
              <ellipse cx="0" cy="2" rx="8" ry="10" fill="#3B0D11" stroke="#8C4A32" strokeWidth="2.5" />
            ) : mood === 'stressed' ? (
              /* Wavy Tense Mouth */
              <path
                d="M -14 2 Q -7 -3, 0 2 Q 7 7, 14 2"
                fill="none"
                stroke="#6E331F"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ) : (
              /* Thoughtful slight smirk */
              <path
                d="M -12 0 Q 2 5, 14 -2"
                fill="none"
                stroke="#6E331F"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* ── FRONT HAIR ── */}
          {isPriya ? (
            <path
              d="M 104 142 C 102 82, 142 62, 184 64 C 228 66, 258 92, 256 142 C 242 108, 214 96, 186 102 C 154 110, 128 100, 104 142 Z"
              fill="#1E1B2E"
            />
          ) : (
            /* Arjun modern swept hair */
            <path
              d="M 104 140 C 98 92, 124 66, 160 62 C 176 52, 206 52, 224 68 C 250 74, 262 104, 256 140 C 244 114, 226 102, 204 102 C 186 102, 166 88, 144 102 C 126 112, 114 116, 104 140 Z"
              fill="#111827"
            />
          )}

          {/* ── STRESS / PANIC SWEAT DROP ── */}
          {sweatOpacity > 0 && (
            <path
              d={`M 238 ${112 + sweatY} C 238 ${112 + sweatY}, 246 ${124 + sweatY}, 246 ${129 + sweatY} A 8 8 0 1 1 230 ${129 + sweatY} C 230 ${124 + sweatY}, 238 ${112 + sweatY}, 238 ${112 + sweatY} Z`}
              fill="#38BDF8"
              opacity={sweatOpacity * 0.9}
            />
          )}
        </g>

        {/* ── FLOATING MOOD REACTION ICONS (ALL 20 MOODS) ── */}
        {mood === 'alert' && (
          <g transform={`translate(272, 74) scale(${1 + Math.sin(frame * 0.3) * 0.08})`}>
            <circle cx="0" cy="0" r="24" fill="#F43F5E" />
            <text x="0" y="9" textAnchor="middle" fill="#FFFFFF" fontSize="28" fontWeight="900">
              !!
            </text>
          </g>
        )}

        {mood === 'shocked' && (
          <g transform={`translate(278, 68) scale(${1.1 + Math.sin(frame * 0.4) * 0.15})`}>
            <circle cx="0" cy="0" r="26" fill="#FACC15" />
            <path d="M -3 -16 L -10 2 L 2 2 L -2 16 L 10 -2 L -1 -2 Z" fill="#0A0E17" />
          </g>
        )}

        {mood === 'sleepy' && (
          <g transform={`translate(268, 64)`} opacity="0.88">
            <text x={0} y={-((frame * 0.8) % 30)} fill="#93C5FD" fontSize="22" fontWeight="900">Z</text>
            <text x={14} y={-12 - ((frame * 0.8) % 30)} fill="#93C5FD" fontSize="16" fontWeight="900">z</text>
            <text x={24} y={-22 - ((frame * 0.8) % 30)} fill="#93C5FD" fontSize="12" fontWeight="900">z</text>
          </g>
        )}

        {mood === 'frustrated' && (
          /* Animated steam puffs puffing from ears */
          <g opacity="0.8">
            <circle cx={92 + Math.sin(frame * 0.3) * 4} cy={160 - (frame % 18)} r={6 + (frame % 8)} fill="#E2E8F0" opacity={0.6} />
            <circle cx={268 - Math.sin(frame * 0.3) * 4} cy={160 - (frame % 18)} r={6 + (frame % 8)} fill="#E2E8F0" opacity={0.6} />
          </g>
        )}

        {mood === 'panicked' && (
          <g>
            <circle cx="98" cy="148" r="6" fill="#38BDF8" opacity="0.8" />
            <circle cx="262" cy="148" r="6" fill="#38BDF8" opacity="0.8" />
          </g>
        )}

        {(mood === 'thinking' || mood === 'curious') && (
          <g transform={`translate(274, 72) translate(0, ${Math.sin(frame * 0.12) * 5})`}>
            <circle cx="0" cy="0" r="24" fill="#6366F1" stroke={accentColor} strokeWidth="3" />
            <text x="0" y="9" textAnchor="middle" fill="#FFFFFF" fontSize="28" fontWeight="900">
              ?
            </text>
          </g>
        )}

        {(mood === 'confident' || mood === 'smug') && (
          <g transform={`translate(278, 70) scale(${1 + Math.sin(frame * 0.15) * 0.1})`}>
            <polygon points="0,-16 4,-4 16,0 4,4 0,16 -4,4 -16,0 -4,-4" fill={GOLD} />
          </g>
        )}

        {mood === 'teasing' && (
          <g transform={`translate(276, 72) scale(${1 + Math.sin(frame * 0.2) * 0.15})`}>
            <polygon points="0,-14 3,-3 14,0 3,3 0,14 -3,3 -14,0 -3,-3" fill="#38BDF8" />
          </g>
        )}

        {mood === 'whispering' && (
          <g transform={`translate(270, 76)`} opacity="0.85">
            <ellipse cx="0" cy="0" rx="18" ry="14" fill="#1E293B" stroke={GOLD} strokeWidth="2" />
            <circle cx="-6" cy="0" r="2.5" fill={GOLD} />
            <circle cx="0" cy="0" r="2.5" fill={GOLD} />
            <circle cx="6" cy="0" r="2.5" fill={GOLD} />
          </g>
        )}

        {mood === 'determined' && (
          <g transform={`translate(274, 72) scale(${1 + Math.sin(frame * 0.25) * 0.12})`}>
            <circle cx="0" cy="0" r="22" fill="#EA580C" />
            <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="900">
              🔥
            </text>
          </g>
        )}

        {mood === 'celebrate' && (
          <g fill={accentColor}>
            {[
              [52, 92, 0],
              [304, 104, 1.4],
              [286, 54, 2.8],
            ].map(([sx, sy, phase], i) => {
              const s = 0.7 + Math.abs(Math.sin(frame * 0.18 + phase)) * 0.55;
              return (
                <path
                  key={i}
                  transform={`translate(${sx}, ${sy}) scale(${s})`}
                  d="M 0 -14 L 4 -4 L 14 0 L 4 4 L 0 14 L -4 4 L -14 0 L -4 -4 Z"
                />
              );
            })}
          </g>
        )}
        {/* ── SMARTPHONE PROP (when doomscrolling or demoing app) ── */}
        {holdingPhone && (
          <g transform={`translate(198, ${234 + Math.sin(frame * 0.2) * 3}) rotate(-10, 42, 65)`}>
            {/* Screen glow aura onto character */}
            <ellipse cx="42" cy="52" rx="68" ry="68" fill="#38BDF8" opacity="0.22" />
            <rect x="6" y="4" width="72" height="122" rx="14" fill="#0F172A" stroke="#94A3B8" strokeWidth="3.5" />
            <rect x="12" y="14" width="60" height="98" rx="8" fill="#1E293B" />
            {/* Animated reel feed scroll lines */}
            <rect
              x="18"
              y={24 + ((frame * 3) % 44)}
              width="48"
              height="34"
              rx="6"
              fill={mood === 'stressed' || mood === 'alert' ? '#F43F5E' : accentColor}
              opacity="0.85"
            />
            <rect x="18" y="84" width="36" height="6" rx="3" fill="rgba(255,255,255,0.45)" />
            <rect x="18" y="96" width="24" height="5" rx="2.5" fill="rgba(255,255,255,0.3)" />
            {/* Holding hand */}
            <ellipse cx="14" cy="76" rx="13" ry="16" fill="url(#skinGrad)" stroke="#DDA479" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
};
