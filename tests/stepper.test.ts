import { describe, expect, it } from "vitest";
import { createStepper } from "../src/core/stepper";

describe("createStepper", () => {
  const DT = 1000 / 60; // ~16.667ms

  it("returns no steps for zero elapsed time", () => {
    const s = createStepper(DT, 5);
    expect(s.advance(0)).toEqual({ steps: 0, alpha: 0 });
  });

  it("returns no steps for negative elapsed time", () => {
    const s = createStepper(DT, 5);
    expect(s.advance(-10)).toEqual({ steps: 0, alpha: 0 });
  });

  it("runs one step for exactly one fixed delta", () => {
    const s = createStepper(DT, 5);
    expect(s.advance(DT)).toEqual({ steps: 1, alpha: 0 });
  });

  it("holds a partial step as interpolation alpha", () => {
    const s = createStepper(DT, 5);
    expect(s.advance(DT / 2)).toEqual({ steps: 0, alpha: 0.5 });
  });

  it("carries leftover time across calls", () => {
    const s = createStepper(DT, 5);
    s.advance(DT / 2);
    const r = s.advance(DT / 2 + DT);
    expect(r.steps).toBe(2);
    expect(r.alpha).toBe(0);
  });

  it("caps steps at maxSubSteps and discards the backlog", () => {
    const s = createStepper(DT, 3);
    const r = s.advance(DT * 10);
    expect(r.steps).toBe(3);
    expect(r.alpha).toBe(0);
  });

  it("starts fresh after a capped burst", () => {
    const s = createStepper(DT, 3);
    s.advance(DT * 10);
    expect(s.advance(0)).toEqual({ steps: 0, alpha: 0 });
  });

  it("returns fractional alpha for a partial remainder", () => {
    const s = createStepper(DT, 5);
    const r = s.advance(DT * 2 + DT * 0.25);
    expect(r.steps).toBe(2);
    expect(r.alpha).toBeCloseTo(0.25);
  });
});
