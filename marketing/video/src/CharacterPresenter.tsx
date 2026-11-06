import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { GOLD, INK, WHITE } from './theme';

export interface CharacterPresenterProps {
  variant?: 'arjun' | 'priya';
  mood?: 'talking' | 'listening' | 'pointing' | 'shocked' | 'holding_phone' | 'celebrating';
  isSpeaking?: boolean;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Premium Aspirant Arcade Character Component
 *
 * Features:
 *   - 'arjun': Relatable Indian Aspirant in Navy Blue & Gold Varsity Jacket with round gold specs & arcade headphones.
 *   - 'priya': Ambitious Study Partner in Cream & Navy Varsity Jacket with gold trim & stylish layered bob.
 *   - Rhythmic Multi-Viseme Lip Sync (5 viseme states with moving jaw drop synced to speech cadence).
 *   - Authentic Aspirant Arcade Crest Badge embroidered on the left chest.
 *   - Natural gestures (pointing, holding phone, celebrating, shocked).
 *   - Expressive eyes with specular highlights and natural blinking.
 */
export const CharacterPresenter: React.FC<CharacterPresenterProps> = ({
  variant = 'arjun',
  mood = 'talking',
  isSpeaking = false,
  scale = 1,
  className = '',
  style = {},
}) => {
  const frame = useCurrentFrame();
  const isArjun = variant === 'arjun';

  // Active speech detection (defaults to true if mood is 'talking')
  const effectiveIsSpeaking = isSpeaking || mood === 'talking';

  // 1. Natural Breathing (Chest & shoulders gently rise/fall)
  const breathing = Math.sin(frame / 16) * 3;

  // 2. Head Movement: Expressive speaking nod vs attentive listening tilt
  const headNod = effectiveIsSpeaking ? Math.sin(frame * 0.42) * 3.5 : Math.sin(frame / 18) * 1.5;
  const headTilt = effectiveIsSpeaking ? Math.sin(frame / 7) * 3.2 : isArjun ? -2 : 3;

  // 3. Natural Eye Blink every 3.5s (105 frames), lasts 4 frames
  const blinkCycle = frame % 110;
  const isBlinking = blinkCycle > 102 && blinkCycle < 107;

  // 4. Advanced Syllabic Lip-Sync Engine (4.5 syllables/sec ~ 6-7 frames per syllable)
  // Generates 5 distinct visemes with natural pauses:
  // 0: Closed / neutral lip line
  // 1: Half-open / consonant ('t', 's', 'm')
  // 2: Wide Open 'AH' / stressed vowel (jaw drops + tongue visible)
  // 3: Round 'OH' / 'OO' (pursed round lips)
  // 4: Wide Smile 'EE' (teeth grid)
  const syllableIndex = Math.floor(frame / 6);
  const subFrame = frame % 6;
  const isBreathPause = syllableIndex % 7 === 6; // Brief natural pause every ~1.4s

  let visemeState = 0;
  let jawDrop = 0;

  if (effectiveIsSpeaking && !isBreathPause) {
    if (subFrame === 0 || subFrame === 1) {
      // Primary vowel apex
      const vowelCycle = syllableIndex % 3;
      if (vowelCycle === 0) {
        visemeState = 2; // Wide AH
        jawDrop = 5;
      } else if (vowelCycle === 1) {
        visemeState = 3; // Round OH
        jawDrop = 3;
      } else {
        visemeState = 4; // Wide EE
        jawDrop = 2;
      }
    } else if (subFrame === 2 || subFrame === 3) {
      visemeState = 1; // Transition consonant
      jawDrop = 1.5;
    } else if (subFrame === 4) {
      visemeState = (syllableIndex % 2 === 0) ? 2 : 1;
      jawDrop = 2;
    } else {
      visemeState = 0; // Consonant closure
      jawDrop = 0;
    }
  }

  // 5. Expressive Gestures & Arm Angles
  const gestureFloat = Math.sin(frame * 0.22) * 5;
  let rightArmAngle = 8 + gestureFloat;
  let leftArmAngle = -8 - gestureFloat;

  if (mood === 'holding_phone') {
    rightArmAngle = -52;
    leftArmAngle = -18 + gestureFloat;
  } else if (mood === 'pointing') {
    rightArmAngle = -78 + Math.sin(frame * 0.25) * 3;
    leftArmAngle = -15;
  } else if (mood === 'shocked') {
    rightArmAngle = -115;
    leftArmAngle = 115;
  } else if (mood === 'celebrating') {
    rightArmAngle = -128 + Math.sin(frame * 0.35) * 6;
    leftArmAngle = 128 - Math.sin(frame * 0.35) * 6;
  } else if (effectiveIsSpeaking) {
    rightArmAngle = -38 + Math.sin(frame * 0.3) * 12;
    leftArmAngle = 16 - Math.sin(frame * 0.3) * 8;
  }

  // Color Palettes
  // Arjun: Deep Midnight Navy Varsity with Gold accents
  // Priya: Off-White Cream Varsity with Navy sleeves & Gold accents
  const jacketMain = isArjun ? '#0F172A' : '#F8FAFC';
  const jacketSleeves = isArjun ? '#1E293B' : '#0F172A';
  const jacketTrim = '#FDC003'; // Aspirant Arcade Yellow/Gold
  const skinToneBase = isArjun ? '#E5A97C' : '#E8B38E';
  const skinToneShade = isArjun ? '#CB8857' : '#D49467';
  const hairDark = isArjun ? '#181615' : '#261C17';
  const hairHighlight = isArjun ? '#3A2E26' : '#4C362A';

  return (
    <div
      className={`relative select-none pointer-events-none ${className}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'bottom center',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 400 640"
        width="400"
        height="640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        style={{ filter: 'drop-shadow(0 25px 40px rgba(0,0,0,0.55))' }}
      >
        <defs>
          {/* Jacket Body Gradient */}
          <linearGradient id={`jacketBodyGrad_${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isArjun ? '#1E293B' : '#FFFFFF'} />
            <stop offset="50%" stopColor={jacketMain} />
            <stop offset="100%" stopColor={isArjun ? '#090D16' : '#CBD5E1'} />
          </linearGradient>

          {/* Jacket Sleeve Gradient */}
          <linearGradient id={`jacketSleeveGrad_${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isArjun ? '#334155' : '#1E293B'} />
            <stop offset="70%" stopColor={jacketSleeves} />
            <stop offset="100%" stopColor={isArjun ? '#0F172A' : '#090D16'} />
          </linearGradient>

          {/* Premium Gold Ribbing Gradient */}
          <linearGradient id="goldRibGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDC003" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Skin Tone Gradient with Depth */}
          <linearGradient id={`skinGrad_${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skinToneBase} />
            <stop offset="100%" stopColor={skinToneShade} />
          </linearGradient>

          {/* Soft Drop Shadow for Layers */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* ══════════════════════════════════════════════════════
            1. BODY & JACKET (With Official Aspirant Arcade Logo)
        ══════════════════════════════════════════════════════ */}
        <g transform={`translate(0, ${breathing})`}>
          {/* Left Arm (Viewer's Left) */}
          <g transform={`translate(110, 300) rotate(${leftArmAngle})`} filter="url(#softShadow)">
            {/* Shoulder Cap */}
            <circle cx="0" cy="10" r="28" fill={`url(#jacketSleeveGrad_${variant})`} />
            {/* Sleeve Main */}
            <rect x="-24" y="0" width="48" height="155" rx="24" fill={`url(#jacketSleeveGrad_${variant})`} />
            {/* Athletic Dual Stripes */}
            <rect x="-24" y="45" width="48" height="8" fill="url(#goldRibGrad)" />
            <rect x="-24" y="58" width="48" height="6" fill="#FFFFFF" />
            {/* Ribbed Wrist Cuff */}
            <rect x="-22" y="132" width="44" height="26" rx="8" fill="url(#goldRibGrad)" />
            <rect x="-22" y="142" width="44" height="5" fill="#0F172A" />
            {/* Hand */}
            <circle cx="0" cy="180" r="22" fill={`url(#skinGrad_${variant})`} />
          </g>

          {/* Torso & Varsity Bomber */}
          <g filter="url(#softShadow)">
            {/* Main Jacket Body */}
            <path
              d="M 115 270 C 115 235, 285 235, 285 270 L 305 485 C 305 510, 95 510, 95 485 Z"
              fill={`url(#jacketBodyGrad_${variant})`}
              stroke={isArjun ? '#1E293B' : '#94A3B8'}
              strokeWidth="3.5"
            />

            {/* Bottom Waistband Ribbing */}
            <path d="M 95 475 Q 200 495 305 475 L 305 505 Q 200 525 95 505 Z" fill="url(#goldRibGrad)" />
            <path d="M 95 488 Q 200 508 305 488" stroke="#0F172A" strokeWidth="5" fill="none" />

            {/* Center Front Zipper Strip */}
            <rect x="194" y="275" width="12" height="205" rx="6" fill="#090D16" />
            <line x1="200" y1="280" x2="200" y2="475" stroke="url(#goldRibGrad)" strokeWidth="6" strokeDasharray="6 3" />

            {/* Inner T-Shirt Crew Collar */}
            <path d="M 165 248 Q 200 285 235 248 Z" fill={isArjun ? '#FFFFFF' : '#0F172A'} />

            {/* Varsity Collar (Ribbed Gold with Navy stripe) */}
            <path
              d="M 125 248 Q 200 295 275 248 L 275 268 Q 200 315 125 268 Z"
              fill="url(#goldRibGrad)"
            />
            <path d="M 132 258 Q 200 305 268 258" stroke="#0F172A" strokeWidth="4" fill="none" />

            {/* ─── OFFICIAL ASPIRANT ARCADE CREST BADGE (Left Chest) ─── */}
            <g transform="translate(130, 305)">
              {/* Outer Golden Crest Shield */}
              <path
                d="M 0 0 L 52 0 C 52 28, 42 48, 26 56 C 10 48, 0 28, 0 0 Z"
                fill="#0F172A"
                stroke="url(#goldRibGrad)"
                strokeWidth="3"
                filter="drop-shadow(0 4px 10px rgba(0,0,0,0.6))"
              />
              {/* Inner Shield Background */}
              <path
                d="M 4 4 L 48 4 C 48 26, 38 44, 26 50 C 14 44, 4 26, 4 4 Z"
                fill="#0A0F1D"
              />
              {/* Authentic Logo Image */}
              <image
                href={staticFile('logo_transparent.png')}
                xlinkHref={staticFile('logo_transparent.png')}
                x="6"
                y="6"
                width="40"
                height="40"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>

            {/* ─── RIGHT CHEST COLLEGIATE TEXT ("ASPIRANT") ─── */}
            <g transform="translate(245, 325)">
              <rect x="-35" y="-14" width="70" height="26" rx="6" fill="#0A0F1D" stroke="url(#goldRibGrad)" strokeWidth="1.5" />
              <text
                x="0"
                y="4"
                fill="#FDC003"
                fontSize="11"
                fontWeight="900"
                fontFamily="sans-serif"
                textAnchor="middle"
                letterSpacing="1.2"
              >
                ASPIRANT
              </text>
            </g>
          </g>

          {/* Right Arm (Viewer's Right) */}
          <g transform={`translate(290, 300) rotate(${rightArmAngle})`} filter="url(#softShadow)">
            {/* Shoulder Cap */}
            <circle cx="0" cy="10" r="28" fill={`url(#jacketSleeveGrad_${variant})`} />
            {/* Sleeve Main */}
            <rect x="-24" y="0" width="48" height="155" rx="24" fill={`url(#jacketSleeveGrad_${variant})`} />
            {/* Athletic Stripes */}
            <rect x="-24" y="45" width="48" height="8" fill="url(#goldRibGrad)" />
            <rect x="-24" y="58" width="48" height="6" fill="#FFFFFF" />
            {/* Sleeve Branding */}
            <text
              x="0"
              y="100"
              fill={isArjun ? 'rgba(253, 192, 3, 0.9)' : '#0F172A'}
              fontSize="10"
              fontWeight="900"
              fontFamily="sans-serif"
              textAnchor="middle"
              transform="rotate(90, 0, 100)"
              letterSpacing="2"
            >
              ARCADE
            </text>
            {/* Ribbed Wrist Cuff */}
            <rect x="-22" y="132" width="44" height="26" rx="8" fill="url(#goldRibGrad)" />
            <rect x="-22" y="142" width="44" height="5" fill="#0F172A" />

            {/* Hand & Interactive Props */}
            {mood === 'pointing' ? (
              <g transform="translate(0, 175)">
                <circle cx="0" cy="0" r="20" fill={`url(#skinGrad_${variant})`} />
                {/* Extended Index Finger pointing left */}
                <rect x="-10" y="-38" width="18" height="36" rx="9" fill={`url(#skinGrad_${variant})`} />
                {/* Thumb */}
                <circle cx="-14" cy="-6" r="8" fill={`url(#skinGrad_${variant})`} />
              </g>
            ) : mood === 'holding_phone' ? (
              <g transform="translate(0, 172)">
                <circle cx="0" cy="0" r="22" fill={`url(#skinGrad_${variant})`} />
                {/* Smartphone Device */}
                <rect x="-20" y="-44" width="40" height="64" rx="8" fill="#0A0E17" stroke="#FDC003" strokeWidth="3" />
                <rect x="-16" y="-39" width="32" height="54" rx="4" fill="#0F172A" />
                {/* Mini App UI Glow */}
                <rect x="-12" y="-32" width="24" height="6" rx="2" fill="#FDC003" />
                <rect x="-12" y="-22" width="24" height="24" rx="3" fill="#22C55E" opacity="0.8" />
              </g>
            ) : mood === 'celebrating' ? (
              <g transform="translate(0, 175)">
                <circle cx="0" cy="0" r="22" fill={`url(#skinGrad_${variant})`} />
                {/* Thumbs Up Hand */}
                <rect x="-8" y="-34" width="16" height="30" rx="8" fill={`url(#skinGrad_${variant})`} />
              </g>
            ) : (
              <circle cx="0" cy="180" r="22" fill={`url(#skinGrad_${variant})`} />
            )}
          </g>
        </g>

        {/* ══════════════════════════════════════════════════════
            2. HEAD, HAIR & EXPRESSIVE ANIMATED FACE
        ══════════════════════════════════════════════════════ */}
        <g transform={`translate(200, 180) rotate(${headTilt}) translate(0, ${headNod})`}>
          {/* Neck with Shadow */}
          <rect x="-24" y="28" width="48" height="52" fill={`url(#skinGrad_${variant})`} rx="10" />
          <path d="M -24 30 Q 0 46 24 30 L 24 45 Q 0 58 -24 45 Z" fill="rgba(0,0,0,0.18)" />

          {/* Retro Arcade Headphones on Neck (Arjun Only) */}
          {isArjun && (
            <g filter="url(#softShadow)">
              {/* Headband arch */}
              <path
                d="M -64 42 C -64 92, 64 92, 64 42"
                stroke="url(#goldRibGrad)"
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M -54 44 C -54 86, 54 86, 54 44"
                stroke="#0F172A"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              {/* Left & Right Cushioned Ear Cups */}
              <rect x="-74" y="20" width="22" height="44" rx="11" fill="#0A0E17" stroke="#FDC003" strokeWidth="3" />
              <circle cx="-63" cy="42" r="6" fill="#FDC003" />
              <rect x="52" y="20" width="22" height="44" rx="11" fill="#0A0E17" stroke="#FDC003" strokeWidth="3" />
              <circle cx="63" cy="42" r="6" fill="#FDC003" />
            </g>
          )}

          {/* Dynamic Jaw / Chin (Drops down when speaking) */}
          <path
            d={`M -64 -35 C -64 -115, 64 -115, 64 -35 C 64 35, 45 ${68 + jawDrop}, 0 ${72 + jawDrop} C -45 ${68 + jawDrop}, -64 35, -64 -35 Z`}
            fill={`url(#skinGrad_${variant})`}
            filter="url(#softShadow)"
          />

          {/* Ears with Details */}
          <g>
            <circle cx="-66" cy="-6" r="14" fill={`url(#skinGrad_${variant})`} />
            <circle cx="-66" cy="-6" r="7" fill="rgba(0,0,0,0.12)" />
            <circle cx="66" cy="-6" r="14" fill={`url(#skinGrad_${variant})`} />
            <circle cx="66" cy="-6" r="7" fill="rgba(0,0,0,0.12)" />
            {/* Priya's Cute Gold Hoop Earrings */}
            {!isArjun && (
              <>
                <circle cx="-68" cy="6" r="6" stroke="#FDC003" strokeWidth="2.5" fill="none" />
                <circle cx="68" cy="6" r="6" stroke="#FDC003" strokeWidth="2.5" fill="none" />
              </>
            )}
          </g>

          {/* Soft Friendly Cheek Blush */}
          <ellipse cx="-40" cy="10" rx="14" ry="7" fill="rgba(244, 63, 94, 0.16)" />
          <ellipse cx="40" cy="10" rx="14" ry="7" fill="rgba(244, 63, 94, 0.16)" />

          {/* HAIRSTYLE */}
          {isArjun ? (
            /* Arjun: Textured Trendy Quiff Crop with Volume */
            <g>
              {/* Back Hair Mass */}
              <path
                d="M -70 -40 C -72 -125, 72 -125, 70 -40 C 56 -56, 38 -80, 0 -78 C -38 -80, -56 -56, -70 -40 Z"
                fill={hairDark}
              />
              {/* Volumetric Top Waves */}
              <path
                d="M -54 -75 Q -20 -130 35 -85 Q 60 -115 50 -60 Q 10 -90 -54 -75 Z"
                fill={hairHighlight}
              />
              {/* Stylish Front Bangs */}
              <path
                d="M -48 -70 Q 0 -115 48 -68 Q 15 -85 -48 -70 Z"
                fill={hairDark}
              />
            </g>
          ) : (
            /* Priya: Modern Chic Layered Bob with Side Fringe */
            <g>
              {/* Hair Body */}
              <path
                d="M -72 -35 C -75 -128, 75 -128, 72 -35 C 78 28, 68 65, 58 75 C 50 30, 56 -25, 50 -55 C -12 -88, -48 -55, -58 70 C -70 58, -74 20, -72 -35 Z"
                fill={hairDark}
              />
              {/* Glossy Hair Sheen */}
              <path
                d="M -45 -72 Q 10 -110 56 -60 Q 5 -82 -45 -72 Z"
                fill={hairHighlight}
              />
            </g>
          )}

          {/* EYEBROWS (Dynamic Mood & Speaking Emphasis) */}
          <path
            d={
              mood === 'shocked'
                ? 'M -46 -46 Q -28 -62 -12 -42'
                : effectiveIsSpeaking
                ? 'M -46 -38 Q -28 -48 -12 -34'
                : 'M -46 -34 Q -28 -42 -12 -32'
            }
            stroke="#181615"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={
              mood === 'shocked'
                ? 'M 46 -46 Q 28 -62 12 -42'
                : effectiveIsSpeaking
                ? 'M 46 -38 Q 28 -48 12 -34'
                : 'M 46 -34 Q 28 -42 12 -32'
            }
            stroke="#181615"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* EYES (With Natural Blinking & Dual Specular Highlights) */}
          {isBlinking ? (
            <g>
              <line x1="-42" y1="-14" x2="-16" y2="-14" stroke="#181615" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="16" y1="-14" x2="42" y2="-14" stroke="#181615" strokeWidth="4.5" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              {/* Left Eye */}
              <circle cx="-29" cy="-16" r="12" fill="#FFFFFF" />
              <circle cx="-28" cy="-16" r="7.5" fill="#2B1A12" />
              <circle cx="-25" cy="-19" r="3" fill="#FFFFFF" />
              <circle cx="-31" cy="-13" r="1.5" fill="#FFFFFF" />
              {/* Upper Eyelid Line */}
              <path d="M -42 -18 Q -29 -24 -16 -18" stroke="#181615" strokeWidth="3" strokeLinecap="round" fill="none" />

              {/* Right Eye */}
              <circle cx="29" cy="-16" r="12" fill="#FFFFFF" />
              <circle cx="30" cy="-16" r="7.5" fill="#2B1A12" />
              <circle cx="33" cy="-19" r="3" fill="#FFFFFF" />
              <circle cx="27" cy="-13" r="1.5" fill="#FFFFFF" />
              {/* Upper Eyelid Line */}
              <path d="M 16 -18 Q 29 -24 42 -18" stroke="#181615" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* Arjun's Sleek Circular Gold Spectacles */}
          {isArjun && (
            <g filter="url(#softShadow)">
              {/* Left Lens Frame */}
              <circle cx="-29" cy="-15" r="22" stroke="url(#goldRibGrad)" strokeWidth="3.5" fill="rgba(253, 192, 3, 0.08)" />
              {/* Right Lens Frame */}
              <circle cx="29" cy="-15" r="22" stroke="url(#goldRibGrad)" strokeWidth="3.5" fill="rgba(253, 192, 3, 0.08)" />
              {/* Center Bridge */}
              <line x1="-7" y1="-15" x2="7" y2="-15" stroke="url(#goldRibGrad)" strokeWidth="3.5" />
              {/* Frame Temples */}
              <line x1="-51" y1="-15" x2="-65" y2="-11" stroke="url(#goldRibGrad)" strokeWidth="2.5" />
              <line x1="51" y1="-15" x2="65" y2="-11" stroke="url(#goldRibGrad)" strokeWidth="2.5" />
              {/* Glossy Lens Glare */}
              <path d="M -39 -25 L -25 -29" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
              <path d="M 19 -25 L 33 -29" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* Nose */}
          <path d="M -2 -5 L 0 8 L 7 8" stroke="#A76839" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* ══════════════════════════════════════════════════════
              3. HIGH-VISIBILITY MULTI-VISEME LIP SYNC ENGINE
          ══════════════════════════════════════════════════════ */}
          <g transform={`translate(0, ${26 + jawDrop * 0.7})`}>
            {effectiveIsSpeaking ? (
              visemeState === 2 ? (
                /* ─── VISEME 2: WIDE OPEN 'AH' (Active speech apex) ─── */
                <g filter="url(#softShadow)">
                  {/* Outer Lip Contour & Dark Oral Cavity */}
                  <path
                    d="M -22 -2 Q 0 28 22 -2 Q 0 -8 -22 -2 Z"
                    fill="#240707"
                    stroke="#4A1810"
                    strokeWidth="3"
                  />
                  {/* Top White Teeth Arch */}
                  <path d="M -15 -2 Q 0 4 15 -2 L 12 -5 Q 0 -3 -12 -5 Z" fill="#FFFFFF" />
                  {/* Vibrant Pink Tongue */}
                  <ellipse cx="0" cy="14" rx="10" ry="6" fill="#F43F5E" />
                </g>
              ) : visemeState === 3 ? (
                /* ─── VISEME 3: ROUND 'OH' / 'OO' ─── */
                <g filter="url(#softShadow)">
                  <ellipse cx="0" cy="4" rx="11" ry="14" fill="#240707" stroke="#4A1810" strokeWidth="3" />
                  <ellipse cx="0" cy="8" rx="6" ry="4" fill="#F43F5E" />
                  <path d="M -6 -1 Q 0 2 6 -1" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
                </g>
              ) : visemeState === 4 ? (
                /* ─── VISEME 4: WIDE SMILE 'EE' (Horizontal teeth) ─── */
                <g filter="url(#softShadow)">
                  <path
                    d="M -24 -2 Q 0 16 24 -2 Q 0 -4 -24 -2 Z"
                    fill="#240707"
                    stroke="#4A1810"
                    strokeWidth="3"
                  />
                  <rect x="-16" y="-2" width="32" height="6" rx="2" fill="#FFFFFF" />
                </g>
              ) : visemeState === 1 ? (
                /* ─── VISEME 1: HALF OPEN CONSONANT ('T', 'S', 'M') ─── */
                <g filter="url(#softShadow)">
                  <path
                    d="M -18 0 Q 0 12 18 0 Q 0 -4 -18 0 Z"
                    fill="#240707"
                    stroke="#4A1810"
                    strokeWidth="2.5"
                  />
                  <path d="M -12 0 L 12 0" stroke="#FFFFFF" strokeWidth="2.5" />
                </g>
              ) : (
                /* ─── VISEME 0: CLOSED CONSONANT / BREATH REST ─── */
                <path
                  d="M -16 2 Q 0 8 16 2"
                  stroke="#4A1810"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
              )
            ) : mood === 'celebrating' ? (
              /* Joyful Victory Smile */
              <g>
                <path d="M -22 -2 Q 0 20 22 -2 Q 0 -6 -22 -2 Z" fill="#240707" stroke="#4A1810" strokeWidth="3" />
                <path d="M -16 -2 Q 0 4 16 -2" stroke="#FFFFFF" strokeWidth="3" fill="none" />
              </g>
            ) : mood === 'shocked' ? (
              /* Surprised 'O' */
              <circle cx="0" cy="6" r="11" fill="#240707" stroke="#4A1810" strokeWidth="3" />
            ) : (
              /* Attentive Friendly Listening Smile */
              <path d="M -16 2 Q 0 9 16 2" stroke="#5E2C18" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};
