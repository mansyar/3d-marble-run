import type { Vec3 } from "../pieces/registry";

/** Fixed height used for the free, overhead marble entry point. */
export const DROP_POINT_HEIGHT = 4;

/** X/Z extent of the playable table for free Drop point placement. */
const DROP_POINT_LIMIT = 20;

export interface DropPoint {
  position: Vec3;
}

/** Validate the coordinates controlled by free X/Z placement. */
export function isValidDropPointPosition(position: Vec3): boolean {
  return (
    Number.isFinite(position[0]) &&
    Number.isFinite(position[2]) &&
    Math.abs(position[0]) <= DROP_POINT_LIMIT &&
    Math.abs(position[2]) <= DROP_POINT_LIMIT
  );
}

/** Create a normalized Drop point, or null when no point should be active. */
export function createDropPoint(position: Vec3 | null): DropPoint | null {
  if (!position || !isValidDropPointPosition(position)) return null;
  return { position: [position[0], DROP_POINT_HEIGHT, position[2]] };
}

/** Replace the single active point without mutating either input value. */
export function replaceDropPoint(
  currentPoint: DropPoint | null,
  position: Vec3 | null,
): DropPoint | null {
  // Replacement always normalizes a fresh value; the prior point is not mutated.
  void currentPoint;
  return createDropPoint(position);
}
