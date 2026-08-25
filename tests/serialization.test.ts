import { describe, expect, it } from "vitest";
import type { Placement } from "../src/pieces/registry";
import { addPiece, connect, createTrackGraph, getPiece } from "../src/track/graph";
import { deserializeTrack, serializeTrack } from "../src/track/serialization";

const P0: Placement = { position: [0, 0, 0], yawDeg: 0 };
const P1: Placement = { position: [0.5, 0.25, 2], yawDeg: 90 };

describe("track serialization", () => {
  it("round-trips pieces, placements, connections, and the next id", () => {
    const graph = createTrackGraph();
    const gate = addPiece(graph, "start-gate", P0, "piece-7");
    const curve = addPiece(graph, "curve", P1, "piece-12");
    expect(connect(graph, gate, "spout", curve, "a")).toBe(true);

    const restored = deserializeTrack(serializeTrack(graph));

    expect(restored.nextId).toBe(13);
    expect([...restored.pieces.values()]).toEqual([...graph.pieces.values()]);
    expect(getPiece(restored, gate)?.connections.spout).toEqual({
      pieceId: curve,
      portId: "a",
    });
    expect(getPiece(restored, curve)?.connections.a).toEqual({
      pieceId: gate,
      portId: "spout",
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

  it("loads v1 saves that do not contain a start gate", () => {
    const payload = {
      version: 1,
      nextId: 2,
      pieces: [
        { id: "piece-1", typeId: "straight", placement: P0, connections: { a: null, b: null } },
      ],
    };

    expect(deserializeTrack(JSON.stringify(payload)).pieces.get("piece-1")?.typeId).toBe(
      "straight",
    );
  });

  it("rejects malformed pieces, duplicate start gates, and asymmetric connections", () => {
    const unknownType = {
      version: 1,
      nextId: 2,
      pieces: [
        {
          id: "piece-1",
          typeId: "toString",
          placement: P0,
          connections: { a: null, b: null },
        },
      ],
    };
    expect(() => deserializeTrack(JSON.stringify(unknownType))).toThrow();

    const duplicateStartGates = {
      version: 1,
      nextId: 3,
      pieces: [
        { id: "piece-1", typeId: "start-gate", placement: P0, connections: { spout: null } },
        { id: "piece-2", typeId: "start-gate", placement: P1, connections: { spout: null } },
      ],
    };
    expect(() => deserializeTrack(JSON.stringify(duplicateStartGates))).toThrow();

    const duplicateIds = {
      version: 1,
      nextId: 2,
      pieces: [
        { id: "piece-1", typeId: "straight", placement: P0, connections: { a: null, b: null } },
        { id: "piece-1", typeId: "curve", placement: P1, connections: { a: null, b: null } },
      ],
    };
    expect(() => deserializeTrack(JSON.stringify(duplicateIds))).toThrow();

    const asymmetric = {
      version: 1,
      nextId: 3,
      pieces: [
        {
          id: "piece-1",
          typeId: "straight",
          placement: P0,
          connections: { a: null, b: { pieceId: "piece-2", portId: "a" } },
        },
        { id: "piece-2", typeId: "straight", placement: P1, connections: { a: null, b: null } },
      ],
    };
    expect(() => deserializeTrack(JSON.stringify(asymmetric))).toThrow();
  });
});
