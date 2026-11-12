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
export const WHOOSH_FILE = 'audio/sfx/whoosh.wav'; // Card transition sound (procedural WAV)
export const DING_FILE = 'audio/sfx/ding.wav';     // Metric / Stat reveal (procedural WAV)
export const POP_FILE = 'audio/sfx/pop.wav';       // Sticker / Badge reveal (procedural WAV)
export const HOOK_BOOM_FILE = 'audio/sfx/hook-boom.wav'; // 0.0s hook bass impact (procedural WAV)
export const PHONE_BUZZ_FILE = 'audio/sfx/phone-buzz.wav'; // Smartphone vibration buzz (procedural WAV)
export const ALERT_BLIP_FILE = 'audio/sfx/alert-blip.wav'; // Focus Guard / feature pop chirp (procedural WAV)
