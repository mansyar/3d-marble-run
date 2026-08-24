import { describe, expect, it, vi } from "vitest";
import type { TrackGraph } from "../src/track/graph";
import { createStarterGraph } from "../src/track/starter";
import { loadInitialTrack } from "../src/track/startup";

function connectedRefs(graph: TrackGraph): number {
  let count = 0;
  for (const piece of graph.pieces.values()) {
    for (const connection of Object.values(piece.connections)) {
      if (connection) count += 1;
    }
  }
  return count;
}

describe("starter track", () => {
  it("creates a five-piece connected starter contraption", () => {
    const graph = createStarterGraph();

    expect([...graph.pieces.values()].map((piece) => piece.typeId).sort()).toEqual([
      "curve",
      "funnel",
      "goal-cup",
      "ramp",
      "straight",
    ]);
    expect(graph.nextId).toBe(6);
    expect(connectedRefs(graph)).toBe(8);

    for (const piece of graph.pieces.values()) {
      for (const connection of Object.values(piece.connections)) {
        if (!connection) continue;
        const partner = graph.pieces.get(connection.pieceId);
        expect(partner?.connections[connection.portId]).toEqual({
          pieceId: piece.id,
          portId: expect.any(String),
        });
      }
    }
  });
});

describe("startup track loading", () => {
  it("loads the autosave without replacing it with the starter", async () => {
    const saved = createStarterGraph();
    const storage = {
      load: vi.fn(async () => saved),
      flushAutosave: vi.fn(async () => undefined),
    };

    const graph = await loadInitialTrack(storage);

    expect(graph).toBe(saved);
    expect(storage.flushAutosave).not.toHaveBeenCalled();
  });

  it("creates and persists the starter when no autosave exists", async () => {
    const storage = {
      load: vi.fn(async () => null),
      flushAutosave: vi.fn(async () => undefined),
    };

    const graph = await loadInitialTrack(storage);

    expect(graph.pieces.size).toBe(5);
    expect(storage.flushAutosave).toHaveBeenCalledWith(graph);
  });
});
