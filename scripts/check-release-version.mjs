import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const stableVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function isStableVersion(value) {
  return typeof value === "string" && stableVersionPattern.test(value);
}

export function isMatchingReleaseTag(packageVersion, tag) {
  return (
    isStableVersion(packageVersion) &&
    typeof tag === "string" &&
    tag.startsWith("v") &&
    isStableVersion(tag.slice(1)) &&
    tag === `v${packageVersion}`
  );
}

export function validateReleaseTag(packageVersion, tag) {
  if (!isStableVersion(packageVersion)) {
    throw new Error(
      `package.json version must be stable SemVer (MAJOR.MINOR.PATCH); received "${packageVersion}".`,
    );
  }

  if (typeof tag !== "string" || !tag.startsWith("v") || !isStableVersion(tag.slice(1))) {
    throw new Error(
      `Release tag must use stable SemVer as vMAJOR.MINOR.PATCH; received "${tag ?? ""}".`,
    );
  }

  if (tag !== `v${packageVersion}`) {
    throw new Error(
      `Release tag "${tag}" does not match package.json version "${packageVersion}"; expected "v${packageVersion}".`,
    );
  }
}

export async function run(args = process.argv, env = process.env) {
  const tag = args[2] ?? env.RELEASE_TAG;
  const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));

  validateReleaseTag(packageJson.version, tag);
  console.log(`Release tag ${tag} matches package.json version ${packageJson.version}.`);
}

const scriptUrl = pathToFileURL(resolve(process.argv[1] ?? "")).href;
if (import.meta.url === scriptUrl) {
  run().catch((error) => {
    console.error(`Release version check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
