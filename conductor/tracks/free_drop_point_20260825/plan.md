# Implementation Plan: Free Drop Point Spawning

One commit per task. Logic-bearing tasks follow Red → Green → coverage; visual
and input-glue tasks use the phase manual-verification checkpoint.

## Phase 1: Drop point domain, landing results, and route health

- [x] Task: Define the Drop point model and fixed-height rules `[7b111fe]`
  - [x] Write failing tests for nullable point state, fixed Y=4 normalization,
    X/Z placement validation, and one-point replacement behavior. `[b9b26b4]`
  - [x] Implement the pure Drop point model and validation helpers. `[7b111fe]`
  - [x] Run targeted tests and changed-logic coverage. Drop point coverage is
    100%; Biome and TypeScript also pass.

- [x] Task: Define landing-raycast results and readiness states `[df69703]`
  - [x] Write failing tests for first valid upward-facing surface, ignored wall
    hits, no landing, and invalid bounds/positions. `[4100516]`
  - [x] Implement a testable Rapier raycast adapter and landing result model.
    `[df69703]`
  - [x] Run targeted tests, coverage, Biome, and TypeScript. Landing coverage is
    96.29% statements / 100% lines.

- [x] Task: Adapt track health from gate roots to landing-piece roots `[0fa2a7e]`
  - [x] Write failing tests for missing Drop point, missing landing, disconnected
    goal, direct Goal cup landing, and ready connected routes. `[1ca55b9]`
  - [x] Implement route reachability from the detected landing piece. `[0fa2a7e]`
  - [x] Preserve advisory states and editing independence. Drop-point health is
    additive, leaving the legacy gate health API available during migration.

- [x] Verification checkpoint: Phase 1 domain and health tests, coverage,
  Biome, TypeScript, and focused code review. `[0fa2a7e]` User accepted the
  checkpoint after full automated and desktop/mobile verification.

## Phase 2: Free placement, guide rendering, and gate-aware runtime replacement

- [x] Task: Add the non-snapped Drop point placement controller `[a1cce2e]`
  - [x] Add placement tests for free X/Z movement, one-point replacement,
    deletion, undo/redo, and no graph mutation. `[e93af76]`
  - [x] Implement tray selection, free-plane movement, touch input, and
    command-stack integration. `[543a448, a1cce2e]`
  - [x] Keep physical-piece snapping and editing unchanged. The Drop point
    controller has no TrackGraph or snapping dependency.

- [x] Task: Render and update the marker and vertical landing guide `[9db470b]`
  - [x] Implement the toy-like marker and guide scene objects. `[9db470b]`
  - [x] Refresh the raycast and guide endpoint continuously during movement and
    after committed edits, load, reset, and camera changes as needed. The
    controller emits movement previews and the runtime refreshes after physics
    steps; static-body ownership is rebuilt with the scene.
  - [x] Verify reduced-motion and accessible status behavior manually. The
    visual/input behavior is included in the Phase 2 checkpoint after runtime
    status integration; the guide itself is independent of motion preferences.

- [x] Task: Replace gate spawning with Drop point spawning `[a782c2b]`
  - [x] Write failing scheduler tests for positioned drops, no-landing guards,
    continuous streaming, and automatic stream stop/state propagation.
    `[29222d8]`
  - [x] Implement the Drop point spawn adapter and wire manual/continuous
    runtime paths without regressing cleanup, goals, timer, or reset. `[a782c2b]`
  - [x] Disable Drop/Stream and synchronize HUD state when readiness is invalid.
    `[a782c2b]`

- [x] Verification checkpoint: desktop and mobile placement/guide/runtime
  verification, full automated tests, coverage, Biome, TypeScript, and build.
  `[4a93fc1]` Full verification passed with 23 test files / 134 tests, 93.8%
  statements / 96.2% lines, Biome, TypeScript, standard and `/marblescape/`
  builds at 3,432.52 kB JavaScript / 1,243.49 kB gzip. Desktop placement
  reached `Run ready! Drop a marble.` and a Drop marble reached `Goals: 1`;
  mobile 360px verification showed all six tray tools at 52.3px × 66px with
  no document overflow. Browser output contained only the known favicon 404
  and Three.js/WebGL warnings. User accepted the checkpoint.
  Checkpoint hardening also isolated physical-piece pointer handling while
  Drop point mode is active and synchronized landing health after placement.

## Phase 3: Version-2 persistence, v1 migration, and starter integration

- [x] Task: Add version-2 Drop point serialization `[1d63632]`
  - [x] Write failing tests for v2 round trips, null points, malformed points,
    duplicate point data, and stable save output. `[816e9b1]`
  - [x] Implement v2 serialization/deserialization with strict fixed-height and
    bounds validation. `[1d63632]`
  - [x] Verify version-1 gate-less saves remain loadable with no Drop point;
    full tests, coverage, Biome, TypeScript, and build pass.

- [x] Task: Migrate version-1 Start-gate saves `[16cf1dc]`
  - [x] Write failing tests for gate-less v1 saves, connected gate migration,
    discarded gate edges, preserved physical connections, and invalid legacy
    data. `[754f561]`
  - [x] Implement migration before scene restoration and keep legacy gate data
    out of new active graphs. `[16cf1dc]`
  - [x] Verify migration preserves physical connections and rejects invalid
    legacy references; full tests, coverage, Biome, TypeScript, and build pass.

- [x] Task: Update starter and startup/load integration `[3aaba2d]`
  - [x] Write failing tests for the five-piece starter, Drop point placement,
    ready health, first Drop traversal, and first-launch persistence. `[9aeedd6]`
  - [x] Implement starter creation, startup defaults, load replacement, reset,
    and persistence callbacks for the separate Drop point setting. `[3aaba2d]`
  - [x] Verify targeted starter, storage, and serialization tests (19 tests),
    targeted coverage, Biome, and TypeScript pass.

- [x] Verification checkpoint: persistence/starter regression, full tests,
  coverage, Biome, TypeScript, and production build. `[3aaba2d]` Full
  verification passed with 23 test files / 139 tests, 92.19% statements /
  94.64% lines, Biome, TypeScript, and standard and `/marblescape/` builds at
  3,433.63 kB JavaScript / 1,243.71 kB gzip. A fresh desktop load created the
  five-piece starter with a ready Drop point; a Drop marble reached `Goals: 1`;
  named save/load restored the Drop point and ready state; and 360px mobile
  verification showed six 52.3px × 66px tray tools with no overflow. Browser
  output had no application errors and only the known Three.js shadow-map
  warning. User accepted the checkpoint.

## Phase 4: UI polish, documentation, accessibility, and release verification

- [x] Task: Update tray, HUD, status copy, and responsive styling
  - [x] Add friendly Drop point labels, accessible names, no-landing guidance,
    ready state, and disabled Drop/Stream semantics. `[a1cce2e, a782c2b]`
  - [x] Preserve ≥44px controls, narrow-tray layout, focus rings, and reduced
    motion. `[1b005e5, a1cce2b]` Existing Phase 2 UI implementation satisfies
    the approved responsive and accessibility requirements.

- [x] Task: Update product documentation and migration notes `[73f4d2e]`
  - [x] Document the Drop point workflow, landing guide, readiness guidance,
    and v1 Start-gate migration. `[73f4d2e]`
  - [x] Keep out-of-scope boundaries and offline guarantees explicit. The
    documentation retains offline-only persistence and the approved exclusions.

- [x] Task: Run final regression and manual verification `[73f4d2e]`
  - [x] Run `CI=true pnpm vitest run`. 23 test files / 139 tests passed.
  - [x] Run `CI=true pnpm biome check .` and `pnpm exec tsc --noEmit`.
  - [x] Run `CI=true pnpm vitest run --coverage`: 92.19% statements, 86.73%
    branches, 96.27% functions, and 94.64% lines.
  - [x] Run `pnpm build` and `pnpm build -- --base=/marblescape/`: both passed
    at 3,433.63 kB JavaScript / 1,243.71 kB gzip.
  - [x] Verify desktop and 360px/mobile touch flows, guide updates, invalid
    landing guidance, starter goals, save/load, undo/redo, and streaming.
    Desktop streaming reached `Goals: 18` in eight seconds; invalid Drop point
    deletion disabled Drop/Stream with friendly guidance; mobile had no
    overflow and retained six 52.3px × 66px tools.

- [x] Verification checkpoint: final automated and desktop/mobile verification
  with explicit user acceptance and a Git verification note. `[73f4d2e]` User
  accepted the final checkpoint after the completed regression and manual
  verification report.
