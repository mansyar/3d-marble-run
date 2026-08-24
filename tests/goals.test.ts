import { describe, expect, it } from "vitest";
import { createGoalTracker, type MarblePosition } from "../src/sim/goals";
import { addPiece, createTrackGraph } from "../src/track/graph";

describe("goal-cup entry tracker", () => {
  it("detects a marble crossing a goal inlet once and emits a pop", () => {
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [0, 0, 0], yawDeg: 0 });
    const tracker = createGoalTracker();
    const marble: MarblePosition = { id: 1, position: [0, 0.45, 0] };

    expect(tracker.update(graph.pieces.values(), [marble])).toEqual([
      { marbleId: 1, goalPieceId: "piece-1", celebration: "pop" },
    ]);
    expect(tracker.count()).toBe(1);
    expect(tracker.update(graph.pieces.values(), [marble])).toEqual([]);
    expect(tracker.count()).toBe(1);
  });

  it("uses the cup's rotated inlet position and rejects misses", () => {
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [2, 0, -1], yawDeg: 45 });
    addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
    const tracker = createGoalTracker();

    expect(
      tracker.update(graph.pieces.values(), [
        { id: 2, position: [2, 0.5, -1] },
        { id: 3, position: [2.3, 0.5, -1] },
        { id: 4, position: [2, 0.8, -1] },
        { id: 5, position: [2, -0.6, -1] },
      ]),
    ).toEqual([{ marbleId: 2, goalPieceId: "piece-1", celebration: "pop" }]);
  });

  it("counts each marble once, supports multiple cups, and resets cleanly", () => {
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [-1, 0, 0], yawDeg: 0 });
    addPiece(graph, "goal-cup", { position: [1, 0, 0], yawDeg: 0 });
    const tracker = createGoalTracker();

    expect(
      tracker.update(graph.pieces.values(), [
        { id: 10, position: [-1, 0.5, 0] },
        { id: 11, position: [1, 0.5, 0] },
      ]),
    ).toHaveLength(2);
    expect(tracker.count()).toBe(2);

    tracker.reset();
    expect(tracker.count()).toBe(0);
    expect(tracker.update(graph.pieces.values(), [{ id: 10, position: [1, 0.5, 0] }])).toHaveLength(
      1,
    );
  });
});
