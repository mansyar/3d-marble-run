import { describe, expect, it } from "vitest";
import { detuneFrequency, type GoalNote, MASTER_GAIN, VOICES } from "../src/audio/voices";

const EVENT_IDS = ["snap", "delete", "drop", "landing", "goal"] as const;
const PENTATONIC_OFFSETS = new Set([0, 2, 4, 7, 9]);
const FILTERS = ["lowpass", "bandpass", "highpass"] as const;

describe("voice spec module", () => {
  it("defines exactly the five sound events", () => {
    expect(Object.keys(VOICES).sort()).toEqual([...EVENT_IDS].sort());
  });

  it("has sane tonal layers for every event that uses them", () => {
    for (const id of EVENT_IDS) {
      const spec = VOICES[id];
      if (spec.arpeggio) {
        expect(spec.tonal).toHaveLength(0);
        continue;
      }
      expect(spec.tonal.length).toBeGreaterThanOrEqual(1);
      expect(spec.tonal.length).toBeLessThanOrEqual(2);
      for (const layer of spec.tonal) {
        expect(layer.startFreq).toBeGreaterThan(0);
        expect(layer.endFreq).toBeGreaterThan(0);
        expect(layer.startFreq).toBeGreaterThanOrEqual(40);
        expect(layer.startFreq).toBeLessThanOrEqual(8000);
        expect(layer.endFreq).toBeGreaterThanOrEqual(40);
        expect(layer.endFreq).toBeLessThanOrEqual(8000);
        expect(layer.duration).toBeGreaterThanOrEqual(0.02);
        expect(layer.duration).toBeLessThanOrEqual(0.5);
        expect(layer.peak).toBeGreaterThan(0);
        expect(layer.peak).toBeLessThanOrEqual(0.35);
        expect(layer.attack).toBeGreaterThanOrEqual(0.008);
      }
    }
  });

  it("adds a noise layer only to drop and landing", () => {
    for (const id of EVENT_IDS) {
      const spec = VOICES[id];
      if (id === "drop" || id === "landing") {
        expect(spec.noise).toBeDefined();
        if (!spec.noise) throw new Error(`noise missing for ${id}`);
        const noise = spec.noise;
        expect(noise.mix).toBeGreaterThan(0);
        expect(noise.mix).toBeLessThanOrEqual(1);
        expect(FILTERS).toContain(noise.filter);
        expect(noise.frequency).toBeGreaterThanOrEqual(100);
        expect(noise.frequency).toBeLessThanOrEqual(8000);
        expect(noise.duration).toBeGreaterThanOrEqual(0.02);
        expect(noise.duration).toBeLessThanOrEqual(0.3);
        expect(noise.peak).toBeGreaterThan(0);
        expect(noise.peak).toBeLessThanOrEqual(0.35);
        expect(noise.attack).toBeGreaterThanOrEqual(0.008);
      } else {
        expect(spec.noise).toBeUndefined();
      }
    }
  });

  it("gives goal a rising pentatonic three-note arpeggio under 400ms", () => {
    const goal = VOICES.goal;
    expect(goal.arpeggio).toBeDefined();
    if (!goal.arpeggio) throw new Error("goal arpeggio missing");
    const arpeggio = goal.arpeggio;
    const notes: GoalNote[] = arpeggio.notes;
    expect(notes.length).toBeGreaterThanOrEqual(3);
    let total = 0;
    let previous = -Infinity;
    for (const note of notes) {
      expect(PENTATONIC_OFFSETS.has(note.semitones)).toBe(true);
      expect(note.semitones).toBeGreaterThan(previous);
      previous = note.semitones;
      expect(note.duration).toBeGreaterThanOrEqual(0.06);
      expect(note.duration).toBeLessThanOrEqual(0.15);
      total += note.duration;
    }
    expect(total).toBeLessThanOrEqual(0.4);
    expect(arpeggio.rootFreq).toBeGreaterThanOrEqual(200);
    expect(arpeggio.rootFreq).toBeLessThanOrEqual(1000);
    expect(arpeggio.peak).toBeGreaterThan(0);
    expect(arpeggio.peak).toBeLessThanOrEqual(0.5);
  });

  it("keeps pitch variation within the documented ±5% band", () => {
    for (const id of EVENT_IDS) {
      expect(VOICES[id].pitchVariation).toBeGreaterThan(0);
      expect(VOICES[id].pitchVariation).toBeLessThanOrEqual(0.05);
    }
  });
});

describe("detuneFrequency", () => {
  const freq = 440;
  const variation = 0.05;

  it("returns the base frequency when the random value is 0", () => {
    expect(detuneFrequency(freq, variation, 0)).toBe(freq);
  });

  it("applies the full variation at the band extremes", () => {
    expect(detuneFrequency(freq, variation, 1)).toBeCloseTo(freq * 1.05, 10);
    expect(detuneFrequency(freq, variation, -1)).toBeCloseTo(freq * 0.95, 10);
  });

  it("stays within the band for any random value in [-1, 1]", () => {
    for (const random of [-1, -0.5, -0.001, 0.25, 0.999]) {
      const result = detuneFrequency(freq, variation, random);
      expect(result).toBeGreaterThanOrEqual(freq * 0.95);
      expect(result).toBeLessThanOrEqual(freq * 1.05);
    }
  });

  it("is deterministic for a fixed random value", () => {
    expect(detuneFrequency(220, 0.03, 0.42)).toBe(detuneFrequency(220, 0.03, 0.42));
    expect(detuneFrequency(220, 0.03, 0.42)).toBe(detuneFrequency(220, 0.03, 0.42));
  });

  it("is monotonic in the random value", () => {
    const values = [-1, -0.5, 0, 0.5, 1].map((r) => detuneFrequency(freq, variation, r));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it("is degenerate when the variation is zero", () => {
    expect(detuneFrequency(freq, 0, 0.7)).toBe(freq);
  });
});

describe("loudness normalization", () => {
  function effectivePeakPre(eventId: (typeof EVENT_IDS)[number]): number {
    const spec = VOICES[eventId];
    if (spec.arpeggio) return spec.arpeggio.peak;
    const tonalPeak = Math.max(...spec.tonal.map((t) => t.peak));
    const noisePeak = spec.noise ? spec.noise.peak * spec.noise.mix : 0;
    return Math.max(tonalPeak, noisePeak);
  }

  function effectivePeakPost(eventId: (typeof EVENT_IDS)[number]): number {
    return effectivePeakPre(eventId) * MASTER_GAIN;
  }

  it("caps absolute post-master peak at kid-safe ceiling (≤0.25, goal ≤0.3)", () => {
    for (const id of EVENT_IDS) {
      const post = effectivePeakPost(id);
      if (id === "goal") {
        expect(post).toBeLessThanOrEqual(0.3);
      } else {
        expect(post).toBeLessThanOrEqual(0.25);
      }
    }
  });

  it("keeps peak spread within ±3 dB across all events (max/min ≤ 1.41)", () => {
    const peaks = EVENT_IDS.map((id) => effectivePeakPost(id));
    const max = Math.max(...peaks);
    const min = Math.min(...peaks);
    expect(max / min).toBeLessThanOrEqual(1.41);
  });

  it("keeps build sounds quieter than goal", () => {
    const snapPost = effectivePeakPost("snap");
    const deletePost = effectivePeakPost("delete");
    const goalPost = effectivePeakPost("goal");
    expect(snapPost).toBeLessThan(goalPost);
    expect(deletePost).toBeLessThan(goalPost);
  });
});
