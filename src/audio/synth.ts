import type { SoundEvent, SoundPlayer } from "./engine";
import { detuneFrequency, MASTER_GAIN, VOICES, type VoiceSpec } from "./voices";

type ActiveNode = OscillatorNode | AudioBufferSourceNode;

/**
 * WebAudio half of the audio system: renders the pure voice specs from
 * `voices.ts` and owns the `AudioContext`, which is created lazily on the
 * first play (browsers require a user gesture before audio can start).
 * Browser-only; verified manually.
 */
export function createWebAudioSynth(): SoundPlayer {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  const active: ActiveNode[] = [];

  function ensureContext(): AudioContext | null {
    if (typeof AudioContext === "undefined") return null;
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(context.destination);
      noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    if (context.state === "suspended") void context.resume();
    return context;
  }

  function track(node: ActiveNode, stopAt: number): void {
    node.start(stopAt - 0.02);
    node.stop(stopAt);
    active.push(node);
    node.addEventListener("ended", () => {
      const index = active.indexOf(node);
      if (index >= 0) active.splice(index, 1);
    });
  }

  function scheduleTonal(
    ctx: AudioContext,
    layer: VoiceSpec["tonal"][number],
    at: number,
    variation: number,
    random: number,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = layer.wave;
    const startFreq = detuneFrequency(layer.startFreq, variation, random);
    const endFreq = detuneFrequency(layer.endFreq, variation, random);
    osc.frequency.setValueAtTime(startFreq, at);
    osc.frequency.exponentialRampToValueAtTime(endFreq, at + layer.duration);

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(layer.peak, at + layer.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + layer.duration);

    osc.connect(gain);
    gain.connect(master as GainNode);
    track(osc, at + layer.duration + 0.02);
  }

  function scheduleNoise(
    ctx: AudioContext,
    layer: NonNullable<VoiceSpec["noise"]>,
    at: number,
    variation: number,
    random: number,
  ): void {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer as AudioBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = layer.filter;
    filter.frequency.value = detuneFrequency(layer.frequency, variation, random);
    const gain = ctx.createGain();

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(layer.peak * layer.mix, at + layer.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + layer.duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master as GainNode);
    track(source, at + layer.duration + 0.02);
  }

  function scheduleArpeggio(
    ctx: AudioContext,
    arpeggio: NonNullable<VoiceSpec["arpeggio"]>,
    at: number,
    variation: number,
    random: number,
  ): void {
    let cursor = at;
    const root = detuneFrequency(arpeggio.rootFreq, variation, random);
    for (const note of arpeggio.notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(root * 2 ** (note.semitones / 12), cursor);
      gain.gain.setValueAtTime(0.0001, cursor);
      gain.gain.exponentialRampToValueAtTime(arpeggio.peak, cursor + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, cursor + note.duration);
      osc.connect(gain);
      gain.connect(master as GainNode);
      track(osc, cursor + note.duration + 0.02);
      cursor += note.duration;
    }
  }

  function scheduleVoice(event: SoundEvent): void {
    const ctx = ensureContext();
    if (!ctx || !master) return;
    const spec = VOICES[event];
    // Uniform random in [-1, 1] for the per-play pitch band.
    const random = Math.random() * 2 - 1;
    const variation = spec.pitchVariation;
    const start = ctx.currentTime;
    if (spec.arpeggio) {
      scheduleArpeggio(ctx, spec.arpeggio, start, variation, random);
      return;
    }
    for (const layer of spec.tonal) {
      scheduleTonal(ctx, layer, start, variation, random);
    }
    if (spec.noise) {
      scheduleNoise(ctx, spec.noise, start, variation, random);
    }
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
