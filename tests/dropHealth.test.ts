import { describe, expect, it } from "vitest";
import { createDropPoint } from "../src/track/dropPoint";
import { addPiece, connect, createTrackGraph } from "../src/track/graph";
import { assessDropPointHealth, routePathsToGoals, unreachableConnectorPieces } from "../src/track/health";

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

    expect(assessDropPointHealth(graph, createDropPoint([0, 0, 0]), straightId)).toEqual({
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

  it("treats portless bumper nodes as neither goals nor route members", () => {
    const graph = createTrackGraph();
    const straightId = addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
    const funnelId = addPiece(graph, "funnel", { position: [0, 0, 0], yawDeg: 0 });
    const goalId = addPiece(graph, "goal-cup", { position: [0, 0, 0], yawDeg: 0 });
    connect(graph, straightId, "a", funnelId, "mouth");
    connect(graph, funnelId, "spout", goalId, "inlet");
    addPiece(graph, "bumper", { position: [2, 0, 2], yawDeg: 0 });

    expect(assessDropPointHealth(graph, createDropPoint([0, 0, 0]), straightId)).toEqual({
      status: "ready",
      reachableGoalIds: [goalId],
    });
  });
});

describe("Route guidance helpers", () => {
  it("flags connector pieces unreachable from the landing piece, exempting portless ones", () => {
    const graph = createTrackGraph();
    const straightId = addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
    const funnelId = addPiece(graph, "funnel", { position: [0, 0, 0], yawDeg: 0 });
    const goalId = addPiece(graph, "goal-cup", { position: [0, 0, 0], yawDeg: 0 });
    const strayId = addPiece(graph, "curve", { position: [4, 0, 0], yawDeg: 0 });
    const bumperId = addPiece(graph, "bumper", { position: [2, 0, 2], yawDeg: 0 });
    connect(graph, straightId, "a", funnelId, "mouth");
    connect(graph, funnelId, "spout", goalId, "inlet");

    // The disconnected curve pulses; the connected chain does not, and the
    // unconnected bumper is portless so it is never highlighted.
    expect(unreachableConnectorPieces(graph, straightId)).toEqual([strayId]);
    expect(unreachableConnectorPieces(graph, straightId)).not.toContain(bumperId);
  });

  it("highlights nothing without a landing piece", () => {
    const graph = createTrackGraph();
    addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });

    expect(unreachableConnectorPieces(graph, null)).toEqual([]);
    expect(unreachableConnectorPieces(graph, "missing")).toEqual([]);
  });

  it("traces one path per reachable goal through a splitter", () => {
    const graph = createTrackGraph();
    const straightId = addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
    const splitterId = addPiece(graph, "splitter", { position: [0, 0, 0], yawDeg: 0 });
    const leftGoalId = addPiece(graph, "goal-cup", { position: [3, 0, 0], yawDeg: 0 });
    const curveId = addPiece(graph, "curve", { position: [5, 0, 0], yawDeg: 0 });
    const rightGoalId = addPiece(graph, "goal-cup", { position: [7, 0, 0], yawDeg: 0 });
    connect(graph, straightId, "b", splitterId, "inlet");
    connect(graph, splitterId, "outlet-l", leftGoalId, "inlet");
    connect(graph, splitterId, "outlet-r", curveId, "b");
    connect(graph, curveId, "a", rightGoalId, "inlet");

    expect(routePathsToGoals(graph, straightId)).toEqual([
      { goalId: leftGoalId, pieceIds: [straightId, splitterId, leftGoalId] },
      { goalId: rightGoalId, pieceIds: [straightId, splitterId, curveId, rightGoalId] },
    ]);
  });

  it("traces a direct cup landing as a single-piece path and no path without goals", () => {
    const graph = createTrackGraph();
    const goalId = addPiece(graph, "goal-cup", { position: [0, 0, 0], yawDeg: 0 });
    const aloneId = addPiece(graph, "straight", { position: [4, 0, 0], yawDeg: 0 });

    expect(routePathsToGoals(graph, goalId)).toEqual([
      { goalId, pieceIds: [goalId] },
    ]);
    expect(routePathsToGoals(graph, aloneId)).toEqual([]);
    expect(routePathsToGoals(graph, null)).toEqual([]);
  });
});
