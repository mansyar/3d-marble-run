# Specification: Free Drop Point Spawning

## Overview

Marblescape will replace the physical Start gate with one movable, non-physical
Drop point. The Drop point is placed freely over the build plane in X/Z at a
fixed overhead height of 4 world units. It does not participate in connector
snapping or the track graph.

While the Drop point is being placed or moved, a vertical guide continuously
casts downward through the Rapier world. The guide ends at the first valid
upward-facing surface of a track piece below it, giving the player a clear
preview of where the marble will fall. The Drop point itself remains the
spawn position; physics performs the visible fall.

The Drop point is persisted as a track setting rather than as a physical piece.
New tracks contain the five physical run pieces and may contain one Drop point.
Existing version-1 saves containing a Start gate migrate the gate's X/Z
position to a fixed-height Drop point, discard the gate-only graph connection,
and retain the remaining physical pieces and connections.

This specification is the source of truth for the track.

## Functional Requirements

### Drop point model and placement

1. The active track may contain zero or one Drop point.
2. The Drop point is a separate persisted setting with a placement containing
   X/Z coordinates and the fixed Y coordinate `4`.
3. The piece tray exposes an accessible `Drop point` tool instead of exposing
   the physical `Start gate` for new placement.
4. Selecting the tool places a small toy-like marker freely on the build plane;
   it does not invoke connector snapping or create graph connections.
5. If a Drop point already exists, selecting the tool edits that point rather
   than creating a second point.
6. The Drop point can be moved, deleted, undone, and redone without blocking
   normal physical-piece editing.
7. Pointer and touch interactions use the existing accessible interaction
   conventions and retain at least 44px controls.

### Landing guide and readiness

8. The scene renders a clear marker and a thin vertical guide for the active
   Drop point.
9. The guide updates continuously during placement and movement, and after
   committed edits or loading a track.
10. A downward Rapier raycast identifies the first valid upward-facing track
    surface below the Drop point. Vertical walls and invalid/non-track hits do
    not count as landing surfaces.
11. The guide terminates at the detected landing surface. The landing result
    includes the physical piece that was hit so route health can be assessed
    from the entry piece.
12. When no valid landing surface exists, the guide reports no landing and the
    HUD explains that the Drop point must be moved above a track piece.
13. With no Drop point, the HUD explains that a Drop point must be placed.
14. Drop marble and Stream are unavailable when there is no Drop point or no
    valid landing surface. Editing remains available in all advisory states.
15. When the landed physical piece has no connected path to a Goal cup, the HUD
    reports that a Goal cup must be connected. A landed Goal cup is considered
    ready.
16. The ready state tells the player that the run is ready to drop.

### Simulation and lifecycle

17. Manual and continuous spawning create marbles above the Drop point and let
    Rapier gravity carry them to the detected landing surface.
18. Continuous streaming uses the same Drop point and landing readiness as
    manual drops.
19. If the Drop point is deleted or becomes invalid while streaming, the stream
    stops and the Stream HUD state updates immediately.
20. Existing timer, global goal count, goal-pop, camera modes, marble cap,
    out-of-bounds cleanup, reset behavior, and offline behavior remain intact.

### Persistence and migration

21. New saves use serialization version 2 and include a nullable `dropPoint`
    setting alongside the physical piece graph.
22. Version-2 round trips preserve the Drop point and all physical graph data.
23. Version-1 saves without a Start gate remain loadable with no Drop point.
24. Version-1 saves with one Start gate migrate the gate's X/Z to a Drop point at
    Y=4, remove the Start gate, discard its gate-only connection, and preserve
    all other pieces and reciprocal connections.
25. Malformed, duplicate, or invalid Drop point data is rejected without
    accepting a corrupt graph.
26. Autosave, named save, load, delete, and first-launch startup behavior remain
    functional with the version-2 shape.

### Starter and documentation

27. The starter contains five physical pieces, one Drop point above the ramp,
    and a connected route to the Goal cup.
28. The starter's initial health is ready and its first Drop marble reaches the
    Goal cup.
29. Product documentation describes the Drop point, live landing guide,
    advisory no-landing state, and v1 migration behavior.

## Non-Functional Requirements

- Use strict TypeScript, named ES-module exports, and the existing Vite,
  Three.js, Rapier compatibility layer, `idb`, vanilla DOM, Vitest, and Biome
  stack.
- Test logic-bearing Drop point, raycast result, health, spawning, and
  serialization/migration behavior with TDD before implementation.
- Keep changed logic at approximately the existing project coverage level and
  at least 80% where practical; verify rendering and input glue manually.
- Preserve offline operation, accessibility, reduced-motion behavior, and
  touch-equivalent interactions.
- Use no external runtime assets and keep the bundle within 3,500 kB JavaScript
  and 1,250 kB gzip.
- Verify the feature on desktop and a narrow touch/mobile viewport.

## Acceptance Criteria

- A fresh starter shows a Drop point and no physical Start gate in the tray or
  scene.
- The starter guide ends on the ramp, and Drop marble reaches the Goal cup.
- Moving the Drop point updates the guide continuously and never snaps or
  changes graph connections.
- Only one Drop point can exist; selecting the tool with an existing point
  moves that point instead of duplicating it.
- Empty-space placement shows friendly no-landing guidance and disables Drop
  and Stream without disabling editing.
- A disconnected route reports the no-connected-goal guidance; a connected
  route reports ready guidance.
- Deleting or invalidating the point stops streaming and synchronizes its HUD
  label and accessible state.
- Move, delete, undo, redo, reset, autosave, named save/load, and reload retain
  coherent Drop point and simulation state.
- Version-1 gate and gate-less saves load according to the migration rules, and
  version-2 save/load round trips are stable.
- Desktop and mobile controls meet accessibility and layout requirements;
  automated tests, Biome, TypeScript, coverage, and both production builds
  pass within the bundle budget.

## Out of Scope

- Multiple active Drop points or user-selectable spawn profiles.
- Free vertical/Y movement of the Drop point.
- Physical solvability guarantees, pathfinding, or automatic track repair.
- New piece types beyond the existing five physical pieces.
- Challenges, levels, sharing, accounts, audio, cosmetics, network features,
  or external runtime assets.
