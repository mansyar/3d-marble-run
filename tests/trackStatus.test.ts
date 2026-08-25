import { describe, expect, it } from "vitest";
import { getTrackStatusMessage } from "../src/ui/trackStatus";

describe("track status guidance", () => {
  it.each([
    ["missing-drop-point", "Place a Drop point to drop marbles."],
    ["no-landing", "Move the Drop point above a track piece."],
    ["no-connected-goal", "Connect a Goal cup to the Drop point for a finish."],
    ["ready", "Run ready! Drop a marble."],
  ] as const)("explains the %s state", (status, message) => {
    expect(getTrackStatusMessage(status)).toBe(message);
  });
});
