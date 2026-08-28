import { describe, expect, it } from "vitest";
import { createStuckDetector } from "../src/sim/stuckDetector";

describe("stuck detector — pure logic", () => {
  it("never flags a steady roller at 0.6 m/s over 2s", () => {
    const detector = createStuckDetector();
    const id = 1;
    for (let t = 0; t <= 2000; t += 100) {
      // moves 0.06 per 100ms at 0.6 m/s along X
      const x = t * 0.0006;
      detector.update(id, [x, 0, 0], [0.6, 0, 0], t);
      expect(detector.isStuck(id)).toBe(false);
    }
    expect(detector.stuckIds(2000)).toEqual([]);
  });

  it("flags a marble at 0.04 m/s within 0.03 m after 1200 ms window", () => {
    const detector = createStuckDetector({
      velocityThreshold: 0.12,
      positionEpsilon: 0.04,
      stuckWindowMs: 1200,
      graceMs: 800,
    });
    const id = 7;
    // First sighting at t=0
    detector.update(id, [0, 0, 0], [0.04, 0, 0], 0);
    // Still in grace at 700ms — not stuck even if window would be elapsed
    detector.update(id, [0.02, 0, 0], [0.04, 0, 0], 700);
    expect(detector.stuckIds(700)).toEqual([]);
    expect(detector.isStuck(id)).toBe(false);

    // Advance past grace: need 1200ms of staying still after grace
    // Use window that starts at first post-grace update (800ms)
    detector.update(id, [0.02, 0, 0], [0.04, 0, 0], 800);
    detector.update(id, [0.025, 0, 0], [0.04, 0, 0], 1400);
    expect(detector.stuckIds(1400)).toEqual([]);
    // At 2000 ms (800+1200) should be flagged — still within epsilon & slow
    detector.update(id, [0.03, 0, 0], [0.03, 0, 0], 2000);
    expect(detector.stuckIds(2000)).toEqual([7]);
    expect(detector.isStuck(id)).toBe(true);
  });

  it("grace period prevents false flag in first 800 ms even if idle", () => {
    const detector = createStuckDetector({ graceMs: 800, stuckWindowMs: 1200 });
    const id = 2;
    detector.update(id, [0, 0, 0], [0, 0, 0], 0);
    detector.update(id, [0, 0, 0], [0, 0, 0], 500);
    expect(detector.stuckIds(500)).toEqual([]);
    detector.update(id, [0, 0, 0], [0, 0, 0], 799);
    expect(detector.stuckIds(799)).toEqual([]);
    expect(detector.isStuck(id)).toBe(false);
  });

  it("resets window when marble moves beyond epsilon after idling", () => {
    const detector = createStuckDetector({
      velocityThreshold: 0.12,
      positionEpsilon: 0.04,
      stuckWindowMs: 1200,
      graceMs: 0,
    });
    const id = 3;
    detector.update(id, [0, 0, 0], [0.02, 0, 0], 0);
    detector.update(id, [0.01, 0, 0], [0.02, 0, 0], 900);
    expect(detector.stuckIds(900)).toEqual([]);
    // Move 0.1 beyond epsilon — resets window start
    detector.update(id, [0.1, 0, 0], [0.4, 0, 0], 1000);
    expect(detector.stuckIds(1000)).toEqual([]);
    // Then stall again - need fresh 1200ms
    detector.update(id, [0.1, 0, 0], [0.02, 0, 0], 1100);
    detector.update(id, [0.11, 0, 0], [0.02, 0, 0], 1800);
    expect(detector.stuckIds(1800)).toEqual([]);
    detector.update(id, [0.11, 0, 0], [0.02, 0, 0], 2300);
    expect(detector.stuckIds(2300)).toEqual([3]);
  });

  it("forgets an id after remove() so it is no longer returned", () => {
    const detector = createStuckDetector({ graceMs: 0, stuckWindowMs: 200 });
    const id = 4;
    detector.update(id, [0, 0, 0], [0, 0, 0], 0);
    detector.update(id, [0, 0, 0], [0, 0, 0], 250);
    expect(detector.stuckIds(250)).toEqual([4]);
    detector.remove(id);
    expect(detector.stuckIds(300)).toEqual([]);
    expect(detector.isStuck(id)).toBe(false);
    // Re-adding after removal should start fresh grace/window
    detector.update(id, [5, 0, 0], [0, 0, 0], 300);
    expect(detector.stuckIds(400)).toEqual([]);
  });

  it("respects velocity threshold boundary 0.11 vs 0.13 around 0.12", () => {
    const below = createStuckDetector({
      velocityThreshold: 0.12,
      positionEpsilon: 0.04,
      stuckWindowMs: 500,
      graceMs: 0,
    });
    const above = createStuckDetector({
      velocityThreshold: 0.12,
      positionEpsilon: 0.04,
      stuckWindowMs: 500,
      graceMs: 0,
    });
    // Below threshold (0.11) should eventually stick
    below.update(1, [0, 0, 0], [0.11, 0, 0], 0);
    below.update(1, [0, 0, 0], [0.11, 0, 0], 600);
    expect(below.stuckIds(600)).toEqual([1]);

    // Above threshold (0.13) should never stick even with no movement
    above.update(2, [0, 0, 0], [0.13, 0, 0], 0);
    above.update(2, [0, 0, 0], [0.13, 0, 0], 600);
    expect(above.stuckIds(600)).toEqual([]);
  });

  it("tracks marbles independently under splitter pile-up", () => {
    const detector = createStuckDetector({ graceMs: 0, stuckWindowMs: 400 });
    // Marble A stuck, marble B moving
    detector.update(1, [0, 0, 0], [0.01, 0, 0], 0);
    detector.update(2, [1, 0, 0], [0.6, 0, 0], 0);
    detector.update(1, [0, 0, 0], [0.01, 0, 0], 500);
    detector.update(2, [1.3, 0, 0], [0.6, 0, 0], 500);
    expect(detector.stuckIds(500)).toEqual([1]);
    expect(detector.isStuck(1)).toBe(true);
    expect(detector.isStuck(2)).toBe(false);
  });

  it("reset() clears all tracking", () => {
    const detector = createStuckDetector({ graceMs: 0, stuckWindowMs: 200 });
    detector.update(1, [0, 0, 0], [0, 0, 0], 0);
    detector.update(1, [0, 0, 0], [0, 0, 0], 300);
    expect(detector.stuckIds(300)).toEqual([1]);
    detector.reset();
    expect(detector.stuckIds(300)).toEqual([]);
    expect(detector.isStuck(1)).toBe(false);
  });

  it("handles empty state and unknown ids gracefully", () => {
    const detector = createStuckDetector();
    expect(detector.stuckIds(0)).toEqual([]);
    expect(detector.isStuck(999)).toBe(false);
    expect(() => detector.remove(999)).not.toThrow();
    expect(() => detector.reset()).not.toThrow();
  });
});
