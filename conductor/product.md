# Marblescape — Product Definition

## Summary

A browser-based 3D marble run builder where players snap together glossy toy-like track pieces — straights, curves, ramps, funnels, and goal cups — into cascading contraptions, then place a separate overhead Drop point to release marbles and watch real physics carry them home. Fully offline and optionally installable to the home screen, it runs equally well on desktop browsers (mouse + keyboard) and mobile (touch), with free-orbit camera while building and a chase-cam mode for spectating marbles in motion. Construction feels forgiving thanks to connector-snapping placement, free Drop point placement, undo/redo, advisory track guidance, and local auto-save; play feels rewarding through a global goal counter, run timer, and toggleable single-drop or continuous marble streams. Every visual asset is procedurally generated — no downloads, instant load, clean toy aesthetic.

## Target Audience

**Kids & families**, plus casual web players of any age. Design implications:

- Zero instructions required — a first-time player builds something that works within minutes
- No fail states anywhere; mistakes are always undoable
- Large touch targets, high-contrast piece colors, readable at arm's length on a phone

## Core Loop

1. **Build** — pick pieces from a tray, snap them connector-to-connector into contraptions
2. **Release** — place a Drop point above the track, drop one marble on demand, or flip on the continuous stream
3. **Watch** — orbit freely or ride chase-cam as marbles tumble through your creation
4. **Iterate** — goal-cup counters show how your build performs; tweak and grow it

## V1 Feature Set

- **5 physical piece types:** straight · curve · slope/ramp · funnel · goal cup
- **Drop point tool:** one free X/Z overhead entry point at fixed height, with a live landing guide
- **Connector-snapping placement** with ghost preview and rotation
- **Editing tools:** place · delete · move · undo/redo
- **Spawning:** manual drop + continuous stream from the single active Drop point, toggleable only when a landing and goal route are ready
- **Cameras:** free orbit (build/spectate) + chase cam (follow a marble)
- **Light metrics:** global goal counter, run timer
- **Persistence:** version-2 IndexedDB auto-save + named save slots, with version-1 Start-gate migration (fully offline)
- **Guidance:** advisory status for missing Drop points, missing landings, disconnected goals, and ready routes; lost marbles are cleaned up outside playable bounds

## Success Criteria (V1)

- Deployed at a shareable URL; loads fast on desktop *and* mobile browsers
- ~15–20 simultaneous marbles at smooth framerates on a mid-range phone
- A friend can build and run their first working contraption within minutes, unassisted
- Feels polished enough to proudly say *"play my game"*

## Non-Goals

Explicitly out of scope — do not build these:

- Build sharing, export/import files, or any online features
- Challenge modes, objectives, level progression
- Marble cosmetics, unlockables, progression systems
- Settings beyond essentials (quality toggle, reset)
- Audio beyond the shipped procedural one-shot SFX (music, ambient loops, volume controls), native app packaging

## Legacy save migration

Version-1 saves containing a physical Start gate migrate its X/Z placement to a
fixed-height Drop point and discard the gate plus its graph edge. Gate-less
version-1 saves remain loadable without a Drop point. New saves use version 2;
the Drop point is persisted beside, not inside, the physical track graph.
