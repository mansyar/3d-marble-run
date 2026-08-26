# Implementation Plan: Procedural Audio

## Phase 1 · Audio Engine & Preferences (logic)

### [ ] Task: Write failing tests for the procedural audio engine
- [ ] Define `SoundEvent` taxonomy (`snap`, `delete`, `drop`, `landing`, `goal`).
- [ ] Test that `play(event)` schedules synthesis (one voice per event) and never throws before unlock.
- [ ] Test lazy unlock: no `AudioContext` created before `unlock()`, and unlock is idempotent.
- [ ] Test per-event cooldown: rapid repeats of the same event are coalesced; different events are independent.
- [ ] Test mute: `setMuted(true)` suppresses/clears scheduled notes, `setMuted(false)` restores.
- [ ] Run: `CI=true pnpm vitest run tests/audioEngine.test.ts` — confirm RED.

### [ ] Task: Implement `src/audio/engine.ts`
- [ ] Synthesize the five one-shots purely with oscillators/noise + gain envelopes; bounded gain; short duration.
- [ ] Lazy `AudioContext` + `unlock()` (idempotent) and no-op playback before unlock.
- [ ] Per-event cooldown timers (snap ~60ms, drop ~150ms, landing/goal ~100ms).
- [ ] Master gain + `setMuted()` that stops scheduled notes immediately.
- [ ] Document public API with JSDoc where non-obvious.
- [ ] Run: `CI=true pnpm vitest run tests/audioEngine.test.ts` — GREEN.

### [ ] Task: Write failing tests for the persisted mute preference
- [ ] Default is ON (unmuted) with no stored value.
- [ ] `setMuted(true)` round-trips through storage; restored on a new instance.
- [ ] Corrupt/missing storage falls back to default without throwing.
- [ ] Run: `CI=true pnpm vitest run tests/audioPreferences.test.ts` — confirm RED.

### [ ] Task: Implement `src/audio/preferences.ts`
- [ ] Namespaced localStorage key (same pattern as coach-mark state); injectable storage for tests; safe read/write.
- [ ] `isMuted()` / `setMuted(bool)` API.
- [ ] Run: `CI=true pnpm vitest run tests/audioPreferences.test.ts` — GREEN.

### [ ] Task: Document the Audio layer in `tech-stack.md`
- [ ] Add a row for the Audio layer (Web Audio API, procedural SFX, no assets) with rationale before implementation proceeds.
- [ ] No tech-stack deviation elsewhere; document nothing else.

### [ ] Task: Cover changed logic and commit Phase 1
- [ ] Coverage: `CI=true pnpm vitest run --coverage` scoped to `src/audio/` — ≥80%.
- [ ] `CI=true pnpm biome check .` — clean.
- [ ] Commit: `feat(audio): Add procedural audio engine and persisted mute preference`.
- [ ] Attach `git notes add` summary to the commit.
- [ ] Update `plan.md`: mark tasks `[~]`→`[x]` with commit hashes and notes.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Run full suite once; propose manual verification (dev server, first-gesture sound, toggle state).
- [ ] Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.

## Phase 2 · Marble Impact Detector (logic)

### [ ] Task: Write failing tests for `src/sim/marbleImpact.ts`
- [ ] Test airborne→landed transition: strong negative `vy` then deceleration to ~0/positive emits one landing.
- [ ] Test single-fire: repeated updates with the same marble id never emit twice.
- [ ] Test multiple marbles tracked independently.
- [ ] Test removal/reset drops tracking (no stale ids).
- [ ] Run: `CI=true pnpm vitest run tests/marbleImpact.test.ts` — confirm RED.

### [ ] Task: Implement `src/sim/marbleImpact.ts`
- [ ] Per-marble first-landing state machine driven by velocity samples (pure logic, no Rapier/Three).
- [ ] Threshold constants exported; emit new landed ids once.
- [ ] Document API with JSDoc.
- [ ] Run: `CI=true pnpm vitest run tests/marbleImpact.test.ts` — GREEN.

### [ ] Task: Cover changed logic and commit Phase 2
- [ ] Coverage: `CI=true pnpm vitest run --coverage` scoped to `src/sim/marbleImpact.ts` — ≥80%.
- [ ] `CI=true pnpm biome check .` — clean.
- [ ] Commit: `feat(audio): Add per-marble first-landing detector`.
- [ ] Attach `git notes add` summary; update `plan.md` with commit hash + notes.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Run full suite once; manual check that each spawned marble lands at most once.
- [ ] Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.

## Phase 3 · HUD Sound Toggle (UI glue)

### [ ] Task: Implement `src/ui/soundToggle.ts`
- [ ] Compact speaker "Sound" button: ≥44px target, `aria-pressed`, accessible label, consistent HUD styling.
- [ ] Wires to `preferences` (initial state + persistence) and `engine.setMuted`.
- [ ] Render-only UI per workflow (no unit-test requirement; preference logic already covered).

### [ ] Task: Add toggle styling and verify layout
- [ ] CSS consistent with existing HUD at phone width/main.ts `topHud`; no overlap or horizontal scroll.
- [ ] Manual: toggle reachable without keyboard; state persists across reload.
- [ ] Commit: `feat(audio): Add persisted HUD sound toggle`.
- [ ] Attach `git notes add` summary; update `plan.md` with commit hash + notes.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Full suite once; desktop + touch manual checks.
- [ ] Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.

## Phase 4 · Event Wiring (integration glue)

### [ ] Task: Wire `snap` and `delete` sounds
- [ ] `placement.ts`: fire `snap` via existing `onPlace` path (new place + move commit); add `onDelete` deps callback and fire it in `deleteActive()`.
- [ ] `main.ts`: pass a sound callback into placement deps (`onPlace`/`onDelete`).
- [ ] Verify undo/redo and Drop point actions stay silent.
- [ ] Commit: `feat(audio): Wire piece snap and delete sounds`.

### [ ] Task: Wire `drop` and `landing` sounds
- [ ] `main.ts` `spawnMarble()`: play `drop` for every spawn (covers single + stream).
- [ ] Integrate `createMarbleImpactTracker` into the sim loop: feed per-marble velocities after stepping, play `landing`, drop tracking on marble removal.
- [ ] Commit: `feat(audio): Wire marble drop and landing sounds`.

### [ ] Task: Wire `goal` sound and lazy unlock
- [ ] `main.ts` `detectGoalEntries()`: play `goal` alongside the existing visual pop.
- [ ] Lazy unlock: one-time `pointerdown`/`keydown` listener calling `engine.unlock()`.
- [ ] Commit: `feat(audio): Wire goal pop sound and lazy audio unlock`.

### [ ] Task: Final quality gate and Phase 4 completion
- [ ] Full `CI=true pnpm vitest run`, `CI=true pnpm biome check .`, `pnpm build` (strict TS).
- [ ] Payload budget recheck (JS ≤3,500 kB / gzip ≤1,250 kB) and record sizes in `tech-stack.md` note.
- [ ] Commit any gate fixes; update `plan.md` with commit hashes + notes.
- [ ] Attach `git notes add` summary per task.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Full manual protocol: desktop (1280×720) + touch (~393×659) — hear every event, verify throttle/quietness, toggle persist/restore, no autoplay errors, bundle within budget.
- [ ] Await explicit user confirmation; record final checkpoint SHA in `plan.md`.
