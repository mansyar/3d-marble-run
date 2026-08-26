# Implementation Plan: Cut v0.2.0 Release

Execution roadmap for the v0.2.0 release train. Ordering note: the version
bump precedes the smoke test because the production build derives the
About-modal version from `package.json` — only a post-bump build can display
`v0.2.0` in-app.

## Phase 1 · Baseline Verification [checkpoint: 59de226]

- [x] Task: Establish pre-release baseline on `master` (59de226)
  - [x] Confirm clean working tree and parity with `origin/master`
  - [x] Run frozen install, `CI=true pnpm vitest run --coverage`,
        `CI=true pnpm biome check .`
  - [x] Record baseline bundle sizes from `pnpm build`
  - Notes: tree clean; local master strictly ahead of origin/master (ancestor
    check OK). Gates: install frozen OK; vitest 156/156 passed, 90.37% stmts;
    biome initially failed on missing EOF newline in track metadata.json —
    fixed via `biome --write`, re-check clean (85 files). Baseline bundle:
    **3,437.74 kB minified / 1,244.96 kB gzip** (budget ≤3,500 / ≤1,250).
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 · Version Bump & Release Build Smoke Test

- [x] Task: Cut version bump to `0.2.0` (0fd2632)
  - [x] `pnpm version minor`; verify `package.json` = `0.2.0` and local tag
        `v0.2.0` created
  - [x] Keep tag unpushed until smoke passes
  - Notes: `pnpm version minor` produced commit 0fd2632; pkg version 0.2.0;
    local tag `v0.2.0` confirmed; `git ls-remote origin v0.2.0` empty →
    unpushed as planned.
- [x] Task: Rebuild production bundle & recheck payload budget (a5fd37d)
  - [x] `pnpm build`; assert ≤3,500 kB minified / ≤1,250 kB gzip; note deltas
        vs baseline
  - Notes: post-bump build green (tsc strict + vite). **3,437.74 kB /
    1,244.96 kB gzip** — identical to baseline (Δ 0.00/0.00), new asset hash
    `index-MBj7VghY.js` carries baked-in 0.2.0. Headroom 62.3 / 5.0 kB.
    No code change; note anchored to preceding plan commit.
- [ ] Task: Desktop feature-journey smoke test (1280×720, production preview)
  - [ ] Piece place/move/delete + connector snapping · Drop point tool +
        landing guide · mixed-edit undo/redo chronology & redo invalidation ·
        autosave + named slot reload · goal counter/timer · orbit/chase cams ·
        About modal shows v0.2.0
- [ ] Task: Touch smoke test (~393×659 emulated)
  - [ ] Same core journeys; ≥44px targets; no page scroll or console errors
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 · Release Tag, Pipeline & Live Verification

- [ ] Task: Push release tag and monitor pipeline
  - [ ] Push `master`, then tag `v0.2.0`; watch release workflow end-to-end
  - [ ] On gate failure: fix forward on `master`, re-cut tag (never force over
        published tags)
- [ ] Task: Verify live artifacts
  - [ ] Pages site loads under repository base path; About modal reads v0.2.0
        in production
  - [ ] GitHub Release published with generated notes covering the four
        released tracks
  - [ ] GHCR images present: `0.2.0`, `latest`, commit SHA
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)