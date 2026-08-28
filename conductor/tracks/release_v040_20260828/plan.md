# Implementation Plan: Cut v0.4.0 Release

Execution roadmap for the v0.4.0 release train. Ordering note: the version
bump precedes the smoke test because the production build derives the
About-modal version from `package.json` — only a post-bump build can display
`v0.4.0` in-app. As with v0.3.0, the bump commit and tag are created on
`chore/release-v040` and reach `master` through a PR (current CI-gating
policy); the tag is pushed only after merge and smoke pass. pwsh note: use
`$env:CI='true'` instead of bash-style `CI=true` prefixes.

## Phase 1 · Baseline Verification [checkpoint: 29e0829]

- [x] Task: Establish pre-release baseline on `chore/release-v040`
  - [x] Confirmed clean tree vs `origin/master` branch point `e807602` (only
        this plan file dirty, as expected). Scaffold commit `4b5378b`,
        registry mark `29e0829`
  - [x] Frozen install OK (lockfile verified 2026-08-27). `vitest run
        --coverage`: 35 files / 290 tests passed (2.75s). Coverage: 88.66%
        stmts / 82.48% branch / 93.28% funcs / 91.37% lines. `biome check .`
        clean (122 files, no fixes)
  - [x] Baseline bundle: app chunk 3,470.38 kB min / 1,237.56 kB gzip;
        TOTAL 3,502.35 kB min / 1,248.60 kB gzip vs budget 3,600 / 1,260 —
        within budget (+9.2 kB min, +3.0 kB gzip vs the v0.3.0 baseline of
        3,493.13 / 1,245.57)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 · Version Bump & Release Build Smoke Test

- [x] Task: Cut version bump to `0.4.0`
  - [x] `pnpm version minor --no-git-tag-version` → 0.3.0 → 0.4.0; commit
        `a19ef0d` ("0.4.0"); annotated tag `v0.4.0` created locally
        (Phase 1 checkpoint commit `1c5a15b` precedes it)
  - [x] Tag kept unpushed until smoke passes
- [x] Task: Rebuild production bundle & recheck payload budget
  - [x] `pnpm build` post-bump: TOTAL 3,502.35 kB min / 1,248.60 kB gzip —
        identical to baseline (zero drift); within 3,600 / 1,260 budget
  - [x] `pnpm check:release v0.4.0`: tag matches package.json 0.4.0
- [~] Task: Desktop smoke test (1280×720, production preview)
  - [ ] v0.3.0 core suite: piece place/move/delete + snapping · splitter
        forking · bumper placement + bounce · Drop point + landing guide ·
        mixed-edit undo/redo chronology & redo invalidation · autosave +
        named slot reload · goal counter/timer · orbit/chase cams · sound
        toggle + procedural SFX · guidance pulses + route glow · PWA
        install + offline reload
  - [ ] v0.4.0 regression checks: narrow-viewport tray ergonomics (momentum
        scroll, snap points, edge fades, Drop-point divider) · anti-jam
        self-rescue without goal credit · bevel + material retune on all
        piece types · 40/60 marble cap, stream self-pacing, pooled redeploy
  - [ ] About modal shows `v0.4.0`
- [ ] Task: Touch smoke test (~393×659 emulated)
  - [ ] Same core journeys + tray ergonomics; ≥44px targets; no page scroll
        or console errors
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 · Release Tag, Pipeline & Live Verification

- [ ] Task: Merge PR, push release tag, monitor pipeline
  - [ ] Push `chore/release-v040`; open PR → `master` with CI green; merge
        with a merge commit, then push tag `v0.4.0`; watch the release
        workflow end-to-end
  - [ ] On gate failure: fix forward, re-cut tag (never force over published
        tags)
- [ ] Task: Verify live artifacts
  - [ ] Pages site loads under repository base path; About modal reads
        `v0.4.0` in production
  - [ ] GitHub Release published with generated notes covering the four
        released tracks
  - [ ] GHCR images present: `0.4.0`, `latest`, commit SHA
  - [ ] README runbook re-checked against actual flow (update only if
        drifted)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
