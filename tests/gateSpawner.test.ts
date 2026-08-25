import { describe, expect, it } from "vitest";
import { createGateSpawnerAdvance, createGateSpawnerDrop } from "../src/sim/gateSpawner";
import { createSpawner } from "../src/sim/spawner";
import { addPiece, createTrackGraph, removePiece } from "../src/track/graph";

describe("gate-aware spawning", () => {
  it("does not create an invisible active marble without a start gate", () => {
    const graph = createTrackGraph();
    const spawner = createSpawner();

    expect(createGateSpawnerDrop(spawner, graph)).toEqual({ spawned: [], recycled: [] });
    expect(spawner.state().activeIds).toEqual([]);
  });

  it("attaches the gate anchor to manual drops", () => {
    const graph = createTrackGraph();
    addPiece(graph, "start-gate", { position: [1, 2, 3], yawDeg: 0 });
    const spawner = createSpawner();

    const result = createGateSpawnerDrop(spawner, graph);

    expect(result.spawned).toHaveLength(1);
    expect(result.spawned[0].position).toEqual([1, 3.15, 3]);
  });

  it("stops a stream when the start gate is deleted", () => {
    const graph = createTrackGraph();
    const gateId = addPiece(graph, "start-gate", { position: [0, 0, 0], yawDeg: 0 });
    const spawner = createSpawner({ streamIntervalMs: 100 });
    spawner.setContinuous(true);

    expect(createGateSpawnerAdvance(spawner, graph, 100).spawned).toHaveLength(1);
    removePiece(graph, gateId);

    expect(createGateSpawnerAdvance(spawner, graph, 100)).toMatchObject({
      spawned: [],
      recycled: [],
      streamStopped: true,
    });
    expect(spawner.isContinuous()).toBe(false);
  });
});
