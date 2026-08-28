export interface TapClassifierOptions {
  /** Maximum press duration (pointerdown→pointerup) for a tap. */
  maxDurationMs?: number;
  /** Maximum start→end movement for a tap. */
  maxMovementPx?: number;
}

export interface TapPointInput {
  pointerId: number;
  x: number;
  y: number;
  timeMs: number;
}

export interface TapClassifier {
  /**
   * Records a pointerdown. A second concurrent pointer taints the whole
   * gesture (pinch / two-finger) so no pointer may yield a tap.
   */
  begin(input: TapPointInput): void;
  /**
   * Records a pointerup. Returns true only when the press pair qualifies as
   * a tap: single pointer, short duration, minimal movement.
   */
  end(input: TapPointInput): boolean;
  /** Drops tracking for a pointer (pointercancel) — never yields a tap. */
  cancel(pointerId: number): void;
}

interface TrackedPointer {
  x: number;
  y: number;
  timeMs: number;
  tainted: boolean;
}

const DEFAULT_MAX_DURATION_MS = 300;
const DEFAULT_MAX_MOVEMENT_PX = 10;

/** Classifies pointerdown/up pairs as tap vs. drag/pinch/long-press. */
export function createTapClassifier(
  options: TapClassifierOptions = {},
): TapClassifier {
  const maxDurationMs = options.maxDurationMs ?? DEFAULT_MAX_DURATION_MS;
  const maxMovementPx = options.maxMovementPx ?? DEFAULT_MAX_MOVEMENT_PX;
  const tracked = new Map<number, TrackedPointer>();

  function taintAll(): void {
    for (const pointer of tracked.values()) pointer.tainted = true;
  }

  return {
    begin(input: TapPointInput): void {
      const secondPointer = tracked.size > 0;
      if (secondPointer) taintAll();
      tracked.set(input.pointerId, {
        x: input.x,
        y: input.y,
        timeMs: input.timeMs,
        tainted: secondPointer,
      });
    },

    end(input: TapPointInput): boolean {
      const pointer = tracked.get(input.pointerId);
      tracked.delete(input.pointerId);
      if (!pointer || pointer.tainted) return false;
      const duration = input.timeMs - pointer.timeMs;
      if (duration > maxDurationMs) return false;
      const dx = input.x - pointer.x;
      const dy = input.y - pointer.y;
      return dx * dx + dy * dy <= maxMovementPx * maxMovementPx;
    },

    cancel(pointerId: number): void {
      tracked.delete(pointerId);
    },
  };
}
