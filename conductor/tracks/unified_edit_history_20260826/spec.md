# Specification: Unified Edit History & Undo/Redo Reliability

## Overview

Replace the current separate physical-piece and Drop point history stacks with
one chronological editor history. Undo and Redo must reflect the actual order
in which committed editor changes occurred.

## Problem

The current orchestration selects between independent histories using the last
edited domain. With edits such as:

1. Move a piece
2. Move the Drop point
3. Place another piece
4. Undo
5. Undo

the second Undo can reverse the earlier piece edit instead of the Drop point
edit. This violates the product requirement that mistakes are always undoable
and history behaves naturally.

## Functional Requirements

1. Maintain one shared Undo/Redo timeline for all committed editor changes.
2. Record these actions:
   - Physical piece placement
   - Physical piece movement
   - Physical piece deletion
   - Drop point placement
   - Drop point movement
   - Drop point deletion
3. Undo in strict reverse chronological order.
4. Redo in strict chronological order.
5. A new committed edit after Undo clears the Redo branch.
6. Loading a saved track clears both Undo and Redo history.
7. Transient ghost previews, cancelled edits, camera gestures, simulation
   actions, and save operations must not create history entries.
8. Existing visible Undo/Redo controls and keyboard shortcuts must continue to
   work on desktop and touch/keyboard-accessible layouts.
9. Existing graph snapshot restoration and Drop point state restoration must
   remain lossless, including connections affected by moving or deleting
   pieces.

## Non-Functional Requirements

- Use the existing TypeScript/Vitest/command-stack architecture; no new runtime
  dependency.
- Add tests before implementation for the new history behavior.
- Target at least 80% coverage for changed logic-bearing code.
- Do not increase the bundle beyond the existing payload budget.
- Preserve current rendering, placement, persistence, and mobile input behavior.

## Acceptance Criteria

- Interleaved piece and Drop point edits undo and redo in exact chronological
  order.
- Redo restores the same states in the same order.
- A new edit after Undo invalidates Redo.
- Loading a save leaves Undo and Redo disabled.
- Cancelled placement/movement and preview-only changes do not affect history.
- Moving/deleting a connected piece still restores its prior graph connections
  through Undo.
- All existing tests plus new history tests pass.
- Manual verification confirms the behavior on desktop keyboard/mouse and
  touch/emulated mobile input.

## Out of Scope

- Undoing marble drops, stream toggles, resets, camera changes, or save
  operations.
- Persisting history across page reloads or save slots.
- New editor controls or visual redesign.
- New piece types or physics changes.
