# Implementation Plan: Child-First UX/UI Hardening

This feature follows the project workflow: logic-bearing behavior gets tests
first, UI/render/input work gets manual verification, and every phase ends with
a verification checkpoint before proceeding.

## Phase 1: Responsive HUD and contextual saved tracks

- [x] Task: Remove mobile HUD overlap and preserve guidance *(293a956)*
  - [x] Map the current simulation, status, tray, and save-panel geometry at
    360px, 390px, tablet, and desktop widths.
  - [x] Implement responsive stacking and spacing so the status region is never
    covered and the page never horizontally scrolls.
  - [x] Preserve safe-area spacing, focus rings, live regions, and 44px controls.
  - Notes: Added a shared `#top-hud` layout that places the simulation and save
    panels side by side on desktop and stacks them below 900px, removing the
    brittle mobile pixel offset.
  - Verify: `pnpm exec tsc --noEmit` and `git diff --check` passed; full phase
    automation and viewport verification passed at the Phase 1 checkpoint.

- [x] Task: Collapse named saves behind a Saved tracks control *(6ff3ba3)*
  - [x] Preserve the existing save, load, delete, and status behavior.
  - [x] Add an accessible responsive drawer or dialog with keyboard escape,
    backdrop/touch close, and focus management.
  - [x] Ensure the save surface cannot obscure gameplay guidance.
  - Notes: Converted the always-visible save panel into an inline drawer under a
    Saved tracks trigger. Escape, outside touch, close-button, and focus-return
    behavior are handled without changing storage callbacks. A manual browser
    check found the native `hidden` attribute was overridden by the panel's
    display rule; `145290e` adds the explicit collapsed-state selector.
  - Verify: `pnpm exec tsc --noEmit` and `git diff --check` passed; full phase
    automation and viewport verification passed at the Phase 1 checkpoint.

- [x] Task: Clarify the simulation reset label *(23658cf)*
  - [x] Rename the visible control to **Reset run** while preserving its current
    simulation-only behavior.
  - Notes: Updated the visible label only; the existing reset callback still
    clears active marbles, goals, timer, and stream while preserving the build.
  - Verify: `pnpm exec tsc --noEmit` and `git diff --check` passed; full phase
    automation and viewport verification passed at the Phase 1 checkpoint.

- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *(145290e)*
  - [x] Run relevant automated tests, Biome, strict TypeScript, and the
    production build. `$env:CI="true"; pnpm vitest run && pnpm biome check .
    && pnpm exec tsc --noEmit && pnpm build` passed: 24 files, 142 tests;
    Biome checked 77 files; TypeScript passed; build output was 3,433.58 kB
    JavaScript and 1,243.68 kB gzip.
  - [x] Manually verify save flows, focus behavior, keyboard/touch closing, and
    non-overlapping layouts at 360px, 390px, tablet, and desktop. Verified
    collapsed-by-default saves, drawer expansion, focus into the slot name,
    Escape close with focus return, visible `Reset run`, no overlap, and no
    horizontal overflow at 360px/390px; desktop HUD and tray remain separated.
  - [x] Record checkpoint SHA `145290e`, append the verification report as a
    Git note, obtain explicit user confirmation, and commit this plan update.

## Phase 2: First-run child guidance

- [x] Task: Add tested coach-mark state behavior *(c5b5146)*
  - [x] Write Vitest tests first for step order, dismissal, completion, and
    locally remembered dismissal.
  - [x] Implement the smallest pure state and persistence helper needed for the
    coach marks.
  - Notes: Added ordered coach-mark progression with optional local persistence,
    malformed-storage handling, and silent degradation when browser storage is
    unavailable.
  - Verify: Focused Vitest tests (4), strict TypeScript, and Biome passed.

- [x] Task: Render non-blocking first-run coach marks *(bd56e47)*
  - [x] Show short hints for selecting a piece, placing it, and dropping a
    marble.
  - [x] Allow dismissal at any time without blocking canvas or tray interaction.
  - [x] Hide or advance hints when the corresponding action is completed.
  - [x] Respect reduced-motion preferences and keep copy child-friendly.
  - Notes: Added a small first-run Build tips card with local dismissal and
    ordered progression for physical pieces and the Drop point. The card is
    pointer-transparent except for its 40px dismiss control and sits below the
    stacked mobile HUD.
  - Verify: Coach-mark state tests (4), strict TypeScript, and Biome passed;
    browser checks passed at 390px and 1280px, including progression,
    dismissal persistence, no horizontal overflow, no application errors, and
    reduced-motion animation disabled.

- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *(bd56e47)*
  - [x] Run the coach-mark tests plus the full required automated checks.
    `$env:CI="true"; pnpm vitest run && pnpm biome check . && pnpm exec tsc
    --noEmit && pnpm build` passed: 25 files, 146 tests; Biome checked 80
    files; TypeScript passed; build output was 3,436.14 kB JavaScript and
    1,244.46 kB gzip.
  - [x] Manually verify first launch, progression, dismissal persistence, touch
    interaction, keyboard operation, and reduced motion on desktop and mobile.
    Verified at 360x800, 390x844, and 1280x720 with no horizontal overflow,
    responsive HUD spacing, keyboard Enter/Escape parity, and no application
    errors.
  - [x] Record the checkpoint SHA, Git note, user confirmation, and plan update
    commit. User confirmed the Phase 2 checkpoint on 2026-08-26; the report was
    appended to the `bd56e47` Git note.

## Phase 3: Visible mistake recovery and tray clarity

- [x] Task: Expose touch Undo and Redo *(dab0360)*
  - [x] Add visible controls with accessible labels and correct disabled states.
  - [x] Keep keyboard shortcuts and command-stack behavior unchanged.
  - [x] Refresh button state after placement, deletion, move, undo, redo, and
    cancellation.
  - Notes: Added touch-sized Undo and Redo controls with disabled-state styling.
    Actions use the existing physical-piece and Drop point command stacks, and
    loaded graphs now seed custom placement ids to avoid autosave collisions.
  - Verify: 25 Vitest files and 146 tests passed; Biome checked 80 files;
    strict TypeScript passed. Browser checks at 390px verified initial disabled
    state, physical placement recovery, Drop point move recovery, keyboard
    Control+Z/Control+Y parity, and no application errors.

- [x] Task: Add recognizable tray shape previews *(e4665fd)*
  - [x] Add lightweight inline or procedural shape cues for every piece.
  - [x] Preserve labels, color differentiation, active selection, and touch
    sizing.
  - [x] Ensure shape cues are not the sole accessible name.
  - Notes: Replaced generic swatches with compact CSS silhouettes for all six
    tray tools, retained their colors and labels, and exposed pressed state while
    keeping previews aria-hidden.
  - Verify: 25 Vitest files and 146 tests passed; Biome checked 80 files;
    strict TypeScript passed. Browser checks at 390px and 1280px confirmed six
    previews, no horizontal overflow, centered desktop layout, touch-sized
    buttons, and preserved accessible names.

- [x] Task: Phase Verification & Checkpoint *(e4665fd)* (Refer to workflow.md)
  - [x] Run the full automated checks and production build.
    `$env:CI="true"; pnpm vitest run && pnpm biome check . && pnpm exec tsc
    --noEmit && pnpm build` passed: 25 files, 146 tests; Biome checked 80
    files; TypeScript passed; build output was 3,437.43 kB JavaScript and
    1,244.83 kB gzip, within the bundle budgets.
  - [x] Manually verify recovery after every supported edit path, disabled
    states, keyboard parity, tray selection, narrow widths, and screen-reader
    labels. Verified physical placement, move, delete, Undo/Redo, Drop point
    move recovery, Control+Z/Control+Y parity, initial disabled states, and
    tray selection at 360x800, 390x844, and 1280x720. Six tray controls fit
    without horizontal overflow; accessible names and aria-hidden previews were
    confirmed. Browser diagnostics contained no application errors; only the
    existing favicon 404 and Three.js warnings.
  - [x] Record the checkpoint SHA, Git note, user confirmation, and plan update
    commit.
  - Notes: Checkpoint SHA is `e4665fd`; the verification report was appended
    to its Git note, and the user confirmed the checkpoint on 2026-08-26.

## Phase 4: Mobile camera framing and integrated polish

- [x] Task: Improve initial mobile camera framing *(1d270b4)*
  - [x] Adjust initial framing so the starter route and goal cup are visible in
    portrait mobile views.
  - [x] Avoid overriding user-controlled camera movement after initialization.
  - [x] Preserve free and chase camera behavior and desktop composition.
  - Notes: Compact viewports use a centered target and wider initial position;
    the target is passed into the free-orbit controller for consistent reset
    behavior. The initial framing is selected once, so later user camera
    movement and resize events are not overridden. Playwright checks at 390px
    and 1280px confirmed the route/goal visibility and preserved desktop layout.

- [~] Task: Perform child-facing copy and accessibility polish
  - [ ] Review primary labels and guidance for short, direct, child-friendly
    wording.
  - [ ] Verify focus order, live status announcements, contrast, touch targets,
    and reduced-motion behavior.
  - [ ] Fix the missing favicon or document any remaining non-blocking browser
    diagnostics.

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Run the full test suite, Biome, strict TypeScript, standard build,
    hosted-path build, and bundle-size check.
  - [ ] Manually verify 360px, 390px, tablet, desktop, mouse, touch, keyboard,
    screen-reader-sized layouts, reduced motion, and console output.
  - [ ] Complete the workflow security review for DOM and input changes.
  - [ ] Record the final checkpoint SHA and Git note, obtain user confirmation,
    and update the plan.

## Constraints

- No external runtime assets, network dependencies, audio, broad settings
  system, or new/blank-track workflow.
- Follow existing TypeScript, DOM, CSS, Three.js, Vitest, Biome, and commit
  conventions.
- Keep `plan.md` as the execution source of truth and mark task progress with
  `[~]` and `[x]` plus commit hashes.
