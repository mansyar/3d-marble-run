# Specification: Guided Playability & Track Reliability

## Overview

Add an explicit start point and gentle track diagnostics so custom marble runs
are playable without constraining experimentation. The existing five-piece
starter path remains immediately runnable, while saved v1 tracks remain
loadable even if they do not contain a start gate.

## Functional Requirements

### FR-1 · Start gate piece

- Add a sixth procedural piece type: `start-gate`.
- It has one downward `spout` connector compatible with existing run pieces.
- Its world-space spawn anchor is derived from the placed gate.
- Add it to the tray with a clear label and distinct color/shape.
- Only one start gate may exist in a track.
- Attempting to place a second gate is rejected gently, without changing the
  current graph.
- Moving, deleting, undoing, redoing, saving, and loading the gate follow
  existing piece behavior.

### FR-2 · Gate-driven spawning

- Manual drops and continuous streaming spawn marbles from the active start
  gate.
- If no start gate exists, spawning does not create an invisible/floating
  marble and the HUD explains how to fix it.
- A gate that is not connected to a goal remains usable for experimentation;
  the HUD reports that the run has no connected goal.

### FR-3 · Advisory connectivity status

- Traverse the saved track graph from the start gate to determine whether any
  goal cup is connected.
- Display concise, friendly status for:
  - no start gate,
  - start gate present but no connected goal,
  - start gate connected to at least one goal.
- Update status after placement, movement, deletion, undo/redo, save-load
  replacement, and startup.
- Never block ordinary piece placement or editing because a layout is
  incomplete.

### FR-4 · Lost-marble cleanup

- Despawn marbles that leave documented playable world bounds without reaching
  a goal.
- Remove their Rapier bodies and Three.js meshes through the same lifecycle
  used for recycling and goal completion.
- Lost marbles must not increment goal counters or trigger celebrations.
- Streaming and timer behavior continue normally after cleanup.

### FR-5 · Starter and save compatibility

- Add a ready-to-use start gate to the first-launch starter contraption.
- Existing v1 saves without a start gate remain loadable and receive the
  “place a start gate” guidance.
- New saves round-trip the start gate and its connections correctly.
- Malformed or conflicting start-gate data remains rejected by save
  validation.

## Non-Functional Requirements

- Logic-bearing additions receive TDD coverage for registry compatibility,
  singleton enforcement, graph reachability, serialization, spawn resolution,
  and out-of-bounds cleanup.
- Changed logic aims for at least 80% coverage.
- Desktop and touch interactions retain ≥44px targets and existing
  reduced-motion behavior.
- No new runtime service, network dependency, or asset download.
- Production output remains within the existing **3,500 kB JS / 1,250 kB gzip**
  budget.

## Acceptance Criteria

1. A fresh launch drops a marble from the starter’s start gate and reaches its
   goal cup.
2. A player can place a start gate, connect it to existing pieces, and spawn
   from that location.
3. A second start gate cannot be accidentally added.
4. Incomplete tracks remain editable and provide understandable guidance.
5. Existing v1 saves load without data loss.
6. Fallen marbles are removed and do not accumulate indefinitely.
7. Manual and continuous spawning work on desktop and mobile.
8. Tests, Biome, TypeScript, production build, and mobile manual verification
   pass.

## Out of Scope

- Multiple active start gates or start-gate selection.
- Full physics solvability/pathfinding guarantees.
- Challenge modes, levels, sharing, accounts, audio, or online features.
- Replacing the existing five-piece starter design beyond adding the start
  gate.
