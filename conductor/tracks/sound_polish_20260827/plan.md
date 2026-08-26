# Implementation Plan — Sound Design Polish

**Track ID**: `sound_polish_20260827` · Branch: `feat/sound-polish`

## Phase 1 · Voice Spec Module & Synth Renderer (logic)

- [ ] Task: Write failing tests for the voice spec module
  - [ ] `tests/voices.test.ts`: all 5 events present; tonal layer fields sane (freqs 40–8,000 Hz, durations 20–500ms, peaks in (0, 0.35]); noise layer present only on drop/landing (`noiseMix > 0`), absent elsewhere; goal = 3 ascending notes from the pentatonic offset set {0, +2, +4, +7, +9} semitones; envelope attacks ≥ 8ms everywhere; `pitchVariation ≤ 0.05` per event
- [ ] Task: Implement `src/audio/voices.ts` until tests pass
  - [ ] Pure data module, named exports, JSDoc; `VoiceSpec`/`TonalLayer`/`NoiseLayer`/`GoalArpeggio` types; exports `VOICES` record + `detuneFrequency(freq, variation, random)` helper
- [ ] Task: Refactor `src/audio/synth.ts` to render the voice specs
  - [ ] Dual-oscillator rendering where specced; shared lazily-built 1s noise AudioBuffer + per-event BiquadFilter for drop/landing; envelope scheduling from spec; lazy AudioContext/resume/stop() unchanged *(manual verification — glue)*
- [ ] Task: Cover changed logic and commit Phase 1
  - [ ] Coverage ≥80% on changed logic; `biome check --write`; full suite green
  - [ ] Commit `feat(audio): Redesign procedural voice family` + git note
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

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