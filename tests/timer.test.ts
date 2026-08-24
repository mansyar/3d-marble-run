import { describe, expect, it } from "vitest";
import { formatRunTime } from "../src/sim/timer";

describe("run timer display", () => {
  it("formats zero and sub-minute elapsed time", () => {
    expect(formatRunTime(0)).toBe("00:00.0");
    expect(formatRunTime(1_234)).toBe("00:01.2");
    expect(formatRunTime(59_999)).toBe("00:59.9");
  });

  it("carries into minutes and never displays negative time", () => {
    expect(formatRunTime(60_000)).toBe("01:00.0");
    expect(formatRunTime(3_661_999)).toBe("61:01.9");
    expect(formatRunTime(-1)).toBe("00:00.0");
  });
});
