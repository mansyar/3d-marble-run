# Per-Cup Goal Counters — Implementation Plan

Workflow note: per `conductor/workflow.md`, the per-cup tally is a **logic-bearing module** → TDD (Red → Green, ≥80% coverage). The floating label layer is **rendering/presentation glue** → verified through the manual verification protocol at the phase checkpoint.

## Phase 1: Per-Cup Tally Logic (TDD)

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
- [ ] Task: Wire per-cup tallies into the scoring path
  - [ ] `src/app.ts`: on `GoalTracker.update()` entries, publish per-cup deltas to the label layer (thin glue only; label rendering lands in Phase 2)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Floating Counter Labels (visual glue — manual verification)

- [ ] Task: Implement cup label overlay
  - [ ] New `src/render/cupCounters.ts`: one pooled HTML chip per placed goal cup, positioned each frame by projecting the cup inlet (`getWorldPort(goal-cup, inlet)`) with the active camera; hide when behind camera; `pointer-events: none`; toy-styled, kid-readable digits; punch/pop animation on increment, instant under `prefers-reduced-motion: reduce`
- [ ] Task: Wire labels to piece lifecycle and scoring
  - [ ] `src/app.ts`: create/remove/move chips as cups are placed, moved, deleted, undone/redone; new cups start at 0; feed Phase 1 per-cup deltas to drive increments; reset all chips on table reset and save load; global HUD counter untouched
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Final Quality Gate

- [ ] Task: Full `CI=true pnpm biome check . && CI=true pnpm vitest run && pnpm build`, size-budget gate, desktop + touch manual sweep (Refer to workflow.md)

## Phase: Review Fixes

- [ ] Task: Apply review suggestions (appended by `conductor-review` if findings arise)
