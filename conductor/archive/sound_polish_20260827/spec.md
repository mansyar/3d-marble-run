# Spec — Sound Design Polish

**Track ID**: `sound_polish_20260827` · **Type**: FEATURE · **Status**: new

## Overview
Redesigns the five procedural one-shot SFX (snap, delete, drop, landing, goal) into one cohesive, higher-quality sound family that matches the product's friendly toy-set identity — while staying **fully synthesized**: oscillators + filtered noise, zero audio assets, zero new dependencies. Voice definitions become a pure, unit-testable data module so the whole redesign is TDD-verifiable.

## Functional Requirements

### FR-1 — Voice spec module
- New `src/audio/voices.ts` defines each event's voice as pure data: tonal oscillators (wave, start/end frequency, duration), optional noise layer (mix %, filter type/frequency), envelope (attack, peak, release), and pitch-variation range.
- `src/audio/synth.ts` renders these specs; its lazy AudioContext, first-gesture unlock, and stop() semantics stay unchanged.

### FR-2 — Timbre family (tonal + noise hybrid)
- **snap**: warm two-oscillator click (triangle + soft overtone), ~80ms — cozier than today's bare 600→1100 Hz sweep.
- **delete**: soft two-oscillator descender, ~120ms — reassuring, never thudding.
- **drop**: short tonal pluck + filtered-noise tick layer, ~70ms — reads as "marble released".
- **landing**: filtered-noise thump with a low sine body, ~100ms — reads as glass marble on wood, soft not hard.
- **goal**: **3-note rising pentatonic mini-arpeggio** (e.g., C–E–G triangle-ish mellow voice, notes ~100ms each, total ≤ 400ms) — quiet micro-win celebration per product-guidelines.

### FR-3 — Subtle pitch variation
- Each playback randomly detunes its voice within a documented ±5% band (uniform random; pure helper unit-tested for bounds and determinism with injected RNG).

### FR-4 — Loudness normalization + kid-safe ceiling
- Perceived loudness equalized across events (build sounds ~-6 dB relative to goal; marble sounds mid); absolute post-master peak ≤ 0.25 for all events (goal ≤ 0.3); attack times ≥ 8ms — no transient can startle.

### FR-5 — Unchanged behavior
- Event taxonomy, per-event cooldowns, unlock gate, `marblescape.sound-muted` persistence, mute-stops-immediately, and all wiring hooks (onPlace/onDelete/spawnMarble/velocity samples/goal pop) remain exactly as shipped.

## Non-Functional Requirements
- **NFR-1**: Zero external assets, zero new runtime dependencies, payload growth ≈ 0 kB (code only); bundle budget stays ≤ 3,500 kB min / ≤ 1,250 kB gzip.
- **NFR-2**: Node-runnable unit tests (no AudioContext) on all new/changed logic (voices data + variation/detune helper + loudness/peak constants); ≥80% coverage on changed logic.
- **NFR-3**: Autoplay-safe: AudioContext still created/resumed only inside the first user gesture; no sounds before interaction.
- **NFR-4**: Only broadly-supported WebAudio APIs (oscillators, BiquadFilter, GainNode, pre-generated shared noise AudioBuffer); no new browser requirements.
- **NFR-5**: Biome clean, strict TS, full suite green.

## Acceptance Criteria
- **AC-1**: All five events use the new voice family; each remains distinct and recognizable; goal is a 3-note rising pentatonic arpeggio ≤ 400ms.
- **AC-2**: Variation stays within ±5% and never produces harsh/out-of-character events across repeated listening.
- **AC-3**: No event clips or exceeds the peak ceiling at master gain; build sounds audibly quieter than goal.
- **AC-4**: Zero assets; payload within budget; coverage ≥80% on changed logic; 180/180 suite + new tests green; Biome/TS clean.
- **AC-5**: Manual audible check (desktop + mobile): rapid placement + 20-marble stream stays pleasant and throttled; ≤1 landing per marble; mute toggle instant; no autoplay errors.

## Out of Scope
- Music, ambient loops, volume slider, per-event mutes, new event types (stream toggle, UI clicks, Drop point, undo/redo stay silent) — per product.md.
- Changing cooldown values, unlock behavior, mute persistence semantics, or any wiring hooks.
- New WebAudio APIs, polyfills, asset pipelines, or sound recording.