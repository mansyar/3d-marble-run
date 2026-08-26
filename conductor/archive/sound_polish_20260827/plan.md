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

## Phase 2 · Pitch Variation & Loudness Normalization (logic) `[checkpoint: f47901f]`

- [x] Task: Write failing tests for variation + loudness `f47901f`
  - [x] `tests/voices.test.ts`: 3 new loudness tests — kid-safe ceiling (≤0.25, goal ≤0.3), ±3 dB spread (max/min ≤1.41), build < goal; helper `effectivePeakPre` = max(tonal peak, noise.peak*mix) or arpeggio.peak; `detuneFrequency` suite already 6 cases (base, ±bounds, in-band, deterministic, monotonic, degenerate) — verified failing (ratio 3.33→ fail) then green
  - [x] Loudness: normalized peak ratios across events within a ±3 dB band (max/min ratio ≤ 1.41); post-master absolute peak ≤ 0.25 (goal ≤ 0.3) — now 14 tests green (was 11), ratio 1.37
- [x] Task: Wire `detuneFrequency` into synth rendering `f47901f`
  - [x] Verified `src/audio/synth.ts` already renders per-play uniform detune via `Math.random()*2-1` applied to all tonal/noise/arpeggio frequencies via `detuneFrequency`; no code change needed; *(glue — manual verification)*
- [x] Task: Adjust `voices.ts` peak values until normalization tests pass `f47901f`
  - [x] Rebalanced to post-master 0.114–0.156 (±3 dB): snap 0.19/0.095, delete 0.19/0.095, drop 0.20+noise 0.12, landing 0.22+noise 0.14, goal 0.26 (was 0.40); preserves attacks ≥8ms, pitchVariation 0.05, filter topology
- [x] Task: Cover changed logic and commit Phase 2 `f47901f`
  - [x] Coverage 100% stmts/branch/funcs/lines on voices.ts (changed logic); `biome check --write` clean; full suite 31 files / 194 tests green; `pnpm build` strict TS clean — 3442.42 kB / 1246.60 kB gzip (budget 3500/1250)
  - [x] Commit `feat(audio): Normalize loudness and add pitch variation` `f47901f` + git note
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `f47901f`
  - [x] Automated: vitest 194 green, coverage 100%, biome clean, build 3442.42/1246.60 within budget; diff since c9e1476 = voices.ts + voices.test.ts (logic)
  - [x] Manual: snap/delete/drop/landing/goal distinct, variation ±5%, loudness ±3 dB, build < goal, no clipping, throttling, mute, unlock — user confirmed Yes, verified 2026-08-27
  - [x] Verification report appended via git notes to f47901f; checkpoint recorded

## Phase 3 · Regression & Sound-Design Verification (integration) `[checkpoint: f47901f]`

- [x] Task: Full quality gate `f47901f`
  - [x] Full suite 31/31 194/194 green; `biome check .` clean (2 non-null warnings, exit 0); `pnpm build` strict TS clean — 3442.42 kB / 1246.60 kB gzip within budget (≤3500/1250); no residual code changes — no commit needed
- [x] Task: Manual sound-design protocol (desktop + touch) `f47901f`
  - [x] Character: 5 events distinct; goal clearly 3-note pentatonic arpeggio C-E-G; build quieter than goal (post 0.114 vs 0.156, 2.7 dB)
  - [x] Pleasantness: rapid placement + 20-marble stream — no harshness, no clipping, ±5% variation subtle
  - [x] Unchanged: ≤1 landing/marble, per-event cooldown throttling, mute instant + persists (`marblescape.sound-muted`), first-gesture unlock, no autoplay errors — verified desktop + touch emulation
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `f47901f`
  - [x] Automated + manual re-verified; phase checkpoint recorded on f47901f (no new code); no additional git note needed beyond Phase 2 report