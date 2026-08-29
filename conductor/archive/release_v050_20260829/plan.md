# Implementation Plan: Cut v0.5.0 Release

Execution roadmap for the v0.5.0 release train. Ordering note: the version
bump precedes the smoke test because the production build derives the
About-modal version from `package.json` — only a post-bump build can display
`v0.5.0` in-app. As with v0.3.0/v0.4.0, the bump commit and tag are created
on `chore/release-v050` and reach `master` through a PR (current CI-gating
policy); the tag is pushed only after merge and smoke pass. pwsh note: use
`$env:CI='true'` instead of bash-style `CI=true` prefixes.

## Phase 1 · Baseline Verification [checkpoint: 5244e8d]

- [x] Task: Establish pre-release baseline on `chore/release-v050`
  - [x] Confirmed clean tree vs `origin/master` branch point `9ffa8d0` (scaffold
        commit `0386dbf`, registry mark `5244e8d`)
  - [x] Gates: 314/314 vitest (coverage 88.93% stmts / 83% branch / 93.48%
        funcs / 91.56% lines); biome clean (130 files); tsc strict clean
  - [x] Baseline bundle: TOTAL 3,507.17 kB min / 1,250.12 kB gzip vs budget
        3,600 / 1,260 — within budget (+4.82 kB min, +1.52 kB gzip vs the
        v0.4.0 baseline of 3,502.35 / 1,248.60; accounted for by the five
        merged tracks, incl. per-cup counters)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
      `[checkpoint: 5244e8d]` — automated-only phase (no app-code changes);
      all gates green, report above

## Phase 2 · Version Bump & Release Build Smoke Test [checkpoint: a948d92]

- [x] Task: Cut version bump to `0.5.0`
  - [x] `pnpm version minor --no-git-tag-version` → 0.4.0 → 0.5.0; bump commit
        `a948d92` ("0.5.0"); annotated tag `v0.5.0` created locally, kept
        unpushed until smoke passes
- [x] Task: Rebuild production bundle & recheck payload budget; `pnpm check:release v0.5.0`
  - [x] Post-bump build: TOTAL 3,507.17 kB min / 1,250.12 kB gzip — identical
        to baseline (zero drift), within 3,600 / 1,260 budget
  - [x] `pnpm check:release v0.5.0`: tag matches package.json 0.5.0
- [x] Task: Desktop smoke test (1280×720, production preview) — core suite +
        v0.5.0 regression checks (chase cam, per-cup counters); About modal shows v0.5.0
  — user-verified 2026-08-29 at http://localhost:4173/ (production preview,
        tag unpushed): all suites passed; About modal reads `v0.5.0`
- [x] Task: Touch smoke test (~393×659 emulated) — user-confirmed: same
        journeys; tray ergonomics ok; chips don't block building; no page
        scroll or console errors
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
      `[checkpoint: a948d92]` — verification report attached to `a948d92`

## Phase 3 · Release Tag, Pipeline & Live Verification

- [x] Task: Merge PR, push release tag, monitor pipeline (watch the run whose
      `headBranch` = `v0.5.0`, not the previous release run)
  - PR #14 CI green (26s); merged with a merge commit; ancestry of bump commit
        `a948d92` confirmed in master before tag push; tag `v0.5.0` pushed
        post-merge; branch cleanup (local + remote) done
  - Release run `33224477644` watched end-to-end to success: validate+build,
        GHCR publish, GitHub Release, Pages build+deploy, Coolify trigger —
        all 6 jobs success. Only annotations: pre-existing Node 20
        deprecation warnings on pinned actions — non-blocking
- [x] Task: Verify live artifacts (Pages, GitHub Release notes, GHCR tags,
      About modal version; README runbook drift check)
  - Pages live: HTTP 200 under repository base path; entry
        `index-DOKVMCKO.js` → async `app-BBe5SXa4.js` (3,474,768 bytes) with
        embedded version `0.5.0`
  - GitHub Release `v0.5.0` published 2026-08-29 00:46 UTC — draft=false,
        prerelease=false, generated notes spanning v0.4.0…v0.5.0
  - GHCR manifests present: `0.5.0` and `latest` (verified via manifest inspect)
  - README runbook re-checked — flow identical to v0.4.0 (incl. the
        headBranch watch filter note), no drift
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
      — verification evidence inline above; pipeline run `33224477644`

## Phase: Review Fixes

- [ ] Task: Apply review suggestions (appended by `conductor-review` if findings arise)
