import type { PieceTypeId } from "../pieces/registry";
import type { TrackGraph } from "../track/graph";
import { getStartGate } from "../track/health";

/** Whether a new piece can be started from the tray without violating rules. */
export function canPlacePiece(graph: TrackGraph, typeId: PieceTypeId): boolean {
  return typeId !== "start-gate" || !getStartGate(graph);
}
