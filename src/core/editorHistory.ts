import { type Command, createCommandStack } from "./commandStack";

/**
 * A single undo/redo timeline for commands that may belong to different
 * editor domains. Each command captures its domain context when executed.
 */
export interface EditorHistory {
  execute<C>(ctx: C, command: Command<C>): void;
  undo(): boolean;
  redo(): boolean;
  clear(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

export function createEditorHistory(): EditorHistory {
  const stack = createCommandStack<void>();

  return {
    execute<C>(ctx: C, command: Command<C>) {
      stack.execute(undefined, {
        apply() {
          command.apply(ctx);
        },
        revert() {
          command.revert(ctx);
        },
      });
    },
    undo() {
      return stack.undo(undefined);
    },
    redo() {
      return stack.redo(undefined);
    },
    clear() {
      stack.clear();
    },
    canUndo() {
      return stack.canUndo();
    },
    canRedo() {
      return stack.canRedo();
    },
  };
}
