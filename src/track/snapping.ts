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

interface Candidate {
  distSq: number;
  /** False when the target port is already taken — near-miss, not a snap. */
  free: boolean;
  placement: Placement;
  targetPieceId: string;
  targetPortId: string;
  dragPortId: string;
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
const MAX_ALIGN_DEG = 150;

function isVertical(direction: Vec3): boolean {
  return Math.abs(direction[1]) > VERTICAL_EPSILON;
}

/**
 * Scans every drag-port × target-port pair within threshold that is
 * geometrically joinable (compatible kinds facing each other), regardless of
 * whether the target port is free. Consumers filter by the `free` flag.
 */
function* scanCandidates(
  graph: TrackGraph,
  query: SnapQuery,
  excludePieceId?: string,
): Generator<Candidate> {
  const dragDef = PIECE_TYPE_IDS[query.typeId];
  for (const dragPort of dragDef.ports) {
    const dragWorld = getWorldPort(query.placement, query.typeId, dragPort.id);
    for (const piece of graph.pieces.values()) {
      if (piece.id === excludePieceId) continue;
      const def = PIECE_TYPE_IDS[piece.typeId];
      for (const port of def.ports) {
        const free = !piece.connections[port.id];
        if (!canConnect(dragPort.kind, port.kind)) continue;
        const targetWorld = getWorldPort(piece.placement, piece.typeId, port.id);
        // Compute the yaw that would face the drag port against the target,
        // then verify opposition under that aligned yaw. Gating before
        // alignment made snaps depend on the user's arbitrary drag yaw; a
        // correction cap rejects 180° back-jams that would overlap track.
        const desired: Vec3 = [
          -targetWorld.direction[0],
          -targetWorld.direction[1],
          -targetWorld.direction[2],
        ];
        let deltaDeg = ((heading(desired) - heading(dragWorld.direction)) * 180) / Math.PI;
        deltaDeg = (((deltaDeg % 360) + 540) % 360) - 180;
        const dragVertical = isVertical(dragWorld.direction);
        const targetVertical = isVertical(targetWorld.direction);
        const horizontal = !dragVertical && !targetVertical;
        const crossAxis = dragVertical !== targetVertical;
        if (horizontal && Math.abs(deltaDeg) > MAX_ALIGN_DEG) continue;
        const yaw = horizontal ? query.placement.yawDeg + deltaDeg : query.placement.yawDeg;
        const alignedDir = rotateY(dragPort.direction, yaw);
        // Funnel mouth/spout ↔ run transitions intentionally join a vertical
        // port to a horizontal one. There is no opposing direction to test
        // in that case; the compatible port kinds are the validity gate.
        if (!crossAxis && dot3(alignedDir, targetWorld.direction) > -VERTICAL_EPSILON) {
          continue;
        }
        const rotatedOffset = rotateY(dragPort.position, yaw);
        const origin: Vec3 = [
          targetWorld.position[0] - rotatedOffset[0],
          targetWorld.position[1] - rotatedOffset[1],
          targetWorld.position[2] - rotatedOffset[2],
        ];
        // Compare the CURSOR against the piece's resting origin in XZ only.
        // The drag glides on the table plane, so height differences (funnel
        // onto cup inlet, pieces onto raised ramp ends) must not block snaps.
        const dx = query.placement.position[0] - origin[0];
        const dz = query.placement.position[2] - origin[2];
        const dSq = dx * dx + dz * dz;
        if (dSq > SNAP_DISTANCE * SNAP_DISTANCE) continue;
        yield {
          distSq: dSq,
          free,
          placement: { position: origin, yawDeg: yaw },
          targetPieceId: piece.id,
          targetPortId: port.id,
          dragPortId: dragPort.id,
        };
      }
    }
  }
}

function toResult(candidate: Candidate): SnapResult {
  return {
    placement: candidate.placement,
    targetPieceId: candidate.targetPieceId,
    targetPortId: candidate.targetPortId,
    dragPortId: candidate.dragPortId,
  };
}

/** Nearest valid snap, or null when nothing fits. */
export function findSnap(
  graph: TrackGraph,
  query: SnapQuery,
  excludePieceId?: string,
): SnapResult | null {
  let best: Candidate | null = null;
  for (const c of scanCandidates(graph, query, excludePieceId)) {
    if (!c.free) continue;
    if (!best || c.distSq < best.distSq) best = c;
  }
  return best ? toResult(best) : null;
}

/**
 * Ghost validity: does this drag end in a snap, hover over an occupied
 * junction (blocked → red ghost), or sit in open space (free placement)?
 */
export type SnapClassification =
  | { status: "snap"; snap: SnapResult }
  | { status: "blocked" }
  | { status: "free"; placement: Placement };

export function classifySnap(
  graph: TrackGraph,
  query: SnapQuery,
  excludePieceId?: string,
): SnapClassification {
  let best: Candidate | null = null;
  for (const c of scanCandidates(graph, query, excludePieceId)) {
    if (!best || c.distSq < best.distSq) best = c;
  }
  if (!best) return { status: "free", placement: query.placement };
  return best.free ? { status: "snap", snap: toResult(best) } : { status: "blocked" };
}
