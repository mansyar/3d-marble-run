import type { SoundEvent, SoundPlayer } from "./engine";

interface VoiceSpec {
  wave: OscillatorType;
  startFreq: number;
  endFreq: number;
  duration: number;
  peakGain: number;
}

/** Short, quiet, distinct one-shots. No loops, no external samples. */
const VOICES: Record<SoundEvent, VoiceSpec> = {
  snap: { wave: "triangle", startFreq: 600, endFreq: 1100, duration: 0.08, peakGain: 0.22 },
  delete: { wave: "sine", startFreq: 240, endFreq: 130, duration: 0.12, peakGain: 0.18 },
  drop: { wave: "sine", startFreq: 880, endFreq: 430, duration: 0.09, peakGain: 0.18 },
  landing: { wave: "sine", startFreq: 170, endFreq: 85, duration: 0.1, peakGain: 0.22 },
  goal: { wave: "triangle", startFreq: 520, endFreq: 1040, duration: 0.18, peakGain: 0.24 },
};

const MASTER_GAIN = 0.6;

/**
 * WebAudio half of the audio system: synthesizes the one-shots and owns the
 * `AudioContext`, which is created lazily on the first play (browsers require
 * a user gesture before audio can start). Browser-only; verified manually.
 */
export function createWebAudioSynth(): SoundPlayer {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  const active: OscillatorNode[] = [];

  function ensureContext(): AudioContext | null {
    if (typeof AudioContext === "undefined") return null;
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(context.destination);
    }
    if (context.state === "suspended") void context.resume();
    return context;
  }

  function scheduleVoice(event: SoundEvent): void {
    const ctx = ensureContext();
    if (!ctx || !master) return;
    const spec = VOICES[event];
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = spec.wave;
    osc.frequency.setValueAtTime(spec.startFreq, start);
    osc.frequency.exponentialRampToValueAtTime(spec.endFreq, start + spec.duration);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(spec.peakGain, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + spec.duration + 0.02);
    active.push(osc);
    osc.addEventListener("ended", () => {
      const index = active.indexOf(osc);
      if (index >= 0) active.splice(index, 1);
    });
  }

  return {
    play(event) {
      scheduleVoice(event);
    },
    stop() {
      for (const source of active.splice(0)) {
        try {
          source.stop();
        } catch {
          // Already stopped by its natural end.
        }
      }
    },
  };
}
