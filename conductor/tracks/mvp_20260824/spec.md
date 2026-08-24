# Specification: Marblescape v1 MVP

## Overview
Build **Marblescape v1**: a fully offline, browser-based 3D marble run builder where players snap glossy toy-like track pieces into contraptions and release physics-driven marbles toward the goal cup. Delivered as one track in verifiable phases: scaffold → piece system → build/editing → simulation → cameras & metrics → persistence & polish.

## Functional Requirements

### FR-1 · App Shell & Rendering
- Vite + TypeScript strict app hosting a Three.js scene over a warm wooden-table world.
- Responsive full-viewport canvas; mouse+keyboard on desktop, touch on mobile.
- Bright, soft, even lighting; env-reflection gloss on candy-plastic materials.

### FR-2 · Piece System
- 5 procedural piece types: **straight, curve, ramp, funnel, goal cup** — zero external assets.
- Every piece declares connector **ports** (position + orientation) used for snapping and graph logic.
- One bold primary hue per piece type (shape + color dual coding); single signature glossy glass marble.

### FR-3 · Placement & Editing
- Bottom tray HUD of piece buttons; corner icon buttons for tools.
- **Select & drag** flow: tap/click tray piece → ghost follows pointer → snap to compatible ports within threshold → rotate (`R` / on-screen handle) → release/tap to commit; invalid targets show red ghost.
- Move existing pieces by dragging; delete via tool/key.
- **Undo/redo** command stack covering every edit operation.

### FR-4 · Marble Simulation
- Rapier3D physics, fixed-timestep stepping with interpolation.
- Toggleable spawn: **manual single drop** or **continuous stream**.
- Goal cup detects entries → counter increment + quiet celebration pop; concurrency capped (~20, oldest recycled).
- **Run timer** starts at first spawn after a reset; Reset button clears marbles, counter, and timer.

### FR-5 · Cameras
- Build mode: free orbit (rotate/zoom/pan).
- Spectate mode: chase-cam following the latest marble; toggle switch.

### FR-6 · Persistence
- IndexedDB (via `idb`): debounced auto-save on every edit **plus** named slots (save/load/delete).
- Pre-built starter contraption on very first launch only; thereafter load last autosave.
- Static-hosted, fully offline.

## Non-Functional Requirements
- **Performance:** 15–20 concurrent marbles smooth on mid-range phone (30 fps floor; 60 on desktop); bundle-size budget checked each build.
- **UX:** ≥44px touch targets; zero-instruction onboarding; forgiveness everywhere (undo always available); `prefers-reduced-motion` respected for UI juice — simulation stays strictly physical.
- **Testing:** unit tests with ~80% coverage only for logic-bearing modules (track graph & snapping rules, command stack, spawner state machine, save serialization round-trips) per workflow.md; visual/rendering glue verified manually at phase checkpoints.

## Acceptance Criteria
1. Deployed shareable URL loads fast on desktop and mobile browsers.
2. ~15–20 concurrent marbles run smoothly on a mid-range phone.
3. A newcomer builds a working contraption in minutes, unassisted.
4. Auto-save survives page reload; named slots save/load correctly.
5. Both camera modes, goal counter, timer, and undo/redo all function end-to-end.

## Out of Scope
Sharing/export, online features, challenge modes/levels, cosmetics/unlockables, deep settings beyond quality toggle + reset, audio (v2 candidate), native packaging.
