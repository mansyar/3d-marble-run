# Implementation Plan: Free Drop Point Spawning

One commit per task. Logic-bearing tasks follow Red → Green → coverage; visual
and input-glue tasks use the phase manual-verification checkpoint.

## Phase 1: Drop point domain, landing results, and route health

- [ ] Task: Define the Drop point model and fixed-height rules
  - [ ] Write failing tests for nullable point state, fixed Y=4 normalization,
    X/Z placement validation, and one-point replacement behavior.
  - [ ] Implement the pure Drop point model and validation helpers.
  - [ ] Run targeted tests and changed-logic coverage.

- [ ] Task: Define landing-raycast results and readiness states
  - [ ] Write failing tests for first valid upward-facing surface, ignored wall
    hits, no landing, and invalid bounds/positions.
  - [ ] Implement a testable Rapier raycast adapter and landing result model.
  - [ ] Run targeted tests, coverage, Biome, and TypeScript.

- [ ] Task: Adapt track health from gate roots to landing-piece roots
  - [ ] Write failing tests for missing Drop point, missing landing, disconnected
    goal, direct Goal cup landing, and ready connected routes.
  - [ ] Implement route reachability from the detected landing piece.
  - [ ] Preserve advisory states and editing independence.

- [ ] Verification checkpoint: Phase 1 domain and health tests, coverage,
  Biome, TypeScript, and focused code review.

## Phase 2: Free placement, guide rendering, and gate-aware runtime replacement

- [ ] Task: Add the non-snapped Drop point placement controller
  - [ ] Add placement tests for free X/Z movement, one-point replacement,
    deletion, undo/redo, and no graph mutation.
  - [ ] Implement tray selection, marker placement, movement, touch input, and
    command-stack integration.
  - [ ] Keep physical-piece snapping and editing unchanged.

- [ ] Task: Render and update the marker and vertical landing guide
  - [ ] Implement the toy-like marker and guide scene objects.
  - [ ] Refresh the raycast and guide endpoint continuously during movement and
    after committed edits, load, reset, and camera changes as needed.
  - [ ] Verify reduced-motion and accessible status behavior manually.

- [ ] Task: Replace gate spawning with Drop point spawning
  - [ ] Write failing scheduler tests for positioned drops, no-landing guards,
    continuous streaming, and automatic stream stop/state propagation.
  - [ ] Implement the Drop point spawn adapter and wire manual/continuous
    runtime paths without regressing cleanup, goals, timer, or reset.
  - [ ] Disable Drop/Stream and synchronize HUD state when readiness is invalid.

- [ ] Verification checkpoint: desktop and mobile placement/guide/runtime
  verification, full automated tests, coverage, Biome, TypeScript, and build.

## Phase 3: Version-2 persistence, v1 migration, and starter integration

- [ ] Task: Add version-2 Drop point serialization
  - [ ] Write failing tests for v2 round trips, null points, malformed points,
    duplicate point data, and stable save output.
  - [ ] Implement v2 serialization/deserialization with strict validation.

- [ ] Task: Migrate version-1 Start-gate saves
  - [ ] Write failing tests for gate-less v1 saves, connected gate migration,
    discarded gate edges, preserved physical connections, and invalid legacy
    data.
  - [ ] Implement migration before scene restoration and keep legacy gate data
    out of new active graphs.
  - [ ] Verify named and autosave slot compatibility.

- [ ] Task: Update starter and startup/load integration
  - [ ] Write failing tests for the five-piece starter, Drop point placement,
    ready health, first Drop traversal, and first-launch persistence.
  - [ ] Implement starter creation, startup defaults, load replacement, reset,
    and persistence callbacks for the separate Drop point setting.

- [ ] Verification checkpoint: persistence/starter regression, full tests,
  coverage, Biome, TypeScript, and production build.

## Phase 4: UI polish, documentation, accessibility, and release verification

- [ ] Task: Update tray, HUD, status copy, and responsive styling
  - [ ] Add friendly Drop point labels, accessible names, no-landing guidance,
    ready state, and disabled Drop/Stream semantics.
  - [ ] Preserve ≥44px controls, narrow-tray layout, focus rings, and reduced
    motion.

- [ ] Task: Update product documentation and migration notes
  - [ ] Document the Drop point workflow, landing guide, readiness guidance,
    and v1 Start-gate migration.
  - [ ] Keep out-of-scope boundaries and offline guarantees explicit.

- [ ] Task: Run final regression and manual verification
  - [ ] Run `CI=true pnpm vitest run`.
  - [ ] Run `CI=true pnpm biome check .`.
  - [ ] Run `CI=true pnpm vitest run --coverage`.
  - [ ] Run `pnpm build` and `pnpm build -- --base=/marblescape/`.
  - [ ] Verify desktop and 360px/mobile touch flows, guide updates, invalid
    landing guidance, starter goals, save/load, undo/redo, and streaming.

- [ ] Verification checkpoint: final automated and desktop/mobile verification
  with explicit user acceptance and a Git verification note.
