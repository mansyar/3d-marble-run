import type { DropPoint } from "./dropPoint";
import type { TrackGraph } from "./graph";

export type DropPointHealthStatus =
  | "missing-drop-point"
  | "no-landing"
  | "no-connected-goal"
  | "ready";

export interface DropPointHealth {
  status: DropPointHealthStatus;
  reachableGoalIds: string[];
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
