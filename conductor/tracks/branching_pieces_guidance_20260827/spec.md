# Specification: Branching Pieces & Route Guidance

## Overview

Grow the toy set with the first branching piece and a free-standing bumper,
then make the existing advisory guidance visible in 3D. The Y-splitter lets
one Drop point feed two runs — physics decides each marble's side. The glossy
bumper dome adds a bouncy, connector-free obstacle anywhere on the table.
Route guidance turns the text-only Track status helper into subtle 3D
signals: disconnected pieces pulse, and the live drop→cup route glows.
Together they enrich the core Build → Release → Watch → Iterate loop for
kids & families while preserving the offline, zero-asset, minimal-HUD product
direction.

## Functional Requirements

### FR-1 · Y-splitter piece (`splitter`)

- New `PieceTypeId` in `src/pieces/registry.ts` with exactly 3 ports, all
  kind `"run"`: one inlet at the stem top, two outlets at the branch tips.
  No new port kinds and no `COMPATIBLE_PAIRS` change — `run|run` already joins.
- Y-shaped channel geometry with a rounded splitter apex; collision via the
  existing builders + trimesh pipeline.
- Deflection is purely physical (collision with the apex) — no marble
  routing, no injected randomness. Acceptance: both branches demonstrably
  receive marbles from the same Drop point during manual verification.
- Tray button "Splitter" with shape preview, ≥44 px touch target; standard
  yaw rotation; ghost-preview snapping identical to existing pieces.

### FR-2 · Bumper piece (`bumper`)

- Portless graph node (zero ports/connections) riding the existing v2
  `TrackGraph` schema — no save version bump; old saves stay loadable;
  save→load→save round-trips identical.
- Free table placement (surface raycast like the Drop point's placement, at
  floor level) with ghost preview; move/delete/undo/redo through the existing
  edit pipeline and unified editor history.
- Static body with dome/sphere collider; high restitution tuned for a
  satisfying toy-like bounce; marble motion stays strictly physical.

### FR-3 · 3D route guidance

- Unreachable highlights: pieces owning ≥1 connector port that are not
  reachable from the Drop-point landing piece render a subtle pulse.
  Portless bumpers and the Drop point are exempt — they never pulse.
- Route glow: when drop-point health is `ready`, a soft glow traces the
  connected route from the landing piece through to every reachable goal cup
  (multi-goal supported).
- Always-on, contextual: visuals appear only when applicable and auto-hide
  otherwise. No new HUD controls or settings.
- Reachability/path helpers live in logic-bearing modules (extend
  `src/track/health.ts`) and get unit tests; rendering glue is verified
  manually per `workflow.md`.
- `prefers-reduced-motion`: the pulse falls back to a static tint instead of
  animation.

### FR-4 · Visual system

- Colors use shade-family reuse: splitter is a shade variant of the curve's
  hue; bumper is a tint within an existing family. ≤6 saturated hues on
  screen maintained; shape differentiates pieces — never rely on hue alone.
- Copy: kid-safe labels ("Splitter", "Bumper"), sentence case, no walls of
  text.

## Non-Functional Requirements

- Mobile parity: touch placement for the bumper; guidance visuals legible on
  phone; existing DPR/shadow caps untouched.
- Payload: `pnpm check:size` stays within ≤3,500 kB min / ≤1,250 kB gzip;
  still zero external runtime assets.
- Performance: guidance recomputes only on graph/drop-point edits (not per
  frame); 20-marble streams remain smooth on a mid-range phone with both new
  pieces in scene.
- Compatibility: v1→v2 migration untouched; existing tests keep passing;
  Biome and strict TypeScript stay clean.
- Logic-bearing modules get Vitest tests written before implementation with
  ≥80% coverage on new/changed code.

## Acceptance Criteria

- Tray shows 5 physical pieces + Drop point including Splitter & Bumper;
  place/move/delete/undo/redo all work for both.
- One Drop point feeds both splitter branches → two goal cups receive
  marbles.
- Bumper on the open table produces a satisfying, physical bounce.
- A disconnected connector-bearing piece pulses subtly; connecting it stops
  the pulse; a bumper never pulses.
- A ready route shows the drop→cup glow; it hides automatically when the
  route breaks.
- Old saves load; new-layout saves round-trip identically.
- CI green: vitest, biome, build, check:size within budget; docs updated
  (product.md piece set, README tray description).

## Out of Scope

- Alternating or player-aimed splitter routing (any marble-routing state).
- In-line bumper pads, trampoline launchers, or further piece types.
- Guidance toggle/settings UI; music/ambient audio (product non-goal).
- Save schema version bump; sharing/export; marble cosmetics (product
  non-goals).
