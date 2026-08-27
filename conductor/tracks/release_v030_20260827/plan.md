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
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - Notes: verification had been completed at Phase 1 close (checkpoint
    1c4aaec recorded in heading) but the checkbox was missed; flipped for
    consistency with the v0.2.0 plan precedent.

## Phase 2 · Version Bump & Release Build Smoke Test [checkpoint: defbfe9]

- [x] Task: Cut version bump to `0.3.0`
  - [x] `pnpm version minor`; verify `package.json` = `0.3.0` and local tag
        `v0.3.0` created
  - [x] Keep tag unpushed until smoke passes
  - Notes: `pnpm version minor` failed with ERR_PNPM_UNCLEAN_WORKING_TREE
    (dirty plan.md + pre-existing untracked `.playwright-cli/`), so used
    `pnpm version minor --no-git-tag-version` (pkg -> 0.3.0) and cut the
    bump commit + annotated tag manually: commit adf9e13 ("0.3.0"), tag
    `v0.3.0` -> adf9e13, tag type verified annotated. Unpushed: remote tags
    are v0.1.1 / v0.2.0 only.
- [x] Task: Rebuild production bundle & recheck payload budget
  - [x] `pnpm build`; assert ≤3,500 kB minified / ≤1,250 kB gzip; note deltas
        vs baseline
  - [x] Treat headroom drift as a blocker to investigate (baseline headroom
        only ~4 kB gzip)
  - Notes: post-bump build green (tsc strict + vite); payload **3,493.13 kB
    min / 1,245.57 kB gzip** — identical to baseline (Δ 0.00/0.00); new
    asset hash `app-DLmXnOZK.js` carries baked-in 0.3.0; headroom 6.87 /
    4.43 kB → no drift, no blocker. `check:release` v0.3.0: tag matches pkg
    0.3.0 (script takes tag as argv[2] / RELEASE_TAG env).
- [x] Task: Desktop smoke test (1280×720, production preview)
  - [x] v0.2.0 suite: piece place/move/delete + snapping · Drop point +
        landing guide · mixed-edit undo/redo chronology & redo invalidation ·
        autosave + named slot reload · goal counter/timer · orbit/chase cams ·
        About modal shows v0.3.0
  - [x] New-track checks: sound toggle + SFX (drop/snap/landing/goal) with
        mute persistence · splitter feeds both branches from one Drop point ·
        bumper placement + physical bounce · unreachable pulses + drop→cup
        glow appear/hide correctly · PWA install + offline reload
  - Notes: PASSED per user confirmation ("all good") against the production
    preview; v0.3.0 shown in-app (version derived from package.json).
- [x] Task: Touch smoke test (~393×659 emulated)
  - [x] Same core journeys; ≥44px targets; no page scroll or console errors
  - Notes: PASSED per user confirmation — shared confirmation with the
    desktop run.
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - Notes: full suite green at close (`CI=true pnpm vitest run`: 31 files /
    244 tests, 3.63s). Desktop + touch smoke confirmed by user. Checkpoint
    defbfe9 = latest Phase 2 commit (bump adf9e13 + verified bundle state
    3,493.13 kB min / 1,245.57 kB gzip + task notes).

## Phase 3 · Release Tag, Pipeline & Live Verification [checkpoint: 37dfb55] [checkpoint: 37dfb55]

- [x] Task: Merge PR, push release tag, monitor pipeline (990b07b)
  - [x] Open/merge PR `chore/release-v030` → `master` with CI green; push
        `master`, then tag `v0.3.0`; watch release workflow end-to-end
  - [x] On gate failure: fix forward, re-cut tag (never force over published
        tags) (n/a — no stage failed)
  - Notes: branch pushed at 721a3fb; PR #6 merged with a merge commit
    (990b07b) — merge-commit required so tag target adf9e13 stays in master
    ancestry; annotated tag v0.3.0 pushed after merge. Release run
    33119653788 green end-to-end: quality gate (tag check, vitest 244,
    biome, tsc, build, size) → GitHub Release → Pages build+deploy → GHCR
    publish → Coolify deploy webhook OK. Non-blocking annotations:
    Node 20 deprecation warnings on some pinned actions.
- [x] Task: Verify live artifacts
  - [x] Pages site loads under repository base path; About modal reads v0.3.0
        in production
  - [x] GitHub Release published with generated notes covering the four
        released tracks
  - [x] GHCR images present: `0.3.0`, `latest`, commit SHA
  - [x] README runbook re-checked against actual flow (update only if
        drifted) (drifted → updated)
  - Notes: Pages serves under /3d-marble-run/; live app chunk
    app-DLmXnOZK.js carries version:"0.3.0" — hash identical to the Phase 2
    smoke-tested build, so the About modal reads v0.3.0. Release published
    2026-08-27T21:46:46Z; generated notes span v0.2.0...v0.3.0 covering all
    four released tracks (audio, sound polish, PWA, branching). GHCR tags
    confirmed via anonymous OCI tags API: 0.3.0, latest, sha-adf9e13.
    README "Tagged releases" still described the old
    `git push origin master --follow-tags` flow → rewrote to the PR-gated
    flow.
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - Notes: test suite green at close (`$env:CI='true'; pnpm vitest run`:
    31 files / 244 tests, 2.14s); no logic-bearing modules changed in this
    phase (publish automation + docs only). Manual verification of live
    artifacts confirmed by user (desktop live-site check incl. About modal
    v0.3.0). Checkpoint 37dfb55 = last functional commit of the phase
    (README runbook alignment).
