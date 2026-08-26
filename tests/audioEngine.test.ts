import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type AudioEngine,
  createAudioEngine,
  SOUND_COOLDOWN_MS,
  type SoundEvent,
  type SoundPlayer,
} from "../src/audio/engine";

function createRecordingPlayer(): SoundPlayer {
  return { play: vi.fn(), stop: vi.fn() };
}

describe("procedural audio engine", () => {
  let player: SoundPlayer;
  let tick: number;
  let engine: AudioEngine;

  beforeEach(() => {
    player = createRecordingPlayer();
    tick = 0;
    engine = createAudioEngine(player, { now: () => tick });
  });

  it("is locked and unmuted by default", () => {
    expect(engine.isUnlocked()).toBe(false);
    expect(engine.isMuted()).toBe(false);
  });

  it("silently drops playback before the engine is unlocked", () => {
    engine.play("snap");

    expect(player.play).not.toHaveBeenCalled();
  });

  it("plays an event once unlocked", () => {
    engine.unlock();
    engine.play("goal");

    expect(player.play).toHaveBeenCalledTimes(1);
    expect(player.play).toHaveBeenCalledWith("goal");
  });

  it("is idempotent across repeated unlock calls", () => {
    engine.unlock();
    engine.unlock();
    engine.play("snap");

    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("coalesces rapid repeats of the same event within its cooldown", () => {
    engine.unlock();
    engine.play("snap");
    tick += 10;
    engine.play("snap");

    expect(player.play).toHaveBeenCalledTimes(1);

    tick += SOUND_COOLDOWN_MS.snap + 1;
    engine.play("snap");

    expect(player.play).toHaveBeenCalledTimes(2);
  });

  it("keeps different event types independent of each other's cooldowns", () => {
    engine.unlock();
    engine.play("snap");
    engine.play("goal");

    expect(player.play).toHaveBeenCalledTimes(2);
    expect(player.play).toHaveBeenCalledWith("snap");
    expect(player.play).toHaveBeenCalledWith("goal");
  });

  it("silences playback when muted and cuts any scheduled notes", () => {
    engine.unlock();
    engine.setMuted(true);
    engine.play("drop");

    expect(player.stop).toHaveBeenCalledTimes(1);
    expect(player.play).not.toHaveBeenCalled();

    engine.setMuted(false);
    engine.play("drop");

    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("reports its muted state after setMuted", () => {
    expect(engine.isMuted()).toBe(false);
    engine.setMuted(true);
    expect(engine.isMuted()).toBe(true);
    engine.setMuted(false);
    expect(engine.isMuted()).toBe(false);
  });

  it("defines a positive finite cooldown for every event type", () => {
    const events: SoundEvent[] = ["snap", "delete", "drop", "landing", "goal"];
    for (const event of events) {
      expect(SOUND_COOLDOWN_MS[event]).toBeGreaterThan(0);
      expect(Number.isFinite(SOUND_COOLDOWN_MS[event])).toBe(true);
    }
  });
});
