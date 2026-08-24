import { describe, expect, it } from "vitest";
import { createSpawner } from "../src/sim/spawner";

describe("marble spawner state machine", () => {
  it("drops one marble manually and starts the timer at that spawn", () => {
    const spawner = createSpawner({ maxMarbles: 20, streamIntervalMs: 100 });

    spawner.advance(500);
    expect(spawner.state()).toMatchObject({
      activeIds: [],
      timerMs: 0,
      timerRunning: false,
    });

    const result = spawner.drop();
    expect(result.recycled).toEqual([]);
    expect(result.spawned).toEqual([{ id: 1, spawnedAtMs: 500 }]);
    expect(spawner.state()).toMatchObject({
      activeIds: [1],
      timerMs: 0,
      timerRunning: true,
    });

    spawner.advance(250);
    expect(spawner.state().timerMs).toBe(250);
  });

  it("does not stream until enabled and emits at the configured interval", () => {
    const spawner = createSpawner({ maxMarbles: 20, streamIntervalMs: 100 });

    expect(spawner.advance(500).spawned).toEqual([]);
    expect(spawner.isContinuous()).toBe(false);

    spawner.setContinuous(true);
    expect(spawner.isContinuous()).toBe(true);
    expect(spawner.advance(99).spawned).toEqual([]);
    expect(spawner.advance(1).spawned).toEqual([{ id: 1, spawnedAtMs: 600 }]);

    spawner.setContinuous(false);
    expect(spawner.advance(500).spawned).toEqual([]);
    expect(spawner.toggleContinuous()).toBe(true);
    expect(spawner.advance(100).spawned).toEqual([{ id: 2, spawnedAtMs: 1200 }]);
  });

  it("emits every elapsed stream interval and keeps timer time since first spawn", () => {
    const spawner = createSpawner({ maxMarbles: 20, streamIntervalMs: 100 });

    spawner.setContinuous(true);
    const first = spawner.advance(250);
    expect(first.spawned).toEqual([
      { id: 1, spawnedAtMs: 100 },
      { id: 2, spawnedAtMs: 200 },
    ]);
    expect(spawner.state().timerMs).toBe(150);

    expect(spawner.advance(49).spawned).toEqual([]);
    expect(spawner.advance(1).spawned).toEqual([{ id: 3, spawnedAtMs: 300 }]);
  });

  it("recycles the oldest active marble at the concurrency cap", () => {
    const spawner = createSpawner({ maxMarbles: 3, streamIntervalMs: 100 });

    expect(spawner.drop().spawned[0]?.id).toBe(1);
    expect(spawner.drop().spawned[0]?.id).toBe(2);
    expect(spawner.drop().spawned[0]?.id).toBe(3);
    expect(spawner.state().activeIds).toEqual([1, 2, 3]);

    const fourth = spawner.drop();
    expect(fourth.recycled).toEqual([1]);
    expect(fourth.spawned[0]?.id).toBe(4);
    expect(spawner.state().activeIds).toEqual([2, 3, 4]);
  });

  it("removes an entered marble from the active queue", () => {
    const spawner = createSpawner({ maxMarbles: 3, streamIntervalMs: 100 });
    spawner.drop();
    spawner.drop();

    expect(spawner.remove(1)).toBe(true);
    expect(spawner.remove(1)).toBe(false);
    expect(spawner.state().activeIds).toEqual([2]);
  });

  it("reset clears marbles, stops streaming, and resets the run timer", () => {
    const spawner = createSpawner({ maxMarbles: 3, streamIntervalMs: 100 });
    spawner.setContinuous(true);
    spawner.advance(100);
    spawner.advance(250);

    const reset = spawner.reset();
    expect(reset).toEqual({ removedIds: [1, 2, 3] });
    expect(spawner.state()).toEqual({
      continuous: false,
      activeIds: [],
      timerMs: 0,
      timerRunning: false,
    });
    expect(spawner.advance(500).spawned).toEqual([]);
  });

  it("starts a fresh timer when spawning after reset", () => {
    const spawner = createSpawner({ maxMarbles: 3, streamIntervalMs: 100 });
    spawner.drop();
    spawner.advance(200);
    spawner.reset();
    spawner.advance(500);

    expect(spawner.drop().spawned[0]).toEqual({ id: 2, spawnedAtMs: 700 });
    expect(spawner.state().timerMs).toBe(0);
  });
});
