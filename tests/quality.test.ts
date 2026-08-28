import { describe, expect, it } from "vitest";
import { getQualityMode, resolveQuality, setQualityMode } from "../src/core/quality";

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as unknown as Storage;
}

describe("quality persistence", () => {
  it("defaults to auto when missing", () => {
    expect(getQualityMode(fakeStorage())).toBe("auto");
  });
  it("round-trips High", () => {
    const s = fakeStorage();
    setQualityMode("high", s);
    expect(getQualityMode(s)).toBe("high");
  });
  it("falls back to auto on invalid stored value", () => {
    expect(getQualityMode(fakeStorage({ "marblescape:quality": "ultra" }))).toBe("auto");
  });
  it("silently falls back to auto when no storage exists", () => {
    const global = globalThis as { localStorage?: Storage };
    const original = global.localStorage;
    delete global.localStorage;
    try {
      expect(getQualityMode()).toBe("auto");
      expect(() => setQualityMode("high")).not.toThrow();
    } finally {
      global.localStorage = original;
    }
  });
});

describe("resolveQuality", () => {
  it("caps on compact in auto", () => {
    expect(resolveQuality({ compact: true }, "auto")).toEqual({ dprCap: 1.5, shadowSize: 1024 });
  });
  it("desktop uncapped in auto", () => {
    expect(resolveQuality({ compact: false }, "auto")).toEqual({ dprCap: 2, shadowSize: 2048 });
  });
  it("caps on low deviceMemory in auto", () => {
    expect(resolveQuality({ compact: false, deviceMemory: 4 }, "auto")).toEqual({
      dprCap: 1.5,
      shadowSize: 1024,
    });
  });
  it("does not cap on high deviceMemory in auto", () => {
    expect(resolveQuality({ compact: false, deviceMemory: 8 }, "auto")).toEqual({
      dprCap: 2,
      shadowSize: 2048,
    });
  });
  it("caps on low battery not charging in auto", () => {
    expect(
      resolveQuality({ compact: false, battery: { level: 0.1, charging: false } }, "auto"),
    ).toEqual({
      dprCap: 1.5,
      shadowSize: 1024,
    });
  });
  it("does not cap on low battery when charging in auto", () => {
    expect(
      resolveQuality({ compact: false, battery: { level: 0.1, charging: true } }, "auto"),
    ).toEqual({
      dprCap: 2,
      shadowSize: 2048,
    });
  });
  it("high forces desktop even when compact", () => {
    expect(
      resolveQuality(
        { compact: true, deviceMemory: 2, battery: { level: 0.05, charging: false } },
        "high",
      ),
    ).toEqual({
      dprCap: 2,
      shadowSize: 2048,
    });
  });
  it("high forces desktop on ample device", () => {
    expect(resolveQuality({ compact: false }, "high")).toEqual({ dprCap: 2, shadowSize: 2048 });
  });
});
