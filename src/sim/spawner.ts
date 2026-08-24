export interface MarbleSpawn {
  readonly id: number;
  readonly spawnedAtMs: number;
}

export interface SpawnResult {
  spawned: MarbleSpawn[];
  /** Active marble ids that should be removed before the new spawn is used. */
  recycled: number[];
}

export interface SpawnerState {
  continuous: boolean;
  /** Oldest active marble first. */
  activeIds: number[];
  timerMs: number;
  timerRunning: boolean;
}

export interface SpawnerOptions {
  maxMarbles?: number;
  streamIntervalMs?: number;
}

export interface Spawner {
  /** Creates one marble immediately, regardless of the current stream mode. */
  drop(): SpawnResult;
  /** Advances stream scheduling and returns all events due during the interval. */
  advance(elapsedMs: number): SpawnResult;
  setContinuous(enabled: boolean): void;
  toggleContinuous(): boolean;
  isContinuous(): boolean;
  /** Removes a marble after it enters the goal cup. */
  remove(id: number): boolean;
  /** Clears active marbles and the run timer, and stops the stream. */
  reset(): { removedIds: number[] };
  state(): SpawnerState;
}

const DEFAULT_MAX_MARBLES = 20;
const DEFAULT_STREAM_INTERVAL_MS = 500;
const MAX_CATCH_UP_EVENTS = 20;

/**
 * Creates the pure scheduling state machine used by the physics integration.
 * It owns no Rapier or Three.js objects; callers consume SpawnResult events to
 * create, recycle, or remove live marble bodies and meshes.
 */
export function createSpawner(options: SpawnerOptions = {}): Spawner {
  const maxMarbles = options.maxMarbles ?? DEFAULT_MAX_MARBLES;
  const streamIntervalMs = options.streamIntervalMs ?? DEFAULT_STREAM_INTERVAL_MS;
  if (!Number.isSafeInteger(maxMarbles) || maxMarbles < 1) {
    throw new Error("maxMarbles must be a positive integer");
  }
  if (!Number.isFinite(streamIntervalMs) || streamIntervalMs <= 0) {
    throw new Error("streamIntervalMs must be finite and positive");
  }
  let clockMs = 0;
  let nextId = 1;
  let streamElapsedMs = 0;
  let continuous = false;
  let runStartedAtMs: number | null = null;
  const active: MarbleSpawn[] = [];

  function emptyResult(): SpawnResult {
    return { spawned: [], recycled: [] };
  }

  function spawnAt(spawnedAtMs: number): SpawnResult {
    const result = emptyResult();
    if (active.length >= maxMarbles) {
      const oldest = active.shift();
      if (oldest) result.recycled.push(oldest.id);
    }
    const marble = { id: nextId++, spawnedAtMs };
    active.push(marble);
    result.spawned.push(marble);
    if (runStartedAtMs === null) runStartedAtMs = spawnedAtMs;
    return result;
  }

  function appendResult(target: SpawnResult, source: SpawnResult): void {
    target.spawned.push(...source.spawned);
    target.recycled.push(...source.recycled);
  }

  return {
    drop(): SpawnResult {
      return spawnAt(clockMs);
    },

    advance(elapsedMs: number): SpawnResult {
      if (!Number.isFinite(elapsedMs) || !(elapsedMs > 0)) return emptyResult();
      clockMs += elapsedMs;
      const result = emptyResult();
      if (!continuous) return result;

      streamElapsedMs += elapsedMs;
      const dueEvents = Math.floor(streamElapsedMs / streamIntervalMs);
      if (dueEvents > MAX_CATCH_UP_EVENTS) {
        // A backgrounded tab can deliver a very large frame delta. Discard the
        // stale backlog rather than allocating thousands of bodies at once.
        streamElapsedMs = 0;
        return result;
      }
      for (let event = 0; event < dueEvents; event += 1) {
        streamElapsedMs -= streamIntervalMs;
        appendResult(result, spawnAt(clockMs - streamElapsedMs));
      }
      return result;
    },

    setContinuous(enabled: boolean): void {
      if (continuous === enabled) return;
      continuous = enabled;
      streamElapsedMs = 0;
    },

    toggleContinuous(): boolean {
      continuous = !continuous;
      streamElapsedMs = 0;
      return continuous;
    },

    isContinuous(): boolean {
      return continuous;
    },

    remove(id: number): boolean {
      const index = active.findIndex((marble) => marble.id === id);
      if (index < 0) return false;
      active.splice(index, 1);
      return true;
    },

    reset(): { removedIds: number[] } {
      const removedIds = active.map((marble) => marble.id);
      active.length = 0;
      continuous = false;
      streamElapsedMs = 0;
      runStartedAtMs = null;
      return { removedIds };
    },

    state(): SpawnerState {
      return {
        continuous,
        activeIds: active.map((marble) => marble.id),
        timerMs: runStartedAtMs === null ? 0 : clockMs - runStartedAtMs,
        timerRunning: runStartedAtMs !== null,
      };
    },
  };
}
