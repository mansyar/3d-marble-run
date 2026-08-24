# Implementation Plan: Marblescape v1 MVP

Progress notes are appended under completed tasks per workflow.md. One commit per task.

## Phase 1 · Scaffold & Foundations
- [x] Task: Scaffold Vite + TypeScript-strict project with pnpm, configure Biome and Vitest *(bfd88c2)*
  - Notes: Latest-stable toolchain at install time — vite 8.2.2, typescript 7.0.2, @biomejs/biome 2.5.10, vitest 4.1.11. Biome v2.5 migrated config format. Vitest runs with passWithNoTests until Phase 2 adds real logic tests.
  - Verify: `pnpm dev` HTTP 200 · `pnpm build` passes · `CI=true pnpm biome check .` clean
  - [ ] Verify: `pnpm dev` serves, `pnpm build` passes, `CI=true pnpm biome check .` clean
- [x] Task: Bootstrap Three.js renderer — responsive canvas, resize handling, wooden-table environment, lighting rig (per product-guidelines) *(4d8b25f)*
  - Notes: three 0.185.1 + @types/three 0.185.4. DPR clamped at 2 for mobile perf. Warm hemisphere + directional soft-shadow lighting; cream sky, wood-tone table. Bundle now 518kB raw / 129.6kB gzip (three included) — chunk-size warning logged for the Phase 6 budget pass.
- [x] Task: Fixed-timestep game loop with render interpolation + Rapier physics world init *(c7bf209)*
  - Notes: TDD red→green — 8 stepper tests, 100% coverage on src/core (target ≥80%). Rapier 0.20.0-compat, 60Hz fixed dt, maxSubSteps=5 spiral guard. Interpolation alpha exposed now; mesh application deferred to Phase 4 (bodies exist there). ⚠ Bundle: 3.4MB raw / 1.22MB gzip from embedded WASM — Phase 6 budget pass must address (code-split or non-compat package).
- [ ] Task: Phase Verification & Checkpoint *(Refer to workflow.md)*

## Phase 2 · Piece System
- [ ] Task: Write failing tests — piece registry & connector-port math (port transforms, compatibility rules)
- [ ] Task: Implement piece type definitions + port system until green
- [ ] Task: Procedural geometry builders for straight / curve / ramp / funnel / goal cup (meshes + Rapier colliders)
  - [ ] Visual check: pieces read correctly on the table
- [ ] Task: Signature marble mesh + glossy toy-plastic material palette (one hue per piece type)
- [ ] Task: Phase Verification & Checkpoint *(Refer to workflow.md)*

## Phase 3 · Build Mode — Placement & Editing
- [ ] Task: Write failing tests — snapping solver (nearest compatible port within threshold, validity rules, red-ghost conditions)
- [ ] Task: Write failing tests — undo/redo command stack (place/move/delete semantics)
- [ ] Task: Implement track-graph module (pieces ↔ ports connections bookkeeping) until green
- [ ] Task: Implement tray HUD + ghost placement flow (desktop pointer events + touch gestures)
- [ ] Task: Implement move & delete interactions routed through the command stack
- [ ] Task: Phase Verification & Checkpoint *(Refer to workflow.md)*

## Phase 4 · Marble Simulation
- [ ] Task: Write failing tests — spawner state machine (manual drop / stream toggle, ~20-marble cap with oldest-recycled, reset semantics incl. timer start rule)
- [ ] Task: Implement spawner + marble bodies in the Rapier world until green
- [ ] Task: Goal-cup entry detection → counter increment + celebration pop
- [ ] Task: Run timer logic + HUD counters wired to simulation events
- [ ] Task: Phase Verification & Checkpoint *(Refer to workflow.md)*

## Phase 5 · Cameras
- [ ] Task: Free-orbit camera controls (rotate / zoom / pan) for mouse and touch
- [ ] Task: Chase-cam spectate mode following latest marble + camera-mode toggle
- [ ] Task: Phase Verification & Checkpoint *(Refer to workflow.md)*

## Phase 6 · Persistence, Performance & Polish
- [ ] Task: Write failing tests — save serialization round-trip (track state ↔ JSON, mock IndexedDB via `idb`)
- [ ] Task: Implement debounced auto-save + named-slot UI (save / load / delete / list) until green
- [ ] Task: First-launch pre-built starter contraption; subsequent launches load last autosave
- [ ] Task: Performance pass — marble concurrency target, mobile frame-rate sanity, bundle-size budget check
- [ ] Task: Polish audit — `prefers-reduced-motion`, ≥44px touch targets, contrast check
- [ ] Task: Static deployment setup (shareable URL) + Final Verification & Checkpoint *(Refer to workflow.md)*
