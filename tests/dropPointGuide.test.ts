import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Scene } from "three";
import { describe, expect, it, vi } from "vitest";
import { createDropPointState } from "../src/build/dropPointPlacement";
import { createDropPointGuide } from "../src/render/dropPointGuide";
import { createPhysics } from "../src/sim/physics";
import { createDropPoint } from "../src/track/dropPoint";

describe("drop point guide", () => {
  it("shows the marker and guide for the nearest physical landing", async () => {
    const world = await createPhysics();
    const body = world.createRigidBody(RigidBodyDesc.fixed());
    world.createCollider(ColliderDesc.cuboid(1, 0.05, 1), body);
    world.step();
    const scene = new Scene();
    const onLandingChange = vi.fn();
    const guide = createDropPointGuide({
      scene,
      world,
      state: createDropPointState(createDropPoint([0, 0, 0])),
      trackBodies: new Map([[body.handle, "piece-1"]]),
      onLandingChange,
    });

    const result = guide.refresh();

    expect(result).toMatchObject({ status: "ready", pieceId: "piece-1" });
    expect(scene.children).toHaveLength(2);
    expect(scene.children[0].visible).toBe(true);
    expect(scene.children[1].visible).toBe(true);
    expect(scene.children[1].scale.y).toBeCloseTo(3.95);
    expect(onLandingChange).toHaveBeenCalledOnce();

    guide.dispose();
    expect(scene.children).toHaveLength(0);
  });

  it("keeps the marker visible and hides the guide without a landing", async () => {
    const world = await createPhysics();
    const scene = new Scene();
    const guide = createDropPointGuide({
      scene,
      world,
      state: createDropPointState(),
      trackBodies: new Map(),
    });

    const result = guide.setPreview([10, 0, 10]);

    expect(result.status).toBe("no-landing");
    expect(scene.children[0].visible).toBe(true);
    expect(scene.children[1].visible).toBe(false);

    guide.refresh();
    expect(scene.children[0].position.x).toBe(10);
  });
});
