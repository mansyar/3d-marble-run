/**
 * Marble population governor — pure logic module, no Three.js/Rapier imports.
 *
 * Two responsibilities, pinned by `tests/population.test.ts`:
 *
 * 1. `resolveMarbleCap(tier)` maps the device quality tier (see
 *    `src/core/quality.ts`) to the maximum concurrent marbles: capped tiers
 *    (battery-saver / mid-range mobile) get 40, desktop-class tiers get 60.
 *
 * 2. `createFrameBudget()` is a hysteresis-based frame-budget monitor. The
 *    continuous stream consults it each tick: `suggest()` returns `"flow"`
 *    while frames keep their budget and `"pause"` after *sustained* overage.
 *    Single spikes (tab jank, GC hitch) never pause the stream, and resuming
 *    requires a sustained under-budget streak that any relapse resets — so
 *    the stream can never flap visibly in either direction.
 */

export type DeviceTier = "capped" | "desktop";

/** Maximum concurrent marbles per device quality tier. */
export function resolveMarbleCap(tier: DeviceTier): number {
  if (tier === "capped") return 40;
  if (tier === "desktop") return 60;
  throw new Error(`Unknown device tier "${String(tier)}"`);
}

export interface FrameBudgetOptions {
  /** Frame-time budget in ms; deltas above it count as over-budget (default 16.7). */
  budgetMs?: number;
  /** Rolling window size M of recent frame deltas (default 30). */
  windowSize?: number;
  /** Over-budget samples within the window required to pause (default 12). */
  pauseSamples?: number;
  /** Consecutive under-budget samples required to resume (default 30). */
  resumeSamples?: number;
}

export type FrameSuggestion = "flow" | "pause";

export interface FrameBudget {
  /** Records one frame delta in ms; non-finite or non-positive deltas are ignored. */
  record(deltaMs: number): void;
  /** Current stream guidance under the hysteresis rules. */
  suggest(): FrameSuggestion;
  /** Clears history and streaks, returning to `"flow"`. */
  reset(): void;
}

const DEFAULT_BUDGET_MS = 16.7;
const DEFAULT_WINDOW_SIZE = 30;
const DEFAULT_PAUSE_SAMPLES = 12;
const DEFAULT_RESUME_SAMPLES = 30;

/** Creates the pure frame-budget monitor used by the continuous stream. */
export function createFrameBudget(options: FrameBudgetOptions = {}): FrameBudget {
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS;
  const windowSize = options.windowSize ?? DEFAULT_WINDOW_SIZE;
  const pauseSamples = options.pauseSamples ?? DEFAULT_PAUSE_SAMPLES;
  const resumeSamples = options.resumeSamples ?? DEFAULT_RESUME_SAMPLES;

  if (!Number.isFinite(budgetMs) || budgetMs <= 0) {
    throw new Error("budgetMs must be finite and positive");
  }
  if (!Number.isSafeInteger(windowSize) || windowSize < 1) {
    throw new Error("windowSize must be a positive integer");
  }
  if (!Number.isSafeInteger(pauseSamples) || pauseSamples < 1 || pauseSamples > windowSize) {
    throw new Error("pauseSamples must be an integer within [1, windowSize]");
  }
  if (!Number.isSafeInteger(resumeSamples) || resumeSamples < 1) {
    throw new Error("resumeSamples must be a positive integer");
  }

  const deltas: number[] = [];
  let paused = false;
  let resumeStreak = 0;

  function overCount(): number {
    let count = 0;
    for (const delta of deltas) {
      if (delta > budgetMs) count += 1;
    }
    return count;
  }

  return {
    record(deltaMs: number): void {
      if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
      deltas.push(deltaMs);
      if (deltas.length > windowSize) deltas.shift();

      if (deltaMs > budgetMs) {
        resumeStreak = 0;
      } else {
        resumeStreak += 1;
      }
    },

    suggest(): FrameSuggestion {
      // Latch: pause on sustained overage, resume only on sustained headroom.
      if (!paused && overCount() >= pauseSamples) paused = true;
      if (paused && resumeStreak >= resumeSamples) paused = false;
      return paused ? "pause" : "flow";
    },

    reset(): void {
      deltas.length = 0;
      paused = false;
      resumeStreak = 0;
    },
  };
}
