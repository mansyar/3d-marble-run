# Specification: Child-First UX/UI Hardening

## Overview

Make Marblescape genuinely understandable and comfortable for children and
families on both touch and desktop, while preserving the existing offline,
zero-instruction product direction. Improve the responsive HUD, first-run
discoverability, build recovery, save visibility, and piece-selection clarity.
The starter track must remain immediately playable, and the UI must never hide
the guidance needed to understand the next action.

## Functional Requirements

1. **Responsive HUD**
   - Keep simulation controls, track status, and metrics visible without
     overlap at phone widths.
   - Verify portrait layouts at 360px and 390px, tablet layouts, and desktop.
   - Preserve safe-area spacing, at least 44px touch targets, and no horizontal
     page scrolling.
   - Keep the starter route and goal cup visible in the initial mobile camera
     framing.

2. **Dismissible first-run coach marks**
   - Show two or three short, child-friendly hints covering choosing a piece,
     placing it on the table, and dropping a marble.
   - Make hints dismissible, non-blocking, and remembered locally.
   - Do not prevent normal canvas interaction.
   - Respect `prefers-reduced-motion`.

3. **Collapsed saved-track controls**
   - Replace the permanently visible save form with a compact **Saved tracks**
     control.
   - Open the existing save, load, and delete functionality in a responsive
     drawer or dialog.
   - Preserve accessible labels, keyboard escape/backdrop closing, focus
     handling, and status feedback.
   - Opening saves must never cover primary simulation guidance.

4. **Visible build recovery**
   - Add touch-visible Undo and Redo controls with correct disabled states.
   - Preserve existing keyboard shortcuts.
   - Make recovery controls accessible to mouse, keyboard, touch, and screen
     readers.

5. **Clearer piece tray**
   - Retain piece colors and text labels.
   - Add recognizable shape previews so selection does not rely on color alone.
   - Preserve clear active-selection styling and touch-sized controls.

6. **Clearer control language**
   - Rename **Reset** to **Reset run** without changing its behavior: clear
     active marbles, goals, and timer while preserving the build.
   - Keep guidance short, friendly, and understandable to children.

## Non-Functional Requirements

- Use the existing vanilla TypeScript, DOM, and CSS architecture.
- Add no external runtime assets, network calls, or UI framework.
- Preserve offline operation and mouse/touch/keyboard parity.
- Keep JavaScript and gzip bundles within the documented budgets.
- Add unit tests for any new state-bearing logic; verify visual and input
  behavior manually at desktop and touch viewports.
- Preserve existing accessibility labels, live regions, focus rings, and
  reduced-motion behavior unless a change is required by this specification.

## Acceptance Criteria

- No panel or status text overlaps at 360x844, 390x844, tablet, or desktop
  sizes.
- The starter route and goal are visible in the initial mobile view.
- A first-time player can identify the build, place, and drop sequence without
  external explanation.
- Coach marks can be dismissed and do not reappear after dismissal.
- Saved tracks remain fully functional but do not permanently compete with
  gameplay.
- Touch users can undo and redo placement mistakes without a keyboard.
- Every tray item has both a readable label and a recognizable shape cue.
- **Reset run** clearly preserves the build while resetting the simulation.
- Existing tests remain passing, and Biome, strict TypeScript, production
  build, accessibility checks, and manual mobile verification pass.

## Out of Scope

- New or blank-track clearing workflow.
- Audio or music.
- Challenges, progression, sharing, online features, or native packaging.
- Major 3D rendering or physics changes.
- A broad settings system.
