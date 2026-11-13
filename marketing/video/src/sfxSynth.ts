/**
 * Pure-code procedural WAV sound-effect synthesizer.
 * Generates clean 16-bit PCM .wav SFX assets into public/audio/sfx/ so
 * Remotion renders get punchy hook booms, card whooshes, pops, and dings
 * with zero external audio dependencies or network fetches.
 */
import path from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const SAMPLE_RATE = 44100;
export const SFX_SUBDIR = 'audio/sfx';

function writeWavMono16(filePath: string, samples: Float32Array): void {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // PCM format
  buf.writeUInt16LE(1, 22); // Mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, Math.tanh(samples[i])));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  writeFileSync(filePath, buf);
}

/** Cinematic sub-bass drop + soft click transient for the 0.0s hook. */
function synthHookBoom(): Float32Array {
  const duration = 0.65;
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);
  let phase = 0;

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.008);
    const decay = Math.exp(-t * 5.2);
    const freq = 36 + 96 * Math.exp(-t * 14);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    const sub = Math.sin(phase) * 0.85;
    const harmonic = Math.sin(phase * 2) * 0.18 * Math.exp(-t * 12);
    const click = t < 0.015 ? Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 180) * 0.3 : 0;
    out[i] = (sub + harmonic + click) * attack * decay;
  }
  return out;
}

/** Smooth airy bandpass-swept noise whoosh for card/beat transitions. */
function synthWhoosh(): Float32Array {
  const duration = 0.34;
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);

  // Deterministic PRNG so CI builds are reproducible
  let seed = 1337;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  };

  let lp1 = 0;
  let lp2 = 0;
  let hp = 0;
  let prev = 0;

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const norm = t / duration;
    // Smooth bell envelope peaking around 38%
    const env = Math.sin(Math.PI * Math.pow(norm, 0.85)) * Math.exp(-norm * 1.1);
    const white = nextRand();

    // Sweeping low-pass cutoff (gives the "air passing by" pitch sweep)
    const sweepFreq = 350 + 2400 * Math.sin(Math.PI * norm);
    const alpha = Math.min(0.95, (2 * Math.PI * sweepFreq) / (SAMPLE_RATE + 2 * Math.PI * sweepFreq));
    lp1 += alpha * (white - lp1);
    lp2 += alpha * (lp1 - lp2);

    // Light high-pass to clear muddy sub rumble
    hp = 0.96 * (hp + lp2 - prev);
    prev = lp2;

    out[i] = hp * env * 1.4;
  }
  return out;
}

/** Warm harmonic bell chime for stat callouts, tables, and key reveals. */
function synthDing(): Float32Array {
  const duration = 0.62;
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.006);
    const f1 = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 5.8) * 0.55;
    const f2 = Math.sin(2 * Math.PI * 1318.5 * t) * Math.exp(-t * 7.5) * 0.32;
    const f3 = Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-t * 10.5) * 0.16;
    out[i] = (f1 + f2 + f3) * attack;
  }
  return out;
}

/** Snappy tactile UI pop for checklist items, badges, and micro-reveals. */
function synthPop(): Float32Array {
  const duration = 0.095;
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);
  let phase = 0;

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.004);
    const decay = Math.exp(-t * 36);
    const freq = 320 + 520 * Math.min(1, t / 0.045);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    out[i] = Math.sin(phase) * attack * decay * 0.72;
  }
  return out;
}

/** Dual-pulse smartphone vibration buzz for doomscrolling / notification hooks. */
function synthPhoneBuzz(): Float32Array {
  const duration = 0.42;
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const pulse1 = t >= 0.02 && t <= 0.14 ? Math.sin(Math.PI * ((t - 0.02) / 0.12)) : 0;
    const pulse2 = t >= 0.20 && t <= 0.36 ? Math.sin(Math.PI * ((t - 0.20) / 0.16)) : 0;
    const env = Math.max(pulse1, pulse2);
    const carrier = Math.sin(2 * Math.PI * 145 * t) * 0.65 + Math.sin(2 * Math.PI * 290 * t) * 0.25;
    out[i] = carrier * env * 0.65;
  }
  return out;
}

/** Crisp digital double-chirp for Focus Guard / app intervention moments. */
function synthAlertBlip(): Float32Array {
  const duration = 0.26;
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const tone1 = t < 0.11 ? Math.sin(2 * Math.PI * 740 * t) * Math.exp(-t * 24) : 0;
    const tone2 = t >= 0.11 ? Math.sin(2 * Math.PI * 1080 * (t - 0.11)) * Math.exp(-(t - 0.11) * 20) : 0;
    out[i] = (tone1 + tone2) * 0.6;
  }
  return out;
}

/** Ensures all procedural WAV SFX exist inside public/audio/sfx/. Safe & idempotent. */
export function ensureProceduralSfx(publicDir: string = path.join(process.cwd(), 'public')): {
  hasHookBoom: boolean;
  hasWhoosh: boolean;
  hasDing: boolean;
  hasPop: boolean;
  hasPhoneBuzz: boolean;
  hasAlertBlip: boolean;
} {
  const sfxDir = path.join(publicDir, SFX_SUBDIR);
  mkdirSync(sfxDir, { recursive: true });

  const specs: Array<{ filename: string; synth: () => Float32Array }> = [
    { filename: 'hook-boom.wav', synth: synthHookBoom },
    { filename: 'whoosh.wav', synth: synthWhoosh },
    { filename: 'ding.wav', synth: synthDing },
    { filename: 'pop.wav', synth: synthPop },
    { filename: 'phone-buzz.wav', synth: synthPhoneBuzz },
    { filename: 'alert-blip.wav', synth: synthAlertBlip },
  ];

  for (const spec of specs) {
    const target = path.join(sfxDir, spec.filename);
    if (!existsSync(target)) {
      writeWavMono16(target, spec.synth());
    }
  }

  return {
    hasHookBoom: existsSync(path.join(sfxDir, 'hook-boom.wav')),
    hasWhoosh: existsSync(path.join(sfxDir, 'whoosh.wav')),
    hasDing: existsSync(path.join(sfxDir, 'ding.wav')),
    hasPop: existsSync(path.join(sfxDir, 'pop.wav')),
    hasPhoneBuzz: existsSync(path.join(sfxDir, 'phone-buzz.wav')),
    hasAlertBlip: existsSync(path.join(sfxDir, 'alert-blip.wav')),
  };
}
