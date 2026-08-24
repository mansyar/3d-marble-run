import { canConnect, PIECE_TYPE_IDS, type PieceTypeId, type Placement } from "../pieces/registry";

/**
 * Track graph — bookkeeping for placed pieces and their port-to-port
 * connections. Pure logic; rendering and physics read from it but never
 * own it.
 */

export interface ConnectionRef {
  pieceId: string;
  portId: string;
}

export interface PlacedPiece {
  id: string;
  typeId: PieceTypeId;
  placement: Placement;
  /** Keyed by local port id; null when that port is open. */
  connections: Record<string, ConnectionRef | null>;
}

export interface TrackGraph {
  pieces: Map<string, PlacedPiece>;
  nextId: number;
}

export function createTrackGraph(): TrackGraph {
  return { pieces: new Map(), nextId: 1 };
}

function emptyConnections(typeId: PieceTypeId): Record<string, null> {
  const out: Record<string, null> = {};
  for (const p of PIECE_TYPE_IDS[typeId].ports) out[p.id] = null;
  return out;
}

function advanceNextId(g: TrackGraph, id: string): void {
  const match = /^piece-(\d+)$/.exec(id);
  if (!match) return;
  const numericId = Number(match[1]);
  if (Number.isSafeInteger(numericId)) {
    g.nextId = Math.max(g.nextId, numericId + 1);
  }
}

export function addPiece(
  g: TrackGraph,
  typeId: PieceTypeId,
  placement: Placement,
  explicitId?: string,
): string {
  const id = explicitId ?? `piece-${g.nextId}`;
  if (!id || g.pieces.has(id)) throw new Error(`Duplicate piece id: ${id}`);
  if (!explicitId) g.nextId += 1;
  advanceNextId(g, id);
  g.pieces.set(id, {
    id,
    typeId,
    placement: structuredClone(placement),
    connections: emptyConnections(typeId),
  });
  return id;
}

export function getPiece(g: TrackGraph, id: string): PlacedPiece | undefined {
  return g.pieces.get(id);
}

/** Drop every reference OTHER pieces hold toward `id`. */
function detachAll(g: TrackGraph, piece: PlacedPiece): void {
  for (const [portId, ref] of Object.entries(piece.connections)) {
    if (!ref) continue;
    const other = g.pieces.get(ref.pieceId);
    if (other && other.connections[ref.portId]?.pieceId === piece.id) {
      other.connections[ref.portId] = null;
    }
    piece.connections[portId] = null;
  }
}

export function removePiece(g: TrackGraph, id: string): void {
  const piece = g.pieces.get(id);
  if (!piece) return;
  detachAll(g, piece);
  g.pieces.delete(id);
}

/**
 * Moving a piece always detaches its connections — v1 rule: links are only
 * (re-)established by the snapping solver when the move ends.
 */
export function movePiece(g: TrackGraph, id: string, placement: Placement): void {
  const piece = g.pieces.get(id);
  if (!piece) return;
  detachAll(g, piece);
  piece.placement = structuredClone(placement);
}

export function connect(
  g: TrackGraph,
  aId: string,
  aPort: string,
  bId: string,
  bPort: string,
): boolean {
  if (aId === bId) return false;
  const a = g.pieces.get(aId);
  const b = g.pieces.get(bId);
  if (!a || !b) return false;
  const pa = PIECE_TYPE_IDS[a.typeId].ports.find((p) => p.id === aPort);
  const pb = PIECE_TYPE_IDS[b.typeId].ports.find((p) => p.id === bPort);
  if (!pa || !pb) return false;
  if (!canConnect(pa.kind, pb.kind)) return false;
  if (a.connections[aPort] || b.connections[bPort]) return false;
  a.connections[aPort] = { pieceId: bId, portId: bPort };
  b.connections[bPort] = { pieceId: aId, portId: aPort };
  return true;
}

export function disconnect(g: TrackGraph, id: string, portId: string): void {
  const piece = g.pieces.get(id);
  const ref = piece?.connections[portId];
  if (!piece || !ref) return;
  const other = g.pieces.get(ref.pieceId);
  if (other && other.connections[ref.portId]?.pieceId === id) {
    other.connections[ref.portId] = null;
  }
  piece.connections[portId] = null;
}

/**
 * Restore a previously-snapshotted piece exactly, repairing the connection
 * records held by its former partners. Used by DeleteCommand.revert.
 */
export function restorePiece(g: TrackGraph, snapshot: PlacedPiece): void {
  const clone: PlacedPiece = structuredClone(snapshot);
  if (g.pieces.has(clone.id)) throw new Error(`Piece already exists: ${clone.id}`);

  const piecePorts = PIECE_TYPE_IDS[clone.typeId].ports;
  if (
    Object.keys(clone.connections).length !== piecePorts.length ||
    piecePorts.some((port) => !Object.hasOwn(clone.connections, port.id)) ||
    Object.keys(clone.connections).some((portId) => !piecePorts.some((port) => port.id === portId))
  ) {
    throw new Error("Cannot restore piece with malformed connections");
  }

  const targetPorts = new Set<string>();
  for (const [localPort, ref] of Object.entries(clone.connections)) {
    if (!ref) continue;
    const localPortDef = piecePorts.find((port) => port.id === localPort);
    const other = g.pieces.get(ref.pieceId);
    const otherPortDef = other
      ? PIECE_TYPE_IDS[other.typeId].ports.find((port) => port.id === ref.portId)
      : undefined;
    const targetKey = `${ref.pieceId}:${ref.portId}`;
    if (
      !localPortDef ||
      !other ||
      !otherPortDef ||
      !canConnect(localPortDef.kind, otherPortDef.kind) ||
      !Object.hasOwn(other.connections, ref.portId) ||
      targetPorts.has(targetKey) ||
      (other.connections[ref.portId] !== null &&
        (other.connections[ref.portId]?.pieceId !== clone.id ||
          other.connections[ref.portId]?.portId !== localPort))
    ) {
      throw new Error("Cannot restore piece with conflicting connections");
    }
    targetPorts.add(targetKey);
  }

  g.pieces.set(clone.id, clone);
  for (const [localPort, ref] of Object.entries(clone.connections)) {
    if (!ref) continue;
    const other = g.pieces.get(ref.pieceId);
    if (other) {
      other.connections[ref.portId] = { pieceId: clone.id, portId: localPort };
    }
  }
  advanceNextId(g, clone.id);
}
