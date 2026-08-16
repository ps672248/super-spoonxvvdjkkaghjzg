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
    { label: 'VACANCIES', text: '500+ posts across Mechanical, Electrical, Chemical' },
    { label: 'DEADLINE', text: 'Apply before 15 March 2026' },
  ],
  hasBgm: true,
  hasOutro: true,
};

// latest.png is written by `npm run meme:test`, so Studio shows a real generated
// meme once you've run that at least once. Before then it's a broken-asset box,
// same as the audio files above.
const MEME_CARD_DEFAULT_PROPS: MemeCardProps = {
  vertical: 'govt',
  imageFile: 'memes/generated/latest.png',
  examLabel: 'SSC CGL',
  topicLabel: 'Quantitative Aptitude',
  conceptWords: 20,
  hasBgm: true,
  hasOutro: true,
};

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
        defaultProps={NEWS_RECAP_DEFAULT_PROPS}
        calculateMetadata={calculateNewsRecapMetadata}
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
