# Implementation Plan: Marblescape v1 MVP

Progress notes are appended under completed tasks per workflow.md. One commit per task.

## Phase 1 · Scaffold & Foundations [checkpoint: 15e6326]
- [x] Task: Scaffold Vite + TypeScript-strict project with pnpm, configure Biome and Vitest *(bfd88c2)*
  - Notes: Latest-stable toolchain at install time — vite 8.2.2, typescript 7.0.2, @biomejs/biome 2.5.10, vitest 4.1.11. Biome v2.5 migrated config format. Vitest runs with passWithNoTests until Phase 2 adds real logic tests.
  - Verify: `pnpm dev` HTTP 200 · `pnpm build` passes · `CI=true pnpm biome check .` clean
- [x] Task: Bootstrap Three.js renderer — responsive canvas, resize handling, wooden-table environment, lighting rig (per product-guidelines) *(4d8b25f)*
  - Notes: three 0.185.1 + @types/three 0.185.4. DPR clamped at 2 for mobile perf. Warm hemisphere + directional soft-shadow lighting; cream sky, wood-tone table. Bundle now 518kB raw / 129.6kB gzip (three included) — chunk-size warning logged for the Phase 6 budget pass.
- [x] Task: Fixed-timestep game loop with render interpolation + Rapier physics world init *(c7bf209)*
  - Notes: TDD red→green — 8 stepper tests, 100% coverage on src/core (target ≥80%). Rapier 0.20.0-compat, 60Hz fixed dt, maxSubSteps=5 spiral guard. Interpolation alpha exposed now; mesh application deferred to Phase 4 (bodies exist there). ⚠ Bundle: 3.4MB raw / 1.22MB gzip from embedded WASM — Phase 6 budget pass must address (code-split or non-compat package).
- [ ] Task: Phase Verification & Checkpoint *(Refer to workflow.md)*

## Phase 2 · Piece System [checkpoint: 476d745]
- [x] Task: Write failing tests — piece registry & connector-port math (port transforms, compatibility rules) *(5cf14dc)*
  - Notes: 14 tests across registry shape, geometric invariants (opposite/perpendicular/rise/mouth-spout/inlet-up), yaw+translate port math, compatibility matrix incl. symmetry. RED confirmed via unresolved-import failure.
- [x] Task: Implement piece type definitions + port system until green *(3711647)*
  - Notes: Pure-logic registry module. Shared track dimensions exported for geometry builders (width .6 / straight 2 / curve r1 / ramp rise .5). Symmetric kind allow-list: run-run, spout-run, spout-cup. Coverage 96.29% stmts / 100% fns-lines vs ≥80% target.
- [x] Task: Procedural geometry builders for straight / curve / ramp / funnel / goal cup (meshes + Rapier colliders) *(93e6cda)*
  - Notes: Local-space collider specs keep mesh/physics DRY; single spawn point applies placement. Curve = 8 trough segments on quarter arc; ramp chord math lands endpoints exactly on ports; funnel/cup are lathe shells with trimesh colliders. Visual check passed (user-confirmed).
- [x] Task: Signature marble mesh + glossy toy-plastic material palette (one hue per piece type) *(47f4049)*
  - Notes: Shared geometry+material (created once for all marbles). Clearcoat candy-glass, no transmission (mobile budget). PMREM RoomEnvironment = procedural gloss source for all PBR materials.
- [ ] Task: Phase Verification & Checkpoint *(Refer to workflow.md)*

## Phase 3 · Build Mode — Placement & Editing [checkpoint: 93830fd]
- [x] Task: Write failing tests — snapping solver (nearest compatible port within threshold, validity rules, red-ghost conditions) *(ba045aa)*
  - Notes: 9 tests — threshold export, null-when-far, head-on exact alignment, nearest-of-several, incompatible-kind rejection, occupied-port rejection, vertical spout↔cup preserving drag yaw, corner yaw alignment via roundtrip math, exclude-self for moves. RED confirmed.
- [x] Task: Write failing tests — undo/redo command stack (place/move/delete semantics) *(1c06b59)*
  - Notes: Graph rules (unique ids, symmetric compatible+free connect, remove clears partner refs, move detaches); generic stack cycle + redo-tail truncation; Place/Move/Delete semantics incl. full connection restore on delete-undo. RED confirmed.
- [x] Task: Implement track-graph module (pieces ↔ ports connections bookkeeping) until green *(c254f99)*
  - Notes: TrackGraph with symmetric free-port connection rules + snapshot-based restorePiece; findSnap solver (SNAP_DISTANCE 0.25, opposing-direction gate, yaw alignment that preserves vertical spout↔cup joins); generic CommandStack; Place/Move/Delete commands — Delete deep-clones its snapshot at construction so removePiece's detach can't corrupt restore. Coverage: commandStack/commands/snapping 100%, graph 95.16%, registry 96.29% stmts vs ≥80% target.
- [x] Task: Implement tray HUD + ghost placement flow (desktop pointer events + touch gestures) *(6d7fd0d)*
  - Notes: Added the five-piece bottom tray, translucent pointer/touch ghosts, snap/blocked/free feedback, rotation and cancellation controls, and undoable placement through PlaceCommand. Funnel mouth/spout ↔ run transitions now pass the vertical-to-horizontal snap rule, and snap connections are persisted symmetrically in the graph. User manually confirmed desktop/mobile placement, rotation, cancellation, snapping, and piece visuals.
  - Verify: `CI=true pnpm vitest run` (51 passed) · `CI=true pnpm vitest run --coverage` (97.38% statements overall) · `CI=true pnpm biome check .` · `pnpm build`
- [x] Task: Implement move & delete interactions routed through the command stack *(93830fd)*
  - Notes: Added graph-piece raycast hit-testing, drag-to-move ghosts, Delete/Backspace deletion, a touch-friendly delete pill, Escape cancellation, and Ctrl/Cmd undo/redo. Existing connections are freed during a move and restored on cancel/undo; MoveCommand reconnects the new snap and restores the complete pre-move snapshot. User manually confirmed desktop/mobile move, delete, cancellation, undo/redo, and connected-piece behavior.
  - Verify: `CI=true pnpm vitest run` (52 passed) · `CI=true pnpm vitest run --coverage` (97.47% statements overall) · `CI=true pnpm biome check .` · `pnpm build`
- [x] Task: Phase Verification & Checkpoint *(93830fd)*
  - Notes: Phase 3 checkpoint verified against prior checkpoint `476d745`. User confirmed desktop and mobile/touch behavior for placement, snapping, funnel ports, movement, reconnection, deletion, cancellation, undo/redo, touch controls, and no page scrolling. Verification report is attached to functional commit `93830fd`.
  - Verify: `CI=true pnpm vitest run` (52 passed) · `CI=true pnpm vitest run --coverage` (97.47% statements, 89.58% branches, 100% functions, 99.41% lines) · `CI=true pnpm biome check .` · `pnpm build` (existing large-bundle warning only)

## Phase 4 · Marble Simulation [checkpoint: a9ef6db]
- [x] Task: Write failing tests — spawner state machine (manual drop / stream toggle, ~20-marble cap with oldest-recycled, reset semantics incl. timer start rule) *(460d050)*
  - Notes: 7 tests define manual and continuous spawning, timer start at first spawn, interval scheduling, oldest-active recycling at the cap, removal, and reset/stop semantics. RED confirmed because the spawner module is not implemented yet.
- [x] Task: Implement spawner + marble bodies in the Rapier world until green *(042fb6f)*
  - Notes: Added the pure scheduler, manual/continuous controls, dynamic Rapier marble bodies, shared glossy meshes, 20-marble oldest recycling, goal-removal hook, and reset cleanup. User confirmed controls and accepted isolated horizontal-track stacking as expected until a moving starter contraption is added.
  - Verify: `CI=true pnpm vitest run` (60 passed) · `CI=true pnpm vitest run --coverage` (98.06% statements, 90.59% branches, 100% functions, 99.55% lines) · `CI=true pnpm biome check .` · `pnpm build` (existing large-bundle warning only)
- [x] Task: Goal-cup entry detection → counter increment + celebration pop *(7411318)*
  - Notes: Added world-space cup inlet capture, one-time goal tracking, marble removal, Goals HUD increment, +1 Goal celebration pop, multi-cup support, and reset behavior. User confirmed entry, scoring, celebration, streaming, and reset.
  - Verify: `CI=true pnpm vitest run` (63 passed) · `CI=true pnpm vitest run --coverage` (98.26% statements, 91.12% branches, 100% functions, 99.60% lines) · `CI=true pnpm biome check .` · `pnpm build` (existing large-bundle warning only)
- [x] Task: Run timer logic + HUD counters wired to simulation events *(a9ef6db)*
  - Notes: Added the tested MM:SS.t formatter, live Time and Goals outputs, post-first-spawn timer updates, and Reset clearing for both counters. User confirmed timer start/advance, stream timing, goal count, and reset.
  - Verify: `CI=true pnpm vitest run` (65 passed) · `CI=true pnpm vitest run --coverage` (98.30% statements, 91.12% branches, 100% functions, 99.61% lines) · `CI=true pnpm biome check .` · `pnpm build` (existing large-bundle warning only)
- [x] Task: Phase Verification & Checkpoint *(a9ef6db)*
  - Notes: Automated suite passed 65 tests with 98.30% statement coverage, 91.12% branch coverage, 100% function coverage, and 99.61% line coverage. Biome and production build passed with the existing large-bundle warning. Desktop and mobile manual verification was confirmed for spawning, stream control, physics settling, goal scoring/pop, timer/HUD, reset, touch targets, no scrolling, and Phase 3 regression behavior. Full verification report is attached as a Git note to `a9ef6db`.

## Phase 5 · Cameras [checkpoint: 9218430]
- [x] Task: Free-orbit camera controls (rotate / zoom / pan) for mouse and touch *(b4fa02a)*
  - Notes: Added bounded desktop and touch orbit, zoom, and pan gestures with pointer capture, no-scroll handling, grab cursor feedback, and an interaction lock while placing or moving pieces. User confirmed desktop/mobile camera and editing behavior.
  - Verify: `CI=true pnpm vitest run --coverage` (65 passed; 98.30% statements, 91.12% branches, 100% functions, 99.61% lines) · `CI=true pnpm biome check .` · `pnpm build` (existing large-bundle warning only)
- [x] Task: Chase-cam spectate mode following latest marble + camera-mode toggle *(9218430)*
  - Notes: Added smooth latest-marble chase following, Free/Chase HUD toggle, free-orbit restoration, gesture lock during chase, and responsive HUD wrapping. User confirmed desktop/mobile spectating, mode switching, placement compatibility, touch layout, and no scrolling.
  - Verify: `CI=true pnpm vitest run --coverage` (65 passed; 98.30% statements, 91.12% branches, 100% functions, 99.61% lines) · `CI=true pnpm biome check .` · `pnpm build` (existing large-bundle warning only)
- [x] Task: Phase Verification & Checkpoint *(9218430)*
  - Notes: Automated suite passed 65 tests with 98.30% statement coverage, 91.12% branch coverage, 100% function coverage, and 99.61% line coverage. Biome and production build passed with the existing large-bundle warning. Desktop and mobile manual verification was confirmed for free orbit, chase following, mode switching, editing compatibility, Phase 4 regression behavior, touch gestures, responsive HUD, and no scrolling. Full verification report is attached as a Git note to `9218430`.

## Phase 6 · Persistence, Performance & Polish
- [x] Task: Write failing tests — save serialization round-trip (track state ↔ JSON, mock IndexedDB via `idb`) *(44bf646)*
  - Notes: Added four red-phase tests for connected graph round-trips, versioned JSON payloads, independent restoration with monotonic IDs, and empty-graph preservation. RED confirmed because the serialization module is not implemented yet.
- [x] Task: Implement debounced auto-save + named-slot UI (save / load / delete / list) until green *(988841f)*
  - Notes: Added versioned JSON graph serialization, IndexedDB storage via `idb`, debounced `__autosave__` writes with pagehide flush, named save/load/delete/list controls, graph replacement with cleared undo history, and autosave callbacks for placement, move, delete, and undo/redo. User confirmed named-slot and autosave behavior; marble spawn height was raised to y=4.
  - Verify: `CI=true pnpm vitest run --coverage` (74 passed · 80.50% statements, 77.84% branches, 90.81% functions, 81.77% lines) · `CI=true pnpm biome check .` · `pnpm build` (existing large-bundle warning only)
- [x] Task: First-launch pre-built starter contraption; subsequent launches load last autosave *(950e86e)*
  - Notes: Added the five-piece connected starter path (descending ramp → straight → curve → funnel → goal cup), loaded `__autosave__` before rendering, persisted the starter on first launch, and retained a storage-failure fallback. User confirmed first-launch, reload persistence, fresh fallback, and mobile behavior.
  - Verify: `CI=true pnpm vitest run --coverage` (77 passed · 81.17% statements, 78.10% branches, 91.00% functions, 82.43% lines) · `CI=true pnpm biome check .` · `pnpm build` (existing large-bundle warning only)
- [x] Task: Performance pass — marble concurrency target, mobile frame-rate sanity, bundle-size budget check *(261e85d)*
  - Notes: Added a compact/touch rendering profile (DPR 1.5, no antialiasing, 1024px shadows) while retaining the desktop DPR 2/2048px profile. Set and recorded a V1 payload budget of 3,500 kB JS / 1,250 kB gzip. User confirmed desktop/mobile streaming responsiveness, concurrency behavior, no visible stutter, and no regressions.
  - Verify: `CI=true pnpm vitest run --coverage` (77 passed · 81.17% statements, 78.10% branches, 91.00% functions, 82.43% lines) · `CI=true pnpm biome check .` · `pnpm build` (3,416.94 kB JS / 1,238.67 kB gzip, within budget; existing single-chunk warning)
- [x] Task: Polish audit — `prefers-reduced-motion`, ≥44px touch targets, contrast check *(da73a77)*
  - Notes: Added visible keyboard focus rings, explicit placeholder contrast, 44px rotate/delete touch targets, and a reduced-motion goal-pop override. User confirmed focus visibility, reduced-motion behavior, readability, touch targets, mobile layout, and no scrolling.
  - Verify: `CI=true pnpm vitest run` (77 passed) · `CI=true pnpm biome check .` · `pnpm build` (3,416.94 kB JS / 1,238.67 kB gzip; existing large-bundle warning)
- [~] Task: Static deployment setup (shareable URL) + Final Verification & Checkpoint *(Refer to workflow.md)*
