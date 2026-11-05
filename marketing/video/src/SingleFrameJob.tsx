import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { fontFamily } from './Brand';
import { BORDER, GOLD, INK, MUTED, PANEL, WHITE, CORRECT_GREEN } from './theme';

export interface SingleFrameJobProps {
  orgName?: string;
  badge?: string;
  role?: string;
  salary?: string;
  salarySub?: string;
  branches?: string[];
  deadline?: string;
  examDate?: string;
  selectionProcess?: string;
  hasBgm?: boolean;
}

export const SingleFrameJob: React.FC<SingleFrameJobProps> = ({
  orgName = 'ISRO Recruitment 2026',
  badge = '320 Vacancies • Freshers Eligible',
  role = "Scientist / Engineer 'SC'",
  salary = '₹1,56,000 / mo',
  salarySub = 'Pay Level 10 + Central DA, HRA & Medical Perks',
  branches = ['Mechanical', 'Electronics', 'Computer Science', 'Electrical', 'Civil'],
  deadline = '28 MARCH 2026',
  examDate = 'MAY 2026 (CBT)',
  selectionProcess = 'Valid GATE Score / Written Test + Interview',
}) => {
  const frame = useCurrentFrame();

  // Subtle pulsing animation on the "Screenshot Lelo" badge
  const pulse = Math.sin(frame / 6) * 0.04 + 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: INK,
        fontFamily,
        color: WHITE,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 56px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ─── 1. TOP HEADER ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `2px solid ${BORDER}`,
          paddingBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Img
            src={staticFile('logo_transparent.png')}
            style={{
              width: '84px',
              height: '84px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 24px rgba(253, 192, 3, 0.35))',
            }}
          />
          <div>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 900,
                color: GOLD,
                backgroundColor: 'rgba(253, 192, 3, 0.12)',
                padding: '5px 14px',
                borderRadius: '8px',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              Official Recruitment Notification
            </span>
            <h1
              style={{
                fontSize: '38px',
                fontWeight: 900,
                color: WHITE,
                margin: '10px 0 0 0',
                letterSpacing: '-0.5px',
              }}
            >
              {orgName}
            </h1>
          </div>
        </div>

        {/* Vacancy Badge */}
        <div
          style={{
            padding: '12px 22px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '2px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '16px',
          }}
        >
          <span style={{ color: CORRECT_GREEN, fontWeight: 900, fontSize: '20px', letterSpacing: '0.5px' }}>
            {badge}
          </span>
        </div>
      </div>

      {/* ─── 2. HERO ROLE & PACKAGE (FULL WIDTH CLEAN LAYOUT) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', margin: 'auto 0' }}>
        <div>
          <p
            style={{
              color: MUTED,
              fontWeight: 800,
              fontSize: '18px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              margin: '0 0 10px 0',
            }}
          >
            Target Post / Position
          </p>
          <h2
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: WHITE,
              lineHeight: 1.1,
              letterSpacing: '-1px',
              margin: 0,
            }}
          >
            {role}
          </h2>
        </div>

        {/* Salary Highlight Card */}
        <div
          style={{
            padding: '34px',
            borderRadius: '28px',
            backgroundColor: PANEL,
            border: `2px solid rgba(253, 192, 3, 0.4)`,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span
              style={{
                color: GOLD,
                fontWeight: 900,
                fontSize: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
              }}
            >
              💰 Gross Monthly CTC / Pay
            </span>
            <span
              style={{
                fontSize: '15px',
                color: MUTED,
                fontWeight: 700,
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: '6px 14px',
                borderRadius: '8px',
              }}
            >
              Central Pay Matrix Level 10
            </span>
          </div>
          <div style={{ fontSize: '68px', fontWeight: 900, color: WHITE, letterSpacing: '-1.5px' }}>{salary}</div>
          <p style={{ color: MUTED, fontSize: '20px', margin: '10px 0 0 0', fontWeight: 600 }}>{salarySub}</p>
        </div>

        {/* Eligibility Branches */}
        <div>
          <p
            style={{
              color: MUTED,
              fontWeight: 800,
              fontSize: '18px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '0 0 14px 0',
            }}
          >
            Eligible Disciplines / Branches:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {branches.map((b) => (
              <span
                key={b}
                style={{
                  padding: '12px 24px',
                  backgroundColor: PANEL,
                  border: `2px solid ${BORDER}`,
                  color: WHITE,
                  borderRadius: '16px',
                  fontSize: '22px',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Selection Process */}
        <div
          style={{
            padding: '22px 28px',
            borderRadius: '18px',
            backgroundColor: 'rgba(15, 21, 32, 0.75)',
            border: `2px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span style={{ fontSize: '32px' }}>🎯</span>
          <div>
            <p
              style={{
                fontSize: '14px',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: MUTED,
                margin: '0 0 3px 0',
              }}
            >
              Selection Stage
            </p>
            <p style={{ color: WHITE, fontSize: '20px', fontWeight: 700, margin: 0 }}>{selectionProcess}</p>
          </div>
        </div>

        {/* Important Dates Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' }}>
          <div
            style={{
              padding: '24px',
              borderRadius: '20px',
              backgroundColor: 'rgba(225, 29, 72, 0.12)',
              border: '2px solid rgba(225, 29, 72, 0.5)',
            }}
          >
            <p
              style={{
                color: '#FB7185',
                fontSize: '14px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: '0 0 6px 0',
              }}
            >
              Last Date to Apply
            </p>
            <p style={{ fontSize: '32px', fontWeight: 900, color: WHITE, margin: 0 }}>{deadline}</p>
          </div>
          <div
            style={{
              padding: '24px',
              borderRadius: '20px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '2px solid rgba(59, 130, 246, 0.5)',
            }}
          >
            <p
              style={{
                color: '#60A5FA',
                fontSize: '14px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: '0 0 6px 0',
              }}
            >
              Exam Date Window
            </p>
            <p style={{ fontSize: '32px', fontWeight: 900, color: WHITE, margin: 0 }}>{examDate}</p>
          </div>
        </div>
      </div>

      {/* ─── 3. BOTTOM CTA & SAVE BAIT ─── */}
      <div
        style={{
          borderTop: `2px solid ${BORDER}`,
          paddingTop: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p style={{ fontSize: '16px', color: MUTED, fontWeight: 700, margin: '0 0 6px 0' }}>
            Previous Year Papers & Branch Syllabus in App
          </p>
          <p style={{ fontSize: '30px', fontWeight: 900, color: GOLD, margin: 0, letterSpacing: '0.5px' }}>
            Aspirant Arcade App • Play Store
          </p>
        </div>

        {/* Animated Screenshot / Save Prompt */}
        <div
          style={{
            transform: `scale(${pulse})`,
            padding: '18px 34px',
            backgroundColor: GOLD,
            color: INK,
            fontWeight: 900,
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 12px 35px rgba(253, 192, 3, 0.4)',
          }}
        >
          <span style={{ fontSize: '28px' }}>📸</span>
          <span style={{ fontSize: '22px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Screenshot Lelo!</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
