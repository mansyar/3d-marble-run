# Per-Cup Goal Counters — Implementation Plan

Workflow note: per `conductor/workflow.md`, the per-cup tally is a **logic-bearing module** → TDD (Red → Green, ≥80% coverage). The floating label layer is **rendering/presentation glue** → verified through the manual verification protocol at the phase checkpoint.

## Phase 1: Per-Cup Tally Logic (TDD) [checkpoint: 5914d1f]

- [x] Task: Write failing tests for per-cup tally (TDD Red)
  (`d591dd8`) — `tests/goals.test.ts` extended with 3 cases: per-cup
  tallies + unknown-cup zero, reset clearing tallies, one-time-per-marble across
  repeated updates. Confirmed Red before implementation (3 failed / 3 passed).
  - [ ] Extend `tests/goals.test.ts`: `countFor(goalPieceId)` / `counts()` snapshot reflect per-cup entries; one-time-per-marble semantics unchanged; global `count()` remains the sum; `reset()` clears per-cup tallies
- [x] Task: Implement per-cup tally to pass tests (TDD Green)
  (`5914d1f`) — `src/sim/goals.ts`: per-cup `Map<string, number>` maintained on
  entry; `countFor(id)` / `counts()` snapshot added to `GoalTracker`; reset clears
  tallies. 100% statements/branches/functions/lines on `goals.ts`; full suite green.
  - [ ] Extend `src/sim/goals.ts` `GoalTracker` with a per-cup count map keyed by goal piece id; keep `GoalEntry` shape untouched; verify ≥80% coverage on changed logic
- [x] Task: Wire per-cup tallies into the scoring path
  — Folded into Phase 2 wiring (in-flight refinement): `detectGoalEntries()`
  in `src/app.ts` already iterates full `GoalEntry[]` objects that carry
  `goalPieceId`; the Phase 2 label layer consumes these entries directly, so a
  separate delta-publish seam would be speculative glue. No code change needed.
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
      `[checkpoint: 5914d1f]` — verification report attached to `5914d1f`

## Phase 2: Floating Counter Labels (visual glue — manual verification) [checkpoint: 2c32a29]

- [x] Task: Implement cup label overlay
  (`b7ef0ce`) — `src/render/cupCounters.ts`: pooled HTML chip per goal cup,
  projected from the cup inlet (+0.45 lift) each frame; hidden when behind the
  camera; `pointer-events: none`; toy-styled chip (goal-pop palette); punch
  animation on increment, disabled under `prefers-reduced-motion` (CSS + JS
  guard). Chip lifecycle handled by per-frame diff in `update()` — placement,
  deletion, moves, undo/redo, and save loads stay consistent without extra hooks.
- [x] Task: Wire labels to piece lifecycle and scoring
  (`2c32a29`) — `src/app.ts`: per-frame `cupCounters.update(graph.pieces)`
  in the render callback (declared before `initScene` per the
  `dropPointGuide` optional-chaining pattern); `detectGoalEntries()` feeds
  `score(goalPieceId, countFor(goalPieceId))`; `resetSimulationState()` zeroes
  chips (covers table reset and save-slot load, which calls it before
  `replaceGraph`). Global HUD counter untouched.
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
      `[checkpoint: 2c32a29]` — verification report attached to `2c32a29`

## Phase 3: Final Quality Gate

- [x] Task: Full `CI=true pnpm biome check . && CI=true pnpm vitest run && pnpm build`, size-budget gate, desktop + touch manual sweep (Refer to workflow.md)
      — all gates passed (biome clean, 314/314 tests, build ok, payload
      3,507.28 kB min / 1,250.16 kB gzip within 3,600/1,260 budget; desktop +
      touch sweep user-confirmed, incl. reduced-motion and reset/load zeroing).

## Phase: Review Fixes

- [ ] Task: Apply review suggestions (appended by `conductor-review` if findings arise)
