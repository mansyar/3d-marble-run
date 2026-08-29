# Chase-Cam Immersion Polish — Specification

## Overview

The "Watch" step of the core loop is half the fun, but the chase cam is currently the
roughest camera edge: mode switches are an instant hard cut (`setMode` in
`src/render/camera.ts`), the followed marble is always the newest spawn
(`latestMarbleTarget` in `src/app.ts` walks `activeIds` backwards), and when that marble
reaches a cup or is recycled the camera just stops updating — leaving a static view.
This track makes spectating feel cinematic and kid-controllable: an eased fly-in when
switching modes, tap-a-marble-to-ride, and a seamless handoff when the followed marble
disappears.

## Functional Requirements

1. **Eased mode transition (fly-to):** Toggling View free→chase flies the camera from its
   current orbit position to the follow position over ~0.6–1.0s with ease-in-out;
   chase→free eases back to the player's prior orbit framing. No physics change — this is
   presentation-only interpolation in `src/render/camera.ts`.
2. **Damped follow:** The existing exponential-follow lerp is retained (optionally
   retuned) so the camera trails the marble smoothly; after the fly-in completes, no
   visible snap.
3. **Tap-a-marble-to-ride:** In free mode, a *tap* (pointerdown→pointerup within ~300ms,
   moved <~10px, single pointer, camera not locked by placement) raycasts against active
   marble meshes; a hit switches to chase cam following *that* marble. Works with mouse
   click and single-finger touch; must not fire on drag-orbit, pinch, or two-finger
   gestures (tap detection lives alongside the existing orbit handlers, which already
   classify drag vs. idle).
4. **Seamless handoff:** When the followed marble is removed — goal entry, out-of-bounds
   cleanup, stuck-marble recycle, or pool-shrink recycle — the camera glides to the next
   active marble; if none remain, it eases back to free orbit. Never a hard cut, never a
   dead/static frame.
5. **`prefers-reduced-motion: reduce`:** transitions become instant cuts (consistent with
   guidance pulses and tray scroll behavior elsewhere in the app).
6. **HUD consistency:** The existing camera button continues to reflect the current mode;
   no new HUD chrome (no next-marble button).

## Non-Functional Requirements

- Simulation, spawning, and marble pool behavior remain byte-for-byte untouched.
- Mobile parity: tap-to-ride must coexist with existing rotate/pinch gestures
  (input-parity rule in tech-stack.md).
- Payload: negligible JS delta; no new dependencies; budget gate unaffected.

## Acceptance Criteria

- Toggling View shows a smooth fly between modes (desktop + touch), instant cut under
  reduced motion.
- Clicking/tapping a marble in free mode starts following *that* marble; orbit drags and
  pinches never trigger it.
- Followed marble despawns (all four removal paths) → camera transitions to next marble
  or back to free; no hard cut or frozen frame at any point.
- Full quality gates pass (`biome`, `vitest`, `tsc`, `build`, size budget).

## Out of Scope

- Next-marble HUD cycle button, cinematic auto-director modes, camera settings, marble
  markers/labels, any physics or spawning changes.
