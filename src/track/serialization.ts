import { PIECE_TYPE_IDS, type PieceTypeId, type Placement } from "../pieces/registry";
import type { PlacedPiece, TrackGraph } from "./graph";

export const TRACK_FORMAT_VERSION = 1;

interface SerializedTrack {
  version: number;
  nextId: number;
  pieces: PlacedPiece[];
}

/** Convert the in-memory graph to a stable, JSON-friendly save payload. */
export function serializeTrack(graph: TrackGraph): string {
  const payload: SerializedTrack = {
    version: TRACK_FORMAT_VERSION,
    nextId: graph.nextId,
    pieces: [...graph.pieces.values()].map((piece) => structuredClone(piece)),
  };
  return JSON.stringify(payload);
}

/** Restore an independent graph from a versioned save payload. */
export function deserializeTrack(serialized: string): TrackGraph {
  const payload = JSON.parse(serialized) as SerializedTrack;
  if (
    payload.version !== TRACK_FORMAT_VERSION ||
    !Number.isInteger(payload.nextId) ||
    payload.nextId < 1 ||
    !Array.isArray(payload.pieces)
  ) {
    throw new Error("Unsupported or malformed track save");
  }

  const graph: TrackGraph = { pieces: new Map(), nextId: payload.nextId };
  for (const piece of payload.pieces) {
    if (!PIECE_TYPE_IDS[piece.typeId]) throw new Error("Unknown piece type in track save");
    graph.pieces.set(piece.id, {
      id: piece.id,
      typeId: piece.typeId as PieceTypeId,
      placement: structuredClone(piece.placement) as Placement,
      connections: structuredClone(piece.connections),
    });
  }
  return graph;
}
