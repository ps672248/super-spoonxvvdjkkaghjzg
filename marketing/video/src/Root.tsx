import React from 'react';
import { Composition, Folder } from 'remotion';
import { QuizCard, QUIZ_CARD_DURATION_IN_FRAMES, QUIZ_CARD_FPS, calculateQuizCardMetadata, type QuizCardProps } from './QuizCard';
import { NewsRecap, NEWS_RECAP_DURATION_IN_FRAMES, NEWS_RECAP_FPS, calculateNewsRecapMetadata, type NewsRecapProps } from './NewsRecap';
import { MemeCard, MEME_CARD_DURATION_IN_FRAMES, MEME_CARD_FPS, calculateMemeCardMetadata, type MemeCardProps } from './MemeCard';
import { LongFormEdit, calculateLongFormEditMetadata, VIDEO_FPS } from './LongFormEdit';

// hasBgm/hasTick/hasReveal default to true here (unlike render.ts, which computes
// them from actual file presence — see src/render.ts audioFlags()). Root.tsx runs
// in the browser-bundled Studio/CLI-preview context, so it can't do a Node fs
// check; if you haven't added the files under public/audio/ yet, Studio will
// just show a broken-asset indicator for those <Audio> tags — harmless, ignore
// it until you've added them.
const QUIZ_CARD_DEFAULT_PROPS: QuizCardProps = {
  vertical: 'engineering',
  question: 'In a GATE-level circuit, which theorem simplifies a linear network to a single voltage source and series resistance?',
  options: ["Norton's Theorem", "Thevenin's Theorem", 'Superposition Theorem', "Millman's Theorem"],
  correctIndex: 1,
  explanation: "Thevenin's theorem reduces any linear two-terminal network to one voltage source in series with one resistance.",
  hookLine: 'Only 1% of GATE aspirants get this',
  hasBgm: true,
  hasTick: true,
  hasReveal: true,
  hasOutro: true,
};

const NEWS_RECAP_DEFAULT_PROPS: NewsRecapProps = {
  vertical: 'engineering',
  headline: 'HPCL Executive Trainee 2026 Notification Released',
  hookLine: '500+ PSU jobs just dropped',
  beats: [
    {
      label: 'VACANCIES',
      emoji: '📊',
      text: 'Branch-wise vacancy distribution across key disciplines',
      mediaType: 'table',
      table: {
        headers: ['Discipline', 'UR', 'OBC', 'Total'],
        rows: [
          ['Mechanical', '120', '65', '240'],
          ['Electrical', '90', '48', '180'],
          ['Chemical', '40', '22', '80'],
        ],
      },
      noAudio: false,
    },
    {
      label: 'SALARY',
      emoji: '💰',
      text: 'Executive Trainee Pay Scale ₹50,000 to ₹1,60,000',
      mediaType: 'stat_callout',
      stat: {
        value: '₹1,40,000/mo',
        subtext: 'Estimated Starting CTC + Perks',
        emoji: '💰',
      },
      noAudio: false,
    },
    {
      label: 'ELIGIBILITY',
      emoji: '🎯',
      text: 'BE/BTech With 60% Marks & Valid GATE 2026 Score',
      mediaType: 'checklist',
      checklist: {
        items: [
          'Full-time 4-year Engineering Degree',
          'Minimum 60% Aggregate Marks (50% SC/ST)',
          'Valid GATE 2026 Scorecard in matching paper',
        ],
      },
      noAudio: false,
    },
    {
      label: 'REACTION',
      emoji: '🔥',
      text: 'Competition will be fierce — start your preparation now!',
      mediaType: 'gif',
      mediaUrl: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
      noAudio: false,
    },
    {
      label: 'DEADLINE',
      emoji: '⏳',
      text: 'Online Applications Close on 15 March 2026',
      mediaType: 'quote',
      quote: {
        text: 'Do not wait for the last day to avoid portal server rush.',
        author: 'Official Notification',
      },
      noAudio: false,
    },
  ],
  hasBgm: true,
  hasOutro: true,
};

const NEWS_RECAP_LANDSCAPE_DEFAULT_PROPS: NewsRecapProps = {
  vertical: 'engineering',
  headline: 'HPCL Executive Trainee 2026 Notification Released',
  hookLine: '500+ PSU jobs just dropped — check eligibility now',
  beats: [
    {
      label: 'VACANCIES',
      emoji: '📊',
      text: '500+ Executive Trainee vacancies announced across Mechanical, Electrical, and Chemical engineering.',
      mediaType: 'table',
      table: {
        headers: ['Discipline', 'UR', 'OBC', 'Total'],
        rows: [
          ['Mechanical', '120', '65', '240'],
          ['Electrical', '90', '48', '180'],
          ['Chemical', '40', '22', '80'],
        ],
      },
      noAudio: false,
    },
    {
      label: 'PAY SCALE',
      emoji: '💰',
      text: 'Selected candidates receive a monthly CTC of approximately 1.4 Lakhs plus full PSU perks.',
      mediaType: 'stat_callout',
      stat: {
        value: '₹1,40,000/mo',
        subtext: 'Estimated Starting CTC + Perks',
        emoji: '💰',
      },
      noAudio: false,
    },
    {
      label: 'ELIGIBILITY',
      emoji: '🎯',
      text: 'Candidates require a full-time 4-year engineering degree with 60% marks and a valid GATE scorecard.',
      mediaType: 'checklist',
      checklist: {
        items: [
          'Full-time 4-year Engineering Degree',
          'Minimum 60% aggregate (50% for SC/ST)',
          'Valid GATE 2026 Registration in matching paper',
        ],
      },
      noAudio: false,
    },
    {
      label: 'SELECTION',
      emoji: '⚔️',
      text: 'Selection consists of GATE score shortlisting followed by Computer Based Test and Personal Interview.',
      mediaType: 'comparison',
      comparison: {
        leftTitle: 'Stage 1: CBT & Shortlist',
        leftItems: ['85% weightage on GATE score', 'Domain knowledge test', 'General aptitude evaluation'],
        rightTitle: 'Stage 2: GD & PI',
        rightItems: ['15% weightage on interview', 'Group task evaluation', 'Document verification'],
      },
      noAudio: false,
    },
    {
      label: 'EXAM PATTERN',
      emoji: '📝',
      text: 'The computer test features 150 questions split between technical core concepts and general aptitude.',
      mediaType: 'table',
      table: {
        headers: ['Section', 'Questions', 'Marks', 'Duration'],
        rows: [
          ['Technical Core', '100', '100', '120 Min'],
          ['General Aptitude', '50', '50', 'Included'],
        ],
      },
      noAudio: false,
    },
    {
      label: 'EXPERT TIP',
      emoji: '💡',
      text: 'Focus on high-weightage numerical questions and previous year GATE papers to secure top ranks.',
      mediaType: 'quote',
      quote: {
        text: 'Consistent mock practice and concept clarity in core subjects is the key to clearing PSU cutoffs.',
        author: 'Aspirant Arcade Faculty',
      },
      noAudio: false,
    },
    {
      label: 'DEADLINE',
      emoji: '🚨',
      text: 'Online application window closes on 15 March 2026. Submit early to avoid portal server rush.',
      mediaType: 'gif',
      gif: {
        stickerPreset: 'alert',
      },
      noAudio: false,
    },
  ],
  hasBgm: true,
  hasOutro: true,
};

const MEME_CARD_DEFAULT_PROPS: MemeCardProps = {
  vertical: 'govt',
  imageFile: 'memes/generated/latest.png',
  examLabel: 'SSC CGL',
  topicLabel: 'Quantitative Aptitude',
  conceptWords: 20,
  hasBgm: true,
  hasOutro: true,
};

import { ThumbnailCard, type ThumbnailCardProps } from './ThumbnailCard';

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Social">
      <Composition
        id="QuizCard"
        component={QuizCard}
        durationInFrames={QUIZ_CARD_DURATION_IN_FRAMES} // placeholder — calculateMetadata below sizes it per-render
        fps={QUIZ_CARD_FPS}
        width={1080}
        height={1920}
        defaultProps={QUIZ_CARD_DEFAULT_PROPS}
        calculateMetadata={calculateQuizCardMetadata}
      />
      <Composition
        id="NewsRecap"
        component={NewsRecap}
        durationInFrames={NEWS_RECAP_DURATION_IN_FRAMES} // placeholder — calculateMetadata below sizes it per-render
        fps={NEWS_RECAP_FPS}
        width={1080}
        height={1920}
        defaultProps={{ ...NEWS_RECAP_DEFAULT_PROPS, format: 'reel' }}
        calculateMetadata={calculateNewsRecapMetadata}
      />
      <Composition
        id="NewsRecapLandscape"
        component={NewsRecap}
        durationInFrames={NEWS_RECAP_DURATION_IN_FRAMES}
        fps={NEWS_RECAP_FPS}
        width={1920}
        height={1080}
        defaultProps={{ ...NEWS_RECAP_LANDSCAPE_DEFAULT_PROPS, format: 'landscape' }}
        calculateMetadata={calculateNewsRecapMetadata}
      />
      <Composition
        id="NewsThumbnailLandscape"
        component={ThumbnailCard}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ ...NEWS_RECAP_LANDSCAPE_DEFAULT_PROPS, format: 'landscape' }}
      />
      <Composition
        id="NewsThumbnailReel"
        component={ThumbnailCard}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ ...NEWS_RECAP_DEFAULT_PROPS, format: 'reel' }}
      />
      <Composition
        id="MemeCard"
        component={MemeCard}
        durationInFrames={MEME_CARD_DURATION_IN_FRAMES} // placeholder — calculateMetadata below sizes it per-render
        fps={MEME_CARD_FPS}
        width={1080}
        height={1920}
        defaultProps={MEME_CARD_DEFAULT_PROPS}
        calculateMetadata={calculateMemeCardMetadata}
      />
      <Composition
        id="LongFormEdit"
        component={LongFormEdit}
        durationInFrames={1}
        fps={VIDEO_FPS}
        width={1280}
        height={720}
        defaultProps={{}}
        calculateMetadata={calculateLongFormEditMetadata}
      />
    </Folder>
  );
};
