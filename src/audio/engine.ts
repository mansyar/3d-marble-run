/** The set of one-shot sounds the engine can play. */
export type SoundEvent = "snap" | "delete" | "drop" | "landing" | "goal";

/** Minimum delay between two plays of the same event, per event type. */
export const SOUND_COOLDOWN_MS: Record<SoundEvent, number> = {
  snap: 60,
  delete: 60,
  drop: 150,
  landing: 100,
  goal: 100,
};

/** Low-level sound output consumed by the engine. WebAudio in production. */
export interface SoundPlayer {
  /** Schedule one voice for the given event. */
  play(event: SoundEvent): void;
  /** Immediately silence any scheduled notes. */
  stop(): void;
}

export interface AudioEngine {
  /** Enable playback after the first user gesture (idempotent). */
  unlock(): void;
  /** Play an event when unlocked, unmuted, and past its cooldown. */
  play(event: SoundEvent): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  isUnlocked(): boolean;
}

export interface AudioEngineOptions {
  /** Clock used for cooldown decisions. Defaults to `performance.now()`. */
  now?: () => number;
}

/**
 * Scheduling half of the audio system: decides *whether* a sound may play
 * (autoplay gate, mute, per-event cooldowns). The actual sound output lives
 * in the injected `SoundPlayer`, so all rules are unit-testable.
 */
export function createAudioEngine(
  player: SoundPlayer,
  options: AudioEngineOptions = {},
): AudioEngine {
  let unlocked = false;
  let muted = false;
  const now = options.now ?? (() => performance.now());
  const lastPlayedAt = new Map<SoundEvent, number>();

  return {
    unlock() {
      unlocked = true;
    },
    play(event) {
      if (!unlocked || muted) return;
      const last = lastPlayedAt.get(event) ?? Number.NEGATIVE_INFINITY;
      if (now() - last < SOUND_COOLDOWN_MS[event]) return;
      lastPlayedAt.set(event, now());
      player.play(event);
    },
    setMuted(next) {
      if (next === muted) return;
      muted = next;
      if (muted) player.stop();
    },
    isMuted() {
      return muted;
    },
    isUnlocked() {
      return unlocked;
    },
  };
}
