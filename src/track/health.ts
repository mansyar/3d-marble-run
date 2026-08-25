import type { PlacedPiece, TrackGraph } from "./graph";

export type TrackHealthStatus = "missing-start" | "no-connected-goal" | "ready";

export interface TrackHealth {
  status: TrackHealthStatus;
  reachableGoalIds: string[];
}

/** Return the track's single start gate, when one has been placed. */
export function getStartGate(graph: TrackGraph): PlacedPiece | undefined {
  return [...graph.pieces.values()].find((piece) => piece.typeId === "start-gate");
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

  const visited = new Set<string>([start.id]);
  const queue = [start.id];
  const reachableGoalIds: string[] = [];

  while (queue.length > 0) {
    const pieceId = queue.shift();
    if (!pieceId) continue;
    const piece = graph.pieces.get(pieceId);
    if (!piece) continue;
    if (piece.typeId === "goal-cup") reachableGoalIds.push(piece.id);

    for (const connection of Object.values(piece.connections)) {
      if (!connection || visited.has(connection.pieceId) || !graph.pieces.has(connection.pieceId))
        continue;
      visited.add(connection.pieceId);
      queue.push(connection.pieceId);
    }
  }

  return {
    status: reachableGoalIds.length > 0 ? "ready" : "no-connected-goal",
    reachableGoalIds,
  };
}
