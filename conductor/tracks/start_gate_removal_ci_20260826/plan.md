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

- [ ] Task: Write failing tests for v1 migration pre-parse and registry changes
  - [ ] Add failing tests to `tests/serialization.test.ts` asserting a v1 payload with a start-gate still migrates to a Drop point under the restructured `deserializeTrackDocument` (pre-parse, before type validation).
  - [ ] Red phase: update `tests/pieces.test.ts` to expect `start-gate` removed from `PIECE_TYPE_IDS` keys and `PieceTypeId` union.
  - [ ] Red phase: remove start-gate cases from `tests/placement.test.ts`, `tests/commands.test.ts`, `tests/trackHealth.test.ts`.
- [ ] Task: Implement removal of start-gate as a live type
  - [ ] Remove `start-gate` from `PieceTypeId` + `PIECE_TYPE_IDS` and delete `START_GATE` def + `START_GATE_HEIGHT` in `src/pieces/registry.ts`.
  - [ ] Delete `buildStartGate` + build-map entry from `src/pieces/builders.ts`; remove start-gate color in `src/pieces/materials.ts`.
  - [ ] Remove start-gate label / skip logic from `src/ui/tray.ts`.
  - [ ] Simplify/remove start-gate rule in `src/build/placementRules.ts`.
- [ ] Task: Implement graph invariant removal
  - [ ] Remove "only one start gate" checks from `addPiece` and `restorePiece` in `src/track/graph.ts`.
- [ ] Task: Delete dead spawn & health code
  - [ ] Delete `src/sim/gateSpawner.ts` and `tests/gateSpawner.test.ts`.
  - [ ] Remove `resolveSpawnAnchor`/`SpawnResolution`/`SPAWN_CLEARANCE` + `getStartGate` import from `src/sim/playability.ts`.
  - [ ] Remove `TrackHealth*`, `getStartGate`, `assessTrackHealth` from `src/track/health.ts` (keep Drop point health).
- [ ] Task: Implement v1 pre-parse migration in serialization
  - [ ] Restructure `deserializeTrackDocument` to migrate the raw v1 payload's start-gate to a Drop point before `parseGraph` validates piece types.
  - [ ] Ensure legacy migration tests from the previous Red phase pass (Green).
- [ ] Task: Cover changed logic and commit Phase 2
  - [ ] Coverage ≥80% on changed logic; `biome check --write` clean; full suite green.
  - [ ] Commit `chore(pieces): Remove legacy start-gate piece type`
  - [ ] Commit `conductor(plan): Mark task 'v1 migration pre-parse' as complete` and others as per one-task-one-commit.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Automated: full suite green, coverage, Biome, build, bundle size reported.
  - [ ] Manual: desktop + touch emulation. Tray shows 5 pieces + Drop point, no start-gate; a v1 save still loads; Drop point flow works; no regressions.
  - [ ] Await explicit user confirmation; attach verification report via git notes; checkpoint recorded.