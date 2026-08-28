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

## Phase 2 · Version Bump & Release Build Smoke Test [checkpoint: ac4220b]

- [x] Task: Cut version bump to `0.4.0`
  - [x] `pnpm version minor --no-git-tag-version` → 0.3.0 → 0.4.0; commit
        `a19ef0d` ("0.4.0"); annotated tag `v0.4.0` created locally
        (Phase 1 checkpoint commit `1c5a15b` precedes it)
  - [x] Tag kept unpushed until smoke passes
- [x] Task: Rebuild production bundle & recheck payload budget
  - [x] `pnpm build` post-bump: TOTAL 3,502.35 kB min / 1,248.60 kB gzip —
        identical to baseline (zero drift); within 3,600 / 1,260 budget
  - [x] `pnpm check:release v0.4.0`: tag matches package.json 0.4.0
- [x] Task: Desktop smoke test (1280×720, production preview)
  - [x] v0.3.0 core suite: piece place/move/delete + snapping · splitter
        forking · bumper placement + bounce · Drop point + landing guide ·
        mixed-edit undo/redo chronology & redo invalidation · autosave +
        named slot reload · goal counter/timer · orbit/chase cams · sound
        toggle + procedural SFX · guidance pulses + route glow · PWA
        install + offline reload
  - [x] v0.4.0 regression checks: narrow-viewport tray ergonomics (momentum
        scroll, snap points, edge fades, Drop-point divider) · anti-jam
        self-rescue without goal credit · bevel + material retune on all
        piece types · 40/60 marble cap, stream self-pacing, pooled redeploy
  - [x] About modal shows `v0.4.0`
  - User-verified 2026-08-28 at http://localhost:4176/ (production preview,
    tag unpushed): all suites passed; About modal reads v0.4.0
- [x] Task: Touch smoke test (~393×659 emulated)
  - [x] Same core journeys + tray ergonomics; ≥44px targets; no page scroll
        or console errors
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 · Release Tag, Pipeline & Live Verification [checkpoint: 67b6ab2]

- [x] Task: Merge PR, push release tag, monitor pipeline
  - [x] PR #11 CI green (28s); merged with a merge commit (master
        `e807602` → `67b6ab2`; ancestry of `a19ef0d` confirmed before tag
        push); tag `v0.4.0` pushed post-merge
  - [x] Release run `33159722737` watched end-to-end to success: validate +
        build 26s · GHCR image 1m5s · GitHub Release 6s · Pages 32s+10s ·
        Coolify webhook 7s. Only annotations: pre-existing Node 20
        deprecation warnings on pinned actions — non-blocking
  - Note (runbook): filter `gh run list --workflow=release.yml` by
        `headBranch` = tag name before `gh run watch` — right after pushing
        the tag, the previous release run is otherwise the newest
        `release.yml` run and gets watched by mistake
- [x] Task: Verify live artifacts
  - [x] Pages live under repository base path: entry `index-BDBD7mzT.js` +
        app chunk `app-D5aJWH_l.js` (3,470,362 bytes) served; embedded
        ``version:`0.4.0``` (source of the About modal)
  - [x] GitHub Release `v0.4.0` published 2026-08-28 09:32 UTC — generated
        notes, draft=false, prerelease=false
  - [x] GHCR tags present: `0.4.0`, `latest`, `sha-a19ef0d` (bump commit)
  - [x] README runbook re-checked — flow unchanged from v0.3.0, no drift
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
