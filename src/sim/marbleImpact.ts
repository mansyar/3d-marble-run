/**
 * Vertical velocity (m/s) below which a marble is unambiguously in free fall.
 */
export const FALLING_VY = -0.5;

/**
 * Vertical velocity (m/s) above which a marble is considered to have made
 * track contact (free fall has been broken).
 */
export const LANDED_VY = -0.2;

/** One vertical-velocity sample for one marble. */
export interface MarbleVelocitySample {
  id: number;
  vy: number;
}

export interface MarbleImpactTracker {
  /**
   * Feed per-marble vertical velocities; returns the ids of marbles that
   * just landed for the first time since they started falling.
   */
  updateVelocities(samples: readonly MarbleVelocitySample[]): number[];
  /** Forget a marble (removed/recycled) so its tracking begins anew. */
  remove(id: number): void;
  /** Forget every marble. */
  reset(): void;
}

/**
 * Detects each marble's first track contact from pure velocity samples,
 * so one `landing` sound can fire per spawned marble. A marble must be
 * observed falling (vy below `FALLING_VY`) before a transition to landed
 * (vy at or above `LANDED_VY`) counts as a landing; bounces never re-fire.
 */
export function createMarbleImpactTracker(): MarbleImpactTracker {
  const states = new Map<number, "airborne" | "landed">();

  return {
    updateVelocities(samples) {
      const landed: number[] = [];
      for (const { id, vy } of samples) {
        const state = states.get(id);
        if (vy >= LANDED_VY) {
          if (state === "airborne") {
            states.set(id, "landed");
            landed.push(id);
          }
        } else if (vy < FALLING_VY && state !== "landed") {
          states.set(id, "airborne");
        }
      }
      return landed;
    },
    remove(id) {
      states.delete(id);
    },
    reset() {
      states.clear();
    },
  };
}
