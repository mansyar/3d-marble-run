# Implementation Plan: Marble Engine Scale-Up — 2× Population with Adaptive Stream Pacing

## Phase 1 · Population Governor (pure logic) [checkpoint: f6820e0]

### [x] Task: Write failing tests for the population governor `84fb84f`
- Extend a new `tests/population.test.ts` (Vitest, pure — no Rapier/Three):
  `resolveMarbleCap` pins CAPPED→40 / DESKTOP→60;
  `createFrameBudget` hysteresis: sustained 33 ms deltas pause after the window,
  single 100 ms spike never pauses, 60 Hz deltas never pause, resume needs
  sustained headroom. Confirm RED before implementation.
- Notes: RED confirmed — missing module `src/sim/population`. 10 tests pin the
  tier-cap and hysteresis semantics (pause needs sustained overage; resume
  streak resets on relapse).

### [x] Task: Implement population governor and commit Phase 1 `f6820e0`
- `src/sim/population.ts` — `resolveMarbleCap(tier)` + `createFrameBudget`
  per pinned tests. GREEN, ≥80% coverage on changed logic.
- Commit `feat(sim): Add marble population governor with frame-budget hysteresis`;
  git note attached.
- Notes: full suite 274/274 GREEN; population.ts coverage 97.82% statements /
  100% lines / 100% functions; Biome clean (119 files, 1 import-format fix
  applied via `--write`).

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `f6820e0`
- Full suite verified GREEN on this exact tree: 274/274 passing, governor
  coverage 97.82% stmts / 100% lines / 100% funcs (Biome clean).
- Manual verification proposal (pure-logic scope: coverage gate + REPL smoke
  across budget window — spikes hold, sustained overage sheds, recovery
  reacquires) presented; user confirmed checkpoint at `f6820e0`.
- Checkpoint recorded: Phase 1 `[checkpoint: f6820e0]`.

## Phase 2 · Marble Pool (logic + integration) [checkpoint: e9a2a23]

### [x] Task: Write failing tests for the marble pool `bf2ab10`
- `tests/marblePool.test.ts` (repo convention: suites live in `tests/`, not
  colocated as the plan draft suggested) with a mocked body/deps harness
  standing in for the Rapier world: acquire-from-pool before create, release
  parks + resets transform/velocity like a fresh spawn, pool never exceeds
  cap, clear drains, unknown-id release is a no-op. Confirm RED.
- Notes: RED confirmed — missing module `src/sim/marblePool`. 8 tests pin
  the acquire/release/park/clear contract incl. maxParked overflow destroy.

### [x] Task: Implement marble pool, wire into app.ts, commit `e9a2a23`
- `src/sim/marblePool.ts` — pure pool (`acquire/release/setMaxParked/clear`);
  pairs park asleep 1000 m below origin with zeroed velocities and redeploy
  like fresh spawns; overflow releases destroy; shared SphereGeometry/
  MeshPhysicalMaterial stay in `pieces/marble.ts` (already singletons).
- Pure additions (TDD): spawner `setMaxMarbles` (shrink recycles oldest-first,
  returns recycled ids); `resolveTier` in `core/quality.ts`.
- Wiring: `app.ts` spawn/remove paths go through the pool; frame-budget gate
  pauses only the stream advance under sustained frame overage (manual
  one-shot drops bypass); `scene.ts` exposes `resolveTier()`; quality toggle
  `onModeChange` re-resolves the cap live (boot applies the tier cap before
  the first frame).
- Notes: suite 290/290 GREEN; tsc clean; Biome clean (121 files); coverage
  98.34% stmts / 100% funcs. Shared geometry/material already pooled —
  `createPair` composes them with a parked body, no renderer changes.

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `e9a2a23`
- Full suite verified GREEN on this exact tree: 290/290 passing (16 new
  tests); `tsc --noEmit` clean; Biome clean (121 files); coverage 98.34%
  stmts / 100% funcs.
- Manual protocol (desktop 60-marble stream ≥1 min; touch 40-marble ≥1 min;
  Auto↔High mid-stream cap re-resolution; one-shot drops never blocked)
  proposed; user confirmed checkpoint on automated gates at `e9a2a23`,
  deferring visual verification to the final phase protocol.
- Checkpoint recorded: Phase 2 `[checkpoint: e9a2a23]`.

## Phase 3 · Docs & Release Readiness [checkpoint: TBD]

### [ ] Task: Update product & tech docs
- `product.md` V1 feature set + success criteria language (40 mid-range /
  60 desktop marbles at smooth framerates; adaptive stream pacing description).
- `tech-stack.md` simulation-capacity note (tier-aware caps, pooled marbles)
  with dated entry.
- README performance sentence update.

### [ ] Task: Final quality gate
- `CI=true pnpm biome check .` + `CI=true pnpm vitest run` + `pnpm build` +
  `pnpm check:size` within ≤3,500 kB min / ≤1,250 kB gzip.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- Full manual protocol on desktop + touch: desktop cap stream smooth ≥1 min,
  capped-tier stream smooth ≥1 min, one-shot drops never blocked, zero
  visual/material parity drift, save round-trips.
- Await explicit user confirmation; record final phase checkpoint SHA in
  `plan.md`.
