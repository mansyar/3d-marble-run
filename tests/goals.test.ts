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

  it("tallies per cup and reports unknown cups as zero", () => {
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [-1, 0, 0], yawDeg: 0 });
    addPiece(graph, "goal-cup", { position: [1, 0, 0], yawDeg: 0 });
    const tracker = createGoalTracker();

    tracker.update(graph.pieces.values(), [
      { id: 20, position: [-1, 0.5, 0] },
      { id: 21, position: [-1, 0.5, 0] },
      { id: 22, position: [1, 0.5, 0] },
    ]);

    expect(tracker.countFor("piece-1")).toBe(2);
    expect(tracker.countFor("piece-2")).toBe(1);
    expect(tracker.countFor("piece-never-placed")).toBe(0);
    expect(tracker.counts()).toEqual({ "piece-1": 2, "piece-2": 1 });
    expect(tracker.count()).toBe(3);
  });

  it("reset clears per-cup tallies as well as the global total", () => {
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [-1, 0, 0], yawDeg: 0 });
    const tracker = createGoalTracker();

    tracker.update(graph.pieces.values(), [{ id: 30, position: [-1, 0.5, 0] }]);
    expect(tracker.countFor("piece-1")).toBe(1);

    tracker.reset();
    expect(tracker.countFor("piece-1")).toBe(0);
    expect(tracker.counts()).toEqual({});
  });

  it("keeps per-cup tallies one-time-per-marble across repeated updates", () => {
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [0, 0, 0], yawDeg: 0 });
    const tracker = createGoalTracker();
    const marble: MarblePosition = { id: 40, position: [0, 0.45, 0] };

    tracker.update(graph.pieces.values(), [marble]);
    tracker.update(graph.pieces.values(), [marble]);
    tracker.update(graph.pieces.values(), [marble]);

    expect(tracker.countFor("piece-1")).toBe(1);
    expect(tracker.counts()).toEqual({ "piece-1": 1 });
  });
});
