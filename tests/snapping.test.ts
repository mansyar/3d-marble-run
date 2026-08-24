import { describe, expect, it } from "vitest";
import { addPiece, connect, createTrackGraph } from "../src/track/graph";
import {
  findSnap,
  SNAP_DISTANCE,
  type SnapResult,
} from "../src/track/snapping";
import type { PieceTypeId, Placement } from "../src/pieces/registry";

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
    // Dragged port 'a' at (0,0,7.85): distance 0.15 to far piece, 6.85 to near.
    const r = findSnap(g, {
      typeId: DRAG,
      placement: { position: [0, 0, 8.85], yawDeg: 0 },
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

  it("aligns yaw for horizontal joins (90° corner)", () => {
    const { g } = graphWith(["curve", { position: [0, 0, 0], yawDeg: 0 }]);
    // Curve 'b' port: position (1,0,0), direction (1,0,0). Approach with a
    // straight whose 'a' points roughly at it from +X side.
    const r = findSnap(g, {
      typeId: DRAG,
      placement: { position: [2.1, 0, 0], yawDeg: 90 },
    });
    if (r === null) {
      // Straight 'a' dir at yaw 90 is (-1,0,0); target dir (1,0,0): dot = -1.
      // Must be snappable — fail loudly rather than silently passing.
      throw new Error("expected snap for perpendicular approach");
    }
    expect(r.dragPortId).toBe("a");
    // After snapping, dragged port 'a' coincides with curve 'b' (1,0,0):
    // rotated local 'a' offset (0,0,-1) by yaw -> position must satisfy
    // placement + rot(0,0,-1) == (1,0,0).
    const y = ((r.placement.yawDeg % 360) + 360) % 360;
    const rx = Math.sin((y * Math.PI) / 180) * -1; // rotY of (0,0,-1)
    const rz = Math.cos((y * Math.PI) / 180) * -1;
    expect(r.placement.position[0] + rx).toBeCloseTo(1, 4);
    expect(r.placement.position[2] + rz).toBeCloseTo(0, 4);
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
