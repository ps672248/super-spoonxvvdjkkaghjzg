// Audio is optional — these files don't ship in the repo (pick your own
// royalty-free tracks, see marketing/video/README.md). Every <Audio> usage in
// the compositions is gated behind a `has*` boolean prop that render.ts sets
// by checking whether the file actually exists in public/, so a render never
// breaks just because audio hasn't been added yet.
export const BGM_FILE = 'audio/bgm.mp3'; // NewsRecap background bed
export const BGM_MOTIVATION_FILE = 'audio/bgm_motivation.mp3';
export const BGM_CORPORATE_FILE = 'audio/bgm_corporate.mp3';
export const QUIZ_BGM_FILE = 'audio/quiz.mp3'; // QuizCard background bed (separate track)
export const TICK_FILE = 'audio/tick.mp3'; // plays once across the full 3s countdown beat — not one-shot per second
export const REVEAL_FILE = 'audio/reveal.mp3';
export const OUTRO_FILE = 'audio/outro.mp3'; // plays once at the start of the CTA outro — shared by QuizCard and NewsRecap
export const WHOOSH_FILE = 'audio/whoosh.mp3'; // Card transition sound
export const DING_FILE = 'audio/ding.mp3';     // Metric / Stat reveal
export const POP_FILE = 'audio/pop.mp3';       // Sticker / Badge reveal
