import type { Vec3 } from "../pieces/registry";

export interface PlayableBounds {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

/** World-space safety envelope for active marbles in an editable track. */
export const PLAYABLE_BOUNDS: PlayableBounds = {
  min: [-20, -8, -20],
  max: [20, 20, 20],
};

export interface MarblePosition {
  readonly id: number;
  readonly position: Vec3;
}

export type PlayablePositionStatus = "inside" | "out-of-bounds" | "invalid-boundary";

function hasValidBounds(bounds: PlayableBounds): boolean {
  return bounds.min.every(
    (value, index) =>
      Number.isFinite(value) && Number.isFinite(bounds.max[index]) && value < bounds.max[index],
  );
}

/** Classify a world position against the configured safety envelope. */
export function classifyPlayablePosition(
  position: Vec3,
  bounds: PlayableBounds = PLAYABLE_BOUNDS,
): PlayablePositionStatus {
  if (!hasValidBounds(bounds)) return "invalid-boundary";
  return position.every((value, index) => value >= bounds.min[index] && value <= bounds.max[index])
    ? "inside"
    : "out-of-bounds";
}

/** Return active marble IDs that have left the playable world envelope. */
export function findOutOfBoundsMarbleIds(
  marbles: Iterable<MarblePosition>,
  bounds: PlayableBounds = PLAYABLE_BOUNDS,
): number[] {
  if (classifyPlayablePosition([0, 0, 0], bounds) === "invalid-boundary") return [];
  return [...marbles]
    .filter(({ position }) => classifyPlayablePosition(position, bounds) === "out-of-bounds")
    .map(({ id }) => id);
}
