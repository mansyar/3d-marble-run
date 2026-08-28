/**
 * Marble pool — reuse of parked mesh/body pairs across spawn/recycle cycles.
 *
 * At the scaled-up population (40 capped / 60 desktop concurrent marbles),
 * creating and destroying a mesh, dynamic rigid body, and ball collider on
 * every stream tick causes GC churn and physics-world fragmentation. The pool
 * parks released pairs instead: the body stays in the Rapier world but is put
 * to sleep far below the table with zeroed velocities, and the next acquire
 * redeploys it like a fresh spawn (position set, velocities zeroed, awake).
 *
 * Invariants, pinned by `tests/marblePool.test.ts`:
 *
 * - An acquired pair is always deployed like a fresh spawn: at the requested
 *   position, zero linear/angular velocity, awake.
 * - `release` parks (or destroys when the parked pool is at `maxParked`) and
 *   is a no-op for pairs that are not checked out.
 * - The parked pool never exceeds `maxParked`; `clear` drains it (destroying
 *   every parked pair) and never touches checked-out pairs.
 *
 * Gameplay loops must only ever iterate pairs obtained from `acquire` and not
 * yet released — parked bodies are asleep outside the play area and are
 * therefore invisible to them, but they do still exist in the physics world.
 */

export interface PoolVector {
  x: number;
  y: number;
  z: number;
}

/** The slice of the Rapier `RigidBody` API the pool needs to park/deploy. */
export interface PoolableBody {
  setTranslation(t: PoolVector, wakeUp?: boolean): void;
  setLinvel(v: PoolVector, wakeUp?: boolean): void;
  setAngvel(v: PoolVector, wakeUp?: boolean): void;
  sleep(): void;
}

export interface MarblePair<M, B extends PoolableBody> {
  mesh: M;
  body: B;
}

export interface MarblePoolDeps<M, B extends PoolableBody> {
  /** Creates a fresh pair: scene-backed mesh + dynamic body with ball collider. */
  createPair(): MarblePair<M, B>;
  /** Destroys a pair: removes the mesh from the scene and the body from the world. */
  destroyPair(pair: MarblePair<M, B>): void;
}

export interface MarblePoolOptions {
  /** Maximum number of pairs kept parked; overflow releases are destroyed. */
  maxParked: number;
  /** Where parked bodies rest, out of play. Defaults to 1000 m below origin. */
  parkingPosition?: PoolVector;
}

export interface MarblePool<M, B extends PoolableBody> {
  /** Returns a deployed pair (at `position`, zeroed velocities, awake). */
  acquire(position: PoolVector): MarblePair<M, B>;
  /** Parks or destroys a checked-out pair; no-op for unknown pairs. */
  release(pair: MarblePair<M, B>): boolean;
  /** Re-resolves the parked-pool bound live (device-tier changes). */
  setMaxParked(next: number): void;
  /** Destroys every parked pair; checked-out pairs are untouched. */
  clear(): number;
  parkedCount(): number;
  checkedOutCount(): number;
}

const DEFAULT_PARKING_POSITION: PoolVector = { x: 0, y: -1000, z: 0 };
const ZERO_VELOCITY: PoolVector = { x: 0, y: 0, z: 0 };

/** Creates the pure marble pool. Owns no Three.js or Rapier objects directly. */
export function createMarblePool<M, B extends PoolableBody>(
  deps: MarblePoolDeps<M, B>,
  options: MarblePoolOptions,
): MarblePool<M, B> {
  let maxParked = options.maxParked;
  const parkingPosition = options.parkingPosition ?? DEFAULT_PARKING_POSITION;
  if (!Number.isSafeInteger(maxParked) || maxParked < 1) {
    throw new Error("maxParked must be a positive integer");
  }

  const parked: MarblePair<M, B>[] = [];
  const checkedOut = new Set<MarblePair<M, B>>();

  function deploy(pair: MarblePair<M, B>, position: PoolVector): void {
    pair.body.setTranslation(position, true);
    pair.body.setLinvel(ZERO_VELOCITY, true);
    pair.body.setAngvel(ZERO_VELOCITY, true);
  }

  function park(pair: MarblePair<M, B>): void {
    pair.body.setTranslation(parkingPosition, false);
    pair.body.setLinvel(ZERO_VELOCITY, false);
    pair.body.setAngvel(ZERO_VELOCITY, false);
    pair.body.sleep();
    parked.push(pair);
  }

  return {
    acquire(position: PoolVector): MarblePair<M, B> {
      const pair = parked.pop() ?? deps.createPair();
      deploy(pair, position);
      checkedOut.add(pair);
      return pair;
    },

    release(pair: MarblePair<M, B>): boolean {
      if (!checkedOut.delete(pair)) return false;
      if (parked.length >= maxParked) {
        deps.destroyPair(pair);
        return true;
      }
      park(pair);
      return true;
    },

    setMaxParked(next: number): void {
      if (!Number.isSafeInteger(next) || next < 1) {
        throw new Error("maxParked must be a positive integer");
      }
      maxParked = next;
    },

    clear(): number {
      const drained = parked.length;
      for (const pair of parked) deps.destroyPair(pair);
      parked.length = 0;
      return drained;
    },

    parkedCount(): number {
      return parked.length;
    },

    checkedOutCount(): number {
      return checkedOut.size;
    },
  };
}
