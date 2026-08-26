# Implementation Plan — Sound Design Polish

**Track ID**: `sound_polish_20260827` · Branch: `feat/sound-polish`

## Phase 1 · Voice Spec Module & Synth Renderer (logic) `[checkpoint: c9e1476]`

- [x] Task: Write failing tests for the voice spec module `c9e1476`
  - [x] `tests/voices.test.ts`: 11 cases — all 5 events present; tonal layer fields sane (freqs 40–8,000 Hz, durations 20–500ms, peaks in (0, 0.35]); noise layer present only on drop/landing (`mix > 0`), absent elsewhere; goal = 3 ascending notes from the pentatonic offset set {0, +2, +4, +7, +9} semitones; envelope attacks ≥ 8ms everywhere; `pitchVariation ≤ 0.05` per event; `detuneFrequency` suite (base, ±bounds, in-band, deterministic, monotonic, degenerate)
- [x] Task: Implement `src/audio/voices.ts` until tests pass `c9e1476`
  - [x] Pure data module, named exports, JSDoc; `VoiceSpec`/`TonalLayer`/`NoiseLayer`/`Arpeggio` types; exports `VOICES` record + `detuneFrequency(freq, variation, random)` helper; `MASTER_GAIN` moved here; new family: snap 2×triangle, delete 2×sine descender, drop sine+noise bandpass 1800Hz, landing sine+noise lowpass 400Hz, goal = 3-note C5 pentatonic arpeggio (C-E-G, 0.27s)
- [x] Task: Refactor `src/audio/synth.ts` to render the voice specs `c9e1476`
  - [x] Dual-oscillator rendering where specced; shared lazily-built 1s noise AudioBuffer + per-event BiquadFilter for drop/landing; arpeggio sequential note scheduling (root × 2^(semitones/12)); per-play uniform detune applied to all event frequencies; envelope scheduling from spec (attack/duration); lazy AudioContext/resume/stop() unchanged *(manual verification — glue)*
- [x] Task: Cover changed logic and commit Phase 1 `c9e1476`
  - [x] Coverage 100% stmts/branch/funcs/lines on voices.ts (changed logic); biome check --write clean; full suite 31 files / 191 tests green
  - [x] Commit `feat(audio): Redesign procedural voice family` `c9e1476` + git note
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [x] User confirmed full-suite green + no regression (Phase 1 renders nothing until wired); checkpoint recorded

## Phase 2 · Pitch Variation & Loudness Normalization (logic)

- [ ] Task: Write failing tests for variation + loudness
  - [ ] `tests/voices.test.ts`: `detuneFrequency` with injected RNG — random=0 → base; random=1/-1 → ±variation bounds; mid values within band; deterministic for fixed RNG
  - [ ] Loudness: normalized peak ratios across events within a ±3 dB band (max/min ratio ≤ 1.41); post-master absolute peak ≤ 0.25 (goal ≤ 0.3)
- [ ] Task: Wire `detuneFrequency` into synth rendering
  - [ ] Per-play random detune via `Math.random`; variation applied to all tonal oscillators of the event; *(glue — manual verification)*
- [ ] Task: Adjust `voices.ts` peak values until normalization tests pass
- [ ] Task: Cover changed logic and commit Phase 2
  - [ ] Coverage ≥80%; full suite green; biome clean
  - [ ] Commit `feat(audio): Normalize loudness and add pitch variation` + git note
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 · Regression & Sound-Design Verification (integration)

- [ ] Task: Full quality gate
  - [ ] Full suite; `biome check .`; `pnpm build` (strict TS); payload recheck ≤ 3,500 kB / ≤ 1,250 kB
  - [ ] Commit `feat(audio): Finalize sound polish` (if any residual changes) + git note
- [ ] Task: Manual sound-design protocol (desktop + touch)
  - [ ] Character: 5 events distinct; goal clearly a rising arpeggio; build quieter than goal
  - [ ] Pleasantness: rapid placement + 20-marble stream — no harshness, no clipping
  - [ ] Unchanged: ≤1 landing/marble, throttling, mute instant + persists, first-gesture unlock, no autoplay errors
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)