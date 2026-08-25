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

- [~] Verification checkpoint: Run the test suite, Biome, TypeScript, and
  production builds; manually verify desktop and 360px/mobile views,
  valid/invalid landing visibility, movement updates, and no runtime errors.
