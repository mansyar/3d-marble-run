import { describe, expect, it } from "vitest";
import { createFrameBudget, resolveMarbleCap } from "../src/sim/population";

describe("marble population cap", () => {
  it("maps device tiers to caps: capped→40, desktop→60", () => {
    expect(resolveMarbleCap("capped")).toBe(40);
    expect(resolveMarbleCap("desktop")).toBe(60);
  });

  it("rejects unknown tiers", () => {
    expect(() => resolveMarbleCap("unlimited" as never)).toThrow();
  });
});

describe("frame budget governor — pure logic", () => {
  it("never pauses on a steady 60 Hz frame stream", () => {
    const budget = createFrameBudget({ windowSize: 30, pauseSamples: 12 });
    for (let i = 0; i < 300; i += 1) budget.record(16.7);
    expect(budget.suggest()).toBe("flow");
  });

  it("never pauses on a single over-budget spike (tab jank)", () => {
    const budget = createFrameBudget({ windowSize: 30, pauseSamples: 12 });
    for (let i = 0; i < 100; i += 1) budget.record(16.7);
    budget.record(100);
    expect(budget.suggest()).toBe("flow");
  });

  it("pauses only after sustained overage fills the window", () => {
    const budget = createFrameBudget({
      windowSize: 30,
      pauseSamples: 12,
      resumeSamples: 20,
    });
    for (let i = 0; i < 11; i += 1) {
      budget.record(33);
      expect(budget.suggest()).toBe("flow");
    }
    budget.record(33);
    expect(budget.suggest()).toBe("pause");
  });

  it("stays paused while over budget persists", () => {
    const budget = createFrameBudget({ windowSize: 30, pauseSamples: 12 });
    for (let i = 0; i < 12; i += 1) budget.record(33);
    expect(budget.suggest()).toBe("pause");
    for (let i = 0; i < 30; i += 1) budget.record(33);
    expect(budget.suggest()).toBe("pause");
  });

  it("resumes after sustained headroom and resets the resume streak on relapse", () => {
    const budget = createFrameBudget({
      windowSize: 30,
      pauseSamples: 12,
      resumeSamples: 20,
    });
    for (let i = 0; i < 12; i += 1) budget.record(33);
    expect(budget.suggest()).toBe("pause");

    // Intermittent good frames must not accumulate toward resume
    for (let i = 0; i < 10; i += 1) budget.record(16.7);
    budget.record(33);
    for (let i = 0; i < 9; i += 1) budget.record(16.7);
    expect(budget.suggest()).toBe("pause");

    // Sustained headroom completes the resume streak
    for (let i = 0; i < 20; i += 1) budget.record(16.7);
    expect(budget.suggest()).toBe("flow");
  });

  it("startles back to flow after reset() clears history", () => {
    const budget = createFrameBudget({ windowSize: 30, pauseSamples: 12 });
    for (let i = 0; i < 12; i += 1) budget.record(33);
    expect(budget.suggest()).toBe("pause");
    budget.reset();
    expect(budget.suggest()).toBe("flow");
  });

  it("rejects invalid budgets and window/threshold configurations", () => {
    expect(() => createFrameBudget({ budgetMs: 0 })).toThrow();
    expect(() => createFrameBudget({ budgetMs: -5 })).toThrow();
    expect(() => createFrameBudget({ budgetMs: Number.NaN })).toThrow();
    expect(() => createFrameBudget({ windowSize: 0 })).toThrow();
    expect(() => createFrameBudget({ pauseSamples: 0 })).toThrow();
    expect(() => createFrameBudget({ pauseSamples: 31, windowSize: 30 })).toThrow();
    expect(() => createFrameBudget({ resumeSamples: 0 })).toThrow();
  });
});
