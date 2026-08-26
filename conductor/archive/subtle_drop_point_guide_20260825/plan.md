# Implementation Plan: Subtle Drop Point Guide

This rendering-only chore follows the manual-verification path in the project
workflow; no new logic-bearing module is planned.

## Phase 1: Dotted guide rendering

- [x] Task: Replace the translucent cylinder with a thin dotted landing guide
  `[cb4df0e]`
  - [x] Inspect the existing `DropPointGuide` marker/guide lifecycle and
    preserve its public API. `[cb4df0e]`
  - [x] Render a procedural full-height dotted teal guide from the marker to
    the landing point. `[cb4df0e]` — Replaced the continuous cylinder with
    dynamically positioned instanced dots.
  - [x] Preserve preview refresh, invalid-landing visibility, landing
    callbacks, and resource disposal. `[cb4df0e]`
  - [x] Keep the marker, raycast, spawning, health, persistence, and placement
    behavior unchanged. `[cb4df0e]`

- [x] Verification checkpoint `[cb4df0e]`: Run the test suite, Biome, TypeScript, and
  production builds; manually verify desktop and 360px/mobile views,
  valid/invalid landing visibility, movement updates, and no runtime errors.
  - Automated: 24 test files / 142 tests passed; coverage was 92.34%
    statements, 86.79% branches, 96.29% functions, and 94.75% lines. Biome,
    TypeScript, standard build, and `/marblescape/` build passed at 3,432.40
    kB JavaScript / 1,243.40 kB gzip.
  - Manual: Desktop showed the full-height thin teal dotted guide and violet
    marker; invalid landing retained the marker, hid the guide, and disabled
    Drop/Stream. The 360px mobile view had no document overflow. User accepted
    the checkpoint; browser output contained no application errors.
