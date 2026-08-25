import { describe, expect, it } from "vitest";
import { addPiece, connect, createTrackGraph } from "../src/track/graph";
import { assessTrackHealth } from "../src/track/health";

const P = { position: [0, 0, 0] as [number, number, number], yawDeg: 0 };

describe("track health", () => {
  it("reports a missing start gate", () => {
    expect(assessTrackHealth(createTrackGraph())).toEqual({
      status: "missing-start",
      reachableGoalIds: [],
    });
  });

  it("reports a start gate with no connected goal", () => {
    const graph = createTrackGraph();
    addPiece(graph, "start-gate", P, "start-1");
    addPiece(graph, "goal-cup", { position: [4, 0, 0], yawDeg: 0 }, "goal-1");

    expect(assessTrackHealth(graph)).toEqual({
      status: "no-connected-goal",
      reachableGoalIds: [],
    });
  });

  it("finds goals through a connected path", () => {
    const graph = createTrackGraph();
    const start = addPiece(graph, "start-gate", P, "start-1");
    const straight = addPiece(graph, "straight", { position: [0, 0, 1], yawDeg: 0 }, "straight-1");
    const funnel = addPiece(graph, "funnel", { position: [0, 1, 2], yawDeg: 0 }, "funnel-1");
    const goal = addPiece(graph, "goal-cup", { position: [0, 0.4, 2], yawDeg: 0 }, "goal-1");

    expect(connect(graph, start, "spout", straight, "a")).toBe(true);
    expect(connect(graph, straight, "b", funnel, "mouth")).toBe(true);
    expect(connect(graph, funnel, "spout", goal, "inlet")).toBe(true);

    expect(assessTrackHealth(graph)).toEqual({
      status: "ready",
      reachableGoalIds: [goal],
    });
  });
});
