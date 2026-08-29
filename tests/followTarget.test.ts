import { describe, expect, it } from "vitest";
import { resolveFollowTarget } from "../src/sim/followTarget";

describe("follow target resolver — pure logic", () => {
  it("keeps the followed id while it stays active", () => {
    expect(resolveFollowTarget(3, [1, 2, 3, 4])).toBe(3);
  });

  it("returns null when not following anyone (free mode)", () => {
    expect(resolveFollowTarget(null, [1, 2, 3])).toBe(null);
    expect(resolveFollowTarget(null, [])).toBe(null);
  });

  it("hands off to the newest remaining marble on goal removal", () => {
    // Followed marble 4 scored a goal; 5 is the newest active marble
    expect(resolveFollowTarget(4, [1, 2, 5], [4])).toBe(5);
  });

  it("hands off on out-of-bounds cleanup removal", () => {
    expect(resolveFollowTarget(2, [1, 7], [2])).toBe(7);
  });

  it("hands off on stuck-marble recycle", () => {
    expect(resolveFollowTarget(9, [3, 6, 8], [9])).toBe(8);
  });

  it("hands off on pool-shrink recycle (oldest removed first)", () => {
    // Marble 1 (oldest) recycled by cap shrink; we were riding it
    expect(resolveFollowTarget(1, [4, 7, 9], [1])).toBe(9);
  });

  it("returns null when the track empties (ease back to free)", () => {
    expect(resolveFollowTarget(5, [], [5])).toBe(null);
    expect(resolveFollowTarget(5, [], [])).toBe(null);
  });

  it("treats a stale followed id (absent from activeIds) as removed", () => {
    // e.g. id already dropped from the spawner before we observed it
    expect(resolveFollowTarget(2, [1, 3])).toBe(3);
    expect(resolveFollowTarget(2, [])).toBe(null);
  });

  it("prefers the removal list over a stale activeIds entry", () => {
    // Defensively: if removal is reported, never re-select the removed id
    expect(resolveFollowTarget(2, [1, 2, 3], [2])).toBe(3);
  });

  it("does not hand off to an id that was removed in the same batch", () => {
    // Followed 1; marbles 1 and 3 both removed this frame, 2 remains
    expect(resolveFollowTarget(1, [2, 3], [1, 3])).toBe(2);
  });
});
