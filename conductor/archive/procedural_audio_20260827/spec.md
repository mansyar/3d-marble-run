# Specification: Procedural Audio

## Overview

Add satisfying, fully-procedural sound feedback to build & play — piece snap,
delete, marble drop + first landing, and goal-cup pop — synthesized entirely
with the Web Audio API. This ships the first audio layer for the v2-deferred
candidate from `product.md` while preserving the offline, zero-asset,
minimal-HUD product direction. Sounds are generated in code (no samples, no
runtime assets), bounded by per-event throttling so lively play never becomes
noise, and controlled by a single persisted HUD mute toggle.

## Functional Requirements

### FR-1 · Procedural sound engine

- New logic module synthesizing five one-shot sounds purely in code
  (oscillators / noise buffers + gain envelopes), no external samples:
  - `snap` — physical piece placement, or relocation (move) commit
  - `delete` — physical piece deletion
  - `drop` — marble released from the Drop point
  - `landing` — a marble's first contact with the track after spawn
  - `goal` — a marble enters a goal cup (accompanies the existing visual pop)
- Each sound is short (< ~0.35 s), has a bounded gain, and is never a sustained
  loop.
- The engine owns no DOM and no physics; callers invoke `play(event)`.

### FR-2 · Autoplay policy

- The `AudioContext` is created/resumed lazily, never at module load.
- The first user gesture (document-level `pointerdown` or `keydown`, once)
  unlocks the context.
- `play()` before unlock is a silent no-op with no console errors.

### FR-3 · Per-event throttling

- Consecutive identical events are coalesced so fast building or a full
  20-marble stream stays pleasant. Distinct per-event-type cooldowns (e.g.
  `snap` ~60 ms, `drop` ~150 ms, `landing`/`goal` ~100 ms).
- Different event types are independent of each other's cooldowns.
- Each marble id fires at most one `landing` event for its lifetime.

### FR-4 · Persisted mute control

- One compact speaker "Sound" toggle button in the top HUD: ≥44 px touch
  target, `aria-pressed`, accessible label, consistent with existing HUD
  styling.
- Muted state persists in `localStorage` under a single namespaced key (same
  pattern as coach-mark state). Default is sound ON.
- Turning the toggle off stops/resets any scheduled note events immediately
  (no lingering tones); turning it on restores playback on the next event.

### FR-5 · App wiring

- `snap` fires when a physical piece is newly placed or its relocation (move)
  is committed through the unified editor history.
- `delete` fires when a physical piece is deleted.
- `drop` fires whenever a marble spawns — single drop or continuous stream.
- `landing` fires once per marble, via the velocity-based impact detector.
- `goal` fires inside the existing goal-entry pop path.
- Undo/redo do NOT play snap/delete sounds; Drop point place/move/delete
  actions, UI button clicks, and the stream toggle remain silent.

## Non-Functional Requirements

- Zero external runtime assets and zero new runtime dependencies. Web Audio is
  a browser API; bundle growth is expected to be only the small engine module
  and must re-verify the ≤3,500 kB JS / ≤1,250 kB gzip budget.
- Offline operation unchanged.
- Logic-bearing modules (engine scheduling/throttle/mute, mute persistence,
  impact detector) get Vitest tests written before implementation with ≥80%
  coverage. DOM/HUD wiring is verified manually per `workflow.md`.
- Touch + desktop parity: audio must work and remain toggleable under both
  input models, with no keyboard required to reach the toggle.
- No change to existing rendering, physics, history, or persistence behavior;
  all existing tests keep passing; Biome and strict TypeScript stay clean.

## Acceptance Criteria

- Placing/moving/deleting a piece, dropping a marble, first marble landing,
  and a goal-cup entry each produce a distinct, pleasant, quiet sound.
- Rapid placement and a full 20-marble stream stay pleasant (throttled, not
  cacophonous); each marble yields at most one `landing`.
- The Sound toggle silences immediately, persists across reload, and restores
  on load; default is ON.
- No sound plays before the first user gesture; no autoplay warnings/errors.
- Bundle rechecked within budget; all tests + Biome + strict TS + production
  build pass; manual verification passes on desktop and touch/mobile
  viewports.

## Out of Scope

- Music, ambient/rolling loops, UI button click sounds, stream-toggle sounds.
- Volume slider or per-sound controls.
- Sound for Drop point actions, undo/redo, save/load, or reset.
- PWA/install considerations; changes to physics, rendering, persistence, or
  the existing HUD beyond the single toggle.
