import { describe, expect, it } from "vitest";
import { createGoalTracker } from "../src/sim/goals";
import {
  classifyPlayablePosition,
  findOutOfBoundsMarbleIds,
  PLAYABLE_BOUNDS,
  resolveSpawnAnchor,
} from "../src/sim/playability";
import { createSpawner } from "../src/sim/spawner";
import { addPiece, createTrackGraph } from "../src/track/graph";

describe("playability helpers", () => {
  it("resolves a start gate spawn anchor above the placed gate", () => {
    const graph = createTrackGraph();
    addPiece(graph, "start-gate", { position: [3, 2, -4], yawDeg: 90 });

    expect(resolveSpawnAnchor(graph)).toEqual({
      status: "ready",
      position: [3, 3.15, -4],
    });
  });

  it("classifies missing gates and invalid playable bounds", () => {
    expect(resolveSpawnAnchor(createTrackGraph())).toEqual({
      status: "missing-start",
      position: null,
    });

    expect(classifyPlayablePosition([0, 0, 0], { min: [1, -1, -1], max: [-1, 1, 1] })).toBe(
      "invalid-boundary",
    );
  });

  it("identifies lost marbles without counting a goal or keeping them active", () => {
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [0, 0, 0], yawDeg: 0 });
    const tracker = createGoalTracker();
    const spawner = createSpawner();
    const marble = spawner.drop().spawned[0];
    const lostPosition = [PLAYABLE_BOUNDS.max[0] + 1, 0, 0] as [number, number, number];

    expect(findOutOfBoundsMarbleIds([{ id: marble.id, position: lostPosition }])).toEqual([marble.id]);
    expect(tracker.update(graph.pieces.values(), [{ id: marble.id, position: lostPosition }])).toEqual([]);
    expect(spawner.remove(marble.id)).toBe(true);
    expect(spawner.state().activeIds).toEqual([]);
  });
});
