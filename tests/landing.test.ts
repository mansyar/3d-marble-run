import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { describe, expect, it } from "vitest";
import { createDropPoint, type DropPoint } from "../src/track/dropPoint";
import { createPhysics } from "../src/sim/physics";
import { resolveLanding, selectLandingHit } from "../src/sim/landing";

describe("drop point landing", () => {
  it("resolves the first upward-facing physical surface and its piece", async () => {
    const world = await createPhysics();
    const body = world.createRigidBody(RigidBodyDesc.fixed());
    world.createCollider(ColliderDesc.cuboid(1, 0.05, 1), body);

    const result = resolveLanding(
      world,
      createDropPoint([0, 0, 0]),
      new Map([[body.handle, "piece-1"]]),
    );

    expect(result).toMatchObject({ status: "ready", pieceId: "piece-1" });
    expect(result.position?.[1]).toBeCloseTo(0.05);
    expect(result.normal?.[1]).toBeCloseTo(1);
  });

  it("ignores wall-facing hits and chooses the nearest valid landing", () => {
    expect(
      selectLandingHit([
        { distance: 1, normal: [0, 0, 1], pieceId: "wall" },
        { distance: 3, normal: [0, 1, 0], pieceId: "floor" },
        { distance: 2, normal: [0, 0.7, 0], pieceId: "ramp" },
      ]),
    ).toEqual({ distance: 2, normal: [0, 0.7, 0], pieceId: "ramp" });
  });

  it("reports no landing when the ray finds no mapped track surface", async () => {
    const world = await createPhysics();
    const body = world.createRigidBody(RigidBodyDesc.fixed());
    world.createCollider(ColliderDesc.cuboid(1, 0.05, 1), body);

    expect(resolveLanding(world, createDropPoint([0, 0, 0]), new Map())).toEqual({
      status: "no-landing",
      position: null,
      normal: null,
      distance: null,
      pieceId: null,
    });
  });

  it("reports invalid point positions before querying physics", async () => {
    const world = await createPhysics();
    const invalidPoint = { position: [Number.NaN, 4, 0] } as DropPoint;

    expect(resolveLanding(world, invalidPoint, new Map())).toEqual({
      status: "invalid-position",
      position: null,
      normal: null,
      distance: null,
      pieceId: null,
    });
  });
});
