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

## Phase 2 · Gate-Driven Simulation & Lost-Marble Cleanup

- [~] Task: Write failing tests for spawn resolution and playable bounds
  - [ ] Verify the gate’s world-space spawn anchor under placement and yaw.
  - [ ] Verify missing-gate and invalid-boundary classifications.
  - [ ] Verify cleanup state does not count a goal or leave an active marble.
- [ ] Task: Replace the fixed spawn position with gate-driven spawning
  - [ ] Resolve the active gate from the graph.
  - [ ] Make manual drops and streams use the gate anchor.
  - [ ] Prevent invisible spawns when no gate exists.
  - [ ] Disable/stop streaming safely when the gate is deleted.
- [ ] Task: Implement lost-marble cleanup
  - [ ] Add documented playable-world bounds.
  - [ ] Remove out-of-bounds meshes, bodies, and spawner entries.
  - [ ] Keep timer, stream state, goal count, and reset behavior coherent.
- [ ] Task: Add advisory track-status feedback
  - [ ] Show friendly no-gate, disconnected-goal, and ready states.
  - [ ] Refresh status after edits, undo/redo, startup, and loads.
  - [ ] Keep all editing actions available regardless of status.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 3 · Starter Track & Save Compatibility

- [ ] Task: Write failing tests for start-gate serialization compatibility
  - [ ] Round-trip graphs containing a start gate and connections.
  - [ ] Confirm existing v1 payloads without a start gate still load.
  - [ ] Reject malformed or conflicting start-gate data.
  - [ ] Verify starter topology includes a valid gate-to-goal route.
- [ ] Task: Implement persistence and startup compatibility
  - [ ] Extend serialization validation for `start-gate`.
  - [ ] Preserve v1 save loading without silently modifying user layouts.
  - [ ] Add the start gate to the first-launch starter graph.
  - [ ] Ensure named saves and autosave preserve it.
- [ ] Task: Integrate full-load and starter UX
  - [ ] Rebuild the start-gate scene/body during graph replacement.
  - [ ] Refresh track status after autosave loads and named-slot loads.
  - [ ] Confirm the first launch remains immediately playable.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 4 · Regression, Accessibility & Budget Verification

- [ ] Task: Audit changed logic coverage and invariants
  - [ ] Run targeted coverage for graph health, serialization, spawn
    resolution, and cleanup.
  - [ ] Confirm changed logic meets the project’s approximately 80% target.
  - [ ] Review singleton, save-format, and active-marble lifecycle invariants.
- [ ] Task: Complete automated and manual verification
  - [ ] Run tests, Biome, TypeScript, production build, and base-path build.
  - [ ] Verify desktop and touch placement, spawning, status feedback,
    deletion, undo/redo, and loading.
  - [ ] Verify reduced-motion behavior, touch targets, no page scrolling, and
    15–20-marble responsiveness.
  - [ ] Confirm output remains within the existing 3,500 kB JS / 1,250 kB gzip
    budget.
- [ ] Task: Update user-facing documentation and record the final checkpoint
  - [ ] Document the start gate and custom-track spawning behavior.
  - [ ] Add implementation notes and verification results to `plan.md`.
  - [ ] Complete the phase checkpoint according to `workflow.md`.
