# Specification: Marble Engine Scale-Up — 2× Population with Adaptive Stream Pacing

**Track ID**: `marble_engine_scaleup_20260828` · **Type**: Feature (Simulation Performance) · **Branch**: `feat/marble_engine_scaleup_20260828`

## Summary

Double the marble population ceiling (20 → 40 mid-range/mobile, 60 desktop) while keeping framerates smooth on a mid-range phone, by pairing three pure-logic pieces: a **marble object pool** (reuse meshes + colliders instead of destroy/re-allocate on every recycle), **adaptive stream pacing** (pause the continuous stream under sustained frame-budget pressure, resume when headroom returns), and a **population governor** (device-tier aware cap that replaces today's single hardcoded `DEFAULT_MAX_MARBLES = 20` in `app.ts`). No save-schema, HUD, or geometry changes — visual parity is a hard requirement.

## Context

- Today's cap is a constant: `createSpawner()` defaults to `maxMarbles: 20` (`src/sim/spawner.ts`); `app.ts` passes no override, so every device runs 20.
- Every spawn builds a fresh `Mesh` + `MeshPhysicalMaterial` + `SphereGeometry` + Rapier body + ball collider; every recycle tears them all down (`app.ts` / `pieces/marble.ts` / `dropPointSpawner.ts`). At the cap this is an allocation every stream tick (~500 ms) with GC pressure and per-marble material duplication (20 marbles = 20 physical materials).
- The quality tier already exists (`core/quality.ts` → `resolveQuality()` returns CAPPED vs DESKTOP from preference + battery awareness) but is consulted only for shadows/rendering — never for simulation capacity.
- Product success criterion: "~15–20 simultaneous marbles at smooth framerates on a mid-range phone." This track raises the bar to 40 on the same hardware, which requires the recycle path to be allocation-free and the stream to yield when physics runs long.
- Last recorded payload gate (anti-jam track): 3,496.72 kB min / 1,246.57 kB gzip vs budget 3,500 / 1,250. Headroom is ~3 kB; this track must stay within budget (no new WASM/assets; pure TS logic).

## Goals

1. **Allocation-free steady state.** With the stream running at the cap for ≥2 minutes, marble recycle must not allocate new geometry, materials, colliders, or bodies — meshes/colliders are pooled and reused.
2. **2× population with smooth frames.** 60 concurrent marbles on desktop-class devices and 40 on capped/mobile-class devices hold interactive framerates (target ≥45 FPS sustained in manual verification; the existing 20-marble baseline must not regress).
3. **Adaptive pacing, never visible failure.** Under sustained frame-budget pressure the continuous stream pauses (marbles already in flight finish naturally) and auto-resumes when headroom returns. One-shot drops are never blocked. No counters, warnings, or HUD changes appear; pacing is invisible except through smoothness.
4. **Manual quality tier wins.** Choosing High forces the desktop cap even on devices the heuristic would cap; Auto keeps battery-aware capping. The existing preference semantics (quality toggle) are the single source of truth — no new settings.

## Non-Goals

- No instanced-rendering rewrite of marble meshes (MeshPhysicalMaterial per pooled marble stays; a full instancing pass is a future track).
- No save-schema/`TrackDocument` changes, no UI changes, no new piece types.
- No changes to physics timestep, marble radius/mass, or restitution constants.
- No marbling-up of goal-cup logic or route guidance (recent tracks' behavior is pinned by existing tests).

## Requirements

### R1 · Marble pool (logic-bearing, TDD)

- New module `src/sim/marblePool.ts`: a `createMarblePool(...)` owning reusable meshes (one shared `SphereGeometry`, one shared `MeshPhysicalMaterial`) and Rapier body/collider descriptors.
- Pinned contract (unit tests, mock Rapier world per workflow.md): `acquire` returns a pooled item before creating; `release` parks the item (mesh hidden, body removed/refreshed); `clear` drains everything; pool never exceeds the tier cap; releasing an unknown id is a no-op; reused items reset transform/velocity exactly like a fresh spawn (position at Drop point, zero velocity).
- Geometry/material are created **once per pool lifetime**, not per marble — this is the core of the GC win.

### R2 · Population governor (logic-bearing, TDD)

- Pure module `src/sim/population.ts`: `resolveMarbleCap(tier)` → CAPPED tier 40, DESKTOP tier 60; and a frame-budget monitor `createFrameBudget({ p95Ms, resumeMs })` fed frame deltas, exposing `suggest()` → `"flow" | "pause"` with hysteresis: pause only after sustained overage (≥ N of last M samples over budget), resume only after sustained headroom.
- Pinned tests: 60 Hz deltas (16.7 ms) never pause; sustained 33 ms deltas pause after the window; a single 100 ms spike (tab jank) does not pause; resume requires sustained headroom; one-shot drop always spawns regardless of `suggest()`.
- The stream toggle UI is untouched: when paused by the governor, the continuous toggle stays in its user-selected state and the stream resumes automatically.

### R3 · App integration

- `app.ts` spawns marbles through the pool and consults the governor each stream tick: `flow` → spawn as today; `pause` → skip this tick (timer keeps running; no backlog catch-up burst on resume beyond today's `MAX_CATCH_UP_EVENTS` guard).
- Quality preference change re-resolves the cap live: raising High/Auto swaps the cap without requiring a reload; shrinking the cap recycles the oldest active marbles via the spawner's existing recycle path.
- Existing behaviors pinned by tests stay green: stream scheduling, run timer, stuck-detector self-rescue, goal counters, autosave.

### R4 · Visual & UX parity

- Zero perceptible material/geometry change (same candy-glass look, same shadows); no HUD/copy changes; `prefers-reduced-motion` behavior unchanged; touch parity unaffected (no input changes).

## Success Criteria

1. Unit tests for pool + governor written first (RED), then implementation (GREEN); ≥80% coverage on new/changed logic; full suite, Biome, `pnpm build`, and size gate all pass.
2. Manual verification (desktop + touch viewport): continuous stream at desktop cap (60) runs smoothly ≥1 min; capped tier (40) on phone-emulated viewport stays fluid ≥1 min; one-shot drops always work even while the governor is paused; no visual/material differences vs `master` side-by-side.
3. Payload ≤ 3,500 kB min / ≤ 1,250 kB gzip after the track.

## Constraints & Risks

- **Payload headroom ~3 kB**: logic-only, shared geometry/material; no dependencies added.
- **Interplay with stuck detector**: a governor pause must not be misread by `stuckDetector` as marbles wedging (they are legitimately resting at the drop point) — pause only skips *spawning*, never simulates or teleports existing marbles.
- **Cap-shrink UX**: shrinking the active cap (device switch to power saver) recycles oldest-first so the newest marbles remain visible — matches existing recycle semantics.
