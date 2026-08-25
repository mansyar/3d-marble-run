import { describe, expect, it } from "vitest";
import { createDropPoint } from "../src/track/dropPoint";
import { addPiece, connect, createTrackGraph } from "../src/track/graph";
import { assessDropPointHealth } from "../src/track/health";

describe("Drop point track health", () => {
  it("reports a missing Drop point before inspecting the graph", () => {
    expect(assessDropPointHealth(createTrackGraph(), null, null)).toEqual({
      status: "missing-drop-point",
      reachableGoalIds: [],
    });
  });

  it("reports a missing landing when the point has no valid root", () => {
    const point = createDropPoint([0, 0, 0]);

    expect(assessDropPointHealth(createTrackGraph(), point, null)).toEqual({
      status: "no-landing",
      reachableGoalIds: [],
    });
  });

  it("reports a disconnected goal from the landed physical piece", () => {
    const graph = createTrackGraph();
    const straightId = addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
    addPiece(graph, "goal-cup", { position: [3, 0, 0], yawDeg: 0 });

    expect(
      assessDropPointHealth(
        graph,
        createDropPoint([0, 0, 0]),
        straightId,
      ),
    ).toEqual({
      status: "no-connected-goal",
      reachableGoalIds: [],
    });
  });

  it("considers a Drop point landed directly on a Goal cup ready", () => {
    const graph = createTrackGraph();
    const goalId = addPiece(graph, "goal-cup", { position: [0, 0, 0], yawDeg: 0 });

    expect(assessDropPointHealth(graph, createDropPoint([0, 0, 0]), goalId)).toEqual({
      status: "ready",
      reachableGoalIds: [goalId],
    });
  });

  it("finds a connected goal through the landing piece", () => {
    const graph = createTrackGraph();
    const straightId = addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
    const funnelId = addPiece(graph, "funnel", { position: [0, 0, 0], yawDeg: 0 });
    const goalId = addPiece(graph, "goal-cup", { position: [0, 0, 0], yawDeg: 0 });
    connect(graph, straightId, "a", funnelId, "mouth");
    connect(graph, funnelId, "spout", goalId, "inlet");

    expect(assessDropPointHealth(graph, createDropPoint([0, 0, 0]), straightId)).toEqual({
      status: "ready",
      reachableGoalIds: [goalId],
    });
  });
});
