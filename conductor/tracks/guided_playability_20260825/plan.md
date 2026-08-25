# Implementation Plan: Guided Playability & Track Reliability

Progress notes are appended under completed tasks per `workflow.md`.
One commit per task.

## Phase 1 · Start Gate & Track-Health Domain [checkpoint: 1b005e5]

- [x] Task: Write failing tests for start-gate registry and graph rules `[ccccf70]`
  - [x] Define the `start-gate` piece, its `spout` port, world-port transform,
    and compatibility with run pieces.
  - [x] Verify only one start gate can exist in a graph.
  - [x] Verify a second placement is rejected without mutating the graph.
  - [x] Verify graph status for missing gate, disconnected gate, and
    gate-to-goal connectivity.
  - Notes: Added Red-phase Vitest coverage for the start-gate registry,
    singleton graph rule, port transforms, and track-health states.
- [x] Task: Implement start-gate registry and track-health logic `[c8c9174]`
  - [x] Add the new piece type and port definition.
  - [x] Add a pure track-health/reachability module.
  - [x] Preserve existing graph, connection, undo, and delete semantics.
  - Notes: Added the start-gate material and procedural chute builder as
    required type plumbing. Added singleton enforcement for new and restored
    pieces, plus BFS-based advisory connectivity status.
- [x] Task: Add procedural start-gate geometry and tray integration `[db44a07]`
  - [x] Build the gate mesh and Rapier collider.
  - [x] Add its material/color and tray label.
  - [x] Ensure ghost placement, rotation, snapping, and touch controls work.
  - Notes: The procedural gate, collider, and violet material were added with
    the registry implementation; this task finalized the friendly tray labels
    and accessible action names. Existing registry-driven placement behavior
    remains unchanged.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) `[1b005e5]`
  - Notes: Automated tests, Biome, TypeScript, coverage, and build passed.
    Desktop verification confirmed the starter route reaches a goal. Mobile
    verification confirmed all six tray buttons fit and Start gate placement
    activates its Turn control. User accepted the checkpoint.

## Phase 2 · Gate-Driven Simulation & Lost-Marble Cleanup `[cb1ad23]`

- [x] Task: Write failing tests for spawn resolution and playable bounds `[9f736da]`
  - [x] Verify the gate’s world-space spawn anchor under placement and yaw.
  - [x] Verify missing-gate and invalid-boundary classifications.
  - [x] Verify cleanup state does not count a goal or leave an active marble.
  - Notes: Added Red-phase coverage for gate-driven spawn resolution,
    boundary classification, lost-marble identification, goal non-counting,
    and active-spawner cleanup.
- [x] Task: Replace the fixed spawn position with gate-driven spawning `[2ac4375, 354f4ca]`
  - [x] Resolve the active gate from the graph. `[bd9cb31]`
  - [x] Make manual drops and streams use the gate anchor. `[2ac4375, 354f4ca]`
  - [x] Prevent invisible spawns when no gate exists. `[2ac4375, 354f4ca]`
  - [x] Disable/stop streaming safely when the gate is deleted. `[2ac4375, 354f4ca]`
  - Notes: Added the pure gate-anchor resolver, positioned scheduler adapter,
    missing-gate guard, and main-loop integration.
- [x] Task: Implement lost-marble cleanup `[bd9cb31, 354f4ca]`
  - [x] Add documented playable-world bounds.
  - [x] Remove out-of-bounds meshes, bodies, and spawner entries.
  - [x] Keep timer, stream state, goal count, and reset behavior coherent.
  - Notes: Added the shared safety envelope and cleanup before goal detection;
    cleanup removes the scheduler entry and physics body without incrementing
    goals.
- [x] Task: Add advisory track-status feedback `[cb1ad23]`
  - [x] Show friendly no-gate, disconnected-goal, and ready states.
  - [x] Refresh status after edits, undo/redo, startup, and loads.
  - [x] Keep all editing actions available regardless of status.
  - Notes: Added an accessible live HUD output with concise guidance and
    refreshed it through placement changes, startup, and load replacement.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) `[cb1ad23]`
  - Notes: Full automated verification and desktop/mobile browser checks
    passed. User accepted the checkpoint. See the verification note on
    `cb1ad23`.

## Phase 3 · Starter Track & Save Compatibility `[6f1e733]`

- [x] Task: Write failing tests for start-gate serialization compatibility `[e867c62]`
  - [x] Round-trip graphs containing a start gate and connections.
  - [x] Confirm existing v1 payloads without a start gate still load.
  - [x] Reject malformed or conflicting start-gate data.
  - [x] Verify starter topology includes a valid gate-to-goal route.
  - Notes: Added Red coverage for save compatibility, singleton validation,
    gate-derived starter spawning, and first-launch persistence.
- [x] Task: Implement persistence and startup compatibility `[d0f0af3, 6f1e733]`
  - [x] Extend serialization validation for `start-gate`. `[d0f0af3]`
  - [x] Preserve v1 save loading without silently modifying user layouts. `[d0f0af3]`
  - [x] Add the start gate to the first-launch starter graph. `[d0f0af3]`
  - [x] Ensure named saves and autosave preserve it. `[6f1e733]`
  - Notes: Serialization remains version 1, accepts gate-less legacy saves,
    rejects duplicate gates, and persists the connected starter gate through
    both save-slot paths.
- [x] Task: Integrate full-load and starter UX `[d0f0af3, 354f4ca, cb1ad23]`
  - [x] Rebuild the start-gate scene/body during graph replacement. `[354f4ca]`
  - [x] Refresh track status after autosave loads and named-slot loads. `[cb1ad23]`
  - [x] Confirm the first launch remains immediately playable. `[d0f0af3]`
  - Notes: Existing graph replacement rebuilds every registered piece and the
    starter now resolves a gate anchor that traverses into the goal cup.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) `[6f1e733]`
  - Notes: Full automated verification and desktop/mobile browser checks
    passed. User accepted the checkpoint. See the verification note on
    `6f1e733`.

## Phase 4 · Regression, Accessibility & Budget Verification `[6282163]`

- [x] Task: Audit changed logic coverage and invariants `[d0f0af3, 6f1e733]`
  - [x] Run targeted coverage for graph health, serialization, spawn
    resolution, and cleanup.
  - [x] Confirm changed logic meets the project’s approximately 80% target.
  - [x] Review singleton, save-format, and active-marble lifecycle invariants.
  - Notes: Targeted coverage passed 41 tests at 89.42% statements / 92.84%
    lines overall; changed graph, health, serialization, playability, starter,
    and storage paths are covered above the project target.
- [x] Task: Complete automated and manual verification `[6f1e733]`
  - [x] Run tests, Biome, TypeScript, production build, and base-path build.
  - [x] Verify desktop and touch placement, spawning, status feedback,
    deletion, undo/redo, and loading.
  - [x] Verify reduced-motion behavior, touch targets, no page scrolling, and
    15–20-marble responsiveness.
  - [x] Confirm output remains within the existing 3,500 kB JS / 1,250 kB gzip
    budget.
  - Notes: Full suite passed 109 tests; Biome and TypeScript passed; standard
    and `/marblescape/` builds passed at 3,425.28 kB JS / 1,241.28 kB gzip.
    Desktop and real-touch iPhone 15 emulation covered placement, spawning,
    stream load, status, undo/redo, saves, reduced motion, touch targets, and
    no page scrolling. Eight seconds of streaming scored seven goals without
    runtime errors.
- [x] Task: Update user-facing documentation and record the final checkpoint `[6282163]`
  - [x] Document the start gate and custom-track spawning behavior. `[6282163]`
  - [x] Add implementation notes and verification results to `plan.md`.
  - [x] Complete the phase checkpoint according to `workflow.md`. `[6282163]`
  - Notes: README and product definition now describe the six-piece tray,
    single gate entry point, advisory guidance, and local persistence. Final
    automated and real-touch verification was accepted by the user; see the
    verification note on `6282163`.

## Post-review fixes

- [x] Task: Address formal review findings `[6a7e97d]`
  - [x] Reject a second Start gate at the placement boundary without throwing
    or mutating the graph.
  - [x] Keep the Stream HUD synchronized when gate-aware scheduling stops after
    gate deletion.
  - Notes: Added placement preflight coverage and propagated an explicit
    stream-stop signal through manual and continuous gate-aware spawn results.
    Targeted tests, Biome, and TypeScript passed; final verification follows.
