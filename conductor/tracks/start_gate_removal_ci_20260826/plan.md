# Implementation Plan — Start-Gate Removal + PR CI Gating

**Track ID**: `start_gate_removal_ci_20260826` · Branch: `chore/start-gate-removal-ci-gating`

## Phase 1 · PR-Triggered CI Gating (infra) `[checkpoint: 318d721]`

- [x] Task: Add PR trigger to CI workflow `318d721`
  - [x] Update `.github/workflows/ci.yml` `on:` to include `pull_request:` in addition to existing `push` onto `master`, so the same quality gate (tests, Biome, `tsc --noEmit`, `build`) runs on PRs.
  - [x] *(glue — no logic change; no TDD phase needed. Manual verification: view the Actions run on this track's branch/PR.)*
- [x] Task: Verify CI configuration `318d721`
  - [x] Confirm the workflow YAML is valid and triggers on both `push` and `pull_request`.
  - [x] *(no logic tests required — infrastructure only)*
- [x] Task: Commit Phase 1 `318d721`
  - [x] Commit `chore(ci): Add pull_request trigger to quality gate`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `318d721`
  - [x] Automated: 31 files / 194 tests green; biome clean; build within budget. Manual: cloud-side Actions run pending PR push (local verification of YAML by inspection). User confirmed Yes.
  - [x] Verification report attached via git notes to `318d721`; checkpoint recorded.

## Phase 2 · Start-Gate Elimination (logic)

- [x] Task: Write failing tests for v1 migration pre-parse and registry changes `4ea81c5`
  - [x] Red phase: updated `tests/pieces.test.ts` to expect 5 piece types (start-gate removed from `PIECE_TYPE_IDS` keys / `PieceTypeId` union) — confirmed failing (1 test) against unchanged source.
  - [x] Red phase: removed start-gate cases from `tests/commands.test.ts`; updated `serialization.test.ts` round-trip to use a funnel; deleted `tests/placement.test.ts`, `tests/trackHealth.test.ts`, `tests/gateSpawner.test.ts`.
  - [x] Kept/exercised the existing v1-migration tests as the safety net for the pre-parse restructuring (all 11 serialization tests green throughout the Green phase).
- [x] Task: Implement removal of start-gate as a live type `4ea81c5`
  - [x] Removed `start-gate` from `PieceTypeId` + `PIECE_TYPE_IDS`, deleted `START_GATE` def + `START_GATE_HEIGHT` in `src/pieces/registry.ts`.
  - [x] Deleted `buildStartGate` + build-map entry from `src/pieces/builders.ts`; removed the start-gate color in `src/pieces/materials.ts`.
  - [x] Removed start-gate label / skip logic from `src/ui/tray.ts`.
  - [x] Deleted `src/build/placementRules.ts` (trivial guard) and removed both `canPlacePiece` call sites from `src/build/placement.ts`.
- [x] Task: Implement graph invariant removal `4ea81c5`
  - [x] Removed "only one start gate" checks from `addPiece` and `restorePiece` in `src/track/graph.ts`.
- [x] Task: Delete dead spawn & health code `4ea81c5`
  - [x] Deleted `src/sim/gateSpawner.ts` and `tests/gateSpawner.test.ts`.
  - [x] Removed `resolveSpawnAnchor`/`SpawnResolution`/`SPAWN_CLEARANCE` + `getStartGate`/`START_GATE_HEIGHT` imports from `src/sim/playability.ts`.
  - [x] Removed `TrackHealth*`, `getStartGate`, `assessTrackHealth` from `src/track/health.ts` (kept Drop point health).
- [x] Task: Implement v1 pre-parse migration in serialization `4ea81c5`
  - [x] Restructured `deserializeTrackDocument` to migrate the raw v1 payload via `migrateLegacyStartGate` (start-gate -> Drop point, stripping the piece, clearing references, and validating that the gate's connections only reference existing pieces) BEFORE `parseGraph` validates piece types.
  - [x] Removed `start-gate` from `isPieceTypeId` and the now-dead multi-gate check in `parseGraph`. Legacy migration tests pass (Green); closer invalid-connection rejection preserved.
- [x] Task: Cover changed logic and commit Phase 2 `4ea81c5`
  - [x] Full suite green (28 files / 183 tests, down from 31/194 after deleting orphaned start-gate tests); `biome check --write` clean (fixed 2 import-type nits); `pnpm build` strict TS clean.
  - [x] Committed `chore(pieces): Remove legacy start-gate piece type` `4ea81c5` + git note.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Automated: full suite green, coverage, Biome, build, bundle size reported.
  - [ ] Manual: desktop + touch emulation. Tray shows 5 pieces + Drop point, no start-gate; a v1 save still loads; Drop point flow works; no regressions.
  - [ ] Await explicit user confirmation; attach verification report via git notes; checkpoint recorded.