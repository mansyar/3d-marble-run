/** Storage key for the persisted sound-muted preference. */
export const SOUND_MUTED_STORAGE_KEY = "marblescape.sound-muted";

export interface SoundStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SoundPreferences {
  isMuted(): boolean;
  setMuted(muted: boolean): void;
}

function getBrowserStorage(): SoundStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readMuted(storage: SoundStorage | null): boolean {
  if (!storage) return false;

  try {
    return storage.getItem(SOUND_MUTED_STORAGE_KEY) === "true";
  } catch {
    // A broken storage backend must never break playback.
    return false;
  }
}

function writeMuted(storage: SoundStorage | null, muted: boolean): void {
  if (!storage) return;

  try {
    storage.setItem(SOUND_MUTED_STORAGE_KEY, String(muted));
  } catch {
    // Sound is an enhancement; persistence is best-effort.
  }
}

/** Persisted mute preference, mirroring the coach-mark state pattern. */
export function createSoundPreferences(
  storage: SoundStorage | null = getBrowserStorage(),
): SoundPreferences {
  let muted = readMuted(storage);

  return {
    isMuted() {
      return muted;
    },
    setMuted(next) {
      if (next === muted) return;
      muted = next;
      writeMuted(storage, muted);
    },
  };
}
