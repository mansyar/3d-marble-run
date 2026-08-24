import type { Command } from "../core/commandStack";
import type { PieceTypeId, Placement } from "../pieces/registry";
import {
  addPiece,
  connect,
  movePiece,
  type PlacedPiece,
  removePiece,
  restorePiece,
  type TrackGraph,
} from "./graph";

export interface SnapConnection {
  targetPieceId: string;
  targetPortId: string;
  dragPortId: string;
}

/** Place a brand-new piece (id chosen up-front so UI can track it). */
export class PlaceCommand implements Command<TrackGraph> {
  constructor(
    private readonly id: string,
    private readonly typeId: PieceTypeId,
    private readonly placement: Placement,
    private readonly connection?: SnapConnection,
  ) {}

  apply(g: TrackGraph): void {
    addPiece(g, this.typeId, this.placement, this.id);
    if (this.connection) {
      connect(
        g,
        this.id,
        this.connection.dragPortId,
        this.connection.targetPieceId,
        this.connection.targetPortId,
      );
    }
  }

  revert(g: TrackGraph): void {
    removePiece(g, this.id);
  }
}

/** Move an existing piece; graph detaches links on both transitions. */
export class MoveCommand implements Command<TrackGraph> {
  constructor(
    private readonly id: string,
    private readonly before: Placement,
    private readonly after: Placement,
  ) {}

  apply(g: TrackGraph): void {
    movePiece(g, this.id, this.after);
  }

  revert(g: TrackGraph): void {
    movePiece(g, this.id, this.before);
  }
}

/**
 * Delete a piece. Snapshot is taken while the piece is still live so
 * revert can fully restore it — including partners' connection records.
 */
export class DeleteCommand implements Command<TrackGraph> {
  private readonly snapshot: PlacedPiece;

  constructor(
    private readonly id: string,
    snapshot: PlacedPiece,
  ) {
    // Deep-clone: the live object is mutated by removePiece before deletion.
    this.snapshot = structuredClone(snapshot);
  }

  apply(g: TrackGraph): void {
    removePiece(g, this.id);
  }

  revert(g: TrackGraph): void {
    restorePiece(g, this.snapshot);
  }
}
