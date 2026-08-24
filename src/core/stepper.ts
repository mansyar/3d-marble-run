export interface StepResult {
  /** Number of fixed-delta simulation steps to run this frame. */
  steps: number;
  /** Fractional remainder [0..1) of a fixed delta left after stepping; used for render interpolation. */
  alpha: number;
}

export interface Stepper {
  /**
   * Feed real elapsed time (ms) for one frame; receive how many fixed
   * steps to simulate and the interpolation alpha for rendering.
   * Backlog beyond maxSubSteps is discarded to prevent spiral-of-death.
   */
  advance(elapsedMs: number): StepResult;
}

/**
 * Creates an accumulator-based fixed-timestep stepper.
 *
 * @param fixedDtMs Fixed simulation delta in milliseconds (e.g. 1000/60).
 * @param maxSubSteps Maximum steps per frame before the backlog is discarded.
 */
export function createStepper(fixedDtMs: number, maxSubSteps: number): Stepper {
  let acc = 0;

  return {
    advance(elapsedMs: number): StepResult {
      if (!(elapsedMs > 0)) {
        return { steps: 0, alpha: 0 };
      }

      acc += elapsedMs;
      const steps = Math.floor(acc / fixedDtMs);

      if (steps >= maxSubSteps) {
        acc = 0;
        return { steps: maxSubSteps, alpha: 0 };
      }

      acc -= steps * fixedDtMs;
      return { steps, alpha: acc / fixedDtMs };
    },
  };
}
