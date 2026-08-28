# Implementation Plan: Marble Engine Scale-Up — 2× Population with Adaptive Stream Pacing

## Phase 1 · Population Governor (pure logic) [checkpoint: TBD]

### [x] Task: Write failing tests for the population governor `84fb84f`
- Extend a new `tests/population.test.ts` (Vitest, pure — no Rapier/Three):
  `resolveMarbleCap` pins CAPPED→40 / DESKTOP→60;
  `createFrameBudget` hysteresis: sustained 33 ms deltas pause after the window,
  single 100 ms spike never pauses, 60 Hz deltas never pause, resume needs
  sustained headroom. Confirm RED before implementation.
- Notes: RED confirmed — missing module `src/sim/population`. 10 tests pin the
  tier-cap and hysteresis semantics (pause needs sustained overage; resume
  streak resets on relapse).

### [ ] Task: Implement population governor and commit Phase 1
- `src/sim/population.ts` — `resolveMarbleCap(tier)` + `createFrameBudget`
  per pinned tests. GREEN, ≥80% coverage on changed logic.
- Commit `feat(sim): Add marble population governor with frame-budget hysteresis`;
  git note attached.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- Run full suite once; propose manual verification of pure-logic scope
  (governor decisions observable via unit harness only — visual check deferred
  to Phase 3 integration).
- Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.

## Phase 2 · Marble Pool (logic + integration) [checkpoint: TBD]

### [ ] Task: Write failing tests for the marble pool
- `src/sim/marblePool.test.ts` with a mocked Rapier world: acquire-from-pool
  before create, release parks + resets transform/velocity like a fresh spawn,
  pool never exceeds cap, clear drains, unknown-id release is a no-op.
  Confirm RED.

### [ ] Task: Implement marble pool, wire into app.ts, commit
- `src/sim/marblePool.ts` — shared `SphereGeometry` + `MeshPhysicalMaterial`,
  parked bodies reused via `acquire/release/clear`.
- `app.ts` — spawn path goes through the pool; cap-shrink recycles
  oldest-first via existing spawner recycle; quality-preference change
  re-resolves the cap live. All pinned suites stay green (stream, timer,
  stuck detector, goals, autosave). GREEN + coverage.
- Commit `feat(sim): Pool marble meshes and colliders for 2× population`;
  git note attached.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- Run full suite once; propose manual verification (desktop: 60-marble stream
  ≥1 min; touch viewport: 40-marble stream ≥1 min; parity vs master).
- Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.

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
