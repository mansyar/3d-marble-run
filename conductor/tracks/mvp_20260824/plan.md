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

## Phase 3 · Build Mode — Placement & Editing
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
