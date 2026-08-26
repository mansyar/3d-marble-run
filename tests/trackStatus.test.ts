import { describe, expect, it } from "vitest";
import { getTrackStatusMessage } from "../src/ui/trackStatus";

describe("track status guidance", () => {
  it.each([
    ["missing-drop-point", "Pick Drop point below to drop marbles."],
    ["no-landing", "Move Drop point over a track piece."],
    ["no-connected-goal", "Add a Goal cup to finish the run."],
    ["ready", "Ready! Drop a marble."],
  ] as const)("explains the %s state", (status, message) => {
    expect(getTrackStatusMessage(status)).toBe(message);
  });
});
