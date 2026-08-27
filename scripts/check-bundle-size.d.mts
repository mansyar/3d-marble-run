/** Type declarations for the bundle-size gate CLI (imported by tests). */

export const BUDGETED_EXTENSIONS: readonly string[];
export const BUDGET_MIN_KB: number;
export const BUDGET_GZIP_KB: number;

export interface SizeTotals {
  minBytes: number;
  gzipBytes: number;
}

export interface BudgetReport {
  ok: boolean;
  violations: string[];
}

export interface BuildEntry {
  path: string;
  size: number;
  gzipSize: number;
}

export function sumTotals(entries: ReadonlyArray<BuildEntry>): SizeTotals;
export function evaluateBudget(
  totals: SizeTotals,
  budgets: { minBytes: number; gzipBytes: number },
): BudgetReport;
export function formatKB(bytes: number): string;
export function exitCodeFor(report: BudgetReport): 0 | 1;
export function parseBudgetValue(raw: string | undefined): number | undefined;
