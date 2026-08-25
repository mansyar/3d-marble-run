import { Ray, type World } from "@dimforge/rapier3d-compat";
import type { Vec3 } from "../pieces/registry";
import { DROP_POINT_HEIGHT, type DropPoint, isValidDropPointPosition } from "../track/dropPoint";

/** Maximum downward distance searched for a physical landing surface. */
export const LANDING_RAY_LENGTH = 20;

/** Minimum upward normal component accepted as a marble landing surface. */
const MIN_UPWARD_NORMAL_Y = 0.7;

export interface LandingHit {
  distance: number;
  normal: Vec3;
  pieceId: string;
}

export type LandingStatus = "ready" | "no-landing" | "invalid-position";

export interface LandingResult {
  status: LandingStatus;
  position: Vec3 | null;
  normal: Vec3 | null;
  distance: number | null;
  pieceId: string | null;
}

function emptyResult(status: Exclude<LandingStatus, "ready">): LandingResult {
  return { status, position: null, normal: null, distance: null, pieceId: null };
}

/** Choose the nearest finite hit whose surface faces sufficiently upward. */
export function selectLandingHit(hits: readonly LandingHit[]): LandingHit | null {
  let best: LandingHit | null = null;
  for (const hit of hits) {
    if (
      !Number.isFinite(hit.distance) ||
      hit.distance < 0 ||
      !hit.normal.every(Number.isFinite) ||
      hit.normal[1] < MIN_UPWARD_NORMAL_Y
    ) {
      continue;
    }
    if (!best || hit.distance < best.distance) best = hit;
  }
  return best;
}

/**
 * Cast down from the active Drop point and return the nearest mapped track
 * surface. Collider ownership is supplied by the runtime so non-track bodies
 * and unmapped helper colliders cannot make a point appear ready.
 */
export function resolveLanding(
  world: World,
  point: DropPoint | null,
  trackBodies: ReadonlyMap<number, string>,
): LandingResult {
  if (!point) return emptyResult("no-landing");
  const [x, y, z] = point.position;
  if (!isValidDropPointPosition(point.position) || !Number.isFinite(y) || y !== DROP_POINT_HEIGHT) {
    return emptyResult("invalid-position");
  }

  const ray = new Ray({ x, y, z }, { x: 0, y: -1, z: 0 });
  const hits: LandingHit[] = [];
  world.intersectionsWithRay(ray, LANDING_RAY_LENGTH, true, (intersection) => {
    const parent = intersection.collider.parent();
    const pieceId = parent ? trackBodies.get(parent.handle) : undefined;
    if (pieceId) {
      hits.push({
        distance: intersection.timeOfImpact,
        normal: [intersection.normal.x, intersection.normal.y, intersection.normal.z],
        pieceId,
      });
    }
    return true;
  });

  const landing = selectLandingHit(hits);
  if (!landing) return emptyResult("no-landing");
  return {
    status: "ready",
    position: [x, y - landing.distance, z],
    normal: landing.normal,
    distance: landing.distance,
    pieceId: landing.pieceId,
  };
}
