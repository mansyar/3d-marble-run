import { describe, expect, it } from "vitest";
import type { Placement } from "../src/pieces/registry";
import { addPiece, connect, createTrackGraph, getPiece } from "../src/track/graph";
import { deserializeTrack, serializeTrack } from "../src/track/serialization";

const P0: Placement = { position: [0, 0, 0], yawDeg: 0 };
const P1: Placement = { position: [0.5, 0.25, 2], yawDeg: 90 };

describe("track serialization", () => {
  it("round-trips pieces, placements, connections, and the next id", () => {
    const graph = createTrackGraph();
    const straight = addPiece(graph, "straight", P0, "piece-7");
    const curve = addPiece(graph, "curve", P1, "piece-12");
    expect(connect(graph, straight, "b", curve, "a")).toBe(true);

    const restored = deserializeTrack(serializeTrack(graph));

    expect(restored.nextId).toBe(13);
    expect([...restored.pieces.values()]).toEqual([...graph.pieces.values()]);
    expect(getPiece(restored, straight)?.connections.b).toEqual({
      pieceId: curve,
      portId: "a",
    });
    expect(getPiece(restored, curve)?.connections.a).toEqual({
      pieceId: straight,
      portId: "b",
    });
  });

  it("stores a JSON object with an ordered piece list rather than Map internals", () => {
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [2, 0, 4], yawDeg: 180 });

    const payload = JSON.parse(serializeTrack(graph)) as {
      version: number;
      nextId: number;
      pieces: unknown[];
    };

    expect(payload.version).toBe(1);
    expect(payload.nextId).toBe(2);
    expect(Array.isArray(payload.pieces)).toBe(true);
    expect(payload.pieces).toHaveLength(1);
  });

  it("keeps the restored graph independent and id allocation monotonic", () => {
    const graph = createTrackGraph();
    const original = addPiece(graph, "ramp", P0, "piece-4");
    const restored = deserializeTrack(serializeTrack(graph));

    const restoredPiece = getPiece(restored, original);
    if (!restoredPiece) throw new Error("Expected restored piece");
    restoredPiece.placement.position[0] = 99;

    expect(getPiece(graph, original)?.placement.position[0]).toBe(0);
    expect(addPiece(restored, "goal-cup", P1)).toBe("piece-5");
  });

  it("round-trips an empty graph without losing its id counter", () => {
    const graph = createTrackGraph();
    const restored = deserializeTrack(serializeTrack(graph));

    expect(restored.pieces.size).toBe(0);
    expect(restored.nextId).toBe(1);
  });
});
