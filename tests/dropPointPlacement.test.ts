import { describe, expect, it } from "vitest";
import { createDropPointEditor, createDropPointState } from "../src/build/dropPointPlacement";
import { createEditorHistory } from "../src/core/editorHistory";
import { addPiece, createTrackGraph } from "../src/track/graph";

describe("Drop point placement state", () => {
  it("moves and replaces one point on the free X/Z plane", () => {
    const state = createDropPointState();
    const editor = createDropPointEditor(state, createEditorHistory());

    expect(editor.place([2, -100, -3])).toBe(true);
    expect(state.point).toEqual({ position: [2, 4, -3] });
    expect(editor.place([-4, 100, 6])).toBe(true);
    expect(state.point).toEqual({ position: [-4, 4, 6] });
  });

  it("deletes and restores the point through undo and redo", () => {
    const state = createDropPointState({ position: [1, 4, 1] });
    const history = createEditorHistory();
    const editor = createDropPointEditor(state, history);

    expect(editor.delete()).toBe(true);
    expect(state.point).toBeNull();
    expect(editor.undo()).toBe(true);
    expect(state.point).toEqual({ position: [1, 4, 1] });
    expect(editor.redo()).toBe(true);
    expect(state.point).toBeNull();
  });

  it("leaves the physical graph untouched", () => {
    const graph = createTrackGraph();
    addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
    const before = structuredClone(graph);
    const state = createDropPointState();
    const editor = createDropPointEditor(state, createEditorHistory());

    editor.place([3, 0, -2]);
    editor.delete();

    expect(graph).toEqual(before);
  });

  it("rejects invalid positions without changing the active point", () => {
    const state = createDropPointState({ position: [1, 4, 1] });
    const editor = createDropPointEditor(state, createEditorHistory());

    expect(editor.place([21, 0, 0])).toBe(false);
    expect(state.point).toEqual({ position: [1, 4, 1] });
  });
});
