import { describe, expect, it } from "vitest";
import packageJson from "../package.json";
import { APP_VERSION } from "../src/version";

describe("application version", () => {
  it("matches the package metadata", () => {
    expect(APP_VERSION).toBe(packageJson.version);
  });
});
