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

- [ ] Task: Implement the shared editor history abstraction
  - [ ] Add a small domain-aware adapter over the existing generic command-stack
    behavior.
  - [ ] Keep physical-piece commands and Drop point commands domain-local while
    routing both through one timeline.
  - [ ] Preserve command execution, reversal, and state cloning semantics.
  - [ ] Avoid new runtime dependencies and keep the existing generic
    command-stack tests passing.

- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 2 · Controller and Application Integration

- [ ] Task: Write failing integration tests for mixed editor changes
  - [ ] Verify actual piece commands and Drop point commands share one timeline.
  - [ ] Verify connected-piece movement/deletion still restores graph
    connections after mixed Undo/Redo.
  - [ ] Verify Drop point placement/deletion is restored losslessly.
  - [ ] Verify transient placement/movement cancellation creates no history
    entry.

- [ ] Task: Route placement, Drop point editing, and main orchestration through
  shared history
  - [ ] Replace the separate piece and Drop point stacks with the shared history
    service.
  - [ ] Remove `lastEditDomain` selection logic.
  - [ ] Preserve mode-gated keyboard shortcuts and existing Undo/Redo buttons.
  - [ ] Keep autosave, health refresh, scene synchronization, and guide refresh
    behavior unchanged.
  - [ ] Clear the unified history when loading or replacing a track.

- [ ] Task: Complete regression and manual verification
  - [ ] Run targeted coverage for changed history logic and confirm the
    approximately 80% target.
  - [ ] Run the full Vitest suite, Biome, TypeScript, and production build.
  - [ ] Verify desktop mouse/keyboard mixed editing and Undo/Redo.
  - [ ] Verify touch placement, Drop point editing, visible buttons,
    cancellation, and load reset.
  - [ ] Confirm the production bundle remains within the 3,500 kB JS / 1,250 kB
    gzip budget.

- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
