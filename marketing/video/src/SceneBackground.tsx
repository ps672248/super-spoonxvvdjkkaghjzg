import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { GOLD, INK } from './theme';

export type SceneTheme =
  | 'breaking_news'
  | 'study_night'
  | 'engineering_tech'
  | 'stage_spotlight'
  | 'exam_hall';

export function resolveSceneTheme(
  vertical: string,
  kind?: string,
  explicit?: SceneTheme,
): SceneTheme {
  if (explicit) return explicit;
  if (kind === 'strategy') return 'study_night';
  if (kind === 'experience' || kind === 'marketing') return 'stage_spotlight';
  if (vertical === 'engineering') return 'engineering_tech';
  if (vertical === 'entrance' || vertical === 'schooling') return 'study_night';
  if (vertical === 'college') return 'stage_spotlight';
  if (vertical === 'govt') return 'breaking_news';
  return 'exam_hall';
}

function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Multi-toothed vector gear path generator for engineering_tech backdrop. */
function gearPath(cx: number, cy: number, outerR: number, innerR: number, teeth: number): string {
  const step = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.2;
    const a2 = a0 + step * 0.45;
    const a3 = a0 + step * 0.65;
    const pts = [
      [cx + Math.cos(a0) * innerR, cy + Math.sin(a0) * innerR],
      [cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR],
      [cx + Math.cos(a2) * outerR, cy + Math.sin(a2) * outerR],
      [cx + Math.cos(a3) * innerR, cy + Math.sin(a3) * innerR],
    ];
    d += (i === 0 ? `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} ` : `L ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `) +
      `L ${pts[1][0].toFixed(1)} ${pts[1][1].toFixed(1)} L ${pts[2][0].toFixed(1)} ${pts[2][1].toFixed(1)} L ${pts[3][0].toFixed(1)} ${pts[3][1].toFixed(1)} `;
  }
  return `${d}Z`;
}

export const SceneBackground: React.FC<{
  scene: SceneTheme;
  format?: 'reel' | 'landscape';
}> = ({ scene, format }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const isLandscape = format === 'landscape' || width > height;
  const progress = frame / Math.max(1, durationInFrames);

  // Subtle ambient camera drift across the scene
  const camScale = interpolate(progress, [0, 1], [1.0, 1.05]);
  const camX = Math.sin(frame * 0.025) * 8;
  const camY = Math.cos(frame * 0.02) * 6;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: INK }}>
      <div
        style={{
          position: 'absolute',
          inset: -24,
          transform: `scale(${camScale}) translate(${camX}px, ${camY}px)`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={isLandscape ? '0 0 1920 1080' : '0 0 1080 1920'}
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={GOLD} stopOpacity="0.22" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="crimsonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="indigoGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="lampCone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={GOLD} stopOpacity="0.22" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="stageBeam" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Base Deep Gradient Backdrop */}
          <rect
            width={isLandscape ? 1920 : 1080}
            height={isLandscape ? 1080 : 1920}
            fill={scene === 'engineering_tech' ? '#070E1D' : scene === 'study_night' ? '#090D1A' : '#0A0E17'}
          />

          {/* Subtle Moving Grid Layer */}
          <g
            transform={`translate(${(frame * 0.4) % 80 - 80}, ${(frame * 0.7) % 80 - 80})`}
            opacity={0.045}
            stroke="#FFFFFF"
            strokeWidth={1}
          >
            {Array.from({ length: isLandscape ? 28 : 20 }).map((_, idx) => (
              <line key={`v-${idx}`} x1={idx * 80} y1={0} x2={idx * 80} y2={isLandscape ? 1240 : 2080} />
            ))}
            {Array.from({ length: isLandscape ? 18 : 28 }).map((_, idx) => (
              <line key={`h-${idx}`} x1={0} y1={idx * 80} x2={isLandscape ? 2080 : 1240} y2={idx * 80} />
            ))}
          </g>

          {/* ── SCENE 1: BREAKING NEWS ── */}
          {scene === 'breaking_news' && (
            <g>
              <circle cx={isLandscape ? 420 : 220} cy={isLandscape ? 260 : 340} r={540} fill="url(#crimsonGlow)" />
              <circle cx={isLandscape ? 1500 : 880} cy={isLandscape ? 820 : 1480} r={620} fill="url(#goldGlow)" />

              {/* Sweeping Radar Arcs */}
              <g
                transform={`translate(${isLandscape ? 960 : 540}, ${isLandscape ? 540 : 720}) rotate(${frame * 0.65})`}
                opacity={0.14}
              >
                <circle r={260} fill="none" stroke={GOLD} strokeWidth={2} strokeDasharray="36 22" />
                <circle r={420} fill="none" stroke="#F43F5E" strokeWidth={1.5} strokeDasharray="18 28" />
                <circle r={580} fill="none" stroke="#38BDF8" strokeWidth={1} strokeDasharray="12 18" />
                <line x1={0} y1={0} x2={420} y2={0} stroke={GOLD} strokeWidth={2} opacity={0.6} />
              </g>

              {/* Animated Diagonal Broadcast Beams */}
              <polygon
                points={
                  isLandscape
                    ? `${300 + Math.sin(frame * 0.04) * 140},0 ${620 + Math.sin(frame * 0.04) * 140},0 1100,1080 580,1080`
                    : `${150 + Math.sin(frame * 0.04) * 120},0 ${420 + Math.sin(frame * 0.04) * 120},0 860,1920 380,1920`
                }
                fill="url(#lampCone)"
                opacity={0.4}
              />

              {/* Stylized Clock Silhouette (Urgency cue) */}
              <g
                transform={`translate(${isLandscape ? 1580 : 840}, ${isLandscape ? 260 : 320})`}
                opacity={0.12}
                stroke={GOLD}
                fill="none"
              >
                <circle cx={0} cy={0} r={110} strokeWidth={4} />
                <circle cx={0} cy={0} r={92} strokeWidth={1.5} strokeDasharray="6 10" />
                <line
                  x1={0}
                  y1={0}
                  x2={Math.sin(frame * 0.08) * 65}
                  y2={-Math.cos(frame * 0.08) * 65}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                <line
                  x1={0}
                  y1={0}
                  x2={Math.sin(frame * 0.015) * 45}
                  y2={-Math.cos(frame * 0.015) * 45}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              </g>
            </g>
          )}

          {/* ── SCENE 2: LATE NIGHT STUDY DESK ── */}
          {scene === 'study_night' && (
            <g>
              <circle cx={isLandscape ? 1420 : 780} cy={isLandscape ? 300 : 420} r={600} fill="url(#goldGlow)" />
              <circle cx={isLandscape ? 400 : 240} cy={isLandscape ? 500 : 900} r={520} fill="url(#indigoGlow)" />

              {/* Night Window + Crescent Moon */}
              <g transform={`translate(${isLandscape ? 160 : 80}, ${isLandscape ? 140 : 210})`} opacity={0.42}>
                <rect x={0} y={0} width={320} height={420} rx={24} fill="#0F172A" stroke="#334155" strokeWidth={4} />
                <line x1={160} y1={0} x2={160} y2={420} stroke="#334155" strokeWidth={4} />
                <line x1={0} y1={210} x2={320} y2={210} stroke="#334155" strokeWidth={4} />
                {/* Moon */}
                <path
                  d="M 235 65 A 36 36 0 1 0 270 112 A 28 28 0 1 1 235 65 Z"
                  fill={GOLD}
                  opacity={0.75}
                />
                {/* Twinkling Stars */}
                {[
                  [45, 55],
                  [95, 115],
                  [60, 165],
                  [220, 165],
                  [275, 260],
                  [75, 290],
                ].map(([sx, sy], i) => (
                  <circle
                    key={i}
                    cx={sx}
                    cy={sy}
                    r={2.5 + Math.sin(frame * 0.1 + i * 2) * 1.2}
                    fill="#FFFFFF"
                    opacity={0.4 + Math.sin(frame * 0.12 + i) * 0.35}
                  />
                ))}
              </g>

              {/* Diagonal Falling Rain Streaks */}
              <g stroke="#93C5FD" strokeWidth={2} opacity={0.22}>
                {Array.from({ length: 24 }).map((_, i) => {
                  const baseX = seeded(i, 1) * (isLandscape ? 1920 : 1080);
                  const speed = 16 + seeded(i, 2) * 14;
                  const len = 35 + seeded(i, 3) * 45;
                  const yPos = ((seeded(i, 4) * 2000 + frame * speed) % (isLandscape ? 1200 : 2000)) - 100;
                  const xPos = baseX - yPos * 0.16;
                  return <line key={i} x1={xPos} y1={yPos} x2={xPos - len * 0.16} y2={yPos + len} />;
                })}
              </g>

              {/* Warm Desk Lamp Cone */}
              <polygon
                points={
                  isLandscape
                    ? '1560,120 1640,120 1920,1080 1120,1080'
                    : '820,260 900,260 1120,1920 380,1920'
                }
                fill="url(#lampCone)"
                opacity={0.65}
              />

              {/* Steaming Chai/Coffee Mug Silhouette at bottom-right */}
              <g
                transform={`translate(${isLandscape ? 1620 : 860}, ${isLandscape ? 880 : 1620})`}
                opacity={0.36}
              >
                <rect x={0} y={40} width={86} height={74} rx={12} fill="#1E293B" stroke={GOLD} strokeWidth={3} />
                <path d="M 86 54 C 114 54, 114 96, 86 96" fill="none" stroke={GOLD} strokeWidth={3} />
                {/* Rising Animated Steam Wisps */}
                {[18, 43, 68].map((mx, idx) => {
                  const drift = Math.sin(frame * 0.08 + idx * 1.7) * 9;
                  return (
                    <path
                      key={idx}
                      d={`M ${mx} 28 Q ${mx + drift} 8, ${mx - drift * 0.6} -12 T ${mx + drift * 0.5} -52`}
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth={3}
                      strokeLinecap="round"
                      opacity={0.6}
                    />
                  );
                })}
              </g>
            </g>
          )}

          {/* ── SCENE 3: ENGINEERING / PSU TECH ── */}
          {scene === 'engineering_tech' && (
            <g>
              <circle cx={isLandscape ? 500 : 300} cy={isLandscape ? 320 : 480} r={580} fill="url(#cyanGlow)" />
              <circle cx={isLandscape ? 1480 : 820} cy={isLandscape ? 780 : 1440} r={540} fill="url(#goldGlow)" />

              {/* Interlocking Rotating Vector Gears */}
              <g
                transform={`translate(${isLandscape ? 1580 : 880}, ${isLandscape ? 260 : 340}) rotate(${frame * 0.45})`}
                opacity={0.12}
                fill="none"
                stroke="#38BDF8"
                strokeWidth={3}
              >
                <path d={gearPath(0, 0, 175, 145, 14)} />
                <circle cx={0} cy={0} r={65} />
              </g>
              <g
                transform={`translate(${isLandscape ? 1320 : 620}, ${isLandscape ? 420 : 510}) rotate(${-frame * 0.63 + 12})`}
                opacity={0.11}
                fill="none"
                stroke={GOLD}
                strokeWidth={3}
              >
                <path d={gearPath(0, 0, 125, 102, 10)} />
                <circle cx={0} cy={0} r={42} />
              </g>

              {/* Glowing Circuit Traces with Traveling Pulses */}
              <g fill="none" strokeWidth={2.5} opacity={0.22}>
                <path
                  d={isLandscape ? 'M 0 220 L 280 220 L 380 320 L 720 320' : 'M 0 420 L 240 420 L 320 500 L 640 500'}
                  stroke="#38BDF8"
                />
                <path
                  d={isLandscape ? 'M 0 220 L 280 220 L 380 320 L 720 320' : 'M 0 420 L 240 420 L 320 500 L 640 500'}
                  stroke={GOLD}
                  strokeWidth={4}
                  strokeDasharray="60 400"
                  strokeDashoffset={-frame * 8}
                />
                <path
                  d={
                    isLandscape
                      ? 'M 1920 820 L 1540 820 L 1420 700 L 1060 700'
                      : 'M 1080 1480 L 780 1480 L 680 1380 L 280 1380'
                  }
                  stroke="#38BDF8"
                />
                <path
                  d={
                    isLandscape
                      ? 'M 1920 820 L 1540 820 L 1420 700 L 1060 700'
                      : 'M 1080 1480 L 780 1480 L 680 1380 L 280 1380'
                  }
                  stroke="#38BDF8"
                  strokeWidth={4}
                  strokeDasharray="70 420"
                  strokeDashoffset={-frame * 6.5}
                />
              </g>
            </g>
          )}

          {/* ── SCENE 4: STAGE SPOTLIGHT (EXPERIENCE / MARKETING) ── */}
          {scene === 'stage_spotlight' && (
            <g>
              <circle cx={isLandscape ? 960 : 540} cy={isLandscape ? 480 : 780} r={680} fill="url(#indigoGlow)" />
              <circle cx={isLandscape ? 960 : 540} cy={isLandscape ? 900 : 1580} r={540} fill="url(#goldGlow)" />

              {/* Dual Sweeping Stage Spotlights */}
              <polygon
                points={
                  isLandscape
                    ? `120,0 320,0 ${920 + Math.sin(frame * 0.03) * 180},1080 ${520 + Math.sin(frame * 0.03) * 180},1080`
                    : `60,0 240,0 ${760 + Math.sin(frame * 0.03) * 160},1920 ${360 + Math.sin(frame * 0.03) * 160},1920`
                }
                fill="url(#stageBeam)"
              />
              <polygon
                points={
                  isLandscape
                    ? `1600,0 1800,0 ${1360 - Math.sin(frame * 0.03) * 180},1080 ${980 - Math.sin(frame * 0.03) * 180},1080`
                    : `840,0 1020,0 ${720 - Math.sin(frame * 0.03) * 160},1920 ${320 - Math.sin(frame * 0.03) * 160},1920`
                }
                fill="url(#lampCone)"
              />

              {/* Subtle Architectural Arch Silhouette */}
              <path
                d={
                  isLandscape
                    ? 'M 420 1080 L 420 520 A 540 420 0 0 1 1500 520 L 1500 1080'
                    : 'M 140 1920 L 140 620 A 400 380 0 0 1 940 620 L 940 1920'
                }
                fill="none"
                stroke={GOLD}
                strokeWidth={2}
                opacity={0.12}
              />

              {/* Drifting Bokeh Orbs */}
              {Array.from({ length: 18 }).map((_, i) => {
                const bx = seeded(i, 11) * (isLandscape ? 1920 : 1080);
                const speed = 1.6 + seeded(i, 12) * 2.4;
                const by = (isLandscape ? 1160 : 2020) - ((seeded(i, 13) * 2000 + frame * speed) % (isLandscape ? 1240 : 2100));
                const r = 10 + seeded(i, 14) * 26;
                return (
                  <circle
                    key={i}
                    cx={bx + Math.sin(frame * 0.03 + i) * 16}
                    cy={by}
                    r={r}
                    fill={i % 2 === 0 ? GOLD : '#818CF8'}
                    opacity={0.07 + seeded(i, 15) * 0.09}
                  />
                );
              })}
            </g>
          )}

          {/* ── SCENE 5: EXAM HALL ── */}
          {scene === 'exam_hall' && (
            <g>
              <circle cx={isLandscape ? 960 : 540} cy={isLandscape ? 440 : 680} r={680} fill="url(#goldGlow)" />
              <circle cx={isLandscape ? 400 : 220} cy={isLandscape ? 860 : 1520} r={540} fill="url(#indigoGlow)" />
              {/* Concentric Target Rings */}
              <g transform={`translate(${isLandscape ? 960 : 540}, ${isLandscape ? 540 : 880})`} opacity={0.11}>
                <circle r={240 + Math.sin(frame * 0.05) * 10} fill="none" stroke={GOLD} strokeWidth={2} />
                <circle r={390} fill="none" stroke="#FFFFFF" strokeWidth={1.5} strokeDasharray="10 14" />
                <circle r={540} fill="none" stroke={GOLD} strokeWidth={1} />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Foreground Readability Vignette — guarantees crisp contrast behind cards & captions */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(10,14,23,0.18) 20%, rgba(10,14,23,0.72) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
