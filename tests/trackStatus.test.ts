import { describe, expect, it } from "vitest";
import { getTrackStatusMessage } from "../src/ui/trackStatus";

describe("track status guidance", () => {
  it.each([
    ["missing-start", "Add a Start gate to drop marbles."],
    ["no-connected-goal", "Connect a Goal cup to the Start gate for a finish."],
    ["ready", "Run ready! Drop a marble."],
  ] as const)("explains the %s state", (status, message) => {
    expect(getTrackStatusMessage(status)).toBe(message);
  });
});
