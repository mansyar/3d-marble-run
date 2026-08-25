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
}

function emptyResult(): PositionedSpawnResult {
  return { spawned: [], recycled: [] };
}

function positionResult(result: SpawnResult, position: Vec3): PositionedSpawnResult {
  return {
    spawned: result.spawned.map((marble) => ({ ...marble, position: [...position] as Vec3 })),
    recycled: result.recycled,
  };
}

function resolveOrStopStream(spawner: Spawner, graph: TrackGraph): Vec3 | null {
  const resolution = resolveSpawnAnchor(graph);
  if (resolution.status === "missing-start") {
    if (spawner.isContinuous()) spawner.setContinuous(false);
    return null;
  }
  return resolution.position;
}

/** Drop a marble only when a placed start gate supplies a world anchor. */
export function createGateSpawnerDrop(spawner: Spawner, graph: TrackGraph): PositionedSpawnResult {
  const position = resolveOrStopStream(spawner, graph);
  return position ? positionResult(spawner.drop(), position) : emptyResult();
}

/** Advance stream scheduling only while a start gate remains available. */
export function createGateSpawnerAdvance(
  spawner: Spawner,
  graph: TrackGraph,
  elapsedMs: number,
): PositionedSpawnResult {
  const position = resolveOrStopStream(spawner, graph);
  return position ? positionResult(spawner.advance(elapsedMs), position) : emptyResult();
}
