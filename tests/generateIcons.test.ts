import { describe, expect, it } from "vitest";
import {
  APPLE_TOUCH_SIZE,
  ICON_SIZES,
  iconManifestEntries,
  MASKABLE_SIZE,
} from "../scripts/generate-icons.mjs";

describe("icon pipeline", () => {
  it("declares the documented raster sizes", () => {
    expect(ICON_SIZES).toEqual([192, 512]);
    expect(MASKABLE_SIZE).toBe(512);
    expect(APPLE_TOUCH_SIZE).toBe(180);
  });

  it("emits manifest entries for each any-purpose size plus one maskable", () => {
    const entries = iconManifestEntries();
    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => entry.sizes)).toEqual(["192x192", "512x512", "512x512"]);
    expect(entries.map((entry) => entry.type)).toEqual(["image/png", "image/png", "image/png"]);
  });

  it("marks only the dedicated maskable entry with maskable purpose", () => {
    const entries = iconManifestEntries();
    expect(entries[0].purpose).toBe("any");
    expect(entries[1].purpose).toBe("any");
    expect(entries[2].purpose).toBe("maskable");
    expect(entries[2].src).toBe("/icons/icon-maskable-512.png");
  });

  it("builds icon urls under the deployment base path", () => {
    const entries = iconManifestEntries("/marblescape/");
    expect(entries.map((entry) => entry.src)).toEqual([
      "/marblescape/icons/icon-192.png",
      "/marblescape/icons/icon-512.png",
      "/marblescape/icons/icon-maskable-512.png",
    ]);
  });

  it("keeps icon src paths stable across sizes", () => {
    const [small, large, maskable] = iconManifestEntries();
    expect(small.src).toBe("/icons/icon-192.png");
    expect(large.src).toBe("/icons/icon-512.png");
    expect(maskable.src).toBe("/icons/icon-maskable-512.png");
  });
});
