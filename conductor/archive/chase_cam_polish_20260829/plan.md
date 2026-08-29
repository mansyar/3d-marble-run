# Chase-Cam Immersion Polish — Implementation Plan

Workflow note: per `conductor/workflow.md`, cameras and pointer→raycast glue are exempt
from unit-test mandates and are verified through the manual verification protocol. The
two genuinely logic-bearing pieces (tap classification, follow-target handoff) are
isolated into pure modules and built with TDD (Red → Green).

## Phase 1: Eased Mode Transitions (visual glue — manual verification) [checkpoint: dc6f647]

- [x] Task: Implement eased fly-to transition between free and chase modes
  (`dc6f647`) — Added a `toChase`/`toFree` transition state in `camera.ts` easing
  position + look-at over 800ms (ease-in-out cubic); chase→free destination is
  recomputed from live orbit state each frame (mid-flight input honored);
  `prefers-reduced-motion` → instant cut; existing damped follow takes over after
  arrival with no snap.
  - [ ] In `src/render/camera.ts`: add a transition state (idle → flying → following /
        → returning) that eases camera position (and look-at) between the current orbit
        framing and the chase position over ~0.6–1.0s with ease-in-out; ease back to the
        prior orbit framing on chase→free
  - [ ] Keep the existing exponential follow-damping after arrival; no visible snap at
        transition end
  - [ ] Respect `prefers-reduced-motion: reduce` — instant cut instead of the fly
        (match `guidance.ts` / `tray.ts` matchMedia pattern)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Tap-a-Marble-to-Ride (logic + glue) [checkpoint: d2c5cef]

- [x] Task: Write failing tests for tap-gesture classifier (TDD Red)
  (`d96554a`) — `tests/tapGesture.test.ts`, 11 cases: tap, mouse/touch parity,
  drag/pinch/long-press/cancel rejection, threshold boundaries.
- [x] Task: Implement classifier to pass tests (TDD Green) (`67db527`) —
  `src/render/tapGesture.ts`, pure module; second concurrent pointer taints all
  presses (pinch never fires a tap).
- [x] Task: Wire tap-to-ride input glue
  (`d2c5cef`) — `app.ts` canvas glue: classifier-confirmed taps in free mode
  raycast active marble meshes and pin chase cam via newly exposed
  `camera.setMode()`; `followedMarbleId` falls back to newest marble on
  despawn (full handoff in Phase 3); HUD label synced; resets on toggle-to-free
  and simulation reset.
  - [x] Raycast active marble meshes on classified taps in free mode (placement not
        locked); on hit switch to chase cam pinned to that marble id; desktop click +
        single-finger touch parity; must never fire during drags/pinches or while
        `isLocked`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Follow-Target Handoff (logic + glue) [checkpoint: 5bff170]

- [x] Task: Write failing tests for follow-target resolver (TDD Red)
  (`22133ec`) — `tests/followTarget.test.ts`, 10 cases covering all four
  removal paths, empty-track fallback, stale ids, same-batch removals.
- [x] Task: Implement resolver to pass tests (TDD Green); verify ≥80% coverage on new
      logic modules (`a53c4ec`) — `src/sim/followTarget.ts`, 100% coverage.
- [x] Task: Wire handoff into marble removal paths and camera
  (`5bff170`) — `removeMarble()` (funnel for all four removal paths) resolves
  the next follow target: glides to the newest remaining marble via
  chase-mode re-entry (now restarts the eased fly-to), or eases back to free
  orbit with HUD sync when none remain. Reduced-motion keeps instant cuts.
  - [x] Hook resolver into the four removal paths in `src/app.ts` (goal entry,
        out-of-bounds cleanup, stuck recycle, pool shrink); followed marble despawn →
        camera glides to next active marble, else eases back to free orbit; HUD button
        label stays in sync
- [x] Task: Final quality gate — full
      `CI=true pnpm biome check . && CI=true pnpm vitest run && pnpm build`,
      size-budget gate, desktop + touch manual sweep (Refer to workflow.md)
      — all gates passed (biome clean, 311/311 tests, bundleSizeGate 19/19,
      build ok; sweep user-confirmed)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
      `[checkpoint: 5bff170]` — verification report attached to `5bff170`

## Phase: Review Fixes

- [x] Task: Apply review suggestions `d5a4748` — Rewrote the stale
  `followedMarbleTarget` fallback comment: it is a safety net for removal paths
  that bypass `removeMarble` (e.g. the immediate `setMaxMarbles` shrink), not a
  pending Phase 3 replacement. Advisory notes (immediate-shrink glide bypass,
  touch occlusion offset) recorded in the review report; no code change needed.
