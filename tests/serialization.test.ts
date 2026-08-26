import { describe, expect, it } from "vitest";
import type { Placement } from "../src/pieces/registry";
import type { DropPoint } from "../src/track/dropPoint";
import { addPiece, connect, createTrackGraph, getPiece } from "../src/track/graph";
import {
  deserializeTrack,
  deserializeTrackDocument,
  serializeTrack,
  TRACK_FORMAT_VERSION,
} from "../src/track/serialization";

const P0: Placement = { position: [0, 0, 0], yawDeg: 0 };
const P1: Placement = { position: [0.5, 0.25, 2], yawDeg: 90 };

describe("track serialization", () => {
  it("round-trips pieces, placements, connections, and the next id", () => {
    const graph = createTrackGraph();
    const funnel = addPiece(graph, "funnel", P0, "piece-7");
    const curve = addPiece(graph, "curve", P1, "piece-12");
    expect(connect(graph, funnel, "spout", curve, "a")).toBe(true);

    const restored = deserializeTrack(serializeTrack(graph));

    expect(restored.nextId).toBe(13);
    expect([...restored.pieces.values()]).toEqual([...graph.pieces.values()]);
    expect(getPiece(restored, funnel)?.connections.spout).toEqual({
      pieceId: curve,
      portId: "a",
    });
    expect(getPiece(restored, curve)?.connections.a).toEqual({
      pieceId: funnel,
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
      dropPoint: unknown;
    };

    expect(payload.version).toBe(TRACK_FORMAT_VERSION);
    expect(payload.nextId).toBe(2);
    expect(Array.isArray(payload.pieces)).toBe(true);
    expect(payload.pieces).toHaveLength(1);
    expect(payload.dropPoint).toBeNull();
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

    const restored = deserializeTrackDocument(JSON.stringify(payload));

    expect(restored.graph.pieces.get("piece-1")?.typeId).toBe("straight");
    expect(restored.dropPoint).toBeNull();
  });

  it("round-trips a v2 Drop point and produces stable output", () => {
    const graph = createTrackGraph();
    addPiece(graph, "ramp", P0);
    const dropPoint: DropPoint = { position: [1.5, 4, -2] };

    const serialized = serializeTrack(graph, dropPoint);
    const restored = deserializeTrackDocument(serialized);

    expect(JSON.parse(serialized)).toMatchObject({
      version: 2,
      dropPoint,
    });
    expect(restored.graph).toEqual(graph);
    expect(restored.dropPoint).toEqual(dropPoint);
    expect(serializeTrack(restored.graph, restored.dropPoint)).toBe(serialized);
  });

  it("round-trips a v2 save with a null Drop point", () => {
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", P1);

    const restored = deserializeTrackDocument(serializeTrack(graph, null));

    expect(restored.graph).toEqual(graph);
    expect(restored.dropPoint).toBeNull();
  });

  it("rejects malformed, invalid, and duplicate Drop point data", () => {
    const base = {
      version: 2,
      nextId: 1,
      pieces: [],
    };
    const malformed = [
      base,
      { ...base, dropPoint: { position: [0, 3, 0] } },
      { ...base, dropPoint: { position: [21, 4, 0] } },
      { ...base, dropPoint: { position: [0, 4, 0], extra: true } },
      { ...base, dropPoint: null, dropPoints: [{ position: [0, 4, 0] }] },
    ];

    for (const payload of malformed) {
      expect(() => deserializeTrackDocument(JSON.stringify(payload))).toThrow();
    }
    expect(() => serializeTrack(createTrackGraph(), { position: [0, 3, 0] })).toThrow();
  });

  it("migrates a connected v1 Start gate into a Drop point", () => {
    const payload = {
      version: 1,
      nextId: 4,
      pieces: [
        {
          id: "piece-1",
          typeId: "start-gate",
          placement: { position: [2, 1, 3], yawDeg: 90 },
          connections: { spout: { pieceId: "piece-2", portId: "b" } },
        },
        {
          id: "piece-2",
          typeId: "ramp",
          placement: P0,
          connections: {
            a: { pieceId: "piece-3", portId: "a" },
            b: { pieceId: "piece-1", portId: "spout" },
          },
        },
        {
          id: "piece-3",
          typeId: "straight",
          placement: P1,
          connections: { a: { pieceId: "piece-2", portId: "a" }, b: null },
        },
      ],
    };

    const migrated = deserializeTrackDocument(JSON.stringify(payload));

    expect(migrated.dropPoint).toEqual({ position: [2, 4, 3] });
    expect(migrated.graph.pieces.has("piece-1")).toBe(false);
    expect(migrated.graph.nextId).toBe(4);
    expect(migrated.graph.pieces.get("piece-2")?.connections).toEqual({
      a: { pieceId: "piece-3", portId: "a" },
      b: null,
    });
    expect(migrated.graph.pieces.get("piece-3")?.connections.a).toEqual({
      pieceId: "piece-2",
      portId: "a",
    });
  });

  it("migrates an unconnected v1 Start gate and rejects invalid legacy data", () => {
    const unconnected = {
      version: 1,
      nextId: 2,
      pieces: [
        { id: "piece-1", typeId: "start-gate", placement: P0, connections: { spout: null } },
      ],
    };
    const invalidPosition = {
      ...unconnected,
      pieces: [
        {
          id: "piece-1",
          typeId: "start-gate",
          placement: { position: [21, 0, 0], yawDeg: 0 },
          connections: { spout: null },
        },
      ],
    };
    const invalidConnection = {
      ...unconnected,
      pieces: [
        {
          id: "piece-1",
          typeId: "start-gate",
          placement: P0,
          connections: { spout: { pieceId: "piece-99", portId: "a" } },
        },
      ],
    };

    const migrated = deserializeTrackDocument(JSON.stringify(unconnected));

    expect(migrated.dropPoint).toEqual({ position: [0, 4, 0] });
    expect(migrated.graph.pieces.size).toBe(0);
    expect(() => deserializeTrackDocument(JSON.stringify(invalidPosition))).toThrow();
    expect(() => deserializeTrackDocument(JSON.stringify(invalidConnection))).toThrow();
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
