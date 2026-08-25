import { canConnect, PIECE_TYPE_IDS, type PieceTypeId, type Placement } from "../pieces/registry";
import {
  createDropPoint,
  DROP_POINT_HEIGHT,
  type DropPoint,
  isValidDropPointPosition,
} from "./dropPoint";
import { type ConnectionRef, type PlacedPiece, removePiece, type TrackGraph } from "./graph";

export const TRACK_FORMAT_VERSION = 2;
export const LEGACY_TRACK_FORMAT_VERSION = 1;

export interface TrackDocument {
  graph: TrackGraph;
  dropPoint: DropPoint | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isVec3(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((component) => isFiniteNumber(component))
  );
}

function isPieceTypeId(value: unknown): value is PieceTypeId {
  return (
    value === "straight" ||
    value === "curve" ||
    value === "ramp" ||
    value === "funnel" ||
    value === "goal-cup" ||
    value === "start-gate"
  );
}

function parsePlacement(value: unknown): Placement {
  if (!isRecord(value) || !isVec3(value.position) || !isFiniteNumber(value.yawDeg)) {
    throw new Error("Malformed placement in track save");
  }
  return { position: value.position, yawDeg: value.yawDeg };
}

function isConnectionRef(value: unknown): value is ConnectionRef {
  return (
    isRecord(value) &&
    typeof value.pieceId === "string" &&
    value.pieceId.length > 0 &&
    typeof value.portId === "string" &&
    value.portId.length > 0
  );
}

function parseDropPoint(value: unknown): DropPoint | null {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    Object.keys(value).length !== 1 ||
    !Object.hasOwn(value, "position") ||
    !isVec3(value.position) ||
    value.position[1] !== DROP_POINT_HEIGHT ||
    !isValidDropPointPosition(value.position)
  ) {
    throw new Error("Malformed Drop point in track save");
  }
  const dropPoint = createDropPoint(value.position);
  if (!dropPoint) throw new Error("Malformed Drop point in track save");
  return dropPoint;
}

function parseConnections(
  value: unknown,
  typeId: PieceTypeId,
): Record<string, ConnectionRef | null> {
  if (!isRecord(value)) throw new Error("Malformed connections in track save");
  const ports = PIECE_TYPE_IDS[typeId].ports;
  if (
    Object.keys(value).length !== ports.length ||
    Object.keys(value).some((key) => !ports.some((port) => port.id === key))
  ) {
    throw new Error("Malformed connections in track save");
  }

  const connections: Record<string, ConnectionRef | null> = {};
  for (const port of ports) {
    if (!Object.hasOwn(value, port.id)) throw new Error("Malformed connections in track save");
    const raw = value[port.id];
    if (raw === null) {
      connections[port.id] = null;
    } else if (isConnectionRef(raw)) {
      connections[port.id] = { pieceId: raw.pieceId, portId: raw.portId };
    } else {
      throw new Error("Malformed connections in track save");
    }
  }
  return connections;
}

function parsePiece(value: unknown): PlacedPiece {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.length === 0) {
    throw new Error("Malformed piece in track save");
  }
  if (!isPieceTypeId(value.typeId)) throw new Error("Unknown piece type in track save");
  return {
    id: value.id,
    typeId: value.typeId,
    placement: parsePlacement(value.placement),
    connections: parseConnections(value.connections, value.typeId),
  };
}

function validateConnections(graph: TrackGraph): void {
  for (const piece of graph.pieces.values()) {
    const piecePorts = PIECE_TYPE_IDS[piece.typeId].ports;
    for (const [portId, connection] of Object.entries(piece.connections)) {
      if (!connection) continue;
      const localPort = piecePorts.find((port) => port.id === portId);
      const other = graph.pieces.get(connection.pieceId);
      const otherPort = other
        ? PIECE_TYPE_IDS[other.typeId].ports.find((port) => port.id === connection.portId)
        : undefined;
      const reverse = other?.connections[connection.portId];
      if (
        !localPort ||
        !other ||
        !otherPort ||
        !canConnect(localPort.kind, otherPort.kind) ||
        !reverse ||
        reverse.pieceId !== piece.id ||
        reverse.portId !== portId
      ) {
        throw new Error("Invalid connection in track save");
      }
    }
  }
}

/** Convert the graph and optional Drop point to a stable save payload. */
export function serializeTrack(graph: TrackGraph, dropPoint: DropPoint | null = null): string {
  const normalizedDropPoint = parseDropPoint(dropPoint);
  const payload = {
    version: TRACK_FORMAT_VERSION,
    nextId: graph.nextId,
    pieces: [...graph.pieces.values()].map((piece) => structuredClone(piece)),
    dropPoint: normalizedDropPoint,
  };
  return JSON.stringify(payload);
}

function parseGraph(payload: Record<string, unknown>): TrackGraph {
  const nextId = payload.nextId;
  const pieces = payload.pieces;
  if (
    typeof nextId !== "number" ||
    !Number.isSafeInteger(nextId) ||
    nextId < 1 ||
    !Array.isArray(pieces)
  ) {
    throw new Error("Unsupported or malformed track save");
  }

  const graph: TrackGraph = { pieces: new Map(), nextId };
  const ids = new Set<string>();
  for (const rawPiece of pieces) {
    const piece = parsePiece(rawPiece);
    if (ids.has(piece.id)) throw new Error("Duplicate piece id in track save");
    if (
      piece.typeId === "start-gate" &&
      [...graph.pieces.values()].some((item) => item.typeId === "start-gate")
    ) {
      throw new Error("Multiple start gates in track save");
    }
    ids.add(piece.id);
    graph.pieces.set(piece.id, piece);
  }
  validateConnections(graph);
  return graph;
}

function migrateLegacyDropPoint(graph: TrackGraph): DropPoint | null {
  const startGate = [...graph.pieces.values()].find((piece) => piece.typeId === "start-gate");
  if (!startGate) return null;
  const dropPoint = createDropPoint(startGate.placement.position);
  if (!dropPoint) throw new Error("Invalid legacy Start gate position");
  removePiece(graph, startGate.id);
  validateConnections(graph);
  return dropPoint;
}

/** Restore a graph and Drop point from a versioned save payload. */
export function deserializeTrackDocument(serialized: string): TrackDocument {
  const payload: unknown = JSON.parse(serialized);
  if (!isRecord(payload)) throw new Error("Unsupported or malformed track save");
  if (payload.version !== TRACK_FORMAT_VERSION && payload.version !== LEGACY_TRACK_FORMAT_VERSION) {
    throw new Error("Unsupported or malformed track save");
  }
  const graph = parseGraph(payload);
  if (payload.version === LEGACY_TRACK_FORMAT_VERSION) {
    if (Object.hasOwn(payload, "dropPoint") || Object.hasOwn(payload, "dropPoints")) {
      throw new Error("Malformed Drop point in track save");
    }
    return { graph, dropPoint: migrateLegacyDropPoint(graph) };
  }
  if (!Object.hasOwn(payload, "dropPoint") || Object.hasOwn(payload, "dropPoints")) {
    throw new Error("Malformed Drop point in track save");
  }
  return { graph, dropPoint: parseDropPoint(payload.dropPoint) };
}

/** Restore an independent graph from a versioned save payload. */
export function deserializeTrack(serialized: string): TrackGraph {
  return deserializeTrackDocument(serialized).graph;
}
