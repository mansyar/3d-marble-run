import { describe, expect, it } from "vitest";
import type { PieceTypeId, Placement } from "../src/pieces/registry";
import { addPiece, connect, createTrackGraph } from "../src/track/graph";
import { classifySnap, findSnap, SNAP_DISTANCE, type SnapResult } from "../src/track/snapping";

const DRAG: PieceTypeId = "straight";

function graphWith(...specs: Array<[PieceTypeId, Placement]>) {
  const g = createTrackGraph();
  const ids = specs.map(([t, p]) => addPiece(g, t, p));
  return { g, ids };
}

describe("snapping solver", () => {
  it("exports a positive snap distance threshold", () => {
    expect(SNAP_DISTANCE).toBeGreaterThan(0);
  });

  it("returns null when nothing is within threshold", () => {
    const { g } = graphWith(["straight", { position: [0, 0, 0], yawDeg: 0 }]);
    // Dragged port 'a' lands at z=2.5; target port 'b' at z=1 -> gap 1.5.
    const r = findSnap(g, {
      typeId: DRAG,
      placement: { position: [0, 0, 3.5], yawDeg: 0 },
    });
    expect(r).toBeNull();
  });

  it("snaps head-on: dragged port lands exactly on target port with opposing direction", () => {
    const { g, ids } = graphWith(["straight", { position: [0, 0, 0], yawDeg: 0 }]);
    const r = findSnap(g, {
      typeId: DRAG,
      placement: { position: [0, 0, 2.15], yawDeg: 0 },
    }) as SnapResult;
    expect(r).not.toBeNull();
    // Port 'a' of the dragged straight must coincide with target port 'b' (0,0,1),
    // facing back along -Z.
    expect(r.placement.position[0]).toBeCloseTo(0, 5);
    expect(r.placement.position[2]).toBeCloseTo(2, 5);
    expect(r.targetPieceId).toBe(ids[0]);
    expect(r.targetPortId).toBe("b");
    expect(r.dragPortId).toBe("a");
  });

  it("picks the nearest compatible target among several", () => {
    const { g, ids } = graphWith(
      ["straight", { position: [0, 0, 0], yawDeg: 0 }], // port b at (0,0,1)
      ["straight", { position: [0, 0, 8], yawDeg: 0 }], // port b at (0,0,9)
    );
    // Dragged port 'a' at (0,0,8.85): distance 0.15 to far piece, 7.85 to near.
    const r = findSnap(g, {
      typeId: DRAG,
      placement: { position: [0, 0, 9.85], yawDeg: 0 },
    }) as SnapResult;
    expect(r.targetPieceId).toBe(ids[1]);
  });

  it("never snaps incompatible kinds (straight end vs cup inlet)", () => {
    const { g } = graphWith(["goal-cup", { position: [0, 0, 0], yawDeg: 0 }]);
    // Cup inlet at (0,0.6,0) faces up; straight 'b' at (0,0,1) faces +Z.
    const r = findSnap(g, {
      typeId: DRAG,
      placement: { position: [0, 0, 2.1], yawDeg: 0 },
    });
    expect(r).toBeNull();
  });

  it("never snaps to an already-connected (occupied) port", () => {
    const { g, ids } = graphWith(
      ["straight", { position: [0, 0, 0], yawDeg: 0 }],
      ["straight", { position: [0, 0, 2], yawDeg: 0 }],
    );
    // Occupy target's 'b' by connecting the second straight's 'a' to it.
    expect(connect(g, ids[0], "b", ids[1], "a")).toBe(true);
    // Now a third straight approaching target's 'b' must find nothing.
    const r = findSnap(g, {
      typeId: DRAG,
      placement: { position: [0, 0, 2.15], yawDeg: 0 },
    });
    expect(r).toBeNull();
  });

  it("joins funnel spout into cup inlet vertically, preserving drag yaw", () => {
    const { g, ids } = graphWith(["goal-cup", { position: [0, 0, 5], yawDeg: 0 }]);
    const r = findSnap(g, {
      typeId: "funnel",
      placement: { position: [0.05, 0.75, 5], yawDeg: 37 },
    }) as SnapResult;
    // Spout must snap onto the cup inlet.
    expect(r.targetPieceId).toBe(ids[0]);
    expect(r.placement.position[0]).toBeCloseTo(0, 4);
    expect(r.placement.position[1]).toBeCloseTo(0.6, 4);
    expect(r.placement.position[2]).toBeCloseTo(5, 4);
    expect(r.placement.yawDeg).toBe(37);
  });

  it("snaps a run piece into the funnel mouth", () => {
    const { g, ids } = graphWith(["funnel", { position: [0, 0, 0], yawDeg: 0 }]);
    const r = findSnap(g, {
      typeId: "straight",
      placement: { position: [0, 1, 1.15], yawDeg: 0 },
    });
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.targetPieceId).toBe(ids[0]);
    expect(r.targetPortId).toBe("mouth");
    expect(r.dragPortId).toBe("a");
    expect(r.placement.position).toEqual([0, 1, 1]);
  });

  it("can use the funnel spout as a run connection when the mouth is occupied", () => {
    const { g, ids } = graphWith(["funnel", { position: [0, 0, 0], yawDeg: 0 }]);
    const feeder = addPiece(g, "straight", { position: [0, 1, 1], yawDeg: 0 });
    expect(connect(g, ids[0], "mouth", feeder, "a")).toBe(true);

    const r = findSnap(g, {
      typeId: "straight",
      placement: { position: [0, 0, 1.15], yawDeg: 0 },
    });
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.targetPieceId).toBe(ids[0]);
    expect(r.targetPortId).toBe("spout");
    expect(r.dragPortId).toBe("a");
    expect(r.placement.position).toEqual([0, 0, 1]);
  });

  it("aligns yaw for horizontal joins (90° corner)", () => {
    const { g } = graphWith(["curve", { position: [0, 0, 0], yawDeg: 0 }]);
    // Curve 'b' port: position (0.5,0,-0.5), tangential dir (0,0,-1).
    // Approach with a straight whose 'a' exits toward +Z (yaw 180) so the
    // joint is tangent-continuous with the curve's arc.
    const r = findSnap(g, {
      typeId: DRAG,
      placement: { position: [0.55, 0, -1.45], yawDeg: 180 },
    });
    if (r === null) {
      // Straight 'a' dir at yaw 180 is (0,0,1); target dir (0,0,-1): dot=-1.
      // Must be snappable — fail loudly rather than silently passing.
      throw new Error("expected snap for perpendicular approach");
    }
    expect(r.dragPortId).toBe("a");
    expect(r.targetPortId).toBe("b");
    // Resting origin puts straight 'a' exactly on curve 'b' (0.5,0,-0.5).
    expect(r.placement.position[0]).toBeCloseTo(0.5, 4);
    expect(r.placement.position[1]).toBeCloseTo(0, 4);
    expect(r.placement.position[2]).toBeCloseTo(-1.5, 4);
    expect(r.placement.yawDeg).toBeCloseTo(180, 4);
  });

  it("aligns misaligned yaw: a rotated curve still snaps onto an open run port", () => {
    const { g } = graphWith(["straight", { position: [0, 0, 0], yawDeg: 0 }]);
    // Dragged curve at yaw 137° — its port 'b' (tangential dir (0,0,-1))
    // hovers near the straight's open port 'b' at (0,0,1), but the drag yaw
    // points the curve's exit the wrong way. The solver must fix the yaw.
    const r = findSnap(g, {
      typeId: "curve",
      placement: { position: [-0.45, 0, 1.55], yawDeg: 137 },
    });
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.dragPortId).toBe("b");
    // Solver aligns the curve's exit against the straight's: resting origin
    // (-0.5, 0, 1.5), yaw 0 — making the joint tangent-continuous.
    expect(r.placement.position[0]).toBeCloseTo(-0.5, 4);
    expect(r.placement.position[1]).toBeCloseTo(0, 4);
    expect(r.placement.position[2]).toBeCloseTo(1.5, 4);
    expect(r.placement.yawDeg).toBeCloseTo(0, 4);
    // Roundtrip: curve port 'b' local (0.5,0,-0.5) under that yaw lands on
    // the straight's open port at (0,0,1).
    const y = (r.placement.yawDeg * Math.PI) / 180;
    const px = r.placement.position[0] + 0.5 * Math.cos(y) - 0.5 * Math.sin(y);
    const pz = r.placement.position[2] - 0.5 * Math.sin(y) - 0.5 * Math.cos(y);
    expect(px).toBeCloseTo(0, 4);
    expect(pz).toBeCloseTo(1, 4);
  });

  it("snaps funnel onto cup inlet from a table-level drag (vertical join)", () => {
    const { g } = graphWith(["goal-cup", { position: [0, 0, 5], yawDeg: 0 }]);
    // Cursor glides on the table (y≈0); only XZ proximity to the resting
    // spot should matter — the funnel must lift itself onto the cup inlet.
    const r = findSnap(g, {
      typeId: "funnel",
      placement: { position: [0.1, 0, 5.08], yawDeg: 20 },
    });
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.dragPortId).toBe("spout");
    expect(r.targetPortId).toBe("inlet");
    expect(r.placement.position[1]).toBeCloseTo(0.6, 4);
  });

  it("can exclude a piece (self) from candidates during move operations", () => {
    const { g, ids } = graphWith(["straight", { position: [0, 0, 0], yawDeg: 0 }]);
    const r = findSnap(
      g,
      { typeId: DRAG, placement: { position: [0, 0, 2.15], yawDeg: 0 } },
      ids[0],
    );
    expect(r).toBeNull();
  });
});

describe("snap classification (ghost validity)", () => {
  it("reports a snap when a compatible free port is near", () => {
    const { g } = graphWith(["straight", { position: [0, 0, 0], yawDeg: 0 }]);
    const c = classifySnap(g, {
      typeId: DRAG,
      placement: { position: [0, 0, 2.15], yawDeg: 0 },
    });
    expect(c.status).toBe("snap");
  });

  it("reports blocked when only occupied compatible ports are near", () => {
    const { g } = graphWith(
      ["straight", { position: [0, 0, 0], yawDeg: 0 }],
      ["straight", { position: [0, 0, 2], yawDeg: 0 }],
    );
    connect(g, "piece-1", "b", "piece-2", "a");
    // Dragged 'a' would coincide with the now-occupied junction at (0,0,1).
    const c = classifySnap(g, {
      typeId: DRAG,
      placement: { position: [0, 0, 2.15], yawDeg: 0 },
    });
    expect(c.status).toBe("blocked");
  });

  it("reports free with the raw placement when far from every port", () => {
    const { g } = graphWith(["straight", { position: [0, 0, 0], yawDeg: 0 }]);
    const placement: Placement = { position: [9, 0, 9], yawDeg: 30 };
    const c = classifySnap(g, { typeId: DRAG, placement });
    expect(c.status).toBe("free");
    if (c.status === "free") expect(c.placement).toEqual(placement);
  });
});
