import { describe, expect, it } from "vitest";
import {
  APPLE_TOUCH_SIZE,
  buildManifest,
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
    expect(entries[2].src).toBe("icons/icon-maskable-512.png");
  });

  it("keeps icon src paths stable across sizes", () => {
    const [small, large, maskable] = iconManifestEntries();
    expect(small.src).toBe("icons/icon-192.png");
    expect(large.src).toBe("icons/icon-512.png");
    expect(maskable.src).toBe("icons/icon-maskable-512.png");
  });

  it("builds icon urls under an explicit deployment base path", () => {
    const entries = iconManifestEntries("/marblescape/");
    expect(entries.map((entry) => entry.src)).toEqual([
      "/marblescape/icons/icon-192.png",
      "/marblescape/icons/icon-512.png",
      "/marblescape/icons/icon-maskable-512.png",
    ]);
  });
});

describe("buildManifest", () => {
  it("pairs the toy-set metadata with the generated icon entries", () => {
    const manifest = buildManifest();
    expect(manifest.name).toBe("Marblescape");
    expect(manifest.short_name).toBe("Marblescape");
    expect(manifest.display).toBe("standalone");
    expect(manifest.orientation).toBe("any");
    expect(manifest.background_color).toBe("#f5efe4");
    expect(manifest.theme_color).toBe("#f5efe4");
    expect(manifest.id).toBe("./");
    expect(manifest.start_url).toBe("./");
    expect(manifest.scope).toBe("./");
  });

  it("uses relative icon srcs by default so one manifest serves root and /<repo>/ deploys", () => {
    const manifest = buildManifest();
    expect(manifest.icons.map((entry) => entry.src)).toEqual([
      "icons/icon-192.png",
      "icons/icon-512.png",
      "icons/icon-maskable-512.png",
    ]);
    expect(manifest.icons.map((entry) => entry.purpose)).toEqual(["any", "any", "maskable"]);
  });

  it("supports absolute bases for manifest-URL-relative icon resolution", () => {
    const manifest = buildManifest("/marblescape/");
    expect(manifest.icons[0].src).toBe("/marblescape/icons/icon-192.png");
  });
});
