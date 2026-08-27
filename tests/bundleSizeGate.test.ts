import { describe, expect, it } from "vitest";
import {
  BUDGETED_EXTENSIONS,
  evaluateBudget,
  exitCodeFor,
  formatKB,
  sumTotals,
} from "../scripts/check-bundle-size.mjs";

describe("sumTotals", () => {
  it("returns zero totals for an empty build output", () => {
    expect(sumTotals([])).toEqual({ minBytes: 0, gzipBytes: 0 });
  });

  it("sums raw and gzip sizes across all entries", () => {
    const totals = sumTotals([
      { path: "dist/assets/index.js", size: 1000, gzipSize: 400 },
      { path: "dist/assets/physics.wasm", size: 2000, gzipSize: 800 },
      { path: "dist/index.html", size: 500, gzipSize: 200 },
    ]);
    expect(totals).toEqual({ minBytes: 3500, gzipBytes: 1400 });
  });
});

describe("evaluateBudget", () => {
  const budgets = { minBytes: 3500_000, gzipBytes: 1250_000 };

  it("passes when both totals are within budget", () => {
    const report = evaluateBudget({ minBytes: 3_499_999, gzipBytes: 1_249_999 }, budgets);
    expect(report.ok).toBe(true);
    expect(report.violations).toEqual([]);
  });

  it("passes exactly at the budget ceiling", () => {
    const report = evaluateBudget({ minBytes: 3_500_000, gzipBytes: 1_250_000 }, budgets);
    expect(report.ok).toBe(true);
    expect(report.violations).toEqual([]);
  });

  it("fails with a minified-size violation when over budget", () => {
    const report = evaluateBudget({ minBytes: 3_500_001, gzipBytes: 0 }, budgets);
    expect(report.ok).toBe(false);
    expect(report.violations).toHaveLength(1);
    expect(report.violations[0]).toContain("minified");
    expect(report.violations[0]).toContain("3,500.00");
  });

  it("fails with a gzip violation when over budget", () => {
    const report = evaluateBudget({ minBytes: 0, gzipBytes: 1_300_000 }, budgets);
    expect(report.ok).toBe(false);
    expect(report.violations).toHaveLength(1);
    expect(report.violations[0]).toContain("gzip");
    expect(report.violations[0]).toContain("1,250.00");
  });

  it("reports both violations when both budgets are exceeded", () => {
    const report = evaluateBudget({ minBytes: 4_000_000, gzipBytes: 1_300_000 }, budgets);
    expect(report.ok).toBe(false);
    expect(report.violations).toHaveLength(2);
  });

  it("honors custom budgets (used by the oversize CI probe)", () => {
    const report = evaluateBudget({ minBytes: 10, gzipBytes: 10 }, { minBytes: 5, gzipBytes: 5 });
    expect(report.ok).toBe(false);
    expect(report.violations).toHaveLength(2);
  });
});

describe("formatKB", () => {
  it("formats bytes as kilobytes with two decimals and thousands separators", () => {
    expect(formatKB(3_437_740)).toBe("3,437.74");
  });

  it("formats zero without a sign", () => {
    expect(formatKB(0)).toBe("0.00");
  });

  it("rounds to two decimals", () => {
    expect(formatKB(1_234)).toBe("1.23");
    expect(formatKB(1_235)).toBe("1.24");
  });
});

describe("exitCodeFor", () => {
  it("maps a passing report to exit code 0", () => {
    expect(exitCodeFor({ ok: true, violations: [] })).toBe(0);
  });

  it("maps a failing report to exit code 1", () => {
    expect(exitCodeFor({ ok: false, violations: ["over"] })).toBe(1);
  });
});

describe("BUDGETED_EXTENSIONS", () => {
  it("counts JS, CSS, HTML, and WASM payload toward the budget", () => {
    for (const ext of [".js", ".mjs", ".css", ".html", ".wasm"]) {
      expect(BUDGETED_EXTENSIONS).toContain(ext);
    }
  });

  it("excludes non-payload assets such as icons and manifests", () => {
    for (const ext of [".png", ".svg", ".ico", ".json", ".webmanifest", ".map"]) {
      expect(BUDGETED_EXTENSIONS).not.toContain(ext);
    }
  });
});
