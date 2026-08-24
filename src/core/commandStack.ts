/**
 * Generic undo/redo command stack. Context-agnostic: callers supply their
 * own context object (e.g. the TrackGraph) on every call, keeping the stack
 * serializable and testable in isolation.
 */

export interface Command<C> {
  apply(ctx: C): void;
  revert(ctx: C): void;
}

export interface CommandStack<C> {
  execute(ctx: C, command: Command<C>): void;
  undo(ctx: C): boolean;
  redo(ctx: C): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
}

export function createCommandStack<C>(): CommandStack<C> {
  const undoStack: Command<C>[] = [];
  const redoStack: Command<C>[] = [];

  return {
    execute(ctx, command) {
      command.apply(ctx);
      undoStack.push(command);
      redoStack.length = 0; // new work invalidates the redo tail
    },
    undo(ctx) {
      const command = undoStack.pop();
      if (!command) return false;
      command.revert(ctx);
      redoStack.push(command);
      return true;
    },
    redo(ctx) {
      const command = redoStack.pop();
      if (!command) return false;
      command.apply(ctx);
      undoStack.push(command);
      return true;
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
  };
}
