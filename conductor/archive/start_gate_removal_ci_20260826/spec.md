# Track: Start-Gate Removal + PR CI Gating

**Track ID**: `start_gate_removal_ci_20260826` · Branch: `chore/start-gate-removal-ci-gating`

## Overview

Remove the legacy physical Start gate piece type entirely from Marblescape, deleting the dead spawning/health/graph code superseded by the free Drop point tool, while preserving v1→v2 save migration. In parallel, enable pull-request-triggered CI so feature branches are quality-gated before merge.

## Functional Requirements

### FR1 — Remove start-gate as a live piece type
- Remove `start-gate` from `PieceTypeId` union and `PIECE_TYPE_IDS` registry (`src/pieces/registry.ts`).
- Remove `START_GATE_HEIGHT` constant and the `START_GATE` def.
- Delete the start-gate geometry builder (`buildStartGate` + build map entry) from `src/pieces/builders.ts`.
- Remove the start-gate material entry (`src/pieces/materials.ts`).
- Remove the start-gate label and tray skip logic from `src/ui/tray.ts`; drop the "Start gate" label map entry.
- Remove the start-gate placement rule and its `getStartGate` import from `src/build/placementRules.ts` (the `canPlacePiece` guard becomes trivial/removable).

### FR2 — Remove graph start-gate invariant
- Remove the "only one start gate" check from `addPiece` and `restorePiece` in `src/track/graph.ts`.

### FR3 — Remove dead spawn & health code
- Delete the entire legacy `src/sim/gateSpawner.ts`.
- Remove `resolveSpawnAnchor`/`SpawnResolution`/`SPAWN_CLEARANCE` and the `getStartGate` import from `src/sim/playability.ts` (keep `PLAYABLE_BOUNDS`, `classifyPlayablePosition`, `findOutOfBoundsMarbleIds`, `MarblePosition`).
- Remove legacy `TrackHealthStatus`, `TrackHealth`, `getStartGate`, and `assessTrackHealth` from `src/track/health.ts` (keep `DropPointHealth*` and `reachableGoalIds`).

### FR4 — Preserve v1→v2 save migration via pre-parse
- Keep the ability to load v1 saves that contain a `start-gate`.
- Restructure `deserializeTrackDocument` to migrate the **raw v1 payload** (extract the legacy start-gate, convert its position to a Drop point, remove the gate piece) **before** `parseGraph` validates piece types — so removing `start-gate` from the live registry doesn't break v1 loading.
- The legacy migration tests in `tests/serialization.test.ts` must continue to pass unchanged (except any needed to adapt to the pre-parse structure).

### FR5 — Add PR-triggered CI
- Update `.github/workflows/ci.yml` `on:` to trigger on both `push:` to `master` and `pull_request:` (any branch), running the same existing quality gate (tests, Biome, `tsc --noEmit`, build) so branches are validated before merge.

## Non-Functional Requirements

- **NFR1:** Full suite (all `tests/` files) stays green; changed logic modules keep ≥80% coverage.
- **NFR2:** `pnpm build` (strict `tsc --noEmit` + `vite build`) passes; bundle size must not be near-exceeded (should *shrink* from removing the start-gate builder/material/gateSpawner).
- **NFR3:** Biome `check` clean with no lint/format errors.
- **NFR4:** No runtime regressions — the live app (Drop point flow) is unaffected; manual desktop + touch verification shows the tray displays only 5 pieces + Drop point, and existing saves (including a v1 save) still load.

## Acceptance Criteria

1. No occurrence of the string `start-gate` or `startGate` remains in `src/` except within the v1-migration path in `serialization.ts` (and its test).
2. `src/sim/gateSpawner.ts` and `tests/gateSpawner.test.ts` are deleted.
3. `getStartGate`, `assessTrackHealth`, `TrackHealth`, `resolveSpawnAnchor` are removed with no remaining references.
4. `deserializeTrackDocument` still loads a v1 save containing a start-gate and returns a Drop point positioned over the migrated gate; the legacy migration tests pass.
5. `ci.yml` triggers on both `pull_request` and `push` to `master` and both pass.
6. A PR on this branch would run the full quality gate (validated by CI run status).
7. Full suite green, strict TS clean, Biome clean, build succeeds, and bundle size reported.

## Out of Scope

- Removing the v1 save migration or breaking existing v1 saves.
- Any feature work (marble cosmetics, sharing, challenge modes, music/volume, PWA installability).
- Test coverage for the placement controller, main.ts, or render modules (a separate future track).
- Bundle-budget enforcement / coverage CI thresholds (separate concerns).