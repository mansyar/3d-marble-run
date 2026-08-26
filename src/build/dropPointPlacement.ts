import type { Command } from "../core/commandStack";
import type { EditorHistory } from "../core/editorHistory";
import type { Vec3 } from "../pieces/registry";
import { createDropPoint, type DropPoint } from "../track/dropPoint";

export interface DropPointState {
  point: DropPoint | null;
}

export interface DropPointEditor {
  place: (position: Vec3) => boolean;
  delete: () => boolean;
  undo: () => boolean;
  redo: () => boolean;
}

function clonePoint(point: DropPoint | null): DropPoint | null {
  return point ? { position: [...point.position] as Vec3 } : null;
}

class SetDropPointCommand implements Command<DropPointState> {
  constructor(
    private readonly before: DropPoint | null,
    private readonly after: DropPoint | null,
  ) {}

  apply(state: DropPointState): void {
    state.point = clonePoint(this.after);
  }

  revert(state: DropPointState): void {
    state.point = clonePoint(this.before);
  }
}

export function createDropPointState(point: DropPoint | null = null): DropPointState {
  return { point: clonePoint(point) };
}

/** Edit the separate Drop point setting without receiving or mutating a graph. */
export function createDropPointEditor(
  state: DropPointState,
  history: EditorHistory,
): DropPointEditor {
  return {
    place(position) {
      const next = createDropPoint(position);
      if (!next) return false;
      history.execute(state, new SetDropPointCommand(state.point, next));
      return true;
    },
    delete() {
      if (!state.point) return false;
      history.execute(state, new SetDropPointCommand(state.point, null));
      return true;
    },
    undo: () => history.undo(),
    redo: () => history.redo(),
  };
}
