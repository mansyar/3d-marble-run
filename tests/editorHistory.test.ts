import { describe, expect, it } from "vitest";
import { createEditorHistory, type EditorCommand } from "../src/core/editorHistory";

interface EditorState {
  pieces: string[];
  dropPoint: string | null;
}

function appendPiece(state: EditorState, id: string): EditorCommand {
  const before = [...state.pieces];
  const after = [...before, id];
  return {
    apply() {
      state.pieces = [...after];
    },
    revert() {
      state.pieces = [...before];
    },
  };
}

function setDropPoint(state: EditorState, value: string | null): EditorCommand {
  const before = state.dropPoint;
  return {
    apply() {
      state.dropPoint = value;
    },
    revert() {
      state.dropPoint = before;
    },
  };
}

describe("shared editor history", () => {
  it("undoes interleaved piece and Drop point edits chronologically", () => {
    const state: EditorState = { pieces: [], dropPoint: null };
    const history = createEditorHistory();

    history.execute(appendPiece(state, "piece-1"));
    history.execute(setDropPoint(state, "drop-1"));
    history.execute(appendPiece(state, "piece-2"));

    expect(history.undo()).toBe(true);
    expect(state).toEqual({ pieces: ["piece-1"], dropPoint: "drop-1" });
    expect(history.undo()).toBe(true);
    expect(state).toEqual({ pieces: ["piece-1"], dropPoint: null });
    expect(history.undo()).toBe(true);
    expect(state).toEqual({ pieces: [], dropPoint: null });
    expect(history.canUndo()).toBe(false);
  });

  it("redos interleaved edits in their original chronological order", () => {
    const state: EditorState = { pieces: [], dropPoint: null };
    const history = createEditorHistory();

    history.execute(appendPiece(state, "piece-1"));
    history.execute(setDropPoint(state, "drop-1"));
    history.execute(appendPiece(state, "piece-2"));
    history.undo();
    history.undo();
    history.undo();

    expect(history.redo()).toBe(true);
    expect(state).toEqual({ pieces: ["piece-1"], dropPoint: null });
    expect(history.redo()).toBe(true);
    expect(state).toEqual({ pieces: ["piece-1"], dropPoint: "drop-1" });
    expect(history.redo()).toBe(true);
    expect(state).toEqual({ pieces: ["piece-1", "piece-2"], dropPoint: "drop-1" });
    expect(history.canRedo()).toBe(false);
  });

  it("clears the redo branch when new editor work is executed", () => {
    const state: EditorState = { pieces: [], dropPoint: null };
    const history = createEditorHistory();

    history.execute(appendPiece(state, "piece-1"));
    history.execute(setDropPoint(state, "drop-1"));
    history.undo();
    history.execute(appendPiece(state, "piece-2"));

    expect(history.canRedo()).toBe(false);
    expect(history.redo()).toBe(false);
    expect(state).toEqual({ pieces: ["piece-1", "piece-2"], dropPoint: null });
  });

  it("safely handles empty operations and explicit history clearing", () => {
    const state: EditorState = { pieces: [], dropPoint: null };
    const history = createEditorHistory();

    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(false);
    history.execute(appendPiece(state, "piece-1"));
    history.undo();
    history.clear();

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(false);
  });
});
