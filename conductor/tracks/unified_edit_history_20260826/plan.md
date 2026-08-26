# Implementation Plan: Unified Edit History & Undo/Redo Reliability

Progress notes will be appended under completed tasks per `workflow.md`.
One commit per task.

## Phase 1 · Shared History Model

- [x] Task: Write failing tests for chronological editor history *(4fca238)*
  - [x] Add a focused history fixture with independent piece and Drop point
    state.
  - [x] Verify mixed edits undo in strict reverse chronological order.
  - [x] Verify Redo restores the same sequence.
  - [x] Verify a new edit after Undo clears the Redo branch.
  - [x] Verify empty Undo/Redo and explicit history clearing are safe no-ops.
  - Notes: Added `tests/editorHistory.test.ts` with independent piece and Drop
    point state fixtures. The targeted Vitest run is intentionally red until
    `src/core/editorHistory.ts` is implemented; targeted Biome passes.

- [x] Task: Implement the shared editor history abstraction *(2219b58)*
  - [x] Add a small domain-aware adapter over the existing generic command-stack
    behavior.
  - [x] Keep physical-piece commands and Drop point commands domain-local while
    routing both through one timeline.
  - [x] Preserve command execution, reversal, and state cloning semantics.
  - [x] Avoid new runtime dependencies and keep the existing generic
    command-stack tests passing.
  - Notes: Added `EditorHistory` as a context-binding adapter over the existing
    generic command stack. Focused history tests and existing command-stack
    tests pass; targeted Biome passes for changed files.

- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) *(2219b58)*
  - [x] Run targeted history tests, existing command-stack tests, Biome, and
    TypeScript checks.
  - [x] Confirm changed-logic coverage meets the approximately 80% target.
  - [x] Propose desktop and mobile runtime verification for the Phase 2
    integration.
  - Notes: Targeted history coverage is 100% across statements, branches,
    functions, and lines. The user confirmed deferring rendering/input checks
    because Phase 1 has no runtime integration changes.

## Phase 2 · Controller and Application Integration [checkpoint: 543a09e]

- [x] Task: Write failing integration tests for mixed editor changes *(58d41d1)*
  - [x] Verify actual piece commands and Drop point commands share one timeline.
  - [x] Verify connected-piece movement/deletion still restores graph
    connections after mixed Undo/Redo.
  - [x] Verify Drop point placement/deletion is restored losslessly.
  - [x] Verify transient Drop point preview cancellation creates no history
    entry.
  - Notes: Added headless controller tests for mixed graph/Drop point history,
    connected MoveCommand and DeleteCommand restoration, and cancellation. The
    targeted suite is intentionally red until the controllers accept the shared
    `history` dependency; Biome passes.

- [x] Task: Route placement, Drop point editing, and main orchestration through
  shared history *(eb5d9dc)*
  - [x] Replace the separate piece and Drop point stacks with the shared history
    service.
  - [x] Remove `lastEditDomain` selection logic.
  - [x] Preserve mode-gated keyboard shortcuts and existing Undo/Redo buttons.
  - [x] Keep autosave, health refresh, scene synchronization, and guide refresh
    behavior unchanged.
  - [x] Clear the unified history when loading or replacing a track.
  - Notes: Both editor controllers now route commands and Undo/Redo through one
    chronological `EditorHistory`. Main orchestration uses the shared
    availability state, clears it on graph replacement/load, and refreshes live
    scene state after shared history changes. Full tests, Biome, and TypeScript
    checks pass.

- [x] Task: Complete regression and manual verification *(543a09e)*
  - [x] Run targeted coverage for changed history logic and confirm the
    approximately 80% target.
  - [x] Run the full Vitest suite, Biome, TypeScript, and production build.
  - [x] Verify desktop mouse/keyboard mixed editing and Undo/Redo.
  - [x] Verify touch placement, Drop point editing, visible buttons,
    cancellation, and load reset.
  - [x] Confirm the production bundle remains within the 3,500 kB JS / 1,250 kB
    gzip budget.
  - Notes: Targeted V8 coverage passed at 84.67% aggregate lines across the
    editor-history suites; `EditorHistory` and `DropPointEditor` reached 100%,
    and `DropPointController` reached 83.33%. The full suite passed 27 files and
    156 tests; Biome checked 84 files and TypeScript passed. The production
    build measured 3,437.74 kB JS / 1,244.96 kB gzip, within budget. Desktop
    1280x720 verification confirmed mixed chronological Undo/Redo, redo-branch
    invalidation, keyboard Undo, save-load history reset, and cancellation.
    Touch verification at 393x659 and 360x800 confirmed Drop point editing,
    mixed-edit interaction, 44px+ controls, no scrolling, and no errors;
    tablet 768x1024 remained viewport-fit. Only the known Three.js warnings
    appeared.

- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) *(543a09e)*
  - [x] Compare Phase 2 changes with the Phase 1 checkpoint and confirm
    corresponding tests for changed logic.
  - [x] Run the checkpoint test suite and confirm all automated gates pass.
  - [x] Complete approved desktop, touch, and responsive runtime verification.
  - [x] Attach the full verification report to the target functional commit.
  - Notes: Phase 2 was verified against the `2219b58` Phase 1 checkpoint. The
    user approved the desktop, touch, responsive, cancellation, and load-reset
    results. Verification is recorded on functional commit `543a09e`; the
    phase checkpoint is `543a09e`.
