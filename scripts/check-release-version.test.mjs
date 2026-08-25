import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { isMatchingReleaseTag, run, validateReleaseTag } from "./check-release-version.mjs";

const scriptPath = fileURLToPath(new URL("./check-release-version.mjs", import.meta.url));
const packagePath = fileURLToPath(new URL("../package.json", import.meta.url));
const packageVersion = JSON.parse(readFileSync(packagePath, "utf8")).version;
const matchingTag = `v${packageVersion}`;
const [major, minor, patch] = packageVersion.split(".");
const mismatchedTag = `v${major}.${minor}.${Number(patch) + 1}`;

describe("release tag validation", () => {
  it("accepts an exact stable package version with the v prefix", () => {
    expect(isMatchingReleaseTag("0.1.0", "v0.1.0")).toBe(true);
    expect(isMatchingReleaseTag("2.14.7", "v2.14.7")).toBe(true);
  });

  it("rejects a tag without the v prefix", () => {
    expect(isMatchingReleaseTag("0.1.0", "0.1.0")).toBe(false);
    expect(isMatchingReleaseTag("0.1.0", undefined)).toBe(false);
  });

  it("rejects tags that do not exactly match the package version", () => {
    expect(isMatchingReleaseTag("0.1.0", "v0.1.1")).toBe(false);
    expect(isMatchingReleaseTag("0.1.0", "v1.0.0")).toBe(false);
  });

  it("rejects malformed and prerelease tags", () => {
    expect(isMatchingReleaseTag("0.1.0", "v0.1")).toBe(false);
    expect(isMatchingReleaseTag("0.1.0", "v01.0.0")).toBe(false);
    expect(isMatchingReleaseTag("0.1.0", "v0.1.0-rc.1")).toBe(false);
    expect(isMatchingReleaseTag("0.1.0-rc.1", "v0.1.0-rc.1")).toBe(false);
  });

  it("provides actionable errors for invalid release contracts", () => {
    expect(() => validateReleaseTag("0.1.0-rc.1", "v0.1.0-rc.1")).toThrow(
      "package.json version must be stable SemVer",
    );
    expect(() => validateReleaseTag("0.1.0", "0.1.0")).toThrow(
      "Release tag must use stable SemVer",
    );
    expect(() => validateReleaseTag("0.1.0", "v0.1.1")).toThrow(
      "does not match package.json version",
    );
    expect(() => validateReleaseTag("0.1.0", undefined)).toThrow(
      "Release tag must use stable SemVer",
    );
  });

  it("loads package metadata when run as a command", async () => {
    await expect(run(["node", scriptPath, matchingTag], {})).resolves.toBeUndefined();
    await expect(run(["node", scriptPath], {})).rejects.toThrow(
      "Release tag must use stable SemVer",
    );
  });

  it("validates a matching tag from the command line", () => {
    expect(
      execFileSync(process.execPath, [scriptPath, matchingTag], { encoding: "utf8" }),
    ).toContain(`matches package.json version ${packageVersion}`);
  });

  it("returns a failure status for a mismatched command-line tag", () => {
    const result = spawnSync(process.execPath, [scriptPath, mismatchedTag], { encoding: "utf8" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("does not match package.json version");
  });
});
