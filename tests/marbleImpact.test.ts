import { describe, expect, it } from "vitest";
import { createMarbleImpactTracker, FALLING_VY, LANDED_VY } from "../src/sim/marbleImpact";

describe("marble impact tracker", () => {
  it("reports a marble the first time it transitions from falling to landed", () => {
    const tracker = createMarbleImpactTracker();

    expect(tracker.updateVelocities([{ id: 1, vy: -1.5 }])).toEqual([]);
    expect(tracker.updateVelocities([{ id: 1, vy: 0.1 }])).toEqual([1]);
  });

  it("never reports a marble that never fell", () => {
    const tracker = createMarbleImpactTracker();

    expect(tracker.updateVelocities([{ id: 2, vy: 0.0 }])).toEqual([]);
    expect(tracker.updateVelocities([{ id: 2, vy: -0.25 }])).toEqual([]);
    expect(tracker.updateVelocities([{ id: 2, vy: 0.4 }])).toEqual([]);
  });

  it("tracks multiple marbles independently", () => {
    const tracker = createMarbleImpactTracker();
    tracker.updateVelocities([
      { id: 1, vy: -1.0 },
      { id: 2, vy: -1.2 },
    ]);

    const landed = tracker.updateVelocities([
      { id: 1, vy: 0.0 },
      { id: 2, vy: -0.05 },
    ]);

    expect(landed.sort()).toEqual([1, 2]);
  });

  it("does not re-fire after a bounce", () => {
    const tracker = createMarbleImpactTracker();
    tracker.updateVelocities([{ id: 1, vy: -1.0 }]);
    expect(tracker.updateVelocities([{ id: 1, vy: 0.2 }])).toEqual([1]);

    tracker.updateVelocities([{ id: 1, vy: -1.4 }]);
    expect(tracker.updateVelocities([{ id: 1, vy: 0.0 }])).toEqual([]);
  });

  it("re-tracks a marble after remove()", () => {
    const tracker = createMarbleImpactTracker();
    tracker.updateVelocities([{ id: 1, vy: -1.0 }]);
    tracker.remove(1);

    expect(tracker.updateVelocities([{ id: 1, vy: 0.1 }])).toEqual([]);

    tracker.updateVelocities([{ id: 1, vy: -1.0 }]);
    expect(tracker.updateVelocities([{ id: 1, vy: 0.1 }])).toEqual([1]);
  });

  it("clears all tracking on reset()", () => {
    const tracker = createMarbleImpactTracker();
    tracker.updateVelocities([{ id: 1, vy: -1.0 }]);
    tracker.reset();

    expect(tracker.updateVelocities([{ id: 1, vy: 0.1 }])).toEqual([]);

    tracker.updateVelocities([{ id: 1, vy: -1.0 }]);
    expect(tracker.updateVelocities([{ id: 1, vy: 0.1 }])).toEqual([1]);
  });

  it("handles empty sample lists", () => {
    const tracker = createMarbleImpactTracker();

    expect(tracker.updateVelocities([])).toEqual([]);
  });

  it("orders thresholds so falling is clearly below landed", () => {
    expect(FALLING_VY).toBeLessThan(LANDED_VY);
    expect(LANDED_VY).toBeLessThan(0);
  });
});
