import type { Vec3 } from "../pieces/registry";

export interface StuckDetectorOptions {
  readonly velocityThreshold?: number;
  readonly positionEpsilon?: number;
  readonly stuckWindowMs?: number;
  readonly graceMs?: number;
}

export interface StuckDetector {
  update(id: number, position: Vec3, velocity: Vec3, nowMs: number): void;
  stuckIds(nowMs: number): number[];
  isStuck(id: number, nowMs?: number): boolean;
  remove(id: number): void;
  reset(): void;
}

interface Entry {
  windowStartPos: Vec3;
  windowStartMs: number;
  firstSeenMs: number;
  lastPos: Vec3;
  lastSpeed: number;
  lastUpdateMs: number;
}

const DEFAULT_VELOCITY_THRESHOLD = 0.12;
const DEFAULT_POSITION_EPSILON = 0.04;
const DEFAULT_STUCK_WINDOW_MS = 1200;
const DEFAULT_GRACE_MS = 800;

function vecClone(v: Vec3): Vec3 {
  return [v[0], v[1], v[2]];
}

function distance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dy, dz);
}

function speedOf(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

/**
 * Pure-logic stuck detector — tracks per-marble velocity + displacement over
 * a sliding window. No Three.js / Rapier / DOM dependencies.
 *
 * A marble is considered stuck when, for a continuous `stuckWindowMs`,
 * its speed stays below `velocityThreshold` **and** its displacement from the
 * window start stays within `positionEpsilon`. The first `graceMs` after a
 * marble's first sighting never counts as stuck (spawn momentum).
 */
export function createStuckDetector(options: StuckDetectorOptions = {}): StuckDetector {
  const velocityThreshold = options.velocityThreshold ?? DEFAULT_VELOCITY_THRESHOLD;
  const positionEpsilon = options.positionEpsilon ?? DEFAULT_POSITION_EPSILON;
  const stuckWindowMs = options.stuckWindowMs ?? DEFAULT_STUCK_WINDOW_MS;
  const graceMs = options.graceMs ?? DEFAULT_GRACE_MS;

  const entries = new Map<number, Entry>();

  return {
    update(id: number, position: Vec3, velocity: Vec3, nowMs: number): void {
      const sp = speedOf(velocity);
      const existing = entries.get(id);
      if (!existing) {
        entries.set(id, {
          windowStartPos: vecClone(position),
          windowStartMs: nowMs,
          firstSeenMs: nowMs,
          lastPos: vecClone(position),
          lastSpeed: sp,
          lastUpdateMs: nowMs,
        });
        return;
      }

      // Grace period: keep resetting the window so it cannot accumulate before grace expires.
      if (nowMs - existing.firstSeenMs < graceMs) {
        existing.windowStartPos = vecClone(position);
        existing.windowStartMs = nowMs;
        existing.lastPos = vecClone(position);
        existing.lastSpeed = sp;
        existing.lastUpdateMs = nowMs;
        return;
      }

      const distFromWindowStart = distance(position, existing.windowStartPos);

      // If the marble regained speed or moved beyond epsilon, restart the stuck window.
      if (sp >= velocityThreshold || distFromWindowStart > positionEpsilon) {
        existing.windowStartPos = vecClone(position);
        existing.windowStartMs = nowMs;
      }
      existing.lastPos = vecClone(position);
      existing.lastSpeed = sp;
      existing.lastUpdateMs = nowMs;
    },

    stuckIds(nowMs: number): number[] {
      const result: number[] = [];
      for (const [id, entry] of entries) {
        if (nowMs - entry.firstSeenMs < graceMs) continue;
        if (entry.lastSpeed >= velocityThreshold) continue;
        const dist = distance(entry.lastPos, entry.windowStartPos);
        if (dist > positionEpsilon) continue;
        if (nowMs - entry.windowStartMs >= stuckWindowMs) {
          result.push(id);
        }
      }
      return result;
    },

    isStuck(id: number, nowMs?: number): boolean {
      const entry = entries.get(id);
      if (!entry) return false;
      const effectiveNow = nowMs ?? entry.lastUpdateMs;
      if (effectiveNow - entry.firstSeenMs < graceMs) return false;
      if (entry.lastSpeed >= velocityThreshold) return false;
      const dist = distance(entry.lastPos, entry.windowStartPos);
      if (dist > positionEpsilon) return false;
      return effectiveNow - entry.windowStartMs >= stuckWindowMs;
    },

    remove(id: number): void {
      entries.delete(id);
    },

    reset(): void {
      entries.clear();
    },
  };
}
