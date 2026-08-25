import type { DropPoint } from "./dropPoint";
import type { PlacedPiece, TrackGraph } from "./graph";

export type TrackHealthStatus = "missing-start" | "no-connected-goal" | "ready";

export interface TrackHealth {
  status: TrackHealthStatus;
  reachableGoalIds: string[];
}

export type DropPointHealthStatus =
  | "missing-drop-point"
  | "no-landing"
  | "no-connected-goal"
  | "ready";

export interface DropPointHealth {
  status: DropPointHealthStatus;
  reachableGoalIds: string[];
}

/** Return the track's single start gate, when one has been placed. */
export function getStartGate(graph: TrackGraph): PlacedPiece | undefined {
  return [...graph.pieces.values()].find((piece) => piece.typeId === "start-gate");
}

function reachableGoalIds(graph: TrackGraph, rootId: string): string[] {
  if (!graph.pieces.has(rootId)) return [];
  const visited = new Set<string>([rootId]);
  const queue = [rootId];
  const goalIds: string[] = [];

  while (queue.length > 0) {
    const pieceId = queue.shift();
    if (!pieceId) continue;
    const piece = graph.pieces.get(pieceId);
    if (!piece) continue;
    if (piece.typeId === "goal-cup") goalIds.push(piece.id);

    for (const connection of Object.values(piece.connections)) {
      if (!connection || visited.has(connection.pieceId) || !graph.pieces.has(connection.pieceId))
        continue;
      visited.add(connection.pieceId);
      queue.push(connection.pieceId);
    }
  }

  return goalIds;
}

/** Assess route guidance from the physical piece beneath the Drop point. */
export function assessDropPointHealth(
  graph: TrackGraph,
  point: DropPoint | null,
  landingPieceId: string | null,
): DropPointHealth {
  if (!point) return { status: "missing-drop-point", reachableGoalIds: [] };
  if (!landingPieceId || !graph.pieces.has(landingPieceId)) {
    return { status: "no-landing", reachableGoalIds: [] };
  }

  const goalIds = reachableGoalIds(graph, landingPieceId);
  return {
    status: goalIds.length > 0 ? "ready" : "no-connected-goal",
    reachableGoalIds: goalIds,
  };
}

/**
 * Assess graph connectivity from the start gate to goal cups.
 *
 * This is intentionally a connection-graph check, not a physics solvability
 * proof. Players may continue experimenting with incomplete layouts.
 */
export function assessTrackHealth(graph: TrackGraph): TrackHealth {
  const start = getStartGate(graph);
  if (!start) return { status: "missing-start", reachableGoalIds: [] };

  const goalIds = reachableGoalIds(graph, start.id);

  return {
    status: goalIds.length > 0 ? "ready" : "no-connected-goal",
    reachableGoalIds: goalIds,
  };
}
