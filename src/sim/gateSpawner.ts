import type { Vec3 } from "../pieces/registry";
import type { TrackGraph } from "../track/graph";
import { resolveSpawnAnchor } from "./playability";
import type { MarbleSpawn, Spawner, SpawnResult } from "./spawner";

export interface PositionedMarbleSpawn extends MarbleSpawn {
  readonly position: Vec3;
}

export interface PositionedSpawnResult {
  spawned: PositionedMarbleSpawn[];
  recycled: number[];
  /** True when this call stopped a stream whose gate disappeared. */
  streamStopped?: boolean;
}

function emptyResult(streamStopped = false): PositionedSpawnResult {
  return streamStopped
    ? { spawned: [], recycled: [], streamStopped: true }
    : { spawned: [], recycled: [] };
}

function positionResult(
  result: SpawnResult,
  position: Vec3,
  streamStopped = false,
): PositionedSpawnResult {
  const positioned: PositionedSpawnResult = {
    spawned: result.spawned.map((marble) => ({ ...marble, position: [...position] as Vec3 })),
    recycled: result.recycled,
  };
  if (streamStopped) positioned.streamStopped = true;
  return positioned;
}

function resolveOrStopStream(
  spawner: Spawner,
  graph: TrackGraph,
): { position: Vec3 | null; streamStopped: boolean } {
  const resolution = resolveSpawnAnchor(graph);
  if (resolution.status === "missing-start") {
    const streamStopped = spawner.isContinuous();
    if (streamStopped) spawner.setContinuous(false);
    return { position: null, streamStopped };
  }
  return { position: resolution.position, streamStopped: false };
}

/** Drop a marble only when a placed start gate supplies a world anchor. */
export function createGateSpawnerDrop(spawner: Spawner, graph: TrackGraph): PositionedSpawnResult {
  const resolution = resolveOrStopStream(spawner, graph);
  return resolution.position
    ? positionResult(spawner.drop(), resolution.position, resolution.streamStopped)
    : emptyResult(resolution.streamStopped);
}

/** Advance stream scheduling only while a start gate remains available. */
export function createGateSpawnerAdvance(
  spawner: Spawner,
  graph: TrackGraph,
  elapsedMs: number,
): PositionedSpawnResult {
  const resolution = resolveOrStopStream(spawner, graph);
  return resolution.position
    ? positionResult(spawner.advance(elapsedMs), resolution.position, resolution.streamStopped)
    : emptyResult(resolution.streamStopped);
}
