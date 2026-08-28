# Implementation Plan: Cut v0.4.0 Release

Execution roadmap for the v0.4.0 release train. Ordering note: the version
bump precedes the smoke test because the production build derives the
About-modal version from `package.json` — only a post-bump build can display
`v0.4.0` in-app. As with v0.3.0, the bump commit and tag are created on
`chore/release-v040` and reach `master` through a PR (current CI-gating
policy); the tag is pushed only after merge and smoke pass. pwsh note: use
`$env:CI='true'` instead of bash-style `CI=true` prefixes.

## Phase 1 · Baseline Verification

- [ ] Task: Establish pre-release baseline on `chore/release-v040`
  - [ ] Confirm clean working tree and parity with `origin/master` (branch
        point)
  - [ ] Run frozen install, `CI=true pnpm vitest run --coverage`,
        `CI=true pnpm biome check .`
  - [ ] Record baseline bundle sizes from `pnpm build` + `pnpm check:size`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 · Version Bump & Release Build Smoke Test

- [ ] Task: Cut version bump to `0.4.0`
  - [ ] Bump `package.json` to `0.4.0`
        (`pnpm version minor --no-git-tag-version` — tree carries plan edits),
        manual bump commit `0.4.0`, verify annotated tag `v0.4.0` created
        locally
  - [ ] Keep tag unpushed until smoke passes
- [ ] Task: Rebuild production bundle & recheck payload budget
  - [ ] `pnpm build`; assert ≤3,600 kB minified / ≤1,260 kB gzip; note
        deltas vs baseline
  - [ ] `pnpm check:release v0.4.0` (tag/package match)
- [ ] Task: Desktop smoke test (1280×720, production preview)
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
