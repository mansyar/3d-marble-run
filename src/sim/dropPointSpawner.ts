import type { Vec3 } from "../pieces/registry";
import type { DropPoint } from "../track/dropPoint";
import type { LandingResult } from "./landing";
import type { MarbleSpawn, Spawner, SpawnResult } from "./spawner";

export const DROP_SPAWN_OFFSET = 0.15;

export interface PositionedDropPointMarbleSpawn extends MarbleSpawn {
  readonly position: Vec3;
}

export interface DropPointSpawnResult {
  spawned: PositionedDropPointMarbleSpawn[];
  recycled: number[];
  /** True when this call stopped a stream that lost Drop point readiness. */
  streamStopped?: boolean;
}

function emptyResult(streamStopped = false): DropPointSpawnResult {
  return streamStopped
    ? { spawned: [], recycled: [], streamStopped: true }
    : { spawned: [], recycled: [] };
}

function positionResult(
  result: SpawnResult,
  position: Vec3,
  streamStopped = false,
): DropPointSpawnResult {
  const positioned: DropPointSpawnResult = {
    spawned: result.spawned.map((marble) => ({
      ...marble,
      position: [...position] as Vec3,
    })),
    recycled: result.recycled,
  };
  if (streamStopped) positioned.streamStopped = true;
  return positioned;
}

function resolveSpawnPosition(
  spawner: Spawner,
  point: DropPoint | null,
  landing: LandingResult,
): { position: Vec3 | null; streamStopped: boolean } {
  if (!point || landing.status !== "ready") {
    const streamStopped = spawner.isContinuous();
    if (streamStopped) spawner.setContinuous(false);
    return { position: null, streamStopped };
  }
  const [x, y, z] = point.position;
  return { position: [x, y + DROP_SPAWN_OFFSET, z], streamStopped: false };
}

/** Drop one marble only when the Drop point has a valid physical landing. */
export function createDropPointSpawnerDrop(
  spawner: Spawner,
  point: DropPoint | null,
  landing: LandingResult,
): DropPointSpawnResult {
  const resolution = resolveSpawnPosition(spawner, point, landing);
  return resolution.position
    ? positionResult(spawner.drop(), resolution.position, resolution.streamStopped)
    : emptyResult(resolution.streamStopped);
}

/** Advance continuous scheduling only while Drop point readiness remains valid. */
export function createDropPointSpawnerAdvance(
  spawner: Spawner,
  point: DropPoint | null,
  landing: LandingResult,
  elapsedMs: number,
): DropPointSpawnResult {
  const resolution = resolveSpawnPosition(spawner, point, landing);
  return resolution.position
    ? positionResult(spawner.advance(elapsedMs), resolution.position, resolution.streamStopped)
    : emptyResult(resolution.streamStopped);
}
