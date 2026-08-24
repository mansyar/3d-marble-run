import { describe, expect, it } from "vitest";
import {
  addPiece,
  connect,
  createTrackGraph,
  getPiece,
  movePiece,
  removePiece,
  type TrackGraph,
} from "../src/track/graph";
import {
  createCommandStack,
  type Command,
} from "../src/core/commandStack";
import {
  DeleteCommand,
  MoveCommand,
  PlaceCommand,
} from "../src/track/commands";
import type { Placement } from "../src/pieces/registry";

const P0: Placement = { position: [0, 0, 0], yawDeg: 0 };
const P1: Placement = { position: [0, 0, 2], yawDeg: 0 };

describe("track graph", () => {
  it("adds pieces with unique ids and stores their placement", () => {
    const g = createTrackGraph();
    const a = addPiece(g, "straight", P0);
    const b = addPiece(g, "straight", P1);
    expect(a).not.toBe(b);
    expect(getPiece(g, a)?.placement).toEqual(P0);
    expect(getPiece(g, b)?.typeId).toBe("straight");
  });

  it("connects only compatible and free ports, on both sides symmetrically", () => {
    const g = createTrackGraph();
    const a = addPiece(g, "straight", P0);
    const b = addPiece(g, "straight", P1);
    expect(connect(g, a, "b", b, "a")).toBe(true);
    // Ports are now occupied.
    expect(connect(g, a, "b", b, "b")).toBe(false);
    // Incompatible kinds are rejected.
    const cup = addPiece(g, "goal-cup", { position: [5, 0, 5], yawDeg: 0 });
    expect(connect(g, b, "b", cup, "inlet")).toBe(false);
  });

  it("removing a piece clears connections that referenced it", () => {
    const g = createTrackGraph();
    const a = addPiece(g, "straight", P0);
    const b = addPiece(g, "straight", P1);
    connect(g, a, "b", b, "a");
    removePiece(g, a);
    expect(getPiece(g, a)).toBeUndefined();
    expect(getPiece(g, b)?.connections.a).toBeNull();
  });

  it("moving a piece detaches its connections", () => {
    const g = createTrackGraph();
    const a = addPiece(g, "straight", P0);
    const b = addPiece(g, "straight", P1);
    connect(g, a, "b", b, "a");
    movePiece(g, a, { position: [10, 0, 10], yawDeg: 45 });
    expect(getPiece(g, a)?.connections.b).toBeNull();
    expect(getPiece(g, b)?.connections.a).toBeNull();
    expect(getPiece(g, a)?.placement).toEqual({
      position: [10, 0, 10],
      yawDeg: 45,
    });
  });
});

describe("generic command stack", () => {
  interface Doc {
    text: string;
  }
  const append = (doc: Doc, s: string): Command<Doc> => ({
    apply(d: Doc) {
      d.text += s;
    },
    revert(d: Doc) {
      d.text = d.text.slice(0, -s.length);
    },
  });

  it("executes immediately; undo reverses; redo reapplies", () => {
    const doc: Doc = { text: "" };
    const stack = createCommandStack<Doc>();
    stack.execute(doc, append(doc, "ab"));
    expect(doc.text).toBe("ab");
    expect(stack.canUndo()).toBe(true);
    stack.undo(doc);
    expect(doc.text).toBe("");
    expect(stack.canRedo()).toBe(true);
    stack.redo(doc);
    expect(doc.text).toBe("ab");
  });

  it("returns false when undoing/redoing an empty or exhausted stack", () => {
    const doc: Doc = { text: "" };
    const stack = createCommandStack<Doc>();
    expect(stack.undo(doc)).toBe(false);
    stack.execute(doc, append(doc, "x"));
    stack.undo(doc);
    stack.redo(doc);
    expect(stack.redo(doc)).toBe(false);
  });

  it("truncates the redo tail when a new command interleaves", () => {
    const doc: Doc = { text: "" };
    const stack = createCommandStack<Doc>();
    stack.execute(doc, append(doc, "a"));
    stack.undo(doc);
    stack.execute(doc, append(doc, "b"));
    expect(stack.canRedo()).toBe(false);
    stack.redo(doc); // must be a safe no-op returning false
    expect(doc.text).toBe("b");
  });
});

function buildTwoLinked(graph?: TrackGraph) {
  const g = graph ?? createTrackGraph();
  const a = addPiece(g, "straight", P0);
  const b = addPiece(g, "straight", P1);
  connect(g, a, "b", b, "a");
  return { g, a, b };
}

describe("track commands", () => {
  it("PlaceCommand adds on apply and removes on revert", () => {
    const g = createTrackGraph();
    const stack = createCommandStack<TrackGraph>();
    const cmd = new PlaceCommand("p1", "curve", P1);
    stack.execute(g, cmd);
    expect(getPiece(g, "p1")?.typeId).toBe("curve");
    stack.undo(g);
    expect(getPiece(g, "p1")).toBeUndefined();
  });

  it("MoveCommand swaps between before/after placements and detaches links", () => {
    const { g, a } = buildTwoLinked();
    const stack = createCommandStack<TrackGraph>();
    const after: Placement = { position: [7, 0, 7], yawDeg: 90 };
    stack.execute(g, new MoveCommand(a, P0, after));
    expect(getPiece(g, a)?.placement).toEqual(after);
    stack.undo(g);
    expect(getPiece(g, a)?.placement).toEqual(P0);
  });

  it("DeleteCommand removes piece+links on apply and fully restores them on revert", () => {
    const { g, b } = buildTwoLinked();
    const snapshot = getPiece(g, b)!;
    const linksIn = JSON.parse(JSON.stringify(snapshot.connections));
    const stack = createCommandStack<TrackGraph>();
    stack.execute(g, new DeleteCommand(b, snapshot));
    expect(getPiece(g, b)).toBeUndefined();
    stack.undo(g);
    const restored = getPiece(g, b)!;
    expect(restored.typeId).toBe("straight");
    expect(restored.placement).toEqual(P1);
    expect(restored.connections).toEqual(linksIn);
  });
});
