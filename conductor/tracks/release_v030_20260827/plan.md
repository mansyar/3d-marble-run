# Implementation Plan: Cut v0.3.0 Release

Execution roadmap for the v0.3.0 release train. Ordering note: the version
bump precedes the smoke test because the production build derives the
About-modal version from `package.json` — only a post-bump build can display
`v0.3.0` in-app. Unlike v0.2.0, the bump commit and tag are created on
`chore/release-v030` and reach `master` through a PR (current CI-gating
policy); the tag is pushed only after merge and smoke pass.

## Phase 1 · Baseline Verification [checkpoint: 1c4aaec]

- [x] Task: Establish pre-release baseline on `chore/release-v030` (1c4aaec)
  - [x] Confirm clean working tree and parity with `origin/master` (branch
        point)
  - [x] Run frozen install, `CI=true pnpm vitest run --coverage`,
        `CI=true pnpm biome check .`
  - [x] Record baseline bundle sizes from `pnpm build`
  - Notes: branch point 9231355 == origin/master; tree clean except this
    plan file + pre-existing untracked `.playwright-cli/`. Frozen install OK
    (lockfile up to date, supply-chain policy passed). Gates: vitest 244/244
    passed (31 files), 87.41% stmts / 90.18% lines overall; biome clean
    (108 files). Baseline bundle: **3,493.13 kB min / 1,245.57 kB gzip**
    (budget ≤3,500 / ≤1,250; headroom 6.87 kB min / 4.43 kB gzip). Note:
    pwsh needs `$env:CI='true'` instead of bash-style `CI=true` prefix.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 · Version Bump & Release Build Smoke Test

- [ ] Task: Cut version bump to `0.3.0`
  - [ ] `pnpm version minor`; verify `package.json` = `0.3.0` and local tag
        `v0.3.0` created
  - [ ] Keep tag unpushed until smoke passes
- [ ] Task: Rebuild production bundle & recheck payload budget
  - [ ] `pnpm build`; assert ≤3,500 kB minified / ≤1,250 kB gzip; note deltas
        vs baseline
  - [ ] Treat headroom drift as a blocker to investigate (baseline headroom
        only ~4 kB gzip)
- [ ] Task: Desktop smoke test (1280×720, production preview)
  - [ ] v0.2.0 suite: piece place/move/delete + snapping · Drop point +
        landing guide · mixed-edit undo/redo chronology & redo invalidation ·
        autosave + named slot reload · goal counter/timer · orbit/chase cams ·
        About modal shows v0.3.0
  - [ ] New-track checks: sound toggle + SFX (drop/snap/landing/goal) with
        mute persistence · splitter feeds both branches from one Drop point ·
        bumper placement + physical bounce · unreachable pulses + drop→cup
        glow appear/hide correctly · PWA install + offline reload
- [ ] Task: Touch smoke test (~393×659 emulated)
  - [ ] Same core journeys; ≥44px targets; no page scroll or console errors
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 · Release Tag, Pipeline & Live Verification

- [ ] Task: Merge PR, push release tag, monitor pipeline
  - [ ] Open/merge PR `chore/release-v030` → `master` with CI green; push
        `master`, then tag `v0.3.0`; watch release workflow end-to-end
  - [ ] On gate failure: fix forward, re-cut tag (never force over published
        tags)
- [ ] Task: Verify live artifacts
  - [ ] Pages site loads under repository base path; About modal reads v0.3.0
        in production
  - [ ] GitHub Release published with generated notes covering the four
        released tracks
  - [ ] GHCR images present: `0.3.0`, `latest`, commit SHA
  - [ ] README runbook re-checked against actual flow (update only if
        drifted)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
