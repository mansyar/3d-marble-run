import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Resvg } from "@resvg/resvg-js";

/** Raster sizes emitted for the manifest "any" purpose (px). */
export const ICON_SIZES = [192, 512];
/** Raster size emitted for the dedicated "maskable" manifest entry (px). */
export const MASKABLE_SIZE = 512;
/** Apple touch icon size rendered for the index.html link tag (px). */
export const APPLE_TOUCH_SIZE = 180;

function iconUrl(baseUrl, fileName) {
  return `${baseUrl.replace(/\/+$/, "")}/icons/${fileName}`;
}

/**
 * Manifest entries for the generated icons. Pure so the manifest wiring stays
 * unit-testable and base-path aware (GitHub Pages deploys under /<repo>/).
 */
export function iconManifestEntries(baseUrl = "/") {
  return [
    ...ICON_SIZES.map((size) => ({
      src: iconUrl(baseUrl, `icon-${size}.png`),
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any",
    })),
    {
      src: iconUrl(baseUrl, `icon-maskable-${MASKABLE_SIZE}.png`),
      sizes: `${MASKABLE_SIZE}x${MASKABLE_SIZE}`,
      type: "image/png",
      purpose: "maskable",
    },
  ];
}

async function renderIcons(svgPath, outDir) {
  const svg = await readFile(svgPath, "utf8");
  await mkdir(outDir, { recursive: true });
  const renders = [
    ...ICON_SIZES.map((size) => [`icon-${size}.png`, size]),
    [`icon-maskable-${MASKABLE_SIZE}.png`, MASKABLE_SIZE],
    [`icon-apple-${APPLE_TOUCH_SIZE}.png`, APPLE_TOUCH_SIZE],
  ];
  for (const [fileName, size] of renders) {
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: size },
    })
      .render()
      .asPng();
    await writeFile(path.join(outDir, fileName), png);
    console.log(`  ${fileName} (${size}x${size})`);
  }
}

function invokedDirectly() {
  const entry = process.argv[1];
  return entry ? import.meta.url === pathToFileURL(entry).href : false;
}

if (invokedDirectly()) {
  const svgPath = process.argv[2] ?? "assets/icon.svg";
  const outDir = process.argv[3] ?? "public/icons";
  await renderIcons(svgPath, outDir);
}
