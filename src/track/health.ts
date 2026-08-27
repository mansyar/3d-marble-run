import { PIECE_TYPE_IDS } from "../pieces/registry";
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
  const goalIds: string[] = [];

  for (const pieceId of bfsParents(graph, rootId).keys()) {
    if (graph.pieces.get(pieceId)?.typeId === "goal-cup") goalIds.push(pieceId);
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

export interface GoalRoute {
  /** The reachable Goal cup this route leads to. */
  goalId: string;
  /** Piece ids from the landing piece through to the Goal cup. */
  pieceIds: string[];
}

/** BFS parent map rooted at `rootId`; insertion order is discovery order. */
function bfsParents(graph: TrackGraph, rootId: string): Map<string, string | null> {
  const parents = new Map<string, string | null>([[rootId, null]]);
  const queue = [rootId];

  while (queue.length > 0) {
    const pieceId = queue.shift();
    if (!pieceId) continue;
    const piece = graph.pieces.get(pieceId);
    if (!piece) continue;

    for (const connection of Object.values(piece.connections)) {
      if (!connection || parents.has(connection.pieceId) || !graph.pieces.has(connection.pieceId))
        continue;
      parents.set(connection.pieceId, pieceId);
      queue.push(connection.pieceId);
    }
  }

  return parents;
}

function parentsToPath(parents: Map<string, string | null>, goalId: string): string[] {
  const path: string[] = [];
  let current: string | null = goalId;
  while (current) {
    path.unshift(current);
    current = parents.get(current) ?? null;
  }
  return path;
}

/** Connector-bearing pieces the Drop-point landing cannot reach — the pieces
 * route guidance should pulse. Portless pieces (bumpers) are exempt, and
 * without a landing piece nothing is highlighted. */
export function unreachableConnectorPieces(
  graph: TrackGraph,
  landingPieceId: string | null,
): string[] {
  if (!landingPieceId || !graph.pieces.has(landingPieceId)) return [];
  const parents = bfsParents(graph, landingPieceId);

  const unreachable: string[] = [];
  for (const piece of graph.pieces.values()) {
    if (parents.has(piece.id)) continue;
    if (PIECE_TYPE_IDS[piece.typeId].ports.length === 0) continue;
    unreachable.push(piece.id);
  }
  return unreachable;
}

/** One piece path per reachable Goal cup, from the landing piece to the cup,
 * in BFS discovery order. Empty without a landing piece or reachable goals. */
export function routePathsToGoals(graph: TrackGraph, landingPieceId: string | null): GoalRoute[] {
  if (!landingPieceId || !graph.pieces.has(landingPieceId)) return [];
  const parents = bfsParents(graph, landingPieceId);

  const routes: GoalRoute[] = [];
  for (const pieceId of parents.keys()) {
    if (graph.pieces.get(pieceId)?.typeId !== "goal-cup") continue;
    routes.push({ goalId: pieceId, pieceIds: parentsToPath(parents, pieceId) });
  }
  return routes;
}
