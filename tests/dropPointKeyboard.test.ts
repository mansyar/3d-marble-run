import { describe, expect, it } from "vitest";
import { shouldHandleDropPointShortcut } from "../src/build/dropPointKeyboard";

describe("Drop point keyboard ownership", () => {
  it("ignores shortcuts when the Drop point tool is inactive", () => {
    expect(shouldHandleDropPointShortcut(false, false)).toBe(false);
  });

  it("handles shortcuts while the Drop point tool is selected", () => {
    expect(shouldHandleDropPointShortcut(false, true)).toBe(true);
  });

  it("keeps handling a shortcut while an edit is active", () => {
    expect(shouldHandleDropPointShortcut(true, false)).toBe(true);
  });
});
