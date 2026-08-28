import { describe, expect, it } from "vitest";
import { createTapClassifier } from "../src/render/tapGesture";

function point(
  pointerId: number,
  x: number,
  y: number,
  timeMs: number,
): { pointerId: number; x: number; y: number; timeMs: number } {
  return { pointerId, x, y, timeMs };
}

describe("tap gesture classifier — pure logic", () => {
  it("classifies a quick, still single-pointer press as a tap", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(1, 100, 200, 0));
    expect(classifier.end(point(1, 102, 201, 180))).toBe(true);
  });

  it("classifies a mouse click and a touch identically", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(7, 50, 60, 10));
    expect(classifier.end(point(7, 50, 60, 200))).toBe(true);
    classifier.begin(point(2, 50, 60, 500));
    expect(classifier.end(point(2, 55, 64, 760))).toBe(true);
  });

  it("rejects a drag-orbit (movement beyond threshold)", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(1, 100, 200, 0));
    expect(classifier.end(point(1, 160, 210, 120))).toBe(false);
  });

  it("rejects a long-press (duration beyond threshold)", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(1, 100, 200, 0));
    expect(classifier.end(point(1, 100, 200, 450))).toBe(false);
  });

  it("rejects a pinch: two concurrent pointers taint the gesture", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(1, 100, 200, 0));
    // Second finger lands — pinch begins, first finger is tainted
    classifier.begin(point(2, 180, 220, 40));
    expect(classifier.end(point(1, 100, 200, 120))).toBe(false);
    expect(classifier.end(point(2, 175, 215, 160))).toBe(false);
  });

  it("rejects a tap that starts while another pointer is already down", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(1, 100, 200, 0));
    classifier.begin(point(2, 180, 220, 40));
    classifier.end(point(2, 180, 220, 120));
    classifier.end(point(1, 100, 200, 140));
    // All pointers lifted; a fresh press afterwards is a clean tap again
    classifier.begin(point(3, 100, 200, 300));
    expect(classifier.end(point(3, 100, 200, 400))).toBe(true);
  });

  it("pointercancel never yields a tap and clears the tracking", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(1, 100, 200, 0));
    classifier.cancel(1);
    expect(classifier.end(point(1, 100, 200, 100))).toBe(false);
  });

  it("ignores end/cancel for unknown pointers", () => {
    const classifier = createTapClassifier();
    expect(classifier.end(point(9, 0, 0, 0))).toBe(false);
    expect(() => classifier.cancel(9)).not.toThrow();
  });

  it("allows a new tap immediately after a completed one", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(1, 10, 10, 0));
    expect(classifier.end(point(1, 10, 10, 100))).toBe(true);
    classifier.begin(point(1, 30, 30, 150));
    expect(classifier.end(point(1, 31, 31, 250))).toBe(true);
  });

  it("respects movement threshold boundary (10px tap, 11px drag)", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(1, 0, 0, 0));
    expect(classifier.end(point(1, 10, 0, 100))).toBe(true);
    classifier.begin(point(2, 0, 0, 200));
    expect(classifier.end(point(2, 11, 0, 300))).toBe(false);
  });

  it("respects duration threshold boundary (300ms tap, 301ms long-press)", () => {
    const classifier = createTapClassifier();
    classifier.begin(point(1, 0, 0, 0));
    expect(classifier.end(point(1, 0, 0, 300))).toBe(true);
    classifier.begin(point(2, 0, 0, 500));
    expect(classifier.end(point(2, 0, 0, 801))).toBe(false);
  });
});
