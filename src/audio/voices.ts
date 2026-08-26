/**
 * Pure, unit-testable voice specifications for the procedural sound family.
 *
 * The synth (`synth.ts`) renders these specs with the Web Audio API; this
 * module itself never touches an AudioContext, so every value here is
 * verifiable in Node tests.
 */

export type Waveform = "sine" | "triangle" | "square" | "sawtooth";

/** A single oscillator layer: a pitch sweep with its own envelope. */
export interface TonalLayer {
  wave: Waveform;
  /** Pitch at note onset, in Hertz. */
  startFreq: number;
  /** Pitch at note end, in Hertz. */
  endFreq: number;
  /** Total note length, in seconds. */
  duration: number;
  /** Envelope peak gain before the master gain (0..1). */
  peak: number;
  /** Envelope attack time, in seconds (>= 8ms so nothing startles). */
  attack: number;
}

/** A filtered-noise layer (the shared noise buffer + a biquad filter). */
export interface NoiseLayer {
  /** 0..1 blend of the noise layer into the event. */
  mix: number;
  filter: "lowpass" | "bandpass" | "highpass";
  /** Filter cutoff/center frequency, in Hertz. */
  frequency: number;
  duration: number;
  peak: number;
  attack: number;
}

/** One note of the goal arpeggio. */
export interface GoalNote {
  /** Semitone offset from the root (major-pentatonic subset). */
  semitones: number;
  duration: number;
}

export interface Arpeggio {
  rootFreq: number;
  /** Ascending notes; offsets come from the major pentatonic set. */
  notes: GoalNote[];
  /** Envelope peak gain for every arpeggio note (0..1). */
  peak: number;
}

export interface VoiceSpec {
  /** One or two oscillator layers (the second adds warmth/body). */
  tonal: TonalLayer[];
  /** Optional filtered-noise layer (drop + landing only). */
  noise?: NoiseLayer;
  /** Optional rising arpeggio (goal only); overrides tonal rendering. */
  arpeggio?: Arpeggio;
  /** Fractional pitch-variation band applied per play (0.05 = ±5%). */
  pitchVariation: number;
}

/** Master gain applied to every event; kept here so tests share the truth. */
export const MASTER_GAIN = 0.6;

/**
 * Applies the per-event pitch variation band to a frequency.
 * `random` is expected in [-1, 1]; 0 yields the base frequency.
 */
export function detuneFrequency(freq: number, variation: number, random: number): number {
  return freq * (1 + variation * random);
}

/** The five-event sound family — loudness-balanced so all post-master peaks sit inside ±3 dB. */
export const VOICES: Record<string, VoiceSpec> = {
  snap: {
    tonal: [
      { wave: "triangle", startFreq: 520, endFreq: 780, duration: 0.08, peak: 0.19, attack: 0.008 },
      {
        wave: "triangle",
        startFreq: 1040,
        endFreq: 1170,
        duration: 0.08,
        peak: 0.095,
        attack: 0.008,
      },
    ],
    pitchVariation: 0.05,
  },
  delete: {
    tonal: [
      { wave: "sine", startFreq: 300, endFreq: 180, duration: 0.13, peak: 0.19, attack: 0.012 },
      { wave: "sine", startFreq: 600, endFreq: 360, duration: 0.13, peak: 0.095, attack: 0.012 },
    ],
    pitchVariation: 0.05,
  },
  drop: {
    tonal: [
      { wave: "sine", startFreq: 700, endFreq: 350, duration: 0.07, peak: 0.2, attack: 0.008 },
    ],
    noise: {
      mix: 0.5,
      filter: "bandpass",
      frequency: 1800,
      duration: 0.07,
      peak: 0.12,
      attack: 0.008,
    },
    pitchVariation: 0.05,
  },
  landing: {
    tonal: [{ wave: "sine", startFreq: 150, endFreq: 75, duration: 0.1, peak: 0.22, attack: 0.01 }],
    noise: {
      mix: 0.6,
      filter: "lowpass",
      frequency: 400,
      duration: 0.1,
      peak: 0.14,
      attack: 0.01,
    },
    pitchVariation: 0.05,
  },
  goal: {
    tonal: [],
    arpeggio: {
      rootFreq: 523.25,
      notes: [
        { semitones: 0, duration: 0.09 },
        { semitones: 4, duration: 0.09 },
        { semitones: 7, duration: 0.09 },
      ],
      peak: 0.26,
    },
    pitchVariation: 0.05,
  },
};
