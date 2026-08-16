// Audio is optional — these files don't ship in the repo (pick your own
// royalty-free tracks, see marketing/video/README.md). Every <Audio> usage in
// the compositions is gated behind a `has*` boolean prop that render.ts sets
// by checking whether the file actually exists in public/, so a render never
// breaks just because audio hasn't been added yet.
export const BGM_FILE = 'audio/bgm.mp3'; // NewsRecap background bed
export const QUIZ_BGM_FILE = 'audio/quiz.mp3'; // QuizCard background bed (separate track)
export const TICK_FILE = 'audio/tick.mp3'; // plays once across the full 3s countdown beat — not one-shot per second
export const REVEAL_FILE = 'audio/reveal.mp3';
export const OUTRO_FILE = 'audio/outro.mp3'; // plays once at the start of the CTA outro — shared by QuizCard and NewsRecap
