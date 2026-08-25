import { describe, expect, it } from "vitest";
import {
  createDropPointSpawnerAdvance,
  createDropPointSpawnerDrop,
} from "../src/sim/dropPointSpawner";
import { createSpawner } from "../src/sim/spawner";
import { createDropPoint } from "../src/track/dropPoint";

const point = createDropPoint([3, 0, -4]);
const readyLanding = {
  status: "ready" as const,
  position: [3, 1, -4] as [number, number, number],
  normal: [0, 1, 0] as [number, number, number],
  distance: 3,
  pieceId: "piece-1",
};

describe("Drop point spawner", () => {
  it("positions manual drops above a ready Drop point", () => {
    const result = createDropPointSpawnerDrop(createSpawner(), point, readyLanding);

    expect(result.spawned).toHaveLength(1);
    expect(result.spawned[0].position).toEqual([3, 4.15, -4]);
    expect(result.streamStopped).toBeUndefined();
  });

  it("guards drops when the point or landing is unavailable", () => {
    const spawner = createSpawner();
    const noLanding = {
      ...readyLanding,
      status: "no-landing" as const,
      position: null,
      pieceId: null,
    };

    expect(createDropPointSpawnerDrop(spawner, null, noLanding)).toEqual({
      spawned: [],
      recycled: [],
    });
    expect(createDropPointSpawnerDrop(spawner, point, noLanding)).toEqual({
      spawned: [],
      recycled: [],
    });
  });

  it("stops a continuous stream when readiness disappears", () => {
    const spawner = createSpawner({ streamIntervalMs: 100 });
    spawner.setContinuous(true);
    const noLanding = {
      ...readyLanding,
      status: "no-landing" as const,
      position: null,
      pieceId: null,
    };

    const result = createDropPointSpawnerAdvance(spawner, point, noLanding, 100);

    expect(result).toEqual({ spawned: [], recycled: [], streamStopped: true });
    expect(spawner.isContinuous()).toBe(false);
  });

  it("advances a ready continuous stream from the Drop point", () => {
    const spawner = createSpawner({ streamIntervalMs: 100 });
    spawner.setContinuous(true);

    const result = createDropPointSpawnerAdvance(spawner, point, readyLanding, 100);

    expect(result.spawned[0].position).toEqual([3, 4.15, -4]);
  });
});
