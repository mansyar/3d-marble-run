# Implementation Plan: Procedural Audio

## Phase 1 · Audio Engine & Preferences (logic)

### [x] Task: Write failing tests for the procedural audio engine `a05438a`
- Engine tests: 9 cases — unlock gate, idempotent unlock, per-event cooldowns (injectable clock), cross-event independence, mute semantics, default state. Confirmed RED (module missing) before implementation.

### [x] Task: Implement `src/audio/engine.ts` `a05438a`
- Split into `engine.ts` (pure scheduling: cooldowns, unlock, mute; injectable `SoundPlayer` + clock) and `synth.ts` (WebAudio one-shots, lazy `AudioContext`). GREEN 9/9.

### [x] Task: Write failing tests for the persisted mute preference `a05438a`
- Preference tests: default unmuted, round-trip, corrupt value, null storage, throwing read/write, default backend. Confirmed RED before implementation.

### [x] Task: Implement `src/audio/preferences.ts` `a05438a`
- Mirrors coach-mark state pattern; key `marblescape.sound-muted`; safe read/write. GREEN 7/7.

### [x] Task: Document the Audio layer in `tech-stack.md` `a05438a`
- Added Web Audio API row (procedural SFX, zero assets, ~zero bundle cost); no other stack changes.

### [x] Task: Cover changed logic and commit Phase 1 `a05438a`
- Coverage: engine 90.9% / preferences 81.8% statements (≥80%). Full suite 172/172 green; Biome clean.
- Commit `feat(audio): Add procedural audio engine and persisted mute preference`; git note attached.

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
