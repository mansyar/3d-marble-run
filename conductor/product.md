# Marblescape — Product Definition

## Summary

A browser-based 3D marble run builder where players snap together glossy toy-like track pieces — including a Start gate, straights, curves, ramps, funnels, and a goal cup — into cascading contraptions, then release marbles to watch real physics carry them home. Fully offline and installable-free, it runs equally well on desktop browsers (mouse + keyboard) and mobile (touch), with free-orbit camera while building and a chase-cam mode for spectating marbles in motion. Construction feels forgiving thanks to connector-snapping placement, undo/redo, advisory track guidance, and local auto-save; play feels rewarding through a global goal counter, run timer, and toggleable single-drop or continuous marble streams. Every visual asset is procedurally generated — no downloads, instant load, clean toy aesthetic.

## Target Audience

**Kids & families**, plus casual web players of any age. Design implications:

- Zero instructions required — a first-time player builds something that works within minutes
- No fail states anywhere; mistakes are always undoable
- Large touch targets, high-contrast piece colors, readable at arm's length on a phone

## Core Loop

1. **Build** — pick pieces from a tray, snap them connector-to-connector into contraptions
2. **Release** — drop one marble from the Start gate on demand, or flip on the continuous stream
3. **Watch** — orbit freely or ride chase-cam as marbles tumble through your creation
4. **Iterate** — goal-cup counters show how your build performs; tweak and grow it

## V1 Feature Set

- **6 piece types:** Start gate · straight · curve · slope/ramp · funnel · goal cup
- **Connector-snapping placement** with ghost preview and rotation
- **Editing tools:** place · delete · move · undo/redo
- **Spawning:** manual drop + continuous stream from the single active Start gate, toggleable
- **Cameras:** free orbit (build/spectate) + chase cam (follow a marble)
- **Light metrics:** global goal counter, run timer
- **Persistence:** IndexedDB auto-save + named save slots (fully offline)
- **Guidance:** advisory status for missing gates, disconnected goals, and ready routes; lost marbles are cleaned up outside playable bounds

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
- Audio (candidate for v2), native app packaging
