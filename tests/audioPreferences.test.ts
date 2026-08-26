import { describe, expect, it } from "vitest";
import {
  createSoundPreferences,
  SOUND_MUTED_STORAGE_KEY,
  type SoundStorage,
} from "../src/audio/preferences";

class MemoryStorage implements SoundStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("sound preferences", () => {
  it("defaults to unmuted when nothing is stored", () => {
    const preferences = createSoundPreferences(new MemoryStorage());

    expect(preferences.isMuted()).toBe(false);
  });

  it("round-trips the muted flag through storage", () => {
    const storage = new MemoryStorage();
    const first = createSoundPreferences(storage);

    first.setMuted(true);

    expect(createSoundPreferences(storage).isMuted()).toBe(true);
    expect(storage.getItem(SOUND_MUTED_STORAGE_KEY)).not.toBeNull();

    createSoundPreferences(storage).setMuted(false);
    expect(createSoundPreferences(storage).isMuted()).toBe(false);
  });

  it("ignores corrupt or unknown stored values", () => {
    const storage = new MemoryStorage();
    storage.setItem(SOUND_MUTED_STORAGE_KEY, "not-a-boolean");

    expect(createSoundPreferences(storage).isMuted()).toBe(false);
  });

  it("falls back to unmuted when reading throws", () => {
    const throwing: SoundStorage = {
      getItem(): string | null {
        throw new Error("storage denied");
      },
      setItem(): void {
        // Not reached.
      },
    };

    expect(createSoundPreferences(throwing).isMuted()).toBe(false);
  });

  it("never throws when writing fails", () => {
    const throwing: SoundStorage = {
      getItem(): string | null {
        return null;
      },
      setItem(): void {
        throw new Error("storage denied");
      },
    };

    const preferences = createSoundPreferences(throwing);
    expect(() => preferences.setMuted(true)).not.toThrow();
    expect(preferences.isMuted()).toBe(true);
  });

  it("uses the default storage backend when none is supplied", () => {
    // Node has no window.localStorage; the default resolves to null and
    // the preference stays unmuted without throwing.
    expect(createSoundPreferences().isMuted()).toBe(false);
  });

  it("works without a storage backend and never throws", () => {
    const preferences = createSoundPreferences(null);

    expect(preferences.isMuted()).toBe(false);
    expect(() => preferences.setMuted(true)).not.toThrow();
    expect(preferences.isMuted()).toBe(true);
  });
});
