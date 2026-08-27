import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Mesh, Scene } from "three";
import { describe, expect, it } from "vitest";
import { buildPiece, FUNNEL_SPOUT_INNER_RADIUS, spawnStaticPiece } from "../src/pieces/builders";
import { MARBLE_RADIUS } from "../src/pieces/marble";
import {
  canConnect,
  getWorldPort,
  PIECE_TYPE_IDS,
  type PieceTypeId,
  type PortKind,
  SPLITTER_RADIUS,
} from "../src/pieces/registry";
import { createPhysics } from "../src/sim/physics";

const ALL_KINDS: PortKind[] = ["run", "mouth", "spout", "cup"];

/** Look up a port by id within a piece definition. */
function port(typeId: PieceTypeId, portId: string) {
  const def = PIECE_TYPE_IDS[typeId];
  const found = def.ports.find((p) => p.id === portId);
  if (!found) throw new Error(`port ${portId} missing on ${typeId}`);
  return found;
}

describe("piece registry", () => {
  it("defines exactly the seven physical piece types", () => {
    expect(Object.keys(PIECE_TYPE_IDS).sort()).toEqual(
      ["bumper", "curve", "funnel", "goal-cup", "ramp", "splitter", "straight"].sort(),
    );
  });

  it("gives every connector piece at least one fully-specified port", () => {
    for (const [typeId, def] of Object.entries(PIECE_TYPE_IDS)) {
      if (typeId === "bumper") continue; // free-standing; intentionally portless
      expect(def.ports.length).toBeGreaterThan(0);
      for (const p of def.ports) {
        expect(p.id).toBeTruthy();
        expect(ALL_KINDS).toContain(p.kind);
        expect(p.position).toHaveLength(3);
        expect(p.direction).toHaveLength(3);
      }
    }
  });

  it("straight has two run ports facing opposite directions", () => {
    const a = port("straight", "a");
    const b = port("straight", "b");
    expect(a.kind).toBe("run");
    expect(b.kind).toBe("run");
    const dot =
      a.direction[0] * b.direction[0] +
      a.direction[1] * b.direction[1] +
      a.direction[2] * b.direction[2];
    expect(dot).toBeCloseTo(-1, 5);
  });

  it("curve turns a quarter: its port directions are perpendicular", () => {
    const a = port("curve", "a");
    const b = port("curve", "b");
    const dot =
      a.direction[0] * b.direction[0] +
      a.direction[1] * b.direction[1] +
      a.direction[2] * b.direction[2];
    expect(dot).toBeCloseTo(0, 5);
  });

  it("ramp exits higher than it enters", () => {
    const entry = port("ramp", "a");
    const exit = port("ramp", "b");
    expect(exit.position[1]).toBeGreaterThan(entry.position[1]);
  });

  it("funnel has an upward mouth and a downward spout", () => {
    expect(port("funnel", "mouth").kind).toBe("mouth");
    expect(port("funnel", "mouth").direction[1]).toBeGreaterThan(0);
    expect(port("funnel", "spout").kind).toBe("spout");
    expect(port("funnel", "spout").direction[1]).toBeLessThan(0);
  });

  it("funnel spout has a hollow passage wider than the marble", () => {
    const funnel = buildPiece("funnel");
    const spout = funnel.group.children[1];
    expect(FUNNEL_SPOUT_INNER_RADIUS).toBeGreaterThan(MARBLE_RADIUS);
    expect(spout).toBeInstanceOf(Mesh);
    if (!(spout instanceof Mesh)) return;
    expect(spout.geometry.type).toBe("LatheGeometry");
  });

  it("goal cup has a single upward-facing cup inlet", () => {
    const def = PIECE_TYPE_IDS["goal-cup"];
    expect(def.ports).toHaveLength(1);
    expect(def.ports[0].kind).toBe("cup");
    expect(def.ports[0].direction[1]).toBeGreaterThan(0);
  });
});

describe("port math", () => {
  it("normalizes every port direction to unit length", () => {
    for (const def of Object.values(PIECE_TYPE_IDS)) {
      for (const p of def.ports) {
        const len = Math.hypot(...p.direction);
        expect(len).toBeCloseTo(1, 5);
      }
    }
  });

  it("identity placement leaves a port untouched", () => {
    const local = port("straight", "b");
    const world = getWorldPort({ position: [0, 0, 0], yawDeg: 0 }, "straight", "b");
    expect(world.position).toEqual(local.position);
    expect(world.direction).toEqual(local.direction);
  });

  it("rotates ports around Y with the piece yaw (90° maps +Z to +X)", () => {
    const world = getWorldPort({ position: [0, 0, 0], yawDeg: 90 }, "straight", "b");
    // straight 'b' faces +Z locally -> after 90° yaw it must face +X
    expect(world.direction[0]).toBeCloseTo(1, 5);
    expect(world.direction[2]).toBeCloseTo(0, 5);
  });

  it("translates port position without touching its direction", () => {
    const local = port("straight", "b");
    const world = getWorldPort({ position: [10, 2, -4], yawDeg: 0 }, "straight", "b");
    expect(world.position[0]).toBeCloseTo(local.position[0] + 10, 5);
    expect(world.position[1]).toBeCloseTo(local.position[1] + 2, 5);
    expect(world.position[2]).toBeCloseTo(local.position[2] - 4, 5);
    expect(world.direction).toEqual(local.direction);
  });
});

/**
 * The piece has no downstream track in this world, so a successful exit is
 * observed as an event (|x| > 0.9 inside a branch mouth) rather than a final
 * resting position. A rebound off the apex that exits north (z > 1) is an
 * upstream re-approach on real (sloped, connected) tracks — only a fall
 * *through* the fork floor (y < -0.5 at z < 0.6) counts as a leak.
 */
describe("splitter physics", () => {
  it("feeds both branches across deterministic off-center entries", async () => {
    const world = await createPhysics();
    spawnStaticPiece(new Scene(), world, "splitter", { position: [0, 0, 0], yawDeg: 0 });
    const sides = new Set<string>();
    for (const startX of [-0.02, 0.02]) {
      const body = world.createRigidBody(RigidBodyDesc.dynamic().setTranslation(startX, 0.5, 0.9));
      world.createCollider(
        ColliderDesc.ball(MARBLE_RADIUS).setFriction(0.45).setRestitution(0.15),
        body,
      );
      body.setLinvel({ x: 0, y: 0, z: -2.5 }, true);
      let side: "left" | "right" | null = null;
      let leaked = false;
      for (let step = 0; step < 900 && !side && !leaked; step += 1) {
        world.step();
        const t = body.translation();
        if (t.y < -0.5 && t.z < 0.6) leaked = true;
        else if (Math.abs(t.x) > 0.9) side = t.x < 0 ? "left" : "right";
      }
      world.removeRigidBody(body);
      expect(leaked).toBe(false);
      expect(side).not.toBeNull();
      sides.add(side as "left" | "right");
    }
    expect(sides.has("left")).toBe(true);
    expect(sides.has("right")).toBe(true);
  });

  it("does not leak a dead-center arrival through the fork floor", async () => {
    const world = await createPhysics();
    spawnStaticPiece(new Scene(), world, "splitter", { position: [0, 0, 0], yawDeg: 0 });
    const body = world.createRigidBody(RigidBodyDesc.dynamic().setTranslation(0, 0.5, 0.9));
    world.createCollider(
      ColliderDesc.ball(MARBLE_RADIUS).setFriction(0.45).setRestitution(0.15),
      body,
    );
    body.setLinvel({ x: 0, y: 0, z: -2.5 }, true);
    let leakedThroughFork = false;
    for (let step = 0; step < 900 && !leakedThroughFork; step += 1) {
      world.step();
      const t = body.translation();
      if (t.y < -0.5 && t.z < 0.6) leakedThroughFork = true;
    }
    expect(leakedThroughFork).toBe(false);
  });
});

describe("funnel physics", () => {
  it("lets a marble fall through the lower spout", async () => {
    const world = await createPhysics();
    spawnStaticPiece(new Scene(), world, "funnel", { position: [0, 0, 0], yawDeg: 0 });
    const body = world.createRigidBody(RigidBodyDesc.dynamic().setTranslation(0, 2, 0));
    world.createCollider(ColliderDesc.ball(MARBLE_RADIUS), body);

    for (let step = 0; step < 180; step += 1) world.step();

    expect(body.translation().y).toBeLessThan(-0.2);
  });
});

describe("compatibility rules", () => {
  it("allows run↔run, mouth↔run, spout↔run and spout↔cup", () => {
    expect(canConnect("run", "run")).toBe(true);
    expect(canConnect("mouth", "run")).toBe(true);
    expect(canConnect("spout", "run")).toBe(true);
    expect(canConnect("spout", "cup")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(canConnect("mouth", "mouth")).toBe(false);
    expect(canConnect("mouth", "spout")).toBe(false);
    expect(canConnect("mouth", "cup")).toBe(false);
    expect(canConnect("run", "cup")).toBe(false);
    expect(canConnect("cup", "cup")).toBe(false);
    expect(canConnect("spout", "spout")).toBe(false);
  });

  it("is symmetric", () => {
    for (const a of ALL_KINDS) {
      for (const b of ALL_KINDS) {
        expect(canConnect(a, b)).toBe(canConnect(b, a));
      }
    }
  });
});

describe("splitter piece", () => {
  it("is one of the registered piece types", () => {
    expect(Object.keys(PIECE_TYPE_IDS)).toContain("splitter");
  });

  it("has exactly three run ports: one inlet, two outlets", () => {
    const def = PIECE_TYPE_IDS.splitter;
    expect(def.ports).toHaveLength(3);
    expect(def.ports.map((p) => p.id).sort()).toEqual(["inlet", "outlet-l", "outlet-r"]);
    for (const p of def.ports) expect(p.kind).toBe("run");
  });

  it("places the inlet at the stem end and outlets at symmetric branch tips", () => {
    const inlet = port("splitter", "inlet");
    const left = port("splitter", "outlet-l");
    const right = port("splitter", "outlet-r");
    expect(inlet.position).toEqual([0, 0, SPLITTER_RADIUS]);
    expect(left.position).toEqual([-SPLITTER_RADIUS, 0, 0]);
    expect(right.position).toEqual([SPLITTER_RADIUS, 0, 0]);
    expect(left.position[1]).toBe(inlet.position[1]);
    expect(right.position[1]).toBe(inlet.position[1]);
  });

  it("directs the inlet upstream and both outlets sideways (perpendicular)", () => {
    const inlet = port("splitter", "inlet");
    const left = port("splitter", "outlet-l");
    const right = port("splitter", "outlet-r");
    expect(inlet.direction).toEqual([0, 0, 1]);
    expect(left.direction).toEqual([-1, 0, 0]);
    expect(right.direction).toEqual([1, 0, 0]);
    for (const outlet of [left, right]) {
      const dot =
        inlet.direction[0] * outlet.direction[0] + inlet.direction[2] * outlet.direction[2];
      expect(dot).toBeCloseTo(0, 5);
    }
  });

  it("joins via the existing run|run compatibility rule", () => {
    expect(canConnect(port("splitter", "inlet").kind, "run")).toBe(true);
    expect(canConnect("run", port("splitter", "outlet-l").kind)).toBe(true);
  });
});

describe("bumper piece", () => {
  it("registers a portless free-standing type", () => {
    const def = PIECE_TYPE_IDS.bumper;
    expect(def.ports).toEqual([]);
  });
});

describe("bumper physics", () => {
  it("lets a head-on marble bounce away or pop over, never rest trapped", async () => {
    const world = await createPhysics();
    spawnStaticPiece(new Scene(), world, "bumper", { position: [0, 0, 0], yawDeg: 0 });
    const body = world.createRigidBody(RigidBodyDesc.dynamic().setTranslation(0, 0.1, 1));
    world.createCollider(
      ColliderDesc.ball(MARBLE_RADIUS).setFriction(0.45).setRestitution(0.15),
      body,
    );
    body.setLinvel({ x: 0, y: 0, z: -2 }, true);
    // The dome must never trap a marble against a rail: with gentle flanks a
    // head-on marble either rebounds (z back past +0.5) or rides up and over
    // the low crown (continues past -0.5, no downstream piece in this world).
    let settled = false;
    for (let step = 0; step < 900 && !settled; step += 1) {
      world.step();
      const t = body.translation();
      if (t.z > 0.5 || t.z < -0.5) settled = true;
    }
    expect(settled).toBe(true);
  });
});
