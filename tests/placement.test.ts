import { describe, expect, it } from "vitest";
import { canPlacePiece } from "../src/build/placementRules";
import { addPiece, createTrackGraph } from "../src/track/graph";

describe("placement availability", () => {
  it("rejects a second start gate without rejecting other pieces", () => {
    const graph = createTrackGraph();
    addPiece(graph, "start-gate", { position: [0, 0, 0], yawDeg: 0 });

    expect(canPlacePiece(graph, "start-gate")).toBe(false);
    expect(canPlacePiece(graph, "straight")).toBe(true);
  });
});
