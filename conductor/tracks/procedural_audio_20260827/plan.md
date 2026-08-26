# Implementation Plan: Procedural Audio

## Phase 1 · Audio Engine & Preferences (logic) `[checkpoint: a05438a]`

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

## Phase 2 · Marble Impact Detector (logic) `[checkpoint: b7b662d]`

### [x] Task: Write failing tests for `src/sim/marbleImpact.ts` `b7b662d`
- 8 cases: falling→landed transition, never-fell stays silent, independent marbles, no bounce re-fire (terminal landed state), re-track after remove(), reset(), empty samples, threshold ordering. Confirmed RED before implementation.

### [x] Task: Implement `src/sim/marbleImpact.ts` `b7b662d`
- Pure velocity-sample state machine with terminal landed state; threshold constants exported. GREEN 8/8; coverage 100%.

### [x] Task: Cover changed logic and commit Phase 2 `b7b662d`
- Coverage 100% stmts/branch/funcs/lines; Biome clean.
- Commit `feat(audio): Add per-marble first-landing detector`; git note attached.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Run full suite once; manual check that each spawned marble lands at most once.
- [ ] Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.

## Phase 3 · HUD Sound Toggle (UI glue) `[checkpoint: 51baec2]`

### [x] Task: Implement `src/ui/soundToggle.ts` `51baec2`
- `createSoundToggle(root, {preferences, engine})`: `button.sound-toggle`, aria-label, textContent "Sound: On"/"Sound: Off", aria-pressed mirrors unmuted; click persists + applies mute. Rendering glue (no unit test per workflow).
- `main.ts`: creates `soundPreferences` + `sound = createAudioEngine(createWebAudioSynth())` after topHud; syncs initial engine mute from stored preference; appends toggle to topHud.

### [x] Task: Add toggle styling and verify layout `51baec2`
- `style.css`: `#top-hud` desktop grid → `minmax(0, 1fr) auto auto` (3rd column for the toggle); `.sound-toggle` shares HUD button styles (44px min-height, borders, active/focus-visible); ≤900px single-column stack with `justify-self: start`.
- Quality gate: full suite 180/180, Biome clean, `pnpm build` OK — payload 3,440.09 kB / 1,245.86 kB gzip (within budget).

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `51baec2`
- Full suite 180/180; manual verification (toggle layout desktop + touch, persistence across reload, no overlap at 360px) confirmed by user; verification note appended to `51baec2`.

## Phase 4 · Event Wiring (integration glue)

### [x] Task: Wire `snap` and `delete` sounds `b0db34d`
- `placement.ts`: added `onDelete` to `PlacementDeps`, fired in `deleteActive()`; `main.ts` plays `snap` from `onPlace` (new place + move commit) and `delete` from the new `onDelete`. Undo/redo and Drop point actions stay silent.

### [x] Task: Wire `drop` and `landing` sounds `b0db34d`
- `main.ts`: `spawnMarble()` plays `drop` (single drop + continuous stream); `createMarbleImpactTracker` feeds per-marble velocity samples each frame after stepping and plays `landing` for newly-landed ids; tracker kept in sync via `removeMarble()` + `resetSimulationState()`.

### [x] Task: Wire `goal` sound and lazy unlock `b0db34d`
- `detectGoalEntries()` plays `goal` beside `showGoalPop()`; one-time `pointerdown`/`keydown` document listeners unlock the audio context on the first gesture.

### [x] Task: Final quality gate and Phase 4 completion `b0db34d`
- Full suite 180/180; Biome clean; `pnpm build` (strict TS) OK — payload 3,440.71 kB min / 1,246.10 kB gzip (within 3,500/1,250 budget, rechecked).

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Full manual protocol: desktop (1280×720) + touch (~393×659) — hear every event, verify throttle/quietness, toggle persist/restore, no autoplay errors, bundle within budget.
- [ ] Await explicit user confirmation; record final checkpoint SHA in `plan.md`.
