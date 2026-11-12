import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { fontFamily } from './Brand';
import { BORDER, CORRECT_GREEN, GOLD, INK, MUTED, WHITE } from './theme';

export type MarketingFeatureId =
  | 'focus_guard'
  | 'short_notes'
  | 'ai_notes_quiz'
  | 'arcade_games'
  | 'challenge_mode'
  | 'daily_notifications'
  | 'category_insights'
  | 'leaderboard'
  | 'ai_interview_gd'
  | 'bookmarks';

export type MarketingSettingId =
  | 'hostel_bedroom_2am'
  | 'college_canteen_chai'
  | 'library_silent_corner'
  | 'exam_center_gate'
  | 'metro_bus_commute'
  | 'home_study_desk'
  | 'coaching_corridor'
  | 'pg_room_roommate'
  | 'rooftop_evening_walk'
  | 'coffee_shop_prep'
  | 'morning_alarm_bed'
  | 'interview_waiting_lounge'
  | 'study_group_table'
  | 'park_bench_evening'
  | 'tea_stall_tapri'
  | 'railway_station_platform'
  | 'hostel_mess_table'
  | 'cyber_cafe_portal'
  | 'book_market_street'
  | 'post_exam_auto_ride'
  | 'terrace_night_study'
  | 'coaching_classroom_backbench'
  | 'bus_stop_rain_wait'
  | 'hostel_balcony_dawn'
  | 'university_auditorium'
  | 'food_truck_snack'
  | 'hostel_corridor_midnight'
  | 'xerox_photocopy_shop'
  | 'temple_stairs_blessing'
  | 'exam_result_cyber_screen';

function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 1. PURE-CODE LIVING STORY BACKDROPS (14 Relatable Indian Aspirant Settings)
 * ═══════════════════════════════════════════════════════════════════════════ */
export const MarketingSceneBackdrop: React.FC<{
  setting: MarketingSettingId;
  accentColor?: string;
}> = ({ setting, accentColor = GOLD }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / Math.max(1, durationInFrames);
  const camScale = interpolate(progress, [0, 1], [1, 1.05]);
  const swayX = Math.sin(frame * 0.025) * 7;

  const isWarm =
    setting === 'college_canteen_chai' ||
    setting === 'coffee_shop_prep' ||
    setting === 'tea_stall_tapri' ||
    setting === 'food_truck_snack' ||
    setting === 'morning_alarm_bed' ||
    setting === 'hostel_balcony_dawn' ||
    setting === 'rooftop_evening_walk';

  const bgTop =
    setting === 'rooftop_evening_walk' || setting === 'terrace_night_study'
      ? '#1E1B4B'
      : setting === 'morning_alarm_bed' || setting === 'hostel_balcony_dawn'
      ? '#1F1426'
      : setting === 'exam_result_cyber_screen'
      ? '#062016'
      : isWarm
      ? '#13111C'
      : '#090D18';

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: bgTop }}>
      <div
        style={{
          position: 'absolute',
          inset: -24,
          transform: `scale(${camScale}) translateX(${swayX}px)`,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="mktAmber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={GOLD} stopOpacity="0.22" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="mktBlue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="mktRose" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="mktGreen" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mktCone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.24" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="scannerBar" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="0" />
              <stop offset="50%" stopColor="#22C55E" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="1080" height="1920" fill={bgTop} />

          {/* Faint parallax dot matrix */}
          <g opacity="0.06" fill="#FFFFFF">
            {Array.from({ length: 10 }).map((_, c) =>
              Array.from({ length: 16 }).map((__, r) => (
                <circle key={`${c}-${r}`} cx={60 + c * 108} cy={60 + r * 120} r="2" />
              )),
            )}
          </g>

          {/* ── SETTING GROUP 1: HOSTEL / PG / BALCONY / CORRIDOR / DAWN ── */}
          {(setting === 'hostel_bedroom_2am' ||
            setting === 'pg_room_roommate' ||
            setting === 'morning_alarm_bed' ||
            setting === 'hostel_balcony_dawn' ||
            setting === 'hostel_corridor_midnight') && (
            <g>
              <circle cx="240" cy="480" r="520" fill={setting === 'morning_alarm_bed' || setting === 'hostel_balcony_dawn' ? 'url(#mktAmber)' : 'url(#mktBlue)'} />
              <circle cx="840" cy="1420" r="560" fill="url(#mktRose)" />

              {/* Window with Moon or Morning Sun */}
              <g transform="translate(80, 210)" opacity="0.40">
                <rect width="300" height="380" rx="20" fill="#0F172A" stroke="#334155" strokeWidth="4" />
                <line x1="150" y1="0" x2="150" y2="380" stroke="#334155" strokeWidth="4" />
                <line x1="0" y1="190" x2="300" y2="190" stroke="#334155" strokeWidth="4" />
                {setting === 'morning_alarm_bed' || setting === 'hostel_balcony_dawn' ? (
                  <circle cx="215" cy="95" r="42" fill="#FB923C" opacity="0.75" />
                ) : (
                  <path d="M 225 58 A 34 34 0 1 0 258 102 A 26 26 0 1 1 225 58 Z" fill={GOLD} opacity="0.8" />
                )}
              </g>

              {/* Balcony Railing if dawn balcony */}
              {setting === 'hostel_balcony_dawn' && (
                <g transform="translate(0, 1420)" opacity="0.32" stroke={GOLD} strokeWidth="3">
                  <line x1="0" y1="0" x2="1080" y2="0" strokeWidth="8" />
                  {Array.from({ length: 18 }).map((_, idx) => (
                    <line key={idx} x1={idx * 60 + 30} y1="0" x2={idx * 60 + 30} y2="500" />
                  ))}
                </g>
              )}

              {/* Corridor perspective lines if corridor */}
              {setting === 'hostel_corridor_midnight' && (
                <g stroke="#334155" strokeWidth="2" opacity="0.25">
                  <line x1="0" y1="0" x2="540" y2="960" />
                  <line x1="1080" y1="0" x2="540" y2="960" />
                  <line x1="0" y1="1920" x2="540" y2="960" />
                  <line x1="1080" y1="1920" x2="540" y2="960" />
                  {/* Doorway light spill */}
                  <polygon points="120,600 220,700 220,1300 120,1400" fill="url(#mktCone)" opacity="0.3" />
                </g>
              )}

              {/* Wall Clock / Alarm Rings */}
              <g transform="translate(830, 340)" opacity="0.32" stroke={GOLD} fill="none">
                <circle r="92" strokeWidth="4" />
                <line x1="0" y1="0" x2="0" y2="-56" strokeWidth="4" strokeLinecap="round" />
                <line
                  x1="0"
                  y1="0"
                  x2={Math.sin(frame * 0.08) * 62}
                  y2={-Math.cos(frame * 0.08) * 62}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {setting === 'morning_alarm_bed' && (
                  <circle
                    r={108 + (frame % 20) * 2.2}
                    stroke="#F43F5E"
                    strokeWidth="3"
                    opacity={1 - (frame % 20) / 20}
                  />
                )}
              </g>

              {/* Hostel Bunk / Bed Frame Silhouette */}
              <g transform="translate(0, 1510)" opacity="0.25" fill="#1E293B">
                <rect x="60" y="120" width="960" height="36" rx="10" />
                <rect x="80" y="40" width="180" height="80" rx="20" fill="#334155" />
                <rect x="60" y="0" width="24" height="340" rx="6" />
                <rect x="996" y="60" width="24" height="280" rx="6" />
              </g>
            </g>
          )}

          {/* ── SETTING GROUP 2: CANTEEN / CHAI TAPRI / CAFE / MESS / FOOD CART ── */}
          {(setting === 'college_canteen_chai' ||
            setting === 'coffee_shop_prep' ||
            setting === 'study_group_table' ||
            setting === 'tea_stall_tapri' ||
            setting === 'hostel_mess_table' ||
            setting === 'food_truck_snack') && (
            <g>
              <circle cx="540" cy="460" r="620" fill="url(#mktAmber)" />
              <circle cx="220" cy="1480" r="500" fill="url(#mktBlue)" />

              {/* Hanging Cafe / Tapri Pendant Lights */}
              {[220, 540, 860].map((bx, i) => (
                <g key={i} opacity="0.42">
                  <line x1={bx} y1="0" x2={bx} y2={200 + (i % 2) * 55} stroke="#475569" strokeWidth="3" />
                  <polygon
                    points={`${bx - 36},${215 + (i % 2) * 55} ${bx + 36},${215 + (i % 2) * 55} ${bx + 180},960 ${bx - 180},960`}
                    fill="url(#mktCone)"
                    opacity="0.35"
                  />
                  <path
                    d={`M ${bx - 32} ${220 + (i % 2) * 55} Q ${bx} ${180 + (i % 2) * 55}, ${bx + 32} ${220 + (i % 2) * 55} Z`}
                    fill="#1E293B"
                    stroke={GOLD}
                    strokeWidth="2"
                  />
                </g>
              ))}

              {/* Street Light Post for Tea Stall Tapri */}
              {setting === 'tea_stall_tapri' && (
                <g transform="translate(140, 0)" opacity="0.45">
                  <line x1="0" y1="0" x2="0" y2="400" stroke="#64748B" strokeWidth="8" />
                  <circle cx="0" cy="400" r="32" fill={GOLD} opacity="0.8" />
                  <polygon points="-80,410 80,410 420,1800 -420,1800" fill="url(#mktCone)" opacity="0.5" />
                </g>
              )}

              {/* Steaming Chai Glasses & Kettle Silhouette */}
              <g transform="translate(790, 1590)" opacity="0.38">
                {setting === 'hostel_mess_table' ? (
                  /* Stainless steel thalis & water jugs */
                  <g>
                    <ellipse cx="60" cy="80" rx="90" ry="24" fill="#334155" stroke="#94A3B8" strokeWidth="3" />
                    <circle cx="30" cy="74" r="14" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
                    <circle cx="85" cy="74" r="14" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
                  </g>
                ) : (
                  /* Chai glass */
                  <g>
                    <polygon points="10,20 74,20 64,104 20,104" fill="#1E293B" stroke={GOLD} strokeWidth="3" />
                    {[28, 46].map((mx, idx) => {
                      const drift = Math.sin(frame * 0.09 + idx * 1.5) * 9;
                      return (
                        <path
                          key={idx}
                          d={`M ${mx} 12 Q ${mx + drift} -12, ${mx - drift * 0.6} -36 T ${mx + drift * 0.4} -72`}
                          fill="none"
                          stroke="#FDE68A"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </g>
                )}
              </g>
            </g>
          )}

          {/* ── SETTING GROUP 3: LIBRARY / HOME / XEROX / BOOK MARKET ── */}
          {(setting === 'library_silent_corner' ||
            setting === 'home_study_desk' ||
            setting === 'xerox_photocopy_shop' ||
            setting === 'book_market_street') && (
            <g>
              <circle cx="820" cy="360" r="560" fill="url(#mktAmber)" />
              <circle cx="240" cy="1100" r="520" fill="url(#mktBlue)" />

              {/* Bookshelf Silhouettes / Piles of notes */}
              <g transform="translate(70, 220)" opacity="0.25" fill="#1E293B" stroke="#475569" strokeWidth="2">
                <rect x="0" y="0" width="260" height="440" rx="10" />
                <line x1="0" y1="145" x2="260" y2="145" />
                <line x1="0" y1="290" x2="260" y2="290" />
                {[20, 56, 86, 130, 168, 206].map((x, idx) => (
                  <rect key={idx} x={x} y={40 + (idx % 3) * 10} width="24" height={105 - (idx % 3) * 10} rx="3" fill="#334155" />
                ))}
              </g>

              {/* Xerox Photocopy Shop Scanner Light Bar */}
              {setting === 'xerox_photocopy_shop' && (
                <g opacity="0.6">
                  <rect
                    x="0"
                    y={300 + ((frame * 12) % 800)}
                    width="1080"
                    height="18"
                    fill="url(#scannerBar)"
                  />
                </g>
              )}

              {/* Book Market Awning Stripes */}
              {setting === 'book_market_street' && (
                <g opacity="0.3">
                  <polygon points="0,0 1080,0 1080,180 0,180" fill="#0F172A" />
                  {Array.from({ length: 12 }).map((_, i) => (
                    <polygon
                      key={i}
                      points={`${i * 90},0 ${(i + 1) * 90},0 ${(i + 0.5) * 90},180 ${(i - 0.5) * 90},180`}
                      fill={i % 2 === 0 ? GOLD : '#F43F5E'}
                      opacity="0.3"
                    />
                  ))}
                </g>
              )}

              {/* Falling Rain on Home Desk */}
              {setting === 'home_study_desk' && (
                <g stroke="#93C5FD" strokeWidth="2" opacity="0.2">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const bx = seeded(i, 3) * 1080;
                    const y = ((seeded(i, 4) * 1900 + frame * 18) % 2000) - 100;
                    return <line key={i} x1={bx} y1={y} x2={bx - 8} y2={y + 42} />;
                  })}
                </g>
              )}

              {/* Desk Lamp Glow */}
              <polygon points="820,240 900,240 1120,1920 420,1920" fill="url(#mktCone)" opacity="0.55" />
            </g>
          )}

          {/* ── SETTING GROUP 4: METRO / RAILWAY / AUTO RIDE / BUS STOP ── */}
          {(setting === 'metro_bus_commute' ||
            setting === 'railway_station_platform' ||
            setting === 'post_exam_auto_ride' ||
            setting === 'bus_stop_rain_wait') && (
            <g>
              <circle cx="540" cy="600" r="640" fill="url(#mktBlue)" />
              {/* Passing City / Track Light Streaks */}
              {Array.from({ length: 16 }).map((_, i) => {
                const y = 260 + seeded(i, 9) * 1200;
                const w = 80 + seeded(i, 10) * 200;
                const speed = 22 + seeded(i, 11) * 18;
                const x = ((seeded(i, 12) * 1400 - frame * speed) % 1400 + 1400) % 1400 - 200;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={w}
                    height={6 + (i % 3) * 4}
                    rx="4"
                    fill={i % 2 === 0 ? GOLD : '#38BDF8'}
                    opacity="0.24"
                  />
                );
              })}

              {/* Railway Station Departure Clock */}
              {setting === 'railway_station_platform' && (
                <g transform="translate(680, 220)" opacity="0.45">
                  <rect width="320" height="90" rx="14" fill="#020617" stroke="#F59E0B" strokeWidth="3" />
                  <text x="160" y="58" fill="#F59E0B" fontSize="36" fontWeight="900" textAnchor="middle" fontFamily={fontFamily}>
                    PF #2 · EXP 04:30
                  </text>
                </g>
              )}

              {/* Bus Shelter & Rain */}
              {setting === 'bus_stop_rain_wait' && (
                <g opacity="0.35">
                  <path d="M 120 220 Q 540 160, 960 220 L 960 250 L 120 250 Z" fill="#334155" />
                  <g stroke="#93C5FD" strokeWidth="2" opacity="0.3">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const bx = seeded(i, 5) * 1080;
                      const y = ((seeded(i, 6) * 1900 + frame * 20) % 2000) - 100;
                      return <line key={i} x1={bx} y1={y} x2={bx - 6} y2={y + 36} />;
                    })}
                  </g>
                </g>
              )}

              {/* Auto Rickshaw Frame Bars */}
              {setting === 'post_exam_auto_ride' && (
                <g opacity="0.25" stroke="#EAB308" strokeWidth="8">
                  <line x1="80" y1="200" x2="80" y2="1800" />
                  <line x1="1000" y1="200" x2="1000" y2="1800" />
                  <path d="M 80 200 Q 540 120, 1000 200" fill="none" strokeWidth="12" />
                </g>
              )}

              {/* Train Window Frame */}
              {setting === 'metro_bus_commute' && (
                <rect x="60" y="210" width="960" height="720" rx="48" fill="none" stroke="#334155" strokeWidth="8" opacity="0.35" />
              )}
            </g>
          )}

          {/* ── SETTING GROUP 5: ROOFTOP / PARK / TERRACE / TEMPLE ── */}
          {(setting === 'rooftop_evening_walk' ||
            setting === 'park_bench_evening' ||
            setting === 'terrace_night_study' ||
            setting === 'temple_stairs_blessing') && (
            <g>
              <circle cx="540" cy="480" r={640} fill="url(#mktAmber)" />
              <circle cx="540" cy="1400" r={600} fill="url(#mktBlue)" />

              {/* Twinkling Stars */}
              {Array.from({ length: 24 }).map((_, i) => (
                <circle
                  key={i}
                  cx={seeded(i, 1) * 1080}
                  cy={140 + seeded(i, 2) * 650}
                  r={2 + (i % 3)}
                  fill="#FFFFFF"
                  opacity={0.25 + Math.abs(Math.sin(frame * 0.08 + i)) * 0.45}
                />
              ))}

              {/* Temple Shikhar Silhouette */}
              {setting === 'temple_stairs_blessing' ? (
                <g opacity="0.45" fill="#0A0E1A">
                  <polygon points="540,580 420,1100 660,1100" />
                  <polygon points="540,480 500,580 580,580" />
                  <circle cx="540" cy="460" r="14" fill={GOLD} />
                  {/* Temple stairs */}
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <rect key={idx} x={240 - idx * 24} y={1100 + idx * 45} width={600 + idx * 48} height={20} rx="4" />
                  ))}
                </g>
              ) : (
                /* City Skyline Silhouette */
                <path
                  d="M 0 1920 L 0 1440 L 120 1440 L 120 1320 L 240 1320 L 240 1480 L 380 1480 L 380 1280 L 520 1280 L 520 1460 L 680 1460 L 680 1340 L 820 1340 L 820 1490 L 950 1490 L 950 1370 L 1080 1370 L 1080 1920 Z"
                  fill="#070B14"
                  opacity="0.55"
                />
              )}
            </g>
          )}

          {/* ── SETTING GROUP 6: EXAM GATE / COACHING / INTERVIEW / AUDITORIUM / CYBER SCREEN ── */}
          {(setting === 'exam_center_gate' ||
            setting === 'coaching_corridor' ||
            setting === 'interview_waiting_lounge' ||
            setting === 'coaching_classroom_backbench' ||
            setting === 'university_auditorium' ||
            setting === 'cyber_cafe_portal' ||
            setting === 'exam_result_cyber_screen') && (
            <g>
              <circle cx="540" cy="420" r="620" fill={setting === 'exam_result_cyber_screen' ? 'url(#mktGreen)' : 'url(#mktBlue)'} />
              <circle cx="540" cy="1440" r="560" fill="url(#mktAmber)" />

              {/* Result Cyber Screen Celebration Banner */}
              {setting === 'exam_result_cyber_screen' && (
                <g transform="translate(180, 260)" opacity="0.6">
                  <rect width="720" height="140" rx="20" fill="rgba(34, 197, 94, 0.2)" stroke="#22C55E" strokeWidth="3" />
                  <text x="360" y="86" fill="#22C55E" fontSize="44" fontWeight="900" textAnchor="middle" fontFamily={fontFamily}>
                    ✓ QUALIFIED · AIR 142
                  </text>
                </g>
              )}

              {/* Classroom Blackboard & Equations */}
              {setting === 'coaching_classroom_backbench' && (
                <g transform="translate(140, 200)" opacity="0.35">
                  <rect width="800" height="340" rx="12" fill="#022C22" stroke="#64748B" strokeWidth="6" />
                  <text x="400" y="160" fill="#E2E8F0" fontSize="36" fontWeight="700" textAnchor="middle" fontFamily={fontFamily}>
                    ∫ f(x) dx + ∇ · B = 0 · PYQ 2026
                  </text>
                </g>
              )}

              {/* Auditorium Velvet Curtain Folds */}
              {setting === 'university_auditorium' && (
                <g opacity="0.32" fill="#450A0A">
                  <path d="M 0 0 C 140 180, 140 1200, 0 1600 Z" />
                  <path d="M 1080 0 C 940 180, 940 1200, 1080 1600 Z" />
                </g>
              )}

              {/* Architectural Pillars & Spotlight */}
              <polygon points="200,0 420,0 820,1920 340,1920" fill="url(#mktCone)" opacity="0.4" />
              <g opacity="0.2" fill="#1E293B" stroke={accentColor} strokeWidth="2">
                <rect x="80" y="220" width="90" height="1450" rx="8" />
                <rect x="910" y="220" width="90" height="1450" rx="8" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Vignette for clean foreground contrast */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, rgba(10,14,23,0.12) 15%, rgba(10,14,23,0.74) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
 * 2. PURE-CODE ANIMATED PHONE FEATURE MOCKUPS (All 10 App Features)
 * ═══════════════════════════════════════════════════════════════════════════ */
export const FeaturePhoneMockup: React.FC<{
  featureId: MarketingFeatureId;
  accentColor?: string;
}> = ({ featureId, accentColor = GOLD }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });

  return (
    <div
      style={{
        width: 440,
        height: 700,
        borderRadius: 42,
        padding: 14,
        background: 'linear-gradient(145deg, #334155 0%, #0F172A 100%)',
        border: `2.5px solid ${accentColor}`,
        boxShadow: `0 28px 60px rgba(0, 0, 0, 0.78), 0 0 42px ${accentColor}40`,
        transform: `scale(${interpolate(enter, [0, 1], [0.85, 1])}) translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
        opacity: enter,
        fontFamily,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Phone Inner Screen */}
      <div
        style={{
          flex: 1,
          borderRadius: 30,
          background: '#0A0E17',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '22px 20px',
          gap: 14,
        }}
      >
        {/* Top Notch & Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: MUTED }}>Aspirant Arcade</span>
          <div style={{ width: 84, height: 14, borderRadius: 99, background: '#1E2535' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: CORRECT_GREEN }}>LIVE</span>
        </div>

        {renderMockupScreen(featureId, frame, fps, accentColor)}
      </div>
    </div>
  );
};

function renderMockupScreen(
  featureId: MarketingFeatureId,
  frame: number,
  fps: number,
  accentColor: string,
) {
  const pop = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 11 } });

  switch (featureId) {
    case 'focus_guard':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(244, 63, 94, 0.16)',
              border: '1px solid #F43F5E',
              color: '#FDA4AF',
              fontSize: 15,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            🛡️ FOCUS GUARD INTERCEPTED REELS
          </div>
          <div
            style={{
              flex: 1,
              background: '#111827',
              border: `2px solid ${GOLD}`,
              borderRadius: 20,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 12,
              transform: `scale(${interpolate(pop, [0, 1], [0.92, 1])})`,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: GOLD }}>SOLVE 1 MCQ TO UNLOCK 5 MIN</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: WHITE, lineHeight: 1.3 }}>
              For a Carnot engine between 600K & 300K, max efficiency is?
            </div>
            {['25%', '50%', '75%'].map((opt, idx) => {
              const selected = idx === 1 && frame > 35;
              return (
                <div
                  key={opt}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: selected ? CORRECT_GREEN : '#1E293B',
                    color: selected ? INK : WHITE,
                    fontSize: 16,
                    fontWeight: 800,
                  }}
                >
                  {selected ? '✓ ' : ''}
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'short_notes':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: GOLD }}>⚡ CRISP SHORT NOTES</div>
          {[
            { tag: 'FORMULA 01', body: 'η = 1 - (T_low / T_high)' },
            { tag: 'KEY RULE', body: 'Entropy of universe always increases (ΔS ≥ 0)' },
            { tag: 'EXAM TRAP', body: 'Always convert °C to Kelvin before division!' },
          ].map((note, i) => {
            const cardSlide = spring({ frame: Math.max(0, frame - i * 8), fps, config: { damping: 13 } });
            return (
              <div
                key={i}
                style={{
                  background: '#111827',
                  borderLeft: `5px solid ${i === 2 ? '#F43F5E' : GOLD}`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  opacity: cardSlide,
                  transform: `translateY(${interpolate(cardSlide, [0, 1], [20, 0])}px)`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: GOLD, marginBottom: 4 }}>{note.tag}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: WHITE, lineHeight: 1.3 }}>{note.body}</div>
              </div>
            );
          })}
        </div>
      );

    case 'ai_notes_quiz':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#38BDF8' }}>🤖 AI NOTES + QUIZ OVERVIEW</div>
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.14)',
              border: `1.5px solid ${CORRECT_GREEN}`,
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: CORRECT_GREEN }}>YOUR MARKS</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: WHITE }}>17.5 / 20</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: WHITE, textAlign: 'right' }}>
              <div>✓ 9 Correct</div>
              <div style={{ color: '#FDA4AF' }}>✗ 1 Wrong</div>
            </div>
          </div>
          {['Q1 · Bernoulli Principle ✓ +2', 'Q2 · Reynolds Number ✓ +2', 'Q3 · Boundary Layer ✗ -0.5'].map((row, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: '#111827',
                border: `1px solid ${idx === 2 ? '#F43F5E' : BORDER}`,
                color: WHITE,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {row}
            </div>
          ))}
        </div>
      );

    case 'arcade_games':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: GOLD,
              color: INK,
              borderRadius: 14,
              padding: '10px 14px',
              fontSize: 18,
              fontWeight: 900,
              textAlign: 'center',
            }}
          >
            🎮 14+ ARCADE PREP MODES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
            {[
              { name: 'Cave Runner', emoji: '🏃' },
              { name: 'Tsunami', emoji: '🌊' },
              { name: 'Slasher', emoji: '⚔️' },
              { name: 'Survival', emoji: '🛡️' },
              { name: 'Speed Match', emoji: '⚡' },
              { name: 'MCQ Blitz', emoji: '🎯' },
            ].map((g, i) => {
              const scale = spring({ frame: Math.max(0, frame - i * 4), fps, config: { damping: 12 } });
              return (
                <div
                  key={g.name}
                  style={{
                    background: '#111827',
                    border: `1.5px solid ${i === 0 ? GOLD : BORDER}`,
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transform: `scale(${scale})`,
                  }}
                >
                  <span style={{ fontSize: 30 }}>{g.emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: WHITE }}>{g.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'challenge_mode':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: GOLD }}>⚔️ LIVE GROUP LOBBY</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#FDA4AF' }}>⏱ 04:48</span>
          </div>
          {[
            { name: 'Priya (You)', score: '420 pts', rank: '#1' },
            { name: 'Arjun', score: '390 pts', rank: '#2' },
            { name: 'Rohan', score: '340 pts', rank: '#3' },
            { name: 'Sneha', score: '310 pts', rank: '#4' },
          ].map((p, idx) => (
            <div
              key={p.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '13px 14px',
                borderRadius: 14,
                background: idx === 0 ? 'rgba(253, 192, 3, 0.16)' : '#111827',
                border: `1.5px solid ${idx === 0 ? GOLD : BORDER}`,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 800, color: WHITE }}>
                {p.rank} · {p.name}
              </span>
              <span style={{ fontSize: 16, fontWeight: 900, color: GOLD }}>{p.score}</span>
            </div>
          ))}
        </div>
      );

    case 'daily_notifications':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: GOLD }}>🔔 DAILY EXAM ALERTS</div>
          {[
            { badge: 'RECRUITMENT', title: 'HPCL Trainee 2026 Form Live' },
            { badge: 'RESULT OUT', title: 'SSC CGL Tier-1 Scorecard Released' },
            { badge: 'EXAM DATE', title: 'GATE Admit Card Window Open' },
          ].map((n, i) => {
            const slide = spring({ frame: Math.max(0, frame - i * 9), fps, config: { damping: 12 } });
            return (
              <div
                key={i}
                style={{
                  background: '#111827',
                  border: `1.5px solid ${i === 0 ? GOLD : BORDER}`,
                  borderRadius: 16,
                  padding: '14px 16px',
                  transform: `translateX(${interpolate(slide, [0, 1], [60, 0])}px)`,
                  opacity: slide,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 900, color: GOLD, marginBottom: 4 }}>● {n.badge}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: WHITE }}>{n.title}</div>
              </div>
            );
          })}
        </div>
      );

    case 'category_insights':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#38BDF8' }}>📊 CATEGORY INSIGHTS</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: '#111827', borderRadius: 14, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: CORRECT_GREEN }}>84%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>ACCURACY</div>
            </div>
            <div style={{ flex: 1, background: '#111827', borderRadius: 14, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: GOLD }}>18s</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>AVG SPEED</div>
            </div>
          </div>
          <div style={{ flex: 1, background: '#111827', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {[52, 68, 74, 84, 92].map((pct, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 34,
                    height: Math.round((pct / 100) * 180 * pop),
                    borderRadius: 8,
                    background: i === 4 ? CORRECT_GREEN : accentColor,
                  }}
                />
                <span style={{ fontSize: 12, color: MUTED, fontWeight: 700 }}>W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'leaderboard':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: GOLD }}>🏆 COMPETITIVE LEADERBOARD</div>
          {[
            { rank: '🥇 #1', name: 'Ananya S.', pts: '2,840 XP' },
            { rank: '🥈 #2', name: 'Kabir M.', pts: '2,690 XP' },
            { rank: '🥉 #3', name: 'Arjun (You ↑)', pts: '2,610 XP', me: true },
            { rank: '#4', name: 'Vikram R.', pts: '2,480 XP' },
          ].map((row, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 14,
                background: row.me ? GOLD : '#111827',
                color: row.me ? INK : WHITE,
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              <span>{row.rank} · {row.name}</span>
              <span>{row.pts}</span>
            </div>
          ))}
        </div>
      );

    case 'ai_interview_gd':
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#C084FC' }}>🎙️ AI INTERVIEW & GD SIMULATOR</div>
          <div style={{ background: '#1E293B', borderRadius: 16, padding: 14, color: WHITE, fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
            <div style={{ fontSize: 12, color: GOLD, marginBottom: 4 }}>AI PANELIST</div>
            “Why should we hire you over 500 other GATE qualifiers?”
          </div>
          <div style={{ background: 'rgba(192, 132, 252, 0.16)', border: '1.5px solid #C084FC', borderRadius: 16, padding: 14, color: WHITE, fontSize: 15, fontWeight: 700 }}>
            <div style={{ fontSize: 12, color: '#C084FC', marginBottom: 4 }}>LIVE FEEDBACK</div>
            Clarity: 9/10 · Structure: Strong STAR Format
          </div>
          <div style={{ textAlign: 'center', padding: '10px', borderRadius: 99, background: CORRECT_GREEN, color: INK, fontWeight: 900, fontSize: 15 }}>
            ● RECORDING ANSWER...
          </div>
        </div>
      );

    case 'bookmarks':
    default:
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: GOLD }}>🔖 BOOKMARKED TRAPS (24)</div>
          {[
            'Thermodynamics: Reversible Adiabatic Sign Trap',
            'Polity: Article 356 vs 360 Quorum Rule',
            'Quant: Successive Discount Net % Trick',
          ].map((q, i) => (
            <div
              key={i}
              style={{
                background: '#111827',
                border: `1.5px solid ${i === 0 ? GOLD : BORDER}`,
                borderRadius: 14,
                padding: '13px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>{q}</span>
              <span style={{ fontSize: 20 }}>🔖</span>
            </div>
          ))}
          <div style={{ marginTop: 'auto', textAlign: 'center', padding: '12px', borderRadius: 99, background: GOLD, color: INK, fontWeight: 900, fontSize: 15 }}>
            ▶ RE-PRACTICE SAVED QUESTIONS
          </div>
        </div>
      );
  }
}
