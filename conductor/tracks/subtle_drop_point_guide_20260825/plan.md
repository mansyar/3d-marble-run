# Implementation Plan: Subtle Drop Point Guide

This rendering-only chore follows the manual-verification path in the project
workflow; no new logic-bearing module is planned.

## Phase 1: Dotted guide rendering

- [ ] Task: Replace the translucent cylinder with a thin dotted landing guide
  - [ ] Inspect the existing `DropPointGuide` marker/guide lifecycle and
    preserve its public API.
  - [ ] Render a procedural full-height dotted teal guide from the marker to
    the landing point.
  - [ ] Preserve preview refresh, invalid-landing visibility, landing
    callbacks, and resource disposal.
  - [ ] Keep the marker, raycast, spawning, health, persistence, and placement
    behavior unchanged.

- [ ] Verification checkpoint: Run the test suite, Biome, TypeScript, and
  production builds; manually verify desktop and 360px/mobile views,
  valid/invalid landing visibility, movement updates, and no runtime errors.
