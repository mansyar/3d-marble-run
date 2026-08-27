/**
 * Bundle-size budget gate (Task 1.1 — pwa_budget_20260827).
 *
 * Pure helpers are exported for unit tests (`tests/bundleSizeGate.test.ts`);
 * the CLI at the bottom walks the build output, gzips each budgeted file, and
 * fails with a non-zero exit code when the tech-stack payload budget is
 * exceeded. Zero dependencies beyond Node built-ins.
 *
 * Budget source of truth: `conductor/tech-stack.md` (re-baselined in Task 1.3).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

/** Payload extensions counted toward the budget (JS/WASM/CSS/HTML). */
export const BUDGETED_EXTENSIONS = Object.freeze([".js", ".mjs", ".css", ".html", ".wasm"]);

/** Tech-stack payload budgets in kB (1 kB = 1000 bytes). */
export const BUDGET_MIN_KB = 3500;
export const BUDGET_GZIP_KB = 1250;

/**
 * Sum raw and gzip sizes across build-output entries.
 *
 * @param {ReadonlyArray<{path: string, size: number, gzipSize: number}>} entries
 * @returns {{minBytes: number, gzipBytes: number}}
 */
export function sumTotals(entries) {
  let minBytes = 0;
  let gzipBytes = 0;
  for (const entry of entries) {
    minBytes += entry.size;
    gzipBytes += entry.gzipSize;
  }
  return { minBytes, gzipBytes };
}

/**
 * Compare totals against byte budgets.
 *
 * @param {{minBytes: number, gzipBytes: number}} totals
 * @param {{minBytes: number, gzipBytes: number}} budgets
 * @returns {{ok: boolean, violations: string[]}}
 */
export function evaluateBudget(totals, budgets) {
  const violations = [];
  if (totals.minBytes > budgets.minBytes) {
    violations.push(
      `Minified payload ${formatKB(totals.minBytes)} kB exceeds the ` +
        `${formatKB(budgets.minBytes)} kB minified budget`,
    );
  }
  if (totals.gzipBytes > budgets.gzipBytes) {
    violations.push(
      `Gzip payload ${formatKB(totals.gzipBytes)} kB exceeds the ` +
        `${formatKB(budgets.gzipBytes)} kB gzip budget`,
    );
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Format bytes as kB with two decimals and thousands separators,
 * rounding half-up at the second decimal (1,235 B → "1.24").
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatKB(bytes) {
  const kB = Math.round(bytes / 10) / 100;
  const [intPart, decPart] = kB.toFixed(2).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}.${decPart}`;
}

/**
 * Map a budget report to a process exit code.
 *
 * @param {{ok: boolean, violations: string[]}} report
 * @returns {0 | 1}
 */
export function exitCodeFor(report) {
  return report.ok ? 0 : 1;
}

/** Collect budgeted build files (relative path, raw + gzip size). */
function collectBudgetedFiles(distDir) {
  const entries = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!BUDGETED_EXTENSIONS.some((ext) => name.endsWith(ext))) continue;
      const bytes = readFileSync(full);
      entries.push({
        path: relative(distDir, full),
        size: bytes.length,
        gzipSize: gzipSync(bytes).length,
      });
    }
  };
  walk(distDir);
  return entries;
}

/**
 * Parse a numeric CLI flag value. Absent flags return undefined so the caller
 * can apply its default; anything non-numeric — including empty strings,
 * which `Number()` would coerce to 0 — returns NaN so callers can reject the
 * run instead of silently disabling the gate.
 *
 * @param {string | undefined} raw
 * @returns {number | undefined}
 */
export function parseBudgetValue(raw) {
  if (raw === undefined) return undefined;
  if (raw.trim() === "") return NaN;
  const value = Number(raw);
  return Number.isFinite(value) ? value : NaN;
}

function parseArgValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? Number(process.argv[index + 1]) : undefined;
}

function main() {
  const distDir = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "dist";

  const minKb = parseBudgetValue(parseArgValue("--min-kb")) ?? BUDGET_MIN_KB;
  const gzipKb = parseBudgetValue(parseArgValue("--gzip-kb")) ?? BUDGET_GZIP_KB;
  if (Number.isNaN(minKb) || Number.isNaN(gzipKb)) {
    console.error("✗ Invalid --min-kb or --gzip-kb value — expected a finite number of kilobytes.");
    process.exitCode = 1;
    return;
  }

  let entries;
  try {
    entries = collectBudgetedFiles(distDir);
  } catch {
    console.error(`✗ Could not read build output at "${distDir}" — run pnpm build first.`);
    process.exitCode = 1;
    return;
  }

  const budgets = {
    minBytes: minKb * 1000,
    gzipBytes: gzipKb * 1000,
  };

  const totals = sumTotals(entries);
  const report = evaluateBudget(totals, budgets);

  const top = [...entries].sort((a, b) => b.gzipSize - a.gzipSize).slice(0, 10);
  console.log(`Bundle-size gate (${distDir}) — ${entries.length} budgeted files`);
  for (const entry of top) {
    console.log(
      `  ${entry.path.padEnd(40)} ${formatKB(entry.size).padStart(9)} kB min · ` +
        `${formatKB(entry.gzipSize).padStart(9)} kB gzip`,
    );
  }
  console.log(
    `  TOTAL ${formatKB(totals.minBytes)} kB min / ` +
      `${formatKB(totals.gzipBytes)} kB gzip (budget ${formatKB(budgets.minBytes)} / ` +
      `${formatKB(budgets.gzipBytes)})`,
  );

  if (report.ok) {
    console.log("✓ Payload within budget");
  } else {
    for (const violation of report.violations) console.error(`✗ ${violation}`);
  }
  process.exitCode = exitCodeFor(report);
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main();
}
