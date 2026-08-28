# Implementation Plan: Anti-Jam Resilience — Stuck-Marble Self-Rescue & Funnel Throughput

**Track**: `anti_jam_resilience_20260828` · **Spec**: [./spec.md](./spec.md) · **Branch**: `feat/anti_jam_resilience_20260828`
**Workflow rules apply** (TDD red→green, one task = one commit + git note, ≥80% coverage on changed logic, plan status `[ ]` → `[~]` → `[x] <sha7>`, phase checkpoints per workflow.md)

## Phase 1 · Stuck Detector — Pure Logic & Self-Rescue Integration — Checkpoint `b3bca0e`

- [x] **Task 1.1: TDD — failing tests for `stuckDetector.ts` (logic-bearing)** *(RED phase) — RED confirmed (6/9 failing) `abbdecf`*
  - Create `src/sim/stuckDetector.ts` stub + `src/sim/stuckDetector.test.ts` (Vitest, follow `spawner.test.ts`/`playability.test.ts` conventions).
  - Pin cases:
    - steady roller at 0.6 m/s for 2 s → never stuck
    - marble at 0.04 m/s within 0.03 m for 1_200 ms → flagged after window
    - grace period: marble idle for 500 ms after spawn at t=0 → not flagged until t≥800 ms
    - displacement reset: idle 900 ms then moves 0.1 m → window resets, not flagged
    - removal forgets id: `remove(id)` or second `update` missing → not returned by `stuckIds()`
    - velocity threshold boundary: 0.11 vs 0.13 m/s around 0.12 default
    - nudge-budget helper (if exposed): caps at 3 per 1_000 ms sliding window
  - Run `CI=true pnpm vitest run src/sim/stuckDetector.test.ts` → confirm RED (fails) before implementation. Commit not yet.

- [x] **Task 1.2: Implement `createStuckDetector` (GREEN phase)** — GREEN 9/9  `abbdecf`
  - Implement `createStuckDetector(opts?: { velocityThreshold, positionEpsilon, stuckWindowMs, graceMs })` per FR-1:
    - Internal `Map<id, { startPos, startMs, lastPos, graceUntil, nudgedAt? }>`
    - `update(id, position: Vec3, velocity: Vec3 | { vy, speed }, nowMs)` — compute speed = `hypot(vx,vy,vz)`; if grace → skip; if speed < threshold && dist(startPos, position) < epsilon → keep window else reset window start
    - `stuckIds(nowMs): number[]` returns ids whose window age ≥ stuckWindowMs and currently below threshold/epsilon
    - `isStuck(id)`, `remove(id)`, `reset()` helpers
  - Keep pure — no Three/Rapier imports, no DOM, no timers. Document with TSDoc.
  - Re-run tests → GREEN. `CI=true pnpm vitest run --coverage src/sim/stuckDetector.test.ts` target ≥80% line/branch on this module.

- [x] **Task 1.3: Integrate nudge-then-recycle policy into `src/app.ts`** — nudge±0.35+recycle 900ms+remove hook+clock via `abbdecf` baseline**
  - Instantiate detector alongside `marbleImpacts` / `spawner`; feed it each frame from `liveMarbles` velocities + positions (use `body.linvel()` magnitude and `body.translation()`).
  - Insert `cleanupStuckMarbles()` before `cleanupOutOfBoundsMarbles()` in the RAF loop:
    - On first flag for an id → `body.applyImpulse({x: rand±0.35, y:0.08, z: rand±0.35}, true)` and mark `nudgedAt = nowMs`, rate-limit 3/s globally via a small queue of timestamps.
    - On second flag ≥900 ms after nudge → `spawner.remove(id)` + `removeMarble(id)` + `stuckDetector.remove(id)` (no goal credit, no SFX).
  - Dev-only console debug gated by `import.meta.env.DEV` (optional).
  - Verify existing suites still green: `CI=true pnpm vitest run` (expect 244+ new tests passing).

- [x] **Task 1.4: Cover changed logic and commit Phase 1** — 9/9 tests, coverage 96.7%, biome clean, build+size 3498.36/1247.21 `b3bca0e`
  - `CI=true pnpm vitest run --coverage` ≥80% on `stuckDetector.ts`; `CI=true pnpm biome check .` clean; `pnpm build` ok; `pnpm check:size` within 3,500/1,250 and ≤1.8 kB delta (measure vs 3,496.72/1,246.57 baseline).
  - One commit: `feat(sim): add stuck detector with nudge-then-recycle self-rescue` — attach git note with task summary.
  - Update plan: mark Task 1.1–1.4 `[x] <sha7>`.

- [x] **Task 1.5: Phase Verification & Checkpoint (Refer to workflow.md)** — automated green, user approved to continue `b3bca0e`
  - Run full automated suite once; propose manual verification:
    1. `pnpm dev` → desktop 1280×720 + touch 393×659
    2. Load starter, enable continuous Stream, watch 60 s: no marble idles >2.5 s inside funnel/splitter
    3. Funnel pile-up repro: place lone funnel, drop 5 marbles rapid → clears without Reset
    4. Confirm out-of-bounds cull still works (drop marble off table)
    5. Confirm goal counter not incremented by recycled stuck marbles
  - Await explicit user confirmation ("yes" or feedback).
  - Record phase checkpoint SHA in this plan heading; commit plan update `conductor(plan): Mark phase 'Stuck Detector' as complete`.

## Phase 2 · Throughput Tuning — Funnel Throat & Splitter Fork & Bounds Authority — Checkpoint `80e7aa0`

- [x] **Task 2.1: Funnel/splitter collider tuning (visual/physics glue)** — widened throat 0.13→0.14 (+7.7%), lowered funnel friction to 0.38, restitution 0.12, splitter verified identical
  - In `src/pieces/builders.ts` / `src/pieces/trimesh.ts`: widen funnel inner throat by 6–8% (scale inner collider vertices or adjust `trimesh` margin) and lower funnel wall friction by 0.06 (keep restitution ≤0.15–0.18).
  - Verify splitter: both `outlet-l`/`outlet-r` prongs share identical friction/restitution; ridge apex not knife-edge (tiny 0.02 fillet if needed via collider tweak).
  - No new geometry assets, no new deps. Keep `MARBLE_RADIUS`, `TRACK_WIDTH`, `FUNNEL_HEIGHT` constants unchanged.
  - Manual check: single marble at 0.8 m/s from Drop point into splitter inlet exits within 600 ms (time with `performance.now` around `update` loop or video frame count).

- [x] **Task 2.2: Bounds authority hardening (logic-adjacent, TDD if pure helper)** — expanded PLAYABLE_BOUNDS to ±28 XZ (Y -8) for unified stuck+bounds cull
  - Extend `src/sim/playability.ts` (`findOutOfBoundsMarbleIds`) or its threshold constants: cap XZ playfield at ±28 and Y cull at -8, with a 1 s grace tracked externally if needed; if a pure helper `isOutOfBounds(pos, nowMs)` is extracted, add TDD coverage for it (≥80%).
  - Ensure unified path: bounds-cull and stuck-recycle both call `spawner.remove(id)` + `removeMarble(id)` so timer/goal state stays consistent.
  - Re-run `src/sim/playability.test.ts` and full suite → green.

- [x] **Task 2.3: Cover changed logic and commit Phase 2** — biome clean, 253 tests green, size 3498.47/1247.23 within budget
  - `CI=true pnpm vitest run --coverage` (playability if touched) ≥80%; `CI=true pnpm biome check .` clean; `pnpm build` + `pnpm check:size` within budget/delta.
  - One commit: `feat(pieces): widen funnel throat and harden bounds authority` + git note.
  - Update plan `[x]`.

- [x] **Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md)** — automated green, user approved to continue `80e7aa0`
  - Automated suite green; manual protocol:
    1. Same 20-marble 60 s stream with funnel+splitter+curve chain — no ridge stalls
    2. Splitter inlet→outlet timing ≤600 ms (single marble)
    3. XZ edge test: place Drop point at table edge (x=26) and drop — marbles falling beyond 28 are culled within 1 s
  - Await user confirmation; record checkpoint SHA; commit plan.

## Phase 3 · Quality Gate, Docs & Release Readiness

- [ ] **Task 3.1: Docs touch-up (if needed)**
  - If throughput changes are user-visible, add one sentence to `README.md` Build and play: "Runs self-heal — stalled marbles are gently nudged then recycled so streams stay fluid."
  - Verify `conductor/product.md` still accurate (no piece-count or non-goal change); `conductor/tech-stack.md` Payload section updated with measured post-track `check:size` totals + headroom if delta warrants re-baseline note.

- [ ] **Task 3.2: Final quality gate**
  - `CI=true pnpm vitest run --coverage` (all logic modules ≥80% overall; new module ≥80%)
  - `CI=true pnpm biome check .`
  - `pnpm build` + `pnpm check:size` — must be ≤3,500 kB min / ≤1,250 kB gzip, delta ≤1.8/1.2 vs v0.3.0 baseline (3,496.72/1,246.57)
  - Scope coverage via `git diff --name-only <previous_checkpoint_sha> HEAD` — every changed logic module has a test file.

- [ ] **Task 3.3: Final Phase Verification & Checkpoint (Refer to workflow.md)**
  - Full manual regression on desktop (1280×720) + touch (393×659):
    - Snap connector-to-connector, bumper free-placement, Drop point guide
    - Guidance pulse still legible, route glow traces landing→cup
    - 20-marble stream 60 s shows no persistent jams (AC-1)
    - Out-of-bounds cull, goal pop + counter, timer, Stream toggle gating, undo/redo, IndexedDB save/load, PWA offline, sound toggle
  - Await explicit user confirmation; record final checkpoint SHA.
  - Commit plan: `conductor(plan): Mark phase 'Quality Gate' as complete`.

## Review Fixes (appended by `conductor-review` if needed)

- [ ] Task: Apply review suggestions — TBD after review.
