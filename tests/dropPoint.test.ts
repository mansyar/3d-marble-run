import { describe, expect, it } from "vitest";
import {
  createDropPoint,
  DROP_POINT_HEIGHT,
  isValidDropPointPosition,
  replaceDropPoint,
} from "../src/track/dropPoint";

describe("drop point model", () => {
  it("normalizes every accepted point to the fixed overhead height", () => {
    expect(createDropPoint([2, -50, -3])).toEqual({
      position: [2, DROP_POINT_HEIGHT, -3],
    });
  });

  it("represents a missing point as null", () => {
    expect(createDropPoint(null)).toBeNull();
    expect(replaceDropPoint(null, null)).toBeNull();
  });

  it("rejects non-finite or out-of-bounds X/Z positions", () => {
    expect(isValidDropPointPosition([Number.NaN, 0, 0])).toBe(false);
    expect(isValidDropPointPosition([0, 0, Number.POSITIVE_INFINITY])).toBe(false);
    expect(createDropPoint([21, 0, 0])).toBeNull();
    expect(createDropPoint([0, 0, -21])).toBeNull();
  });

  it("replaces the one active point without mutating the previous value", () => {
    const current = createDropPoint([1, 0, 1]);
    const replacement = replaceDropPoint(current, [-4, 100, 6]);

    expect(replacement).toEqual({ position: [-4, DROP_POINT_HEIGHT, 6] });
    expect(current).toEqual({ position: [1, DROP_POINT_HEIGHT, 1] });
  });
});
