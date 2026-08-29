# Per-Cup Goal Counters — Specification

## Overview

`product.md`'s core loop promises *"goal-cup counters show how your build performs"*, but scoring is currently global-only: `GoalTracker` (`src/sim/goals.ts`) keeps a single `total`, and the HUD shows one number. Players with branched builds (splitters!) can't see which route scores more. This track adds a session-scoped tally per goal cup, displayed as a floating toy-styled counter label anchored above each cup via camera projection — the established DOM-overlay pattern. Pure tally logic is a small TDD module; the label layer is visual glue verified manually.

## Functional Requirements

1. **Per-cup tally logic (pure, TDD):** Extend `src/sim/goals.ts` (or add a sibling pure module) so the goal tracker maintains a per-cup count map keyed by goal piece id (`countFor(id)` / `counts()` snapshot) alongside the existing global `count()`. `GoalEntry` already carries `goalPieceId`; counting logic, one-time-per-marble semantics, and reset behavior are unchanged and covered by tests.
2. **Floating counter labels:** Each placed goal cup renders one counter label — a small rounded HTML chip anchored to the cup's inlet position via camera projection each frame. Chip shows the cup's current count (number only, large kid-readable digits). Reuses the toy aesthetic (rounded, warm palette); sits above the cup, never intercepts pointer events.
3. **Live tracking:** Labels appear/disappear/move with cup placement, deletion, move, and undo/redo. A cup (re)placed in this session starts at 0 — counts are session-scoped and not part of the layout.
4. **Score feedback:** When a marble enters a cup, its chip increments with a brief punch/pop animation; suppressed under `prefers-reduced-motion: reduce` (number updates instantly).
5. **Reset behavior:** Per-cup counts reset with the existing table reset and on save-slot load/auto-save restore — same lifecycle as the global counter. No new user-facing reset control.
6. **Global counter unchanged:** The existing HUD counter, track status, and guidance continue to work exactly as today.
7. **Projection hygiene:** Labels hide when their cup is behind the camera; at most one chip per cup; DOM nodes pooled/reused per cup id (no per-frame allocations of elements).

## Non-Functional Requirements

- **No new dependencies, no assets** — DOM + existing Three.js projection only; negligible JS delta, size-budget gate unaffected.
- **Mobile parity:** chips legible at phone sizes; `pointer-events: none` so touch building near a cup is unaffected.
- **Performance:** per-frame cost is O(cups) vector projections; cups are few — no measurable frame impact at 40–60 marbles.
- **Simulation untouched:** spawning, physics, pool, and pacing behavior unchanged; only tally bookkeeping and presentation.

## Acceptance Criteria

- Each placed goal cup shows its own live count; counts update as marbles land (desktop + touch).
- Splitter builds visibly show different tallies per branch cup.
- Placing, moving, deleting, and undo/redo of cups keeps labels consistent; a re-added cup starts at 0.
- Table reset and save load reset all counts; global counter behavior unchanged.
- Reduced motion: increments are instant, no punch animation.
- Full quality gates pass (`biome`, `vitest`, `tsc`, `build`, size budget); new/changed logic ≥80% coverage.

## Out of Scope

- Celebration particles/confetti, cup recolor/glow effects, sound changes.
- Persisting counts in saves (schema stays v2), all-time stats, HUD legend panel.
- Any new settings, reset controls, or physics/spawning changes.
