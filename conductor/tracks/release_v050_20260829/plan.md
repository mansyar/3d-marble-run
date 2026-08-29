# Implementation Plan: Cut v0.5.0 Release

Execution roadmap for the v0.5.0 release train. Ordering note: the version
bump precedes the smoke test because the production build derives the
About-modal version from `package.json` — only a post-bump build can display
`v0.5.0` in-app. As with v0.3.0/v0.4.0, the bump commit and tag are created
on `chore/release-v050` and reach `master` through a PR (current CI-gating
policy); the tag is pushed only after merge and smoke pass. pwsh note: use
`$env:CI='true'` instead of bash-style `CI=true` prefixes.

## Phase 1 · Baseline Verification

- [ ] Task: Establish pre-release baseline on `chore/release-v050`
  - [ ] Confirm clean tree vs `origin/master` branch point `9ffa8d0`
  - [ ] Gates: `vitest run --coverage`, `biome check .`, `tsc --noEmit`
  - [ ] Baseline bundle via `pnpm build` + `pnpm check:size` vs 3,600/1,260 budget
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 · Version Bump & Release Build Smoke Test

- [ ] Task: Cut version bump to `0.5.0`
  - [ ] `pnpm version minor --no-git-tag-version` → 0.4.0 → 0.5.0; bump commit;
        annotated tag `v0.5.0` created locally, kept unpushed until smoke passes
- [ ] Task: Rebuild production bundle & recheck payload budget; `pnpm check:release v0.5.0`
- [ ] Task: Desktop smoke test (1280×720, production preview) — core suite +
        v0.5.0 regression checks (chase cam, per-cup counters); About modal shows v0.5.0
- [ ] Task: Touch smoke test (~393×659 emulated)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 · Release Tag, Pipeline & Live Verification

- [ ] Task: Merge PR, push release tag, monitor pipeline (watch the run whose
      `headBranch` = `v0.5.0`, not the previous release run)
- [ ] Task: Verify live artifacts (Pages, GitHub Release notes, GHCR tags,
      About modal version; README runbook drift check)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase: Review Fixes

- [ ] Task: Apply review suggestions (appended by `conductor-review` if findings arise)
