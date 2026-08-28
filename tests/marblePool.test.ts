import { describe, expect, it, vi } from "vitest";
import {
  createMarblePool,
  type MarblePoolDeps,
  type PoolableBody,
  type PoolVector,
} from "../src/sim/marblePool";

interface FakeBodyState {
  pos: PoolVector;
  linvel: PoolVector;
  angvel: PoolVector;
  asleep: boolean;
}

type FakeBody = PoolableBody & { state: FakeBodyState };

interface FakePair {
  mesh: { id: number };
  body: FakeBody;
}

const PARKING: PoolVector = { x: 0, y: -1000, z: 0 };

function makeFakeBody(): FakeBody {
  const state: FakeBodyState = {
    pos: { x: 0, y: 0, z: 0 },
    linvel: { x: 0, y: 0, z: 0 },
    angvel: { x: 0, y: 0, z: 0 },
    asleep: false,
  };
  return {
    state,
    setTranslation(t, wakeUp) {
      state.pos = { ...t };
      if (wakeUp) state.asleep = false;
    },
    setLinvel(v) {
      state.linvel = { ...v };
    },
    setAngvel(v) {
      state.angvel = { ...v };
    },
    sleep() {
      state.asleep = true;
    },
  };
}

function makeDeps() {
  const created: FakePair[] = [];
  const destroyed: FakePair[] = [];
  let serial = 0;
  const createPair = vi.fn((): FakePair => {
    const pair: FakePair = { mesh: { id: ++serial }, body: makeFakeBody() };
    created.push(pair);
    return pair;
  });
  const destroyPair = vi.fn((pair: FakePair) => {
    destroyed.push(pair);
  });
  const deps: MarblePoolDeps<FakePair["mesh"], FakeBody> = { createPair, destroyPair };
  return { deps, createPair, destroyPair, created, destroyed };
}

describe("marble pool — acquire", () => {
  it("creates a fresh pair when the pool is empty and deploys it like a new spawn", () => {
    const { deps, createPair } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 4 });

    const pair = pool.acquire({ x: 1, y: 2, z: 3 });

    expect(createPair).toHaveBeenCalledTimes(1);
    expect(pair.body.state.pos).toEqual({ x: 1, y: 2, z: 3 });
    expect(pair.body.state.linvel).toEqual({ x: 0, y: 0, z: 0 });
    expect(pair.body.state.angvel).toEqual({ x: 0, y: 0, z: 0 });
    expect(pair.body.state.asleep).toBe(false);
  });

  it("redeploys a parked body instead of creating a new pair", () => {
    const { deps, createPair } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 4 });
    const first = pool.acquire({ x: 0, y: 5, z: 0 });
    pool.release(first);
    expect(createPair).toHaveBeenCalledTimes(1);

    const second = pool.acquire({ x: 2, y: 8, z: -1 });

    expect(createPair).toHaveBeenCalledTimes(1); // no new creation
    expect(second.body).toBe(first.body);
    expect(second.mesh).toBe(first.mesh);
    expect(second.body.state.pos).toEqual({ x: 2, y: 8, z: -1 });
    expect(second.body.state.linvel).toEqual({ x: 0, y: 0, z: 0 });
    expect(second.body.state.angvel).toEqual({ x: 0, y: 0, z: 0 });
    expect(second.body.state.asleep).toBe(false);
  });
});

describe("marble pool — release", () => {
  it("parks the body: zeroed velocities, parked position, asleep", () => {
    const { deps } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 4 });
    const pair = pool.acquire({ x: 0, y: 1, z: 0 });
    pair.body.setLinvel({ x: 3, y: -2, z: 1 }, true);
    pair.body.setAngvel({ x: 0.5, y: 0.5, z: 0.5 }, true);

    expect(pool.release(pair)).toBe(true);

    expect(pair.body.state.pos).toEqual(PARKING);
    expect(pair.body.state.linvel).toEqual({ x: 0, y: 0, z: 0 });
    expect(pair.body.state.angvel).toEqual({ x: 0, y: 0, z: 0 });
    expect(pair.body.state.asleep).toBe(true);
  });

  it("destroys instead of parking when the parked pool is already at the cap", () => {
    const { deps, destroyPair, created } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 1 });
    const a = pool.acquire({ x: 0, y: 1, z: 0 });
    const b = pool.acquire({ x: 0, y: 2, z: 0 });

    expect(pool.release(a)).toBe(true);
    expect(pool.parkedCount()).toBe(1);

    expect(pool.release(b)).toBe(true);
    expect(destroyPair).toHaveBeenCalledTimes(1);
    expect(destroyPair).toHaveBeenCalledWith(b);
    expect(pool.parkedCount()).toBe(1); // bound respected
    expect(created).toHaveLength(2);
  });

  it("is a no-op for a pair that is not checked out", () => {
    const { deps } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 4 });

    const stranger: FakePair = { mesh: { id: 99 }, body: makeFakeBody() };
    expect(pool.release(stranger)).toBe(false);
    expect(pool.parkedCount()).toBe(0);

    const pair = pool.acquire({ x: 0, y: 1, z: 0 });
    expect(pool.release(pair)).toBe(true);
    expect(pool.release(pair)).toBe(false); // double release
    expect(pool.parkedCount()).toBe(1);
  });
});

describe("marble pool — clear and counts", () => {
  it("clear() drains every parked pair and leaves checked-out marbles untouched", () => {
    const { deps, destroyPair } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 4 });
    const a = pool.acquire({ x: 0, y: 1, z: 0 });
    pool.acquire({ x: 0, y: 2, z: 0 });
    pool.release(a);

    expect(pool.clear()).toBe(1);
    expect(pool.parkedCount()).toBe(0);
    expect(destroyPair).toHaveBeenCalledTimes(1);
    expect(destroyPair).toHaveBeenCalledWith(a);
    expect(pool.checkedOutCount()).toBe(1); // b still active
  });

  it("counts track acquire/release cycles", () => {
    const { deps } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 4 });
    expect(pool.checkedOutCount()).toBe(0);
    expect(pool.parkedCount()).toBe(0);

    const a = pool.acquire({ x: 0, y: 1, z: 0 });
    const b = pool.acquire({ x: 0, y: 2, z: 0 });
    expect(pool.checkedOutCount()).toBe(2);

    pool.release(a);
    expect(pool.checkedOutCount()).toBe(1);
    expect(pool.parkedCount()).toBe(1);

    pool.release(b);
    expect(pool.parkedCount()).toBe(2);
  });

  it("rejects invalid maxParked configurations", () => {
    const { deps } = makeDeps();
    expect(() => createMarblePool(deps, { maxParked: 0 })).toThrow();
    expect(() => createMarblePool(deps, { maxParked: -3 })).toThrow();
    expect(() => createMarblePool(deps, { maxParked: 1.5 })).toThrow();
    expect(() => createMarblePool(deps, { maxParked: Number.NaN })).toThrow();
  });
});

describe("marble pool — setMaxParked", () => {
  it("validates like the constructor and leaves counts untouched", () => {
    const { deps } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 2 });
    const pair = pool.acquire({ x: 0, y: 1, z: 0 });
    pool.release(pair);

    expect(() => pool.setMaxParked(0)).toThrow();
    expect(() => pool.setMaxParked(-1)).toThrow();
    expect(() => pool.setMaxParked(2.5)).toThrow();
    expect(() => pool.setMaxParked(Number.NaN)).toThrow();
    expect(pool.parkedCount()).toBe(1);
    expect(pool.checkedOutCount()).toBe(0);
  });

  it("shrinking the bound makes overflow releases destroy instead of park", () => {
    const { deps, destroyPair } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 2 });
    const a = pool.acquire({ x: 0, y: 1, z: 0 });
    const b = pool.acquire({ x: 0, y: 2, z: 0 });
    const c = pool.acquire({ x: 0, y: 3, z: 0 });
    pool.release(a);
    pool.release(b);
    expect(pool.parkedCount()).toBe(2);

    pool.setMaxParked(1);
    expect(pool.release(c)).toBe(true);
    expect(destroyPair).toHaveBeenCalledWith(c);
    expect(pool.parkedCount()).toBe(2); // existing parked pairs are left as-is
  });

  it("growing the bound lets releases park again", () => {
    const { deps, destroyPair } = makeDeps();
    const pool = createMarblePool(deps, { maxParked: 1 });
    const a = pool.acquire({ x: 0, y: 1, z: 0 });
    const b = pool.acquire({ x: 0, y: 2, z: 0 });
    pool.release(a);

    pool.setMaxParked(3);
    expect(pool.release(b)).toBe(true);
    expect(destroyPair).not.toHaveBeenCalledWith(b);
    expect(pool.parkedCount()).toBe(2);
  });
});
