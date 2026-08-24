import type { Vec3 } from "../pieces/registry";
import {
  canConnect,
  getWorldPort,
  PIECE_TYPE_IDS,
  type PieceTypeId,
  type Placement,
  rotateY,
} from "../pieces/registry";
import type { TrackGraph } from "./graph";

/**
 * Snapping solver — decides whether and where a dragged piece should click
 * into the existing track. Pure math over the track graph.
 */

export const SNAP_DISTANCE = 0.25;

/** Direction vectors whose |y| exceeds this are treated as vertical joins. */
const VERTICAL_EPSILON = 0.9;

export interface SnapQuery {
  typeId: PieceTypeId;
  /** The dragged piece's current free-form transform. */
  placement: Placement;
}

export interface SnapResult {
  /** Placement the dragged piece should take so ports coincide. */
  placement: Placement;
  targetPieceId: string;
  targetPortId: string;
  dragPortId: string;
}

interface Candidate extends SnapResult {
  distSq: number;
}

function distSq(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function heading(v: Vec3): number {
  return Math.atan2(v[0], v[2]);
}

/**
 * Yaw (degrees) that rotates `current` onto `desired`. Vertical joins keep
 * the drag's original yaw — any spin looks equivalent from above.
 */
function alignYaw(current: Vec3, desired: Vec3, fallbackYawDeg: number): number {
  if (Math.abs(current[1]) > VERTICAL_EPSILON || Math.abs(desired[1]) > VERTICAL_EPSILON) {
    return fallbackYawDeg;
  }
  const d = heading(desired) - heading(current);
  return fallbackYawDeg + (d * 180) / Math.PI;
}

export function findSnap(
  graph: TrackGraph,
  query: SnapQuery,
  excludePieceId?: string,
): SnapResult | null {
  const dragDef = PIECE_TYPE_IDS[query.typeId];
  let best: Candidate | null = null;

  for (const dragPort of dragDef.ports) {
    const dragWorld = getWorldPort(query.placement, query.typeId, dragPort.id);
    for (const piece of graph.pieces.values()) {
      if (piece.id === excludePieceId) continue;
      const def = PIECE_TYPE_IDS[piece.typeId];
      for (const port of def.ports) {
        if (piece.connections[port.id]) continue; // occupied
        if (!canConnect(dragPort.kind, port.kind)) continue;
        const targetWorld = getWorldPort(piece.placement, piece.typeId, port.id);
        const dSq = distSq(dragWorld.position, targetWorld.position);
        if (dSq > SNAP_DISTANCE * SNAP_DISTANCE) continue;
        // Ports must face each other: directions oppose.
        if (dot3(dragWorld.direction, targetWorld.direction) > -VERTICAL_EPSILON) {
          continue;
        }
        const yaw = alignYaw(
          dragWorld.direction,
          [-targetWorld.direction[0], -targetWorld.direction[1], -targetWorld.direction[2]] as Vec3,
          query.placement.yawDeg,
        );
        const rotatedOffset = rotateY(dragPort.position, yaw);
        const placement: Placement = {
          position: [
            targetWorld.position[0] - rotatedOffset[0],
            targetWorld.position[1] - rotatedOffset[1],
            targetWorld.position[2] - rotatedOffset[2],
          ],
          yawDeg: yaw,
        };
        if (!best || dSq < best.distSq) {
          best = {
            distSq: dSq,
            placement,
            targetPieceId: piece.id,
            targetPortId: port.id,
            dragPortId: dragPort.id,
          };
        }
      }
    }
  }
  if (!best) return null;
  const { distSq: _ignored, ...result } = best;
  void _ignored;
  return result;
}
